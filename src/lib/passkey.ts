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

export const PASSKEY_UNAVAILABLE = '이 환경에는 패스키가 설정되어 있지 않습니다. 비밀번호로 로그인해 주세요.';

/**
 * RP ID·허용 origin은 환경변수로 고정 (요청 Host 헤더를 믿지 않음).
 * - WEBAUTHN_RP_ID: 예) www.zinsight.co.kr. 바꾸면 기존 패스키는 모두 다시 등록해야 함
 * - WEBAUTHN_ORIGINS: 쉼표 구분 (생략 시 https://{RP ID}). RP ID와 같거나 그 하위 호스트만 인정
 * 개발 환경은 값이 없으면 localhost / http://localhost:3000. 그 밖의 환경(프리뷰 등)에서 값이 없으면 null → 패스키 사용 불가
 */
export function relyingParty(): { rpID: string; origins: string[] } | null {
    const rpID = process.env.WEBAUTHN_RP_ID?.trim().toLowerCase() || (isDevMode() ? 'localhost' : '');
    if (!rpID) {
        console.error('[passkey] WEBAUTHN_RP_ID 환경 변수가 설정되지 않았습니다.');
        return null;
    }
    const raw = process.env.WEBAUTHN_ORIGINS?.trim() || (isDevMode() && rpID === 'localhost' ? 'http://localhost:3000' : `https://${rpID}`);
    const origins = raw
        .split(',')
        .map((o) => o.trim())
        .filter((o) => {
            try {
                const { hostname, origin } = new URL(o);
                return origin === o && (hostname === rpID || hostname.endsWith(`.${rpID}`));
            } catch {
                return false;
            }
        });
    if (origins.length === 0) {
        console.error('[passkey] WEBAUTHN_ORIGINS에 RP ID와 맞는 origin이 없습니다.');
        return null;
    }
    return { rpID, origins };
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
