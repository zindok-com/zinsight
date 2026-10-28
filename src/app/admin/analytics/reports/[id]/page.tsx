import { getAnalyticsReportById } from '@/actions/admin/analytics-actions';
import { notFound } from 'next/navigation';
import { ReportSnapshotViewer } from './ReportSnapshotViewer';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function AnalyticsReportDetailPage({ params }: Props) {
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) notFound();

    const report = await getAnalyticsReportById(numericId);
    if (!report) notFound();

    const createdAtStr = new Date(report.createdAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <ReportSnapshotViewer
            report={{
                id: report.id,
                entityType: report.entityType,
                entityId: report.entityId,
                entityName: report.entityName,
                reportType: report.reportType,
                periodDays: report.periodDays,
                createdAt: createdAtStr,
                dataSnapshot: report.dataSnapshot,
            }}
        />
    );
}
