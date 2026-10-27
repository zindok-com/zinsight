'use server';

import { PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, NCP_STORAGE_BUCKET, NCP_STORAGE_ENDPOINT } from '@/lib/storage';
import { isAdminRequest } from '@/lib/admin-auth';
import { getInviteByToken } from '@/actions/company-actions';

export type UploadFolder = 'thumbnails' | 'videos' | 'images' | 'logos' | 'attachments';

export interface MediaUploadTicket {
    uploadUrl: string;
    fileUrl: string;
    key: string;
}

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

/**
 * NCP Object Storage (S3 호환) 직송 업로드를 위한 Presigned PUT URL 발급 Server Action
 */
export async function getMediaUploadUrl(
    filename: string,
    contentType: string,
    folder: UploadFolder = 'thumbnails',
    inviteToken?: string
): Promise<MediaUploadTicket> {
    // 발급 권한: 관리자, 또는 유효한 초대 토큰을 가진 신청자(로고 폴더 한정)
    if (!(await isAdminRequest())) {
        const invite = inviteToken && INVITE_FOLDERS.includes(folder) ? await getInviteByToken(inviteToken) : null;
        if (!invite?.valid) {
            throw new Error('업로드 권한이 없습니다.');
        }
    }

    const rule = UPLOAD_RULES[folder];
    if (!rule) {
        throw new Error('허용되지 않은 업로드 위치입니다.');
    }
    const ext = String(filename || '').split('.').pop()?.toLowerCase() ?? '';
    const type = String(contentType || '').toLowerCase();
    if (!rule.exts.includes(ext) || !rule.types.includes(type)) {
        throw new Error(`허용되지 않은 파일 형식입니다. (허용: ${rule.exts.join(', ')})`);
    }
    if (!process.env.NCP_STORAGE_ACCESS_KEY || !process.env.NCP_STORAGE_SECRET_KEY) {
        throw new Error('NCP 스토리지 인증 환경변수(NCP_STORAGE_ACCESS_KEY, NCP_STORAGE_SECRET_KEY)가 설정되지 않았습니다.');
    }

    const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
    const endpoint = (process.env.NCP_STORAGE_ENDPOINT || NCP_STORAGE_ENDPOINT).replace(/\/+$/, '');
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
