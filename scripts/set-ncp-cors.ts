import 'dotenv/config';
import { PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import { s3Client, NCP_STORAGE_BUCKET } from '../src/lib/storage';

const BUCKET = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;

async function configureBucketCors() {
    if (!process.env.NCP_STORAGE_ACCESS_KEY || !process.env.NCP_STORAGE_SECRET_KEY) {
        throw new Error(
            'NCP_STORAGE_ACCESS_KEY 또는 NCP_STORAGE_SECRET_KEY 환경변수가 설정되지 않았습니다.'
        );
    }

    console.log(`[CORS] "${BUCKET}" 버킷에 CORS 규칙을 적용합니다...`);

    const corsCommand = new PutBucketCorsCommand({
        Bucket: BUCKET,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedOrigins: [
                        'https://zinsight.co.kr',
                        'https://www.zinsight.co.kr',
                        'https://*.vercel.app',
                        'http://localhost:3000',
                    ],
                    AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                    AllowedHeaders: ['*'],
                    ExposeHeaders: ['ETag', 'x-amz-request-id'],
                    MaxAgeSeconds: 3600,
                },
            ],
        },
    });

    await s3Client.send(corsCommand);
    console.log('[CORS] PutBucketCorsCommand 적용 완료!');

    const verifyRes = await s3Client.send(
        new GetBucketCorsCommand({
            Bucket: BUCKET,
        })
    );

    console.log('[CORS] 현재 버킷에 등록된 CORS 규칙 확인:');
    console.log(JSON.stringify(verifyRes.CORSRules, null, 2));
}

configureBucketCors().catch((err) => {
    console.error('[CORS 설정 실패]', err);
    process.exitCode = 1;
});
