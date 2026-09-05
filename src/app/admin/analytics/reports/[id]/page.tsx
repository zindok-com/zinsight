import { getAnalyticsReportById } from '@/actions/admin/analytics-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function AnalyticsReportDetailPage({ params }: Props) {
    const { id } = await params;
    const report = await getAnalyticsReportById(Number(id));
    if (!report) notFound();

    const createdAtStr = new Date(report.createdAt).toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    const periodLabel: Record<number, string> = { 7: '최근 7일', 30: '최근 30일', 90: '최근 90일', 0: '전체 기간' };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin/analytics/reports" className="text-sm text-muted-foreground hover:text-foreground">
                    ← 이력 목록
                </Link>
            </div>

            <div className="border rounded-2xl p-6 bg-card space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            {report.entityType === 'article' ? '📰 기사 리포트' : '🏢 조직 리포트'}
                            {' · '}{report.reportType === 'simple' ? '간편형' : '상세형'}
                        </p>
                        <h1 className="text-xl font-bold">{report.entityName}</h1>
                        <p className="text-sm text-muted-foreground">
                            {periodLabel[report.periodDays] ?? `${report.periodDays}일`} 기준 · {createdAtStr} 생성
                        </p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted/50 transition-colors"
                    >
                        🖨 인쇄
                    </button>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    본 리포트는 <strong>{createdAtStr}</strong> 기준으로 측정한 결과입니다.
                    이후 수치는 변동될 수 있습니다.
                </div>

                <pre className="text-xs bg-muted rounded-xl p-4 overflow-auto max-h-[500px] leading-relaxed">
                    {JSON.stringify(report.dataSnapshot, null, 2)}
                </pre>
            </div>
        </div>
    );
}