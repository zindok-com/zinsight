'use server';

import { PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, NCP_STORAGE_BUCKET, NCP_STORAGE_ENDPOINT } from '@/lib/storage';

export type UploadFolder = 'thumbnails' | 'videos' | 'images' | 'logos' | 'attachments';

export interface MediaUploadTicket {
    uploadUrl: string;
    fileUrl: string;
    key: string;
}

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
    folder: UploadFolder = 'thumbnails'
): Promise<MediaUploadTicket> {
    if (!process.env.NCP_STORAGE_ACCESS_KEY || !process.env.NCP_STORAGE_SECRET_KEY) {
        throw new Error('NCP 스토리지 인증 환경변수(NCP_STORAGE_ACCESS_KEY, NCP_STORAGE_SECRET_KEY)가 설정되지 않았습니다.');
    }

    const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
    const endpoint = (process.env.NCP_STORAGE_ENDPOINT || NCP_STORAGE_ENDPOINT).replace(/\/+$/, '');
    const key = await buildUniqueObjectKey(bucket, filename, folder);

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
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
