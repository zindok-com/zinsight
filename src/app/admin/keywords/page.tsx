'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { getRegions } from '@/actions/admin/region-actions';
import {
    getKeywords,
    createKeyword,
    updateKeyword,
    softDeleteKeyword,
    restoreKeyword,
    toggleKeywordActive,
} from '@/actions/keyword-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Tags, Plus, Pencil, Trash2, RotateCcw, Eye, EyeOff, Search, Info } from 'lucide-react';

type Region = Awaited<ReturnType<typeof getRegions>>['data'][0];
type Keyword = Awaited<ReturnType<typeof getKeywords>>[number];

const KEYWORD_TYPES = ['SME', 'PUBLIC', 'OTHER'];

const TYPE_COLORS: Record<string, string> = {
    SME: 'bg-blue-50 text-blue-700 border-blue-200',
    PUBLIC: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    OTHER: 'bg-slate-50 text-slate-600 border-slate-200',
};

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
                <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="text-sm font-semibold">키워드 *</label>
                    <span title="네이버 뉴스 수집에 사용할 검색 키워드입니다." className="cursor-help">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                </div>
                <input
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={keywordText}
                    onChange={e => setKeywordText(e.target.value)}
                    placeholder="예: 안양 스타트업, 성남 중소기업"
                    autoFocus
                    required
                />
            </div>
            <div>
                <label className="text-sm font-semibold block mb-2">유형 <span className="text-slate-400 font-normal">(선택)</span></label>
                <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={() => setKeywordType('')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${keywordType === '' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'}`}>
                        선택 안 함
                    </button>
                    {KEYWORD_TYPES.map(t => (
                        <button key={t} type="button" onClick={() => setKeywordType(t)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${keywordType === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'}`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-lg">
                <input type="checkbox" id="kw_active" checked={isActive}
                    onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 accent-blue-600" />
                <label htmlFor="kw_active" className="text-sm font-medium select-none cursor-pointer">
                    활성화 <span className="text-xs text-muted-foreground font-normal">(비활성 시 자동 수집에서 제외)</span>
                </label>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
                <Button type="submit" disabled={loading}>{loading ? '저장 중...' : (initial?.keyword_text ? '수정' : '추가')}</Button>
            </DialogFooter>
        </form>
    );
}

export default function KeywordsPage() {
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Keyword | null>(null);
    const [searchText, setSearchText] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        getRegions().then(res => {
            if (res.success && res.data) {
                setRegions(res.data);
                if (res.data.length > 0) setSelectedRegionId(res.data[0].id);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedRegionId != null) reload();
    }, [selectedRegionId, showDeleted]); // eslint-disable-line

    async function reload() {
        if (selectedRegionId == null) return;
        const data = await getKeywords(selectedRegionId, showDeleted);
        setKeywords(data);
        setSearchText('');
        setTypeFilter('');
    }

    async function handleCreate(data: { keyword_text: string; keyword_type?: string; is_active: boolean }) {
        if (selectedRegionId == null) return;
        try {
            await createKeyword({ ...data, region_id: selectedRegionId });
            toast.success('키워드가 추가되었습니다.');
            setDialogOpen(false);
            reload();
        } catch (e) { toast.error('추가 실패: ' + String(e)); }
    }

    async function handleUpdate(data: { keyword_text: string; keyword_type?: string; is_active: boolean }) {
        if (!editTarget) return;
        try {
            await updateKeyword(editTarget.id, data);
            toast.success('키워드가 수정되었습니다.');
            setDialogOpen(false);
            setEditTarget(null);
            reload();
        } catch (e) { toast.error('수정 실패: ' + String(e)); }
    }

    async function handleSoftDelete(id: number, text: string) {
        if (!confirm(`"${text}" 키워드를 삭제하시겠습니까?`)) return;
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
        toast.success(kw.is_active ? '비활성화되었습니다.' : '활성화되었습니다.');
        reload();
    }

    const activeKws = useMemo(() =>
        keywords
            .filter(k => !k.deleted_at)
            .filter(k => !searchText || k.keyword_text.toLowerCase().includes(searchText.toLowerCase()))
            .filter(k => !typeFilter || k.keyword_type === typeFilter),
        [keywords, searchText, typeFilter]
    );

    const deletedKws = keywords.filter(k => k.deleted_at);
    const totalActive = keywords.filter(k => !k.deleted_at && k.is_active).length;
    const totalInactive = keywords.filter(k => !k.deleted_at && !k.is_active).length;

    return (
        <div className="space-y-5">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Tags className="h-6 w-6" /> Keywords
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">네이버 뉴스 자동 수집에 사용되는 검색 키워드를 관리합니다.</p>
                </div>
                <Button onClick={() => { setEditTarget(null); setDialogOpen(true); }} disabled={!selectedRegionId} className="gap-1.5">
                    <Plus className="h-4 w-4" /> 키워드 추가
                </Button>
            </div>

            {/* 지역 탭 */}
            <div className="flex flex-wrap gap-2 border-b pb-4">
                {regions.map(r => (
                    <button key={r.id} onClick={() => setSelectedRegionId(r.id)}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            selectedRegionId === r.id
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}>
                        {r.name}
                    </button>
                ))}
                {regions.length === 0 && <p className="text-sm text-muted-foreground">등록된 지역이 없습니다.</p>}
            </div>

            {selectedRegionId && (
                <>
                    {/* 통계 + 검색/필터 */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>전체 <strong className="text-slate-800">{keywords.filter(k => !k.deleted_at).length}</strong>개</span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                                활성 <strong className="text-slate-800">{totalActive}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                                비활성 <strong className="text-slate-800">{totalInactive}</strong>
                            </span>
                        </div>
                        <div className="flex gap-2 items-center w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-52">
                                <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <input type="text" placeholder="키워드 검색..." value={searchText}
                                    onChange={e => setSearchText(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                                className="border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                                <option value="">모든 유형</option>
                                {KEYWORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <Button variant="ghost" size="sm" onClick={() => setShowDeleted(v => !v)}
                                className="gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                                {showDeleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                {showDeleted ? '삭제 숨기기' : '삭제 보기'}
                            </Button>
                        </div>
                    </div>

                    {/* 키워드 테이블 */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr className="text-xs text-muted-foreground font-medium">
                                    <th className="text-left px-4 py-2.5">키워드</th>
                                    <th className="text-left px-3 py-2.5 w-28">유형</th>
                                    <th className="text-left px-3 py-2.5 w-20">상태</th>
                                    <th className="text-left px-3 py-2.5 w-40">마지막 수집</th>
                                    <th className="text-right px-4 py-2.5 w-24">작업</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {activeKws.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                                            {searchText || typeFilter ? '검색 결과가 없습니다.' : '등록된 키워드가 없습니다.'}
                                        </td>
                                    </tr>
                                )}
                                {activeKws.map(kw => (
                                    <tr key={kw.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800">{kw.keyword_text}</td>
                                        <td className="px-3 py-3">
                                            {kw.keyword_type ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${TYPE_COLORS[kw.keyword_type] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                    {kw.keyword_type}
                                                </span>
                                            ) : <span className="text-xs text-slate-400">—</span>}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${kw.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${kw.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                                                {kw.is_active ? '활성' : '비활성'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-muted-foreground">
                                            {kw.last_fetched_at
                                                ? new Date(kw.last_fetched_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                : <span className="text-slate-300">수집 이력 없음</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleToggle(kw)} title={kw.is_active ? '비활성화' : '활성화'}
                                                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                                                    {kw.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                </button>
                                                <button onClick={() => { setEditTarget(kw); setDialogOpen(true); }} title="수정"
                                                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => handleSoftDelete(kw.id, kw.keyword_text)} title="삭제"
                                                    className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 삭제된 키워드 */}
                    {showDeleted && deletedKws.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">삭제된 키워드 ({deletedKws.length})</p>
                            <div className="border rounded-lg divide-y opacity-60">
                                {deletedKws.map(kw => (
                                    <div key={kw.id} className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-sm line-through text-muted-foreground">{kw.keyword_text}</span>
                                        <button onClick={() => handleRestore(kw.id)}
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                            <RotateCcw className="h-3 w-3" /> 복구
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 추가/수정 다이얼로그 */}
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
