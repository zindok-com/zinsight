import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Building2, Newspaper, Layers, Tag, Radar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    getRadarIndustries,
    getRadarTotalStats,
    getRadarCompanies,
    getRadarLatestArticles,
    getRadarTrendingKeywords,
} from '@/actions/insight-radar-actions';
import { RadarFilterBar } from '@/components/public/insight-radar/radar-filter-bar';
import { RadarCompanyGrid } from '@/components/public/insight-radar/radar-company-grid';
import { RadarArticleFeed } from '@/components/public/insight-radar/radar-article-feed';
import { RadarTrendingKeywords } from '@/components/public/insight-radar/radar-trending-keywords';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Insight Radar',
    description: '산업별 기업 동향과 최신 뉴스를 한눈에 확인하세요. zinsight Insight Radar.',
};

interface InsightRadarPageProps {
    searchParams: Promise<{
        industryId?: string;
        entityType?: string;
        q?: string;
        page?: string;
    }>;
}

export default async function InsightRadarPage({ searchParams }: InsightRadarPageProps) {
    const params = await searchParams;

    // URL 쿼리 파라미터 파싱
    const selectedIndustryId = params.industryId ? Number(params.industryId) : undefined;
    const selectedEntityType = params.entityType;
    const searchQuery = params.q;
    const currentPage = params.page ? Number(params.page) : 1;

    const filter = {
        industryId: selectedIndustryId,
        entityType: selectedEntityType,
        searchQuery,
    };

    // 병렬 데이터 조회 (Server Action)
    const [industries, totalStats, { companies, total, totalPages }, latestArticles, trendingKeywords] =
        await Promise.all([
            getRadarIndustries(),
            getRadarTotalStats(),
            getRadarCompanies(filter, currentPage, 12),
            getRadarLatestArticles(filter, 10),
            getRadarTrendingKeywords(selectedIndustryId, 20),
        ]);

    return (
        <div className="min-h-screen bg-background">
            {/* ──────────────────────────────────────────── */}
            {/* Hero 섹션 */}
            {/* ──────────────────────────────────────────── */}
            <section className="border-b border-border/40 bg-muted/20 px-6 py-10">
                <div className="container mx-auto max-w-screen-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Radar className="h-5 w-5" />
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight">Insight Radar</h1>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xl">
                        산업별 기업·기관 동향과 최신 뉴스를 한눈에. 필터를 활용해 원하는 분야를
                        빠르게 탐색하세요.
                    </p>

                    {/* 전체 통계 수치 */}
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatCard
                            icon={<Building2 className="h-4 w-4" />}
                            label="분석 조직"
                            value={totalStats.totalCompanies}
                            unit="개"
                        />
                        <StatCard
                            icon={<Newspaper className="h-4 w-4" />}
                            label="수집 기사"
                            value={totalStats.totalArticles}
                            unit="건"
                        />
                        <StatCard
                            icon={<Layers className="h-4 w-4" />}
                            label="산업 분야"
                            value={totalStats.totalIndustries}
                            unit="개"
                        />
                        <StatCard
                            icon={<Tag className="h-4 w-4" />}
                            label="추적 키워드"
                            value={totalStats.totalKeywords}
                            unit="개"
                        />
                    </div>
                </div>
            </section>

            {/* ──────────────────────────────────────────── */}
            {/* 메인 콘텐츠 영역 */}
            {/* ──────────────────────────────────────────── */}
            <section className="container mx-auto max-w-screen-xl px-6 py-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
                    {/* ───────────────────────── */}
                    {/* 좌측 사이드바: 필터 + 트렌딩 키워드 */}
                    {/* ───────────────────────── */}
                    <aside className="space-y-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">필터</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Suspense>
                                    <RadarFilterBar
                                        industries={industries}
                                        selectedIndustryId={selectedIndustryId}
                                        selectedEntityType={selectedEntityType}
                                        searchQuery={searchQuery}
                                    />
                                </Suspense>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-5">
                                <RadarTrendingKeywords keywords={trendingKeywords} />
                            </CardContent>
                        </Card>
                    </aside>

                    {/* ───────────────────────── */}
                    {/* 우측 메인: 기업 카드 + 최신 기사 */}
                    {/* ───────────────────────── */}
                    <div className="space-y-8">
                        {/* 기업/조직 카드 그리드 */}
                        <section aria-labelledby="companies-heading">
                            <h2
                                id="companies-heading"
                                className="mb-4 text-base font-semibold"
                            >
                                조직 목록
                            </h2>
                            <RadarCompanyGrid companies={companies} total={total} />

                            {/* 페이지네이션 (단순 링크 방식, SSR 친화적) */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    {currentPage > 1 && (
                                        <PaginationLink
                                            href={buildHref(params, currentPage - 1)}
                                            label="이전"
                                        />
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                        {currentPage} / {totalPages}
                                    </span>
                                    {currentPage < totalPages && (
                                        <PaginationLink
                                            href={buildHref(params, currentPage + 1)}
                                            label="다음"
                                        />
                                    )}
                                </div>
                            )}
                        </section>

                        <Separator />

                        {/* 최신 기사 피드 */}
                        <section aria-labelledby="articles-heading">
                            <h2
                                id="articles-heading"
                                className="mb-4 text-base font-semibold"
                            >
                                최신 기사
                            </h2>
                            <RadarArticleFeed articles={latestArticles} />
                        </section>
                    </div>
                </div>
            </section>
        </div>
    );
}

// ─────────────────────────────────────────────
// 내부 헬퍼 컴포넌트
// ─────────────────────────────────────────────

function StatCard({
    icon,
    label,
    value,
    unit,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    unit: string;
}) {
    return (
        <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                {icon}
                {label}
            </div>
            <p className="text-2xl font-bold tabular-nums">
                {value.toLocaleString()}
                <span className="ml-0.5 text-sm font-normal text-muted-foreground">{unit}</span>
            </p>
        </div>
    );
}

function PaginationLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
            {label}
        </a>
    );
}

/**
 * 현재 쿼리 파라미터를 유지한 채 page 값만 변경한 URL을 생성합니다.
 */
function buildHref(
    params: Record<string, string | undefined>,
    page: number
): string {
    const searchParams = new URLSearchParams();
    if (params.industryId) searchParams.set('industryId', params.industryId);
    if (params.entityType) searchParams.set('entityType', params.entityType);
    if (params.q) searchParams.set('q', params.q);
    searchParams.set('page', String(page));
    return `/insight-radar?${searchParams.toString()}`;
}
