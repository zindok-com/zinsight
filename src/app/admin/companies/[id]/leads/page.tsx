import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getLinkPageLeads } from '@/actions/link-page-lead-actions';
import { LEAD_RETENTION_DAYS } from '@/lib/link-page-lead';
import { Button } from '@/components/ui/button';
import { OrgAdminTabs } from '../OrgAdminTabs';
import { LeadsClient } from './LeadsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function OrgLeadsPage({ params }: PageProps) {
    const { id } = await params;
    const data = Number.isInteger(Number(id)) ? await getLinkPageLeads(Number(id)) : null;
    if (!data) notFound();

    const unread = data.leads.filter((l) => !l.readAt).length;
    const linkPageUrl = `/insight-radar/${encodeURIComponent(data.org.slug)}/links`;

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
                        <h1 className="text-xl font-bold tracking-tight">{data.org.name}</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            링크 페이지 &lsquo;연락처 남기기&rsquo;로 받은 연락처 · 접수일로부터 {LEAD_RETENTION_DAYS}일 지나면 자동 삭제
                        </p>
                    </div>
                </div>
                <a href={linkPageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950">
                        <ExternalLink className="h-3.5 w-3.5" />
                        링크 페이지 보기
                    </Button>
                </a>
            </div>

            <OrgAdminTabs orgId={id} active="leads" unreadLeads={unread} />

            <LeadsClient orgId={data.org.id} orgName={data.org.name} leads={data.leads} />
        </div>
    );
}
