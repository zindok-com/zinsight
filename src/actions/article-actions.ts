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



export async function getConsolidatedArticlesForExport(industryIds: number[], month: string, filterType: 'pub_date' | 'created_at') {
    const [year, mon] = month.split('-').map(Number);
    const fromDate = new Date(year, mon - 1, 1);
    const toDate = new Date(year, mon, 0, 23, 59, 59);

    const dateFilter = filterType === 'pub_date' 
        ? { pub_date: { gte: fromDate, lte: toDate } }
        : { created_at: { gte: fromDate, lte: toDate } };

    const ingestionFilter = filterType === 'created_at'
        ? { industry_id: { in: industryIds }, is_duplicate: false }
        : { industry_id: { in: industryIds } };

    return prisma.article.findMany({
        where: {
            ...dateFilter,
            ingestions: { some: ingestionFilter }
        },
        include: {
            ingestions: {
                where: ingestionFilter,
                include: {
                    keyword: { select: { id: true, keyword_text: true, keyword_type: true } },
                    industry: { select: { id: true, name: true, slug: true } }
                }
            }
        },
        orderBy: filterType === 'pub_date' ? { pub_date: 'desc' } : { created_at: 'desc' },
    });
}

export async function deleteArticlesByDate(dateString: string, industryId?: number) {
    try {
        const startOfDay = new Date(dateString);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateString);
        endOfDay.setHours(23, 59, 59, 999);

        // Find articles created on this day
        // Filter by industryId if provided
        const articles = await prisma.article.findMany({
            where: {
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                ...(industryId ? {
                    ingestions: {
                        some: {
                            industry_id: industryId
                        }
                    }
                } : {})
            },
            select: { id: true }
        });

        const articleIds = articles.map(a => a.id);

        if (articleIds.length === 0) {
            return { success: true, count: 0, message: '해당 날짜에 수집된 기사가 없습니다.' };
        }

        // Delete in transaction to avoid foreign key restriction errors
        await prisma.$transaction([
            prisma.articleIngestion.deleteMany({
                where: {
                    article_id: { in: articleIds }
                }
            }),
            prisma.article.deleteMany({
                where: {
                    id: { in: articleIds }
                }
            })
        ]);

        return { 
            success: true, 
            count: articleIds.length, 
            message: `${dateString}에 수집된 기사 ${articleIds.length}개가 성공적으로 삭제되었습니다.` 
        };
    } catch (error: any) {
        console.error('Failed to delete articles by date:', error);
        return { success: false, error: error.message || '기사 삭제 중 오류가 발생했습니다.' };
    }
}

