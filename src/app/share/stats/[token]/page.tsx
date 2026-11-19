import Link from 'next/link';
import { FileText } from 'lucide-react';
import {
    AnonymousNotice,
    DailyBars,
    HourlyBars,
    KpiGrid,
    Section,
    ShareBarList,
    ShareBrand,
    ShareFooter,
    linkRows,
    sourceRows,
} from '@/components/share-stats/ShareStatsParts';
import { loadSharedStats, periodQuery, type SharePeriod } from './load-shared-stats';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

// 참가사용 읽기 전용 통계 (로그인 없음). 숫자는 관리자 링크 페이지 통계와 같은 집계
export default async function SharedStatsPage({ params, searchParams }: PageProps) {
    const { token } = await params;
    const view = await loadSharedStats(token, await searchParams);
    const { stats, period, eventRange } = view;
    const base = `/share/stats/${token}`;

    const chip = (active: boolean) =>
        `inline-flex h-10 items-center rounded-full border px-3.5 text-xs font-semibold ${
            active ? 'border-zi-primary bg-zi-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
        }`;
    const periods: Array<{ key: SharePeriod; label: string }> = [
        ...(eventRange ? [{ key: 'event' as const, label: '전시 기간' }] : []),
        { key: 'all', label: '전체' },
        { key: '7', label: '최근 7일' },
        { key: '30', label: '최근 30일' },
    ];

    return (
        <main className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6 sm:py-8">
            <header className="space-y-3">
                <ShareBrand />
                <div>
                    <h1 className="text-xl font-bold leading-snug sm:text-2xl">{stats.orgName}</h1>
                    <p className="mt-0.5 text-sm text-slate-600">진사이트 카드(링크 페이지) 방문 통계</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500 tabular-nums">
                        {stats.range.from} ~ {stats.range.to}
                    </p>
                </div>
                <AnonymousNotice />
            </header>

            <nav aria-label="기간 선택" className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                    {periods.map((p) => (
                        <Link key={p.key} href={`${base}?period=${p.key}`} className={chip(period === p.key)} prefetch={false}>
                            {p.label}
                        </Link>
                    ))}
                </div>
                <form method="get" className="flex flex-wrap items-center gap-1.5">
                    <input type="hidden" name="period" value="custom" />
                    <input type="date" name="from" defaultValue={stats.range.from} aria-label="시작일" className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs" />
                    <span className="text-xs text-slate-400">~</span>
                    <input type="date" name="to" defaultValue={stats.range.to} aria-label="종료일" className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs" />
                    <button type="submit" className={chip(period === 'custom')}>
                        직접 지정
                    </button>
                </form>
            </nav>

            <KpiGrid stats={stats} />

            <Section title="일자별 방문 추이" note="막대에 마우스를 올리거나 길게 누르면 날짜별 방문·클릭 수가 보입니다.">
                <DailyBars daily={stats.daily} />
            </Section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Section title="유입 경로별 방문" note="명함·부스 QR 등 배포한 경로별로 셉니다. 경로 없이 들어온 방문은 직접 접속입니다.">
                    <ShareBarList rows={sourceRows(stats)} unit="회" />
                </Section>
                <Section
                    title="시간대별 방문"
                    note={
                        stats.hourly.countedFrom === null
                            ? '시간대 기록은 최근 90일만 보관합니다.'
                            : stats.hourly.countedFrom > stats.range.from
                              ? `시간대 기록은 최근 90일만 보관해 ${stats.hourly.countedFrom}부터 셉니다.`
                              : undefined
                    }
                >
                    <HourlyBars hours={stats.hourly.hours} />
                </Section>
            </div>

            <Section title="링크별 클릭 순위" note="비율은 전체 링크 클릭 중 해당 링크의 비중입니다.">
                <ShareBarList rows={linkRows(stats)} unit="회" />
            </Section>

            <div className="flex justify-center pt-1">
                <Link
                    href={`${base}/report${periodQuery(period, stats.range)}`}
                    prefetch={false}
                    className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-zi-primary hover:text-zi-primary"
                >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    요약 리포트 보기 · PDF 저장
                </Link>
            </div>

            <ShareFooter />
        </main>
    );
}
