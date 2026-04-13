'use server';

import { prisma } from '@/lib/db';

export interface ArticleFilter {
    industryId: number;
    keywordId?: number;
    /** YYYY-MM 형식, 수집일(created_at) 월 필터 */
    createdMonth?: string;
    /** YYYY-MM 형식, 갱신일(updated_at) 월 필터 */
    updatedMonth?: string;
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
    const { industryId, keywordId, createdMonth, updatedMonth, page = 1, pageSize = 50 } = filter;

    const where = {
        ingestions: {
            some: {
                industry_id: industryId,
                ...(keywordId ? { keyword_id: keywordId } : {}),
            }
        },
        ...(createdMonth ? { created_at: monthRange(createdMonth) } : {}),
        ...(updatedMonth ? { updated_at: monthRange(updatedMonth) } : {}),
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
            created_at: { gte: fromDate, lte: toDate },
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
        orderBy: { created_at: 'desc' },
    });
}
