import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: paramId } = await params;
    const id = Number(paramId);
    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const company = await prisma.organization.findUnique({
        where: { id },
        include: {
            region: { select: { id: true, name: true, slug: true } },
            ingestions: {
                where: { organization_id: id },
                include: {
                    article: {
                        select: { id: true, title: true, pub_date: true, link: true }
                    }
                },
                orderBy: { fetched_at: 'desc' },
                take: 20,
            },
            _count: {
                select: { company_articles: true, ingestions: true }
            }
        }
    });

    if (!company) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(company);
}
