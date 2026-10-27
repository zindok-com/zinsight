'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Activity,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Search,
    Bot,
    ExternalLink,
    Filter,
    Globe,
    Layers,
    FileText,
    Building2,
    Copy,
    Check,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/lib/site';
import { TrafficAnalyticsTab } from '@/components/admin/analytics/TrafficAnalyticsTab';

interface Props {
    overview: Awaited<ReturnType<typeof import('@/actions/admin/seo-actions').getSeoMonitoringOverview>>;
    indexingReport: Awaited<ReturnType<typeof import('@/actions/admin/seo-actions').getGoogleIndexingReport>>;
    currentPeriod: string;
    initialTab: string;
    traffic: Awaited<ReturnType<typeof import('@/actions/admin/analytics-actions').getSiteTrafficAnalytics>> | null;
    visitors: Awaited<ReturnType<typeof import('@/actions/visitor-org-actions').getVisitorOrgAnalytics>> | null;
}

type TabType = 'overview' | 'traffic' | 'indexing' | 'apis';
const TAB_KEYS: TabType[] = ['overview', 'traffic', 'indexing', 'apis'];
const PERIOD_LABEL: Record<string, string> = { '7': '최근 7일', '30': '최근 30일', '90': '최근 90일', all: '전체 기간' };

export function SeoMonitoringClient({ overview, indexingReport, currentPeriod, initialTab, traffic, visitors }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    // 탭은 URL(?tab=)을 기준으로 결정: 사이드바 링크로 이동해도 화면이 함께 바뀌도록 로컬 상태로 고정하지 않음
    const currentTab: TabType = TAB_KEYS.includes(initialTab as TabType) ? (initialTab as TabType) : 'overview';
    const [searchFilter, setSearchFilter] = useState('');
    const [indexFilter, setIndexFilter] = useState<'all' | 'indexed' | 'not_indexed'>('all');
    const [entityFilter, setEntityFilter] = useState<'all' | 'article' | 'org'>('all');
    const [copiedPath, setCopiedPath] = useState<string | null>(null);

    const handleCopyLink = async (path: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const fullUrl = toAbsoluteUrl(path);
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopiedPath(path);
            toast.success('링크가 클립보드에 복사되었습니다.', {
                description: fullUrl,
            });
            setTimeout(() => setCopiedPath(null), 2000);
        } catch (err) {
            toast.error('링크 복사에 실패했습니다.');
        }
    };

    const handlePeriodChange = (p: string) => {
        router.push(`${pathname}?period=${p}&tab=${currentTab}`);
    };

    const handleTabChange = (t: TabType) => {
        router.push(`${pathname}?period=${currentPeriod}&tab=${t}`);
    };

    const { apiStatus, contentStats } = overview;
    const { summary, indexedPagesGsc, articleIndexReport, orgIndexReport } = indexingReport;

    // 기사 + 기업 색인 리포트 병합 및 필터링
    const combinedPages = [
        ...articleIndexReport.map((a) => ({
            type: '기사' as const,
            title: a.title,
            slug: a.slug,
            path: a.path,
            meta: `${a.category} · ${a.regionName || '일반'}`,
            isIndexed: a.isIndexed,
            impressions: a.impressions,
            clicks: a.clicks,
            ctr: a.ctr,
            position: a.position,
        })),
        ...orgIndexReport.map((o) => ({
            type: '기업' as const,
            title: o.name,
            slug: o.slug,
            path: o.path,
            meta: `인사이트 레이더 · ${o.regionName || '전국'}`,
            isIndexed: o.isIndexed,
            impressions: o.impressions,
            clicks: o.clicks,
            ctr: o.ctr,
            position: o.position,
        })),
    ].filter((item) => {
        if (entityFilter === 'article' && item.type !== '기사') return false;
        if (entityFilter === 'org' && item.type !== '기업') return false;
        if (indexFilter === 'indexed' && !item.isIndexed) return false;
        if (indexFilter === 'not_indexed' && item.isIndexed) return false;
        if (searchFilter) {
            const q = searchFilter.toLowerCase();
            return (
                item.title.toLowerCase().includes(q) ||
                item.path.toLowerCase().includes(q) ||
                (item.slug && item.slug.toLowerCase().includes(q))
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* 상단 탭 네비게이션 및 기간 셀렉터 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-1">
                <div className="flex gap-2 overflow-x-auto">
                    {[
                        { key: 'overview', label: '📊 종합 현황', icon: Activity },
                        { key: 'traffic', label: '📈 유입·방문자', icon: Users },
                        { key: 'indexing', label: '🔍 구글 색인 목록', icon: Search },
                        { key: 'apis', label: '⚡ API 연동 진단', icon: Globe },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const active = currentTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key as TabType)}
                                aria-current={active ? 'page' : undefined}
                                className={`flex shrink-0 items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                                    active
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg self-start sm:self-auto">
                    {[
                        { label: '7일', value: '7' },
                        { label: '30일', value: '30' },
                        { label: '90일', value: '90' },
                        { label: '전체', value: 'all' },
                    ].map((p) => (
                        <button
                            key={p.value}
                            onClick={() => handlePeriodChange(p.value)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                currentPeriod === p.value
                                    ? 'bg-background text-foreground shadow-sm font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB: 유입·방문자 (GA4 플랫폼 유입 + 실시간 + B2B 기관 방문) */}
            {currentTab === 'traffic' && (
                traffic && visitors ? (
                    <TrafficAnalyticsTab
                        periodLabel={PERIOD_LABEL[currentPeriod] ?? `최근 ${currentPeriod}일`}
                        traffic={traffic}
                        visitors={visitors}
                    />
                ) : (
                    <div className="p-8 text-center text-muted-foreground">유입 데이터를 불러오는 중입니다...</div>
                )
            )}

            {/* TAB 1: 종합 현황 (Overview) */}
            {currentTab === 'overview' && (
                <div className="space-y-6">
                    {/* 상단 핵심 지표 카드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-xl border bg-card p-5 space-y-1.5 shadow-sm">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold uppercase tracking-wider">구글 색인 페이지수</span>
                                <Search className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="text-3xl font-extrabold text-foreground">
                                {summary.totalIndexedPagesInGsc}
                                <span className="text-sm font-medium text-muted-foreground ml-1">개 URL</span>
                            </div>
                            <p className="text-xs text-muted-foreground">구글 검색 결과 노출 실측 페이지</p>
                        </div>

                        <div className="rounded-xl border bg-card p-5 space-y-1.5 shadow-sm">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold uppercase tracking-wider">기사 색인율</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="text-3xl font-extrabold text-emerald-600">
                                {summary.indexingRate}%
                                <span className="text-xs font-normal text-muted-foreground ml-2">
                                    ({summary.indexedArticlesCount} / {summary.totalArticles})
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">발행된 매거진 포스트 중 색인 반영 비율</p>
                        </div>

                        <div className="rounded-xl border bg-card p-5 space-y-1.5 shadow-sm">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold uppercase tracking-wider">AEO 구조화 데이터</span>
                                <Bot className="w-4 h-4 text-violet-500" />
                            </div>
                            <div className="text-3xl font-extrabold text-violet-600">
                                {contentStats.aeoCoverageRate}%
                                <span className="text-xs font-normal text-muted-foreground ml-2">
                                    ({contentStats.structuredPostsCount}건)
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Schema.org JSON-LD 적용 기사 비율</p>
                        </div>
                    </div>

                    {/* SEO / GEO / AEO 영역별 카드 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 1. SEO (Search Engine Optimization) */}
                        <div className="rounded-xl border bg-card p-5 space-y-4">
                            <div className="flex items-center gap-2.5 pb-2 border-b">
                                <span className="text-xl">🔍</span>
                                <div>
                                    <h3 className="font-bold text-foreground">SEO (검색엔진 최적화)</h3>
                                    <p className="text-xs text-muted-foreground">구글 및 네이버 검색 색인·노출 현황</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">총 검색 노출수</span>
                                    <span className="font-semibold">{summary.totalGscImpressions.toLocaleString()}회</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">총 검색 클릭수</span>
                                    <span className="font-semibold text-indigo-600">{summary.totalGscClicks.toLocaleString()}회</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">구글 서치콘솔 상태</span>
                                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${apiStatus.gsc.connected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                        {apiStatus.gsc.connected ? '연동 정상' : '연동 필요'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-muted-foreground">네이버 서치어드바이저</span>
                                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                                        웹마스터 관리
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. LOCAL (로컬 비즈니스 허브) */}
                        <div className="rounded-xl border bg-card p-5 space-y-4">
                            <div className="flex items-center gap-2.5 pb-2 border-b">
                                <span className="text-xl">🏢</span>
                                <div>
                                    <h3 className="font-bold text-foreground">LOCAL (로컬 비즈니스 허브)</h3>
                                    <p className="text-xs text-muted-foreground">지자체 지면 및 관내 기업·기관 연계</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">로컬 발행 기사수</span>
                                    <span className="font-semibold">{contentStats.localPostsCount}개</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">등록된 로컬 조직</span>
                                    <span className="font-semibold">{contentStats.organizationsCount}개</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">지자체 로컬 구조화</span>
                                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700">
                                        Schema.org Place 표준
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-muted-foreground">연계 플랫폼</span>
                                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700">
                                        인사이트 레이더 연동
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. AEO (Answer Engine Optimization) */}
                        <div className="rounded-xl border bg-card p-5 space-y-4">
                            <div className="flex items-center gap-2.5 pb-2 border-b">
                                <span className="text-xl">🤖</span>
                                <div>
                                    <h3 className="font-bold text-foreground">AEO (AI 답변엔진 최적화)</h3>
                                    <p className="text-xs text-muted-foreground">ChatGPT, Perplexity, AI Overview 대비</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">구조화 데이터 적용률</span>
                                    <span className="font-semibold text-violet-600">{contentStats.aeoCoverageRate}%</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">지원 스키마 타입</span>
                                    <span className="text-xs font-mono text-muted-foreground">NewsArticle, Place, Org</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">AI 개요 노출 추적</span>
                                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700">
                                        GSC AI_OVERVIEW 연동
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-muted-foreground">LLM 인용 유입 추적</span>
                                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-violet-50 text-violet-700">
                                        GA4 AI 채널 필터링
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: 구글 색인 목록 (Indexing Report) */}
            {currentTab === 'indexing' && (
                <div className="space-y-4">
                    {/* 검색 및 필터 컨트롤 */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="페이지 제목, 경로 또는 슬러그 검색..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/40">
                                <button
                                    onClick={() => setEntityFilter('all')}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                                        entityFilter === 'all' ? 'bg-background shadow-xs font-semibold' : 'text-muted-foreground'
                                    }`}
                                >
                                    전체 유형
                                </button>
                                <button
                                    onClick={() => setEntityFilter('article')}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                                        entityFilter === 'article' ? 'bg-background shadow-xs font-semibold' : 'text-muted-foreground'
                                    }`}
                                >
                                    📰 기사
                                </button>
                                <button
                                    onClick={() => setEntityFilter('org')}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                                        entityFilter === 'org' ? 'bg-background shadow-xs font-semibold' : 'text-muted-foreground'
                                    }`}
                                >
                                    🏢 기업/조직
                                </button>
                            </div>

                            <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/40">
                                <button
                                    onClick={() => setIndexFilter('all')}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                                        indexFilter === 'all' ? 'bg-background shadow-xs font-semibold' : 'text-muted-foreground'
                                    }`}
                                >
                                    전체 상태
                                </button>
                                <button
                                    onClick={() => setIndexFilter('indexed')}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                                        indexFilter === 'indexed' ? 'bg-emerald-500 text-white font-semibold' : 'text-muted-foreground'
                                    }`}
                                >
                                    ✓ 색인 완료
                                </button>
                                <button
                                    onClick={() => setIndexFilter('not_indexed')}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                                        indexFilter === 'not_indexed' ? 'bg-slate-700 text-white font-semibold' : 'text-muted-foreground'
                                    }`}
                                >
                                    미색인/대기
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 색인 현황 테이블 */}
                    <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-16">구분</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">페이지 제목 및 경로</th>
                                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground w-28">색인 상태</th>
                                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground w-24">노출수</th>
                                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground w-20">클릭수</th>
                                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground w-20">CTR</th>
                                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground w-24">평균 순위</th>
                                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground w-20">링크</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {combinedPages.length > 0 ? (
                                    combinedPages.map((page, idx) => (
                                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                                                    page.type === '기사' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {page.type}
                                                </span>
                                            </td>
                                            <td
                                                className="px-4 py-3 max-w-md cursor-pointer group hover:bg-muted/40 transition-colors"
                                                onClick={() => handleCopyLink(page.path)}
                                                title="클릭하여 실제 링크 주소 복사"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <div className="font-medium text-foreground line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                        {page.title}
                                                    </div>
                                                    {copiedPath === page.path ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 shrink-0 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                                            <Check className="w-3 h-3" />
                                                            복사됨
                                                        </span>
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate group-hover:text-foreground/80 transition-colors">
                                                    {page.path}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground/80 mt-0.5">{page.meta}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {page.isIndexed ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        색인 완료
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                        미색인/대기
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {page.impressions > 0 ? page.impressions.toLocaleString() : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                                                {page.clicks > 0 ? page.clicks.toLocaleString() : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">
                                                {page.impressions > 0 ? `${page.ctr}%` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">
                                                {page.impressions > 0 ? `${page.position}위` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="inline-flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleCopyLink(page.path, e)}
                                                        className="inline-flex p-1 text-muted-foreground hover:text-indigo-600 rounded hover:bg-muted transition-colors"
                                                        title="실제 링크 복사"
                                                    >
                                                        {copiedPath === page.path ? (
                                                            <Check className="w-4 h-4 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <a
                                                        href={page.path}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
                                                        title="새 창에서 열기"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                            검색 조건에 맞는 페이지가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* TAB 4: API 연동 진단 (APIs Diagnostic) */}
            {currentTab === 'apis' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Google Search Console */}
                    <div className="border rounded-xl p-5 bg-card space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔍</span>
                                <h3 className="font-bold text-foreground">구글 서치콘솔 API</h3>
                            </div>
                            {apiStatus.gsc.connected ? (
                                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> 연동 완료
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-800">
                                    <XCircle className="w-3.5 h-3.5" /> 미연결 / 오류
                                </span>
                            )}
                        </div>

                        <div className="text-xs space-y-2 border-t pt-3 text-muted-foreground">
                            <div>
                                <span className="font-medium text-foreground">Site URL:</span>{' '}
                                <code className="bg-muted px-1 py-0.5 rounded">{apiStatus.gsc.siteUrl}</code>
                            </div>
                            <div>
                                <span className="font-medium text-foreground">서비스 계정 키:</span>{' '}
                                <span>{apiStatus.gsc.hasCredentials ? '✓ 키 로드됨' : '✕ 키 없음'}</span>
                            </div>
                            {apiStatus.gsc.error && (
                                <div className="text-red-600 bg-red-50 p-2 rounded text-[11px]">
                                    {apiStatus.gsc.error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Google Analytics 4 */}
                    <div className="border rounded-xl p-5 bg-card space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📈</span>
                                <h3 className="font-bold text-foreground">구글 애널리틱스 4 (GA4)</h3>
                            </div>
                            {apiStatus.ga4.connected ? (
                                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> 연동 완료
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-800">
                                    <AlertTriangle className="w-3.5 h-3.5" /> 점검 필요
                                </span>
                            )}
                        </div>

                        <div className="text-xs space-y-2 border-t pt-3 text-muted-foreground">
                            <div>
                                <span className="font-medium text-foreground">Property ID:</span>{' '}
                                <code className="bg-muted px-1 py-0.5 rounded">{apiStatus.ga4.propertyId}</code>
                            </div>
                            <div>
                                <span className="font-medium text-foreground">실시간 측정:</span>{' '}
                                <span>PV, 이벤트, 체류시간, AI 채널 자동 분류</span>
                            </div>
                            {apiStatus.ga4.error && (
                                <div className="text-amber-700 bg-amber-50 p-2 rounded text-[11px]">
                                    {apiStatus.ga4.error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Naver Search Advisor / Search API */}
                    <div className="border rounded-xl p-5 bg-card space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🟢</span>
                                <h3 className="font-bold text-foreground">네이버 서치어드바이저</h3>
                            </div>
                            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-800">
                                웹마스터 모니터링
                            </span>
                        </div>

                        <div className="text-xs space-y-2 border-t pt-3 text-muted-foreground leading-relaxed">
                            <div>
                                <span className="font-medium text-foreground">뉴스 검색 수집 API:</span>{' '}
                                <span>{apiStatus.naver.configured ? '✓ 클라이언트 키 등록됨' : '미설정'}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded">
                                {apiStatus.naver.note}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
