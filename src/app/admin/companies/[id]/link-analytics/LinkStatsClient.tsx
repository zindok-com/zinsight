'use client';

import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import type { LinkPageStats } from '@/actions/admin/link-page-stats-actions';
import { LINK_PAGE_LINK_KIND_LABEL, type LinkPageLinkKind } from '@/lib/org-links';
import { downloadCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';

const SERIES = [
    { key: 'views', label: '방문', color: '#4f46e5' },
    { key: 'clicks', label: '링크 클릭', color: '#0ea5e9' },
    { key: 'inquiryClicks', label: '문의하기', color: '#f59e0b' },
    { key: 'leads', label: '연락처 접수', color: '#10b981' },
    { key: 'videoPlays', label: '영상 재생', color: '#e11d48' },
] as const;

type SeriesKey = (typeof SERIES)[number]['key'];

/** 일별 추이 그래프 (항목 버튼으로 표시·숨김) */
export function LinkDailyChart({ daily }: { daily: LinkPageStats['daily'] }) {
    const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set(['clicks']));
    const toggle = (key: SeriesKey) =>
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    const data = daily.map((d) => ({ ...d, label: d.date.slice(5).replace('-', '.') }));

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="그래프 항목">
                {SERIES.map((s) => {
                    const on = !hidden.has(s.key);
                    return (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => toggle(s.key)}
                            aria-pressed={on}
                            className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium ${
                                on ? 'bg-card text-foreground' : 'bg-muted/50 text-muted-foreground line-through'
                            }`}
                        >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color, opacity: on ? 1 : 0.4 }} aria-hidden="true" />
                            {s.label}
                        </button>
                    );
                })}
            </div>
            <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={16} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''} />
                    <Legend wrapperStyle={{ display: 'none' }} />
                    {SERIES.filter((s) => !hidden.has(s.key)).map((s) => (
                        <Line
                            key={s.key}
                            type="monotone"
                            dataKey={s.key}
                            name={s.label}
                            stroke={s.color}
                            strokeWidth={2}
                            dot={data.length <= 31 ? { r: 2 } : false}
                            isAnimationActive={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

/** 고객사 보고용 CSV: 요약 → 일별 → 유입 경로 → 링크별 */
export function LinkStatsCsvButton({ stats }: { stats: LinkPageStats }) {
    const handleExport = () => {
        const pct = (n: number, d: number) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : '');
        downloadCsv(`${stats.org.name}_링크페이지통계_${stats.range.from}_${stats.range.to}.csv`, [
            ['링크 페이지 통계', stats.org.name],
            ['기간(KST)', `${stats.range.from} ~ ${stats.range.to}`],
            ['직전 기간', `${stats.previousRange.from} ~ ${stats.previousRange.to}`],
            [],
            ['항목', '이번 기간', '직전 기간'],
            ['방문', stats.views, stats.previous.views],
            ['순방문(일별 합)', stats.uniqueViews, stats.previous.uniqueViews],
            ['링크 클릭', stats.clicks, stats.previous.clicks],
            ['문의하기 클릭', stats.inquiryClicks, stats.previous.inquiryClicks],
            ['연락처 남기기 열기', stats.leadFormOpens, stats.previous.leadFormOpens],
            ['연락처 접수', stats.leads, stats.previous.leads],
            ['영상 재생', stats.videoPlays, stats.previous.videoPlays],
            ['클릭률', pct(stats.clicks, stats.views), pct(stats.previous.clicks, stats.previous.views)],
            [],
            ['기기(방문)', `${stats.devices.countedFrom}부터 집계`],
            ['모바일', stats.devices.mobile],
            ['PC', stats.devices.desktop],
            [],
            ['날짜', '방문', '순방문', '링크 클릭', '문의하기', '연락처 남기기 열기', '연락처 접수', '영상 재생'],
            ...stats.daily.map((d) => [d.date, d.views, d.uniqueViews, d.clicks, d.inquiryClicks, d.leadFormOpens, d.leads, d.videoPlays]),
            [],
            ['유입 경로', '용도', '방문', '순방문', '클릭', '연락처 접수'],
            ...stats.sources.map((s) => [
                s.source === 'direct' ? 'direct' : `/go/${s.source}`,
                s.source === 'direct' ? '직접 방문' : s.label ?? '',
                s.views,
                s.uniqueViews,
                s.clicks,
                s.leads,
            ]),
            [],
            ['링크', '종류', '클릭', '순클릭', '클릭률'],
            ...stats.links.map((l) => [
                l.label,
                LINK_PAGE_LINK_KIND_LABEL[l.kind as LinkPageLinkKind] ?? l.kind,
                l.clicks,
                l.uniqueClicks,
                l.ctr === null ? '' : `${(l.ctr * 100).toFixed(1)}%`,
            ]),
        ]);
    };

    return (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExport} disabled={!stats.hasData}>
            <Download className="h-3.5 w-3.5" />
            CSV 내보내기
        </Button>
    );
}
