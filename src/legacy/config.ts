import path from 'path';
import { logger } from '../lib/logger';

// Next.js handles .env automatically, but for standalone scripts:
// dotenv.config({ path: path.join(process.cwd(), '.env') });

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error("Missing required environment variables: NAVER_CLIENT_ID or NAVER_CLIENT_SECRET");
    } else {
        logger.warn("Missing NAVER_CLIENT_ID or NAVER_CLIENT_SECRET. Naver API calls will fail.");
    }
}

export const CONFIG = {
    NAVER_CLIENT_ID: NAVER_CLIENT_ID || '',
    NAVER_CLIENT_SECRET: NAVER_CLIENT_SECRET || '',
    NAVER_API_URL: 'https://openapi.naver.com/v1/search/news.json',
    KEYWORDS: {
        QUERY_SME: 'LED 스마트 중소기업',
        QUERY_PUBLIC: 'LED 스마트 공공기관'
    },
    // Keywords for validation/scoring (not for search)
    VALIDATION_KEYWORDS: ['전시', '전시회', '출품', '부스', '시연', '신제품 공개']
};

