import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
    DailyBars,
    KpiGrid,
    Section,
    ShareBarList,
    ShareBrand,
    ShareFooter,
    linkRows,
    sourceRows,
} from '@/components/share-stats/ShareStatsParts';
import { PrintButton } from '@/components/share-stats/PrintButton';
import { loadSharedStats, periodQuery } from '../load-shared-stats';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

// A4 세로 1~2쪽 요약. 브라우저 '인쇄 → PDF로 저장'으로 내려받음 (PDF 생성 라이브러리 없음)
const PRINT_CSS = `
@page { size: A4 portrait; margin: 12mm; }
@media print {
  html, body { background: #fff !important; }
  .report-sheet { box-shadow: none !important; border: 0 !important; padding: 0 !important; max-width: none !important; }
  .report-sheet section { padding: 10px 12px; }
}
`;

export default async function SharedStatsReportPage({ params, searchParams }: PageProps) {
    const { token } = await params;
    const { stats, period } = await loadSharedStats(token, await searchParams);
    const generated = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(new Date());

    return (
        <main className="px-4 py-5 sm:py-8 print:p-0">
            <style>{PRINT_CSS}</style>
            <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-2 print:hidden">
                <Link
                    href={`/share/stats/${token}${periodQuery(period, stats.range)}`}
                    prefetch={false}
                    className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    통계 페이지로
                </Link>
                <PrintButton />
            </div>

            <article className="report-sheet mx-auto max-w-[210mm] space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                        <ShareBrand />
                        <h1 className="mt-2 text-lg font-bold leading-snug sm:text-xl">{stats.orgName} · 링크 페이지 방문 요약</h1>
                        <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
                            기간 {stats.range.from} ~ {stats.range.to} (KST) · 작성 {generated}
                        </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">익명 통계</span>
                </header>

                <KpiGrid stats={stats} variant="report" />

                <Section title="일자별 방문 추이">
                    <DailyBars daily={stats.daily} height={110} />
                </Section>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2">
                    <Section title="상위 링크 (클릭 순)">
                        <ShareBarList rows={linkRows(stats)} unit="회" limit={5} />
                    </Section>
                    <Section title="유입 경로 (방문 순)">
                        <ShareBarList rows={sourceRows(stats)} unit="회" limit={5} />
                    </Section>
                </div>

                <p className="text-[10px] leading-relaxed text-slate-500">
                    집계 기준: 진사이트 자체 서버 집계. 검색 로봇·링크 미리보기·관리자 확인 방문 제외. 외부 이동 비율은 전체 링크 클릭 중 홈페이지·SNS·자료 등 외부 주소로 나간 클릭의 비중입니다. 이름·연락처 등 개인을 알 수 있는 정보는 포함하지 않습니다.
                </p>
                <ShareFooter />
            </article>
        </main>
    );
}
