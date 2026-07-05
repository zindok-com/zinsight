import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { postId, isUnique } = await req.json();
        
        if (!postId || typeof postId !== 'number') {
            return NextResponse.json({ success: false, error: 'Valid postId required' }, { status: 400 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. 일간 통계 업서트
        await prisma.postDailyAnalytics.upsert({
            where: {
                postId_date: {
                    postId,
                    date: today,
                },
            },
            create: {
                postId,
                date: today,
                rawViews: 1,
                uniqueViews: isUnique ? 1 : 0,
            },
            update: {
                rawViews: { increment: 1 },
                uniqueViews: isUnique ? { increment: 1 } : undefined,
            },
        });

        // 2. 전체 누적 조회수 동기화 (기존 필드)
        await prisma.magazinePost.update({
            where: { id: postId },
            data: { viewCount: { increment: 1 } }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Analytics view error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
