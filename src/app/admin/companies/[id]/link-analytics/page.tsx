import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, MessageSquare, NotebookPen } from 'lucide-react';
import { getLinkPageStats, type LinkPageStatsRange } from '@/actions/admin/link-page-stats-actions';
import { LINK_PAGE_LINK_KIND_LABEL, type LinkPageLinkKind } from '@/lib/org-links';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrgAdminTabs } from '../OrgAdminTabs';
import { LinkDailyChart, LinkStatsCsvButton } from './LinkStatsClient';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;
const NO_DATA = '아직 데이터 없음';

function kstYmd(offsetDays = 0): string {
    const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);
}

// 기간: 7일·30일(오늘 포함) 또는 직접 지정. 잘못된 값은 최근 30일
function resolveRange(period?: string, from?: string, to?: string): LinkPageStatsRange & { period: string } {
    if (period === 'custom' && from && to && YMD.test(from) && YMD.test(to)) {
        const [a, b] = from <= to ? [from, to] : [to, from];
        if ((Date.parse(b) - Date.parse(a)) / 86_400_000 <= MAX_RANGE_DAYS) return { period: 'custom', from: a, to: b };
    }
    const days = period === '7' ? 7 : 30;
    return { period: String(days), from: kstYmd(-(days - 1)), to: kstYmd() };
}

function formatPercent(value: number | null): string {
    return value === null ? '—' : `${(value * 100).toFixed(1)}%`;
}

/** 직전 기간 대비 증감 (직전 0이면 증감률 대신 '신규') */
function Delta({ current, previous }: { current: number; previous: number }) {
    if (current === previous) return <span className="text-xs text-muted-foreground">변동 없음</span>;
    if (previous === 0) return <span className="text-xs font-semibold text-emerald-600">신규 +{current.toLocaleString()}</span>;
    const rate = (current - previous) / previous;
    const up = rate > 0;
    return (
        <span className={`text-xs font-semibold tabular-nums ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
            {up ? '▲' : '▼'} {Math.abs(rate * 100).toFixed(rate > -1 && rate < 1 ? 1 : 0)}%
            <span className="ml-1 font-normal text-muted-foreground">({previous.toLocaleString()})</span>
        </span>
    );
}

export default async function LinkAnalyticsPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const sp = await searchParams;
    const range = resolveRange(sp.period, sp.from, sp.to);
    const stats = await getLinkPageStats(Number(id), range);
    if (!stats) notFound();

    const linkPageUrl = `/insight-radar/${encodeURIComponent(stats.org.slug)}/links`;
    const periodHref = (p: string) => `/admin/companies/${id}/link-analytics?period=${p}`;
    const periodClass = (active: boolean) =>
        `inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold ${
            active ? 'border-foreground bg-foreground text-background' : 'bg-card text-muted-foreground hover:text-foreground'
        }`;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/admin/companies">
                        <Button variant="outline" size="icon" className="h-9 w-9" aria-label="조직 목록으로">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{stats.org.name}</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">링크 페이지 통계 · 자체 서버 집계 기준 (봇·미리보기 제외)</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <LinkStatsCsvButton stats={stats} />
                    <a href={linkPageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950">
                            <ExternalLink className="h-3.5 w-3.5" />
                            링크 페이지 보기
                        </Button>
                    </a>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <OrgAdminTabs orgId={id} active="link-analytics" unreadLeads={stats.unreadLeads} />

            {/* 기간 선택 */}
            <div className="flex flex-wrap items-center gap-2">
                <Link href={periodHref('7')} className={periodClass(range.period === '7')}>최근 7일</Link>
                <Link href={periodHref('30')} className={periodClass(range.period === '30')}>최근 30일</Link>
                <form method="get" className="flex flex-wrap items-center gap-1.5">
                    <input type="hidden" name="period" value="custom" />
                    <input type="date" name="from" defaultValue={range.from} aria-label="시작일" className="h-8 rounded-md border bg-card px-2 text-xs" />
                    <span className="text-xs text-muted-foreground">~</span>
                    <input type="date" name="to" defaultValue={range.to} aria-label="종료일" className="h-8 rounded-md border bg-card px-2 text-xs" />
                    <button type="submit" className={periodClass(range.period === 'custom')}>직접 지정</button>
                </form>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {range.from} ~ {range.to} (KST) · 비교: 직전 {stats.previousRange.from} ~ {stats.previousRange.to}
                </span>
            </div>

            {/* 상단 요약: 문의 전환(문의하기 클릭·연락처 접수)을 별도 강조, 괄호는 직전 기간 값 */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <Card className="border-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/30">
                    <CardContent className="p-4">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            <MessageSquare className="h-3.5 w-3.5" /> 문의하기 클릭
                        </p>
                        <p className={`mt-1 font-bold tabular-nums ${stats.hasData ? 'text-3xl' : 'text-base text-muted-foreground'}`}>{stats.hasData ? stats.inquiryClicks.toLocaleString() : NO_DATA}</p>
                        {stats.hasData && <Delta current={stats.inquiryClicks} previous={stats.previous.inquiryClicks} />}
                    </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30">
                    <CardContent className="p-4">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <NotebookPen className="h-3.5 w-3.5" /> 연락처 접수
                        </p>
                        <p className={`mt-1 font-bold tabular-nums ${stats.hasData ? 'text-3xl' : 'text-base text-muted-foreground'}`}>{stats.hasData ? stats.leads.toLocaleString() : NO_DATA}</p>
                        {stats.hasData && (
                            <p className="text-xs text-muted-foreground tabular-nums">
                                폼 열기 {stats.leadFormOpens.toLocaleString()}회 · <Link href={`/admin/companies/${id}/leads`} className="underline underline-offset-2 hover:text-foreground">목록</Link>
                            </p>
                        )}
                    </CardContent>
                </Card>
                <SummaryCard label="방문" value={stats.hasData ? stats.views : null} sub={stats.hasData ? `순방문 ${stats.uniqueViews.toLocaleString()}명` : undefined} delta={stats.hasData ? [stats.views, stats.previous.views] : undefined} />
                <SummaryCard label="링크 클릭" value={stats.hasData ? stats.clicks : null} delta={stats.hasData ? [stats.clicks, stats.previous.clicks] : undefined} />
                <SummaryCard
                    label="클릭률 (클릭 ÷ 방문)"
                    text={stats.hasData ? formatPercent(stats.views > 0 ? stats.clicks / stats.views : null) : NO_DATA}
                    sub={stats.hasData ? `직전 ${formatPercent(stats.previous.views > 0 ? stats.previous.clicks / stats.previous.views : null)}` : undefined}
                />
                <SummaryCard label="영상 재생" value={stats.hasData ? stats.videoPlays : null} sub={stats.hasData ? `방문 대비 ${formatPercent(stats.views > 0 ? stats.videoPlays / stats.views : null)}` : undefined} delta={stats.hasData ? [stats.videoPlays, stats.previous.videoPlays] : undefined} />
            </div>

            {/* 일별 추이 */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">일별 추이</CardTitle>
                    <CardDescription>항목을 눌러 그래프에서 켜고 끌 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent>{stats.hasData ? <LinkDailyChart daily={stats.daily} /> : <EmptyState />}</CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                {/* 유입 경로 */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">유입 경로별 방문</CardTitle>
                        <CardDescription>/go 코드로 들어온 방문은 코드별로, 그 밖은 직접 방문(direct)으로 셉니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.sources.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>경로</TableHead>
                                        <TableHead className="text-right">방문</TableHead>
                                        <TableHead className="text-right" title="날짜별 순방문자 수의 합">순방문</TableHead>
                                        <TableHead className="text-right">클릭</TableHead>
                                        <TableHead className="text-right">연락처</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.sources.map((s) => (
                                        <TableRow key={s.source}>
                                            <TableCell>
                                                <span className="font-mono text-xs">{s.source === 'direct' ? 'direct' : `/go/${s.source}`}</span>
                                                <span className="ml-1.5 text-xs text-muted-foreground">
                                                    {s.source === 'direct' ? '직접 방문' : s.label ?? ''}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{s.views.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{s.uniqueViews.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{s.clicks.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{s.leads.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                {/* 링크 종류별 합계 */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">링크 종류별 클릭</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.clicks === 0 ? (
                            <EmptyState />
                        ) : (
                            <ul className="divide-y">
                                {stats.kinds.map((k) => (
                                    <li key={k.kind} className="flex items-center justify-between py-2 text-sm">
                                        <span>{LINK_PAGE_LINK_KIND_LABEL[k.kind]}</span>
                                        <span className="tabular-nums font-semibold">
                                            {k.clicks.toLocaleString()}
                                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                {formatPercent(stats.clicks > 0 ? k.clicks / stats.clicks : null)}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
                {/* 기기 비율 */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">방문 기기</CardTitle>
                        <CardDescription>
                            원본 기록(90일 보관) 기준{stats.devices.countedFrom > range.from ? ` · ${stats.devices.countedFrom}부터 집계` : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DeviceRatio mobile={stats.devices.mobile} desktop={stats.devices.desktop} />
                    </CardContent>
                </Card>
                </div>
            </div>

            {/* 링크별 클릭 */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">링크별 클릭</CardTitle>
                    <CardDescription>클릭률은 같은 기간 방문 수 대비 클릭 수입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.links.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>링크</TableHead>
                                    <TableHead>종류</TableHead>
                                    <TableHead className="text-right">클릭</TableHead>
                                    <TableHead className="text-right" title="날짜별 순클릭자 수의 합">순클릭</TableHead>
                                    <TableHead className="text-right">클릭률</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.links.map((l) => (
                                    <TableRow key={l.key}>
                                        <TableCell className="max-w-[320px] truncate" title={l.label}>{l.label}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {LINK_PAGE_LINK_KIND_LABEL[l.kind as LinkPageLinkKind] ?? l.kind}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{l.clicks.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{l.uniqueClicks.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{formatPercent(l.ctr)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    text,
    sub,
    delta,
}: {
    label: string;
    value?: number | null;
    text?: string;
    sub?: string;
    delta?: [number, number];
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <p className={`mt-1 font-bold tabular-nums ${text === NO_DATA || value === null ? 'text-base text-muted-foreground' : 'text-2xl'}`}>
                    {text ?? (value === null || value === undefined ? NO_DATA : value.toLocaleString())}
                </p>
                {delta && <Delta current={delta[0]} previous={delta[1]} />}
                {sub && <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{sub}</p>}
            </CardContent>
        </Card>
    );
}

function EmptyState() {
    return <p className="py-8 text-center text-sm text-muted-foreground">{NO_DATA}</p>;
}

function DeviceRatio({ mobile, desktop }: { mobile: number; desktop: number }) {
    const total = mobile + desktop;
    if (total === 0) return <EmptyState />;
    const mobileRate = mobile / total;
    return (
        <div className="space-y-2">
            <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`모바일 ${formatPercent(mobileRate)}, PC ${formatPercent(1 - mobileRate)}`}>
                <div className="bg-indigo-500" style={{ width: `${mobileRate * 100}%` }} />
                <div className="bg-sky-300" style={{ width: `${(1 - mobileRate) * 100}%` }} />
            </div>
            <div className="flex justify-between text-sm tabular-nums">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
                    모바일 <strong>{mobile.toLocaleString()}</strong>
                    <span className="text-xs text-muted-foreground">{formatPercent(mobileRate)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-300" aria-hidden="true" />
                    PC <strong>{desktop.toLocaleString()}</strong>
                    <span className="text-xs text-muted-foreground">{formatPercent(1 - mobileRate)}</span>
                </span>
            </div>
        </div>
    );
}
