'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { listAllBlobs, uploadImageDirect } from '@/actions/upload-actions';
import { Loader2, Search, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface StorageImageSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

export function StorageImageSelectorModal({ isOpen, onClose, onSelect }: StorageImageSelectorModalProps) {
    const [blobs, setBlobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBlobs = async () => {
        setLoading(true);
        const res = await listAllBlobs();
        if (res.success && res.blobs) {
            const sorted = [...res.blobs].sort(
                (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
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
    }, [isOpen]);

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
                toast.success('이미지가 업로드되었습니다.');
                // Refresh list and select
                await fetchBlobs();
                onSelect(res.url);
                onClose();
            } else {
                toast.error(res.error || '업로드 실패');
            }
        } catch (error) {
            console.error(error);
            toast.error('업로드 실패');
        } finally {
            setUploading(false);
        }
    };

    const filteredBlobs = blobs.filter(b => {
        const fileName = b.pathname.toLowerCase();
        return fileName.includes(searchQuery.toLowerCase());
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-xl font-bold text-slate-800">이미지 보관함에서 선택</DialogTitle>
                    <DialogDescription className="text-xs text-slate-400">
                        보관함에 저장된 이미지 중 하나를 선택하거나, 새로운 이미지를 즉시 업로드하여 삽입할 수 있습니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between py-3 border-y border-slate-100">
                    {/* Search bar */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="파일명 검색..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 w-full text-sm border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                    </div>

                    {/* Direct Upload button inside modal */}
                    <label className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold cursor-pointer shrink-0 transition-colors shadow-sm">
                        {uploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                업로드 중...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                새 이미지 업로드
                            </>
                        )}
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[300px] py-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                            <p className="text-sm font-medium">보관함 이미지를 불러오는 중...</p>
                        </div>
                    ) : filteredBlobs.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                            <ImageIcon className="h-10 w-10 text-slate-200" />
                            <p className="text-sm font-semibold text-slate-600">등록된 이미지가 없습니다.</p>
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
                                            <img
                                                src={blob.url}
                                                alt={fileName}
                                                className="object-contain w-full h-full p-1"
                                                loading="lazy"
                                            />
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
                                                {(blob.size / 1024).toFixed(1)} KB
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
