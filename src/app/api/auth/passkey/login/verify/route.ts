import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { clientIpFromHeaders, rateLimit, MINUTE } from '@/lib/rate-limit';
import { PASSKEY_UNAVAILABLE, issueAdminSession, parseTransports, relyingParty, takeChallenge } from '@/lib/passkey';

const FAIL = '패스키 로그인에 실패했습니다. 이 기기가 등록되어 있는지 확인해 주세요.';

/**
 * 패스키 로그인 2단계: 서명 검증 후 관리자 세션 발급.
 * 패스키는 기기 소지 + 생체인증(사용자 확인 필수)이므로 비밀번호·OTP 단계를 대신함.
 */
export async function POST(request: Request) {
    try {
        if (!rateLimit(`passkey-verify-ip:${clientIpFromHeaders(request.headers)}`, 20, 15 * MINUTE)) {
            return NextResponse.json({ success: false, error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.' }, { status: 429 });
        }

        const rp = relyingParty();
        if (!rp) return NextResponse.json({ success: false, error: PASSKEY_UNAVAILABLE }, { status: 503 });

        const challenge = await takeChallenge('login');
        if (!challenge) return NextResponse.json({ success: false, error: '로그인 시간이 지났습니다. 다시 시도해 주세요.' }, { status: 400 });

        const body = await request.json().catch(() => null);
        const credentialId = body?.response?.id;
        if (typeof credentialId !== 'string' || credentialId.length > 512) {
            return NextResponse.json({ success: false, error: FAIL }, { status: 400 });
        }

        const passkey = await prisma.adminPasskey.findUnique({ where: { credential_id: credentialId }, include: { admin: { select: { username: true } } } });
        if (!passkey) return NextResponse.json({ success: false, error: FAIL }, { status: 401 });

        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response: body.response,
                expectedChallenge: challenge.challenge,
                expectedOrigin: rp.origins,
                expectedRPID: rp.rpID,
                requireUserVerification: true,
                credential: {
                    id: passkey.credential_id,
                    publicKey: new Uint8Array(passkey.public_key),
                    counter: Number(passkey.counter),
                    transports: parseTransports(passkey.transports),
                },
            });
        } catch (error) {
            console.warn('Passkey login rejected:', error);
            return NextResponse.json({ success: false, error: FAIL }, { status: 401 });
        }
        if (!verification.verified) return NextResponse.json({ success: false, error: FAIL }, { status: 401 });

        await prisma.adminPasskey.update({
            where: { id: passkey.id },
            data: { counter: BigInt(verification.authenticationInfo.newCounter), last_used_at: new Date() },
        });
        await issueAdminSession(passkey.admin.username);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Passkey login verify error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
