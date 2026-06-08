import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyTOTP } from '@/lib/totp';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        if (!authToken || authToken.value !== 'authenticated') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { code } = body;

        // DB에서 활성화된 2FA Secret Key 조회
        const secretSetting = await prisma.adminSetting.findUnique({
            where: { key: '2fa_secret' }
        });

        if (!secretSetting?.value) {
            return NextResponse.json({ success: false, error: '2FA settings not found.' }, { status: 400 });
        }

        // OTP 코드 검증
        const isValid = verifyTOTP(code, secretSetting.value);
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid 2FA verification code' }, { status: 400 });
        }

        // 검증 성공 시 2FA 정보 삭제
        await prisma.adminSetting.deleteMany({
            where: {
                key: {
                    in: ['2fa_secret', '2fa_enabled', '2fa_temp_secret']
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Disable 2FA error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
