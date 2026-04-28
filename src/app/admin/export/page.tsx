'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getIndustries } from '@/actions/industry-actions';
import { generateMonthlySnapshot, generateConsolidatedSnapshot, listSnapshots, type SnapshotInfo } from '@/actions/export-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileJson, Loader2, Star } from 'lucide-react';

type Industry = Awaited<ReturnType<typeof getIndustries>>[number];

function monthOptions() {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        opts.push({ value: val, label: `${d.getFullYear()}년 ${d.getMonth() + 1}월` });
    }
    return opts;
}

export default function ExportPage() {
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [selectedIndustryId, setSelectedIndustryId] = useState<number | ''>('');
    const [selectedMonth, setSelectedMonth] = useState(monthOptions()[0].value);
    const [generating, setGenerating] = useState(false);
    const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
    const [snapshotLoading, setSnapshotLoading] = useState(false);
    
    // Consolidated snapshot states
    const [consolidatedIndustries, setConsolidatedIndustries] = useState<number[]>([]);
    const [consolidatedMonth, setConsolidatedMonth] = useState(monthOptions()[0].value);
    const [consolidatedFilterType, setConsolidatedFilterType] = useState<'pub_date' | 'created_at'>('pub_date');
    const [consolidatedGenerating, setConsolidatedGenerating] = useState(false);
    const [consolidatedSnapshots, setConsolidatedSnapshots] = useState<SnapshotInfo[]>([]);

    const months = monthOptions();

    useEffect(() => {
        getIndustries(false).then(data => {
            setIndustries(data);
            if (data.length > 0) {
                setSelectedIndustryId(data[0].id);
                setConsolidatedIndustries([data[0].id]);
            }
        });
    }, []);

    const selectedIndustry = industries.find(e => e.id === Number(selectedIndustryId));

    async function loadSnapshots() {
        if (!selectedIndustry) return;
        setSnapshotLoading(true);
        const [list, consolidatedList] = await Promise.all([
            listSnapshots(selectedIndustry.slug),
            listSnapshots('consolidated')
        ]);
        setSnapshots(list);
        setConsolidatedSnapshots(consolidatedList);
        setSnapshotLoading(false);
    }

    useEffect(() => {
        if (selectedIndustry) loadSnapshots();
    }, [selectedIndustry]); // eslint-disable-line

    async function handleGenerate() {
        if (!selectedIndustryId) { toast.error('산업를 선택하세요.'); return; }
        setGenerating(true);
        toast.info('Snapshot 생성 중...');
        const result = await generateMonthlySnapshot(Number(selectedIndustryId), selectedMonth);
        setGenerating(false);
        if (result.success) {
            toast.success(result.message);
            loadSnapshots();
        } else {
            toast.error(result.message);
        }
    }

    async function handleGenerateConsolidated() {
        if (consolidatedIndustries.length === 0) { toast.error('하나 이상의 산업을 선택하세요.'); return; }
        setConsolidatedGenerating(true);
        toast.info('통합 Snapshot 생성 중...');
        const result = await generateConsolidatedSnapshot(consolidatedIndustries, consolidatedMonth, consolidatedFilterType);
        setConsolidatedGenerating(false);
        if (result.success) {
            toast.success(result.message);
            loadSnapshots();
        } else {
            toast.error(result.message);
        }
    }

    function formatBytes(b: number) {
        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / 1024 / 1024).toFixed(1)} MB`;
    }

    const filteredSnapshots = snapshots.filter(s => s.month === selectedMonth);
    const allSnapshots = snapshots;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Download className="h-8 w-8" /> Export
                </h1>
                <p className="text-muted-foreground mt-1">월간 기사 묶음 Snapshot 생성 및 히스토리 관리</p>
            </div>

            {/* Snapshot Generator */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Snapshot 생성</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">산업</label>
                            <select
                                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                value={selectedIndustryId}
                                onChange={e => setSelectedIndustryId(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">선택하세요</option>
                                {industries.map(ex => (
                                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">기준 월 (pub_date)</label>
                            <select
                                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                            >
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.label} ({m.value})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleGenerate} disabled={generating || !selectedIndustryId}>
                            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileJson className="h-4 w-4 mr-2" />}
                            Snapshot 생성
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            같은 산업+월 조합으로 여러 Snapshot을 생성할 수 있습니다 (히스토리 유지).
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Consolidated Snapshot Generator */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">통합 Snapshot 생성</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="md:col-span-2 lg:col-span-1">
                            <label className="text-sm font-medium mb-2 block">대상 산업 선택</label>
                            <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-900">
                                {industries.map(ex => (
                                    <label key={`cons-${ex.id}`} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300"
                                            checked={consolidatedIndustries.includes(ex.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setConsolidatedIndustries([...consolidatedIndustries, ex.id]);
                                                } else {
                                                    setConsolidatedIndustries(consolidatedIndustries.filter(id => id !== ex.id));
                                                }
                                            }}
                                        />
                                        {ex.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">필터 기준</label>
                            <select
                                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                value={consolidatedFilterType}
                                onChange={e => setConsolidatedFilterType(e.target.value as 'pub_date' | 'created_at')}
                            >
                                <option value="pub_date">발행일 (pub_date) 기준</option>
                                <option value="created_at">수집일 (created_at) 기준</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">기준 월</label>
                            <select
                                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                value={consolidatedMonth}
                                onChange={e => setConsolidatedMonth(e.target.value)}
                            >
                                {months.map(m => (
                                    <option key={`cons-${m.value}`} value={m.value}>{m.label} ({m.value})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <Button onClick={handleGenerateConsolidated} disabled={consolidatedGenerating || consolidatedIndustries.length === 0} variant="secondary">
                            {consolidatedGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileJson className="h-4 w-4 mr-2" />}
                            통합 Snapshot 생성
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            여러 산업의 기사를 선택한 필터(발행일/수집일) 기준으로 묶어서 생성합니다.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Snapshot History for selected industry */}
                {selectedIndustry && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                            <span>Snapshot 히스토리 — {selectedIndustry.name}</span>
                            <span className="text-xs font-normal text-muted-foreground">{allSnapshots.length}개</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {snapshotLoading ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                불러오는 중...
                            </div>
                        ) : allSnapshots.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">생성된 Snapshot이 없습니다.</p>
                        ) : (
                            <div className="space-y-2">
                                {/* Group by month */}
                                {Array.from(new Set(allSnapshots.map(s => s.month))).map(mon => (
                                    <div key={mon}>
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-4 first:mt-0">
                                            {mon}
                                        </h3>
                                        {allSnapshots.filter(s => s.month === mon).map(snap => (
                                            <div
                                                key={snap.filename}
                                                className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-slate-50"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileJson className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-mono text-slate-600 truncate">{snap.filename}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            생성일: {snap.generatedAt} · {formatBytes(snap.sizeBytes)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {snap.isLatest && (
                                                        <Badge variant="default" className="text-xs flex items-center gap-1">
                                                            <Star className="h-3 w-3" /> 최신
                                                        </Badge>
                                                    )}
                                                    <a
                                                        href={`/api/snapshots/${encodeURIComponent(snap.filename)}`}
                                                        download={snap.filename}
                                                    >
                                                        <Button size="sm" variant="outline">
                                                            <Download className="h-3 w-3 mr-1" /> 다운로드
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Consolidated Snapshot History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                        <span>통합 Snapshot 히스토리</span>
                        <span className="text-xs font-normal text-muted-foreground">{consolidatedSnapshots.length}개</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {snapshotLoading ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                            불러오는 중...
                        </div>
                    ) : consolidatedSnapshots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">생성된 통합 Snapshot이 없습니다.</p>
                    ) : (
                        <div className="space-y-2">
                            {Array.from(new Set(consolidatedSnapshots.map(s => s.month))).map(mon => (
                                <div key={`cons-hist-${mon}`}>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-4 first:mt-0">
                                        {mon}
                                    </h3>
                                    {consolidatedSnapshots.filter(s => s.month === mon).map(snap => (
                                        <div
                                            key={snap.filename}
                                            className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-slate-50"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileJson className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-mono text-slate-600 truncate">{snap.filename}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        생성일: {snap.generatedAt} · {formatBytes(snap.sizeBytes)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {snap.isLatest && (
                                                    <Badge variant="default" className="text-xs flex items-center gap-1">
                                                        <Star className="h-3 w-3" /> 최신
                                                    </Badge>
                                                )}
                                                <a
                                                    href={`/api/snapshots/${encodeURIComponent(snap.filename)}`}
                                                    download={snap.filename}
                                                >
                                                    <Button size="sm" variant="outline">
                                                        <Download className="h-3 w-3 mr-1" /> 다운로드
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
        </div>
    );
}
