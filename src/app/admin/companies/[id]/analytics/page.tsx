import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrgAnalyticsSummary } from '@/actions/admin/analytics-actions';
import { OrgAnalyticsClient } from './OrgAnalyticsClient';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ period?: string }>;
}

export default async function OrgAnalyticsPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { period } = await searchParams;

    const periodDays = period === 'all' ? 'all' : period === '7' ? 7 : period === '90' ? 90 : 30;
    const data = await getOrgAnalyticsSummary(Number(id), periodDays);
    if (!data) notFound();

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{data.org.name}</h1>
                    <p className="text-muted-foreground text-sm mt-1">조직 프로필 애널리틱스</p>
                </div>
                <Link
                    href={`/admin/companies/${id}`}
                    className="shrink-0 text-sm text-muted-foreground hover:text-foreground border rounded-md px-3 py-1.5 transition-colors"
                >
                    ← 편집으로
                </Link>
            </div>
            <div className="flex gap-2 border-b">
                <Link href={`/admin/companies/${id}`} className="pb-2 px-1 text-sm text-muted-foreground hover:text-foreground">편집</Link>
                <span className="pb-2 px-1 text-sm font-semibold border-b-2 border-foreground">애널리틱스</span>
            </div>
            <OrgAnalyticsClient data={data} orgId={Number(id)} currentPeriod={String(period ?? '30')} />
        </div>
    );
}