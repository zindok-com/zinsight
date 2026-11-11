'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Download, Mail, Phone, Trash2 } from 'lucide-react';
import { deleteLinkPageLead, markLinkPageLeadsRead, type LinkPageLeadRow } from '@/actions/link-page-lead-actions';
import { downloadCsv } from '@/lib/csv';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

function formatDate(iso: string) {
    return dateFormat.format(new Date(iso));
}

function sourceText(lead: LinkPageLeadRow) {
    if (lead.sourceCode === 'direct') return '직접 방문';
    return `/go/${lead.sourceCode}${lead.sourceLabel ? ` · ${lead.sourceLabel}` : ''}`;
}

export function LeadsClient({ orgId, orgName, leads }: { orgId: number; orgName: string; leads: LinkPageLeadRow[] }) {
    const router = useRouter();
    const confirm = useConfirm();
    const [pending, startTransition] = useTransition();
    const unread = leads.filter((l) => !l.readAt).length;

    const run = (task: () => Promise<void>, done: string) =>
        startTransition(async () => {
            try {
                await task();
                toast.success(done);
                router.refresh();
            } catch {
                toast.error('처리하지 못했습니다.');
            }
        });

    const handleDelete = async (lead: LinkPageLeadRow) => {
        const ok = await confirm({
            title: '연락처 삭제',
            description: `${lead.name}님의 접수 내용을 삭제합니다. 삭제하면 되돌릴 수 없습니다.`,
            confirmText: '삭제',
            variant: 'destructive',
        });
        if (ok) run(() => deleteLinkPageLead(orgId, lead.id), '삭제했습니다.');
    };

    const handleExport = () => {
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
        downloadCsv(`${orgName}_받은연락처_${today}.csv`, [
            ['접수일시(KST)', '이름', '전화번호', '이메일', '메모', '유입 경로', '기기', '상태'],
            ...leads.map((l) => [
                formatDate(l.createdAt),
                l.name,
                l.phone,
                l.email,
                l.memo,
                sourceText(l),
                l.device === 'mobile' ? '모바일' : 'PC',
                l.readAt ? '확인' : '새 접수',
            ]),
        ]);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
                <div>
                    <CardTitle className="text-base">
                        받은 연락처 <span className="tabular-nums text-muted-foreground">{leads.length}건</span>
                    </CardTitle>
                    <CardDescription>
                        방문자가 개인정보 제공에 동의하고 남긴 연락처입니다. 해당 기관에 전달하는 용도로만 사용하세요.
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        disabled={pending || unread === 0}
                        onClick={() => run(() => markLinkPageLeadsRead(orgId), '모두 확인으로 표시했습니다.')}
                    >
                        <Check className="h-3.5 w-3.5" />
                        모두 확인 ({unread})
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={leads.length === 0} onClick={handleExport}>
                        <Download className="h-3.5 w-3.5" />
                        CSV
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {leads.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">아직 받은 연락처가 없습니다.</p>
                ) : (
                    <ul className="divide-y">
                        {leads.map((lead) => (
                            <li key={lead.id} className={`flex flex-col gap-2 py-4 sm:flex-row sm:items-start ${lead.readAt ? '' : 'bg-amber-50/60 dark:bg-amber-950/20 -mx-3 px-3 rounded-md'}`}>
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold">{lead.name}</span>
                                        {!lead.readAt && <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0 text-[10px]">새 접수</Badge>}
                                        <span className="text-xs text-muted-foreground tabular-nums">{formatDate(lead.createdAt)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                        {lead.phone && (
                                            <a href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline tabular-nums">
                                                <Phone className="h-3.5 w-3.5" />
                                                {lead.phone}
                                            </a>
                                        )}
                                        {lead.email && (
                                            <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline break-all">
                                                <Mail className="h-3.5 w-3.5" />
                                                {lead.email}
                                            </a>
                                        )}
                                    </div>
                                    {lead.memo && <p className="whitespace-pre-wrap break-words rounded-md bg-muted/60 px-3 py-2 text-sm">{lead.memo}</p>}
                                    <p className="text-xs text-muted-foreground">
                                        {sourceText(lead)} · {lead.device === 'mobile' ? '모바일' : 'PC'}
                                        {lead.readAt && ` · 확인 ${formatDate(lead.readAt)}`}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-1.5">
                                    {!lead.readAt && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs"
                                            disabled={pending}
                                            onClick={() => run(() => markLinkPageLeadsRead(orgId, [lead.id]), '확인으로 표시했습니다.')}
                                        >
                                            확인
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                        disabled={pending}
                                        aria-label={`${lead.name} 접수 삭제`}
                                        onClick={() => handleDelete(lead)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
