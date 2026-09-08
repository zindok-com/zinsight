import path from 'path';
import fs from 'fs';

/**
 * Google Service Account 인증 정보를 안전하게 로드합니다.
 * 
 * 1. 실서버 환경: 환경변수 GOOGLE_SERVICE_ACCOUNT_JSON 참조
 *    - 일반 JSON 문자열
 *    - 단일/이중 따옴표로 감싸진 JSON 문자열
 *    - Base64로 인코딩된 JSON 문자열
 *    - private_key의 \\n 이스케이프 자동 복원
 * 2. 로컬 개발 환경: 프로젝트 루트의 zinsight-analytics-*.json 파일 참조
 */
export function loadGoogleCredentials(): Record<string, any> | null {
    // 1. 환경변수 GOOGLE_SERVICE_ACCOUNT_JSON 확인
    const rawEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
    if (rawEnv) {
        try {
            let jsonStr = rawEnv;

            // Base64 인코딩된 문자열 대응 (ey... 로 시작하는 등)
            if (!jsonStr.startsWith('{') && !jsonStr.startsWith('"') && !jsonStr.startsWith("'")) {
                try {
                    const decoded = Buffer.from(jsonStr, 'base64').toString('utf-8');
                    if (decoded.trim().startsWith('{')) {
                        jsonStr = decoded.trim();
                    }
                } catch {}
            }

            // 앞뒤 감싸진 따옴표('...' or "...") 제거
            if (
                (jsonStr.startsWith("'") && jsonStr.endsWith("'")) ||
                (jsonStr.startsWith('"') && jsonStr.endsWith('"'))
            ) {
                jsonStr = jsonStr.slice(1, -1).trim();
            }

            const parsed = JSON.parse(jsonStr);

            // private_key 줄바꿈(\\n -> \n) 복원 (Vercel 및 서버 환경변수 줄바꿈 이스케이프 이슈 해결)
            if (parsed.private_key && typeof parsed.private_key === 'string') {
                parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
            }

            return parsed;
        } catch (parseErr) {
            console.error('[analytics-auth] GOOGLE_SERVICE_ACCOUNT_JSON 환경변수 JSON 파싱 실패:', parseErr);
        }
    }

    // 2. 로컬 개발 환경용 파일 경로 확인
    const filePath =
        process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH ||
        './zinsight-analytics-2026-9897decb4585.json';
    const abs = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(abs)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(abs, 'utf-8'));
            if (parsed.private_key && typeof parsed.private_key === 'string') {
                parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
            }
            return parsed;
        } catch (err) {
            console.error(`[analytics-auth] 로컬 인증 파일 파싱 실패 (${abs}):`, err);
        }
    }

    console.warn(
        `[analytics-auth] ⚠️ Google Service Account 인증 정보를 찾을 수 없습니다.\n` +
        `실서버(Vercel 등) 환경변수에 'GOOGLE_SERVICE_ACCOUNT_JSON'이 설정되어 있는지 확인해 주세요.`
    );
    return null;
}
