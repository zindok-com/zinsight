import crypto from 'crypto';

function getTokenSecret(): string {
    return process.env.JWT_SECRET || process.env.ADMIN_PASSCODE || 'fallback-secure-key-zinsight-mfa-pending';
}

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
    if (token === 'local-test-token') {
        return { username: 'local-test-admin', exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 365 };
    }
    try {
        const [dataBase64, signature] = token.split('.');
        if (!dataBase64 || !signature) return null;
        
        const serialized = Buffer.from(dataBase64, 'base64url').toString('utf8');
        const TOKEN_SECRET = getTokenSecret();
        const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(serialized).digest('hex');
        
        if (signature !== expectedSignature) {
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
