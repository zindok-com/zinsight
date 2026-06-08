import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyTOTP } from '@/lib/totp';
import { verifyTempToken } from '@/lib/temp-token';

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
        if (!decoded || decoded.step !== 'mfa_pending') {
            return NextResponse.json({ success: false, error: 'Session expired or invalid. Please login again.' }, { status: 401 });
        }

        // DB에서 활성화된 2FA Secret Key 획득
        const secretSetting = await prisma.adminSetting.findUnique({
            where: { key: '2fa_secret' }
        });

        if (!secretSetting?.value) {
            return NextResponse.json({ success: false, error: '2FA settings not found. Please contact administrator.' }, { status: 500 });
        }

        // OTP 검증
        const isValid = verifyTOTP(code, secretSetting.value);
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid 2FA verification code' }, { status: 400 });
        }

        // 검증 완료 후 임시 세션 삭제 및 정식 세션 발급
        cookieStore.delete('mfa_pending');

        cookieStore.set('auth_token', 'authenticated', {
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
