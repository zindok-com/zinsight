/**
 * 보관함 기존 이미지 일괄 재압축 (일회성)
 *
 * - 같은 키·같은 형식으로 덮어씀 → URL이 바뀌지 않아 DB 수정 불필요, og:image 주소도 그대로
 * - 가로 최대 1600px(확대 없음), EXIF 회전 반영 후 메타데이터 제거
 *   PNG: 팔레트 압축(quality 80) / JPG: mozjpeg 품질 80 / WebP: 품질 80
 * - 5% 이상 줄어들 때만 교체, 덮어쓰기 전에 원본을 _backup/<날짜>/<원래 키>로 복사
 * - images/·thumbnails/는 목록 카드용 640px WebP를 _640/ 아래에 생성
 *
 * 사용법:
 *   npx tsx scripts/recompress-images.ts            # dry-run: 아무것도 쓰지 않고 전후 용량만 계산
 *   npx tsx scripts/recompress-images.ts --apply    # 실제 백업·덮어쓰기·640px 생성
 */
import 'dotenv/config';
import sharp from 'sharp';
import {
    ListObjectsV2Command,
    GetObjectCommand,
    PutObjectCommand,
    CopyObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { s3Client, NCP_STORAGE_BUCKET } from '../src/lib/storage';
import {
    IMAGE_MAX_WIDTH,
    IMAGE_VARIANT_WIDTH,
    IMAGE_WEBP_QUALITY,
    IMAGE_BACKUP_PREFIX,
    hasImageVariant,
    isInternalStorageKey,
    variantKeyOf,
} from '../src/lib/image-variants';

const APPLY = process.argv.includes('--apply');
const BUCKET = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
const FOLDERS = ['images/', 'thumbnails/', 'logos/'];
const MIN_SAVING = 0.05;
const BACKUP_ROOT = `${IMAGE_BACKUP_PREFIX}${new Date().toISOString().slice(0, 10)}/`;

const CONTENT_TYPE: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

async function listKeys(prefix: string) {
    const out: { key: string; size: number }[] = [];
    let token: string | undefined;
    do {
        const res: any = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }));
        for (const o of res.Contents ?? []) if (o.Key && !o.Key.endsWith('/')) out.push({ key: o.Key, size: o.Size ?? 0 });
        token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return out;
}

async function download(key: string): Promise<Buffer> {
    const res: any = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return Buffer.from(await res.Body.transformToByteArray());
}

async function exists(key: string): Promise<boolean> {
    return s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })).then(() => true, () => false);
}

function recompress(input: Buffer, ext: string): Promise<Buffer> {
    const base = sharp(input).rotate().resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true });
    if (ext === 'png') return base.png({ palette: true, quality: 80, compressionLevel: 9, effort: 10 }).toBuffer();
    if (ext === 'webp') return base.webp({ quality: IMAGE_WEBP_QUALITY }).toBuffer();
    return base.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(2);

(async () => {
    console.log(`${APPLY ? '[APPLY]' : '[DRY-RUN]'} bucket=${BUCKET} backup=${BACKUP_ROOT}\n`);
    let before = 0, after = 0, replaced = 0, kept = 0, variants = 0;
    const rows: string[] = [];

    for (const folder of FOLDERS) {
        for (const { key, size } of await listKeys(folder)) {
            if (isInternalStorageKey(key)) continue;
            const ext = key.split('.').pop()?.toLowerCase() ?? '';
            if (!CONTENT_TYPE[ext]) continue; // gif·svg·기타 형식은 건너뜀

            const input = await download(key);
            const meta = await sharp(input).metadata();
            const output = await recompress(input, ext);
            const worth = output.length < size * (1 - MIN_SAVING);
            const finalSize = worth ? output.length : size;
            before += size;
            after += finalSize;
            worth ? replaced++ : kept++;
            rows.push(
                `${worth ? '교체' : '유지'}  ${mb(size).padStart(6)}MB → ${mb(finalSize).padStart(6)}MB  ${String(meta.width).padStart(4)}px  ${key}`
            );

            if (APPLY && worth) {
                // 원본 백업 후 같은 키에 덮어쓰기
                await s3Client.send(
                    new CopyObjectCommand({ Bucket: BUCKET, CopySource: `${BUCKET}/${encodeURI(key)}`, Key: `${BACKUP_ROOT}${key}` })
                );
                await s3Client.send(
                    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: output, ContentType: CONTENT_TYPE[ext], ACL: 'public-read' })
                );
            }
            if (hasImageVariant(key) && !(await exists(variantKeyOf(key)))) {
                variants++;
                if (APPLY) {
                    const variant = await sharp(input)
                        .rotate()
                        .resize({ width: IMAGE_VARIANT_WIDTH, withoutEnlargement: true })
                        .webp({ quality: IMAGE_WEBP_QUALITY })
                        .toBuffer();
                    await s3Client.send(
                        new PutObjectCommand({ Bucket: BUCKET, Key: variantKeyOf(key), Body: variant, ContentType: 'image/webp', ACL: 'public-read' })
                    );
                }
            }
        }
    }

    console.log(rows.join('\n'));
    console.log(`\n대상 ${replaced + kept}개 (교체 ${replaced}, 유지 ${kept}), 640px 생성 ${variants}개`);
    console.log(`합계 ${mb(before)}MB → ${mb(after)}MB (${before ? Math.round((1 - after / before) * 100) : 0}% 감소)`);
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
