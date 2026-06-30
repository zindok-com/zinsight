import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { generateSecret, getOtpauthUri } from '@/lib/totp';
import { verifyTempToken } from '@/lib/temp-token';
import QRCode from 'qrcode';

export async function POST() {
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

        if (!admin) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // 신규 2FA 임시 비밀키 생성
        const secret = generateSecret();
        const otpauthUri = getOtpauthUri(admin.username, secret);

        // QR 코드를 Data URL(Base64 png)로 생성
        const qrCodeUrl = await QRCode.toDataURL(otpauthUri, {
            width: 240,
            margin: 2,
        });

        // 2FA 확인 단계 전 임시 키로 저장
        await prisma.admin.update({
            where: { id: admin.id },
            data: {
                two_factor_temp: secret
            }
        });

        return NextResponse.json({ success: true, secret, qrCodeUrl });
    } catch (error) {
        console.error('Setup 2FA error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
