'use server';

import { prisma } from '@/lib/db';
import {
    getGSCConnectionStatus,
    getIndexedPages,
    type IndexedPagePerformance,
    type DateRange,
} from '@/lib/analytics/gsc-client';
import { getGA4ConnectionStatus } from '@/lib/analytics/ga4-client';
import { REGION_GEO_MAP } from '@/lib/geo/region-coordinates';

// ── 날짜 범위 헬퍼 ────────────────────────────────────────────────
function buildGscDateRange(periodDays: number | 'all'): DateRange {
    const now = new Date();
    const end = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const endDate = end.toISOString().split('T')[0];
    if (periodDays === 'all') return { startDate: '2024-01-01', endDate };
    const start = new Date(end.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);
    return { startDate: start.toISOString().split('T')[0], endDate };
}

// ── SEO / GEO / AEO 통합 상태 및 API 연동 진단 조회 ───────────────
export async function getSeoMonitoringOverview() {
    // 1. API 연동 상태 병렬 점검
    const [gscStatus, ga4Status] = await Promise.all([
        getGSCConnectionStatus().catch((err) => ({
            connected: false,
            siteUrl: 'sc-domain:zinsight.co.kr',
            hasCredentials: false,
            error: err?.message,
        })),
        getGA4ConnectionStatus().catch((err) => ({
            connected: false,
            propertyId: '538324402',
            hasCredentials: false,
            error: err?.message,
        })),
    ]);

    // 2. Naver Search Advisor / API 연동 상태
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
    const naverApiStatus = {
        configured: Boolean(naverClientId && naverClientSecret),
        status: naverClientId ? 'SEARCH_API_CONNECTED' : 'NOT_CONFIGURED',
        note: '네이버 검색 API 연동 완료 (서치어드바이저는 공식 색인 API 미제공으로 웹마스터 수동 제출 관리)',
    };

    // 3. DB 콘텐츠 통계 (매거진 포스트 & 인사이트 레이더 조직)
    const [publishedPostsCount, structuredPostsCount, localPostsCount, organizationsCount, regions] =
        await Promise.all([
            prisma.magazinePost.count({
                where: { status: 'PUBLISHED', deletedAt: null },
            }),
            prisma.magazinePost.count({
                where: {
                    status: 'PUBLISHED',
                    deletedAt: null,
                    structuredData: { not: null as any },
                },
            }),
            prisma.magazinePost.count({
                where: {
                    status: 'PUBLISHED',
                    deletedAt: null,
                    regionId: { not: null },
                },
            }),
            prisma.organization.count(),
            prisma.region.findMany({
                where: { isActive: true },
                select: { id: true, name: true, slug: true },
            }),
        ]);

    // 4. GEO 좌표 맵핑 현황
    const geoStatusList = regions.map((r) => {
        const lowerSlug = r.slug.toLowerCase();
        const hasGeo = Boolean(REGION_GEO_MAP[lowerSlug]);
        const coord = REGION_GEO_MAP[lowerSlug];
        return {
            id: r.id,
            name: r.name,
            slug: r.slug,
            hasGeo,
            lat: coord?.lat ?? null,
            lng: coord?.lng ?? null,
            address: coord?.address ?? null,
        };
    });

    return {
        apiStatus: {
            gsc: gscStatus,
            ga4: ga4Status,
            naver: naverApiStatus,
        },
        contentStats: {
            publishedPostsCount,
            structuredPostsCount,
            localPostsCount,
            organizationsCount,
            aeoCoverageRate:
                publishedPostsCount > 0
                    ? Math.round((structuredPostsCount / publishedPostsCount) * 100)
                    : 100,
        },
        geoRegions: geoStatusList,
    };
}

// ── 구글 색인(노출) 페이지 목록 및 사이트맵 비교 분석 ─────────────
export async function getGoogleIndexingReport(periodDays: number | 'all' = 30) {
    const dateRange = buildGscDateRange(periodDays);

    // 1. GSC에서 노출된 페이지 목록 조회
    const indexedPages = await getIndexedPages(dateRange, 300);

    // 2. 서비스 내 실제 발행된 주요 페이지 DB 조회 (색인 여부 매칭 목적)
    const [posts, organizations] = await Promise.all([
        prisma.magazinePost.findMany({
            where: { status: 'PUBLISHED', deletedAt: null },
            select: {
                id: true,
                title: true,
                slug: true,
                publishedAt: true,
                createdAt: true,
                category: { select: { slug: true, isLocal: true } },
                region: { select: { slug: true, name: true } },
            },
            orderBy: { publishedAt: 'desc' },
        }),
        prisma.organization.findMany({
            select: {
                id: true,
                company_name: true,
                slug: true,
                region: { select: { name: true } },
            },
            take: 200,
        }),
    ]);

    // URL 정규화 매퍼
    const indexedUrlMap = new Map<string, IndexedPagePerformance>();
    for (const item of indexedPages) {
        let clean = item.pageUrl.trim().replace(/\/$/, '');
        try {
            const urlObj = new URL(clean);
            clean = urlObj.pathname.replace(/\/$/, '');
        } catch {}
        indexedUrlMap.set(clean, item);
        // 슬러그 단독 매칭도 지원
        const parts = clean.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart) {
            indexedUrlMap.set(lastPart, item);
        }
    }

    // 3. 기사별 색인 여부 매칭
    const articleIndexReport = posts.map((post) => {
        const isLocal = post.category?.isLocal;
        const localPath = `/magazine/local/${post.region?.slug || 'unknown'}/${post.slug}`;
        const techPath = `/magazine/tech-marketing/${post.slug}`;
        const targetPath = isLocal ? localPath : techPath;

        const gscData = indexedUrlMap.get(targetPath) || indexedUrlMap.get(post.slug);

        return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            path: targetPath,
            category: isLocal ? '로컬 매거진' : '테크/비즈니스',
            regionName: post.region?.name ?? null,
            publishedAt: post.publishedAt || post.createdAt,
            isIndexed: Boolean(gscData && gscData.impressions > 0),
            impressions: gscData?.impressions ?? 0,
            clicks: gscData?.clicks ?? 0,
            ctr: gscData?.ctr ?? 0,
            position: gscData?.position ?? 0,
        };
    });

    // 4. 레이더 조직별 색인 매칭
    const orgIndexReport = organizations.map((org) => {
        const targetPath = `/insight-radar/${org.slug || org.id}`;
        const gscData =
            indexedUrlMap.get(targetPath) ||
            (org.slug ? indexedUrlMap.get(org.slug) : undefined) ||
            indexedUrlMap.get(String(org.id));

        return {
            id: org.id,
            name: org.company_name,
            slug: org.slug,
            path: targetPath,
            regionName: org.region?.name ?? null,
            isIndexed: Boolean(gscData && gscData.impressions > 0),
            impressions: gscData?.impressions ?? 0,
            clicks: gscData?.clicks ?? 0,
            ctr: gscData?.ctr ?? 0,
            position: gscData?.position ?? 0,
        };
    });

    const totalArticles = articleIndexReport.length;
    const indexedArticlesCount = articleIndexReport.filter((a) => a.isIndexed).length;
    const totalGscImpressions = indexedPages.reduce((sum, p) => sum + p.impressions, 0);
    const totalGscClicks = indexedPages.reduce((sum, p) => sum + p.clicks, 0);

    return {
        dateRange,
        summary: {
            totalIndexedPagesInGsc: indexedPages.length,
            totalArticles,
            indexedArticlesCount,
            indexingRate:
                totalArticles > 0
                    ? Math.round((indexedArticlesCount / totalArticles) * 100)
                    : 0,
            totalGscImpressions,
            totalGscClicks,
        },
        indexedPagesGsc: indexedPages,
        articleIndexReport,
        orgIndexReport,
    };
}
