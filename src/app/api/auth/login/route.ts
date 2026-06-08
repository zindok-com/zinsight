import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { signTempToken } from '@/lib/temp-token';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin1234';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { passcode } = body;

        if (passcode !== ADMIN_PASSCODE) {
            return NextResponse.json({ success: false, error: 'Invalid passcode' }, { status: 401 });
        }

        // 2FA 활성화 상태 확인
        const enabledSetting = await prisma.adminSetting.findUnique({
            where: { key: '2fa_enabled' }
        });
        const is2faEnabled = enabledSetting?.value === 'true';

        if (is2faEnabled) {
            // 2FA 대기 임시 토큰 서명
            const tempToken = signTempToken({ step: 'mfa_pending' }, 300); // 5분 유효

            (await cookies()).set('mfa_pending', tempToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 300,
                path: '/',
            });

            return NextResponse.json({ success: true, require2fa: true });
        }

        // 2FA가 꺼져있으면 바로 로그인 세션 발급
        (await cookies()).set('auth_token', 'authenticated', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1주일
            path: '/',
        });

        return NextResponse.json({ success: true, require2fa: false });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
