/**
 * Google Service Account 인증 정보를 환경변수 GOOGLE_SERVICE_ACCOUNT_JSON에서만 읽습니다.
 * (키 파일을 직접 읽지 않음. 로컬 개발은 .env.local에 같은 변수를 둡니다)
 * - 일반 JSON 문자열
 * - 단일/이중 따옴표로 감싸진 JSON 문자열
 * - Base64로 인코딩된 JSON 문자열
 * - private_key의 \\n 이스케이프 자동 복원
 */
export function loadGoogleCredentials(): Record<string, any> | null {
    const rawEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
    if (!rawEnv) {
        console.warn(
            `[analytics-auth] ⚠️ GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 없습니다.\n` +
            `실서버는 Vercel 환경변수, 로컬은 .env.local에 설정해 주세요.`
        );
        return null;
    }

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
        // 오류 객체에 원문 일부가 담길 수 있어 메시지 종류만 남김
        console.error('[analytics-auth] GOOGLE_SERVICE_ACCOUNT_JSON 환경변수 JSON 파싱 실패:', (parseErr as Error).name);
        return null;
    }
}
