import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    getRadarRegions,
    getRadarTotalStats,
    getRadarCompanies,
    getRadarLatestArticles,
} from '@/actions/insight-radar-actions';
import { RadarSearchBar } from '@/components/public/insight-radar/RadarSearchBar';
import { RadarCompanyList } from '@/components/public/insight-radar/RadarCompanyList';

// 검색/필터 파라미터가 없는 기본 페이지는 1시간 캐시, 파라미터가 있으면 동적 렌더링
export const revalidate = 3600;

export const metadata: Metadata = {
    title: '인사이트 레이더 - AEO·SEO·GEO 관내 기업 동향',
    description: '산업별 핵심 트렌드, 최신 기술 동향 및 키워드를 실시간으로 조망하는 진사이트(Zinsight)의 리스트형 데이터 센터입니다.',
    alternates: {
        canonical: 'https://zinsight.co.kr/insight-radar',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

interface PageParams {
    regionId?: string;
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
    const selectedRegionId = params.regionId ? parseInt(params.regionId) : undefined;
    const selectedEntityType = params.entityType;
    const searchQuery = params.q;
    const currentPage = params.page ? parseInt(params.page) : 1;
    const pageSize = 15;

    const isInitialState = !selectedRegionId && !selectedEntityType && !searchQuery;

    // 데이터 페칭
    const [regions, totalStats, { companies, total, totalPages }, latestArticles] = await Promise.all([
        getRadarRegions(),
        getRadarTotalStats(),
        getRadarCompanies(
            {
                regionId: selectedRegionId,
                entityType: selectedEntityType,
                searchQuery,
            },
            currentPage,
            pageSize
        ),
        getRadarLatestArticles({}, 5),
    ]);

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            {/* ─────────────────────────────── */}
            {/* 페이지 헤더 */}
            {/* ─────────────────────────────── */}
            <div className="mx-auto max-w-zi-container px-4 sm:px-6 py-8 sm:py-12">

                {/* ── 통합 검색 및 필터 섹션 ── */}
                <RadarSearchBar 
                    regions={regions} 
                    currentRegionId={selectedRegionId} 
                    currentQuery={searchQuery} 
                />

                {/* ── 조직 목록 카드 리스트 (클라이언트 컴포넌트) ── */}
                <RadarCompanyList companies={companies} isInitialState={isInitialState} />

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center">
                        <div className="inline-flex items-center p-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                            {/* 이전 버튼 */}
                            {currentPage > 1 ? (
                                <Link
                                    href={buildPageHref(params, currentPage - 1)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>이전</span>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-slate-300 cursor-not-allowed">
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>이전</span>
                                </div>
                            )}

                            {/* 페이지 인디케이터 */}
                            <div className="flex items-center justify-center px-4">
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[13px] font-extrabold shadow-inner border border-blue-100">
                                    {currentPage}
                                </span>
                                <span className="mx-2 text-slate-300">/</span>
                                <span className="text-[13px] font-bold text-slate-400">
                                    {Math.max(totalPages, 1)}
                                </span>
                            </div>

                            {/* 다음 버튼 */}
                            {currentPage < totalPages ? (
                                <Link
                                    href={buildPageHref(params, currentPage + 1)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95"
                                >
                                    <span>다음 페이지</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-slate-300 cursor-not-allowed">
                                    <span>다음 페이지</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            )}
                        </div>
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
    if (params.regionId) sp.set('regionId', params.regionId);
    if (params.entityType) sp.set('entityType', params.entityType);
    if (params.q) sp.set('q', params.q);
    sp.set('page', String(page));
    return `/insight-radar?${sp.toString()}`;
}
