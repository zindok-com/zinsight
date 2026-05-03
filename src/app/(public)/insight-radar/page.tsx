import { Suspense } from 'react';
import Link from 'next/link';
import {
    Building2,
    ArrowRight,
    Search,
    TrendingUp,
    Globe,
    ExternalLink,
} from 'lucide-react';
import {
    getRadarIndustries,
    getRadarTotalStats,
    getRadarCompanies,
    getRadarLatestArticles,
} from '@/actions/insight-radar-actions';
import { RadarSearchBar } from '@/components/public/insight-radar/RadarSearchBar';
import { RadarCompanyTable } from '@/components/public/insight-radar/RadarCompanyTable';

export const dynamic = 'force-dynamic';

interface PageParams {
    industryId?: string;
    entityType?: string;
    q?: string;
    page?: string;
}

export default async function InsightRadarPage({
    searchParams,
}: {
    searchParams: Promise<PageParams>;
}) {
    const params = await searchParams;
    const selectedIndustryId = params.industryId ? parseInt(params.industryId) : undefined;
    const selectedEntityType = params.entityType;
    const searchQuery = params.q;
    const currentPage = params.page ? parseInt(params.page) : 1;
    const pageSize = 15;

    // 데이터 페칭
    const [industries, totalStats, { companies, total, totalPages }, latestArticles] = await Promise.all([
        getRadarIndustries(),
        getRadarTotalStats(),
        getRadarCompanies(
            {
                industryId: selectedIndustryId,
                entityType: selectedEntityType,
                searchQuery,
            },
            currentPage,
            pageSize
        ),
        getRadarLatestArticles({ industryId: selectedIndustryId }, 5),
    ]);

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            {/* ─────────────────────────────── */}
            {/* 페이지 헤더 */}
            {/* ─────────────────────────────── */}
            <div className="mx-auto max-w-zi-container px-6 py-12">

                {/* ── 통합 검색 및 필터 섹션 ── */}
                <RadarSearchBar 
                    industries={industries} 
                    currentIndustryId={selectedIndustryId} 
                    currentQuery={searchQuery} 
                />

                {/* ── 조직 목록 테이블 (클라이언트 컴포넌트) ── */}
                <RadarCompanyTable companies={companies} />

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                        {currentPage > 1 && (
                            <Link
                                href={buildPageHref(params, currentPage - 1)}
                                className="border border-zi-outline-variant px-4 py-2 rounded-zi-btn font-ui-label text-ui-label text-zi-on-surface-variant transition-all hover:bg-white active:scale-95"
                            >
                                이전
                            </Link>
                        )}
                        <span className="font-data-num text-data-num text-zi-on-surface-variant">
                            {currentPage} / {Math.max(totalPages, 1)}
                        </span>
                        {currentPage < totalPages && (
                            <Link
                                href={buildPageHref(params, currentPage + 1)}
                                className="flex items-center gap-2 bg-zi-primary px-4 py-2 rounded-zi-btn font-ui-label text-ui-label text-white transition-all hover:bg-zi-primary/90 active:scale-95 shadow-sm"
                            >
                                데이터 더보기
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 헬퍼 함수
// ─────────────────────────────────────────────

function buildPageHref(params: PageParams, page: number): string {
    const sp = new URLSearchParams();
    if (params.industryId) sp.set('industryId', params.industryId);
    if (params.entityType) sp.set('entityType', params.entityType);
    if (params.q) sp.set('q', params.q);
    sp.set('page', String(page));
    return `/insight-radar?${sp.toString()}`;
}
