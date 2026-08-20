'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { approveOrganizationSubmission, rejectOrganizationSubmission } from '@/actions/company-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Eye, Globe, MapPin, Calendar, User, Building2 } from 'lucide-react';

type Region = { id: number; name: string };
type Invite = { id: number; region: Region; label: string | null };
type Submission = {
    id: number;
    invite_id: number;
    company_name: string;
    entity_type: string;
    ceo_name: string | null;
    founded_year: string | null;
    hq_location: string | null;
    company_url: string | null;
    business_summary: string | null;
    backlinks: any;
    core_keywords: any;
    status: string;
    reviewed_at: Date | null;
    created_at: Date;
    invite: Invite;
};

interface Props {
    submissions: Submission[];
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
    PENDING: { label: '검토 대기', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    APPROVED: { label: '승인됨', className: 'bg-green-100 text-green-800 border-green-200' },
    REJECTED: { label: '반려됨', className: 'bg-red-100 text-red-800 border-red-200' },
};

export function SubmissionsClient({ submissions }: Props) {
    const router = useRouter();
    const [selected, setSelected] = useState<Submission | null>(null);
    const [loading, setLoading] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const filtered = filterStatus === 'ALL'
        ? submissions
        : submissions.filter((s) => s.status === filterStatus);

    const handleApprove = async (id: number) => {
        if (!confirm('이 신청서를 승인하고 조직을 등록하시겠습니까?')) return;
        setLoading(id);
        try {
            const res = await approveOrganizationSubmission(id);
            if (res.success) {
                toast.success('조직이 등록되었습니다.');
                setSelected(null);
                router.refresh();
            } else {
                toast.error(res.error ?? '승인에 실패했습니다.');
            }
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('이 신청서를 반려하시겠습니까?')) return;
        setLoading(id);
        try {
            await rejectOrganizationSubmission(id);
            toast.success('신청서가 반려되었습니다.');
            setSelected(null);
            router.refresh();
        } finally {
            setLoading(null);
        }
    };

    if (submissions.length === 0) {
        return (
            <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                    접수된 조직 등록 신청이 없습니다.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* 필터 */}
            <div className="flex gap-2">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                    <Button
                        key={s}
                        size="sm"
                        variant={filterStatus === s ? 'default' : 'outline'}
                        onClick={() => setFilterStatus(s)}
                    >
                        {s === 'ALL' ? '전체' : STATUS_LABEL[s].label}
                        {s !== 'ALL' && (
                            <span className="ml-1.5 text-xs opacity-70">
                                {submissions.filter((x) => x.status === s).length}
                            </span>
                        )}
                    </Button>
                ))}
            </div>

            {/* 신청 목록 */}
            <div className="space-y-3">
                {filtered.map((sub) => {
                    const st = STATUS_LABEL[sub.status] ?? STATUS_LABEL['PENDING'];
                    return (
                        <Card key={sub.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className={st.className}>{st.label}</Badge>
                                            <Badge variant="outline" className="text-xs">{sub.invite.region.name}</Badge>
                                            <span className="font-semibold text-base">{sub.company_name}</span>
                                            <span className="text-xs text-muted-foreground">{sub.entity_type}</span>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                                            {sub.ceo_name && <span><User className="w-3 h-3 inline mr-0.5" />{sub.ceo_name}</span>}
                                            {sub.hq_location && <span><MapPin className="w-3 h-3 inline mr-0.5" />{sub.hq_location}</span>}
                                            {sub.founded_year && <span><Calendar className="w-3 h-3 inline mr-0.5" />{sub.founded_year}</span>}
                                            {sub.company_url && <span><Globe className="w-3 h-3 inline mr-0.5" />{sub.company_url}</span>}
                                            <span className="ml-auto">접수: {new Date(sub.created_at).toLocaleDateString('ko-KR')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5"
                                            onClick={() => setSelected(sub)}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            상세
                                        </Button>
                                        {sub.status === 'PENDING' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="gap-1.5 bg-green-600 hover:bg-green-700"
                                                    disabled={loading === sub.id}
                                                    onClick={() => handleApprove(sub.id)}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    승인
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                                                    disabled={loading === sub.id}
                                                    onClick={() => handleReject(sub.id)}
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    반려
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* 상세 모달 */}
            <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            {selected?.company_name}
                        </DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <InfoRow label="지역" value={selected.invite.region.name} />
                                <InfoRow label="기관 유형" value={selected.entity_type} />
                                <InfoRow label="대표자" value={selected.ceo_name} />
                                <InfoRow label="설립연도" value={selected.founded_year} />
                                <InfoRow label="본사소재지" value={selected.hq_location} />
                                <InfoRow label="홈페이지" value={selected.company_url} />
                            </div>

                            {selected.business_summary && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">사업 요약</p>
                                    <p className="text-sm leading-relaxed bg-muted/30 rounded p-3">{selected.business_summary}</p>
                                </div>
                            )}

                            {Array.isArray(selected.core_keywords) && selected.core_keywords.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">핵심 키워드</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(selected.core_keywords as string[]).map((kw, i) => (
                                            <Badge key={i} variant="outline">{kw}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {Array.isArray(selected.backlinks) && selected.backlinks.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">백링크</p>
                                    <ul className="space-y-1">
                                        {(selected.backlinks as {title:string;url:string}[]).map((bl, i) => (
                                            <li key={i}>
                                                <a href={bl.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                                    {bl.title || bl.url}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selected.status === 'PENDING' && (
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                                        disabled={loading === selected.id}
                                        onClick={() => handleReject(selected.id)}
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        반려
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="gap-1.5 bg-green-600 hover:bg-green-700"
                                        disabled={loading === selected.id}
                                        onClick={() => handleApprove(selected.id)}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        승인 및 조직 등록
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-0.5">{value}</p>
        </div>
    );
}
