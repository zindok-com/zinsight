import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        if (!authToken || authToken.value !== 'authenticated') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const enabledSetting = await prisma.adminSetting.findUnique({
            where: { key: '2fa_enabled' }
        });
        const enabled = enabledSetting?.value === 'true';

        return NextResponse.json({ success: true, enabled });
    } catch (error) {
        console.error('Get 2FA status error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
