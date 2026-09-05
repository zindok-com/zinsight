'use server';

import { prisma } from '@/lib/db';
import {
    getArticlePageviews,
    getArticleEventCounts,
    getTrafficSourceDetailed,
    getVisitorAttributes,
    getVisitorGeography,
    getGlobalDashboardStats,
    type DateRange,
} from '@/lib/analytics/ga4-client';
import {
    getPagePerformance,
    getSearchAppearanceBreakdown,
    getGenerativeAIPerformance,
} from '@/lib/analytics/gsc-client';

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

// ── 기사 통합 애널리틱스 (F-08/F-13/F-05 포함) ───────────────────
export async function getArticleAnalyticsSummary(
    postId: number,
    periodDays: number | 'all' = 30,
) {
    const post = await prisma.magazinePost.findUnique({
        where: { id: postId },
        include: { category: true, region: true },
    });
    if (!post) return null;

    const dateRange = buildDateRange(periodDays);
    const gscDateRange = buildGscDateRange(periodDays);
    const isLocal = post.category?.isLocal && post.region;
    const pageUrl = isLocal
        ? `https://zinsight.co.kr/magazine/local/${post.region?.slug}/${post.slug}`
        : `https://zinsight.co.kr/magazine/tech-marketing/${post.slug}`;

    // GA4·GSC 병렬 호출
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
    ] = await Promise.all([
        getArticlePageviews(post.slug, dateRange),
        getArticleEventCounts(post.slug, 'radar_profile_click', dateRange),
        getArticleEventCounts(post.slug, 'outbound_link_click', dateRange),
        getTrafficSourceDetailed(post.slug, dateRange),           // F-08
        getVisitorGeography(post.slug, dateRange),
        getVisitorAttributes(post.slug, dateRange),               // F-13
        getPagePerformance(post.slug, gscDateRange),
        getSearchAppearanceBreakdown(post.slug, gscDateRange),
        getGenerativeAIPerformance(post.slug, gscDateRange),      // F-05
    ]);

    const views = pageviews?.reduce((s, r) => s + r.views, 0) ?? 0;
    const conversionRate =
        views > 0 && radarClicks != null
            ? Math.round((radarClicks / views) * 10000) / 100
            : null;

    return {
        post: {
            id: post.id,
            title: post.title,
            slug: post.slug,
            pageUrl,
            category: post.category?.name,
            region: post.region?.name,
        },
        dateRange,
        summary: {
            views,
            impressions: gscPerf?.impressions ?? 0,
            radarClicks: radarClicks ?? null,
            outboundClicks: outboundClicks ?? null,
            conversionRate,
        },
        pageviews: pageviews ?? [],
        trafficSources,                 // ChannelRow[] (F-08)
        geography: geography ?? [],
        visitorAttributes,              // VisitorAttributes (F-13)
        gsc: gscPerf,
        gscAppearance: gscAppearance ?? [],
        gscGenerativeAI,                // GenerativeAIPerformance | null (F-05)
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

// ── 조직 프로필 애널리틱스 (F-08/F-13 포함, B-03 수정) ─────────────
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

    const [
        profileViews,
        outboundClicks,
        articleClicksFromProfile,
        geography,
        trafficSources,     // F-08 B-03
        visitorAttributes,  // F-13
        linkedArticlesWithClicks,
    ] = await Promise.all([
        getArticlePageviews(orgIdentifier, dateRange),
        getArticleEventCounts(orgIdentifier, 'outbound_link_click', dateRange),
        getArticleEventCounts(orgIdentifier, 'magazine_article_click', dateRange),
        getVisitorGeography(orgIdentifier, dateRange),
        getTrafficSourceDetailed(orgIdentifier, dateRange),      // F-08 B-03
        getVisitorAttributes(orgIdentifier, dateRange),          // F-13
        Promise.all(
            org.magazinePosts.map(async (mo: { magazinePost: { id: number; title: string; slug: string; viewCount: number } }) => {
                const post = mo.magazinePost;
                const [pvs, inboundClicks] = await Promise.all([
                    getArticlePageviews(post.slug, dateRange),
                    getArticleEventCounts(post.slug, 'radar_profile_click', dateRange),
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
        ),
    ]);

    const totalInboundFromArticles = linkedArticlesWithClicks.reduce((sum, a) => sum + a.inboundClicks, 0);

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
        trafficSources,          // ChannelRow[] (F-08)
        visitorAttributes,       // VisitorAttributes (F-13)
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

