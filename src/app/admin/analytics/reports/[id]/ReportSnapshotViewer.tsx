'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Printer, ExternalLink, Code2, ChevronDown, ChevronUp } from 'lucide-react';

interface ReportSnapshotViewerProps {
    report: {
        id: number;
        entityType: string;
        entityId: number;
        entityName: string;
        reportType: string;
        periodDays: number;
        createdAt: string;
        dataSnapshot: any;
    };
}

const PERIOD_LABEL: Record<number, string> = {
    7: '최근 7일',
    30: '최근 30일',
    90: '최근 90일',
    0: '전체 기간',
};

export function ReportSnapshotViewer({ report }: ReportSnapshotViewerProps) {
    const [showRawJson, setShowRawJson] = useState(false);

    const snapshot = report.dataSnapshot || {};
    const summary = snapshot.summary || {};
    const trafficSources: any[] = snapshot.trafficSources || [];
    const platformBreakdown: any[] = snapshot.platformBreakdown || [];
    const searchQueries: any[] = snapshot.searchQueries || [];
    const outboundLinkTable: any[] = snapshot.outboundLinkTable || [];
    const geography: any[] = snapshot.geography || [];
    const gsc = snapshot.gsc || null;
    const isDetailed = report.reportType === 'detailed';

    const liveAnalyticsHref =
        report.entityType === 'article'
            ? `/admin/magazine/edit/${report.entityId}/analytics`
            : `/admin/companies/${report.entityId}/analytics`;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {/* 상단 네비게이션 (인쇄 시 숨김) */}
            <div className="flex items-center justify-between print:hidden">
                <Link
                    href="/admin/analytics/reports"
                    className="text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                    ← 리포트 이력 목록으로
                </Link>
                <div className="flex items-center gap-2">
                    <Link
                        href={liveAnalyticsHref}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        실시간 애널리틱스 보기
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        인쇄 / PDF 저장
                    </button>
                </div>
            </div>

            {/* 리포트 본문 컨테이너 */}
            <div className="border rounded-2xl p-6 md:p-8 bg-card space-y-8 shadow-2xs print:border-0 print:shadow-none print:p-0">
                {/* 헤더 */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-6">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {report.entityType === 'article' ? '📰 기사 리포트' : '🏢 조직 리포트'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                {report.reportType === 'simple' ? '간편형 요약' : '상세형 분석'}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 pt-1">{report.entityName}</h1>
                        <p className="text-xs text-muted-foreground">
                            측정 기간: <strong>{PERIOD_LABEL[report.periodDays] ?? `${report.periodDays}일`}</strong>
                            {' · '}스냅샷 생성일시: <strong>{report.createdAt}</strong>
                        </p>
                    </div>
                </div>

                {/* 스냅샷 안내 배너 */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800">
                    본 리포트는 <strong>{report.createdAt}</strong> 시점에 측정·저장된 고정 스냅샷입니다. 이후 발생한 조회 및 전환 수치는 반영되지 않습니다.
                </div>

                {/* 1. 핵심 성과 요약 (KPI) */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">1. 핵심 성과 지표 (KPI)</h2>
                    {report.entityType === 'article' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                            <div className="rounded-xl border bg-slate-50/60 p-4 space-y-1">
                                <p className="text-[11px] text-slate-500 font-medium">총 조회수</p>
                                <p className="text-2xl font-bold text-slate-900">{(summary.views ?? 0).toLocaleString()}회</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50/60 p-4 space-y-1">
                                <p className="text-[11px] text-slate-500 font-medium">레이더 프로필 전환</p>
                                <p className="text-2xl font-bold text-indigo-700">{(summary.radarClicks ?? 0).toLocaleString()}회</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50/60 p-4 space-y-1">
                                <p className="text-[11px] text-slate-500 font-medium">전환율 (조회→레이더)</p>
                                <p className="text-2xl font-bold text-emerald-700">
                                    {summary.conversionRate != null ? `${summary.conversionRate}%` : '—'}
                                </p>
                            </div>
                            <div className="rounded-xl border bg-slate-50/60 p-4 space-y-1">
                                <p className="text-[11px] text-slate-500 font-medium">외부 링크 클릭</p>
                                <p className="text-2xl font-bold text-blue-700">{(summary.outboundClicks ?? 0).toLocaleString()}회</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                            <div className="rounded-xl border bg-slate-50/60 p-4 space-y-1">
                                <p className="text-[11px] text-slate-500 font-medium">프로필 전체 조회수</p>
                                <p className="text-2xl font-bold text-slate-900">{(summary.profileViews ?? 0).toLocaleString()}회</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50/60 p-4 space-y-1">
                                <p className="text-[11px] text-slate-500 font-medium">포스트 ➔ 프로필 유입</p>
                                <p className="text-2xl font-bold text-emerald-700">{(summary.inboundFromArticles ?? 0).toLocaleString()}회</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50/60 p-4 space-y-1">
                                <p className="text-[11px] text-slate-500 font-medium">외부 아웃바운드 전환</p>
                                <p className="text-2xl font-bold text-blue-700">{(summary.outboundClicks ?? 0).toLocaleString()}회</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50/60 p-4 space-y-1">
                                <p className="text-[11px] text-slate-500 font-medium">프로필 ➔ 포스트 열람</p>
                                <p className="text-2xl font-bold text-indigo-700">{(summary.articleClicksFromProfile ?? 0).toLocaleString()}회</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. 구글 검색 성과 (GSC, 기사 리포트인 경우) */}
                {gsc && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. 구글 검색 노출 성과 (Search Console)</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                            <div className="rounded-xl border p-4">
                                <p className="text-[11px] text-slate-500">검색 노출수</p>
                                <p className="text-xl font-bold mt-0.5">{(gsc.impressions ?? 0).toLocaleString()}회</p>
                            </div>
                            <div className="rounded-xl border p-4">
                                <p className="text-[11px] text-slate-500">검색 클릭수</p>
                                <p className="text-xl font-bold mt-0.5">{(gsc.clicks ?? 0).toLocaleString()}회</p>
                            </div>
                            <div className="rounded-xl border p-4">
                                <p className="text-[11px] text-slate-500">평균 클릭률 (CTR)</p>
                                <p className="text-xl font-bold mt-0.5">{gsc.ctr ?? 0}%</p>
                            </div>
                            <div className="rounded-xl border p-4">
                                <p className="text-[11px] text-slate-500">평균 게재순위</p>
                                <p className="text-xl font-bold mt-0.5">{gsc.position ? `${gsc.position}위` : '—'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. 유입 채널 및 세부 플랫폼 */}
                {(trafficSources.length > 0 || platformBreakdown.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {trafficSources.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">유입 채널 분포</h2>
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="text-left px-3.5 py-2.5 font-semibold text-slate-600">채널</th>
                                                <th className="text-right px-3.5 py-2.5 font-semibold text-slate-600">세션수</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trafficSources.map((ch: any, i: number) => (
                                                <tr key={i} className="border-b last:border-b-0">
                                                    <td className="px-3.5 py-2.5 font-medium">{ch.channelLabel || ch.channel}</td>
                                                    <td className="px-3.5 py-2.5 text-right font-semibold">
                                                        {(ch.sessions?.value ?? ch.sessions ?? 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {platformBreakdown.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">세부 유입 플랫폼 TOP</h2>
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="text-left px-3.5 py-2.5 font-semibold text-slate-600">플랫폼</th>
                                                <th className="text-right px-3.5 py-2.5 font-semibold text-slate-600">세션</th>
                                                <th className="text-right px-3.5 py-2.5 font-semibold text-slate-600">비중</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {platformBreakdown.slice(0, 8).map((p: any, i: number) => (
                                                <tr key={i} className="border-b last:border-b-0">
                                                    <td className="px-3.5 py-2.5 font-medium">{p.platform}</td>
                                                    <td className="px-3.5 py-2.5 text-right font-semibold">{(p.sessions ?? 0).toLocaleString()}</td>
                                                    <td className="px-3.5 py-2.5 text-right text-slate-500">{p.sharePercent ?? 0}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. 상세형 추가 데이터 (아웃바운드 링크 / 검색어 / 지역 분포) */}
                {(isDetailed || outboundLinkTable.length > 0 || searchQueries.length > 0) && (
                    <div className="space-y-6">
                        {outboundLinkTable.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">외부 아웃바운드 링크 클릭 상세</h2>
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="text-left px-3.5 py-2.5 font-semibold text-slate-600">도메인</th>
                                                <th className="text-left px-3.5 py-2.5 font-semibold text-slate-600">URL</th>
                                                <th className="text-right px-3.5 py-2.5 font-semibold text-slate-600">클릭수</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {outboundLinkTable.map((link: any, i: number) => (
                                                <tr key={i} className="border-b last:border-b-0">
                                                    <td className="px-3.5 py-2.5 font-medium">{link.domain}</td>
                                                    <td className="px-3.5 py-2.5 text-slate-600 truncate max-w-xs">{link.url}</td>
                                                    <td className="px-3.5 py-2.5 text-right font-semibold">{(link.clicks ?? 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {searchQueries.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">유입 검색어 (Search Queries)</h2>
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="text-left px-3.5 py-2.5 font-semibold text-slate-600">검색어</th>
                                                <th className="text-right px-3.5 py-2.5 font-semibold text-slate-600">클릭</th>
                                                <th className="text-right px-3.5 py-2.5 font-semibold text-slate-600">노출</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {searchQueries.slice(0, 10).map((q: any, i: number) => (
                                                <tr key={i} className="border-b last:border-b-0">
                                                    <td className="px-3.5 py-2.5 font-medium">{q.query}</td>
                                                    <td className="px-3.5 py-2.5 text-right font-semibold">{(q.clicks ?? 0).toLocaleString()}</td>
                                                    <td className="px-3.5 py-2.5 text-right text-slate-500">{(q.impressions ?? 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {isDetailed && geography.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">방문자 지역 분포 TOP 10</h2>
                                <div className="flex flex-wrap gap-2">
                                    {geography.slice(0, 10).map((g: any, i: number) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-slate-50 text-xs"
                                        >
                                            <span className="font-medium text-slate-700">{g.cityKr || g.city}</span>
                                            <span className="font-bold text-indigo-600">{(g.views ?? 0).toLocaleString()}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 원본 JSON 스냅샷 토글 (인쇄 시 숨김) */}
                <div className="pt-4 border-t print:hidden">
                    <button
                        type="button"
                        onClick={() => setShowRawJson(!showRawJson)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
                    >
                        <Code2 className="w-3.5 h-3.5" />
                        원본 데이터 스냅샷 (JSON) {showRawJson ? '접기' : '펼치기'}
                        {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {showRawJson && (
                        <pre className="mt-3 text-xs bg-slate-900 text-slate-100 rounded-xl p-4 overflow-auto max-h-[420px] leading-relaxed">
                            {JSON.stringify(report.dataSnapshot, null, 2)}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
}
