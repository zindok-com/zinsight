'use server';

import { requireAdmin } from '@/lib/admin-auth';
import {
    PutObjectCommand,
    ListObjectsV2Command,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import {
    s3Client,
    NCP_STORAGE_BUCKET,
    getPublicFileUrl,
    extractKeyFromUrl,
} from '@/lib/storage';
import { CLEANUP_GRACE_MS, type MediaUsage } from '@/lib/storage-media';

export interface StorageBlobItem {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
}

// 공개 스토리지에 올라가므로 이미지 형식만 허용 (HTML 등 임의 파일 업로드 방지)
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function validateImageFile(file: unknown): string | null {
    if (!(file instanceof File) || file.size === 0) return '파일이 없습니다.';
    const dot = file.name.lastIndexOf('.');
    const ext = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.has(ext) || !file.type.startsWith('image/')) {
        return '이미지 파일(png, jpg, gif, webp, avif, svg)만 업로드할 수 있습니다.';
    }
    if (file.size > MAX_IMAGE_BYTES) return '이미지는 10MB 이하만 업로드할 수 있습니다.';
    return null;
}

async function listObjectsByPrefix(prefix?: string): Promise<StorageBlobItem[]> {
    const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
    const items: StorageBlobItem[] = [];
    let continuationToken: string | undefined = undefined;

    do {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
        });
        const response = await s3Client.send(command);
        for (const obj of response.Contents ?? []) {
            if (!obj.Key || obj.Key.endsWith('/')) continue;
            items.push({
                url: getPublicFileUrl(obj.Key),
                pathname: obj.Key,
                size: obj.Size ?? 0,
                uploadedAt: obj.LastModified ?? new Date(),
            });
        }
        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return items;
}

// B-1: Helper to calculate slugified pathname and prevent duplication
async function getSlugifiedPathname(file: File, folder: string): Promise<string> {
    const originalName = file.name;
    const lastDotIdx = originalName.lastIndexOf('.');
    const baseName = lastDotIdx === -1 ? originalName : originalName.slice(0, lastDotIdx);
    const extension = lastDotIdx === -1 ? '' : originalName.slice(lastDotIdx).toLowerCase();

    // Convert to English slug
    let slug = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) slug = 'image';

    let pathname = `${folder}/${slug}${extension}`;

    // Check duplicates by fetching existing objects in the folder
    try {
        const blobs = await listObjectsByPrefix(`${folder}/`);
        const existingPaths = new Set(blobs.map((b) => b.pathname));

        let counter = 2;
        while (existingPaths.has(pathname)) {
            pathname = `${folder}/${slug}-${counter}${extension}`;
            counter++;
        }
    } catch (e) {
        console.error('Failed to list storage objects for deduplication:', e);
    }

    return pathname;
}

export async function uploadThumbnail(formData: FormData) {
    await requireAdmin();
    const file = formData.get('file') as File;
    const invalid = validateImageFile(file);
    if (invalid) {
        throw new Error(invalid);
    }

    try {
        const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
        const pathname = await getSlugifiedPathname(file, 'thumbnails');
        const buffer = Buffer.from(await file.arrayBuffer());

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: pathname,
                Body: buffer,
                ContentType: file.type || 'application/octet-stream',
                ACL: 'public-read',
            })
        );

        return { url: getPublicFileUrl(pathname) };
    } catch (error: any) {
        console.error('Upload failed:', error);
        throw new Error('Failed to upload image');
    }
}

// List all blobs from NCP Object Storage
export async function listAllBlobs() {
    await requireAdmin();
    try {
        const blobs = await listObjectsByPrefix();
        return { success: true, blobs };
    } catch (error: any) {
        console.error('Failed to list blobs:', error);
        return { success: false, error: error.message || 'Failed to list storage files' };
    }
}

// Direct image upload for storage management (Server Action fallback)
export async function uploadImageDirect(formData: FormData) {
    await requireAdmin();
    const file = formData.get('file') as File;
    const invalid = validateImageFile(file);
    if (invalid) {
        return { success: false, error: invalid };
    }

    try {
        const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
        const pathname = await getSlugifiedPathname(file, 'images');
        const buffer = Buffer.from(await file.arrayBuffer());

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: pathname,
                Body: buffer,
                ContentType: file.type || 'application/octet-stream',
                ACL: 'public-read',
            })
        );
        revalidatePath('/admin/storage');
        return { success: true, url: getPublicFileUrl(pathname) };
    } catch (error: any) {
        console.error('Upload failed:', error);
        return { success: false, error: error.message || 'Failed to upload image' };
    }
}

// ─── 사용처 판정 ─────────────────────────────────────────────────────

// 본문·JSON 안의 NCP 스토리지 주소
const STORAGE_URL_PATTERN = /https?:\/\/[^\s"'`<>)\]\\]*ncloudstorage\.com\/[^\s"'`<>)\]\\]*/g;

/** 우리 버킷 주소면 오브젝트 키, 아니면 null (외부 주소·유튜브 등은 보관함과 무관) */
function storageKeyOf(url: string | null | undefined): string | null {
    if (!url || !url.includes('ncloudstorage.com')) return null;
    const cleaned = url.trim().replace(/[).,]*$/, '').split(/[?#]/)[0];
    return extractKeyFromUrl(cleaned);
}

/**
 * 버킷 파일이 어디서 쓰이는지 키 단위로 수집.
 * 휴지통 포스트도 복원될 수 있으므로 사용처로 포함한다.
 */
async function collectStorageUsage(): Promise<Record<string, MediaUsage[]>> {
    const [posts, organizations, submissions, authors] = await Promise.all([
        prisma.magazinePost.findMany({
            select: { id: true, title: true, thumbnailUrl: true, content: true, structuredData: true, deletedAt: true },
        }),
        prisma.organization.findMany({
            select: {
                id: true,
                company_name: true,
                logo_url: true,
                logo_source_url: true,
                video_url: true,
                video_poster_url: true,
                brochure_url: true,
            },
        }),
        prisma.organizationSubmission.findMany({
            select: { id: true, company_name: true, logo_url: true, logo_source_url: true },
        }),
        prisma.author.findMany({ select: { id: true, name: true, avatarUrl: true } }),
    ]);

    const usage: Record<string, MediaUsage[]> = {};
    const add = (url: string | null | undefined, item: MediaUsage) => {
        const key = storageKeyOf(url);
        if (!key) return;
        const list = (usage[key] ??= []);
        // 같은 사용처·같은 칸은 한 번만
        if (!list.some((u) => u.href === item.href && u.label === item.label && u.field === item.field)) list.push(item);
    };

    for (const post of posts) {
        const base = {
            type: post.deletedAt ? ('trash' as const) : ('post' as const),
            label: post.title,
            href: `/admin/magazine/edit/${post.id}`,
        };
        add(post.thumbnailUrl, { ...base, field: '썸네일' });
        for (const url of post.content?.match(STORAGE_URL_PATTERN) ?? []) add(url, { ...base, field: '본문' });
        if (post.structuredData) {
            for (const url of JSON.stringify(post.structuredData).match(STORAGE_URL_PATTERN) ?? []) {
                add(url, { ...base, field: '구조화 데이터' });
            }
        }
    }

    for (const org of organizations) {
        const base = { type: 'organization' as const, label: org.company_name, href: `/admin/companies/${org.id}` };
        add(org.logo_url, { ...base, field: '로고' });
        add(org.logo_source_url, { ...base, field: '로고 원본' });
        add(org.video_url, { ...base, field: '소개 영상' });
        add(org.video_poster_url, { ...base, field: '영상 포스터' });
        add(org.brochure_url, { ...base, field: '소개자료' });
    }

    for (const sub of submissions) {
        const base = { type: 'submission' as const, label: sub.company_name, href: '/admin/companies/submissions' };
        add(sub.logo_url, { ...base, field: '로고' });
        add(sub.logo_source_url, { ...base, field: '로고 원본' });
    }

    for (const author of authors) {
        add(author.avatarUrl, { type: 'author', label: author.name, field: '프로필 사진', href: '/admin/magazine/authors' });
    }

    return usage;
}

/**
 * 일괄 정리는 운영 배포에서만 허용.
 * 로컬·프리뷰는 운영과 같은 버킷을 쓰지만 DB가 달라 운영 파일을 미사용으로 오판한다.
 */
function isBulkCleanupAllowed(): boolean {
    return process.env.VERCEL_ENV === 'production';
}

/** 보관함 화면용: 파일 목록 + 키별 사용처 + 일괄 정리 가능 여부 */
export async function getStorageOverview() {
    await requireAdmin();
    try {
        const [blobs, usage] = await Promise.all([listObjectsByPrefix(), collectStorageUsage()]);
        return { success: true as const, blobs, usage, cleanupAllowed: isBulkCleanupAllowed() };
    } catch (error: any) {
        console.error('Failed to load storage overview:', error);
        return { success: false as const, error: error.message || '보관함 정보를 불러오지 못했습니다.' };
    }
}

// Delete a blob by URL (사용 중이면 force 없이는 거부)
export async function deleteBlob(url: string, options: { force?: boolean } = {}) {
    await requireAdmin();
    try {
        const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
        const key = extractKeyFromUrl(url);
        if (!key) {
            return { success: false, error: '유효하지 않은 스토리지 URL입니다.' };
        }
        if (!options.force) {
            const usages = (await collectStorageUsage())[key] ?? [];
            if (usages.length > 0) {
                return { success: false, error: '사용 중인 파일입니다.', usages };
            }
        }
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );
        revalidatePath('/admin/storage');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete blob:', error);
        return { success: false, error: error.message || 'Failed to delete file' };
    }
}

/**
 * 미사용 파일 일괄 삭제. 대상은 서버에서 다시 계산한다(화면 목록을 신뢰하지 않음).
 * 최근 업로드(유예 시간 이내)는 저장 전 초안에 쓰였을 수 있어 제외.
 */
export async function deleteUnusedBlobs() {
    await requireAdmin();
    if (!isBulkCleanupAllowed()) {
        return { success: false, error: '미사용 일괄 정리는 운영 배포 관리자에서만 실행할 수 있습니다.' };
    }
    try {
        const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
        const [blobs, usage] = await Promise.all([listObjectsByPrefix(), collectStorageUsage()]);
        const cutoff = Date.now() - CLEANUP_GRACE_MS;
        const keys = blobs
            .filter((b) => !usage[b.pathname] && new Date(b.uploadedAt).getTime() < cutoff)
            .map((b) => b.pathname);

        // DeleteObjects는 요청당 최대 1000개
        for (let i = 0; i < keys.length; i += 1000) {
            await s3Client.send(
                new DeleteObjectsCommand({
                    Bucket: bucket,
                    Delete: {
                        Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })),
                        Quiet: true,
                    },
                })
            );
        }
        revalidatePath('/admin/storage');
        return { success: true, deleted: keys.length };
    } catch (error: any) {
        console.error('Failed to delete unused blobs:', error);
        return { success: false, error: error.message || 'Failed to delete files' };
    }
}

// B-3: Rename a blob and replace all its references in the database
export async function renameBlobTransaction(oldUrl: string, oldPathname: string, newFileName: string) {
    await requireAdmin();
    if (!oldUrl || !oldPathname || !newFileName) {
        return { success: false, error: '잘못된 요청입니다.' };
    }

    try {
        const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
        // 1. Slugify new file name and check duplication
        const folder = oldPathname.includes('/')
            ? oldPathname.substring(0, oldPathname.lastIndexOf('/'))
            : 'images';
        const lastDotIdx = newFileName.lastIndexOf('.');
        const baseName = lastDotIdx === -1 ? newFileName : newFileName.slice(0, lastDotIdx);
        // 확장자는 유지 (영상·문서 형식이 바뀌면 재생·다운로드가 깨짐)
        const extension = oldPathname.includes('.')
            ? oldPathname.substring(oldPathname.lastIndexOf('.')).toLowerCase()
            : '.png';

        let slug = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!slug) slug = 'image';

        let newPathname = `${folder}/${slug}${extension}`;

        if (newPathname === oldPathname) {
            return { success: false, error: '새 파일명이 기존 파일명과 같습니다.' };
        }

        const blobs = await listObjectsByPrefix(`${folder}/`);
        const existingPaths = new Set(blobs.map((b) => b.pathname));

        let counter = 2;
        while (existingPaths.has(newPathname)) {
            newPathname = `${folder}/${slug}-${counter}${extension}`;
            counter++;
        }

        // 2. Copy object to new key in NCP S3
        const copySource = `${bucket}/${encodeURI(oldPathname)}`;
        await s3Client.send(
            new CopyObjectCommand({
                Bucket: bucket,
                CopySource: copySource,
                Key: newPathname,
                ACL: 'public-read',
            })
        );
        const newUrl = getPublicFileUrl(newPathname);

        // 3. DB의 모든 참조(포스트·조직·등록 신청·발행자)를 새 주소로 치환
        const swap = <T extends string | null>(value: T): T =>
            (value && value.includes(oldUrl) ? value.split(oldUrl).join(newUrl) : value) as T;
        const touches = (...values: (string | null)[]) => values.some((v) => v?.includes(oldUrl));

        const [posts, organizations, submissions, authors] = await Promise.all([
            prisma.magazinePost.findMany({
                select: { id: true, thumbnailUrl: true, content: true, structuredData: true },
            }),
            prisma.organization.findMany({
                where: {
                    OR: [
                        { logo_url: { contains: oldUrl } },
                        { logo_source_url: { contains: oldUrl } },
                        { video_url: { contains: oldUrl } },
                        { video_poster_url: { contains: oldUrl } },
                        { brochure_url: { contains: oldUrl } },
                    ],
                },
                select: { id: true, logo_url: true, logo_source_url: true, video_url: true, video_poster_url: true, brochure_url: true },
            }),
            prisma.organizationSubmission.findMany({
                where: { OR: [{ logo_url: { contains: oldUrl } }, { logo_source_url: { contains: oldUrl } }] },
                select: { id: true, logo_url: true, logo_source_url: true },
            }),
            prisma.author.findMany({
                where: { avatarUrl: { contains: oldUrl } },
                select: { id: true, avatarUrl: true },
            }),
        ]);

        const postsToUpdate = posts.filter((p) =>
            touches(p.thumbnailUrl, p.content, p.structuredData ? JSON.stringify(p.structuredData) : null)
        );

        await prisma.$transaction([
            ...postsToUpdate.map((post) =>
                prisma.magazinePost.update({
                    where: { id: post.id },
                    data: {
                        thumbnailUrl: swap(post.thumbnailUrl),
                        content: swap(post.content),
                        ...(post.structuredData
                            ? { structuredData: JSON.parse(swap(JSON.stringify(post.structuredData))) }
                            : {}),
                    },
                })
            ),
            ...organizations.map((org) =>
                prisma.organization.update({
                    where: { id: org.id },
                    data: {
                        logo_url: swap(org.logo_url),
                        logo_source_url: swap(org.logo_source_url),
                        video_url: swap(org.video_url),
                        video_poster_url: swap(org.video_poster_url),
                        brochure_url: swap(org.brochure_url),
                    },
                })
            ),
            ...submissions.map((sub) =>
                prisma.organizationSubmission.update({
                    where: { id: sub.id },
                    data: { logo_url: swap(sub.logo_url), logo_source_url: swap(sub.logo_source_url) },
                })
            ),
            ...authors.map((author) =>
                prisma.author.update({ where: { id: author.id }, data: { avatarUrl: swap(author.avatarUrl) } })
            ),
        ]);

        // 4. 참조를 모두 바꾼 뒤 원본 삭제 (DB 갱신이 실패해도 기존 주소가 살아 있도록 순서 변경)
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: oldPathname,
            })
        );

        revalidatePath('/admin/storage');
        revalidatePath('/admin/magazine');
        // 공개 매거진·프로필 캐시에 남은 옛 주소 제거
        revalidatePath('/', 'layout');

        return {
            success: true,
            newUrl,
            affectedPosts: postsToUpdate.length,
            affectedOthers: organizations.length + submissions.length + authors.length,
        };
    } catch (error: any) {
        console.error('Failed to rename blob:', error);
        return { success: false, error: error.message || '파일 이름 변경 중 오류가 발생했습니다.' };
    }
}

