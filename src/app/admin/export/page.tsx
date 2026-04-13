'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getIndustries } from '@/actions/industry-actions';
import { generateMonthlySnapshot, listSnapshots, type SnapshotInfo } from '@/actions/export-actions';
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
    const months = monthOptions();

    useEffect(() => {
        getIndustries(false).then(data => {
            setIndustries(data);
            if (data.length > 0) setSelectedIndustryId(data[0].id);
        });
    }, []);

    const selectedIndustry = industries.find(e => e.id === Number(selectedIndustryId));

    async function loadSnapshots() {
        if (!selectedIndustry) return;
        setSnapshotLoading(true);
        const list = await listSnapshots(selectedIndustry.slug);
        setSnapshots(list);
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
        </div>
    );
}
