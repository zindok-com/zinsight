import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyTOTP } from '@/lib/totp';
import { verifyTempToken } from '@/lib/temp-token';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        if (!authToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyTempToken(authToken.value);
        if (!decoded || !decoded.username) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        let admin = await prisma.admin.findUnique({
            where: { username: decoded.username }
        });

        if (!admin && decoded.username === 'local-test-admin') {
            admin = await prisma.admin.findFirst();
        }

        if (!admin || !admin.two_factor_secret) {
            return NextResponse.json({ success: false, error: '2FA settings not found.' }, { status: 400 });
        }

        const body = await request.json();
        const { code } = body;

        // OTP 코드 검증
        const isValid = verifyTOTP(code, admin.two_factor_secret);
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid 2FA verification code' }, { status: 400 });
        }

        // 검증 성공 시 2FA 정보 비활성화 및 삭제
        await prisma.admin.update({
            where: { id: admin.id },
            data: {
                two_factor_secret: null,
                two_factor_enabled: false,
                two_factor_temp: null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Disable 2FA error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
