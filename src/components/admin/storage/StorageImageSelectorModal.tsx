'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { listAllBlobs, type StorageBlobItem } from '@/actions/upload-actions';
import type { UploadFolder } from '@/actions/upload';
import { Loader2, Search, Upload, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { MediaPreview } from '@/components/admin/storage/MediaPreview';
import { uploadToStorage } from '@/components/admin/storage/storage-upload';
import { formatBytes, getMediaKind, type MediaKind } from '@/lib/storage-media';

export type SelectableMedia = 'image' | 'video' | 'document';

const ACCEPT_CONFIG: Record<
    SelectableMedia,
    { title: string; noun: string; kinds: MediaKind[]; folder: UploadFolder; inputAccept: string }
> = {
    image: { title: '보관함에서 이미지 선택', noun: '이미지', kinds: ['image', 'logo'], folder: 'images', inputAccept: 'image/*' },
    video: {
        title: '보관함에서 영상 선택',
        noun: '영상',
        kinds: ['video'],
        folder: 'videos',
        inputAccept: 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v',
    },
    document: { title: '보관함에서 첨부파일 선택', noun: '첨부파일', kinds: ['document'], folder: 'attachments', inputAccept: '.pdf,application/pdf' },
};

interface StorageImageSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    /** 고를 수 있는 파일 종류 (기본: 이미지) */
    accept?: SelectableMedia;
}

export function StorageImageSelectorModal({ isOpen, onClose, onSelect, accept = 'image' }: StorageImageSelectorModalProps) {
    const config = ACCEPT_CONFIG[accept];
    const [blobs, setBlobs] = useState<StorageBlobItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadPercent, setUploadPercent] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const fetchBlobs = async () => {
        setLoading(true);
        const res = await listAllBlobs();
        if (res.success && res.blobs) {
            const sorted = res.blobs
                .filter((b) => config.kinds.includes(getMediaKind(b.pathname)))
                .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            setBlobs(sorted);
        } else {
            toast.error('보관함 파일을 불러오는데 실패했습니다.');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchBlobs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, accept]);

    // 새로 올린 첫 파일을 바로 선택해 닫는다
    const handleFilesUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        const files = Array.from(fileList).filter((f) => config.kinds.includes(getMediaKind(`${config.folder}/${f.name}`)));
        if (files.length === 0) {
            toast.error(`업로드할 수 있는 ${config.noun} 파일이 없습니다.`);
            return;
        }

        setUploadPercent(0);
        let firstUploadedUrl = '';
        try {
            for (const file of files) {
                const url = await uploadToStorage(file, config.folder, setUploadPercent);
                if (!firstUploadedUrl) firstUploadedUrl = url;
            }
            toast.success(`${files.length}개 파일을 업로드했습니다.`);
            onSelect(firstUploadedUrl);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.');
            await fetchBlobs();
        } finally {
            setUploadPercent(null);
        }
    };

    const q = searchQuery.toLowerCase();
    const filteredBlobs = blobs.filter((b) => b.pathname.toLowerCase().includes(q));
    const uploading = uploadPercent !== null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (!uploading) handleFilesUpload(e.dataTransfer.files);
                }}
                className={`max-w-3xl max-h-[85vh] flex flex-col p-6 overflow-hidden transition-all ${isDragging ? 'ring-4 ring-indigo-500 bg-indigo-50/20' : ''}`}
            >
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-xl font-bold text-slate-800">{config.title}</DialogTitle>
                    <DialogDescription className="text-xs text-slate-400">
                        보관함에 저장된 {config.noun} 중 하나를 고르거나, 새 파일을 올려 바로 넣을 수 있습니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between py-3 border-y border-slate-100">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            aria-label="파일명 검색"
                            placeholder="파일명 검색..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 w-full text-sm border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                    </div>

                    <label className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold cursor-pointer shrink-0 transition-colors shadow-sm">
                        {uploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                업로드 중... {uploadPercent}%
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                새 {config.noun} 업로드
                            </>
                        )}
                        <input
                            type="file"
                            multiple={accept === 'image'}
                            className="hidden"
                            accept={config.inputAccept}
                            onChange={(e) => {
                                handleFilesUpload(e.target.files);
                                e.target.value = '';
                            }}
                            disabled={uploading}
                        />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[300px] py-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                            <p className="text-sm font-medium">보관함을 불러오는 중...</p>
                        </div>
                    ) : filteredBlobs.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                            <FolderOpen className="h-10 w-10 text-slate-200" />
                            <p className="text-sm font-semibold text-slate-600">등록된 {config.noun}이(가) 없습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filteredBlobs.map((blob) => {
                                const fileName = blob.pathname.split('/').pop() || blob.pathname;
                                return (
                                    <button
                                        key={blob.url}
                                        type="button"
                                        onClick={() => {
                                            onSelect(blob.url);
                                            onClose();
                                        }}
                                        className="group relative flex flex-col border border-slate-100 hover:border-indigo-500 hover:shadow-md rounded-xl overflow-hidden bg-white text-left transition-all p-1"
                                        title={fileName}
                                    >
                                        <div className="aspect-[4/3] bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center w-full relative">
                                            <MediaPreview url={blob.url} pathname={blob.pathname} />
                                            <div className="absolute inset-0 bg-indigo-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="bg-white text-indigo-600 text-xs font-bold px-2 py-1 rounded shadow-sm">
                                                    선택하기
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-2 space-y-0.5">
                                            <p className="text-xs font-bold text-slate-700 truncate w-full">
                                                {fileName}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {formatBytes(blob.size)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
