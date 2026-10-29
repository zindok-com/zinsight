'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getQrLinks, createQrLink, updateQrLink, deleteQrLink } from '@/actions/admin/qr-link-actions';
import { QR_MODES, QR_MODE_LABEL, buildQrShortUrl } from '@/lib/qr-link';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Trash2, Plus, RefreshCw, Copy, ExternalLink, QrCode } from 'lucide-react';

type QrData = Extract<Awaited<ReturnType<typeof getQrLinks>>, { success: true }>['data'];
type QrLinkRow = QrData['links'][number];

const SELECT_CLASS =
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export default function QrLinksPage() {
    const confirm = useConfirm();
    const [data, setData] = useState<QrData | null>(null);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState('');
    const [organizationId, setOrganizationId] = useState('');
    const [mode, setMode] = useState<string>('profile');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getQrLinks();
        if (res.success) setData(res.data);
        else toast.error(res.error);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !organizationId) {
            toast.error('코드와 연결 조직을 모두 입력하세요.');
            return;
        }
        setSubmitting(true);
        const res = await createQrLink(code, Number(organizationId), mode);
        if (res.success) {
            toast.success('QR 연결 주소가 등록되었습니다.');
            setCode('');
            load();
        } else {
            toast.error(res.error || '등록 중 오류가 발생했습니다.');
        }
        setSubmitting(false);
    };

    const handleUpdate = async (row: QrLinkRow, patch: Parameters<typeof updateQrLink>[1]) => {
        const res = await updateQrLink(row.id, patch);
        if (res.success) {
            toast.success('변경 사항이 바로 적용되었습니다.');
            load();
        } else {
            toast.error(res.error || '수정 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (row: QrLinkRow) => {
        const ok = await confirm(
            `"${row.code}" 연결을 삭제하면 이미 인쇄된 QR이 홈으로 이동합니다. 정말 삭제하시겠습니까?`
        );
        if (!ok) return;
        const res = await deleteQrLink(row.id);
        if (res.success) {
            toast.success('삭제되었습니다.');
            load();
        } else {
            toast.error(res.error || '삭제 중 오류가 발생했습니다.');
        }
    };

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('주소를 복사했습니다.');
        } catch {
            toast.error('복사하지 못했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">QR 연결 관리</h1>
                <p className="text-muted-foreground mt-1">
                    명함 QR에는 고정된 짧은 주소(/go/코드)만 인쇄하고, 도착 화면은 여기서 바꿉니다. 변경은 302 임시 리다이렉트로 즉시 반영됩니다.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">새 QR 연결 등록</CardTitle>
                            <CardDescription>코드는 인쇄 후 바꿀 수 없으니 짧고 오래 쓸 이름으로 정하세요.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="qr-code" className="text-sm font-medium">코드</label>
                                    <Input
                                        id="qr-code"
                                        placeholder="zindok"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toLowerCase())}
                                        disabled={submitting}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        영문 소문자·숫자·하이픈. 주소: {buildQrShortUrl(code || '코드')}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="qr-org" className="text-sm font-medium">연결 조직</label>
                                    <select
                                        id="qr-org"
                                        className={SELECT_CLASS}
                                        value={organizationId}
                                        onChange={(e) => setOrganizationId(e.target.value)}
                                        disabled={submitting}
                                    >
                                        <option value="">조직 선택</option>
                                        {data?.organizations.map((org) => (
                                            <option key={org.id} value={org.id}>
                                                {org.company_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="qr-mode" className="text-sm font-medium">도착 화면</label>
                                    <select
                                        id="qr-mode"
                                        className={SELECT_CLASS}
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value)}
                                        disabled={submitting}
                                    >
                                        {QR_MODES.map((m) => (
                                            <option key={m} value={m}>
                                                {QR_MODE_LABEL[m]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting}>
                                    <Plus className="w-4 h-4 mr-2" /> 연결 추가
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            등록된 연결 {data?.links.length ?? 0}개 · 스캔 집계는 최근 30일, 봇·미리보기 요청 제외
                        </p>
                        <Button variant="outline" size="icon" onClick={load} disabled={loading} aria-label="새로고침">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {loading && !data ? (
                        <div className="text-center py-10 text-muted-foreground">로딩 중...</div>
                    ) : !data || data.links.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-muted-foreground">
                                <QrCode className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                등록된 QR 연결이 없습니다.
                            </CardContent>
                        </Card>
                    ) : (
                        data.links.map((row) => <QrLinkCard key={row.id} row={row} data={data} onUpdate={handleUpdate} onDelete={handleDelete} onCopy={copy} />)
                    )}
                </div>
            </div>
        </div>
    );
}

function QrLinkCard({
    row,
    data,
    onUpdate,
    onDelete,
    onCopy,
}: {
    row: QrLinkRow;
    data: QrData;
    onUpdate: (row: QrLinkRow, patch: Parameters<typeof updateQrLink>[1]) => void;
    onDelete: (row: QrLinkRow) => void;
    onCopy: (text: string) => void;
}) {
    const shortUrl = buildQrShortUrl(row.code);

    // 일자별로 모바일/데스크톱 건수를 한 행에 묶음
    const byDate = new Map<string, { mobile: number; desktop: number }>();
    for (const s of row.scans) {
        const entry = byDate.get(s.date) ?? { mobile: 0, desktop: 0 };
        if (s.device === 'mobile') entry.mobile += s.count;
        else entry.desktop += s.count;
        byDate.set(s.date, entry);
    }
    const days = [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0]));
    const recentTotal = days.reduce((sum, [, v]) => sum + v.mobile + v.desktop, 0);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="text-lg font-mono">/go/{row.code}</CardTitle>
                        <CardDescription className="mt-1 break-all">{shortUrl}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" onClick={() => onCopy(shortUrl)} aria-label="짧은 주소 복사">
                            <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                            <a href={`/go/${row.code}`} target="_blank" rel="noopener noreferrer" aria-label="연결 테스트 (새 창)">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDelete(row)}
                            aria-label="연결 삭제"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label htmlFor={`qr-org-${row.id}`} className="text-xs font-medium text-muted-foreground">연결 조직</label>
                        <select
                            id={`qr-org-${row.id}`}
                            className={SELECT_CLASS}
                            value={row.organization.id}
                            onChange={(e) => onUpdate(row, { organizationId: Number(e.target.value) })}
                        >
                            {data.organizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                    {org.company_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor={`qr-mode-${row.id}`} className="text-xs font-medium text-muted-foreground">도착 화면</label>
                        <select
                            id={`qr-mode-${row.id}`}
                            className={SELECT_CLASS}
                            value={row.mode}
                            onChange={(e) => onUpdate(row, { mode: e.target.value })}
                        >
                            {QR_MODES.map((m) => (
                                <option key={m} value={m}>
                                    {QR_MODE_LABEL[m]}
                                </option>
                            ))}
                        </select>
                        {row.mode === 'video-first' && !row.organization.video_url && (
                            <p className="text-[11px] text-amber-600">영상이 등록되지 않아 일반 프로필로 표시됩니다.</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">상태</span>
                        <label className="flex h-9 items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={row.is_active}
                                onChange={(e) => onUpdate(row, { isActive: e.target.checked })}
                                className="h-4 w-4"
                            />
                            {row.is_active ? '사용 중' : '중지됨 (홈으로 이동)'}
                        </label>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                    <span>최근 30일 <strong className="tabular-nums">{recentTotal.toLocaleString()}</strong>회</span>
                    <span>누적 <strong className="tabular-nums">{row.totalScans.toLocaleString()}</strong>회</span>
                </div>

                {days.length > 0 && (
                    <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>일자</TableHead>
                                    <TableHead className="text-right">모바일</TableHead>
                                    <TableHead className="text-right">데스크톱</TableHead>
                                    <TableHead className="text-right">합계</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {days.map(([date, v]) => (
                                    <TableRow key={date}>
                                        <TableCell className="tabular-nums">{date}</TableCell>
                                        <TableCell className="text-right tabular-nums">{v.mobile}</TableCell>
                                        <TableCell className="text-right tabular-nums">{v.desktop}</TableCell>
                                        <TableCell className="text-right tabular-nums font-semibold">{v.mobile + v.desktop}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
