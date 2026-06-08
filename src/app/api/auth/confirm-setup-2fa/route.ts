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

        // 임시 저장된 2FA Secret Key 조회
        const tempSecretSetting = await prisma.adminSetting.findUnique({
            where: { key: '2fa_temp_secret' }
        });

        if (!tempSecretSetting?.value) {
            return NextResponse.json({ success: false, error: 'MFA setup session not found. Please try setup again.' }, { status: 400 });
        }

        // 입력한 코드 검증
        const isValid = verifyTOTP(code, tempSecretSetting.value);
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid 2FA verification code' }, { status: 400 });
        }

        // 트랜잭션 처리 (Prisma가 MariaDB 환경이므로 여러 개 단독 처리 가능)
        // 1. 임시 키를 정식 키로 저장
        await prisma.adminSetting.upsert({
            where: { key: '2fa_secret' },
            update: { value: tempSecretSetting.value },
            create: { key: '2fa_secret', value: tempSecretSetting.value },
        });

        // 2. 2FA 사용 설정 등록
        await prisma.adminSetting.upsert({
            where: { key: '2fa_enabled' },
            update: { value: 'true' },
            create: { key: '2fa_enabled', value: 'true' },
        });

        // 3. 임시 키 삭제
        await prisma.adminSetting.delete({
            where: { key: '2fa_temp_secret' }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Confirm 2FA setup error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
