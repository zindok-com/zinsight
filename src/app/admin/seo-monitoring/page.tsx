import { Suspense } from 'react';
import { getSeoMonitoringOverview, getGoogleIndexingReport } from '@/actions/admin/seo-actions';
import { SeoMonitoringClient } from './SeoMonitoringClient';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ period?: string; tab?: string }>;
}

export default async function SeoMonitoringPage({ searchParams }: PageProps) {
    const { period = '30', tab = 'overview' } = await searchParams;
    const periodDays = period === 'all' ? 'all' : Number(period) || 30;

    const [overview, indexingReport] = await Promise.all([
        getSeoMonitoringOverview(),
        getGoogleIndexingReport(periodDays),
    ]);

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                        <span>🌐</span>
                        <span>검색·AI 최적화 관제 (SEO / GEO / AEO)</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        구글 서치콘솔 색인 현황, GA4 및 네이버 API 연동 상태, 지리 좌표(GEO)와 구조화 데이터(AEO) 적용률을 모니터링합니다.
                    </p>
                </div>
            </div>

            <Suspense fallback={<div className="p-8 text-center text-muted-foreground">데이터 로딩 중...</div>}>
                <SeoMonitoringClient
                    overview={overview}
                    indexingReport={indexingReport}
                    currentPeriod={period}
                    initialTab={tab}
                />
            </Suspense>
        </div>
    );
}
