import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { signTempToken, verifyTempToken } from '@/lib/temp-token';
import { isDevMode } from '@/lib/token-config';

/**
 * 관리자 패스키(지정 기기 생체인증 로그인) 공용 도우미.
 * 등록은 로그인한 관리자만, 로그인은 등록된 기기의 패스키로 비밀번호·OTP 없이 세션 발급.
 */

export const PASSKEY_RP_NAME = '진사이트 관리자';
export const MAX_PASSKEYS_PER_ADMIN = 10;
const CHALLENGE_COOKIE = 'passkey_challenge';
const CHALLENGE_TTL_SECONDS = 300;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/** RP ID·origin은 요청 주소 기준 (운영 www, 프리뷰, localhost 각각 따로 등록됨) */
export function relyingParty(request: Request): { rpID: string; origin: string } {
    const url = new URL(request.url);
    return { rpID: url.hostname, origin: url.origin };
}

type ChallengePurpose = 'register' | 'login';

/** 챌린지는 서명 쿠키에 5분 보관. 한 번 쓰면 지움 (재사용 방지) */
export async function saveChallenge(purpose: ChallengePurpose, challenge: string, username?: string) {
    const token = signTempToken({ step: `passkey_${purpose}`, challenge, ...(username ? { owner: username } : {}) }, CHALLENGE_TTL_SECONDS);
    (await cookies()).set(CHALLENGE_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: CHALLENGE_TTL_SECONDS,
        path: '/api/auth/passkey',
    });
}

export async function takeChallenge(purpose: ChallengePurpose): Promise<{ challenge: string; owner?: string } | null> {
    const store = await cookies();
    const raw = store.get(CHALLENGE_COOKIE)?.value;
    store.set(CHALLENGE_COOKIE, '', { maxAge: 0, path: '/api/auth/passkey' });
    const data = raw ? verifyTempToken(raw) : null;
    if (!data || data.step !== `passkey_${purpose}` || typeof data.challenge !== 'string') return null;
    return { challenge: data.challenge, owner: typeof data.owner === 'string' ? data.owner : undefined };
}

/** 로그인한 관리자 행. 개발 모드의 테스트 세션은 첫 관리자로 대신함 (status-2fa와 같은 규칙) */
export async function currentAdmin() {
    const { username } = await requireAdmin();
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (admin) return admin;
    if (isDevMode() && username === 'local-test-admin') return prisma.admin.findFirst({ orderBy: { id: 'asc' } });
    return null;
}

/** 정식 관리자 세션 발급 (비밀번호·OTP 로그인과 같은 쿠키·유효기간) */
export async function issueAdminSession(username: string) {
    const authToken = signTempToken({ username }, SESSION_TTL_SECONDS);
    (await cookies()).set('auth_token', authToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: SESSION_TTL_SECONDS,
        path: '/',
    });
}

export function parseTransports(value: string | null): string[] | undefined {
    return value ? value.split(',').filter(Boolean) : undefined;
}

/** 기기 이름: 사용자가 입력한 값 정리 (없으면 '내 기기') */
export function cleanDeviceName(value: unknown): string {
    const name = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, 100) : '';
    return name || '내 기기';
}
