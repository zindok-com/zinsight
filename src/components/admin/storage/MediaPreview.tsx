'use client';

import { useState } from 'react';
import { FileText, Play } from 'lucide-react';
import { formatDuration, getFileExtension, getMediaKind } from '@/lib/storage-media';

interface MediaPreviewProps {
    url: string;
    pathname: string;
    className?: string;
}

/** 파일 종류별 미리보기: 이미지는 img, 영상은 첫 장면+길이, 문서는 확장자 아이콘 */
export function MediaPreview({ url, pathname, className = '' }: MediaPreviewProps) {
    const kind = getMediaKind(pathname);
    const [duration, setDuration] = useState('');
    const ext = getFileExtension(pathname).toUpperCase();

    if (kind === 'video') {
        return (
            <div className={`relative h-full w-full bg-slate-900 ${className}`}>
                {/* #t=0.1 로 첫 프레임을 포스터처럼 표시 (preload=metadata라 전체를 내려받지 않음) */}
                <video
                    src={`${url}#t=0.1`}
                    preload="metadata"
                    muted
                    playsInline
                    onLoadedMetadata={(e) => setDuration(formatDuration(e.currentTarget.duration))}
                    className="h-full w-full object-contain"
                />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow">
                        <Play className="ml-0.5 h-4 w-4" />
                    </span>
                </span>
                {duration && (
                    <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
                        {duration}
                    </span>
                )}
            </div>
        );
    }

    if (kind === 'document') {
        return (
            <div className={`flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-50 text-slate-500 ${className}`}>
                <FileText className="h-8 w-8" />
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{ext || 'FILE'}</span>
            </div>
        );
    }

    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt="" loading="lazy" className={`h-full w-full object-contain p-2 ${className}`} />
    );
}
