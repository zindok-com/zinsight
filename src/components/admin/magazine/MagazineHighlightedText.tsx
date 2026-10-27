'use client';

import React from 'react';
import { extractYouTubeId, isDirectVideoUrl } from '@/lib/video';

export function renderHighlightedParts(text: string) {
    const parts = text.split(/(\*\*\{.*?\}\*\*|\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
        if (part.startsWith('**{') && part.endsWith('}**')) {
            const content = part.slice(3, -3);
            return (
                <span key={i} className="font-bold text-zi-blue underline decoration-zi-blue/30 underline-offset-4">
                    {content}
                </span>
            );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.slice(2, -2);
            return (
                <span key={i} className="font-bold text-zi-blue">
                    {content}
                </span>
            );
        }
        if (part.startsWith('[') && part.endsWith(')')) {
            const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (match) {
                const linkText = match[1];
                const url = match[2];
                return (
                    <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-zi-blue underline underline-offset-4 decoration-zi-blue/30 hover:text-zi-blue/80 transition-colors"
                    >
                        {linkText}
                    </a>
                );
            }
        }
        return part;
    });
}

export type HighlightBlock =
    | { type: 'image'; url: string; alt?: string; caption?: string }
    | { type: 'video'; url: string; youtubeId?: string | null; caption?: string }
    | { type: 'divider' }
    | { type: 'spacer'; size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }
    | { type: 'bullet'; text: string }
    | { type: 'paragraph'; text: string };

// Inline custom parser for **text** -> zi-blue, **{text}** -> zi-blue + underline, and bullet points
export function HighlightedText({ text }: { text: string }) {
    if (!text) return null;

    const lines = text.split('\n');
    const blocks: HighlightBlock[] = [];
    let emptyLineCount = 0;

    const flushSpacers = () => {
        if (emptyLineCount === 1) {
            blocks.push({ type: 'spacer', size: 'sm' });
        } else if (emptyLineCount === 2) {
            blocks.push({ type: 'spacer', size: 'md' });
        } else if (emptyLineCount >= 3) {
            blocks.push({ type: 'spacer', size: 'lg' });
        }
        emptyLineCount = 0;
    };

    for (const rawLine of lines) {
        const trimmed = rawLine.trim();

        if (!trimmed) {
            emptyLineCount++;
            continue;
        }

        flushSpacers();

        // 1. 구분선 매칭 (---, ***, ___)
        if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            blocks.push({ type: 'divider' });
            continue;
        }

        // 2. 명시적 여백 태그 매칭 ([여백], [여백:좁게], [여백:sm], [space:xs] 등)
        if (/^\[(여백|space|spacer)(:?(xs|sm|md|lg|xl|좁게|미세|보통|중간|넓게)?)\]$/i.test(trimmed)) {
            const match = trimmed.match(/^\[(여백|space|spacer)(:?(xs|sm|md|lg|xl|좁게|미세|보통|중간|넓게)?)\]$/i);
            const sizeRaw = match?.[2]?.replace(':', '').toLowerCase() || 'xs';
            let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'xs';
            if (sizeRaw === 'xs' || sizeRaw === '좁게' || sizeRaw === '미세') size = 'xs';
            else if (sizeRaw === 'sm') size = 'sm';
            else if (sizeRaw === 'md' || sizeRaw === '보통' || sizeRaw === '중간') size = 'md';
            else if (sizeRaw === 'lg' || sizeRaw === '넓게') size = 'lg';
            else if (sizeRaw === 'xl') size = 'xl';
            blocks.push({ type: 'spacer', size });
            continue;
        }

        // 3. Markdown 미디어 (![alt](url "caption") - 이미지 및 동영상 통합)
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)(?:\s+(?:"(.*?)"|'(.*?)'|\((.*?)\)))?\)$/);
        if (imgMatch) {
            const alt = imgMatch[1].trim();
            const mediaUrl = imgMatch[2].trim();
            const caption = imgMatch[3] || imgMatch[4] || imgMatch[5];
            const ytId = extractYouTubeId(mediaUrl);
            if (alt.toLowerCase() === 'video' || alt.toLowerCase() === 'youtube' || ytId || isDirectVideoUrl(mediaUrl)) {
                blocks.push({ type: 'video', url: mediaUrl, youtubeId: ytId, caption });
            } else {
                blocks.push({ type: 'image', alt, url: mediaUrl, caption });
            }
            continue;
        }

        // 4. Raw 동영상 URL 또는 유튜브 링크 단독 라인
        if (/^https?:\/\/\S+$/i.test(trimmed)) {
            const ytId = extractYouTubeId(trimmed);
            if (ytId || isDirectVideoUrl(trimmed)) {
                blocks.push({ type: 'video', url: trimmed, youtubeId: ytId });
                continue;
            }
        }

        // 4-2. Raw 이미지 URL
        const rawUrlMatch = trimmed.match(/^https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S+)?$/i);
        if (rawUrlMatch) {
            blocks.push({ type: 'image', url: rawUrlMatch[0], alt: 'Image' });
            continue;
        }

        // 5. 글머리 기호 (•, ▪ 또는 단독 -, * 뒤에 공백)
        const bulletMatch = trimmed.match(/^(?:([•▪])\s*|([\-\*])(?!\2)\s+)(.*)$/);
        if (bulletMatch) {
            blocks.push({ type: 'bullet', text: bulletMatch[3].trim() });
            continue;
        }

        // 6. 일반 단락
        blocks.push({ type: 'paragraph', text: rawLine });
    }

    return (
        <>
            {blocks.map((block, idx) => {
                if (block.type === 'video') {
                    return (
                        <figure key={idx} className="block my-8 text-center m-0">
                            {block.youtubeId ? (
                                <div className="aspect-video w-full max-w-2xl mx-auto rounded-zi-card overflow-hidden bg-black shadow-sm border border-zi-surface-container">
                                    <iframe
                                        src={`https://www.youtube-nocookie.com/embed/${block.youtubeId}`}
                                        title={block.caption || 'YouTube video player'}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <video
                                    src={block.url}
                                    controls
                                    playsInline
                                    preload="metadata"
                                    className="mx-auto w-full max-w-2xl max-h-[420px] rounded-zi-card bg-black shadow-sm border border-zi-surface-container"
                                />
                            )}
                            {block.caption && (
                                <figcaption className="block text-sm text-slate-600 mt-3 font-medium">{block.caption}</figcaption>
                            )}
                        </figure>
                    );
                }

                if (block.type === 'image') {
                    return (
                        <figure key={idx} className="block my-8 text-center m-0">
                            <img
                                src={block.url}
                                alt={block.alt || ''}
                                className="mx-auto rounded-zi-card max-h-[300px] object-contain shadow-sm border border-zi-surface-container"
                            />
                            {block.caption && (
                                <figcaption className="block text-sm text-slate-600 mt-3 font-medium">{block.caption}</figcaption>
                            )}
                        </figure>
                    );
                }

                if (block.type === 'divider') {
                    return (
                        <span key={idx} className="block py-4">
                            <hr className="border-slate-200" />
                        </span>
                    );
                }

                if (block.type === 'spacer') {
                    const hClass =
                        block.size === 'xs' ? 'h-[5px]' :
                        block.size === 'sm' ? 'h-2.5' :
                        block.size === 'md' ? 'h-[18px]' :
                        block.size === 'lg' ? 'h-7' : 'h-10';
                    return <span key={idx} className={`block ${hClass}`} aria-hidden="true" />;
                }

                if (block.type === 'bullet') {
                    return (
                        <span key={idx} className="flex items-start gap-2.5 mb-2.5 pl-1.5 last:mb-0">
                            <span className="font-bold shrink-0 select-none text-zi-blue leading-relaxed">•</span>
                            <span className="flex-1 leading-relaxed">
                                {renderHighlightedParts(block.text)}
                            </span>
                        </span>
                    );
                }

                return (
                    <span key={idx} className="block mb-2.5 last:mb-0 leading-[1.8]">
                        {renderHighlightedParts(block.text)}
                    </span>
                );
            })}
        </>
    );
}
