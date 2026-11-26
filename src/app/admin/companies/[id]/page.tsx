import { prisma } from '@/lib/db';
import { ACTIVE_CHANNELS } from '@/lib/org-channel-store';
import { notFound } from 'next/navigation';
import { CompanyEditClient } from './CompanyEditClient';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
    const { id: paramId } = await params;
    const id = Number(paramId);

    if (isNaN(id)) {
        notFound();
    }

    const [company, regions] = await Promise.all([
        prisma.organization.findUnique({
            where: { id },
            include: {
                region: true,
                channels: ACTIVE_CHANNELS,
                magazinePosts: {
                    where: {
                        magazinePost: {
                            deletedAt: null,
                        },
                    },
                    include: {
                        magazinePost: {
                            include: {
                                category: true,
                                region: true,
                            },
                        },
                    },
                    orderBy: {
                        magazinePost: {
                            createdAt: 'desc',
                        },
                    },
                },
                _count: {
                    select: {
                        magazinePosts: true,
                        linkPageLeads: { where: { read_at: null } },
                    },
                },
            },
        }),
        prisma.region.findMany({
            orderBy: { name: 'asc' },
        }),
    ]);

    if (!company) {
        notFound();
    }

    return (
        <div className="space-y-6 pb-16">
            <CompanyEditClient
                company={company}
                regions={regions}
            />
        </div>
    );
}
