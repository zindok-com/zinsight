'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { listAllBlobs, deleteBlob, uploadImageDirect, getUsedImageUrls, deleteMultipleBlobs } from '@/actions/upload-actions';
import { toast } from 'sonner';
import { Loader2, Trash2, Copy, Check, Upload, Image as ImageIcon, Search, ExternalLink, RefreshCw, Eraser } from 'lucide-react';

export default function StoragePage() {
    const [blobs, setBlobs] = useState<any[]>([]);
    const [usedUrls, setUsedUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all blobs and their usage status
    const fetchBlobsAndUsage = async (showToast = false) => {
        setLoading(true);
        try {
            const [blobsRes, usageRes] = await Promise.all([listAllBlobs(), getUsedImageUrls()]);
            if (blobsRes.success && blobsRes.blobs) {
                const sorted = [...blobsRes.blobs].sort(
                    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
                );
                setBlobs(sorted);
            } else {
                toast.error(blobsRes.error || '보관함 파일을 불러오는데 실패했습니다.');
            }

            if (usageRes.success && usageRes.urls) {
                setUsedUrls(usageRes.urls);
            }

            if (showToast) {
                toast.success('데이터가 동기화되었습니다.');
            }
        } catch (error) {
            console.error(error);
            toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlobsAndUsage();
    }, []);

    // Copy to clipboard helper
    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        toast.success('이미지 링크 주소가 복사되었습니다.');
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    // Delete image handler
    const handleDelete = async (url: string, pathname: string) => {
        const fileName = pathname.split('/').pop() || '파일';
        const isCurrentlyUsed = usedUrls.includes(url);

        let confirmMsg = `정말로 이 이미지(${fileName})를 보관함에서 영구 삭제하시겠습니까?`;
        if (isCurrentlyUsed) {
            confirmMsg += `\n\n⚠️ 경고: 이 이미지는 현재 매거진 포스트에서 사용 중입니다! 삭제할 경우 포스트 내부 이미지가 깨질 수 있습니다.`;
        } else {
            confirmMsg += `\n(현재 사용 중이지 않은 이미지이므로 안전하게 삭제 가능합니다.)`;
        }

        const confirmDelete = window.confirm(confirmMsg);
        if (!confirmDelete) return;

        toast.promise(
            async () => {
                const res = await deleteBlob(url);
                if (res.success) {
                    setBlobs(prev => prev.filter(b => b.url !== url));
                } else {
                    throw new Error(res.error || '삭제 실패');
                }
            },
            {
                loading: '이미지 삭제 중...',
                success: '이미지가 성공적으로 삭제되었습니다.',
                error: (err) => err.message || '삭제 중 오류가 발생했습니다.'
            }
        );
    };

    // Clean up all unused images
    const handleCleanUnusedBlobs = async () => {
        const unusedBlobs = blobs.filter(b => !usedUrls.includes(b.url));
        if (unusedBlobs.length === 0) {
            toast.info('삭제할 미사용 이미지가 없습니다.');
            return;
        }

        const count = unusedBlobs.length;
        const confirm1 = window.confirm(
            `현재 발행된 매거진 포스트에서 사용 중이지 않은 이미지 ${count}개를 일괄 삭제하시겠습니까?\n이 작업은 영구적으로 미디어를 제거합니다.`
        );
        if (!confirm1) return;

        const confirm2 = window.confirm(
            `⚠️ 경고 (최종 확인)\n\n정말로 미사용 이미지 ${count}개를 일괄 영구 삭제하시겠습니까?\n삭제된 이미지는 절대 복구할 수 없습니다.`
        );
        if (!confirm2) return;

        toast.promise(
            async () => {
                const urlsToDelete = unusedBlobs.map(b => b.url);
                const res = await deleteMultipleBlobs(urlsToDelete);
                if (res.success) {
                    await fetchBlobsAndUsage();
                } else {
                    throw new Error(res.error || '일괄 삭제 실패');
                }
            },
            {
                loading: '미사용 이미지 일괄 삭제 중...',
                success: '미사용 이미지가 모두 정상적으로 삭제되었습니다.',
                error: (err) => err.message || '일괄 삭제 중 오류가 발생했습니다.'
            }
        );
    };

    // Upload change handler
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const file = files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await uploadImageDirect(formData);
            if (res.success && res.url) {
                toast.success('이미지가 성공적으로 업로드되었습니다!');
                await fetchBlobsAndUsage(); // Refresh list
            } else {
                toast.error(res.error || '업로드 실패');
            }
        } catch (error) {
            console.error(error);
            toast.error('업로드 중 시스템 오류가 발생했습니다.');
        } finally {
            setUploading(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    // Filter blobs by search query
    const filteredBlobs = blobs.filter(b => {
        const fileName = b.pathname.toLowerCase();
        return fileName.includes(searchQuery.toLowerCase());
    });

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6 w-full p-4 sm:p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">이미지 보관함</h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        Vercel Blob 스토리지를 관리하고, 매거진 포스트에서 사용 중인지 여부를 실시간으로 모니터링합니다.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCleanUnusedBlobs}
                        disabled={loading}
                        className="gap-1.5 bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:text-rose-800 font-semibold"
                    >
                        <Eraser className="h-4 w-4" />
                        미사용 이미지 정리
                    </Button>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchBlobsAndUsage(true)}
                        disabled={loading}
                        className="gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        새로고침
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Upload Section (Left Sidebar style) */}
                <Card className="lg:col-span-1 h-fit shadow-md border-slate-100 bg-white">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold text-slate-800">새 이미지 업로드</CardTitle>
                        <CardDescription className="text-xs text-slate-400">보관함에 새 이미지를 추가합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <label 
                            className={`border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-indigo-50/20 hover:border-indigo-400 group text-center min-h-[220px] ${
                                uploading ? 'pointer-events-none opacity-50 bg-slate-50 border-slate-300' : ''
                            }`}
                        >
                            {uploading ? (
                                <div className="space-y-3 flex flex-col items-center">
                                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                                    <p className="text-sm font-semibold text-indigo-600">업로드하는 중...</p>
                                    <p className="text-xs text-slate-400">용량에 따라 몇 초 소요될 수 있습니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 flex flex-col items-center">
                                    <div className="p-3.5 bg-indigo-50 rounded-full text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                            파일 클릭하여 업로드
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG, GIF, WEBP</p>
                                    </div>
                                </div>
                            )}
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </label>
                    </CardContent>
                </Card>

                {/* Storage List Section (Takes 3/4 of the width, utilizing full space) */}
                <Card className="lg:col-span-3 shadow-md border-slate-100 bg-white">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800">보관함 파일 목록</CardTitle>
                                <CardDescription className="text-xs text-slate-400">전체 {filteredBlobs.length}개의 파일을 찾았습니다.</CardDescription>
                            </div>
                            {/* Search bar */}
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="파일명 검색..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 w-full text-sm border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {loading ? (
                            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                <p className="text-sm font-medium">보관함 목록을 불러오고 있습니다...</p>
                            </div>
                        ) : filteredBlobs.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-center space-y-3">
                                <ImageIcon className="h-12 w-12 text-slate-200" />
                                <div>
                                    <p className="font-semibold text-slate-600">파일이 없습니다</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {searchQuery ? '검색어와 일치하는 파일이 없습니다.' : '새 이미지를 업로드해 보관함을 채워보세요.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Expanded Grid to use width fully, without max-height limit so page stretches naturally */
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredBlobs.map((blob) => {
                                    const fileName = blob.pathname.split('/').pop() || blob.pathname;
                                    const isCurrentlyUsed = usedUrls.includes(blob.url);
                                    
                                    return (
                                        <div 
                                            key={blob.url}
                                            className="group relative border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                                        >
                                            {/* Image Preview Container */}
                                            <div className="relative aspect-[16/10] bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center">
                                                <img 
                                                    src={blob.url} 
                                                    alt={fileName}
                                                    className="object-contain w-full h-full max-h-[140px] p-2 transition-transform duration-300 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <a 
                                                        href={blob.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-white rounded-full text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm transition-colors"
                                                        title="새창으로 보기"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </div>

                                                {/* Usage Badge (Absolute placement on card) */}
                                                <div className="absolute top-2 left-2 z-10">
                                                    {isCurrentlyUsed ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-white shadow-sm border border-green-600">
                                                            사용 중
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm border border-amber-600">
                                                            미사용
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-700 truncate" title={fileName}>
                                                        {fileName}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                                        <span>{formatSize(blob.size)}</span>
                                                        <span>•</span>
                                                        <span>{new Date(blob.uploadedAt).toLocaleDateString('ko-KR')}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 w-full">
                                                    <Button 
                                                        type="button"
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleCopy(blob.url)}
                                                        className="flex-1 text-xs gap-1.5 h-8 bg-white border-slate-200 hover:bg-indigo-50/30 hover:border-indigo-200 hover:text-indigo-600 transition-colors font-semibold"
                                                    >
                                                        {copiedUrl === blob.url ? (
                                                            <>
                                                                <Check className="h-3.5 w-3.5 text-green-600 animate-in zoom-in-50 duration-200" />
                                                                복사 완료
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500" />
                                                                주소 복사
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button 
                                                        type="button"
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleDelete(blob.url, blob.pathname)}
                                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 shrink-0 rounded-lg transition-colors"
                                                        title="파일 삭제"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
