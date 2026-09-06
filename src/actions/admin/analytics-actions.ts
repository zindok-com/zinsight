'use server';

import { prisma } from '@/lib/db';
import * as cheerio from 'cheerio';
import {
    getArticlePageviews,
    getArticleEventCounts,
    getTrafficSourceDetailed,
    getVisitorAttributes,
    getVisitorGeography,
    getGlobalDashboardStats,
    getOutboundLinkClicksByUrl,
    type DateRange,
} from '@/lib/analytics/ga4-client';
import {
    getPagePerformance,
    getSearchAppearanceBreakdown,
    getGenerativeAIPerformance,
} from '@/lib/analytics/gsc-client';

// ── 링크 추출 헬퍼 (cheerio HTML 파서) ───────────────────────────
function extractExternalLinks(htmlContent: string): string[] {
    if (!htmlContent) return [];
    const $ = cheerio.load(htmlContent);
    const links: string[] = [];
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        if (
            (href.startsWith('http://') || href.startsWith('https://')) &&
            !href.includes('zinsight.co.kr')
        ) {
            links.push(href);
        }
    });
    return [...new Set(links)];
}


// ── 날짜 범위 헬퍼 ────────────────────────────────────────────────
function buildDateRange(periodDays: number | 'all'): DateRange {
    const end = new Date();
    const endDate = end.toISOString().split('T')[0];
    if (periodDays === 'all') return { startDate: '2024-01-01', endDate };
    const start = new Date();
    start.setDate(end.getDate() - (periodDays - 1));
    return { startDate: start.toISOString().split('T')[0], endDate };
}

function buildGscDateRange(periodDays: number | 'all'): DateRange {
    const now = new Date();
    const end = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const endDate = end.toISOString().split('T')[0];
    if (periodDays === 'all') return { startDate: '2024-01-01', endDate };
    const start = new Date(end.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);
    return { startDate: start.toISOString().split('T')[0], endDate };
}

// ── 전체 대시보드 통계 ────────────────────────────────────────────
export async function getDashboardAnalytics(periodDays: number = 7) {
    const dateRange = buildDateRange(periodDays);
    const ga4Data = await getGlobalDashboardStats(dateRange);

    if (ga4Data && ga4Data.dailyData.length > 0) {
        const dauData = ga4Data.dailyData.map((d) => ({ date: d.date, dau: d.dau }));
        const performanceData = ga4Data.dailyData.map((d) => ({
            date: d.date,
            impressions: d.sessions,
            views: d.views,
            uniqueViews: d.dau,
        }));
        return {
            dauData,
            performanceData,
            summary: {
                totalDau: ga4Data.summary.totalDau,
                totalImpressions: ga4Data.summary.totalSessions,
                totalViews: ga4Data.summary.totalViews,
                avgCtr: 0,
            },
        };
    }

    return {
        dauData: [],
        performanceData: [],
        summary: { totalDau: 0, totalImpressions: 0, totalViews: 0, avgCtr: 0 },
    };
}

// ── 포스트 목록 (GA4/GSC 데이터 없이 DB 기반, 목록 UI용) ─────────
// NOTE: ViewTracker 삭제로 viewCount는 더 이상 갱신되지 않는 레거시 값임.
//       기사 목록 UI에서는 표시하지 않는 것을 권장하며, 이 함수는 기본 메타만 반환.
export async function getPostsWithAnalytics() {
    const posts = await prisma.magazinePost.findMany({
        where: { deletedAt: null },
        include: { author: true, category: true, region: true },
        orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => ({
        ...post,
        authorName: post.author?.name || post.authorName,
    }));
}

// ── 기사 성과 순위표 (F-12) ───────────────────────────────────────
export async function getRecentArticlesLeaderboard(periodDays: number = 30, limit: number = 50) {
    // 1. 최근 발행 기사 목록 추출
    const recentPosts = await prisma.magazinePost.findMany({
        where: { deletedAt: null, status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, title: true, slug: true, createdAt: true },
    });

    const dateRange = buildDateRange(periodDays);

    // 2. 병렬로 GA4 pageviews, radarClicks 조회
    const leaderboard = await Promise.all(
        recentPosts.map(async (post) => {
            const [pvs, radarClicks] = await Promise.all([
                getArticlePageviews(post.slug, dateRange),
                getArticleEventCounts(post.slug, 'radar_profile_click', dateRange),
            ]);
            const views = pvs?.reduce((s, r) => s + r.views, 0) ?? 0;
            return {
                id: post.id,
                title: post.title,
                slug: post.slug,
                publishedAt: post.createdAt, // UI 호환성을 위해 이름 유지
                views,
                radarClicks: radarClicks ?? 0,
            };
        })
    );

    // 3. 조회수 기준 내림차순 정렬
    leaderboard.sort((a, b) => b.views - a.views);
    return leaderboard;
}


// ── 기사 통합 애널리틱스 (F-08/F-13/F-05/F-02 포함) ────────────────
export async function getArticleAnalyticsSummary(
    postId: number,
    periodDays: number | 'all' = 30,
) {
    const post = await prisma.magazinePost.findUnique({
        where: { id: postId },
        include: {
            category: true,
            region: true,
            organizations: {
                include: {
                    organization: {
                        select: { id: true, company_name: true, slug: true },
                    },
                },
            },
        },
    });
    if (!post) return null;


    const dateRange = buildDateRange(periodDays);
    const gscDateRange = buildGscDateRange(periodDays);
    const isLocal = post.category?.isLocal && post.region;
    const pageUrl = isLocal
        ? `https://zinsight.co.kr/magazine/local/${post.region?.slug}/${post.slug}`
        : `https://zinsight.co.kr/magazine/tech-marketing/${post.slug}`;

    // content HTML에서 외부 링크 추출 (cheerio)
    const registeredLinks = extractExternalLinks(post.content ?? '');

    // GA4·GSC 병렬 호출 (에러 격리: 개별 지표 실패가 전체 화면을 중단시키지 않음)
    const [
        pageviews,
        radarClicks,
        outboundClicks,
        trafficSources,
        geography,
        visitorAttributes,
        gscPerf,
        gscAppearance,
        gscGenerativeAI,
        outboundLinkClicks,
    ] = await Promise.all([
        getArticlePageviews(post.slug, dateRange).catch((err) => {
            console.error('[analytics] getArticlePageviews failed:', err?.message, err?.stack);
            return null;
        }),
        getArticleEventCounts(post.slug, 'radar_profile_click', dateRange).catch((err) => {
            console.error('[analytics] radar_profile_click failed:', err?.message, err?.stack);
            return null;
        }),
        getArticleEventCounts(post.slug, 'outbound_link_click', dateRange).catch((err) => {
            console.error('[analytics] outbound_link_click failed:', err?.message, err?.stack);
            return null;
        }),
        getTrafficSourceDetailed(post.slug, dateRange).catch((err) => {
            console.error('[analytics] getTrafficSourceDetailed failed:', err?.message, err?.stack);
            return [];
        }),
        getVisitorGeography(post.slug, dateRange).catch((err) => {
            console.error('[analytics] getVisitorGeography failed:', err?.message, err?.stack);
            return null;
        }),
        getVisitorAttributes(post.slug, dateRange).catch((err) => {
            console.error('[analytics] getVisitorAttributes failed:', err?.message, err?.stack);
            return { devices: [], hours: [], newVsReturning: [], browsers: [] };
        }),
        getPagePerformance(post.slug, gscDateRange).catch((err) => {
            console.error('[analytics] getPagePerformance failed:', err?.message, err?.stack);
            return null;
        }),
        getSearchAppearanceBreakdown(post.slug, gscDateRange).catch((err) => {
            console.error('[analytics] getSearchAppearanceBreakdown failed:', err?.message, err?.stack);
            return null;
        }),
        getGenerativeAIPerformance(post.slug, gscDateRange).catch((err) => {
            console.error('[analytics] getGenerativeAIPerformance failed:', err?.message, err?.stack);
            return null;
        }),
        getOutboundLinkClicksByUrl(post.slug, dateRange).catch((err) => {
            console.error('[analytics] getOutboundLinkClicksByUrl failed:', err?.message, err?.stack);
            return [];
        }),
    ]);

    const views = pageviews?.reduce((s, r) => s + r.views, 0) ?? 0;
    const conversionRate =
        views > 0 && radarClicks != null
            ? Math.round((radarClicks / views) * 10000) / 100
            : null;

    // F-02: 등록 링크와 GA4 클릭수 LEFT JOIN (null-safe)
    const safeOutboundLinkClicks = outboundLinkClicks ?? [];
    const linkClickMap = new Map(safeOutboundLinkClicks.map((r) => [r.url, r.clicks]));
    const outboundLinkTable = registeredLinks.map((url) => {
        let domain = '';
        try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { domain = url; }
        return {
            url,
            domain,
            clicks: linkClickMap.get(url) ?? 0,
        };
    });
    // GA4에 기록된 링크 중 content에 없는 것도 추가 (삭제된 링크 이력 보존)
    for (const row of safeOutboundLinkClicks) {
        if (!outboundLinkTable.find((r) => r.url === row.url)) {
            outboundLinkTable.push({ ...row });
        }
    }
    outboundLinkTable.sort((a, b) => b.clicks - a.clicks);


    const linkedOrganizations = (post.organizations ?? [])
        .map((po) => po.organization)
        .filter(Boolean)
        .map((org) => ({
            id: org.id,
            name: org.company_name,
            slug: org.slug,
        }));

    return {
        post: {
            id: post.id,
            title: post.title,
            slug: post.slug,
            pageUrl,
            category: post.category?.name,
            region: post.region?.name,
        },
        linkedOrganizations,                // 연동된 조직 목록 (조직 애널리틱스 바로가기용)
        dateRange,
        summary: {
            views,
            impressions: gscPerf?.impressions ?? 0,
            radarClicks: radarClicks ?? null,
            outboundClicks: outboundClicks ?? null,
            conversionRate,
        },
        pageviews: pageviews ?? [],
        trafficSources,
        geography: geography ?? [],
        visitorAttributes,
        gsc: gscPerf,
        gscAppearance: gscAppearance ?? [],
        gscGenerativeAI,
        outboundLinkTable,                  // F-02: 링크별 클릭 상세
    };
}



// ── 기사 전환 퍼널 (B-01 수정: DB viewCount → GA4 pageviews) ─────
export async function getArticleFunnel(postId: number, periodDays: number | 'all' = 30) {
    const post = await prisma.magazinePost.findUnique({
        where: { id: postId },
        select: { slug: true },
    });
    const dateRange = buildDateRange(periodDays);
    const slug = post?.slug ?? String(postId);
    const [pvs, radarClicks] = await Promise.all([
        getArticlePageviews(slug, dateRange),
        getArticleEventCounts(slug, 'radar_profile_click', dateRange),
    ]);
    const views = pvs?.reduce((s, r) => s + r.views, 0) ?? 0;
    const radar = radarClicks ?? 0;
    return {
        views,
        radarClicks: radar,
        conversionRate: views > 0 ? Math.round((radar / views) * 10000) / 100 : 0,
    };
}

// ── 조직 프로필 애널리틱스 (F-08/F-13/F-02 포함, B-03 수정) ──────────
export async function getOrgAnalyticsSummary(orgId: number, periodDays: number | 'all' = 30) {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            region: true,
            magazinePosts: {
                include: {
                    magazinePost: { select: { id: true, title: true, slug: true, viewCount: true } },
                },
            },
        },
    });
    if (!org) return null;

    const dateRange = buildDateRange(periodDays);
    const orgIdentifier = org.slug || String(org.id);
    const pageUrl = `https://zinsight.co.kr/insight-radar/${orgIdentifier}`;

    // F-02: 조직 등록 링크 수집 (company_url + backlinks JSON)
    const orgLinks: string[] = [];
    if (org.company_url) orgLinks.push(org.company_url);
    if (org.backlinks && Array.isArray(org.backlinks)) {
        for (const bl of org.backlinks as { title?: string; url?: string }[]) {
            if (bl.url && (bl.url.startsWith('http://') || bl.url.startsWith('https://'))) {
                orgLinks.push(bl.url);
            }
        }
    }

    // GA4 병렬 호출 (에러 격리)
    const [
        profileViews,
        outboundClicks,
        articleClicksFromProfile,
        geography,
        trafficSources,
        visitorAttributes,
        outboundLinkClicks,
        linkedArticlesWithClicks,
    ] = await Promise.all([
        getArticlePageviews(orgIdentifier, dateRange).catch((err) => {
            console.error('[analytics-org] getArticlePageviews failed:', err?.message, err?.stack);
            return null;
        }),
        getArticleEventCounts(orgIdentifier, 'outbound_link_click', dateRange).catch((err) => {
            console.error('[analytics-org] outbound_link_click failed:', err?.message, err?.stack);
            return null;
        }),
        getArticleEventCounts(orgIdentifier, 'magazine_article_click', dateRange).catch((err) => {
            console.error('[analytics-org] magazine_article_click failed:', err?.message, err?.stack);
            return null;
        }),
        getVisitorGeography(orgIdentifier, dateRange).catch((err) => {
            console.error('[analytics-org] getVisitorGeography failed:', err?.message, err?.stack);
            return null;
        }),
        getTrafficSourceDetailed(orgIdentifier, dateRange).catch((err) => {
            console.error('[analytics-org] getTrafficSourceDetailed failed:', err?.message, err?.stack);
            return [];
        }),
        getVisitorAttributes(orgIdentifier, dateRange).catch((err) => {
            console.error('[analytics-org] getVisitorAttributes failed:', err?.message, err?.stack);
            return { devices: [], hours: [], newVsReturning: [], browsers: [] };
        }),
        getOutboundLinkClicksByUrl(orgIdentifier, dateRange).catch((err) => {
            console.error('[analytics-org] getOutboundLinkClicksByUrl failed:', err?.message, err?.stack);
            return [];
        }),
        Promise.all(
            org.magazinePosts.map(async (mo: { magazinePost: { id: number; title: string; slug: string; viewCount: number } }) => {
                const post = mo.magazinePost;
                const [pvs, inboundClicks] = await Promise.all([
                    getArticlePageviews(post.slug, dateRange).catch(() => null),
                    getArticleEventCounts(post.slug, 'radar_profile_click', dateRange).catch(() => 0),
                ]);
                const views = pvs?.reduce((s, r) => s + r.views, 0) ?? post.viewCount;
                return {
                    id: post.id,
                    title: post.title,
                    slug: post.slug,
                    viewCount: views,
                    inboundClicks: inboundClicks ?? 0,
                };
            })
        ).catch((err) => {
            console.error('[analytics-org] linkedArticles failed:', err);
            return [];
        }),
    ]);

    const safeArticles = linkedArticlesWithClicks ?? [];
    const totalInboundFromArticles = safeArticles.reduce((sum, a) => sum + a.inboundClicks, 0);

    // F-02: 등록 링크와 GA4 클릭수 LEFT JOIN (null-safe)
    const safeOutboundLinkClicks = outboundLinkClicks ?? [];
    const linkClickMap = new Map(safeOutboundLinkClicks.map((r) => [r.url, r.clicks]));
    const outboundLinkTable = orgLinks.map((url) => {
        let domain = '';
        try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { domain = url; }
        return { url, domain, clicks: linkClickMap.get(url) ?? 0 };
    });
    for (const row of safeOutboundLinkClicks) {
        if (!outboundLinkTable.find((r) => r.url === row.url)) {
            outboundLinkTable.push({ ...row });
        }
    }
    outboundLinkTable.sort((a, b) => b.clicks - a.clicks);


    return {
        org: {
            id: org.id,
            name: org.company_name,
            slug: org.slug,
            pageUrl,
            regionName: org.region?.name ?? null,
            isFeatured: org.is_featured ?? false,
        },
        dateRange,
        summary: {
            profileViews: profileViews?.reduce((s, r) => s + r.views, 0) ?? null,
            inboundFromArticles: totalInboundFromArticles,
            outboundClicks: outboundClicks ?? null,
            articleClicksFromProfile: articleClicksFromProfile ?? null,
        },
        pageviews: profileViews ?? [],
        geography: geography ?? [],
        trafficSources,
        visitorAttributes,
        outboundLinkTable,               // F-02: 링크별 클릭 상세
        linkedArticles: linkedArticlesWithClicks,
    };
}


// ── 리포트 스냅샷 저장 (F-11-A) ──────────────────────────────────
export async function saveAnalyticsReport({
    entityType,
    entityId,
    entityName,
    reportType,
    periodDays,
    dataSnapshot,
}: {
    entityType: 'article' | 'organization';
    entityId: number;
    entityName: string;
    reportType: 'simple' | 'detailed';
    periodDays: number;
    dataSnapshot: object;
}) {
    return prisma.analyticsReport.create({
        data: {
            entityType,
            entityId,
            entityName,
            reportType,
            periodDays,
            dataSnapshot,
        },
    });
}

// ── 리포트 이력 조회 (F-11-A) ────────────────────────────────────
export async function getAnalyticsReports(options?: {
    entityType?: 'article' | 'organization';
    entityId?: number;
    limit?: number;
}) {
    return prisma.analyticsReport.findMany({
        where: {
            ...(options?.entityType ? { entityType: options.entityType } : {}),
            ...(options?.entityId ? { entityId: options.entityId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        select: {
            id: true,
            entityType: true,
            entityId: true,
            entityName: true,
            reportType: true,
            periodDays: true,
            createdAt: true,
            // dataSnapshot은 기본적으로 제외 (목록 UI에서는 불필요)
        },
    });
}

// ── 리포트 스냅샷 단건 조회 (다시 보기용) ──────────────────────────
export async function getAnalyticsReportById(id: number) {
    return prisma.analyticsReport.findUnique({
        where: { id },
    });
}

