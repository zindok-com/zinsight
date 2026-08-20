'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link2, Copy, Ban, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { createOrganizationInvite, revokeOrganizationInvite } from '@/actions/company-actions';
import { useRouter } from 'next/navigation';

type Region = { id: number; name: string };
type Invite = {
    id: number;
    token: string;
    label: string | null;
    used_at: Date | null;
    expires_at: Date;
    created_at: Date;
    region: Region;
    submissions: { id: number; status: string }[];
};

interface Props {
    regions: Region[];
    invites: Invite[];
}

export function InviteLinkPanel({ regions, invites }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [regionId, setRegionId] = useState<string>('');
    const [label, setLabel] = useState('');
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const handleCreate = async () => {
        if (!regionId) {
            toast.error('지역을 선택해주세요.');
            return;
        }
        setCreating(true);
        try {
            const res = await createOrganizationInvite({
                region_id: Number(regionId),
                label: label.trim() || undefined,
            });
            if (res.success && res.invite) {
                const link = `${origin}/register/org/${res.invite.token}`;
                setGeneratedLink(link);
                toast.success('등록 링크가 생성되었습니다.');
                router.refresh();
            }
        } catch (e) {
            toast.error('링크 생성에 실패했습니다.');
        } finally {
            setCreating(false);
        }
    };

    const copyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        toast.success('링크가 클립보드에 복사되었습니다.');
    };

    const handleRevoke = async (inviteId: number) => {
        if (!confirm('이 링크를 무효화하시겠습니까?')) return;
        await revokeOrganizationInvite(inviteId);
        toast.success('링크가 무효화되었습니다.');
        router.refresh();
    };

    const getStatusBadge = (invite: Invite) => {
        if (invite.used_at)
            return <Badge variant="secondary">사용됨</Badge>;
        if (new Date(invite.expires_at) < new Date())
            return <Badge variant="destructive">만료됨</Badge>;
        return <Badge className="bg-green-100 text-green-800 border-green-200">유효</Badge>;
    };

    const pendingCount = (invite: Invite) =>
        invite.submissions.filter((s) => s.status === 'PENDING').length;

    return (
        <Card>
            <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setOpen((v) => !v)}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Link2 className="w-4 h-4" />
                            등록 링크 관리
                        </CardTitle>
                        <CardDescription className="mt-1">
                            고객에게 공유할 조직 정보 등록 링크를 생성하고 관리합니다.
                        </CardDescription>
                    </div>
                    {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </CardHeader>

            {open && (
                <CardContent className="space-y-5 pt-0">
                    <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                        <p className="text-sm font-medium">새 등록 링크 생성</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">지역 *</Label>
                                <Select value={regionId} onValueChange={setRegionId}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="지역 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {regions.map((r) => (
                                            <SelectItem key={r.id} value={String(r.id)}>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs">메모 (어드민 식별용)</Label>
                                <Input
                                    className="h-9"
                                    placeholder="예: 안양 ○○기업 요청"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button size="sm" onClick={handleCreate} disabled={creating} className="gap-2">
                            <Plus className="w-4 h-4" />
                            {creating ? '생성 중...' : '링크 생성'}
                        </Button>

                        {generatedLink && (
                            <div className="flex items-center gap-2 p-3 bg-white border rounded-md">
                                <p className="text-sm text-blue-600 font-mono truncate flex-1">{generatedLink}</p>
                                <Button size="sm" variant="outline" onClick={() => copyLink(generatedLink)} className="gap-1 shrink-0">
                                    <Copy className="w-3.5 h-3.5" />
                                    복사
                                </Button>
                            </div>
                        )}
                    </div>

                    {invites.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">최근 발급 링크</p>
                            <div className="space-y-2">
                                {invites.map((invite) => {
                                    const link = `${origin}/register/org/${invite.token}`;
                                    const pc = pendingCount(invite);
                                    return (
                                        <div
                                            key={invite.id}
                                            className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded-lg text-sm"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {getStatusBadge(invite)}
                                                    <Badge variant="outline" className="text-xs">{invite.region.name}</Badge>
                                                    {invite.label && (
                                                        <span className="text-muted-foreground text-xs">{invite.label}</span>
                                                    )}
                                                    {pc > 0 && (
                                                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                                                            미검토 {pc}건
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="font-mono text-xs text-muted-foreground mt-1 truncate">{link}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    만료: {new Date(invite.expires_at).toLocaleDateString('ko-KR')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 gap-1 text-xs"
                                                    onClick={() => copyLink(link)}
                                                    disabled={!!invite.used_at || new Date(invite.expires_at) < new Date()}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    복사
                                                </Button>
                                                {!invite.used_at && new Date(invite.expires_at) >= new Date() && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleRevoke(invite.id)}
                                                    >
                                                        <Ban className="w-3 h-3" />
                                                        무효화
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
