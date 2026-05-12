import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lightbulb, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { getRadarCompanyDetail } from '@/actions/insight-radar-actions';

interface PageProps {
    params: Promise<{ id: string }>;
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const company = await getRadarCompanyDetail(Number(id));
    if (!company) return { title: '조직을 찾을 수 없습니다' };
    return {
        title: company.company_name,
        description: company.business_summary ?? `${company.company_name}의 Zinsight 조직 분석 리포트`,
    };
}

export default async function InsightRadarDetailPage({ params }: PageProps) {
    const { id } = await params;
    const company = await getRadarCompanyDetail(Number(id));

    if (!company) notFound();

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            <main className="mx-auto max-w-zi-container px-6 py-12">
                {/* ── 뒤로가기 ── */}
                <Link
                    href="/insight-radar"
                    className="mb-8 inline-flex items-center gap-2 text-zi-label font-semibold text-zi-on-surface-variant transition-colors hover:text-zi-primary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    인사이트 레이더로 돌아가기
                </Link>

                {/* ─────────────────────────────── */}
                {/* 조직 헤더 메타데이터 섹션 */}
                {/* ─────────────────────────────── */}
                <section className="mb-zi-stack-lg border-b border-zi-divider pb-10">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            {/* 배지 + 티커 */}
                            <div className="mb-4 flex items-center gap-3">
                                <span className="bg-zi-primary px-2 py-0.5 text-zi-label font-semibold uppercase tracking-wider text-white">
                                    {company.entity_type ?? 'Enterprise'}
                                </span>
                                {company.allIndustries && company.allIndustries.length > 0 ? (
                                    company.allIndustries.map((ind) => (
                                        <span key={ind.id} className="text-zi-label font-semibold text-zi-outline border border-zi-divider px-2 py-0.5 rounded">
                                            {ind.name}
                                        </span>
                                    ))
                                ) : company.industry && (
                                    <span className="text-zi-label font-semibold text-zi-outline">
                                        {company.industry.name}
                                    </span>
                                )}
                            </div>

                            {/* 기업명 */}
                            <h1 className="font-serif mb-3 text-zi-headline-lg font-semibold text-zi-primary">
                                {company.company_name}
                            </h1>

                            {/* 메타 정보 */}
                            <div className="flex flex-wrap items-center gap-4 text-slate-500">
                                <span className="flex items-center gap-1 text-zi-body-md">
                                    <span className="text-zi-label font-semibold text-zi-blue">
                                        기사 {company.articleCount.toLocaleString()}건
                                    </span>
                                </span>
                                {company.allIndustries && company.allIndustries.length > 0 ? (
                                    company.allIndustries.map((ind, idx) => (
                                        <span key={ind.id} className={`flex items-center gap-1 ${idx > 0 ? 'border-l border-zi-divider pl-4' : 'border-l border-zi-divider pl-4'} text-zi-body-md`}>
                                            {ind.name} 산업
                                        </span>
                                    ))
                                ) : company.industry && (
                                    <span className="flex items-center gap-1 border-l border-zi-divider pl-4 text-zi-body-md">
                                        {company.industry.name} 산업
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex gap-3">
                            <button className="border border-zi-primary px-6 py-3 text-zi-label font-semibold text-zi-primary transition-colors hover:bg-zi-surface-high">
                                데이터 내려받기
                            </button>
                            <Link
                                href="/insight-radar"
                                className="flex items-center gap-2 bg-zi-primary px-6 py-3 text-zi-label font-semibold text-white transition-opacity hover:opacity-90"
                            >
                                <TrendingUp className="h-4 w-4" />
                                실시간 모니터링
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────── */}
                {/* Intelligence Report: 섭외 원 포인트 */}
                {/* ─────────────────────────────── */}
                <section className="mb-zi-stack-lg">
                    <div className="mb-6 flex items-center gap-2">
                        <span className="text-zi-blue">⚡</span>
                        <h2 className="text-zi-headline-md font-bold text-zi-primary">
                            Intelligence Report: [섭외 원 포인트]
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                        {/* AI 전략 코어 박스 (Dark Navy) */}
                        <div className="flex flex-col justify-between border border-zi-primary bg-zi-primary p-10 text-white md:col-span-8">
                            <div>
                                <span className="mb-4 block text-zi-label font-semibold uppercase tracking-widest text-zi-blue-bright">
                                    AI Strategic Logic
                                </span>
                                <h3 className="font-serif mb-8 text-4xl font-semibold leading-tight text-white">
                                    {company.company_name}의 전략적 포지셔닝
                                </h3>
                                <p className="mb-12 max-w-2xl text-zi-body-lg text-slate-300">
                                    {company.business_summary ??
                                        '비즈니스 요약 정보를 분석 중입니다. 최신 뉴스 데이터를 바탕으로 핵심 전략 인사이트를 생성하고 있습니다.'}
                                </p>
                            </div>

                            {/* 지표 행 */}
                            <div className="flex flex-wrap gap-8">
                                <div>
                                    <div className="mb-1 text-zi-label font-semibold text-zi-blue-bright">
                                        수집 기사 수
                                    </div>
                                    <div className="text-3xl font-semibold font-serif">
                                        {company.articleCount.toLocaleString()}건
                                    </div>
                                </div>
                                <div className="border-l border-white/20 pl-8">
                                    <div className="mb-1 text-zi-label font-semibold text-zi-blue-bright">
                                        산업 분야
                                    </div>
                                    <div className="text-3xl font-semibold font-serif">
                                        {company.allIndustries && company.allIndustries.length > 0 
                                            ? company.allIndustries.map(i => i.name).join(', ') 
                                            : (company.industry?.name ?? '—')}
                                    </div>
                                </div>
                                <div className="border-l border-white/20 pl-8">
                                    <div className="mb-1 text-zi-label font-semibold text-zi-blue-bright">
                                        인사이트 일치도
                                    </div>
                                    <div className="text-3xl font-semibold font-serif text-zi-blue-bright">
                                        High
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 비즈니스 가치 시뮬레이션 카드 */}
                        <div className="flex flex-col border border-zi-divider bg-white p-8 md:col-span-4">
                            <span className="mb-4 block text-zi-label font-semibold uppercase text-slate-400">
                                Value Simulation
                            </span>

                            {/* 시각적 추상 플레이스홀더 */}
                            <div className="flex flex-grow items-center justify-center py-6">
                                <div className="relative flex aspect-square w-full max-w-[180px] items-center justify-center bg-zi-surface-low">
                                    <div
                                        className="absolute inset-0 opacity-10"
                                        style={{
                                            backgroundImage: 'radial-gradient(#001F3F 1px, transparent 1px)',
                                            backgroundSize: '20px 20px',
                                        }}
                                    />
                                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-zi-blue">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zi-blue/10">
                                            <TrendingUp className="h-10 w-10 text-zi-blue" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="mb-2 text-zi-body-lg font-semibold">비즈니스 가치 시뮬레이션</h4>
                                <p className="text-sm text-slate-600">
                                    {company.recent_status ??
                                        '현재 상태 정보 및 마케팅 협업 시나리오 시뮬레이션 결과를 분석 중입니다.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────── */}
                {/* 인사이트 3단 그리드 */}
                {/* ─────────────────────────────── */}
                <section className="mb-zi-stack-lg grid grid-cols-1 gap-6 md:grid-cols-3">
                    <InsightCard
                        icon={<Lightbulb className="h-5 w-5 text-zi-blue" />}
                        title="핵심 의사결정권자 패턴"
                        content={
                            Array.isArray(company.core_keywords) && company.core_keywords.length > 0
                                ? `핵심 키워드: ${(company.core_keywords as string[]).slice(0, 3).join(', ')} 등을 중심으로 비즈니스 전략을 펼치고 있습니다.`
                                : 'C-Level 중심의 의사결정 구조가 확인됩니다. 기술 도입 효율성과 데이터 기반 전략에 민감하게 반응합니다.'
                        }
                    />
                    <InsightCard
                        icon={<TrendingUp className="h-5 w-5 text-zi-blue" />}
                        title="시장 기회 포착"
                        content={
                            company.recent_status
                                ? company.recent_status.slice(0, 120)
                                : '최신 뉴스 분석 결과, 동종 업계 대비 신규 투자 영역에서 성장 기회가 확인됩니다.'
                        }
                    />
                    <InsightCard
                        icon={<AlertTriangle className="h-5 w-5 text-zi-error" />}
                        title="커뮤니케이션 리스크"
                        content="최근 업계 동향 변화로 내부 인사 및 전략 방향에 변동이 있을 수 있으므로, 의사결정 구조의 재확인이 선행되어야 합니다."
                    />
                </section>

                {/* ─────────────────────────────── */}
                {/* Activity Timeline */}
                {/* ─────────────────────────────── */}
                <section>
                    <div className="mb-8 flex items-center justify-between">
                        <h2 className="text-zi-headline-md font-bold text-zi-primary">Activity Timeline</h2>
                        <button className="text-zi-label font-semibold text-zi-primary underline decoration-1">
                            전체 기사 보기
                        </button>
                    </div>

                    <div className="space-y-0">
                        {company.recentArticles.length > 0 ? (
                            company.recentArticles.map((article: typeof company.recentArticles[number], idx: number) => (
                                <TimelineItem
                                    key={article.id}
                                    date={article.pub_date
                                        ? new Date(article.pub_date).toLocaleDateString('ko-KR', {
                                              year: 'numeric',
                                              month: '2-digit',
                                              day: '2-digit',
                                          })
                                        : '날짜 없음'
                                    }
                                    category={article.source ?? 'News'}
                                    title={article.title}
                                    summary={article.description?.slice(0, 120) ?? ''}
                                    url={article.link ?? undefined}
                                    isFirst={idx === 0}
                                    isLast={idx === company.recentArticles.length - 1}
                                />
                            ))
                        ) : (
                            <div className="border border-zi-divider bg-white p-8 text-center text-zi-body-md text-zi-on-surface-variant">
                                수집된 기사가 없습니다. 뉴스 수집 후 다시 확인해 주세요.
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

// ─────────────────────────────────────────────
// 내부 컴포넌트
// ─────────────────────────────────────────────

function InsightCard({
    icon,
    title,
    content,
}: {
    icon: React.ReactNode;
    title: string;
    content: string;
}) {
    return (
        <div className="border border-zi-divider bg-zi-surface-low p-6">
            <span className="mb-4 block">{icon}</span>
            <h4 className="mb-2 text-zi-body-lg font-semibold">{title}</h4>
            <p className="text-sm text-slate-600">{content}</p>
        </div>
    );
}

function TimelineItem({
    date,
    category,
    title,
    summary,
    url,
    isFirst,
    isLast,
}: {
    date: string;
    category: string;
    title: string;
    summary: string;
    url?: string;
    isFirst: boolean;
    isLast: boolean;
}) {
    return (
        <div className={`relative pl-12 pb-12 ${!isLast ? 'zi-timeline-item' : ''}`}>
            {/* 타임라인 도트 */}
            <div
                className={`absolute left-0 top-0 z-10 h-4 w-4 rounded-full border-4 border-white shadow-sm ${
                    isFirst ? 'bg-zi-primary' : 'bg-slate-200'
                }`}
            />

            <div className="flex flex-col gap-6 md:flex-row">
                {/* 날짜 */}
                <div className="flex-shrink-0 md:w-32">
                    <span className="text-zi-label font-semibold text-slate-400">{date}</span>
                </div>

                {/* 기사 카드 */}
                <div className="flex-grow border border-zi-divider bg-white p-6 transition-shadow hover:shadow-sm">
                    <div className="flex-grow">
                        <span
                            className={`mb-2 block text-[11px] font-bold uppercase ${
                                isFirst ? 'text-zi-blue' : 'text-slate-400'
                            }`}
                        >
                            {category}
                        </span>
                        <h3 className="mb-2 text-zi-body-lg font-semibold">{title}</h3>
                        {summary && (
                            <p className="line-clamp-2 text-sm text-slate-500">{summary}</p>
                        )}
                        {url && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-zi-label font-semibold text-zi-blue hover:underline"
                            >
                                원문 보기
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
