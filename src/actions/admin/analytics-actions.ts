'use server';

import { prisma } from '@/lib/db';
import {
    getArticlePageviews,
    getArticleEventCounts,
    getTrafficSource,
    getVisitorGeography,
    type DateRange,
} from '@/lib/analytics/ga4-client';
import { getPagePerformance, getSearchAppearanceBreakdown } from '@/lib/analytics/gsc-client';

export async function getDashboardAnalytics(periodDays: number = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - periodDays + 1);

    // 1. DAU 추이
    const visitorLogs = await prisma.visitorLog.groupBy({
        by: ['date'],
        where: {
            date: {
                gte: startDate,
                lte: today
            }
        },
        _count: {
            visitorId: true
        }
    });

    const dauData = visitorLogs.map(log => ({
        date: log.date.toISOString().split('T')[0],
        dau: log._count.visitorId
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 2. 일별 노출수 및 조회수 추이
    const postAnalytics = await prisma.postDailyAnalytics.groupBy({
        by: ['date'],
        where: {
            date: {
                gte: startDate,
                lte: today
            }
        },
        _sum: {
            impressions: true,
            rawViews: true,
            uniqueViews: true
        }
    });

    const performanceData = postAnalytics.map(log => ({
        date: log.date.toISOString().split('T')[0],
        impressions: log._sum.impressions || 0,
        views: log._sum.rawViews || 0,
        uniqueViews: log._sum.uniqueViews || 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 3. 누적 합계 (Top level metrics)
    const totalDau = visitorLogs.reduce((sum, log) => sum + log._count.visitorId, 0);
    const totalImpressions = performanceData.reduce((sum, log) => sum + log.impressions, 0);
    const totalViews = performanceData.reduce((sum, log) => sum + log.views, 0);
    
    // CTR 계산 (조회수 / 노출수 * 100)
    const avgCtr = totalImpressions > 0 ? ((totalViews / totalImpressions) * 100).toFixed(2) : 0;

    return {
        dauData,
        performanceData,
        summary: {
            totalDau,
            totalImpressions,
            totalViews,
            avgCtr: Number(avgCtr)
        }
    };
}

export async function getPostsWithAnalytics() {
    const posts = await prisma.magazinePost.findMany({
        where: {
            deletedAt: null
        },
        include: {
            author: true,
            category: true,
            analytics: {
                select: {
                    impressions: true,
                    rawViews: true,
                    uniqueViews: true,
                }
            },
            region: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return posts.map(post => {
        const totalImpressions = post.analytics.reduce((sum, a) => sum + a.impressions, 0);
        const totalRawViews = post.analytics.reduce((sum, a) => sum + a.rawViews, 0);
        const totalUniqueViews = post.analytics.reduce((sum, a) => sum + a.uniqueViews, 0);
        
        const views = Math.max(post.viewCount, totalRawViews);
        const ctr = totalImpressions > 0 ? ((views / totalImpressions) * 100).toFixed(2) : '0.00';

        return {
            ...post,
            authorName: post.author?.name || post.authorName,
            views,
            uniqueViews: totalUniqueViews,
            impressions: totalImpressions,
            ctr: Number(ctr)
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
            analytics: true,
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

    // 자체 DB 집계
    const totalRawViews = post.analytics.reduce((s, a) => s + a.rawViews, 0);
    const totalUniqueViews = post.analytics.reduce((s, a) => s + a.uniqueViews, 0);
    const totalImpressions = post.analytics.reduce((s, a) => s + a.impressions, 0);

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

    const views = pageviews?.reduce((s, r) => s + r.views, 0) ?? totalRawViews;
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
            uniqueViews: totalUniqueViews,
            impressions: totalImpressions,
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
