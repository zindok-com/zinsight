import { getAnalyticsReports } from '@/actions/admin/analytics-actions';
import Link from 'next/link';

export const metadata = { title: '애널리틱스 리포트 이력 | Zinsight Admin' };

const ENTITY_LABEL: Record<string, string> = {
    article: '📰 기사',
    organization: '🏢 조직',
};

const REPORT_TYPE_LABEL: Record<string, string> = {
    simple: '간편형',
    detailed: '상세형',
};

const PERIOD_LABEL: Record<number, string> = {
    7: '7일',
    30: '30일',
    90: '90일',
    0: '전체',
};

export default async function AnalyticsReportsPage() {
    const reports = await getAnalyticsReports({ limit: 100 });

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">📋 애널리틱스 리포트 이력</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        리포트 생성 시점의 데이터 스냅샷이 저장됩니다. 이후 수치가 변경되어도 당시 버전을 확인할 수 있습니다.
                    </p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="flex items-center justify-center h-48 border rounded-xl bg-muted/30 text-muted-foreground text-sm">
                    아직 생성된 리포트가 없습니다. 기사 또는 조직 애널리틱스 화면에서 리포트를 생성해 주세요.
                </div>
            ) : (
                <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">유형</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">대상</th>
                                <th className="text-center px-4 py-3 font-medium text-muted-foreground">형식</th>
                                <th className="text-center px-4 py-3 font-medium text-muted-foreground">기간</th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">생성일시</th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">다시 보기</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report.id} className="border-t hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {ENTITY_LABEL[report.entityType] ?? report.entityType}
                                    </td>
                                    <td className="px-4 py-3 font-medium max-w-xs">
                                        <span className="line-clamp-1">{report.entityName}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            {REPORT_TYPE_LABEL[report.reportType] ?? report.reportType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-muted-foreground">
                                        {PERIOD_LABEL[report.periodDays] ?? `${report.periodDays}일`}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                                        {new Date(report.createdAt).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/admin/analytics/reports/${report.id}`}
                                            className="text-indigo-600 hover:underline text-xs font-medium"
                                        >
                                            보기 →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}