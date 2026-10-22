import { S3Client } from '@aws-sdk/client-s3';

export const NCP_STORAGE_ENDPOINT = (
    process.env.NCP_STORAGE_ENDPOINT || 'https://kr.object.ncloudstorage.com'
).replace(/\/+$/, '');

export const NCP_STORAGE_BUCKET = process.env.NCP_STORAGE_BUCKET || 'zinsight-media';

export const NCP_STORAGE_REGION = process.env.NCP_STORAGE_REGION || 'kr-standard';

const globalForS3 = globalThis as unknown as {
    s3Client: S3Client | undefined;
};

export const s3Client =
    globalForS3.s3Client ??
    new S3Client({
        region: NCP_STORAGE_REGION,
        endpoint: NCP_STORAGE_ENDPOINT,
        forcePathStyle: true,
        credentials: {
            accessKeyId: process.env.NCP_STORAGE_ACCESS_KEY || '',
            secretAccessKey: process.env.NCP_STORAGE_SECRET_KEY || '',
        },
    });

if (process.env.NODE_ENV !== 'production') {
    globalForS3.s3Client = s3Client;
}

/**
 * S3 Object Key로부터 공개 접근 URL을 생성합니다.
 */
export function getPublicFileUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return `${NCP_STORAGE_ENDPOINT}/${NCP_STORAGE_BUCKET}/${cleanKey}`;
}

/**
 * 공개 URL로부터 S3 Object Key를 추출합니다.
 */
export function extractKeyFromUrl(fileUrl: string): string | null {
    const prefix = `${NCP_STORAGE_ENDPOINT}/${NCP_STORAGE_BUCKET}/`;
    if (fileUrl.startsWith(prefix)) {
        return decodeURIComponent(fileUrl.slice(prefix.length));
    }
    try {
        const parsed = new URL(fileUrl);
        const bucketPrefix = `/${NCP_STORAGE_BUCKET}/`;
        if (parsed.pathname.startsWith(bucketPrefix)) {
            return decodeURIComponent(parsed.pathname.slice(bucketPrefix.length));
        }
        return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    } catch {
        return null;
    }
}
