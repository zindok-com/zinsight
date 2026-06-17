import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { signTempToken } from '@/lib/temp-token';
import { verifyPassword } from '@/lib/password';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
        }

        const admin = await prisma.admin.findUnique({
            where: { username }
        });

        if (!admin || !verifyPassword(password, admin.password_hash)) {
            return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
        }

        // 2FA 활성화 상태 확인
        const is2faEnabled = admin.two_factor_enabled;

        if (is2faEnabled) {
            // 2FA 대기 임시 토큰 서명
            const tempToken = signTempToken({ step: 'mfa_pending', username: admin.username }, 300); // 5분 유효

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
        const authToken = signTempToken({ username: admin.username }, 60 * 60 * 24 * 7);

        (await cookies()).set('auth_token', authToken, {
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
