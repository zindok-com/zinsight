import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { MAX_PASSKEYS_PER_ADMIN, cleanDeviceName, currentAdmin, relyingParty, takeChallenge } from '@/lib/passkey';

/** 패스키 등록 2단계: 기기가 만든 응답을 검증하고 공개키 저장 */
export async function POST(request: Request) {
    try {
        const admin = await currentAdmin().catch(() => null);
        if (!admin) return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });

        const challenge = await takeChallenge('register');
        if (!challenge || challenge.owner !== admin.username) {
            return NextResponse.json({ success: false, error: '등록 시간이 지났습니다. 다시 시도해 주세요.' }, { status: 400 });
        }

        const body = await request.json().catch(() => null);
        if (!body?.response) return NextResponse.json({ success: false, error: '잘못된 요청입니다.' }, { status: 400 });

        const { rpID, origin } = relyingParty(request);
        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response: body.response,
                expectedChallenge: challenge.challenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                requireUserVerification: true,
            });
        } catch (error) {
            console.warn('Passkey registration rejected:', error);
            return NextResponse.json({ success: false, error: '기기 인증을 확인하지 못했습니다.' }, { status: 400 });
        }
        if (!verification.verified) return NextResponse.json({ success: false, error: '기기 인증을 확인하지 못했습니다.' }, { status: 400 });

        const { credential } = verification.registrationInfo;
        if (credential.id.length > 512) return NextResponse.json({ success: false, error: '지원하지 않는 기기입니다.' }, { status: 400 });

        const count = await prisma.adminPasskey.count({ where: { admin_id: admin.id } });
        if (count >= MAX_PASSKEYS_PER_ADMIN) {
            return NextResponse.json({ success: false, error: `기기는 최대 ${MAX_PASSKEYS_PER_ADMIN}대까지 등록할 수 있습니다.` }, { status: 400 });
        }

        const saved = await prisma.adminPasskey.create({
            data: {
                admin_id: admin.id,
                credential_id: credential.id,
                public_key: Buffer.from(credential.publicKey),
                counter: BigInt(credential.counter),
                transports: credential.transports?.join(',').slice(0, 100) || null,
                device_name: cleanDeviceName(body.deviceName),
            },
            select: { id: true, device_name: true },
        });

        return NextResponse.json({ success: true, passkey: saved });
    } catch (error) {
        console.error('Passkey register verify error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
