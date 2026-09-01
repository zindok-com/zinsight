'use server';

import { prisma } from '@/lib/db';
import {
    getArticlePageviews,
    getArticleEventCounts,
    getTrafficSource,
    getVisitorGeography,
    getGlobalDashboardStats,
    type DateRange,
} from '@/lib/analytics/ga4-client';
import { getPagePerformance, getSearchAppearanceBreakdown } from '@/lib/analytics/gsc-client';

export async function getDashboardAnalytics(periodDays: number = 7) {
    const dateRange = buildDateRange(periodDays);
    const ga4Data = await getGlobalDashboardStats(dateRange);

    if (ga4Data && ga4Data.dailyData.length > 0) {
        const dauData = ga4Data.dailyData.map((d) => ({
            date: d.date,
            dau: d.dau,
        }));
        const performanceData = ga4Data.dailyData.map((d) => ({
            date: d.date,
            impressions: d.sessions, // 세션수
            views: d.views, // 페이지뷰
            uniqueViews: d.dau, // 활성 사용자수
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

    // GA4 연결 전 fallback
    return {
        dauData: [],
        performanceData: [],
        summary: {
            totalDau: 0,
            totalImpressions: 0,
            totalViews: 0,
            avgCtr: 0,
        },
    };
}

export async function getPostsWithAnalytics() {
    const posts = await prisma.magazinePost.findMany({
        where: {
            deletedAt: null,
        },
        include: {
            author: true,
            category: true,
            region: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return posts.map((post) => {
        return {
            ...post,
            authorName: post.author?.name || post.authorName,
            views: post.viewCount || 0,
            uniqueViews: 0,
            impressions: 0,
            ctr: 0,
        };
    });
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

// ── 기사 통합 애널리틱스 ─────────────────────────────────────────
export async function getArticleAnalyticsSummary(
    postId: number,
    periodDays: number | 'all' = 30,
) {
    const post = await prisma.magazinePost.findUnique({
        where: { id: postId },
        include: {
            category: true,
            region: true,
        },
    });
    if (!post) return null;

    const dateRange = buildDateRange(periodDays);
    const gscDateRange = buildGscDateRange(periodDays);
    const isLocal = post.category?.isLocal && post.region;
    const pageUrl = isLocal
        ? `https://zinsight.co.kr/magazine/local/${post.region?.slug}/${post.slug}`
        : `https://zinsight.co.kr/magazine/tech-marketing/${post.slug}`;

    // GA4·GSC 병렬 호출 (실패해도 null 반환, graceful)
    const [pageviews, radarClicks, outboundClicks, trafficSources, geography, gscPerf, gscAppearance] =
        await Promise.all([
            getArticlePageviews(post.slug, dateRange),
            getArticleEventCounts(post.slug, 'radar_profile_click', dateRange),
            getArticleEventCounts(post.slug, 'outbound_link_click', dateRange),
            getTrafficSource(post.slug, dateRange),
            getVisitorGeography(post.slug, dateRange),
            getPagePerformance(post.slug, gscDateRange),
            getSearchAppearanceBreakdown(post.slug, gscDateRange),
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
            uniqueViews: views,
            impressions: gscPerf?.impressions ?? 0,
            radarClicks: radarClicks ?? null,
            outboundClicks: outboundClicks ?? null,
            conversionRate,
        },
        pageviews: pageviews ?? [],
        trafficSources: trafficSources ?? [],
        geography: geography ?? [],
        gsc: gscPerf,
        gscAppearance: gscAppearance ?? [],
    };
}

// ── 기사 전환 퍼널 ────────────────────────────────────────────────
export async function getArticleFunnel(postId: number, periodDays: number | 'all' = 30) {
    const post = await prisma.magazinePost.findUnique({
        where: { id: postId },
        select: { slug: true, viewCount: true },
    });
    const dateRange = buildDateRange(periodDays);
    const [radarClicks] = await Promise.all([
        getArticleEventCounts(post?.slug || String(postId), 'radar_profile_click', dateRange),
    ]);
    const views = post?.viewCount ?? 0;
    const radar = radarClicks ?? 0;
    return {
        views,
        radarClicks: radar,
        conversionRate: views > 0 ? Math.round((radar / views) * 10000) / 100 : 0,
    };
}

// ── 조직 프로필 애널리틱스 ───────────────────────────────────────
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

    const [profileViews, outboundClicks, geography] = await Promise.all([
        getArticlePageviews(orgIdentifier, dateRange),
        getArticleEventCounts(orgIdentifier, 'outbound_link_click', dateRange),
        getVisitorGeography(orgIdentifier, dateRange),
    ]);

    const linkedArticles = org.magazinePosts.map((mo: { magazinePost: { id: number; title: string; slug: string; viewCount: number } }) => mo.magazinePost);

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
            outboundClicks: outboundClicks ?? null,
        },
        pageviews: profileViews ?? [],
        geography: geography ?? [],
        linkedArticles,
    };
}
