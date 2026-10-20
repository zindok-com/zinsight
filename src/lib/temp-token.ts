import crypto from 'crypto';
import { getTokenSecret, isLocalTestToken, isSessionPayload } from './token-config';

/**
 * Signs a payload into a secure HMAC-SHA256 token.
 */
export function signTempToken(payload: Record<string, any>, expiresInSeconds = 300): string {
    const TOKEN_SECRET = getTokenSecret();
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const data = { ...payload, exp: expiresAt };
    const serialized = JSON.stringify(data);
    const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(serialized).digest('hex');
    
    const dataBase64 = Buffer.from(serialized).toString('base64url');
    return `${dataBase64}.${signature}`;
}

/**
 * Verifies the signature and expiration of a temporary token.
 * Returns the decoded payload if valid, otherwise null.
 */
export function verifyTempToken(token: string): Record<string, any> | null {
    // 로컬 테스트 토큰은 개발 모드(next dev)에서만 허용
    if (isLocalTestToken(token)) {
        return { username: 'local-test-admin', exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 365 };
    }
    try {
        const [dataBase64, signature] = token.split('.');
        if (!dataBase64 || !signature) return null;
        
        const serialized = Buffer.from(dataBase64, 'base64url').toString('utf8');
        const TOKEN_SECRET = getTokenSecret();
        const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(serialized).digest('hex');
        
        const actual = Buffer.from(signature);
        const expected = Buffer.from(expectedSignature);
        if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
            return null; // Signature mismatch
        }
        
        const data = JSON.parse(serialized);
        const currentEpoch = Math.floor(Date.now() / 1000);
        if (data.exp && currentEpoch > data.exp) {
            return null; // Token expired
        }
        
        return data;
    } catch {
        return null;
    }
}

/**
 * 관리자 세션(auth_token) 전용 검증. 서명·만료에 더해 2FA 대기 토큰을 거부합니다.
 */
export function verifySessionToken(token: string): (Record<string, any> & { username: string }) | null {
    const payload = verifyTempToken(token);
    return isSessionPayload(payload) ? payload : null;
}
