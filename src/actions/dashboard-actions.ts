'use server';

import { prisma } from '@/lib/db';

export async function getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        industryCount,
        keywordCount,
        articleCount,
        thisMonthCount,
        magazinePostCount,
        viewStats
    ] = await Promise.all([
        prisma.industry.count({ where: { deleted_at: null } }),
        prisma.searchKeyword.count({ where: { deleted_at: null, is_active: true } }),
        prisma.article.count(),
        prisma.article.count({ where: { created_at: { gte: startOfMonth } } }),
        prisma.magazinePost.count(),
        prisma.magazinePost.aggregate({
            _sum: {
                viewCount: true
            }
        })
    ]);

    return {
        industryCount,
        keywordCount,
        articleCount,
        thisMonthCount,
        magazinePostCount,
        totalViewCount: viewStats._sum.viewCount || 0,
    };
}
