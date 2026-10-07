'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CHANNEL_COLORS } from '@/lib/analytics/types';
import { ReportExportModal } from '@/components/admin/analytics/ReportExportModal';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, FileSpreadsheet } from 'lucide-react';

const CHANNEL_TOOLTIPS: Record<string, string> = {
    ai_service: 'ChatGPT, Perplexity, Claude, Gemini 등 생성형 AI 답변 내 링크를 통한 유입',
    search: '네이버, 구글, 다음 등 검색엔진 자연 검색(Organic Search)을 통한 유입',
    sns: '인스타그램, 유튜브, 페이스북, X(트위터), 링크드인 등 소셜 미디어를 통한 유입',
    direct: 'URL 직접 입력, 북마크(즐겨찾기), 메신저 앱 내 링크 직접 오픈 등',
    other: '외부 웹사이트 링크(Referral/백링크), 이메일 뉴스레터, 유료 광고 및 기타 미분류 유입',
};

const PERIOD_OPTIONS = [
    { label: '7일', value: '7' },
    { label: '30일', value: '30' },
    { label: '90일', value: '90' },
    { label: '전체', value: 'all' },
];

const DEVICE_LABELS: Record<string, string> = {
    desktop: '💻 PC',
    mobile: '📱 모바일',
    tablet: '📟 태블릿',
};

function StatCard({ label, value, sub }: { label: string; value: string | number | null; sub?: string }) {
    return (
        <div className="rounded-xl border bg-card p-5 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold">{value ?? '—'}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return <h2 className="text-base font-semibold text-foreground">{title}</h2>;
}

function NoData({ msg }: { msg?: string }) {
    return (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border rounded-xl bg-muted/30">
            {msg ?? '데이터를 불러올 수 없습니다.'}
        </div>
    );
}

interface Props {
    data: Awaited<ReturnType<typeof import('@/actions/admin/analytics-actions').getArticleAnalyticsSummary>>;
    postId: number;
    currentPeriod: string;
}

type VisitorTab = 'geography' | 'device' | 'hour' | 'returning';

export function ArticleAnalyticsClient({ data, postId, currentPeriod }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [visitorTab, setVisitorTab] = useState<VisitorTab>('geography');
    const [showReportModal, setShowReportModal] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState<string>('section-summary');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const changePeriod = (val: string) => {
        router.push(`${pathname}?period=${val}`);
    };

    // 스크롤 컨테이너 가져오기 (lg 이상: 중앙 내부 컨테이너, 모바일: window)
    const getScrollContainer = () => {
        if (typeof window === 'undefined') return null;
        if (window.innerWidth >= 1024 && scrollAreaRef.current) {
            return scrollAreaRef.current;
        }
        return null;
    };

    // 뷰포트 내부 스크롤 이동 헬퍼
    const scrollElementIntoView = (el: HTMLElement, behavior: ScrollBehavior = 'smooth') => {
        const container = getScrollContainer();
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const top = elRect.top - containerRect.top + container.scrollTop - 12;
            container.scrollTo({ top: Math.max(0, top), behavior });
        } else {
            el.scrollIntoView({ behavior, block: 'start' });
        }
    };

    // 앵커 이동 및 스크롤 처리 헬퍼
    const scrollToSection = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setActiveSectionId(id);
        requestAnimationFrame(() => {
            const el = document.getElementById(id);
            if (el) scrollElementIntoView(el, 'smooth');
        });
    };

    // 스크롤 스파이: 중앙 컬럼(lg) 또는 window(모바일) 스크롤 기준
    useEffect(() => {
        const sectionIds = [
            'section-summary',
            'section-trend',
            'section-channels',
            'section-gsc',
            'section-funnel',
            'section-outbound',
            'section-visitors',
        ];

        let raf = 0;
        const checkActiveSection = () => {
            const container = getScrollContainer();
            const atBottom = container
                ? container.scrollTop + container.clientHeight >= container.scrollHeight - 40
                : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
            if (atBottom) {
                setActiveSectionId('section-visitors');
                return;
            }
            const threshold = container ? container.getBoundingClientRect().top + 120 : 200;
            let current = sectionIds[0];
            for (const id of sectionIds) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= threshold) {
                    current = id;
                }
            }
            setActiveSectionId(current);
        };

        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(checkActiveSection);
        };

        const areaEl = scrollAreaRef.current;
        areaEl?.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        checkActiveSection();

        return () => {
            cancelAnimationFrame(raf);
            areaEl?.removeEventListener('scroll', onScroll);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    if (!data) return <NoData msg="기사 데이터를 찾을 수 없습니다." />;

    const { post, linkedOrganizations, summary, pageviews, trafficSources, geography, visitorAttributes, gsc, gscAppearance, gscGenerativeAI, outboundLinkTable } = data;

    const pvChartData = pageviews.map((r) => ({
        date: r.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        조회수: r.views,
    }));

    const channelChartData = trafficSources.map((r) => ({
        channel: r.channel,
        name: r.channelLabel,
        sessions: r.sessions.value ?? 0,
        color: CHANNEL_COLORS[r.channel] ?? '#6b7280',
    }));

    const devicePieData = (visitorAttributes?.devices ?? []).map((d) => ({
        name: DEVICE_LABELS[d.device] ?? d.device,
        value: d.sessions,
    }));
    const DEVICE_PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

    const hourChartData = Array.from({ length: 24 }, (_, h) => {
        const found = visitorAttributes?.hours.find((r) => r.hour === h);
        return { hour: String(h) + '시', sessions: found?.sessions ?? 0 };
    });

    const nvrData = visitorAttributes?.newVsReturning ?? [];
    const totalNvr = nvrData.reduce((s, r) => s + r.sessions, 0);

    return (
        <div className="space-y-6 lg:space-y-0 lg:gap-5 lg:flex lg:flex-col lg:flex-1 lg:min-h-0">
            {showReportModal && post && (
                <ReportExportModal
                    entityType="article"
                    entityId={post.id}
                    entityName={post.title}
                    currentPeriod={currentPeriod}
                    analyticsData={data}
                    onClose={() => setShowReportModal(false)}
                />
            )}

            {/* Top Bar & Quick Actions — 모바일: sticky / lg: 카드 상단 고정(flex-shrink-0) */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-4 bg-white/95 backdrop-blur-sm -mx-6 px-6 pt-2 lg:static lg:shrink-0 lg:pt-0 lg:bg-white lg:backdrop-blur-none">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">조회 기간:</span>
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg">
                        {PERIOD_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => changePeriod(opt.value)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                    currentPeriod === opt.value
                                        ? 'bg-white text-indigo-600 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-slate-400 hidden md:inline">
                        ({currentPeriod === 'all' ? '전체 기간' : `최근 ${currentPeriod}일간`} 집계)
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowReportModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        📄 리포트 생성
                    </button>
                </div>
            </div>

            {/* 2단 레이아웃 (좌측 네비게이션 + 중앙 스크롤 본문) */}
            <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] lg:grid-rows-[minmax(0,1fr)] gap-6 items-stretch lg:flex-1 lg:min-h-0 lg:overflow-hidden">
                {/* 컬럼 1: Desktop side navigation — 고정 컬럼 (내부 스크롤 가능) */}
                <aside className="hidden lg:block min-w-0 min-h-0 h-full overflow-y-auto overflow-x-hidden">
                    <nav className="flex flex-col gap-1 w-full py-3 text-[11px] bg-white border border-slate-200 rounded-xl shadow-sm px-2 overflow-x-hidden">
                        <p className="font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2 pt-1">지표 탐색</p>

                        {/* 핵심 성과 */}
                        <a
                            href="#section-summary"
                            onClick={(e) => scrollToSection(e, 'section-summary')}
                            className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                                activeSectionId === 'section-summary'
                                    ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1 min-w-0">
                                <span className="truncate">📊 핵심 성과 지표</span>
                            </div>
                            <div className={`text-[10px] mt-0.5 pl-0.5 truncate ${activeSectionId === 'section-summary' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                조회 {summary.views.toLocaleString()}회
                            </div>
                        </a>

                        {/* 날짜별 조회수 */}
                        <a
                            href="#section-trend"
                            onClick={(e) => scrollToSection(e, 'section-trend')}
                            className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                                activeSectionId === 'section-trend'
                                    ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1 min-w-0">
                                <span className="truncate">📈 날짜별 조회수</span>
                            </div>
                            <div className={`text-[10px] mt-0.5 pl-0.5 truncate ${activeSectionId === 'section-trend' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                {pvChartData.length}개 일자 추이
                            </div>
                        </a>

                        {/* 유입 채널 */}
                        <a
                            href="#section-channels"
                            onClick={(e) => scrollToSection(e, 'section-channels')}
                            className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                                activeSectionId === 'section-channels'
                                    ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1 min-w-0">
                                <span className="truncate">🌐 유입 채널</span>
                            </div>
                            <div className={`text-[10px] mt-0.5 pl-0.5 truncate ${activeSectionId === 'section-channels' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                {trafficSources.length}개 채널 분석
                            </div>
                        </a>

                        {/* 검색 성과 */}
                        <a
                            href="#section-gsc"
                            onClick={(e) => scrollToSection(e, 'section-gsc')}
                            className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                                activeSectionId === 'section-gsc'
                                    ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1 min-w-0">
                                <span className="truncate">🔍 검색 성과 (GSC)</span>
                            </div>
                            <div className={`text-[10px] mt-0.5 pl-0.5 truncate ${activeSectionId === 'section-gsc' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                {gsc ? `노출 ${gsc.impressions.toLocaleString()}회` : '데이터 누적 중'}
                            </div>
                        </a>

                        <div className="w-full h-px bg-slate-100 my-1 mx-1" />

                        {/* 전환 퍼널 */}
                        <a
                            href="#section-funnel"
                            onClick={(e) => scrollToSection(e, 'section-funnel')}
                            className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                                activeSectionId === 'section-funnel'
                                    ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1 min-w-0">
                                <span className="truncate">🔻 전환 퍼널</span>
                            </div>
                            <div className={`text-[10px] mt-0.5 pl-0.5 truncate ${activeSectionId === 'section-funnel' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                {summary.conversionRate != null ? `전환율 ${summary.conversionRate}%` : '전환 지표'}
                            </div>
                        </a>

                        {/* 아웃바운드 링크 */}
                        <a
                            href="#section-outbound"
                            onClick={(e) => scrollToSection(e, 'section-outbound')}
                            className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                                activeSectionId === 'section-outbound'
                                    ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1 min-w-0">
                                <span className="truncate">🔗 아웃바운드 링크</span>
                            </div>
                            <div className={`text-[10px] mt-0.5 pl-0.5 truncate ${activeSectionId === 'section-outbound' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                {outboundLinkTable?.length ?? 0}개 링크 클릭
                            </div>
                        </a>

                        {/* 방문자 속성 */}
                        <a
                            href="#section-visitors"
                            onClick={(e) => scrollToSection(e, 'section-visitors')}
                            className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                                activeSectionId === 'section-visitors'
                                    ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1 min-w-0">
                                <span className="truncate">👥 방문자 속성</span>
                            </div>
                            <div className={`text-[10px] mt-0.5 pl-0.5 truncate ${activeSectionId === 'section-visitors' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                지역·기기·시간대
                            </div>
                        </a>

                        {/* 연동 상태 요약 카드 */}
                        <div className="mt-2 mx-1 px-2.5 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                                <span className="text-[10px] font-semibold text-emerald-700 truncate">
                                    애널리틱스 정상 연동
                                </span>
                            </div>
                            <p className="text-[9px] text-emerald-600 mt-0.5 truncate">
                                GA4 & GSC 실시간 분석
                            </p>
                        </div>
                    </nav>
                </aside>

                {/* 컬럼 2: Main analytics area — lg: 이 컬럼만 내부 스크롤 */}
                <div
                    ref={scrollAreaRef}
                    className="min-w-0 space-y-8 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:pb-6"
                >
                    {/* 연동된 조직 애널리틱스 바로가기 */}
                    {linkedOrganizations && linkedOrganizations.length > 0 && (
                        <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 flex-wrap">
                            <div className="flex items-center gap-2.5">
                                <span className="text-xl">🏢</span>
                                <div>
                                    <p className="text-sm font-semibold text-emerald-950">연동된 조직 애널리틱스</p>
                                    <p className="text-xs text-emerald-700">이 기사와 연결된 조직의 프로필 조회 및 전환 성과를 바로 확인하세요.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {linkedOrganizations.map((org) => (
                                    <Link
                                        key={org.id}
                                        href={`/admin/companies/${org.id}/analytics`}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
                                    >
                                        {org.name} 애널리틱스 바로가기 →
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 1. 핵심 성과 지표 */}
                    <div id="section-summary" className="scroll-mt-6 space-y-3">
                        <SectionHeader title="📋 핵심 성과 지표" />
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                            <StatCard label="총 조회수" value={summary.views.toLocaleString()} />
                            <StatCard label="레이더 전환수" value={summary.radarClicks?.toLocaleString() ?? '—'} sub="이벤트 수집 전 기사는 0" />
                            <StatCard
                                label="전환율"
                                value={summary.conversionRate != null ? `${summary.conversionRate}%` : '—'}
                                sub="조회→레이더 클릭"
                            />
                            <StatCard label="아웃바운드 클릭" value={summary.outboundClicks?.toLocaleString() ?? '—'} />
                        </div>
                    </div>

                    {/* 2. 날짜별 조회수 */}
                    <div id="section-trend" className="scroll-mt-6 space-y-3">
                        <SectionHeader title="📈 날짜별 조회수" />
                        {pvChartData.length > 0 ? (
                            <div className="border rounded-xl p-4 bg-card">
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={pvChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="조회수" stroke="#4f46e5" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <NoData msg="GA4 조회수 데이터가 없습니다." />
                        )}
                    </div>

                    {/* 3 & 4. 유입 채널 & Search Console 성과 */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div id="section-channels" className="scroll-mt-6 space-y-3">
                            <SectionHeader title="📊 유입 채널 (세분화)" />
                            {channelChartData.length > 0 ? (
                                <TooltipProvider delayDuration={150}>
                                    <div className="border rounded-xl p-4 bg-card space-y-2.5">
                                        {channelChartData.map((ch) => {
                                            const maxSessions = Math.max(...channelChartData.map((c) => c.sessions));
                                            const pct = maxSessions > 0 ? (ch.sessions / maxSessions) * 100 : 0;
                                            const tooltipText = CHANNEL_TOOLTIPS[ch.channel];
                                            return (
                                                <div key={ch.name} className="flex items-center gap-3 text-sm">
                                                    <div className="w-32 flex items-center gap-1 shrink-0">
                                                        <span className="text-muted-foreground">{ch.name}</span>
                                                        {tooltipText && (
                                                            <UITooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        className="text-muted-foreground/50 hover:text-foreground transition-colors cursor-help p-0.5 rounded"
                                                                        aria-label={`${ch.name} 설명`}
                                                                    >
                                                                        <Info className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-xs text-xs">
                                                                    <p className="font-semibold text-white mb-0.5">{ch.name}</p>
                                                                    <p className="text-slate-300 leading-relaxed">{tooltipText}</p>
                                                                </TooltipContent>
                                                            </UITooltip>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 bg-muted rounded-full h-2">
                                                        <div
                                                            className="h-2 rounded-full transition-all"
                                                            style={{ width: `${pct}%`, backgroundColor: ch.color }}
                                                        />
                                                    </div>
                                                    <span className="w-10 text-right font-medium">{ch.sessions.toLocaleString()}</span>
                                                </div>
                                            );
                                        })}
                                        <p className="text-[11px] text-muted-foreground pt-1.5 leading-relaxed border-t border-border/40">
                                            💡 <strong>기타:</strong> 외부 웹사이트 링크(Referral), 이메일 뉴스레터, 유료 광고 및 미분류 유입이 포함됩니다.
                                        </p>
                                    </div>
                                </TooltipProvider>
                            ) : (
                                <NoData />
                            )}
                        </div>

                        <div id="section-gsc" className="scroll-mt-6 space-y-3">
                            <SectionHeader title="🔍 Search Console 성과" />
                            {gsc ? (
                                <div className="border rounded-xl p-5 bg-card space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">노출수</p>
                                            <p className="text-2xl font-bold">{gsc.impressions.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">클릭수</p>
                                            <p className="text-2xl font-bold">{gsc.clicks.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">CTR</p>
                                            <p className="text-2xl font-bold">{gsc.ctr}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">평균 순위</p>
                                            <p className="text-2xl font-bold">{gsc.position}위</p>
                                        </div>
                                    </div>
                                    {gscAppearance.length > 0 && (
                                        <div className="text-xs space-y-1 pt-2 border-t">
                                            <p className="font-medium text-muted-foreground">검색 노출 유형</p>
                                            {gscAppearance.map((a) => (
                                                <div key={a.type} className="flex justify-between">
                                                    <span className="text-muted-foreground">{a.type}</span>
                                                    <span>{a.impressions.toLocaleString()} 노출</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <NoData msg="GSC 데이터 없음 — 아직 색인되지 않았거나 데이터가 누적 중입니다." />
                            )}

                            {gscGenerativeAI !== null && (
                                <div className="border border-violet-200 rounded-xl p-4 bg-violet-50 space-y-1">
                                    <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">🤖 생성형 AI 노출수 (GSC)</p>
                                    <p className="text-3xl font-bold text-violet-900">
                                        {gscGenerativeAI ? gscGenerativeAI.impressions.toLocaleString() : '—'}
                                    </p>
                                    <p className="text-[11px] text-violet-600 leading-relaxed">
                                        {gscGenerativeAI?.note ?? 'AI 개요 노출수만 측정 가능합니다. 클릭수·CTR·순위는 제공되지 않습니다.'}
                                    </p>
                                </div>
                            )}

                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                ⚠ AI 개요·LLM을 통한 노출·조회는 외부 플랫폼의 비공개 데이터로, 본 리포트에 포함되지 않습니다.
                            </p>
                        </div>
                    </div>

                    {/* 5. 전환 퍼널 */}
                    <div id="section-funnel" className="scroll-mt-6 space-y-3">
                        <SectionHeader title="🔻 전환 퍼널" />
                        <div className="border rounded-xl p-5 bg-card">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="text-center px-6 py-4 bg-indigo-50 rounded-xl">
                                    <p className="text-xs text-muted-foreground">기사 조회</p>
                                    <p className="text-2xl font-bold text-indigo-700">{summary.views.toLocaleString()}</p>
                                </div>
                                <span className="text-2xl text-muted-foreground">→</span>
                                <div className="text-center px-6 py-4 bg-teal-50 rounded-xl">
                                    <p className="text-xs text-muted-foreground">레이더 클릭</p>
                                    <p className="text-2xl font-bold text-teal-700">{summary.radarClicks?.toLocaleString() ?? '—'}</p>
                                </div>
                                <span className="text-2xl text-muted-foreground">→</span>
                                <div className="text-center px-6 py-4 bg-amber-50 rounded-xl">
                                    <p className="text-xs text-muted-foreground">전환율</p>
                                    <p className="text-2xl font-bold text-amber-700">
                                        {summary.conversionRate != null ? `${summary.conversionRate}%` : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 6. 외부 아웃바운드 링크별 클릭 */}
                    <div id="section-outbound" className="scroll-mt-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <SectionHeader title="🔗 외부 아웃바운드 링크별 클릭" />
                            <p className="text-xs text-muted-foreground">본문에 등록된 외부 링크 클릭수 (GA4)</p>
                        </div>
                        {outboundLinkTable && outboundLinkTable.length > 0 ? (
                            <div className="border rounded-xl overflow-hidden bg-card">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-1/4">도메인</th>
                                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-1/2">링크 URL</th>
                                            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-1/4">클릭수</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {outboundLinkTable.map((link, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="px-4 py-2.5 font-medium truncate max-w-[150px]">{link.domain}</td>
                                                <td className="px-4 py-2.5 max-w-[300px]">
                                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate block">
                                                        {link.url}
                                                    </a>
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-medium">{link.clicks.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <NoData msg="등록된 외부 링크가 없거나 클릭 데이터가 없습니다." />
                        )}
                    </div>

                    {/* 7. 방문자 속성 */}
                    <div id="section-visitors" className="scroll-mt-6 space-y-3">
                        <SectionHeader title="👥 방문자 속성" />
                        <p className="text-xs text-muted-foreground">실제 사이트 방문자 기준 (AI 노출 미포함)</p>
                        <div className="flex gap-1 border-b">
                            {([
                                { key: 'geography' as VisitorTab, label: '🗺 지역' },
                                { key: 'device' as VisitorTab, label: '🖥 기기' },
                                { key: 'hour' as VisitorTab, label: '🕐 시간대' },
                                { key: 'returning' as VisitorTab, label: '🔄 재방문' },
                            ]).map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => setVisitorTab(t.key)}
                                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                        visitorTab === t.key
                                            ? 'border-foreground text-foreground'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {visitorTab === 'geography' && (
                            geography.length > 0 ? (
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">도시</th>
                                                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">세션수</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {geography.map((g, i) => (
                                                <tr key={i} className="border-t">
                                                    <td className="px-4 py-2.5">{g.city}</td>
                                                    <td className="px-4 py-2.5 text-right font-medium">{g.sessions.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <NoData />
                        )}

                        {visitorTab === 'device' && (
                            devicePieData.length > 0 ? (
                                <div className="border rounded-xl p-4 bg-card">
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={devicePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                                {devicePieData.map((_, i) => (
                                                    <Cell key={i} fill={DEVICE_PIE_COLORS[i % DEVICE_PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Legend />
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <NoData />
                        )}

                        {visitorTab === 'hour' && (
                            <div className="border rounded-xl p-4 bg-card">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={hourChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="sessions" fill="#4f46e5" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {visitorTab === 'returning' && (
                            nvrData.length > 0 ? (
                                <div className="border rounded-xl p-5 bg-card space-y-3">
                                    {nvrData.map((r) => (
                                        <div key={r.type} className="flex items-center gap-3 text-sm">
                                            <span className="w-20 text-muted-foreground">
                                                {r.type === 'new' ? '🆕 신규' : r.type === 'returning' ? '🔄 재방문' : r.type}
                                            </span>
                                            <div className="flex-1 bg-muted rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-indigo-500"
                                                    style={{ width: `${totalNvr > 0 ? (r.sessions / totalNvr) * 100 : 0}%` }}
                                                />
                                            </div>
                                            <span className="w-24 text-right font-medium">
                                                {r.sessions.toLocaleString()}회
                                                {totalNvr > 0 && (
                                                    <span className="text-muted-foreground ml-1">
                                                        ({Math.round((r.sessions / totalNvr) * 100)}%)
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : <NoData />
                        )}
                    </div>

                    {/* 데이터 한계 안내 */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 leading-relaxed">
                        <strong>데이터 한계 안내:</strong> AI 개요(AI Overviews)·LLM(ChatGPT 등)을 통해 콘텐츠를 열람한 사용자 수,
                        LLM이 크롤링·인용한 콘텐츠 확인 사용자 수 및 해당 사용자의 지역별 상세 데이터는 외부 플랫폼의
                        비공개 정책상 수집이 불가능하며, 본 리포트에 포함되지 않습니다.
                    </div>
                </div>
            </div>
        </div>
    );
}