'use server';

import { prisma } from '@/lib/db';

export async function getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [exhibitionCount, keywordCount, articleCount, thisMonthCount] = await Promise.all([
        prisma.exhibition.count({ where: { deleted_at: null } }),
        prisma.searchKeyword.count({ where: { deleted_at: null, is_active: true } }),
        prisma.article.count(),
        prisma.article.count({ where: { created_at: { gte: startOfMonth } } }),
    ]);

    return {
        exhibitionCount,
        keywordCount,
        articleCount,
        thisMonthCount,
    };
}
