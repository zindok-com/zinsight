'use server';

import crypto from 'crypto';
import { PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, NCP_STORAGE_BUCKET, NCP_STORAGE_ENDPOINT } from '@/lib/storage';
import { isAdminRequest } from '@/lib/admin-auth';
import { getInviteByToken } from '@/actions/company-actions';
import { UPLOAD_SIZE_LIMIT, formatBytes } from '@/lib/storage-media';
import { rateLimitByIp, HOUR } from '@/lib/rate-limit';
import { toWebp } from '@/lib/image-processing';
import {
    IMAGE_VARIANT_WIDTH,
    PROCESSABLE_IMAGE_EXTS,
    UPLOAD_TEMP_PREFIX,
    hasImageVariant,
    variantKeyOf,
} from '@/lib/image-variants';

export type UploadFolder = 'thumbnails' | 'videos' | 'images' | 'logos' | 'attachments';

export interface MediaUploadTicket {
    uploadUrl: string;
    /** 최종 공개 주소. processKey가 있으면 finalizeMediaUpload 후에 정해지므로 빈 문자열 */
    fileUrl: string;
    key: string;
    /** 변환 대상 이미지: 업로드 후 finalizeMediaUpload(processKey, ...)를 호출해야 최종 주소가 생김 */
    processKey?: string;
}

// 업로드 시 WebP로 변환하는 폴더 (attachments·videos는 원본 그대로)
const PROCESS_FOLDERS: UploadFolder[] = ['images', 'thumbnails', 'logos'];
const TEMP_KEY_PATTERN = /^_incoming\/[a-f0-9]{24}\.(png|jpg|jpeg|webp|avif)$/;

// 폴더별 허용 확장자·Content-Type. 버킷이 public-read이므로 HTML 등 브라우저에서 실행되는 형식은 받지 않음.
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg'];
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'];
const UPLOAD_RULES: Record<UploadFolder, { exts: string[]; types: string[] }> = {
    thumbnails: { exts: IMAGE_EXTS, types: IMAGE_TYPES },
    images: { exts: IMAGE_EXTS, types: IMAGE_TYPES },
    logos: { exts: ['png', 'jpg', 'jpeg', 'svg', 'webp'], types: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'] },
    attachments: {
        exts: ['ai', 'eps', 'pdf', 'svg'],
        types: ['application/postscript', 'application/pdf', 'image/svg+xml', 'application/illustrator', 'application/x-illustrator', 'application/octet-stream'],
    },
    videos: { exts: ['mp4', 'webm', 'mov', 'm4v', 'ogg'], types: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/ogg'] },
};

// 초대 링크로 들어온 외부 신청자에게 허용하는 폴더 (공개 기관 등록 폼의 로고 업로드)
const INVITE_FOLDERS: UploadFolder[] = ['logos', 'attachments'];

/**
 * 원본 파일명을 기반으로 영문 슬러그 경로를 생성하고,
 * 버킷 내 동일 파일명이 존재할 경우 -2, -3 접미사를 붙여 중복을 방지합니다.
 */
async function buildUniqueObjectKey(
    bucket: string,
    filename: string,
    folder: UploadFolder
): Promise<string> {
    const lastDotIdx = filename.lastIndexOf('.');
    const baseName = lastDotIdx === -1 ? filename : filename.slice(0, lastDotIdx);
    const rawExt = lastDotIdx === -1 ? '' : filename.slice(lastDotIdx + 1);
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';

    let slug = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) slug = 'image';

    let key = `${folder}/${slug}.${ext}`;

    try {
        const existingKeys = new Set<string>();
        let continuationToken: string | undefined = undefined;

        do {
            const command: ListObjectsV2Command = new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: `${folder}/${slug}`,
                ContinuationToken: continuationToken,
            });
            const response = await s3Client.send(command);
            for (const obj of response.Contents ?? []) {
                if (obj.Key) existingKeys.add(obj.Key);
            }
            continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (continuationToken);

        let counter = 2;
        while (existingKeys.has(key)) {
            key = `${folder}/${slug}-${counter}.${ext}`;
            counter++;
        }
    } catch (e) {
        console.error('Failed to check existing objects for deduplication:', e);
    }

    return key;
}

/** 발급 권한: 관리자, 또는 유효한 초대 토큰을 가진 신청자(로고·첨부 폴더 한정) */
async function assertUploadAllowed(folder: UploadFolder, inviteToken?: string) {
    if (await isAdminRequest()) return;
    // 초대 신청자 업로드 남용 방지: IP당 1시간 30회
    if (!(await rateLimitByIp('invite-upload', 30, HOUR))) {
        throw new Error('업로드 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
    }
    const invite = inviteToken && INVITE_FOLDERS.includes(folder) ? await getInviteByToken(inviteToken) : null;
    if (!invite?.valid) {
        throw new Error('업로드 권한이 없습니다.');
    }
}

function storageTarget() {
    return {
        bucket: process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET,
        endpoint: (process.env.NCP_STORAGE_ENDPOINT || NCP_STORAGE_ENDPOINT).replace(/\/+$/, ''),
    };
}

/**
 * NCP Object Storage (S3 호환) 직송 업로드를 위한 Presigned PUT URL 발급 Server Action
 */
export async function getMediaUploadUrl(
    filename: string,
    contentType: string,
    folder: UploadFolder = 'thumbnails',
    inviteToken?: string,
    fileSize?: number
): Promise<MediaUploadTicket> {
    await assertUploadAllowed(folder, inviteToken);

    const rule = UPLOAD_RULES[folder];
    if (!rule) {
        throw new Error('허용되지 않은 업로드 위치입니다.');
    }
    const ext = String(filename || '').split('.').pop()?.toLowerCase() ?? '';
    const type = String(contentType || '').toLowerCase();
    if (!rule.exts.includes(ext) || !rule.types.includes(type)) {
        throw new Error(`허용되지 않은 파일 형식입니다. (허용: ${rule.exts.join(', ')})`);
    }
    // 브라우저가 알려준 파일 크기로 폴더별 상한 확인
    if (fileSize !== undefined && (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > UPLOAD_SIZE_LIMIT[folder])) {
        throw new Error(`파일이 너무 큽니다. (최대 ${formatBytes(UPLOAD_SIZE_LIMIT[folder])})`);
    }
    if (!process.env.NCP_STORAGE_ACCESS_KEY || !process.env.NCP_STORAGE_SECRET_KEY) {
        throw new Error('NCP 스토리지 인증 환경변수(NCP_STORAGE_ACCESS_KEY, NCP_STORAGE_SECRET_KEY)가 설정되지 않았습니다.');
    }

    const { bucket, endpoint } = storageTarget();

    // 래스터 이미지는 임시 경로로 받은 뒤 finalizeMediaUpload에서 WebP로 변환해 최종 경로에 저장
    // (파일은 브라우저 → 스토리지로 직접 올라가고, 서버 액션에는 키만 오가므로 Vercel 4.5MB 본문 한도와 무관)
    if (PROCESS_FOLDERS.includes(folder) && PROCESSABLE_IMAGE_EXTS.includes(ext)) {
        const processKey = `${UPLOAD_TEMP_PREFIX}${crypto.randomBytes(12).toString('hex')}.${ext}`;
        const command = new PutObjectCommand({ Bucket: bucket, Key: processKey, ContentType: type, ACL: 'public-read' });
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
        return { uploadUrl, fileUrl: '', key: processKey, processKey };
    }

    const key = await buildUniqueObjectKey(bucket, filename, folder);

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: type,
        ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    const fileUrl = `${endpoint}/${bucket}/${key}`;

    return {
        uploadUrl,
        fileUrl,
        key,
    };
}

/**
 * 임시 경로에 올라온 이미지를 sharp로 변환해 최종 경로에 저장하고 임시 파일을 지운다.
 * - 가로 최대 1600px WebP(품질 80), EXIF 회전 반영·메타데이터 제거
 * - images/·thumbnails/는 640px 버전을 _640/ 아래에 함께 저장
 * - 파일명 규칙은 기존과 같음(영문 슬러그, 중복 시 -2, -3), 확장자만 .webp
 */
export async function finalizeMediaUpload(
    processKey: string,
    filename: string,
    folder: UploadFolder,
    inviteToken?: string
): Promise<{ fileUrl: string; key: string }> {
    if (!PROCESS_FOLDERS.includes(folder) || !TEMP_KEY_PATTERN.test(String(processKey || ''))) {
        throw new Error('잘못된 업로드 요청입니다.');
    }
    await assertUploadAllowed(folder, inviteToken);

    const { bucket, endpoint } = storageTarget();
    try {
        const original = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: processKey }));
        // presigned PUT은 크기를 강제하지 못하므로 여기서 다시 확인
        if ((original.ContentLength ?? 0) > UPLOAD_SIZE_LIMIT[folder]) {
            throw new Error(`파일이 너무 큽니다. (최대 ${formatBytes(UPLOAD_SIZE_LIMIT[folder])})`);
        }
        const input = Buffer.from(await original.Body!.transformToByteArray());

        let output: Buffer;
        try {
            output = await toWebp(input);
        } catch {
            throw new Error('이미지를 변환할 수 없습니다. 손상되지 않은 PNG·JPG·WebP 파일인지 확인해 주세요.');
        }

        const dot = String(filename || '').lastIndexOf('.');
        const baseName = dot === -1 ? String(filename || '') : String(filename).slice(0, dot);
        const key = await buildUniqueObjectKey(bucket, `${baseName}.webp`, folder);

        await s3Client.send(
            new PutObjectCommand({ Bucket: bucket, Key: key, Body: output, ContentType: 'image/webp', ACL: 'public-read' })
        );
        if (hasImageVariant(key)) {
            const variant = await toWebp(input, IMAGE_VARIANT_WIDTH);
            await s3Client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: variantKeyOf(key),
                    Body: variant,
                    ContentType: 'image/webp',
                    ACL: 'public-read',
                })
            );
        }

        return { fileUrl: `${endpoint}/${bucket}/${key}`, key };
    } finally {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: processKey })).catch(() => {});
    }
}
