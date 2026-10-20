import { cookies } from 'next/headers';
import { verifyTempToken } from './temp-token';
import { isDevMode } from './token-config';

/**
 * 서버 액션용 관리자 인증 가드.
 * 서버 액션은 어떤 경로로든 POST 호출될 수 있어 미들웨어의 /admin 경로 보호를 우회하므로,
 * 관리자 전용 액션은 반드시 함수 첫 줄에서 호출해야 합니다.
 */
export async function requireAdmin(): Promise<{ username: string }> {
    // 개발 모드는 미들웨어와 동일하게 인증을 생략 (첫 요청에는 테스트 쿠키가 아직 없음)
    if (isDevMode()) return { username: 'local-test-admin' };
    const token = (await cookies()).get('auth_token')?.value;
    const decoded = token ? verifyTempToken(token) : null;
    if (!decoded || !decoded.username) {
        throw new Error('Unauthorized');
    }
    return { username: decoded.username };
}
