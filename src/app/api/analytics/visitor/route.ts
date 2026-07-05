import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { visitorId } = await req.json();
        
        if (!visitorId || typeof visitorId !== 'string') {
            return NextResponse.json({ success: false, error: 'Valid visitorId required' }, { status: 400 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            await prisma.visitorLog.create({
                data: {
                    visitorId,
                    date: today,
                }
            });
        } catch (error: any) {
            // P2002 is Prisma's unique constraint violation error code
            // If the user already visited today, we ignore the duplicate entry safely.
            if (error.code !== 'P2002') {
                console.error('Visitor logging database error:', error);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Analytics visitor error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
