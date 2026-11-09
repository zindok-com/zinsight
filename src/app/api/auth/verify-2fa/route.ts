import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyTOTP } from '@/lib/totp';
import { verifyTempToken, signTempToken } from '@/lib/temp-token';
import { clientIpFromHeaders, rateLimit, MINUTE } from '@/lib/rate-limit';

// OTP 6자리 무차별 대입 방지: 5분에 IP별·아이디별 각 5회
const OTP_LIMIT = 5;
const OTP_WINDOW_MS = 5 * MINUTE;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code } = body;

        const cookieStore = await cookies();
        const mfaPendingCookie = cookieStore.get('mfa_pending');

        if (!mfaPendingCookie?.value) {
            return NextResponse.json({ success: false, error: 'Session expired or invalid. Please login again.' }, { status: 401 });
        }

        // 임시 서명 토큰 검증
        const decoded = verifyTempToken(mfaPendingCookie.value);
        if (!decoded || decoded.step !== 'mfa_pending' || !decoded.username) {
            return NextResponse.json({ success: false, error: 'Session expired or invalid. Please login again.' }, { status: 401 });
        }

        const ipAllowed = rateLimit(`otp-ip:${clientIpFromHeaders(request.headers)}`, OTP_LIMIT, OTP_WINDOW_MS);
        const userAllowed = rateLimit(`otp-user:${decoded.username}`, OTP_LIMIT, OTP_WINDOW_MS);
        if (!ipAllowed || !userAllowed) {
            return NextResponse.json({ success: false, error: '인증 시도가 너무 많습니다. 5분 후 다시 시도해 주세요.' }, { status: 429 });
        }

        // DB에서 해당 어드민 조회
        const admin = await prisma.admin.findUnique({
            where: { username: decoded.username }
        });

        if (!admin || !admin.two_factor_secret) {
            return NextResponse.json({ success: false, error: '2FA settings not found. Please contact administrator.' }, { status: 500 });
        }

        // OTP 검증
        const isValid = verifyTOTP(code, admin.two_factor_secret);
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid 2FA verification code' }, { status: 400 });
        }

        // 검증 완료 후 임시 세션 삭제 및 정식 세션 발급
        cookieStore.delete('mfa_pending');

        const authToken = signTempToken({ username: admin.username }, 60 * 60 * 24 * 7);

        cookieStore.set('auth_token', authToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1주일
            path: '/',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Verify 2FA error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
