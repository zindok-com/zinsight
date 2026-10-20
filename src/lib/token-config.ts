// Node / Edge(미들웨어) 런타임 공용 토큰 설정. Node 전용 모듈을 import하지 마십시오.

export const LOCAL_TEST_TOKEN = 'local-test-token';

export function isDevMode(): boolean {
    return process.env.NODE_ENV === 'development';
}

export function isLocalTestToken(token: string): boolean {
    return isDevMode() && token === LOCAL_TEST_TOKEN;
}

export function getTokenSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (secret) return secret;
    // 공개된 기본 키로 서명하면 누구나 토큰을 위조할 수 있으므로 운영 환경에서는 차단
    if (!isDevMode()) {
        throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    }
    return 'fallback-secure-key-zinsight-mfa-pending';
}
