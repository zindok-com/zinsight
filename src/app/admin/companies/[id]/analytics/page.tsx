import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrgAnalyticsSummary } from '@/actions/admin/analytics-actions';
import { OrgAnalyticsClient } from './OrgAnalyticsClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Edit } from 'lucide-react';
import { countUnreadLinkPageLeads } from '@/actions/link-page-lead-actions';

import { OrgAdminTabs } from '../OrgAdminTabs';
interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ period?: string }>;
}

export default async function OrgAnalyticsPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { period } = await searchParams;

    const periodDays = period === 'all' ? 'all' : period === '7' ? 7 : period === '90' ? 90 : 30;
    const [data, unreadLeads] = await Promise.all([
        getOrgAnalyticsSummary(Number(id), periodDays),
        countUnreadLinkPageLeads(Number(id)),
    ]);
    if (!data) notFound();

    const publicUrl = `/insight-radar/${data.org.slug || data.org.id}`;

    return (
        <div className="space-y-6">
            {/* 상단 컨트롤 바 (조직 편집 화면과 완벽하게 일치) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/admin/companies">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight">{data.org.name}</h1>
                            <Badge variant="outline" className="text-xs bg-muted">
                                {data.org.regionName || '지역 미지정'}
                            </Badge>
                            {data.org.isFeatured && (
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs border-0">
                                    ★ 주요 추천 조직
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            ID: {data.org.id} {data.org.slug ? `· Slug: /${data.org.slug}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center"
                    >
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950">
                            <ExternalLink className="h-3.5 w-3.5" />
                            공개 프로필 보기
                        </Button>
                    </a>

                    <Link href={`/admin/companies/${id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-700 hover:bg-muted">
                            <Edit className="h-3.5 w-3.5" />
                            조직 정보 편집
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <OrgAdminTabs orgId={id} active="analytics" unreadLeads={unreadLeads} />

            <OrgAnalyticsClient data={data} orgId={Number(id)} currentPeriod={String(period ?? '30')} />
        </div>
    );
}