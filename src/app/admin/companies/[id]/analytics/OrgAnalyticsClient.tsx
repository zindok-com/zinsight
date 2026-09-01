'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

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

export function OrgAnalyticsClient({ data, orgId, currentPeriod }: Props) {
    const router = useRouter();
    const pathname = usePathname();

    if (!data) return <NoData msg="조직 데이터를 찾을 수 없습니다." />;

    const { summary, pageviews, geography, linkedArticles } = data;

    const pvChartData = pageviews.map((r) => ({
        date: r.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        조회수: r.views,
    }));

    return (
        <div className="space-y-8">
            {/* 기간 선택 */}
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

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard label="프로필 조회수" value={summary.profileViews?.toLocaleString() ?? '—'} />
                <StatCard label="아웃바운드 클릭" value={summary.outboundClicks?.toLocaleString() ?? '—'} />
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

            {/* 방문자 지역 */}
            <div className="space-y-3">
                <h2 className="text-base font-semibold">🗺 방문자 지역 분포</h2>
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
                ) : <NoData />}
            </div>

            {/* 연결된 기사 유입 기여도 */}
            <div className="space-y-3">
                <h2 className="text-base font-semibold">📰 연결된 매거진 기사</h2>
                <p className="text-xs text-muted-foreground">이 조직과 연결된 기사 목록 — 기사를 통해 프로필로 넘어오는 유입의 원천</p>
                {linkedArticles.length > 0 ? (
                    <div className="border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">기사 제목</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">누적 조회수</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">애널리틱스</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(linkedArticles as { id: number; title: string; slug: string; viewCount: number }[]).map((a) => (
                                    <tr key={a.id} className="border-t">
                                        <td className="px-4 py-2.5 max-w-xs">
                                            <span className="line-clamp-1">{a.title}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">{a.viewCount.toLocaleString()}</td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Link
                                                href={`/admin/magazine/edit/${a.id}/analytics`}
                                                className="text-indigo-600 hover:underline text-xs"
                                            >
                                                보기 →
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