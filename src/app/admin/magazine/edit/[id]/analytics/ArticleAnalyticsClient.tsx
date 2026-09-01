'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

const PERIOD_OPTIONS = [
    { label: '7일', value: '7' },
    { label: '30일', value: '30' },
    { label: '90일', value: '90' },
    { label: '전체', value: 'all' },
];

const CHANNEL_COLORS: Record<string, string> = {
    'Organic Search': '#4f46e5',
    'Direct': '#0ea5e9',
    'Referral': '#10b981',
    'Organic Social': '#f59e0b',
    'Paid Search': '#ef4444',
    'Email': '#8b5cf6',
    'Unknown': '#6b7280',
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

export function ArticleAnalyticsClient({ data, postId, currentPeriod }: Props) {
    const router = useRouter();
    const pathname = usePathname();

    const changePeriod = (val: string) => {
        router.push(`${pathname}?period=${val}`);
    };

    if (!data) return <NoData msg="기사 데이터를 찾을 수 없습니다." />;

    const { summary, pageviews, trafficSources, geography, gsc, gscAppearance } = data;

    // pageview 차트 데이터 포맷
    const pvChartData = pageviews.map((r) => ({
        date: r.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        조회수: r.views,
    }));

    // 유입 채널 파이 데이터
    const pieData = trafficSources.map((r) => ({ name: r.channel, value: r.sessions }));

    return (
        <div className="space-y-8">
            {/* 기간 선택 */}
            <div className="flex gap-2">
                {PERIOD_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => changePeriod(opt.value)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            currentPeriod === opt.value
                                ? 'bg-foreground text-background border-foreground'
                                : 'text-muted-foreground hover:text-foreground border-border'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="총 조회수" value={summary.views.toLocaleString()} />
                <StatCard label="레이더 전환수" value={summary.radarClicks?.toLocaleString() ?? '—'} sub="이벤트 수집 전 기사는 0" />
                <StatCard
                    label="전환율"
                    value={summary.conversionRate != null ? `${summary.conversionRate}%` : '—'}
                    sub="조회→레이더 클릭"
                />
                <StatCard label="아웃바운드 클릭" value={summary.outboundClicks?.toLocaleString() ?? '—'} />
            </div>

            {/* 날짜별 조회수 */}
            <div className="space-y-3">
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
                    <NoData msg="GA4 조회수 데이터가 없습니다. 이벤트 트래킹 설정을 확인하세요." />
                )}
            </div>

            {/* 유입 채널 + GSC */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <SectionHeader title="🍩 유입 채널" />
                    {pieData.length > 0 ? (
                        <div className="border rounded-xl p-4 bg-card">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {pieData.map((entry, i) => (
                                            <Cell key={i} fill={CHANNEL_COLORS[entry.name] ?? '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <NoData />
                    )}
                </div>

                <div className="space-y-3">
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
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        ⚠ AI 개요·LLM을 통한 노출·조회는 외부 플랫폼의 비공개 데이터로, 본 리포트에 포함되지 않습니다.
                    </p>
                </div>
            </div>

            {/* 전환 퍼널 */}
            <div className="space-y-3">
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

            {/* 방문자 지역 분포 */}
            <div className="space-y-3">
                <SectionHeader title="🗺 방문자 지역 분포" />
                <p className="text-xs text-muted-foreground">실제 사이트 방문자 기준 (AI 노출 미포함)</p>
                {geography.length > 0 ? (
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
                ) : (
                    <NoData />
                )}
            </div>

            {/* 하단 고정 각주 */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 leading-relaxed">
                <strong>데이터 한계 안내:</strong> AI 개요(AI Overviews)·LLM(ChatGPT 등)을 통해 콘텐츠를 열람한 사용자 수,
                LLM이 크롤링·인용한 콘텐츠 확인 사용자 수 및 해당 사용자의 지역별 상세 데이터는 외부 플랫폼의
                비공개 정책상 수집이 불가능하며, 본 리포트에 포함되지 않습니다.
            </div>
        </div>
    );
}