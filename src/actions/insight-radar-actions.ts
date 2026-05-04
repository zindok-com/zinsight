'use server';

import { prisma } from '@/lib/db';

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

export interface RadarIndustryWithStats {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    keywordCount: number;
    articleCount: number;
    companyCount: number;
    latestArticleDate: Date | null;
}

export interface RadarCompanyCard {
    id: number;
    company_name: string;
    entity_type: string | null;
    business_summary: string | null;
    recent_status: string | null;
    core_keywords: unknown;
    industry: {
        id: number;
        name: string;
        slug: string;
    } | null;
    articleCount: number;
    latestArticleDate: Date | null;
}

export interface RadarArticleItem {
    id: number;
    title: string;
    source: string | null;
    pub_date: Date | null;
    /** 원문 링크 (Article.link 필드) */
    url: string | null;
    /** 기사 요약 (Article.description 필드) */
    summary: string | null;
    keywords: { id: number; keyword_text: string }[];
    industryName: string;
}

export interface RadarFilterOptions {
    industryId?: number;
    keywordId?: number;
    entityType?: string;
    searchQuery?: string;
}

// ─────────────────────────────────────────────
// 산업별 통계 포함 목록 조회 (사이드바/필터용)
// ─────────────────────────────────────────────

export async function getRadarIndustries(): Promise<RadarIndustryWithStats[]> {
    const industries = await prisma.industry.findMany({
        where: { deleted_at: null, is_active: true },
        include: {
            _count: {
                select: {
                    keywords: { where: { deleted_at: null } },
                    ingestions: true,
                },
            },
        },
        orderBy: { created_at: 'desc' },
    });

    // 각 산업별 기업 수 및 최신 기사 수집일 집계
    const industryStats = await Promise.all(
        industries.map(async (industry: typeof industries[number]) => {
            const [companyCount, latestIngestion] = await Promise.all([
                prisma.company.count({
                    where: { industry_id: industry.id },
                }),
                prisma.articleIngestion.findFirst({
                    where: { industry_id: industry.id },
                    orderBy: { fetched_at: 'desc' },
                    select: { fetched_at: true },
                }),
            ]);

            return {
                id: industry.id,
                name: industry.name,
                slug: industry.slug,
                description: industry.description,
                keywordCount: industry._count.keywords,
                articleCount: industry._count.ingestions,
                companyCount,
                latestArticleDate: latestIngestion?.fetched_at ?? null,
            };
        })
    );

    return industryStats;
}

// ─────────────────────────────────────────────
// 전체 요약 통계 (Hero 섹션용)
// ─────────────────────────────────────────────

export async function getRadarTotalStats() {
    const [totalCompanies, totalArticles, totalIndustries, totalKeywords] = await Promise.all([
        prisma.company.count(),
        prisma.article.count(),
        prisma.industry.count({ where: { deleted_at: null, is_active: true } }),
        prisma.searchKeyword.count({ where: { deleted_at: null, is_active: true } }),
    ]);

    return { totalCompanies, totalArticles, totalIndustries, totalKeywords };
}

// ─────────────────────────────────────────────
// 기업 카드 목록 조회 (산업/키워드/검색어 필터)
// ─────────────────────────────────────────────

export async function getRadarCompanies(
    filter: RadarFilterOptions = {},
    page = 1,
    pageSize = 12
): Promise<{ companies: RadarCompanyCard[]; total: number; totalPages: number }> {
    const { industryId, entityType, searchQuery } = filter;

    const where = {
        ...(industryId ? { industry_id: industryId } : {}),
        ...(entityType ? { entity_type: entityType } : {}),
        ...(searchQuery
            ? {
                  OR: [
                      { company_name: { contains: searchQuery } },
                      { business_summary: { contains: searchQuery } },
                      { recent_status: { contains: searchQuery } },
                  ],
              }
            : {}),
    };

    const [rawCompanies, total] = await Promise.all([
        prisma.company.findMany({
            where,
            include: {
                industry: {
                    select: { id: true, name: true, slug: true },
                },
                company_articles: {
                    include: {
                        article: { select: { id: true, pub_date: true } },
                    },
                    orderBy: {
                        article: { pub_date: 'desc' },
                    },
                    take: 1,
                },
                _count: {
                    select: { company_articles: true },
                },
            },
            orderBy: { created_at: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.company.count({ where }),
    ]);

    const companies: RadarCompanyCard[] = rawCompanies.map((c: typeof rawCompanies[number]) => ({
        id: c.id,
        company_name: c.company_name,
        entity_type: c.entity_type,
        business_summary: c.business_summary,
        recent_status: c.recent_status,
        core_keywords: c.core_keywords,
        industry: c.industry,
        articleCount: c._count.company_articles,
        latestArticleDate: c.company_articles[0]?.article?.pub_date ?? null,
    }));

    return {
        companies,
        total,
        totalPages: Math.ceil(total / pageSize),
    };
}

// ─────────────────────────────────────────────
// 최신 기사 목록 조회 (뉴스 피드용)
// Article.link → url, Article.description → summary 로 매핑
// ─────────────────────────────────────────────

export async function getRadarLatestArticles(
    filter: RadarFilterOptions = {},
    limit = 10
): Promise<RadarArticleItem[]> {
    const { industryId, keywordId, searchQuery } = filter;

    const ingestionWhere = {
        ...(industryId ? { industry_id: industryId } : {}),
        ...(keywordId ? { keyword_id: keywordId } : {}),
    };

    const articles = await prisma.article.findMany({
        where: {
            ingestions: { some: ingestionWhere },
            ...(searchQuery
                ? {
                      OR: [
                          { title: { contains: searchQuery } },
                          { description: { contains: searchQuery } },
                      ],
                  }
                : {}),
        },
        include: {
            ingestions: {
                where: ingestionWhere,
                include: {
                    keyword: { select: { id: true, keyword_text: true } },
                    industry: { select: { id: true, name: true } },
                },
                take: 3,
            },
        },
        orderBy: { pub_date: 'desc' },
        take: limit,
    });

    return articles.map((a: typeof articles[number]) => ({
        id: a.id,
        title: a.title,
        source: a.source,
        pub_date: a.pub_date,
        url: a.link,                  // Article.link → url
        summary: a.description,       // Article.description → summary
        keywords: a.ingestions
            .map((ing: typeof a.ingestions[number]) => ing.keyword)
            .filter((k: typeof a.ingestions[number]['keyword']): k is { id: number; keyword_text: string } => k !== null),
        industryName: a.ingestions[0]?.industry?.name ?? '기타',
    }));
}

// ─────────────────────────────────────────────
// 트렌드 키워드 Top N 조회 (기사 수 기준)
// ─────────────────────────────────────────────

export async function getRadarTrendingKeywords(
    industryId?: number,
    limit = 20
): Promise<{ id: number; keyword_text: string; count: number; industryName: string }[]> {
    const keywords = await prisma.searchKeyword.findMany({
        where: {
            deleted_at: null,
            is_active: true,
            ...(industryId ? { industry_id: industryId } : {}),
        },
        include: {
            _count: { select: { ingestions: true } },
            industry: { select: { name: true } },
        },
        orderBy: { ingestions: { _count: 'desc' } },
        take: limit,
    });

    return keywords.map((k: typeof keywords[number]) => ({
        id: k.id,
        keyword_text: k.keyword_text,
        count: k._count.ingestions,
        industryName: k.industry?.name ?? '기타',
    }));
}

// ─────────────────────────────────────────────
// 개별 기업 상세 조회 (모달/상세 카드용)
// ─────────────────────────────────────────────

export async function getRadarCompanyDetail(companyId: number) {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
            industry: true,
            company_articles: {
                include: {
                    article: {
                        select: {
                            id: true,
                            title: true,
                            pub_date: true,
                            source: true,
                            link: true,         // url 역할
                            description: true,  // summary 역할
                        },
                    },
                },
                orderBy: { article: { pub_date: 'desc' } },
                take: 5,
            },
            _count: { select: { company_articles: true } },
        },
    });

    if (!company) return null;

    return {
        id: company.id,
        company_name: company.company_name,
        entity_type: company.entity_type,
        business_summary: company.business_summary,
        recent_status: company.recent_status,
        core_keywords: company.core_keywords,
        industry: company.industry,
        recentArticles: company.company_articles.map((ca: typeof company.company_articles[number]) => ({
            ...ca.article,
            url: ca.article.link,           // link → url 별칭
            summary: ca.article.description, // description → summary 별칭
        })),
        articleCount: company._count.company_articles,
    };
}
