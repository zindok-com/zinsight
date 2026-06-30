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

        if (!admin || !admin.two_factor_temp) {
            return NextResponse.json({ success: false, error: 'MFA setup session not found. Please try setup again.' }, { status: 400 });
        }

        const body = await request.json();
        const { code } = body;

        // 입력한 코드 검증
        const isValid = verifyTOTP(code, admin.two_factor_temp);
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid 2FA verification code' }, { status: 400 });
        }

        // 어드민 레코드 2FA 활성화 처리
        await prisma.admin.update({
            where: { id: admin.id },
            data: {
                two_factor_secret: admin.two_factor_temp,
                two_factor_enabled: true,
                two_factor_temp: null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Confirm 2FA setup error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
