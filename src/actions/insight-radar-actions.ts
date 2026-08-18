'use server';

import { prisma } from '@/lib/db';

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

export interface RadarRegionWithStats {
    id: number;
    name: string;
    slug: string;
    organizationCount: number;
}

export interface RadarCompanyCard {
    id: number;
    company_name: string;
    slug: string | null;
    entity_type: string | null;
    business_summary: string | null;
    core_keywords: unknown;
    region: { id: number; name: string; slug: string } | null;
    hq_location: string | null;
    articleCount: number;
    latestArticleDate: Date | null;
}

export interface RadarCompanyDetail {
    id: number;
    company_name: string;
    slug: string | null;
    entity_type: string | null;
    business_summary: string | null;
    core_keywords: any;
    region: { id: number; name: string; slug: string } | null;
    recentArticles: RadarArticleItem[];
    articleCount: number;
    company_url?: string | null;
    founded_year?: string | null;
    hq_location?: string | null;
    ceo_name?: string | null;
    key_references?: any | null;
    latestArticleDate: Date | null;
}

export interface RadarArticleItem {
    id: number;
    title: string;
    source: string | null;
    pub_date: Date | null;
    /** 원문 링크 */
    url: string | null;
    /** 기사 요약 */
    summary: string | null;
    keywords: { id: number; keyword_text: string }[];
    isMagazine?: boolean;
}

export interface RadarFilterOptions {
    regionId?: number;
    entityType?: string;
    searchQuery?: string;
}

// ─────────────────────────────────────────────
// 지역 목록 조회 (사이드바/필터용)
// ─────────────────────────────────────────────

export async function getRadarRegions(): Promise<RadarRegionWithStats[]> {
    const regions = await prisma.region.findMany({
        where: { isActive: true },
        include: {
            _count: {
                select: { organizations: true },
            },
        },
        orderBy: { name: 'asc' },
    });

    return regions.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        organizationCount: r._count.organizations,
    }));
}

// ─────────────────────────────────────────────
// 전체 요약 통계 (Hero 섹션용)
// ─────────────────────────────────────────────

export async function getRadarTotalStats() {
    const [totalCompanies, totalArticles, totalRegions, totalKeywords] = await Promise.all([
        prisma.organization.count(),
        prisma.article.count(),
        prisma.region.count({ where: { isActive: true } }),
        prisma.searchKeyword.count({ where: { deleted_at: null, is_active: true } })
    ]);

    return { totalCompanies, totalArticles, totalRegions, totalKeywords };
}

// ─────────────────────────────────────────────
// 기업 카드 목록 조회 (지역/검색어 필터)
// ─────────────────────────────────────────────

export async function getRadarCompanies(
    filter: RadarFilterOptions = {},
    page = 1,
    pageSize = 12
): Promise<{ companies: RadarCompanyCard[]; total: number; totalPages: number }> {
    const { regionId, entityType, searchQuery } = filter;

    const where: any = {
        ...(regionId ? { region_id: regionId } : {}),
        ...(entityType ? { entity_type: entityType } : {}),
        ...(searchQuery
            ? {
                  OR: [
                      { company_name: { contains: searchQuery } },
                      { business_summary: { contains: searchQuery } },
                  ],
              }
            : {}),
    };

    const [rawCompanies, total] = await Promise.all([
        prisma.organization.findMany({
            where,
            include: {
                region: {
                    select: { id: true, name: true, slug: true },
                },
                company_articles: {
                    include: {
                        article: { select: { id: true, pub_date: true } },
                    },
                    orderBy: { article: { pub_date: 'desc' } },
                    take: 1,
                },
                _count: {
                    select: {
                        company_articles: true,
                        ingestions: true,
                        magazinePosts: true,
                    },
                },
            },
            orderBy: [
                { is_featured: 'desc' },
                { created_at: 'desc' },
            ],
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.organization.count({ where }),
    ]);

    const companies: RadarCompanyCard[] = rawCompanies.map((c: any) => ({
        id: c.id,
        company_name: c.company_name,
        slug: c.slug ?? null,
        entity_type: c.entity_type,
        business_summary: c.business_summary,
        core_keywords: c.core_keywords,
        region: c.region ?? null,
        hq_location: c.hq_location ?? null,
        articleCount: c._count.company_articles + c._count.ingestions + c._count.magazinePosts,
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
// ─────────────────────────────────────────────

export async function getRadarLatestArticles(
    filter: RadarFilterOptions = {},
    limit = 10
): Promise<RadarArticleItem[]> {
    const { regionId, searchQuery } = filter;

    const where: any = {
        ...(regionId
            ? { ingestions: { some: { region_id: regionId } } }
            : {}),
        ...(searchQuery
            ? {
                  OR: [
                      { title: { contains: searchQuery } },
                      { description: { contains: searchQuery } },
                  ],
              }
            : {}),
    };

    const articles = await prisma.article.findMany({
        where,
        include: {
            ingestions: {
                where: regionId ? { region_id: regionId } : {},
                include: {
                    keyword: { select: { id: true, keyword_text: true } },
                },
                take: 3,
            },
        },
        orderBy: { pub_date: 'desc' },
        take: limit,
    });

    return articles.map((a: any) => ({
        id: a.id,
        title: a.title,
        source: a.source,
        pub_date: a.pub_date,
        url: a.link,
        summary: a.description,
        keywords: a.ingestions
            .map((ing: any) => ing.keyword)
            .filter((k: any): k is { id: number; keyword_text: string } => k !== null),
    }));
}

// ─────────────────────────────────────────────
// 트렌드 키워드 Top N (기사 수 기준)
// ─────────────────────────────────────────────

export async function getRadarTrendingKeywords(
    regionId?: number,
    limit = 20
): Promise<{ id: number; keyword_text: string; count: number; regionName: string }[]> {
    const keywords = await prisma.searchKeyword.findMany({
        where: {
            deleted_at: null,
            is_active: true,
            ...(regionId ? { region_id: regionId } : {}),
        },
        include: {
            _count: { select: { ingestions: true } },
            region: { select: { name: true } },
        },
        orderBy: { ingestions: { _count: 'desc' } },
        take: limit,
    });

    return keywords.map((k: any) => ({
        id: k.id,
        keyword_text: k.keyword_text,
        count: k._count.ingestions,
        regionName: k.region?.name ?? '기타',
    }));
}

// ─────────────────────────────────────────────
// 개별 기업 상세 조회
// ─────────────────────────────────────────────

export async function getRadarCompanyDetail(companyIdOrSlug: number | string) {
    const isNum = typeof companyIdOrSlug === 'number' || (!isNaN(Number(companyIdOrSlug)) && String(Number(companyIdOrSlug)) === String(companyIdOrSlug));
    const numericId = isNum ? Number(companyIdOrSlug) : -1;
    const stringSlug = String(companyIdOrSlug);

    const company = await prisma.organization.findFirst({
        where: {
            OR: [
                ...(isNum ? [{ id: numericId }] : []),
                { slug: stringSlug },
            ],
        },
        include: {
            region: { select: { id: true, name: true, slug: true } },
            company_articles: {
                include: {
                    article: {
                        select: {
                            id: true,
                            title: true,
                            pub_date: true,
                            source: true,
                            link: true,
                            description: true,
                        },
                    },
                },
                orderBy: { article: { pub_date: 'desc' } },
                take: 10,
            },
            ingestions: {
                include: {
                    article: {
                        select: {
                            id: true,
                            title: true,
                            pub_date: true,
                            source: true,
                            link: true,
                            description: true,
                        },
                    },
                },
                orderBy: { fetched_at: 'desc' },
                take: 10,
            },
            magazinePosts: {
                where: {
                    magazinePost: {
                        status: 'PUBLISHED',
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
                orderBy: { magazinePost: { createdAt: 'desc' } },
                take: 10,
            },
            _count: {
                select: {
                    company_articles: true,
                    magazinePosts: true,
                },
            },
        },
    });

    if (!company) return null;

    // CompanyArticle 경유 기사
    const externalArticles = company.company_articles.map((ca: any) => ({
        id: ca.article.id,
        title: ca.article.title,
        pub_date: ca.article.pub_date,
        source: ca.article.source || 'NAVER_NEWS',
        url: ca.article.link,
        summary: ca.article.description,
        keywords: [],
        isMagazine: false,
    }));

    // MANUAL_ORG 수집 기사 (ArticleIngestion.organization_id 경유)
    const orgIngestionArticles = company.ingestions
        .filter((ing: any) => ing.article)
        .map((ing: any) => ({
            id: ing.article.id,
            title: ing.article.title,
            pub_date: ing.article.pub_date,
            source: ing.article.source || 'NAVER_NEWS',
            url: ing.article.link,
            summary: ing.article.description,
            keywords: [],
            isMagazine: false,
        }));

    // 매거진 포스트 기사
    const magazineArticles = company.magazinePosts.map((mp: any) => {
        const post = mp.magazinePost;
        const regionSlug = post.region?.slug || '';
        const isLocal = post.category?.isLocal || false;
        const link = isLocal
            ? `/magazine/local/${regionSlug}/${post.slug}`
            : `/magazine/tech-marketing/${post.slug}`;

        let parsedLead = '';
        try {
            if (post.content.trim().startsWith('{')) {
                const parsed = JSON.parse(post.content);
                parsedLead = parsed.lead || '';
            }
        } catch {}
        if (!parsedLead && !post.content.trim().startsWith('{')) {
            parsedLead = post.content;
        }

        return {
            id: post.id,
            title: post.title,
            pub_date: post.createdAt,
            source: 'ZINSIGHT_MAGAZINE',
            url: link,
            summary: post.summary || parsedLead,
            keywords: [],
            isMagazine: true,
        };
    });

    // 중복 제거 후 날짜 정렬 (company_articles와 ingestions 간 중복 가능)
    const seenIds = new Set<number>();
    const allExternal = [...externalArticles, ...orgIngestionArticles].filter((a) => {
        if (seenIds.has(a.id)) return false;
        seenIds.add(a.id);
        return true;
    });

    const combinedArticles = [...allExternal, ...magazineArticles]
        .sort((a, b) => {
            const dateA = a.pub_date ? new Date(a.pub_date).getTime() : 0;
            const dateB = b.pub_date ? new Date(b.pub_date).getTime() : 0;
            return dateB - dateA;
        })
        .slice(0, 10);

    return {
        id: company.id,
        company_name: company.company_name,
        slug: company.slug ?? null,
        aliases: company.aliases,
        entity_type: company.entity_type,
        business_summary: company.business_summary,
        core_keywords: company.core_keywords,
        region: company.region ?? null,
        recentArticles: combinedArticles,
        articleCount: company._count.company_articles + company._count.magazinePosts,
        company_url: company.company_url,
        founded_year: company.founded_year,
        hq_location: company.hq_location,
        ceo_name: company.ceo_name,
        key_references: company.key_references,
        latestArticleDate: company.company_articles[0]?.article?.pub_date ?? null,
    };
}
