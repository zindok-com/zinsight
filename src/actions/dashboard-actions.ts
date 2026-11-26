'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

export async function getDashboardStats() {
    await requireAdmin();
    const [
        regionCount,
        organizationCount,
        magazinePostCount,
        viewStats
    ] = await Promise.all([
        prisma.region.count({ where: { isActive: true } }),
        prisma.organization.count(),
        prisma.magazinePost.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
        prisma.magazinePost.aggregate({
            _sum: {
                viewCount: true
            }
        })
    ]);

    return {
        regionCount,
        organizationCount,
        magazinePostCount,
        totalViewCount: viewStats._sum.viewCount || 0,
    };
}
