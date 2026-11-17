import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentAdmin } from '@/lib/passkey';

/** 내 패스키(등록 기기) 목록 */
export async function GET() {
    const admin = await currentAdmin().catch(() => null);
    if (!admin) return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    const passkeys = await prisma.adminPasskey.findMany({
        where: { admin_id: admin.id },
        orderBy: { created_at: 'desc' },
        select: { id: true, device_name: true, created_at: true, last_used_at: true },
    });
    return NextResponse.json({ success: true, twoFactorEnabled: admin.two_factor_enabled, passkeys });
}

/** 등록 기기 삭제 (본인 것만). ?id= */
export async function DELETE(request: Request) {
    const admin = await currentAdmin().catch(() => null);
    if (!admin) return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, error: '잘못된 요청입니다.' }, { status: 400 });
    const { count } = await prisma.adminPasskey.deleteMany({ where: { id, admin_id: admin.id } });
    if (count === 0) return NextResponse.json({ success: false, error: '이미 삭제된 기기입니다.' }, { status: 404 });
    return NextResponse.json({ success: true });
}
