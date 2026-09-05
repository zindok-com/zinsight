'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CHANNEL_COLORS } from '@/lib/analytics/types';
import { ReportExportModal } from '@/components/admin/analytics/ReportExportModal';


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

    const changePeriod = (val: string) => {
        router.push(`${pathname}?period=${val}`);
    };

    if (!data) return <NoData msg="기사 데이터를 찾을 수 없습니다." />;

    const { post, summary, pageviews, trafficSources, geography, visitorAttributes, gsc, gscAppearance, gscGenerativeAI } = data;

    const pvChartData = pageviews.map((r) => ({
        date: r.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        조회수: r.views,
    }));

    const channelChartData = trafficSources.map((r) => ({
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
        <div className="space-y-8">
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

            <div className="flex items-center justify-between gap-4">
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
                <button
                    onClick={() => setShowReportModal(true)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                    📄 리포트 생성
                </button>
            </div>

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
                    <NoData msg="GA4 조회수 데이터가 없습니다." />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <SectionHeader title="📊 유입 채널 (세분화)" />
                    {channelChartData.length > 0 ? (
                        <div className="border rounded-xl p-4 bg-card space-y-2">
                            {channelChartData.map((ch) => {
                                const maxSessions = Math.max(...channelChartData.map((c) => c.sessions));
                                const pct = maxSessions > 0 ? (ch.sessions / maxSessions) * 100 : 0;
                                return (
                                    <div key={ch.name} className="flex items-center gap-3 text-sm">
                                        <span className="w-28 text-muted-foreground shrink-0">{ch.name}</span>
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
                            <p className="text-[11px] text-muted-foreground pt-1 leading-relaxed">
                                ⚠ AI 서비스 리퍼러로 식별되지 않은 AI 답변 내 링크 유입은 검색/직접 방문으로 계상됩니다.
                            </p>
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

            <div className="space-y-3">
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

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 leading-relaxed">
                <strong>데이터 한계 안내:</strong> AI 개요(AI Overviews)·LLM(ChatGPT 등)을 통해 콘텐츠를 열람한 사용자 수,
                LLM이 크롤링·인용한 콘텐츠 확인 사용자 수 및 해당 사용자의 지역별 상세 데이터는 외부 플랫폼의
                비공개 정책상 수집이 불가능하며, 본 리포트에 포함되지 않습니다.
            </div>
        </div>
    );
}