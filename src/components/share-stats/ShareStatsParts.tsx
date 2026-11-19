// 공유 통계 페이지·요약 리포트 공통 화면 조각 (서버 컴포넌트, JS 없이 렌더 → 휴대폰·인쇄 모두 가볍게)
import Image from 'next/image';
import { LINK_PAGE_LINK_KIND_LABEL, type LinkPageLinkKind } from '@/lib/org-links';
import type { SharedLinkStats } from '@/lib/stats-share';
import { siteConfig } from '@/config/site';

export const formatPercent = (value: number | null) => (value === null ? '—' : `${(value * 100).toFixed(1)}%`);
const n = (value: number) => value.toLocaleString('ko-KR');

export function ShareBrand({ compact = false }: { compact?: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <Image src="/img/zinsight_icon.png" alt="" width={compact ? 18 : 22} height={compact ? 18 : 22} className="rounded" />
            <span className={`font-bold text-zi-primary ${compact ? 'text-xs' : 'text-sm'}`}>진사이트</span>
        </span>
    );
}

export function AnonymousNotice() {
    return (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs leading-relaxed text-slate-600">
            익명 통계입니다. 이름·연락처 등 개인을 알 수 있는 정보는 포함하지 않으며, 검색 로봇·링크 미리보기·관리자 확인 방문은 제외했습니다. (KST 기준)
        </p>
    );
}

export function KpiGrid({ stats, variant = 'page' }: { stats: SharedLinkStats; variant?: 'page' | 'report' }) {
    const items: Array<{ label: string; value: string; sub?: string; accent?: boolean }> = [
        { label: '방문 수', value: n(stats.views), sub: `순방문 ${n(stats.uniqueViews)}명` },
        { label: '링크 클릭 수', value: n(stats.clicks), sub: `방문 대비 ${formatPercent(stats.views > 0 ? stats.clicks / stats.views : null)}` },
        { label: '외부 이동 비율', value: formatPercent(stats.outboundRate), sub: `홈페이지·SNS·자료 등 ${n(stats.outboundClicks)}회` },
        { label: '영상 재생 수', value: n(stats.videoPlays) },
        { label: '문의하기 클릭 수', value: n(stats.inquiryClicks), accent: true },
    ];
    const grid = variant === 'report' ? 'grid-cols-2 sm:grid-cols-5 print:grid-cols-5' : 'grid-cols-2 lg:grid-cols-5';
    const lastSpan = variant === 'report' ? 'col-span-2 sm:col-span-1 print:col-span-1' : 'col-span-2 lg:col-span-1';
    return (
        <dl className={`grid gap-2.5 ${grid}`}>
            {items.map((item, index) => (
                <div
                    key={item.label}
                    className={`break-inside-avoid rounded-xl border p-3 sm:p-4 ${item.accent ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white'} ${index === items.length - 1 ? lastSpan : ''}`}
                >
                    <dt className={`text-xs font-semibold ${item.accent ? 'text-indigo-700' : 'text-slate-500'}`}>{item.label}</dt>
                    <dd className={`mt-1 font-bold tabular-nums text-slate-900 ${variant === 'report' ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>{item.value}</dd>
                    {item.sub && <dd className="mt-0.5 text-[11px] text-slate-500 tabular-nums">{item.sub}</dd>}
                </div>
            ))}
        </dl>
    );
}

export function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
    return (
        <section className="break-inside-avoid rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {note && <p className="mt-0.5 text-[11px] text-slate-500">{note}</p>}
            <div className="mt-3">{children}</div>
        </section>
    );
}

export function EmptyNote() {
    return <p className="py-6 text-center text-sm text-slate-400">아직 데이터가 없습니다.</p>;
}

const shortDate = (ymd: string) => `${Number(ymd.slice(5, 7))}.${Number(ymd.slice(8, 10))}`;

/** 일자별 방문 막대 (기간이 길면 막대가 가늘어지고, 날짜 표시는 처음·중간·끝만) */
export function DailyBars({ daily, height = 140 }: { daily: SharedLinkStats['daily']; height?: number }) {
    const max = Math.max(1, ...daily.map((d) => d.views));
    if (daily.every((d) => d.views === 0)) return <EmptyNote />;
    const ticks = new Set([0, Math.floor((daily.length - 1) / 2), daily.length - 1]);
    return (
        <div>
            <div className="flex items-end justify-between text-[10px] text-slate-400 tabular-nums">
                <span>최대 {n(max)}</span>
            </div>
            <div
                className="mt-1 flex items-end gap-px border-b border-slate-200"
                style={{ height }}
                role="img"
                aria-label={`일자별 방문: ${daily.map((d) => `${d.date} ${d.views}회`).join(', ')}`}
            >
                {daily.map((d) => (
                    <div key={d.date} className="flex h-full min-w-0 flex-1 items-end" title={`${d.date} 방문 ${d.views} · 클릭 ${d.clicks}`}>
                        <div className="w-full rounded-t-sm bg-indigo-500 print-exact" style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views > 0 ? 2 : 0 }} />
                    </div>
                ))}
            </div>
            <div className="relative mt-1 h-4 text-[10px] text-slate-500 tabular-nums">
                {daily.map((d, i) =>
                    ticks.has(i) ? (
                        <span
                            key={d.date}
                            className="absolute"
                            style={i === 0 ? { left: 0 } : i === daily.length - 1 ? { right: 0 } : { left: `${((i + 0.5) / daily.length) * 100}%`, transform: 'translateX(-50%)' }}
                        >
                            {shortDate(d.date)}
                        </span>
                    ) : null
                )}
            </div>
        </div>
    );
}

export function HourlyBars({ hours }: { hours: number[] }) {
    const max = Math.max(1, ...hours);
    if (hours.every((v) => v === 0)) return <EmptyNote />;
    return (
        <div>
            <div className="flex h-24 items-end gap-0.5 border-b border-slate-200" role="img" aria-label={`시간대별 방문: ${hours.map((v, h) => `${h}시 ${v}회`).join(', ')}`}>
                {hours.map((v, h) => (
                    <div key={h} className="flex h-full flex-1 items-end" title={`${h}시 방문 ${v}`}>
                        <div className="w-full rounded-t-sm bg-sky-500 print-exact" style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }} />
                    </div>
                ))}
            </div>
            <div className="mt-1 grid grid-cols-4 text-[10px] text-slate-500 tabular-nums">
                <span>0시</span>
                <span>6시</span>
                <span>12시</span>
                <span className="flex justify-between">
                    18시<span>23시</span>
                </span>
            </div>
        </div>
    );
}

/** 이름 · 비율 막대 · 숫자 한 줄 목록 (유입 경로·링크 순위 공통) */
export function ShareBarList({
    rows,
    unit,
    limit,
}: {
    rows: Array<{ key: string; name: string; sub?: string; value: number; share: number }>;
    unit: string;
    limit?: number;
}) {
    if (rows.length === 0) return <EmptyNote />;
    const shown = limit ? rows.slice(0, limit) : rows;
    return (
        <ol className="space-y-3">
            {shown.map((row, index) => (
                <li key={row.key} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 flex-1">
                            <span className="mr-1.5 text-xs font-semibold text-slate-400 tabular-nums">{index + 1}</span>
                            <span className="break-all font-medium text-slate-800">{row.name}</span>
                            {row.sub && <span className="ml-1.5 text-[11px] text-slate-500">{row.sub}</span>}
                        </span>
                        <span className="shrink-0 tabular-nums font-semibold text-slate-900">
                            {n(row.value)}
                            <span className="ml-0.5 text-[11px] font-normal text-slate-500">{unit}</span>
                            <span className="ml-1.5 inline-block w-12 text-right text-xs font-normal text-slate-500">{formatPercent(row.share)}</span>
                        </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-indigo-400 print-exact" style={{ width: `${Math.max(row.share * 100, row.value > 0 ? 1 : 0)}%` }} />
                    </div>
                </li>
            ))}
        </ol>
    );
}

export const sourceRows = (stats: SharedLinkStats) =>
    stats.sources.map((s) => ({ key: s.source, name: s.name, value: s.views, share: s.share }));

export const linkRows = (stats: SharedLinkStats) =>
    stats.links.map((l, i) => ({
        key: `${i}-${l.label}`,
        name: l.label,
        sub: LINK_PAGE_LINK_KIND_LABEL[l.kind as LinkPageLinkKind] ?? undefined,
        value: l.clicks,
        share: l.share,
    }));

export function ShareFooter() {
    return (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-[11px] text-slate-500">
            <ShareBrand compact />
            <span>
                통계 문의{' '}
                <a href={`mailto:${siteConfig.company.email}`} className="underline underline-offset-2 hover:text-slate-700">
                    {siteConfig.company.email}
                </a>
            </span>
        </footer>
    );
}
