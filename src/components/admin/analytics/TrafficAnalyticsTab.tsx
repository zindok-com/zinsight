'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Users, Eye, MousePointerClick, Search, Newspaper, Radar } from 'lucide-react';
import type { CustomChannel, PlatformTrafficRow, RealtimeOverview } from '@/lib/analytics/types';
import type { VisitorOrgAnalytics } from '@/actions/visitor-org-actions';
import { PlatformTrafficBreakdownCard } from './PlatformTrafficBreakdownCard';
import { RealtimeAndB2BVisitorsCard } from './RealtimeAndB2BVisitorsCard';

interface Props {
    periodLabel: string;
    traffic: {
        platformBreakdown: PlatformTrafficRow[];
        realtimeOverview: RealtimeOverview | null;
        summary: { totalDau: number; totalViews: number; totalSessions: number } | null;
        dailyData: { date: string; dau: number; views: number; sessions: number }[];
    };
    visitors: VisitorOrgAnalytics;
}

const CHANNEL_META: Record<CustomChannel, { label: string; color: string }> = {
    search: { label: '검색엔진', color: '#3b82f6' },
    ai_service: { label: 'AI 서비스', color: '#8b5cf6' },
    sns: { label: 'SNS', color: '#f59e0b' },
    direct: { label: '직접 방문', color: '#10b981' },
    other: { label: '외부 링크·기타', color: '#94a3b8' },
};

const PAGE_TYPE_LABEL: Record<string, string> = {
    magazine: '매거진',
    radar: '인사이트 레이더',
    home: '홈',
    other: '기타',
};

function formatDateTime(d: Date | string) {
    return new Date(d).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul',
    });
}

export function TrafficAnalyticsTab({ periodLabel, traffic, visitors }: Props) {
    const [orgQuery, setOrgQuery] = useState('');

    // 플랫폼 행을 채널(검색/AI/SNS/직접/기타) 단위로 합산
    const channelShare = useMemo(() => {
        const total = traffic.platformBreakdown.reduce((s, r) => s + r.sessions, 0);
        const map = new Map<CustomChannel, number>();
        for (const r of traffic.platformBreakdown) map.set(r.category, (map.get(r.category) ?? 0) + r.sessions);
        return (Object.keys(CHANNEL_META) as CustomChannel[])
            .map((key) => ({ key, sessions: map.get(key) ?? 0, pct: total > 0 ? ((map.get(key) ?? 0) / total) * 100 : 0 }))
            .sort((a, b) => b.sessions - a.sessions);
    }, [traffic.platformBreakdown]);

    const maxDaily = Math.max(1, ...traffic.dailyData.map((d) => d.sessions));
    const filteredOrgs = visitors.topOrgs.filter((o) => o.orgName.toLowerCase().includes(orgQuery.trim().toLowerCase()));
    const b2bTypeTotal = visitors.pageTypeShare.reduce((s, t) => s + t.visits, 0);

    const summaryCards = [
        { label: '방문자(DAU 합계)', value: traffic.summary?.totalDau, icon: Users },
        { label: '세션', value: traffic.summary?.totalSessions, icon: MousePointerClick },
        { label: '페이지뷰', value: traffic.summary?.totalViews, icon: Eye },
        { label: 'B2B 기관 방문', value: visitors.b2bVisits, icon: Building2, sub: `${visitors.uniqueB2bOrgs}개 기관` },
    ];

    return (
        <div className="space-y-6">
            {/* 요약 지표 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {summaryCards.map((c) => (
                    <div key={c.label} className="border rounded-xl p-4 bg-card">
                        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            {c.label}
                            <c.icon className="w-4 h-4" />
                        </div>
                        <div className="mt-2 text-2xl font-bold tabular-nums">
                            {c.value === undefined || c.value === null ? '—' : c.value.toLocaleString()}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{c.sub ?? periodLabel}</p>
                    </div>
                ))}
            </div>
            {!traffic.summary && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    GA4 데이터를 불러오지 못했습니다. API 연동 진단 탭에서 GA4 연결 상태를 확인해 주세요.
                </p>
            )}

            {/* 일별 세션 추이 */}
            {traffic.dailyData.length > 0 && (
                <div className="border rounded-xl p-4 sm:p-5 bg-card">
                    <h3 className="text-sm sm:text-base font-semibold">일별 세션 추이 ({periodLabel})</h3>
                    <div className="mt-4 flex items-end gap-[2px] h-32" role="img" aria-label="일별 세션 막대 그래프">
                        {traffic.dailyData.map((d) => (
                            <div
                                key={d.date}
                                className="flex-1 min-w-[3px] rounded-t bg-indigo-400/80 hover:bg-indigo-600 transition-colors"
                                style={{ height: `${Math.max(2, (d.sessions / maxDaily) * 100)}%` }}
                                title={`${d.date} · 세션 ${d.sessions.toLocaleString()} · 방문자 ${d.dau.toLocaleString()}`}
                            />
                        ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                        <span>{traffic.dailyData[0]?.date}</span>
                        <span>{traffic.dailyData[traffic.dailyData.length - 1]?.date}</span>
                    </div>
                </div>
            )}

            {/* 채널 비중 + 플랫폼 랭킹 */}
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="border rounded-xl p-4 sm:p-5 bg-card space-y-3">
                    <h3 className="text-sm sm:text-base font-semibold">유입 채널 비중</h3>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                        {channelShare.filter((c) => c.pct > 0).map((c) => (
                            <div key={c.key} style={{ width: `${c.pct}%`, backgroundColor: CHANNEL_META[c.key].color }} title={`${CHANNEL_META[c.key].label} ${c.pct.toFixed(1)}%`} />
                        ))}
                    </div>
                    <ul className="space-y-2 text-sm">
                        {channelShare.map((c) => (
                            <li key={c.key} className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHANNEL_META[c.key].color }} />
                                    {CHANNEL_META[c.key].label}
                                </span>
                                <span className="tabular-nums text-muted-foreground">
                                    {c.sessions.toLocaleString()} · <b className="text-foreground">{c.pct.toFixed(1)}%</b>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <PlatformTrafficBreakdownCard
                    rows={traffic.platformBreakdown}
                    title={`🌐 플랫폼별 유입 랭킹 (${periodLabel})`}
                    subtitle="네이버·구글·다음·빙·ChatGPT·Perplexity 등 GA4 세션 기준"
                />
            </div>

            {/* 실시간 접속 + 최근 방문 기관 (메인 대시보드와 동일 위젯, 최근 100건) */}
            <RealtimeAndB2BVisitorsCard
                realtime={traffic.realtimeOverview}
                visitorLogs={visitors.recentLogs}
                b2bCount={visitors.b2bVisits}
                totalLogCount={visitors.totalVisits}
            />

            {/* B2B 기관 분석 */}
            {!visitors.tableReady ? (
                <p className="text-sm text-muted-foreground border rounded-xl p-4">방문 기관 로그 테이블이 아직 준비되지 않았습니다. (DB 마이그레이션 확인 필요)</p>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="border rounded-xl p-4 sm:p-5 bg-card space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm sm:text-base font-semibold">방문 기관 랭킹 ({periodLabel})</h3>
                            <label className="relative">
                                <span className="sr-only">기관명 검색</span>
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <input
                                    value={orgQuery}
                                    onChange={(e) => setOrgQuery(e.target.value)}
                                    placeholder="기관명 검색"
                                    className="h-9 w-40 rounded-md border bg-background pl-8 pr-2 text-sm"
                                />
                            </label>
                        </div>
                        {filteredOrgs.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">해당 기간에 식별된 기관 방문이 없습니다.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-muted-foreground border-b">
                                            <th className="py-2 pr-2 font-medium">#</th>
                                            <th className="py-2 pr-2 font-medium">기관</th>
                                            <th className="py-2 pr-2 font-medium text-right">방문</th>
                                            <th className="py-2 font-medium text-right whitespace-nowrap">최근 방문</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrgs.map((o, i) => (
                                            <tr key={o.orgName} className="border-b last:border-0">
                                                <td className="py-2 pr-2 text-muted-foreground tabular-nums">{i + 1}</td>
                                                <td className="py-2 pr-2">
                                                    <div className="font-medium break-all">{o.orgName}</div>
                                                    {o.city && <div className="text-[11px] text-muted-foreground">{o.city}</div>}
                                                </td>
                                                <td className="py-2 pr-2 text-right font-semibold tabular-nums">{o.visits}</td>
                                                <td className="py-2 text-right text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(o.lastVisitedAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 min-w-0">
                        <div className="border rounded-xl p-4 sm:p-5 bg-card space-y-3">
                            <h3 className="text-sm sm:text-base font-semibold">기관 방문 영역</h3>
                            {visitors.pageTypeShare.length === 0 ? (
                                <p className="text-sm text-muted-foreground">데이터 없음</p>
                            ) : (
                                <ul className="space-y-2 text-sm">
                                    {visitors.pageTypeShare.map((t) => (
                                        <li key={t.pageType}>
                                            <div className="flex justify-between">
                                                <span>{PAGE_TYPE_LABEL[t.pageType] ?? t.pageType}</span>
                                                <span className="tabular-nums text-muted-foreground">{t.visits}건</span>
                                            </div>
                                            <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${b2bTypeTotal ? (t.visits / b2bTypeTotal) * 100 : 0}%` }} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="border rounded-xl p-4 sm:p-5 bg-card space-y-3">
                            <h3 className="text-sm sm:text-base font-semibold">기관이 많이 본 콘텐츠</h3>
                            {visitors.topContents.length === 0 ? (
                                <p className="text-sm text-muted-foreground">데이터 없음</p>
                            ) : (
                                <ul className="divide-y text-sm">
                                    {visitors.topContents.map((c) => (
                                        <li key={c.pagePath} className="flex items-center justify-between gap-3 py-2">
                                            <Link href={c.pagePath} target="_blank" className="flex min-w-0 items-center gap-2 hover:underline">
                                                {c.pageType === 'radar' ? <Radar className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Newspaper className="h-3.5 w-3.5 shrink-0 text-indigo-600" />}
                                                <span className="truncate">{c.targetName}</span>
                                            </Link>
                                            <span className="shrink-0 tabular-nums text-muted-foreground">{c.visits}회</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
