'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getRegions } from '@/actions/admin/region-actions';
import { generateConsolidatedSnapshot, listSnapshots, type SnapshotInfo } from '@/actions/export-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileJson, Loader2, Star } from 'lucide-react';

type Region = { id: number; name: string; slug: string; isActive: boolean };

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
    const [regions, setRegions] = useState<Region[]>([]);
    const [snapshotLoading, setSnapshotLoading] = useState(false);
    
    // Consolidated snapshot states
    const [consolidatedRegions, setConsolidatedRegions] = useState<number[]>([]);
    const [consolidatedMonth, setConsolidatedMonth] = useState(monthOptions()[0].value);
    const [consolidatedFilterType, setConsolidatedFilterType] = useState<'pub_date' | 'created_at'>('pub_date');
    const [consolidatedGenerating, setConsolidatedGenerating] = useState(false);
    const [consolidatedSnapshots, setConsolidatedSnapshots] = useState<SnapshotInfo[]>([]);

    const months = monthOptions();

    useEffect(() => {
        getRegions().then(result => {
            if (result.success && result.data) {
                setRegions(result.data);
                if (result.data.length > 0) {
                    // 기본으로 모든 지역 선택
                    setConsolidatedRegions(result.data.map((r: Region) => r.id));
                }
            }
        });
        loadSnapshots();
    }, []);

    async function loadSnapshots() {
        setSnapshotLoading(true);
        try {
            const consolidatedList = await listSnapshots('consolidated');
            setConsolidatedSnapshots(consolidatedList);
        } catch (error) {
            console.error('Failed to load snapshots:', error);
            toast.error('Snapshot 히스토리를 불러오는데 실패했습니다.');
        } finally {
            setSnapshotLoading(false);
        }
    }

    async function handleGenerateConsolidated() {
        if (consolidatedRegions.length === 0) {
            toast.error('하나 이상의 지역을 선택하세요.');
            return;
        }
        setConsolidatedGenerating(true);
        toast.info('통합 Snapshot 생성 중...');
        try {
            const result = await generateConsolidatedSnapshot(consolidatedRegions, consolidatedMonth, consolidatedFilterType);
            if (result.success) {
                toast.success(result.message);
                loadSnapshots();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Failed to generate snapshot:', error);
            toast.error('Snapshot 생성 중 오류가 발생했습니다.');
        } finally {
            setConsolidatedGenerating(false);
        }
    }

    function formatBytes(b: number) {
        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / 1024 / 1024).toFixed(1)} MB`;
    }

    const toggleAllRegions = () => {
        if (consolidatedRegions.length === regions.length) {
            setConsolidatedRegions([]);
        } else {
            setConsolidatedRegions(regions.map((r: Region) => r.id));
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Download className="h-8 w-8 text-zi-primary" /> 통합 Snapshot
                </h1>
                <p className="text-muted-foreground mt-1">지역별 데이터를 하나로 묶어 월간 스냅샷을 생성하고 관리합니다.</p>
            </div>

            {/* Consolidated Snapshot Generator */}
            <Card className="border-zi-primary/20 shadow-sm">
                <CardHeader className="bg-zi-primary/5 border-b border-zi-primary/10">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileJson className="h-5 w-5 text-zi-primary" /> 통합 Snapshot 생성
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Region Selection */}
                        <div className="lg:col-span-1 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-zi-primary uppercase tracking-wider">대상 지역</label>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 px-2 text-[11px] font-bold"
                                    onClick={toggleAllRegions}
                                >
                                    {consolidatedRegions.length === regions.length ? '전체 해제' : '전체 선택'}
                                </Button>
                            </div>
                            <div className="border border-zi-divider rounded-md p-2 max-h-[220px] overflow-y-auto space-y-1 bg-zi-surface/50">
                                {regions.map((reg: Region) => (
                                    <label key={`cons-${reg.id}`} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-zi-primary/5 p-1.5 rounded-sm transition-colors">
                                        <input
                                            type="checkbox"
                                            className="rounded border-zi-divider text-zi-primary focus:ring-zi-primary"
                                            checked={consolidatedRegions.includes(reg.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setConsolidatedRegions([...consolidatedRegions, reg.id]);
                                                } else {
                                                    setConsolidatedRegions(consolidatedRegions.filter(id => id !== reg.id));
                                                }
                                            }}
                                        />
                                        <span className="font-medium text-zi-on-surface">{reg.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zi-primary uppercase tracking-wider">필터 기준</label>
                                    <select
                                        className="w-full border border-zi-divider rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zi-primary bg-white shadow-sm"
                                        value={consolidatedFilterType}
                                        onChange={e => setConsolidatedFilterType(e.target.value as 'pub_date' | 'created_at')}
                                    >
                                        <option value="pub_date">뉴스 발행일 (pub_date) 기준</option>
                                        <option value="created_at">데이터 수집일 (created_at) 기준</option>
                                    </select>
                                    <p className="text-[11px] text-muted-foreground px-1">기사가 해당 월에 포함되는지 판단하는 기준입니다.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zi-primary uppercase tracking-wider">기준 월</label>
                                    <select
                                        className="w-full border border-zi-divider rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zi-primary bg-white shadow-sm"
                                        value={consolidatedMonth}
                                        onChange={e => setConsolidatedMonth(e.target.value)}
                                    >
                                        {months.map(m => (
                                            <option key={`cons-${m.value}`} value={m.value}>{m.label} ({m.value})</option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-muted-foreground px-1">스냅샷에 포함될 기사의 날짜 범위입니다.</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zi-divider flex flex-col sm:flex-row items-center gap-4">
                                <Button 
                                    onClick={handleGenerateConsolidated} 
                                    disabled={consolidatedGenerating || consolidatedRegions.length === 0} 
                                    size="lg"
                                    className="w-full sm:w-auto px-8 bg-zi-primary hover:bg-zi-primary/90 text-white font-bold rounded-zi-btn shadow-lg transition-all active:scale-95"
                                >
                                    {consolidatedGenerating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
                                    통합 Snapshot 생성
                                </Button>
                                <div className="text-xs text-muted-foreground bg-zi-surface px-3 py-2 rounded border border-zi-divider flex-1">
                                    <strong className="text-zi-primary">안내:</strong> {consolidatedRegions.length}개의 지역 기사를 묶어 {consolidatedMonth} 스냅샷을 생성합니다. 
                                    기존 파일이 있는 경우 덮어쓰지 않고 새로운 버전으로 저장됩니다.
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Consolidated Snapshot History */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between py-5">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" /> 통합 Snapshot 히스토리
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                        {consolidatedSnapshots.length} Files
                    </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                    {snapshotLoading ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 opacity-20" />
                            <p className="font-medium">Snapshot 목록을 불러오고 있습니다...</p>
                        </div>
                    ) : consolidatedSnapshots.length === 0 ? (
                        <div className="py-16 text-center border-2 border-dashed border-zi-divider rounded-lg">
                            <FileJson className="h-12 w-12 text-zi-divider mx-auto mb-3" />
                            <p className="text-zi-on-surface-variant font-medium">생성된 통합 Snapshot이 없습니다.</p>
                            <p className="text-sm text-zi-outline mt-1">상단의 생성 버튼을 눌러 첫 번째 통합 스냅샷을 만들어보세요.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Array.from(new Set(consolidatedSnapshots.map(s => s.month))).map(mon => (
                                <div key={`cons-hist-${mon}`} className="space-y-3">
                                    <h3 className="text-sm font-bold text-zi-primary flex items-center gap-2 px-1">
                                        <div className="h-1 w-1 rounded-full bg-zi-primary" />
                                        {mon.replace('-', '년 ')}월 데이터
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {consolidatedSnapshots.filter(s => s.month === mon).map(snap => (
                                            <div
                                                key={snap.filename}
                                                className="group flex items-center justify-between gap-4 p-4 border border-zi-divider rounded-zi-card bg-white hover:border-zi-primary/30 hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                        <FileJson className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-semibold text-zi-primary truncate" title={snap.filename}>
                                                            {snap.filename}
                                                        </p>
                                                        <p className="text-[11px] text-zi-outline mt-0.5">
                                                            생성: {snap.generatedAt} · {formatBytes(snap.sizeBytes)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {snap.isLatest && (
                                                        <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-none px-2 py-0 h-5 text-[10px] font-bold">
                                                            LATEST
                                                        </Badge>
                                                    )}
                                                    <a
                                                        href={`/api/snapshots/${encodeURIComponent(snap.filename)}`}
                                                        download={snap.filename}
                                                        className="inline-flex"
                                                    >
                                                        <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-zi-divider hover:border-zi-primary hover:text-zi-primary">
                                                            <Download className="h-3.5 w-3.5 mr-1" /> 받기
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
