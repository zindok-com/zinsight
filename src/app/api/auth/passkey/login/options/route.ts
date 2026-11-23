import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { clientIpFromHeaders, rateLimit, MINUTE } from '@/lib/rate-limit';
import { PASSKEY_UNAVAILABLE, relyingParty, saveChallenge } from '@/lib/passkey';

/** 패스키 로그인 1단계: 챌린지 발급 (아이디 입력 없이 기기에 저장된 패스키 중에서 선택) */
export async function POST(request: Request) {
    try {
        if (!rateLimit(`passkey-login-ip:${clientIpFromHeaders(request.headers)}`, 20, 15 * MINUTE)) {
            return NextResponse.json({ success: false, error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.' }, { status: 429 });
        }
        const rp = relyingParty();
        if (!rp) return NextResponse.json({ success: false, error: PASSKEY_UNAVAILABLE }, { status: 503 });
        const options = await generateAuthenticationOptions({ rpID: rp.rpID, userVerification: 'required' });
        await saveChallenge('login', options.challenge);
        return NextResponse.json({ success: true, options });
    } catch (error) {
        console.error('Passkey login options error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
