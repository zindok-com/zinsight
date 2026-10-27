'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    X,
    Video,
    Youtube,
    Upload,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Film,
} from 'lucide-react';
import { getMediaUploadUrl } from '@/actions/upload';

export function extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /[?&]v=([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

export function isDirectVideoUrl(url: string): boolean {
    if (!url) return false;
    return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url.trim());
}

interface VideoInsertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (markdown: string) => void;
}

const ALLOWED_VIDEO_EXTS = ['mp4', 'webm', 'mov', 'm4v', 'ogg'];

export function VideoInsertModal({ isOpen, onClose, onInsert }: VideoInsertModalProps) {
    const [tab, setTab] = useState<'youtube' | 'upload'>('youtube');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [caption, setCaption] = useState('');

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTab('youtube');
            setYoutubeUrl('');
            setUploadedVideoUrl('');
            setUploadedFileName('');
            setCaption('');
            setUploading(false);
            setUploadProgress(0);
            setErrorMsg(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const youtubeId = extractYouTubeId(youtubeUrl);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setErrorMsg(null);

        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_VIDEO_EXTS.includes(ext)) {
            setErrorMsg('지원하지 않는 동영상 형식입니다. MP4, WebM, MOV 파일을 선택해 주세요.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (file.size > 300 * 1024 * 1024) {
            setErrorMsg('동영상 파일 크기는 300MB 이하여야 합니다.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const contentType =
                file.type ||
                (ext === 'webm'
                    ? 'video/webm'
                    : ext === 'mov'
                    ? 'video/quicktime'
                    : ext === 'ogg'
                    ? 'video/ogg'
                    : 'video/mp4');

            const { uploadUrl, fileUrl } = await getMediaUploadUrl(file.name, contentType, 'videos');

            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl, true);
                xhr.setRequestHeader('Content-Type', contentType);
                xhr.setRequestHeader('x-amz-acl', 'public-read');

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const pct = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(pct);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`NCP 스토리지 업로드 실패 (HTTP ${xhr.status})`));
                    }
                };

                xhr.onerror = () => reject(new Error('네트워크 오류로 동영상 업로드에 실패했습니다.'));
                xhr.send(file);
            });

            setUploadedVideoUrl(fileUrl);
            setUploadedFileName(file.name);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : '동영상 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        const targetUrl = tab === 'youtube' ? youtubeUrl.trim() : uploadedVideoUrl.trim();
        if (!targetUrl) return;

        if (tab === 'youtube' && !youtubeId) {
            setErrorMsg('유효한 유튜브(YouTube) 영상 링크를 입력해 주세요.');
            return;
        }

        const cleanCaption = caption.trim();
        let captionMarkup = '';
        if (cleanCaption) {
            if (cleanCaption.includes('"')) {
                captionMarkup = ` '${cleanCaption.replace(/'/g, '')}'`;
            } else {
                captionMarkup = ` "${cleanCaption}"`;
            }
        }

        const markdown = `\n![video](${targetUrl}${captionMarkup})\n`;
        onInsert(markdown);
        onClose();
    };

    const canSubmit =
        (tab === 'youtube' && Boolean(youtubeId)) ||
        (tab === 'upload' && Boolean(uploadedVideoUrl) && !uploading);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => !uploading && onClose()}
            />

            <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-100 p-6 flex flex-col gap-5 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <Video className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-base">본문 동영상 삽입</h3>
                            <p className="text-xs text-slate-400">
                                유튜브(YouTube) 링크 또는 직접 업로드한 동영상 플레이어를 삽입합니다.
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={uploading}
                        onClick={onClose}
                        className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-50"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* 방식 선택 탭 */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                        type="button"
                        onClick={() => {
                            setTab('youtube');
                            setErrorMsg(null);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            tab === 'youtube'
                                ? 'bg-white text-rose-600 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Youtube className="w-4 h-4" />
                        유튜브 링크 삽입
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setTab('upload');
                            setErrorMsg(null);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            tab === 'upload'
                                ? 'bg-white text-indigo-600 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Film className="w-4 h-4" />
                        동영상 파일 직접 업로드
                    </button>
                </div>

                <form onSubmit={handleConfirm} className="space-y-4">
                    {tab === 'youtube' ? (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="youtube-url-input" className="text-xs font-bold text-slate-700">
                                    유튜브(YouTube) 동영상 URL <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="youtube-url-input"
                                    placeholder="예: https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                                    value={youtubeUrl}
                                    onChange={(e) => {
                                        setYoutubeUrl(e.target.value);
                                        setErrorMsg(null);
                                    }}
                                    autoFocus
                                    className="bg-slate-50 border-slate-200 text-sm h-10"
                                />
                                <p className="text-[11px] text-slate-400">
                                    일반 영상 링크, 공유 단축 링크(youtu.be), 쇼츠(Shorts) 링크를 모두 지원합니다.
                                </p>
                            </div>

                            {youtubeId && (
                                <div className="space-y-1.5">
                                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        유튜브 플레이어 미리보기
                                    </span>
                                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-200 shadow-xs">
                                        <iframe
                                            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                                            title="YouTube video preview"
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">
                                    동영상 파일 업로드 (NCP 스토리지 직송) <span className="text-red-500">*</span>
                                </Label>
                                {!uploadedVideoUrl ? (
                                    <div
                                        onClick={() => !uploading && fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                                            uploading
                                                ? 'border-indigo-300 bg-indigo-50/30 cursor-wait'
                                                : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer'
                                        }`}
                                    >
                                        {uploading ? (
                                            <div className="space-y-2.5">
                                                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                                                <div className="text-xs font-bold text-indigo-700">
                                                    NCP Object Storage로 동영상 업로드 중... ({uploadProgress}%)
                                                </div>
                                                <div className="w-full max-w-xs mx-auto h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-600 transition-all duration-200"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <Upload className="w-7 h-7 text-indigo-500 mx-auto" />
                                                <p className="text-xs font-bold text-slate-700">
                                                    클릭하여 동영상 파일 선택 (MP4, WebM, MOV)
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    최대 300MB · 브라우저에서 NCP 버킷(videos/)으로 직접 전송됩니다.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                            <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 truncate">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span className="truncate">{uploadedFileName || '동영상 업로드 완료'}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-xs font-semibold text-indigo-600 hover:underline shrink-0 ml-2"
                                            >
                                                다른 파일 선택
                                            </button>
                                        </div>
                                        <video
                                            src={uploadedVideoUrl}
                                            controls
                                            playsInline
                                            preload="metadata"
                                            className="w-full max-h-[240px] rounded-xl bg-black border border-slate-200"
                                        />
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime,video/ogg,.mp4,.webm,.mov,.m4v"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    )}

                    {/* 공통: 캡션 입력 */}
                    <div className="space-y-1.5 pt-1">
                        <Label htmlFor="video-caption-input" className="text-xs font-bold text-slate-600">
                            영상 하단 캡션 설명 (선택)
                        </Label>
                        <Input
                            id="video-caption-input"
                            placeholder="예: 현장 인터뷰 하이라이트 영상 (출처: 진사이트 편집부)"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="bg-slate-50 border-slate-200 text-sm h-9"
                        />
                    </div>

                    {errorMsg && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* 하단 버튼 */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={uploading}
                            onClick={onClose}
                            className="h-9 px-4 text-xs font-semibold bg-white text-slate-700 border-slate-200"
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={!canSubmit}
                            className="h-9 px-5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        >
                            본문에 동영상 삽입
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
