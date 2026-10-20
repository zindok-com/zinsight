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

/**
 * 정식 로그인 세션 토큰인지 판별.
 * 비밀번호만 통과한 2FA 대기 토큰(step: 'mfa_pending')도 같은 키로 서명되므로,
 * step이 있는 토큰을 세션으로 받아들이면 auth_token 쿠키에 옮겨 넣는 것만으로 2FA를 우회할 수 있음.
 */
export function isSessionPayload(payload: Record<string, any> | null): payload is Record<string, any> & { username: string } {
    return !!payload && typeof payload.username === 'string' && payload.username.length > 0 && payload.step === undefined;
}
