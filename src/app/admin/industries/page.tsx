'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    getIndustries,
    createIndustry,
    updateIndustry,
    softDeleteIndustry,
    restoreIndustry,
} from '@/actions/industry-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Building2, Plus, Pencil, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react';

type Industry = Awaited<ReturnType<typeof getIndustries>>[number];

function IndustryForm({
    initial,
    onSubmit,
    onCancel,
}: {
    initial?: Partial<Industry>;
    onSubmit: (data: { name: string; description?: string; is_active: boolean }) => Promise<void>;
    onCancel: () => void;
}) {
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [isActive, setIsActive] = useState(initial?.is_active ?? true);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) { toast.error('산업명을 입력하세요.'); return; }
        setLoading(true);
        await onSubmit({ name: name.trim(), description: description.trim() || undefined, is_active: isActive });
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm font-medium">산업명 *</label>
                <input
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="예: 국제광융합(LED)산업"
                    required
                />
            </div>
            <div>
                <label className="text-sm font-medium">설명 (선택)</label>
                <textarea
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[80px]"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="산업에 대한 설명"
                />
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="is_active"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="h-4 w-4"
                />
                <label htmlFor="is_active" className="text-sm">활성화</label>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
                <Button type="submit" disabled={loading}>{loading ? '저장 중...' : '저장'}</Button>
            </DialogFooter>
        </form>
    );
}

export default function IndustriesPage() {
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Industry | null>(null);
    const [loading, setLoading] = useState(true);

    async function reload() {
        setLoading(true);
        const data = await getIndustries(showDeleted);
        setIndustries(data);
        setLoading(false);
    }

    useEffect(() => { reload(); }, [showDeleted]); // eslint-disable-line

    async function handleCreate(data: { name: string; description?: string; is_active: boolean }) {
        try {
            await createIndustry(data);
            toast.success('산업가 생성되었습니다.');
            setDialogOpen(false);
            reload();
        } catch (e) {
            toast.error('생성 실패: ' + String(e));
        }
    }

    async function handleUpdate(data: { name: string; description?: string; is_active: boolean }) {
        if (!editTarget) return;
        try {
            await updateIndustry(editTarget.id, data);
            toast.success('산업가 수정되었습니다.');
            setDialogOpen(false);
            setEditTarget(null);
            reload();
        } catch (e) {
            toast.error('수정 실패: ' + String(e));
        }
    }

    async function handleSoftDelete(id: number) {
        if (!confirm('산업를 삭제(비활성화)하시겠습니까? 복구 가능합니다.')) return;
        await softDeleteIndustry(id);
        toast.success('산업가 삭제(비활성화)되었습니다.');
        reload();
    }

    async function handleRestore(id: number) {
        await restoreIndustry(id);
        toast.success('산업가 복구되었습니다.');
        reload();
    }

    const active = industries.filter(e => !e.deleted_at);
    const deleted = industries.filter(e => e.deleted_at);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-8 w-8" /> Industries
                    </h1>
                    <p className="text-muted-foreground mt-1">산업 관리 (등록/수정/soft 삭제/복구)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDeleted(v => !v)}>
                        {showDeleted ? <><EyeOff className="h-4 w-4 mr-1" /> 삭제 항목 숨기기</> : <><Eye className="h-4 w-4 mr-1" /> 삭제 항목 보기</>}
                    </Button>
                    <Button onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> 산업 추가
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-muted-foreground py-12 text-center">불러오는 중...</div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {active.map(ex => (
                            <Card key={ex.id} className="relative">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base leading-snug">{ex.name}</CardTitle>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Badge variant={ex.is_active ? 'default' : 'secondary'}>
                                                {ex.is_active ? '활성' : '비활성'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono">{ex.slug}</p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {ex.description && (
                                        <p className="text-sm text-muted-foreground">{ex.description}</p>
                                    )}
                                    <div className="flex gap-3 text-xs text-muted-foreground">
                                        <span>키워드 {ex._count.keywords}개</span>
                                        <span>수집 {ex._count.ingestions}건</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => { setEditTarget(ex); setDialogOpen(true); }}>
                                            <Pencil className="h-3 w-3 mr-1" /> 수정
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleSoftDelete(ex.id)}>
                                            <Trash2 className="h-3 w-3 mr-1" /> 삭제
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {active.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                등록된 산업가 없습니다. &ldquo;산업 추가&rdquo; 버튼을 눌러 시작하세요.
                            </div>
                        )}
                    </div>

                    {showDeleted && deleted.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-muted-foreground">삭제된 산업</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {deleted.map(ex => (
                                    <Card key={ex.id} className="opacity-60 border-dashed">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base line-through text-muted-foreground">{ex.name}</CardTitle>
                                            <p className="text-xs text-muted-foreground">삭제일: {new Date(ex.deleted_at!).toLocaleDateString('ko-KR')}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <Button size="sm" variant="outline" onClick={() => handleRestore(ex.id)}>
                                                <RotateCcw className="h-3 w-3 mr-1" /> 복구
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <Dialog open={dialogOpen} onOpenChange={open => { if (!open) { setDialogOpen(false); setEditTarget(null); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editTarget ? '산업 수정' : '산업 추가'}</DialogTitle>
                    </DialogHeader>
                    <IndustryForm
                        initial={editTarget ?? undefined}
                        onSubmit={editTarget ? handleUpdate : handleCreate}
                        onCancel={() => { setDialogOpen(false); setEditTarget(null); }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
