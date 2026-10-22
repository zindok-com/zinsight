import crypto from 'crypto';
import { S3Client } from '@aws-sdk/client-s3';

export const NCP_STORAGE_ENDPOINT = (
    process.env.NCP_STORAGE_ENDPOINT || 'https://kr.object.ncloudstorage.com'
).replace(/\/+$/, '');

export const NCP_STORAGE_BUCKET = process.env.NCP_STORAGE_BUCKET || 'zinsight-media';

export const NCP_STORAGE_REGION = process.env.NCP_STORAGE_REGION || 'kr-standard';

function createNcpS3Client(): S3Client {
    const client = new S3Client({
        region: NCP_STORAGE_REGION,
        endpoint: NCP_STORAGE_ENDPOINT,
        forcePathStyle: true,
        // AWS SDK v3 최신 버전의 기본 CRC32 체크섬 강제 삽입을 비활성화하여
        // NCP Object Storage Presigned URL 및 XML API 호환성 보장
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
        credentials: async () => ({
            accessKeyId: process.env.NCP_STORAGE_ACCESS_KEY || '',
            secretAccessKey: process.env.NCP_STORAGE_SECRET_KEY || '',
        }),
    });

    // NCP Object Storage는 PutBucketCors, DeleteObjects 등의 요청에 Content-MD5 헤더를 요구함
    client.middlewareStack.add(
        (next, context) => async (args: any) => {
            const request = args.request;
            if (
                request &&
                request.body &&
                (context.commandName === 'PutBucketCorsCommand' ||
                    context.commandName === 'DeleteObjectsCommand')
            ) {
                const bodyBuffer =
                    typeof request.body === 'string'
                        ? Buffer.from(request.body, 'utf-8')
                        : Buffer.isBuffer(request.body)
                          ? request.body
                          : null;

                if (bodyBuffer) {
                    const md5 = crypto.createHash('md5').update(bodyBuffer).digest('base64');
                    request.headers = {
                        ...request.headers,
                        'Content-MD5': md5,
                    };
                    // NCP는 x-amz-sdk-checksum-algorithm 헤더 대신 Content-MD5를 사용
                    delete request.headers['x-amz-sdk-checksum-algorithm'];
                    for (const key of Object.keys(request.headers)) {
                        if (key.toLowerCase().startsWith('x-amz-checksum-')) {
                            delete request.headers[key];
                        }
                    }
                }
            }
            return next(args);
        },
        {
            step: 'build',
            name: 'ncpContentMd5Middleware',
            priority: 'low',
        }
    );

    return client;
}

const globalForS3 = globalThis as unknown as {
    s3Client: S3Client | undefined;
};

export const s3Client = globalForS3.s3Client ?? createNcpS3Client();

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
