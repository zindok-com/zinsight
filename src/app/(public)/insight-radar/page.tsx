import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Newspaper, Layers, Tag } from 'lucide-react';
import {
    getRadarIndustries,
    getRadarTotalStats,
    getRadarCompanies,
    getRadarLatestArticles,
} from '@/actions/insight-radar-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Insight Radar',
    description: 'Zinsight의 AI 분석 엔진이 식별한 전략 산업군별 핵심 기업과 인사이트를 실시간으로 모니터링합니다.',
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

    const filter = { industryId: selectedIndustryId, entityType: selectedEntityType, searchQuery };

    // 데이터 병렬 조회
    const [industries, totalStats, { companies, total, totalPages }, latestArticles] =
        await Promise.all([
            getRadarIndustries(),
            getRadarTotalStats(),
            getRadarCompanies(filter, currentPage, 12),
            getRadarLatestArticles(filter, 3),
        ]);

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            {/* ─────────────────────────────── */}
            {/* 페이지 헤더 */}
            {/* ─────────────────────────────── */}
            <div className="mx-auto max-w-zi-container px-6 py-12">
                <div className="mb-12">
                    <h1 className="mb-2 font-h1 text-h1 text-zi-primary">
                        인사이트 레이더
                    </h1>
                    <p className="max-w-2xl font-body-md text-body-md text-zi-on-surface-variant">
                        Zinsight의 AI 분석 엔진이 식별한 전략 산업군 및 비즈니스 카테고리별 핵심 기업과
                        기술 인사이트를 실시간으로 모니터링합니다.
                    </p>
                </div>

                {/* 통계 바 */}
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatBadge icon={<Building2 className="h-4 w-4" />} label="분석 조직" value={totalStats.totalCompanies} unit="개" />
                    <StatBadge icon={<Newspaper className="h-4 w-4" />} label="수집 기사" value={totalStats.totalArticles} unit="건" />
                    <StatBadge icon={<Layers className="h-4 w-4" />} label="산업 분야" value={totalStats.totalIndustries} unit="개" />
                    <StatBadge icon={<Tag className="h-4 w-4" />} label="추적 키워드" value={totalStats.totalKeywords} unit="개" />
                </div>

                {/* ── 필터: 산업 탭 ── */}
                <div className="mb-zi-stack-lg flex flex-col gap-6 items-start">
                    {/* 탭 바 */}
                    <div className="w-full flex border-b border-zi-outline-variant overflow-x-auto no-scrollbar">
                        <IndustryTab
                            label="전체보기"
                            href={buildHref(params, undefined)}
                            isActive={!selectedIndustryId}
                        />
                        {industries.map((ind) => (
                            <IndustryTab
                                key={ind.id}
                                label={ind.name}
                                href={buildHref(params, ind.id)}
                                isActive={selectedIndustryId === ind.id}
                            />
                        ))}
                    </div>

                    {/* 엔티티 유형 필터 칩 */}
                    <div className="flex flex-wrap gap-2">
                        <span className="py-2 mr-2 font-ui-label text-ui-label font-bold text-zi-outline uppercase tracking-wider">유형 필터:</span>
                        {ENTITY_TYPES.map((et) => {
                            const isActive = selectedEntityType === et.value || (!selectedEntityType && et.value === '');
                            return (
                                <Link
                                    key={et.value}
                                    href={buildEntityTypeHref(params, et.value || undefined)}
                                    className={`px-4 py-1.5 rounded-full font-ui-label text-[13px] transition-all active:scale-95 ${
                                        isActive
                                            ? 'bg-zi-primary text-white font-bold'
                                            : 'bg-zi-surface-container text-zi-on-surface-variant hover:bg-zi-surface-container-highest'
                                    }`}
                                >
                                    {et.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* ── 조직 목록 테이블 ── */}
                <div className="border border-zi-divider bg-white rounded-zi-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-zi-divider bg-zi-surface-container-low">
                                    <th className="px-6 py-4 font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline">
                                        기업명 / 기관
                                    </th>
                                    <th className="px-6 py-4 font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline">
                                        유형
                                    </th>
                                    <th className="px-6 py-4 font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline">
                                        AI 인사이트 분석
                                    </th>
                                    <th className="hidden px-6 py-4 font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline md:table-cell">
                                        최신 기사
                                    </th>
                                    <th className="px-6 py-4 text-right font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline">
                                        상세보기
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zi-divider">
                                {companies.length > 0 ? (
                                    companies.map((company) => (
                                        <tr
                                            key={company.id}
                                            className="group transition-colors hover:bg-zi-surface-low"
                                        >
                                            {/* 기업명 */}
                                            <td className="px-6 py-6 align-top">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-zi-surface-high">
                                                        <Building2 className="h-4 w-4 text-zi-navy" />
                                                    </div>
                                                    <div>
                                                        <div className="text-zi-body-md font-semibold text-zi-navy">
                                                            {company.company_name}
                                                        </div>
                                                        {company.industry && (
                                                            <div className="text-zi-caption text-zi-on-surface-variant">
                                                                {company.industry.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 유형 */}
                                            <td className="px-6 py-6 align-top">
                                                <span className="bg-zi-surface-container px-2 py-1 rounded-full font-ui-label text-[11px] font-bold text-zi-secondary uppercase tracking-tighter">
                                                    {company.entity_type ?? '기업'}
                                                </span>
                                            </td>

                                            {/* AI 인사이트 */}
                                            <td className="max-w-md px-6 py-6 align-top">
                                                <p className="text-zi-body-md leading-snug text-zi-on-surface">
                                                    {company.business_summary
                                                        ? company.business_summary.slice(0, 100) +
                                                          (company.business_summary.length > 100 ? '…' : '')
                                                        : '분석 정보 준비 중입니다.'}
                                                </p>
                                            </td>

                                            {/* 최신 기사 수 */}
                                            <td className="hidden px-6 py-6 align-top md:table-cell">
                                                <span className="text-zi-label font-semibold text-zi-blue">
                                                    {company.articleCount}건
                                                </span>
                                                {company.latestArticleDate && (
                                                    <div className="mt-1 text-zi-caption text-zi-on-surface-variant">
                                                        {new Date(company.latestArticleDate).toLocaleDateString('ko-KR')}
                                                    </div>
                                                )}
                                            </td>

                                            {/* 상세보기 링크 */}
                                            <td className="px-6 py-6 align-top text-right">
                                                <Link
                                                    href={`/insight-radar/${company.id}`}
                                                    className="inline-flex items-center text-zi-outline transition-colors hover:text-zi-navy"
                                                    aria-label={`${company.company_name} 상세보기`}
                                                >
                                                    <ArrowRight className="h-5 w-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-zi-body-md text-zi-on-surface-variant">
                                            해당 조건에 맞는 조직이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이지네이션 */}
                    <div className="flex items-center justify-center gap-4 border-t border-zi-divider p-6 bg-zi-surface-container-low/30">
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
                </div>

                {/* ── 피처드 인사이트 배너 (벤토 스타일) ── */}
                {latestArticles.length > 0 && (
                    <div className="mt-zi-stack-lg grid grid-cols-1 gap-zi-gutter md:grid-cols-3">
                        {/* 메인 피처 카드 */}
                        <div className="relative col-span-2 h-64 overflow-hidden border border-zi-divider">
                            <div className="absolute inset-0 bg-zi-surface-high" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zi-navy/90 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-8">
                                <span className="mb-4 inline-block bg-zi-blue px-3 py-1 text-zi-caption font-bold text-white">
                                    스페셜 리포트
                                </span>
                                <h2 className="max-w-lg text-zi-headline-md font-bold leading-tight text-white">
                                    {latestArticles[0]?.title ?? '2024 최신 시장 인사이트 리포트'}
                                </h2>
                            </div>
                        </div>

                        {/* 사이드 트렌드 카드 */}
                        <div className="flex flex-col justify-between bg-zi-navy p-8">
                            <div>
                                <h3 className="mb-2 text-zi-label font-semibold uppercase tracking-widest text-zi-blue-bright">
                                    Global Trend
                                </h3>
                                <p className="text-zi-headline-md font-bold leading-tight text-white">
                                    {latestArticles[1]?.title ?? '클린테크 분야 해외 투자 유입 전년 대비 124% 증가'}
                                </p>
                            </div>
                            <Link
                                href={latestArticles[1]?.url ?? '/insight-radar'}
                                className="mt-4 border-b border-white pb-1 text-zi-label font-semibold text-white transition-opacity hover:opacity-80"
                                target={latestArticles[1]?.url ? '_blank' : undefined}
                                rel="noopener noreferrer"
                            >
                                리포트 전문 읽기
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 내부 헬퍼 컴포넌트
// ─────────────────────────────────────────────

function StatBadge({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: number; unit: string }) {
    return (
        <div className="border border-zi-divider bg-zi-surface-container-low/50 px-4 py-4 rounded-zi-card">
            <div className="mb-2 flex items-center gap-2 text-zi-outline">
                {icon}
                <span className="font-ui-label text-[12px] uppercase tracking-wider font-bold">{label}</span>
            </div>
            <p className="tabular-nums font-data-num text-2xl font-bold text-zi-primary">
                {value.toLocaleString()}
                <span className="ml-1 text-sm font-normal text-zi-on-surface-variant">{unit}</span>
            </p>
        </div>
    );
}

function IndustryTab({ label, href, isActive }: { label: string; href: string; isActive: boolean }) {
    return (
        <Link
            href={href}
            className={`whitespace-nowrap px-6 py-3 font-ui-label text-ui-label border-b-2 transition-all active:scale-95 ${
                isActive
                    ? 'border-zi-primary text-zi-primary font-bold'
                    : 'border-transparent text-zi-on-surface-variant hover:text-zi-primary'
            }`}
        >
            {label}
        </Link>
    );
}

// ─────────────────────────────────────────────
// 상수 및 헬퍼 함수
// ─────────────────────────────────────────────

const ENTITY_TYPES = [
    { label: '전체', value: '' },
    { label: '스타트업', value: '스타트업' },
    { label: '대기업', value: '대기업' },
    { label: '연구소', value: '연구소' },
    { label: 'MICE', value: 'MICE' },
    { label: '기타', value: '기타' },
];

type PageParams = Record<string, string | undefined>;

function buildHref(params: PageParams, industryId: number | undefined): string {
    const sp = new URLSearchParams();
    if (industryId) sp.set('industryId', String(industryId));
    if (params.entityType) sp.set('entityType', params.entityType);
    if (params.q) sp.set('q', params.q);
    const str = sp.toString();
    return `/insight-radar${str ? '?' + str : ''}`;
}

function buildEntityTypeHref(params: PageParams, entityType: string | undefined): string {
    const sp = new URLSearchParams();
    if (params.industryId) sp.set('industryId', params.industryId);
    if (entityType) sp.set('entityType', entityType);
    if (params.q) sp.set('q', params.q);
    const str = sp.toString();
    return `/insight-radar${str ? '?' + str : ''}`;
}

function buildPageHref(params: PageParams, page: number): string {
    const sp = new URLSearchParams();
    if (params.industryId) sp.set('industryId', params.industryId);
    if (params.entityType) sp.set('entityType', params.entityType);
    if (params.q) sp.set('q', params.q);
    sp.set('page', String(page));
    return `/insight-radar?${sp.toString()}`;
}
