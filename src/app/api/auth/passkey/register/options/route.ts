import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { verifyTOTP } from '@/lib/totp';
import { clientIpFromHeaders, rateLimit, MINUTE } from '@/lib/rate-limit';
import { MAX_PASSKEYS_PER_ADMIN, PASSKEY_RP_NAME, PASSKEY_UNAVAILABLE, currentAdmin, parseTransports, relyingParty, saveChallenge } from '@/lib/passkey';

/**
 * 패스키 등록 1단계: 로그인한 관리자에게 등록 옵션 발급.
 * 세션 쿠키만 탈취된 경우 패스키를 심어 영구 접근하지 못하도록, 2FA를 켠 관리자는 OTP를 한 번 더 확인.
 */
export async function POST(request: Request) {
    try {
        const rp = relyingParty();
        if (!rp) return NextResponse.json({ success: false, error: PASSKEY_UNAVAILABLE }, { status: 503 });

        const admin = await currentAdmin().catch(() => null);
        if (!admin) return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });

        const body = await request.json().catch(() => ({}));
        if (admin.two_factor_enabled && admin.two_factor_secret) {
            const allowed = rateLimit(`passkey-otp:${clientIpFromHeaders(request.headers)}:${admin.id}`, 5, 5 * MINUTE);
            if (!allowed) return NextResponse.json({ success: false, error: '인증 시도가 너무 많습니다. 5분 후 다시 시도해 주세요.' }, { status: 429 });
            if (typeof body.code !== 'string' || !verifyTOTP(body.code, admin.two_factor_secret)) {
                return NextResponse.json({ success: false, error: 'OTP 코드가 올바르지 않습니다.' }, { status: 400 });
            }
        }

        const existing = await prisma.adminPasskey.findMany({ where: { admin_id: admin.id }, select: { credential_id: true, transports: true } });
        if (existing.length >= MAX_PASSKEYS_PER_ADMIN) {
            return NextResponse.json({ success: false, error: `기기는 최대 ${MAX_PASSKEYS_PER_ADMIN}대까지 등록할 수 있습니다.` }, { status: 400 });
        }

        const options = await generateRegistrationOptions({
            rpName: PASSKEY_RP_NAME,
            rpID: rp.rpID,
            userName: admin.username,
            userID: new TextEncoder().encode(`admin:${admin.id}`),
            attestationType: 'none',
            excludeCredentials: existing.map((c) => ({ id: c.credential_id, transports: parseTransports(c.transports) })),
            // 아이디 입력 없이 로그인하려면 기기에 저장되는 패스키(resident key)여야 함
            authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        });
        await saveChallenge('register', options.challenge, admin.username);

        return NextResponse.json({ success: true, options });
    } catch (error) {
        console.error('Passkey register options error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
