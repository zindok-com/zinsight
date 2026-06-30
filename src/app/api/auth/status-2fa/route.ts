import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyTempToken } from '@/lib/temp-token';

export async function GET() {
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

        // 로컬 테스트용 폴백: 해당 어드민이 없을 경우 첫 번째 어드민 로드
        if (!admin && decoded.username === 'local-test-admin') {
            admin = await prisma.admin.findFirst();
        }

        if (!admin) {
            // 어드민 테이블이 완전히 비어있을 경우 설정 가능한 상태(enabled: false)로 모킹
            if (decoded.username === 'local-test-admin') {
                return NextResponse.json({ success: true, enabled: false });
            }
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, enabled: admin.two_factor_enabled });
    } catch (error) {
        console.error('Get 2FA status error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
