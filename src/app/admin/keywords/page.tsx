'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getIndustries } from '@/actions/industry-actions';
import {
    getKeywords,
    createKeyword,
    updateKeyword,
    softDeleteKeyword,
    restoreKeyword,
    toggleKeywordActive,
} from '@/actions/keyword-actions';
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
import { Tags, Plus, Pencil, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react';

type Industry = Awaited<ReturnType<typeof getIndustries>>[number];
type Keyword = Awaited<ReturnType<typeof getKeywords>>[number];

const KEYWORD_TYPES = ['SME', 'PUBLIC', 'OTHER'];

function KeywordForm({
    initial,
    onSubmit,
    onCancel,
}: {
    initial?: Partial<Keyword>;
    onSubmit: (data: { keyword_text: string; keyword_type?: string; is_active: boolean }) => Promise<void>;
    onCancel: () => void;
}) {
    const [keywordText, setKeywordText] = useState(initial?.keyword_text ?? '');
    const [keywordType, setKeywordType] = useState(initial?.keyword_type ?? '');
    const [isActive, setIsActive] = useState(initial?.is_active ?? true);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!keywordText.trim()) { toast.error('키워드를 입력하세요.'); return; }
        setLoading(true);
        await onSubmit({ keyword_text: keywordText.trim(), keyword_type: keywordType || undefined, is_active: isActive });
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm font-medium">키워드 *</label>
                <input
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    value={keywordText}
                    onChange={e => setKeywordText(e.target.value)}
                    placeholder="예: LED 스마트 중소기업"
                    required
                />
            </div>
            <div>
                <label className="text-sm font-medium">유형 (선택)</label>
                <select
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    value={keywordType}
                    onChange={e => setKeywordType(e.target.value)}
                >
                    <option value="">선택 안 함</option>
                    {KEYWORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="kw_active"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="h-4 w-4"
                />
                <label htmlFor="kw_active" className="text-sm">활성화</label>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
                <Button type="submit" disabled={loading}>{loading ? '저장 중...' : '저장'}</Button>
            </DialogFooter>
        </form>
    );
}

export default function KeywordsPage() {
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Keyword | null>(null);

    useEffect(() => {
        getIndustries(false).then(data => {
            setIndustries(data);
            if (data.length > 0) setSelectedIndustryId(data[0].id);
        });
    }, []);

    useEffect(() => {
        if (selectedIndustryId != null) reload();
    }, [selectedIndustryId, showDeleted]); // eslint-disable-line

    async function reload() {
        if (selectedIndustryId == null) return;
        const data = await getKeywords(selectedIndustryId, showDeleted);
        setKeywords(data);
    }

    async function handleCreate(data: { keyword_text: string; keyword_type?: string; is_active: boolean }) {
        if (selectedIndustryId == null) return;
        try {
            await createKeyword({ ...data, industry_id: selectedIndustryId });
            toast.success('키워드가 추가되었습니다.');
            setDialogOpen(false);
            reload();
        } catch (e) {
            toast.error('추가 실패: ' + String(e));
        }
    }

    async function handleUpdate(data: { keyword_text: string; keyword_type?: string; is_active: boolean }) {
        if (!editTarget) return;
        try {
            await updateKeyword(editTarget.id, data);
            toast.success('키워드가 수정되었습니다.');
            setDialogOpen(false);
            setEditTarget(null);
            reload();
        } catch (e) {
            toast.error('수정 실패: ' + String(e));
        }
    }

    async function handleSoftDelete(id: number) {
        if (!confirm('키워드를 삭제(비활성화)하시겠습니까? 복구 가능합니다.')) return;
        await softDeleteKeyword(id);
        toast.success('키워드가 삭제되었습니다.');
        reload();
    }

    async function handleRestore(id: number) {
        await restoreKeyword(id);
        toast.success('키워드가 복구되었습니다.');
        reload();
    }

    async function handleToggle(kw: Keyword) {
        await toggleKeywordActive(kw.id, !kw.is_active);
        toast.success(kw.is_active ? '키워드가 비활성화되었습니다.' : '키워드가 활성화되었습니다.');
        reload();
    }

    const activeKws = keywords.filter(k => !k.deleted_at);
    const deletedKws = keywords.filter(k => k.deleted_at);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Tags className="h-8 w-8" /> Keywords
                    </h1>
                    <p className="text-muted-foreground mt-1">산업별 검색 키워드 관리</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDeleted(v => !v)}>
                        {showDeleted ? <><EyeOff className="h-4 w-4 mr-1" />삭제 항목 숨기기</> : <><Eye className="h-4 w-4 mr-1" />삭제 항목 보기</>}
                    </Button>
                    <Button onClick={() => { setEditTarget(null); setDialogOpen(true); }} disabled={!selectedIndustryId}>
                        <Plus className="h-4 w-4 mr-1" /> 키워드 추가
                    </Button>
                </div>
            </div>

            {/* Industry selector */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">산업 선택</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {industries.map(ex => (
                            <button
                                key={ex.id}
                                onClick={() => setSelectedIndustryId(ex.id)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border
                                    ${selectedIndustryId === ex.id
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                                    }`}
                            >
                                {ex.name}
                            </button>
                        ))}
                        {industries.length === 0 && (
                            <p className="text-sm text-muted-foreground">산업가 없습니다. 먼저 산업를 등록해 주세요.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {selectedIndustryId && (
                <>
                    <div className="space-y-3">
                        {activeKws.map(kw => (
                            <Card key={kw.id}>
                                <CardContent className="py-3 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="font-medium text-sm truncate">{kw.keyword_text}</span>
                                        {kw.keyword_type && <Badge variant="outline" className="text-xs">{kw.keyword_type}</Badge>}
                                        <Badge variant={kw.is_active ? 'default' : 'secondary'} className="text-xs">
                                            {kw.is_active ? '활성' : '비활성'}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <Button size="sm" variant="ghost" onClick={() => handleToggle(kw)}>
                                            {kw.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => { setEditTarget(kw); setDialogOpen(true); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleSoftDelete(kw.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {activeKws.length === 0 && (
                            <p className="text-center py-8 text-muted-foreground text-sm">등록된 키워드가 없습니다.</p>
                        )}
                    </div>

                    {showDeleted && deletedKws.length > 0 && (
                        <div className="space-y-2">
                            <h2 className="text-sm font-semibold text-muted-foreground">삭제된 키워드</h2>
                            {deletedKws.map(kw => (
                                <Card key={kw.id} className="opacity-60 border-dashed">
                                    <CardContent className="py-2 flex items-center justify-between">
                                        <span className="text-sm line-through text-muted-foreground">{kw.keyword_text}</span>
                                        <Button size="sm" variant="ghost" onClick={() => handleRestore(kw.id)}>
                                            <RotateCcw className="h-4 w-4 mr-1" /> 복구
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            <Dialog open={dialogOpen} onOpenChange={open => { if (!open) { setDialogOpen(false); setEditTarget(null); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editTarget ? '키워드 수정' : '키워드 추가'}</DialogTitle>
                    </DialogHeader>
                    <KeywordForm
                        initial={editTarget ?? undefined}
                        onSubmit={editTarget ? handleUpdate : handleCreate}
                        onCancel={() => { setDialogOpen(false); setEditTarget(null); }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
