import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { generateSecret, getOtpauthUri } from '@/lib/totp';
import QRCode from 'qrcode';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        if (!authToken || authToken.value !== 'authenticated') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 신규 2FA 임시 비밀키 생성
        const secret = generateSecret();
        const otpauthUri = getOtpauthUri('admin', secret);

        // QR 코드를 Data URL(Base64 png)로 생성
        const qrCodeUrl = await QRCode.toDataURL(otpauthUri, {
            width: 240,
            margin: 2,
        });

        // 2FA 확인 단계 전 임시 키로 저장
        await prisma.adminSetting.upsert({
            where: { key: '2fa_temp_secret' },
            update: { value: secret },
            create: { key: '2fa_temp_secret', value: secret },
        });

        return NextResponse.json({ success: true, secret, qrCodeUrl });
    } catch (error) {
        console.error('Setup 2FA error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
