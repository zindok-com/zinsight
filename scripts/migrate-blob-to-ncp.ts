import 'dotenv/config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../src/lib/db';
import {
    s3Client,
    NCP_STORAGE_BUCKET,
    NCP_STORAGE_ENDPOINT,
} from '../src/lib/storage';

const BUCKET = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
const ENDPOINT = (process.env.NCP_STORAGE_ENDPOINT || NCP_STORAGE_ENDPOINT).replace(/\/+$/, '');

function sanitizeFilename(urlStr: string): string {
    try {
        const parsed = new URL(urlStr);
        const rawName = decodeURIComponent(parsed.pathname.split('/').pop() || 'image.png');
        const cleaned = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
        return cleaned || 'image.png';
    } catch {
        return 'image.png';
    }
}

async function downloadAndUploadToNcp(sourceUrl: string, targetKey: string): Promise<string> {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
        throw new Error(`기존 파일 다운로드 실패 (HTTP ${response.status}): ${sourceUrl}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3Client.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: targetKey,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read',
        })
    );

    return `${ENDPOINT}/${BUCKET}/${targetKey}`;
}

async function migrateBlobToNcp() {
    console.log('====================================================');
    console.log('[Migration] Vercel Blob -> NCP Object Storage 마이그레이션 시작');
    console.log(`[Config] Endpoint: ${ENDPOINT}`);
    console.log(`[Config] Bucket  : ${BUCKET}`);
    console.log('====================================================\n');

    if (!process.env.NCP_STORAGE_ACCESS_KEY || !process.env.NCP_STORAGE_SECRET_KEY) {
        throw new Error(
            'NCP_STORAGE_ACCESS_KEY 또는 NCP_STORAGE_SECRET_KEY 환경변수가 설정되지 않았습니다. .env 또는 .env.local 파일을 확인해 주세요.'
        );
    }

    // 1. 썸네일 URL에 vercel-storage.com이 포함된 모든 글(MagazinePost) 조회
    const postsWithBlobThumbnail = await prisma.magazinePost.findMany({
        where: {
            thumbnailUrl: {
                contains: 'vercel-storage.com',
            },
        },
        select: {
            id: true,
            title: true,
            thumbnailUrl: true,
        },
    });

    console.log(`[1/3] 썸네일 마이그레이션 대상 포스트: 총 ${postsWithBlobThumbnail.length}건`);

    let thumbSuccess = 0;
    let thumbFail = 0;

    for (const post of postsWithBlobThumbnail) {
        if (!post.thumbnailUrl) continue;

        const filename = sanitizeFilename(post.thumbnailUrl);
        const key = `thumbnails/migrated_${post.id}_${filename}`;

        try {
            console.log(`  -> [Post #${post.id}] "${post.title}" 썸네일 다운로드 및 NCP 업로드 중...`);
            const newUrl = await downloadAndUploadToNcp(post.thumbnailUrl, key);

            await prisma.magazinePost.update({
                where: { id: post.id },
                data: { thumbnailUrl: newUrl },
            });

            console.log(`     [완료] ${post.thumbnailUrl} -> ${newUrl}`);
            thumbSuccess++;
        } catch (error: any) {
            console.error(`     [실패] [Post #${post.id}] 오류:`, error.message || error);
            thumbFail++;
        }
    }

    // 2. 본문(content) 내부에 포함된 vercel-storage.com 이미지 URL 마이그레이션
    const postsWithBlobContent = await prisma.magazinePost.findMany({
        where: {
            content: {
                contains: 'vercel-storage.com',
            },
        },
        select: {
            id: true,
            title: true,
            content: true,
        },
    });

    console.log(`\n[2/3] 본문(content) 인라인 이미지 마이그레이션 대상 포스트: 총 ${postsWithBlobContent.length}건`);

    let contentPostSuccess = 0;
    let contentPostFail = 0;

    for (const post of postsWithBlobContent) {
        if (!post.content) continue;

        const matches = post.content.match(
            /https?:\/\/[^\s"'`<>)]+\.public\.blob\.vercel-storage\.com[^\s"'`<>)]*/g
        );
        if (!matches || matches.length === 0) continue;

        const uniqueUrls = Array.from(new Set(matches.map((u) => u.replace(/[).,]*$/, ''))));
        let updatedContent = post.content;
        let replacedCount = 0;

        try {
            for (let i = 0; i < uniqueUrls.length; i++) {
                const oldUrl = uniqueUrls[i];
                const filename = sanitizeFilename(oldUrl);
                const key = `images/migrated_${post.id}_${i + 1}_${filename}`;

                console.log(`  -> [Post #${post.id}] 본문 이미지(${i + 1}/${uniqueUrls.length}) NCP 업로드 중...`);
                const newUrl = await downloadAndUploadToNcp(oldUrl, key);
                updatedContent = updatedContent.split(oldUrl).join(newUrl);
                replacedCount++;
                console.log(`     [완료] ${oldUrl} -> ${newUrl}`);
            }

            if (replacedCount > 0) {
                await prisma.magazinePost.update({
                    where: { id: post.id },
                    data: { content: updatedContent },
                });
                contentPostSuccess++;
            }
        } catch (error: any) {
            console.error(`     [실패] [Post #${post.id}] 본문 이미지 마이그레이션 오류:`, error.message || error);
            contentPostFail++;
        }
    }

    // 3. 작성자(Author) 프로필 이미지 마이그레이션
    const authorsWithBlobAvatar = await prisma.author.findMany({
        where: {
            avatarUrl: {
                contains: 'vercel-storage.com',
            },
        },
        select: {
            id: true,
            name: true,
            avatarUrl: true,
        },
    });

    console.log(`\n[3/3] 작성자(Author) 아바타 마이그레이션 대상: 총 ${authorsWithBlobAvatar.length}건`);

    let authorSuccess = 0;
    let authorFail = 0;

    for (const author of authorsWithBlobAvatar) {
        if (!author.avatarUrl) continue;

        const filename = sanitizeFilename(author.avatarUrl);
        const key = `thumbnails/migrated_author_${author.id}_${filename}`;

        try {
            console.log(`  -> [Author #${author.id}] "${author.name}" 아바타 NCP 업로드 중...`);
            const newUrl = await downloadAndUploadToNcp(author.avatarUrl, key);

            await prisma.author.update({
                where: { id: author.id },
                data: { avatarUrl: newUrl },
            });

            console.log(`     [완료] ${author.avatarUrl} -> ${newUrl}`);
            authorSuccess++;
        } catch (error: any) {
            console.error(`     [실패] [Author #${author.id}] 오류:`, error.message || error);
            authorFail++;
        }
    }

    console.log('\n====================================================');
    console.log('[Migration Summary] 마이그레이션 결과 요약');
    console.log(`  - 포스트 썸네일 : 성공 ${thumbSuccess}건 / 실패 ${thumbFail}건`);
    console.log(`  - 포스트 본문   : 성공 ${contentPostSuccess}건 / 실패 ${contentPostFail}건`);
    console.log(`  - 작성자 아바타 : 성공 ${authorSuccess}건 / 실패 ${authorFail}건`);
    console.log('====================================================');
}

migrateBlobToNcp()
    .catch((err) => {
        console.error('[Migration Fatal Error]', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
