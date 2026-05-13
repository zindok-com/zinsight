'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { uploadThumbnail } from '@/actions/upload-actions';
import { toast } from 'sonner';
import Image from 'next/image';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove: () => void;
}

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error('이미지 파일만 업로드 가능합니다.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await uploadThumbnail(formData);
            onChange(result.url);
            toast.success('이미지가 업로드되었습니다.');
        } catch (error) {
            toast.error('업로드 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-slate-200">
                        <Image
                            src={value}
                            alt="Thumbnail"
                            fill
                            className="object-cover"
                        />
                        <button
                            onClick={onRemove}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                            type="button"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="w-40 h-40 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                        <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-xs">이미지 없음</span>
                    </div>
                )}

                <div className="flex-1">
                    <input
                        type="file"
                        id="thumbnail-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={isUploading}
                    />
                    <label htmlFor="thumbnail-upload">
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            asChild
                            disabled={isUploading}
                        >
                            <span>
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        업로드 중...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        이미지 업로드
                                    </>
                                )}
                            </span>
                        </Button>
                    </label>
                    <p className="text-[10px] text-slate-500 mt-2">
                        추천 사이즈: 1200x630 (5MB 이하)
                    </p>
                </div>
            </div>
        </div>
    );
}
