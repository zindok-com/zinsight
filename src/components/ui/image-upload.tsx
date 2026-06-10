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
    validateWidth?: boolean;
}

export function ImageUpload({ value, onChange, onRemove, validateWidth = true }: ImageUploadProps) {
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

        const checkImageDimension = (file: File): Promise<boolean> => {
            return new Promise((resolve) => {
                if (!validateWidth) {
                    resolve(true);
                    return;
                }
                const img = new window.Image();
                const objectUrl = URL.createObjectURL(file);
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    if (img.width < 1200) {
                        toast.error(`이미지 가로폭이 너무 작습니다 (현재: ${img.width}px). 구글 디스커버 최적화를 위해 최소 1200px 이상이어야 합니다.`);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    toast.error('이미지 파일을 읽을 수 없습니다.');
                    resolve(false);
                };
                img.src = objectUrl;
            });
        };

        const isValidDimension = await checkImageDimension(file);
        if (!isValidDimension) return;

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
                        {validateWidth ? '필수 사이즈: 가로 1200px 이상 (5MB 이하)' : '권장 사이즈: 1:1 비율 (5MB 이하)'}
                    </p>
                </div>
            </div>
        </div>
    );
}
