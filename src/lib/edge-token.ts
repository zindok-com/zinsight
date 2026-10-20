// 미들웨어(Edge 런타임)용 토큰 검증. temp-token.ts와 동일한 형식을 Web Crypto로 검증합니다.
import { getTokenSecret, isLocalTestToken } from './token-config';

function base64UrlToString(input: string): string {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
    if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

export async function verifyTokenEdge(token: string): Promise<Record<string, any> | null> {
    if (isLocalTestToken(token)) {
        return { username: 'local-test-admin' };
    }
    try {
        const [dataBase64, signature] = token.split('.');
        if (!dataBase64 || !signature) return null;

        const signatureBytes = hexToBytes(signature);
        if (!signatureBytes) return null;

        const serialized = base64UrlToString(dataBase64);
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(getTokenSecret()),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );
        // crypto.subtle.verify는 상수 시간 비교를 수행
        const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(serialized));
        if (!valid) return null;

        const data = JSON.parse(serialized);
        if (data.exp && Math.floor(Date.now() / 1000) > data.exp) return null;
        return data;
    } catch {
        return null;
    }
}
