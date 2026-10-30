'use server';

import { prisma } from '@/lib/db';
import { parseRadarKeywords, type RadarSort } from '@/lib/radar';

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
    logo_url?: string | null;
    logo_source_url?: string | null;
    founded_year?: string | null;
    tagline?: string | null;
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
    logo_url?: string | null;
    logo_source_url?: string | null;
    founded_year?: string | null;
    hq_location?: string | null;
    ceo_name?: string | null;
    key_references?: any | null;
    backlinks?: any | null;
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
    /** 매거진 대표 이미지 (외부 기사는 없음) */
    thumbnailUrl?: string | null;
}

export interface RadarFilterOptions {
    regionId?: number;
    entityType?: string;
    searchQuery?: string;
    sort?: RadarSort;
}

export interface RadarSimilarCompany {
    id: number;
    company_name: string;
    slug: string | null;
    entity_type: string | null;
    logo_url: string | null;
    regionName: string | null;
    /** 겹치는 키워드 (최대 2개, 표시용) */
    sharedKeywords: string[];
}

// ─────────────────────────────────────────────
// 지역 목록 조회 (사이드바/필터용)
// ─────────────────────────────────────────────

// 서버 액션은 클라이언트가 임의 인자로 직접 호출할 수 있으므로 조회 개수·페이지를 서버에서 제한
function clampInt(value: unknown, min: number, max: number, fallback: number): number {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
}

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
    const [totalCompanies, totalArticles, totalRegions, totalMagazinePosts] = await Promise.all([
        prisma.organization.count(),
        prisma.article.count(),
        prisma.region.count({ where: { isActive: true } }),
        prisma.magazinePost.count({ where: { status: 'PUBLISHED', deletedAt: null } })
    ]);

    return { totalCompanies, totalArticles, totalRegions, totalMagazinePosts };
}

// ─────────────────────────────────────────────
// 기업 카드 목록 조회 (지역/검색어 필터)
// ─────────────────────────────────────────────

export async function getRadarCompanies(
    filter: RadarFilterOptions = {},
    page = 1,
    pageSize = 12
): Promise<{ companies: RadarCompanyCard[]; total: number; totalPages: number }> {
    page = clampInt(page, 1, 10_000, 1);
    pageSize = clampInt(pageSize, 1, 50, 12);
    const { regionId, entityType } = filter;
    const searchQuery = filter.searchQuery?.slice(0, 100);

    const where: any = {
        ...(regionId ? { region_id: regionId } : {}),
        ...(entityType ? { entity_type: entityType } : {}),
        ...(searchQuery
            ? {
                  OR: [
                      { company_name: { contains: searchQuery } },
                      { business_summary: { contains: searchQuery } },
                      { hq_location: { contains: searchQuery } },
                      { aliases: { string_contains: searchQuery } },
                      { core_keywords: { string_contains: searchQuery } },
                      { region: { name: { contains: searchQuery } } },
                  ],
              }
            : {}),
    };

    // 정렬 기준(최근 활동·기사 수)이 관계 집계라 DB 정렬이 어려움 → 조건에 맞는 조직을 모두 받아 정렬 후 페이지 분할
    // (등록 조직 수가 수백 곳 이내인 동안 유효. 그 이상이 되면 집계 컬럼 도입 검토)
    const publishedPost = { magazinePost: { status: 'PUBLISHED' as const, deletedAt: null } };
    const rawCompanies = await prisma.organization.findMany({
        where,
        select: {
            id: true,
            company_name: true,
            slug: true,
            entity_type: true,
            business_summary: true,
            core_keywords: true,
            hq_location: true,
            logo_url: true,
            logo_source_url: true,
            founded_year: true,
            tagline: true,
            is_featured: true,
            created_at: true,
            region: { select: { id: true, name: true, slug: true } },
            company_articles: {
                select: { article: { select: { pub_date: true } } },
                orderBy: { article: { pub_date: 'desc' } },
                take: 1,
            },
            magazinePosts: {
                where: publishedPost,
                select: { magazinePost: { select: { publishedAt: true, createdAt: true } } },
                orderBy: { magazinePost: { publishedAt: 'desc' } },
                take: 1,
            },
            _count: { select: { company_articles: true, magazinePosts: { where: publishedPost } } },
        },
        orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
        take: 500,
    });

    const all: RadarCompanyCard[] = rawCompanies.map((c) => {
        const externalDate = c.company_articles[0]?.article?.pub_date ?? null;
        const post = c.magazinePosts[0]?.magazinePost;
        const magazineDate = post ? post.publishedAt ?? post.createdAt : null;
        const latest = [externalDate, magazineDate]
            .filter((d): d is Date => !!d)
            .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
        return {
            id: c.id,
            company_name: c.company_name,
            slug: c.slug ?? null,
            entity_type: c.entity_type,
            business_summary: c.business_summary,
            core_keywords: c.core_keywords,
            region: c.region ?? null,
            hq_location: c.hq_location ?? null,
            logo_url: c.logo_url ?? null,
            logo_source_url: c.logo_source_url ?? null,
            founded_year: c.founded_year ?? null,
            tagline: c.tagline ?? null,
            articleCount: c._count.company_articles + c._count.magazinePosts,
            latestArticleDate: latest,
        };
    });

    const sort = filter.sort ?? 'recent';
    if (sort === 'name') {
        all.sort((a, b) => a.company_name.localeCompare(b.company_name, 'ko'));
    } else if (sort === 'articles') {
        all.sort((a, b) => b.articleCount - a.articleCount);
    } else {
        all.sort((a, b) => (b.latestArticleDate?.getTime() ?? 0) - (a.latestArticleDate?.getTime() ?? 0));
    }

    const total = all.length;
    const companies = all.slice((page - 1) * pageSize, page * pageSize);

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
    limit = clampInt(limit, 1, 50, 10);
    const { regionId } = filter;
    const searchQuery = filter.searchQuery?.slice(0, 100);

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
    limit = clampInt(limit, 1, 50, 20);
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

    const commonInclude = {
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
            orderBy: { article: { pub_date: 'desc' as const } },
            take: 10,
        },
        magazinePosts: {
            where: {
                magazinePost: {
                    status: 'PUBLISHED' as const,
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
            orderBy: { magazinePost: { publishedAt: 'desc' as const } },
            take: 10,
        },
        _count: {
            select: {
                company_articles: true,
                magazinePosts: {
                    where: {
                        magazinePost: {
                            status: 'PUBLISHED' as const,
                            deletedAt: null,
                        },
                    },
                },
            },
        },
    };

    let company: any = null;
    try {
        company = await prisma.organization.findFirst({
            where: {
                OR: [
                    ...(isNum ? [{ id: numericId }] : []),
                    { slug: stringSlug },
                ],
            },
            include: commonInclude,
        });
    } catch {
        if (isNum) {
            company = await prisma.organization.findUnique({
                where: { id: numericId },
                include: commonInclude,
            });
        }
    }

    if (!company) return null;

    // 1. 관리자가 명시적으로 연결한 외부 기사 (CompanyArticle)
    const externalArticles = company.company_articles.map((ca: any) => ({
        id: ca.article.id,
        title: ca.article.title,
        pub_date: ca.article.pub_date,
        source: ca.article.source || 'NAVER_NEWS',
        url: ca.article.link,
        summary: ca.article.description,
        keywords: [],
        isMagazine: false,
        thumbnailUrl: null,
    }));

    // 2. 자체 매거진 포스트 기사 (MagazinePostOrganization)
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
            pub_date: post.publishedAt || post.createdAt,
            source: 'ZINSIGHT_MAGAZINE',
            url: link,
            summary: post.summary || parsedLead,
            keywords: [],
            isMagazine: true,
            thumbnailUrl: post.thumbnailUrl ?? null,
        };
    });

    // 중복 제거 후 최신순 정렬
    const seenIds = new Set<number>();
    const combinedArticles = [...magazineArticles, ...externalArticles]
        .filter((a) => {
            if (seenIds.has(a.id)) return false;
            seenIds.add(a.id);
            return true;
        })
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
        logo_url: company.logo_url ?? null,
        logo_source_url: company.logo_source_url ?? null,
        founded_year: company.founded_year,
        hq_location: company.hq_location,
        ceo_name: company.ceo_name,
        key_references: company.key_references,
        backlinks: company.backlinks,
        video_url: company.video_url ?? null,
        video_poster_url: company.video_poster_url ?? null,
        brochure_url: company.brochure_url ?? null,
        inquiry_url: company.inquiry_url ?? null,
        contact_email: company.contact_email ?? null,
        contact_phone: company.contact_phone ?? null,
        latestArticleDate: combinedArticles[0]?.pub_date ?? null,
    };
}

// ─────────────────────────────────────────────
// 유사 조직 (같은 지역 또는 핵심 키워드 겹침, 최대 3곳)
// ─────────────────────────────────────────────

export async function getRadarSimilarCompanies(
    companyId: number,
    limit = 3
): Promise<RadarSimilarCompany[]> {
    limit = clampInt(limit, 1, 6, 3);
    const candidates = await prisma.organization.findMany({
        select: {
            id: true,
            company_name: true,
            slug: true,
            entity_type: true,
            logo_url: true,
            core_keywords: true,
            region_id: true,
            region: { select: { name: true } },
        },
        take: 500,
    });
    const self = candidates.find((c) => c.id === Number(companyId));
    if (!self) return [];

    const normalize = (k: string) => k.toLowerCase().replace(/\s+/g, '');
    const selfKw = parseRadarKeywords(self.core_keywords);
    const selfSet = new Set([...selfKw.products, ...selfKw.technology, ...selfKw.target_market].map(normalize));

    return candidates
        .filter((c) => c.id !== self.id)
        .map((c) => {
            const kw = parseRadarKeywords(c.core_keywords);
            const shared = [...new Set([...kw.products, ...kw.technology, ...kw.target_market])].filter((k) =>
                selfSet.has(normalize(k))
            );
            const sameRegion = c.region_id === self.region_id;
            // 키워드 겹침을 지역 일치보다 우선 (키워드 1개 = 2점, 같은 지역 = 1점)
            return { c, shared, score: shared.length * 2 + (sameRegion ? 1 : 0) };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || a.c.company_name.localeCompare(b.c.company_name, 'ko'))
        .slice(0, limit)
        .map(({ c, shared }) => ({
            id: c.id,
            company_name: c.company_name,
            slug: c.slug ?? null,
            entity_type: c.entity_type ?? null,
            logo_url: c.logo_url ?? null,
            regionName: c.region?.name ?? null,
            sharedKeywords: shared.slice(0, 2),
        }));
}

// ─────────────────────────────────────────────
// 목록 필터용 조직 유형 목록 (등록 수 많은 순)
// ─────────────────────────────────────────────

export async function getRadarEntityTypes(): Promise<string[]> {
    const groups = await prisma.organization.groupBy({
        by: ['entity_type'],
        _count: { _all: true },
    });
    return groups
        .filter((g) => g.entity_type && g.entity_type.trim())
        .sort((a, b) => b._count._all - a._count._all || a.entity_type.localeCompare(b.entity_type, 'ko'))
        .map((g) => g.entity_type);
}
