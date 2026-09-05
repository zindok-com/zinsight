'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Link from 'next/link';
import { CHANNEL_COLORS } from '@/lib/analytics/types';
import { ReportExportModal } from '@/components/admin/analytics/ReportExportModal';


const PERIOD_OPTIONS = [
    { label: '7일', value: '7' },
    { label: '30일', value: '30' },
    { label: '90일', value: '90' },
    { label: '전체', value: 'all' },
];

function StatCard({ label, value }: { label: string; value: string | number | null }) {
    return (
        <div className="rounded-xl border bg-card p-5 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold">{value ?? '—'}</p>
        </div>
    );
}

function NoData({ msg }: { msg?: string }) {
    return (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border rounded-xl bg-muted/30">
            {msg ?? '데이터를 불러올 수 없습니다.'}
        </div>
    );
}

interface Props {
    data: Awaited<ReturnType<typeof import('@/actions/admin/analytics-actions').getOrgAnalyticsSummary>>;
    orgId: number;
    currentPeriod: string;
}

type VisitorTab = 'geography' | 'device' | 'hour' | 'returning';

const DEVICE_LABELS: Record<string, string> = {
    desktop: '💻 PC',
    mobile: '📱 모바일',
    tablet: '📟 태블릿',
};

export function OrgAnalyticsClient({ data, orgId, currentPeriod }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [visitorTab, setVisitorTab] = useState<VisitorTab>('geography');
    const [showReportModal, setShowReportModal] = useState(false);

    if (!data) return <NoData msg="조직 데이터를 찾을 수 없습니다." />;

    const { org, summary, pageviews, geography, trafficSources, visitorAttributes, linkedArticles, outboundLinkTable } = data;


    const pvChartData = pageviews.map((r) => ({
        date: r.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        조회수: r.views,
    }));

    const channelChartData = (trafficSources ?? []).map((r) => ({
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
            {showReportModal && org && (
                <ReportExportModal
                    entityType="organization"
                    entityId={org.id}
                    entityName={org.name}
                    currentPeriod={currentPeriod}
                    analyticsData={data}
                    onClose={() => setShowReportModal(false)}
                />
            )}

            {/* 기간 선택 + 리포트 버튼 */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2">
                    {PERIOD_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => router.push(`${pathname}?period=${opt.value}`)}
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

            {/* 요약 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-card p-5 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">프로필 전체 조회수</p>
                    <p className="text-3xl font-bold">{summary.profileViews?.toLocaleString() ?? '—'}</p>
                    <p className="text-[11px] text-muted-foreground">레이더 프로필 총 열람 횟수</p>
                </div>
                <div className="rounded-xl border bg-card p-5 space-y-1">
                    <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">포스트 ➔ 프로필 유입</p>
                    <p className="text-3xl font-bold text-emerald-700">{summary.inboundFromArticles?.toLocaleString() ?? 0}회</p>
                    <p className="text-[11px] text-muted-foreground">매거진 기사에서 프로필 클릭 전환</p>
                </div>
                <div className="rounded-xl border bg-card p-5 space-y-1">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">외부 아웃바운드 전환</p>
                    <p className="text-3xl font-bold text-blue-700">{summary.outboundClicks?.toLocaleString() ?? '—'}</p>
                    <p className="text-[11px] text-muted-foreground">공식 홈페이지 / SNS 링크 클릭</p>
                </div>
                <div className="rounded-xl border bg-card p-5 space-y-1">
                    <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">프로필 ➔ 포스트 열람</p>
                    <p className="text-3xl font-bold text-indigo-700">{summary.articleClicksFromProfile?.toLocaleString() ?? 0}회</p>
                    <p className="text-[11px] text-muted-foreground">프로필에서 연관 기사로 이동</p>
                </div>
            </div>

            {/* 날짜별 조회수 */}
            <div className="space-y-3">
                <h2 className="text-base font-semibold">📈 날짜별 프로필 조회수</h2>
                {pvChartData.length > 0 ? (
                    <div className="border rounded-xl p-4 bg-card">
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={pvChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="조회수" stroke="#4f46e5" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : <NoData />}
            </div>

            {/* 외부 링크 클릭 상세 */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">🔗 외부 아웃바운드 링크별 클릭</h2>
                    <p className="text-xs text-muted-foreground">프로필에 등록된 외부 링크 클릭수 (GA4)</p>
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



            {/* 방문자 지역 */}
            {/* F-08 유입 채널 */}
            {channelChartData.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-base font-semibold">📊 유입 채널 (세분화)</h2>
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
                </div>
            )}

            {/* F-13 방문자 속성 탭 */}
            <div className="space-y-3">
                <h2 className="text-base font-semibold">👥 방문자 속성</h2>
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

            {/* 연결된 기사 유입 기여도 */}
            <div className="space-y-3">
                <h2 className="text-base font-semibold">📰 연결된 매거진 기사 및 유입 기여도</h2>
                <p className="text-xs text-muted-foreground">이 조직과 연결된 기사 목록 및 각 기사 본문에서 조직 프로필로 유입된 클릭 전환 성과</p>
                {linkedArticles.length > 0 ? (
                    <div className="border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">기사 제목</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">누적 조회수</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-emerald-600">프로필 유입 클릭</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">애널리틱스</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(linkedArticles as { id: number; title: string; slug: string; viewCount: number; inboundClicks?: number }[]).map((a) => (
                                    <tr key={a.id} className="border-t">
                                        <td className="px-4 py-2.5 max-w-xs">
                                            <span className="line-clamp-1 font-medium">{a.title}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-muted-foreground">{a.viewCount.toLocaleString()}</td>
                                        <td className="px-4 py-2.5 text-right">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {(a.inboundClicks ?? 0).toLocaleString()}회
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Link
                                                href={`/admin/magazine/edit/${a.id}/analytics`}
                                                className="text-indigo-600 hover:underline text-xs"
                                            >
                                                기사 통계 →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <NoData msg="연결된 기사가 없습니다." />}
            </div>

            {/* 하단 각주 */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 leading-relaxed">
                <strong>데이터 한계 안내:</strong> AI 개요·LLM을 통해 이 조직 프로필을 열람한 사용자 수는
                외부 플랫폼의 비공개 정책상 수집이 불가능하며, 본 리포트에 포함되지 않습니다.
            </div>
        </div>
    );
}