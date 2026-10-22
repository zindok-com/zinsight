'use server';

import crypto from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, NCP_STORAGE_BUCKET, NCP_STORAGE_ENDPOINT } from '@/lib/storage';

export type UploadFolder = 'thumbnails' | 'videos' | 'images';

export interface MediaUploadTicket {
    uploadUrl: string;
    fileUrl: string;
    key: string;
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

    const rawExt = filename.includes('.') ? filename.split('.').pop() || '' : '';
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
    const randomHex = crypto.randomBytes(6).toString('hex');
    const key = `${folder}/${Date.now()}_${randomHex}.${ext}`;

    const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
    const endpoint = (process.env.NCP_STORAGE_ENDPOINT || NCP_STORAGE_ENDPOINT).replace(/\/+$/, '');

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
