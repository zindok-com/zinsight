'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getStorageOverview, deleteBlob, deleteUnusedBlobs, renameBlobTransaction, type StorageBlobItem } from '@/actions/upload-actions';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
    AlertTriangle,
    Check,
    Copy,
    Edit,
    Eraser,
    ExternalLink,
    FolderOpen,
    LayoutGrid,
    List,
    Loader2,
    RefreshCw,
    Search,
    Trash2,
    Upload,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MediaPreview } from '@/components/admin/storage/MediaPreview';
import { folderForFile, uploadToStorage } from '@/components/admin/storage/storage-upload';
import {
    CLEANUP_GRACE_MS,
    MEDIA_KINDS,
    MEDIA_KIND_LABEL,
    MEDIA_USAGE_TYPE_LABEL,
    formatBytes,
    getMediaKind,
    type MediaKind,
    type MediaUsage,
} from '@/lib/storage-media';

type KindTab = 'all' | MediaKind;
type UsageFilter = 'all' | 'used' | 'unused';
type SortKey = 'recent' | 'name' | 'size';

interface Row extends StorageBlobItem {
    fileName: string;
    kind: MediaKind;
    usages: MediaUsage[];
}

const SORT_LABEL: Record<SortKey, string> = { recent: '최신순', name: '이름순', size: '용량순' };

function UsageList({ usages }: { usages: MediaUsage[] }) {
    return (
        <ul className="space-y-1">
            {usages.map((u, i) => (
                <li key={`${u.href}-${u.field}-${i}`} className="text-xs leading-snug">
                    <Link href={u.href} className="group/u flex min-w-0 items-baseline gap-1 text-slate-700 hover:text-indigo-600">
                        <span className="shrink-0 font-semibold text-slate-500">{MEDIA_USAGE_TYPE_LABEL[u.type]}</span>
                        <span className="truncate group-hover/u:underline">{u.label}</span>
                        <span className="shrink-0 text-slate-400">· {u.field}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

function UsageBadge({ count }: { count: number }) {
    return count > 0 ? (
        <span className="rounded-full border border-green-600 bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            사용 중 {count}
        </span>
    ) : (
        <span className="rounded-full border border-amber-600 bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">미사용</span>
    );
}

export default function StoragePage() {
    const confirm = useConfirm();
    const [blobs, setBlobs] = useState<StorageBlobItem[]>([]);
    const [usage, setUsage] = useState<Record<string, MediaUsage[]>>({});
    const [cleanupAllowed, setCleanupAllowed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    // 보기 조건
    const [searchQuery, setSearchQuery] = useState('');
    const [kindTab, setKindTab] = useState<KindTab>('all');
    const [usageFilter, setUsageFilter] = useState<UsageFilter>('all');
    const [sort, setSort] = useState<SortKey>('recent');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    // 업로드
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState<{ index: number; total: number; name: string; percent: number } | null>(null);

    // 이름 변경
    const [renamingRow, setRenamingRow] = useState<Row | null>(null);
    const [newFileName, setNewFileName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);

    const fetchOverview = async (showToast = false) => {
        setLoading(true);
        try {
            const res = await getStorageOverview();
            if (res.success) {
                setBlobs(res.blobs);
                setUsage(res.usage);
                setCleanupAllowed(res.cleanupAllowed);
                if (showToast) toast.success('보관함을 새로 불러왔습니다.');
            } else {
                toast.error(res.error || '보관함 파일을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    const rows: Row[] = useMemo(
        () =>
            blobs.map((b) => ({
                ...b,
                fileName: b.pathname.split('/').pop() || b.pathname,
                kind: getMediaKind(b.pathname),
                usages: usage[b.pathname] ?? [],
            })),
        [blobs, usage]
    );

    // 종류별 개수·용량 (탭 표시용)
    const kindStats = useMemo(() => {
        const stats: Record<KindTab, { count: number; size: number }> = {
            all: { count: 0, size: 0 },
            image: { count: 0, size: 0 },
            video: { count: 0, size: 0 },
            logo: { count: 0, size: 0 },
            document: { count: 0, size: 0 },
        };
        for (const r of rows) {
            stats.all.count++;
            stats.all.size += r.size;
            stats[r.kind].count++;
            stats[r.kind].size += r.size;
        }
        return stats;
    }, [rows]);

    const visibleRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const filtered = rows.filter((r) => {
            if (kindTab !== 'all' && r.kind !== kindTab) return false;
            if (usageFilter === 'used' && r.usages.length === 0) return false;
            if (usageFilter === 'unused' && r.usages.length > 0) return false;
            if (!q) return true;
            return r.pathname.toLowerCase().includes(q) || r.usages.some((u) => u.label.toLowerCase().includes(q));
        });
        return filtered.sort((a, b) => {
            if (sort === 'name') return a.fileName.localeCompare(b.fileName);
            if (sort === 'size') return b.size - a.size;
            return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        });
    }, [rows, kindTab, usageFilter, sort, searchQuery]);

    // 일괄 정리 대상: 미사용 + 업로드 후 24시간 경과 (서버도 같은 기준으로 다시 계산)
    const cleanupTargets = useMemo(() => {
        const cutoff = Date.now() - CLEANUP_GRACE_MS;
        return rows.filter((r) => r.usages.length === 0 && new Date(r.uploadedAt).getTime() < cutoff);
    }, [rows]);

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        toast.success('파일 주소가 복사되었습니다.');
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const handleDelete = async (row: Row) => {
        const used = row.usages.length > 0;
        const usageText = row.usages
            .slice(0, 5)
            .map((u) => `· ${MEDIA_USAGE_TYPE_LABEL[u.type]} "${u.label}" (${u.field})`)
            .join('\n');
        const description = used
            ? `⚠️ 이 파일은 아래 ${row.usages.length}곳에서 사용 중입니다. 삭제하면 해당 화면에서 파일이 깨집니다.\n\n${usageText}${row.usages.length > 5 ? `\n· 외 ${row.usages.length - 5}곳` : ''}`
            : `${row.fileName}을(를) 보관함에서 영구 삭제합니다. 복구할 수 없습니다.`;

        const ok = await confirm({
            title: used ? '사용 중인 파일 삭제' : '보관함 파일 삭제',
            description,
            confirmText: used ? '그래도 삭제' : '영구 삭제',
            variant: 'destructive',
        });
        if (!ok) return;

        const res = await deleteBlob(row.url, { force: used });
        if (res.success) {
            setBlobs((prev) => prev.filter((b) => b.url !== row.url));
            toast.success('파일을 삭제했습니다.');
        } else if ('usages' in res && res.usages) {
            // 화면을 연 뒤 다른 곳에서 사용하기 시작한 경우
            toast.error('그 사이 사용처가 생겨 삭제하지 않았습니다. 새로고침 후 다시 확인해 주세요.');
            await fetchOverview();
        } else {
            toast.error(res.error || '삭제 중 오류가 발생했습니다.');
        }
    };

    const handleCleanUnused = async () => {
        if (cleanupTargets.length === 0) {
            toast.info('정리할 미사용 파일이 없습니다. (최근 24시간 업로드분은 제외)');
            return;
        }
        const totalSize = cleanupTargets.reduce((sum, r) => sum + r.size, 0);
        const ok = await confirm({
            title: '미사용 파일 일괄 삭제',
            description: `포스트·조직·등록 신청·발행자 어디에서도 쓰지 않는 파일 ${cleanupTargets.length}개(${formatBytes(totalSize)})를 영구 삭제합니다.\n최근 24시간 안에 올린 파일은 제외되며, 삭제된 파일은 복구할 수 없습니다.`,
            confirmText: `${cleanupTargets.length}개 삭제`,
            variant: 'destructive',
        });
        if (!ok) return;

        const res = await deleteUnusedBlobs();
        if (res.success) {
            toast.success(`미사용 파일 ${res.deleted}개를 삭제했습니다.`);
            await fetchOverview();
        } else {
            toast.error(res.error || '일괄 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleFilesUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        const files = Array.from(fileList);
        const accepted = files.filter((f) => folderForFile(f));
        if (accepted.length === 0) {
            toast.error('이미지, 영상(MP4·WebM·MOV), PDF 파일만 올릴 수 있습니다.');
            return;
        }

        let success = 0;
        const errors: string[] = [];
        for (let i = 0; i < accepted.length; i++) {
            const file = accepted[i];
            setUploading({ index: i + 1, total: accepted.length, name: file.name, percent: 0 });
            try {
                await uploadToStorage(file, folderForFile(file)!, (percent) =>
                    setUploading((prev) => (prev ? { ...prev, percent } : prev))
                );
                success++;
            } catch (error) {
                errors.push(error instanceof Error ? error.message : `${file.name}: 업로드 실패`);
            }
        }
        setUploading(null);
        await fetchOverview();

        const skipped = files.length - accepted.length;
        if (success > 0) toast.success(`${success}개 파일을 업로드했습니다.`);
        if (skipped > 0) toast.warning(`지원하지 않는 형식 ${skipped}개는 건너뛰었습니다.`);
        errors.slice(0, 3).forEach((msg) => toast.error(msg));
    };

    const handleRenameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renamingRow || !newFileName) return;

        setIsRenaming(true);
        try {
            const res = await renameBlobTransaction(renamingRow.url, renamingRow.pathname, newFileName);
            if (res.success) {
                const affected = (res.affectedPosts ?? 0) + (res.affectedOthers ?? 0);
                toast.success(affected > 0 ? `파일명을 바꾸고 ${affected}곳의 주소를 함께 고쳤습니다.` : '파일명을 바꿨습니다.');
                setRenamingRow(null);
                await fetchOverview();
            } else {
                toast.error(res.error || '파일명 변경 실패');
            }
        } catch (error) {
            console.error(error);
            toast.error('파일명 변경 중 시스템 오류가 발생했습니다.');
        } finally {
            setIsRenaming(false);
        }
    };

    const openRename = (row: Row) => {
        setRenamingRow(row);
        setNewFileName(row.fileName.replace(/\.[^.]+$/, ''));
    };

    const rowActions = (row: Row, compact = false) => (
        <div className={`flex gap-1.5 ${compact ? '' : 'w-full'}`}>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(row.url)}
                className={`${compact ? 'w-8 p-0' : 'min-w-0 flex-1 px-2'} h-8 gap-1.5 border-slate-200 bg-white text-xs font-semibold hover:border-indigo-200 hover:bg-indigo-50/30 hover:text-indigo-600`}
            >
                {copiedUrl === row.url ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                {compact ? <span className="sr-only">주소 복사</span> : copiedUrl === row.url ? '복사됨' : '주소 복사'}
            </Button>
            <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${row.fileName} 새 창으로 열기`}
                title="새 창으로 열기"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            >
                <ExternalLink className="h-4 w-4" />
            </a>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openRename(row)}
                aria-label={`${row.fileName} 파일명 변경`}
                title="파일명 변경"
                className="h-8 w-8 shrink-0 rounded-lg p-0 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
            >
                <Edit className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row)}
                aria-label={`${row.fileName} 삭제`}
                title="파일 삭제"
                className="h-8 w-8 shrink-0 rounded-lg p-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );

    const kindTabs: KindTab[] = ['all', ...MEDIA_KINDS];

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">미디어 보관함</h1>
                    <p className="mt-1.5 text-sm text-slate-500">
                        NCP Object Storage의 이미지·영상·로고·첨부 파일과, 각 파일을 쓰는 포스트·조직을 함께 관리합니다.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCleanUnused}
                        disabled={loading || !cleanupAllowed}
                        title={cleanupAllowed ? undefined : '운영 배포 관리자에서만 실행할 수 있습니다.'}
                        className="gap-1.5 border-rose-200 bg-rose-50 font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                    >
                        <Eraser className="h-4 w-4" />
                        미사용 파일 정리{cleanupAllowed && cleanupTargets.length > 0 ? ` (${cleanupTargets.length})` : ''}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchOverview(true)}
                        disabled={loading}
                        className="gap-1.5 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        새로고침
                    </Button>
                </div>
            </div>

            {!loading && !cleanupAllowed && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                        <strong>개발·미리보기 환경입니다.</strong> 파일은 운영과 같은 버킷이지만 사용처는 이 환경의 DB 기준이라, 운영에서 쓰는 파일도
                        &lsquo;미사용&rsquo;으로 보일 수 있습니다. 미사용 일괄 정리는 운영 관리자에서만 실행됩니다.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* 업로드 */}
                <Card className="h-fit border-slate-100 bg-white shadow-md lg:col-span-1">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold text-slate-800">새 파일 업로드</CardTitle>
                        <CardDescription className="text-xs text-slate-400">이미지는 images/, 영상은 videos/, PDF는 attachments/에 저장됩니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="파일 업로드"
                            onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && !uploading) document.getElementById('storage-file-input')?.click();
                            }}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragging(false);
                                if (!uploading) handleFilesUpload(e.dataTransfer.files);
                            }}
                            onClick={() => {
                                if (!uploading) document.getElementById('storage-file-input')?.click();
                            }}
                            className={`flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                                isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20'
                            } ${uploading ? 'pointer-events-none border-slate-300 bg-slate-50' : 'cursor-pointer'}`}
                        >
                            {uploading ? (
                                <div className="flex w-full flex-col items-center space-y-3 px-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                    <p className="text-sm font-semibold text-indigo-600">
                                        업로드 중 ({uploading.index}/{uploading.total}) · {uploading.percent}%
                                    </p>
                                    <p className="w-full truncate text-xs text-slate-500">{uploading.name}</p>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                        <div className="h-1.5 bg-indigo-600 transition-all duration-200" style={{ width: `${uploading.percent}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center space-y-4">
                                    <div className={`rounded-full p-3.5 ${isDragging ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{isDragging ? '여기에 파일을 놓으세요' : '드래그해서 여러 개 첨부'}</p>
                                        <p className="mt-1 text-xs font-medium text-indigo-600/80">또는 클릭해서 선택</p>
                                        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                                            이미지 PNG·JPG·WEBP·GIF·SVG (10MB)
                                            <br />
                                            영상 MP4·WebM·MOV (300MB) · PDF (50MB)
                                        </p>
                                    </div>
                                </div>
                            )}
                            <input
                                id="storage-file-input"
                                type="file"
                                multiple
                                className="hidden"
                                accept="image/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v,.pdf"
                                onChange={(e) => {
                                    handleFilesUpload(e.target.files);
                                    e.target.value = '';
                                }}
                                disabled={!!uploading}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 목록 */}
                <Card className="border-slate-100 bg-white shadow-md lg:col-span-3">
                    <CardHeader className="space-y-4 border-b border-slate-100 pb-4">
                        {/* 종류 탭 (개수·용량) */}
                        <div role="tablist" aria-label="파일 종류" className="flex flex-wrap gap-2">
                            {kindTabs.map((tab) => {
                                const active = kindTab === tab;
                                const stat = kindStats[tab];
                                return (
                                    <button
                                        key={tab}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => setKindTab(tab)}
                                        className={`flex min-h-11 flex-col items-start rounded-xl border px-3.5 py-1.5 text-left transition-colors ${
                                            active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                                        }`}
                                    >
                                        <span className="text-sm font-bold">
                                            {tab === 'all' ? '전체' : MEDIA_KIND_LABEL[tab]} <span className="tabular-nums">{stat.count}</span>
                                        </span>
                                        <span className={`text-[11px] tabular-nums ${active ? 'text-indigo-100' : 'text-slate-400'}`}>{formatBytes(stat.size)}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* 검색·필터·정렬·보기 */}
                        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <label htmlFor="storage-search" className="sr-only">파일 검색</label>
                                <input
                                    id="storage-search"
                                    type="search"
                                    placeholder="파일명 또는 사용처(기사 제목·조직명) 검색"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="사용 여부">
                                    {(['all', 'used', 'unused'] as UsageFilter[]).map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            aria-pressed={usageFilter === f}
                                            onClick={() => setUsageFilter(f)}
                                            className={`h-9 rounded-md px-3 text-xs font-semibold transition-colors ${
                                                usageFilter === f ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {f === 'all' ? '전체' : f === 'used' ? '사용 중' : '미사용'}
                                        </button>
                                    ))}
                                </div>
                                <label htmlFor="storage-sort" className="sr-only">정렬</label>
                                <select
                                    id="storage-sort"
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value as SortKey)}
                                    className="h-10 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {(Object.keys(SORT_LABEL) as SortKey[]).map((s) => (
                                        <option key={s} value={s}>{SORT_LABEL[s]}</option>
                                    ))}
                                </select>
                                <div className="flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="보기 방식">
                                    <button
                                        type="button"
                                        aria-pressed={view === 'grid'}
                                        aria-label="격자 보기"
                                        onClick={() => setView('grid')}
                                        className={`flex h-9 w-9 items-center justify-center rounded-md ${view === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={view === 'list'}
                                        aria-label="목록 보기"
                                        onClick={() => setView('list')}
                                        className={`flex h-9 w-9 items-center justify-center rounded-md ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            <strong className="tabular-nums text-slate-700">{visibleRows.length}</strong>개 표시 중
                        </p>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                <p className="text-sm font-medium">보관함과 사용처를 불러오고 있습니다...</p>
                            </div>
                        ) : visibleRows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center space-y-3 py-24 text-center text-slate-400">
                                <FolderOpen className="h-12 w-12 text-slate-200" />
                                <div>
                                    <p className="font-semibold text-slate-600">파일이 없습니다</p>
                                    <p className="mt-1 text-xs text-slate-400">조건에 맞는 파일이 없습니다. 탭이나 필터를 바꿔 보세요.</p>
                                </div>
                            </div>
                        ) : view === 'grid' ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {visibleRows.map((row) => (
                                    <div
                                        key={row.url}
                                        className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md"
                                    >
                                        <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-100 bg-slate-50">
                                            <MediaPreview url={row.url} pathname={row.pathname} />
                                            <div className="absolute left-2 top-2 z-10 flex gap-1">
                                                <UsageBadge count={row.usages.length} />
                                                {row.kind !== 'image' && (
                                                    <span className="rounded-full bg-slate-900/75 px-2 py-0.5 text-[10px] font-bold text-white">{MEDIA_KIND_LABEL[row.kind]}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between gap-3 p-3.5">
                                            <div className="min-w-0 space-y-1">
                                                <p className="truncate text-sm font-bold text-slate-700" title={row.pathname}>{row.fileName}</p>
                                                <p className="text-xs font-medium text-slate-400 tabular-nums">
                                                    {formatBytes(row.size)} · {new Date(row.uploadedAt).toLocaleDateString('ko-KR')}
                                                </p>
                                                {row.usages.length > 0 && (
                                                    <details className="pt-1">
                                                        <summary className="cursor-pointer text-xs font-semibold text-green-700 hover:text-green-800">
                                                            사용처 {row.usages.length}곳 보기
                                                        </summary>
                                                        <div className="mt-1.5 rounded-lg bg-slate-50 p-2">
                                                            <UsageList usages={row.usages} />
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                            {rowActions(row)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[680px] table-fixed border-collapse text-left text-sm">
                                    <caption className="sr-only">보관함 파일 목록</caption>
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                                            <th scope="col" className="w-20 py-2 pr-3">미리보기</th>
                                            <th scope="col" className="w-[32%] py-2 pr-3">파일</th>
                                            <th scope="col" className="py-2 pr-3">사용처</th>
                                            <th scope="col" className="w-28 py-2 pr-3 text-right">용량 · 업로드</th>
                                            <th scope="col" className="w-[150px] py-2"><span className="sr-only">작업</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {visibleRows.map((row) => (
                                            <tr key={row.url} className="align-top hover:bg-slate-50/60">
                                                <td className="py-2.5 pr-3">
                                                    <div className="h-12 w-16 overflow-hidden rounded-md border border-slate-100 bg-slate-50">
                                                        <MediaPreview url={row.url} pathname={row.pathname} />
                                                    </div>
                                                </td>
                                                <th scope="row" className="py-2.5 pr-3 font-normal">
                                                    <p className="truncate font-bold text-slate-700" title={row.pathname}>{row.fileName}</p>
                                                    <p className="text-xs text-slate-400">{MEDIA_KIND_LABEL[row.kind]} · {row.pathname.split('/')[0]}/</p>
                                                </th>
                                                <td className="overflow-hidden py-2.5 pr-3">
                                                    {row.usages.length > 0 ? <UsageList usages={row.usages} /> : <UsageBadge count={0} />}
                                                </td>
                                                <td className="py-2.5 pr-3 text-right text-xs tabular-nums text-slate-600">
                                                    <p className="font-semibold text-slate-700">{formatBytes(row.size)}</p>
                                                    <p className="text-slate-400">{new Date(row.uploadedAt).toLocaleDateString('ko-KR')}</p>
                                                </td>
                                                <td className="py-2.5">{rowActions(row, true)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 이름 변경 */}
            <Dialog open={!!renamingRow} onOpenChange={(open) => !open && !isRenaming && setRenamingRow(null)}>
                <DialogContent>
                    <form onSubmit={handleRenameSubmit}>
                        <DialogHeader>
                            <DialogTitle>파일명 변경</DialogTitle>
                            <DialogDescription>
                                영문 슬러그를 권장합니다. 특수문자는 하이픈(-)으로 바뀌고, 확장자({renamingRow?.fileName.split('.').pop()})는 그대로 유지됩니다.
                            </DialogDescription>
                        </DialogHeader>

                        {renamingRow && renamingRow.usages.length > 0 && (
                            <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                <p>
                                    ⚠️ 아래 {renamingRow.usages.length}곳에서 사용 중입니다. 파일명을 바꾸면 이 주소들이 <strong>새 주소로 자동 치환</strong>됩니다.
                                </p>
                                <UsageList usages={renamingRow.usages} />
                            </div>
                        )}

                        <div className="space-y-2 py-4">
                            <Label htmlFor="newFileName">새 파일명</Label>
                            <Input
                                id="newFileName"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                placeholder="new-file-name"
                                required
                                disabled={isRenaming}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRenamingRow(null)} disabled={isRenaming}>
                                취소
                            </Button>
                            <Button type="submit" disabled={isRenaming || !newFileName}>
                                {isRenaming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                파일명 변경
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
