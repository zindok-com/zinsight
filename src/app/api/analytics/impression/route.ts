import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // Correct prisma client import

export async function POST(req: Request) {
    try {
        const { postIds } = await req.json();
        
        if (!Array.isArray(postIds) || postIds.length === 0) {
            return NextResponse.json({ success: true });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 비동기 병렬 처리로 DB 업데이트 속도 향상
        await Promise.all(
            postIds.map(async (postId) => {
                if (typeof postId !== 'number') return;
                
                try {
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
                            impressions: 1,
                        },
                        update: {
                            impressions: {
                                increment: 1,
                            },
                        },
                    });
                } catch (e) {
                    console.error(`Error logging impression for post ${postId}:`, e);
                }
            })
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Analytics impression error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
