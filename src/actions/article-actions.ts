'use server';

import { prisma } from '@/lib/db';

export interface ArticleFilter {
    exhibitionId: number;
    keywordId?: number;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    pageSize?: number;
}

export async function getArticles(filter: ArticleFilter) {
    const { exhibitionId, keywordId, fromDate, toDate, page = 1, pageSize = 50 } = filter;

    const where = {
        ingestions: {
            some: {
                exhibition_id: exhibitionId,
                ...(keywordId ? { keyword_id: keywordId } : {}),
            }
        },
        ...(fromDate || toDate ? {
            created_at: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {}),
            }
        } : {})
    };

    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            include: {
                ingestions: {
                    where: {
                        exhibition_id: exhibitionId,
                        ...(keywordId ? { keyword_id: keywordId } : {}),
                    },
                    include: { keyword: { select: { id: true, keyword_text: true } } },
                    take: 1,
                }
            },
            orderBy: { created_at: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.article.count({ where }),
    ]);

    return { articles, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getArticlesForExport(exhibitionId: number, month: string) {
    const [year, mon] = month.split('-').map(Number);
    const fromDate = new Date(year, mon - 1, 1);
    const toDate = new Date(year, mon, 0, 23, 59, 59);

    return prisma.article.findMany({
        where: {
            created_at: { gte: fromDate, lte: toDate },
            ingestions: { some: { exhibition_id: exhibitionId } }
        },
        include: {
            ingestions: {
                where: { exhibition_id: exhibitionId },
                include: {
                    keyword: { select: { id: true, keyword_text: true, keyword_type: true } }
                }
            }
        },
        orderBy: { created_at: 'desc' },
    });
}
