'use server';

import { prisma } from '@/lib/db';

export interface ArticleFilter {
    industryId: number;
    keywordId?: number;
    /** YYYY-MM 형식, 수집일(created_at) 월 필터 */
    createdMonth?: string;
    /** YYYY-MM 형식, 발행일(pub_date) 월 필터 */
    pubMonth?: string;
    page?: number;
    pageSize?: number;
}

/** YYYY-MM 문자열을 해당 월의 시작~끝 Date 범위로 변환 */
function monthRange(ym: string): { gte: Date; lte: Date } {
    const [year, mon] = ym.split('-').map(Number);
    const gte = new Date(year, mon - 1, 1);
    const lte = new Date(year, mon, 0, 23, 59, 59, 999);
    return { gte, lte };
}

export async function getArticles(filter: ArticleFilter) {
    const { industryId, keywordId, createdMonth, pubMonth, page = 1, pageSize = 50 } = filter;

    const where = {
        ingestions: {
            some: {
                industry_id: industryId,
                ...(keywordId ? { keyword_id: keywordId } : {}),
            }
        },
        ...(createdMonth ? { created_at: monthRange(createdMonth) } : {}),
        ...(pubMonth ? { pub_date: monthRange(pubMonth) } : {}),
    };

    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            include: {
                ingestions: {
                    where: {
                        industry_id: industryId,
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

export async function getArticlesForExport(industryId: number, month: string) {
    const [year, mon] = month.split('-').map(Number);
    const fromDate = new Date(year, mon - 1, 1);
    const toDate = new Date(year, mon, 0, 23, 59, 59);

    return prisma.article.findMany({
        where: {
            pub_date: { gte: fromDate, lte: toDate },
            ingestions: { some: { industry_id: industryId } }
        },
        include: {
            ingestions: {
                where: { industry_id: industryId },
                include: {
                    keyword: { select: { id: true, keyword_text: true, keyword_type: true } }
                }
            }
        },
        orderBy: { pub_date: 'desc' },
    });
}

export async function getConsolidatedArticlesForExport(industryIds: number[], month: string, filterType: 'pub_date' | 'created_at') {
    const [year, mon] = month.split('-').map(Number);
    const fromDate = new Date(year, mon - 1, 1);
    const toDate = new Date(year, mon, 0, 23, 59, 59);

    const dateFilter = filterType === 'pub_date' 
        ? { pub_date: { gte: fromDate, lte: toDate } }
        : { created_at: { gte: fromDate, lte: toDate } };

    return prisma.article.findMany({
        where: {
            ...dateFilter,
            ingestions: { some: { industry_id: { in: industryIds } } }
        },
        include: {
            ingestions: {
                where: { industry_id: { in: industryIds } },
                include: {
                    keyword: { select: { id: true, keyword_text: true, keyword_type: true } },
                    industry: { select: { id: true, name: true, slug: true } }
                }
            }
        },
        orderBy: filterType === 'pub_date' ? { pub_date: 'desc' } : { created_at: 'desc' },
    });
}
