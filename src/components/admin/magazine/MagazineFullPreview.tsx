'use client';

import React from 'react';
import { HighlightedText } from '@/components/admin/magazine/MagazineHighlightedText';

export interface MagazineFullPreviewProps {
    scrollAreaRef: React.RefObject<HTMLDivElement | null>;
    categoryLabel: string;
    formData: {
        title: string;
        authorName: string;
        thumbnailUrl: string;
        lead: string;
        bodies: Array<{ title: string; content: string }>;
        closing: string;
    };
}

export function MagazineFullPreview({
    scrollAreaRef,
    categoryLabel,
    formData,
}: MagazineFullPreviewProps) {
    return (
        <div ref={scrollAreaRef} className="lg:flex-1 lg:min-h-0 lg:h-full lg:overflow-y-auto lg:pb-4">
            <div className="bg-zi-surface text-zi-on-surface p-6 md:p-10 rounded-xl border border-slate-200 shadow-inner max-w-3xl mx-auto space-y-12 min-h-[500px]">
                {/* Meta Tags & Category */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="font-ui-label text-[11px] uppercase tracking-widest bg-zi-surface-container-highest px-3 py-1.5 rounded-full text-zi-blue font-bold">
                            {categoryLabel}
                        </span>
                    </div>

                    <h1 className="font-h1 text-[32px] md:text-[38px] leading-[1.2] text-zi-primary tracking-tight font-serif font-bold">
                        {formData.title || '제목이 여기에 표시됩니다'}
                    </h1>

                    <div className="flex items-center justify-between border-y border-zi-surface-container py-4 mt-8">
                        <div className="flex items-center gap-4 text-zi-outline text-[13px]">
                            <span className="text-zi-on-surface font-semibold">
                                By {formData.authorName}
                            </span>
                            <span>•</span>
                            <span>
                                {new Date().toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Thumbnail */}
                {formData.thumbnailUrl ? (
                    <div className="w-full aspect-[16/9] bg-zi-surface-container-low rounded-zi-card overflow-hidden relative shadow-sm">
                        <img
                            src={formData.thumbnailUrl}
                            alt={formData.title}
                            className="object-cover w-full h-full"
                        />
                    </div>
                ) : (
                    <div className="w-full aspect-[16/9] bg-slate-100 rounded-zi-card flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400 text-sm">
                        <span>썸네일 이미지가 설정되지 않았습니다</span>
                        <span className="text-xs text-slate-300 mt-1">이미지를 올리면 미리보기에 자동으로 렌더링됩니다</span>
                    </div>
                )}

                {/* Body Content */}
                <article className="max-w-none space-y-12">
                    {/* Lead */}
                    {formData.lead ? (
                        <div className="text-[17px] leading-[1.7] text-zi-on-surface border-l-4 border-zi-blue pl-6 py-2 bg-gradient-to-r from-zi-blue/5 to-transparent rounded-r-lg">
                            <HighlightedText text={formData.lead} />
                        </div>
                    ) : (
                        <div className="text-slate-400 italic text-sm">리드문구가 작성되지 않았습니다.</div>
                    )}

                    {/* Bodies */}
                    {formData.bodies && formData.bodies.map((body, idx) => {
                        if (!body.title && !body.content) return null;
                        return (
                            <section key={idx} className="flex flex-col gap-4">
                                {body.title && (
                                    <h2 className="font-h2 text-[22px] md:text-[24px] text-zi-primary border-b border-zi-surface-container-highest pb-3 flex items-center gap-2 font-semibold">
                                        <span className="text-zi-blue text-[20px] opacity-50 font-serif italic">{(idx + 1).toString().padStart(2, '0')}.</span>
                                        {body.title}
                                    </h2>
                                )}
                                {body.content ? (
                                    <div className="text-[15px] leading-relaxed text-zi-on-surface-variant">
                                        <HighlightedText text={body.content} />
                                    </div>
                                ) : (
                                    <div className="text-slate-300 italic text-xs">내용이 비어 있습니다.</div>
                                )}
                            </section>
                        );
                    })}

                    {/* Closing */}
                    {formData.closing ? (
                        <div className="mt-8 p-6 bg-zi-surface-container-low rounded-zi-card border border-zi-surface-container-highest text-[15px]">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-zi-blue" />
                                <span className="font-ui-label text-xs font-bold text-zi-secondary uppercase tracking-widest">
                                    Closing Thoughts
                                </span>
                            </div>
                            <div className="text-zi-on-surface-variant">
                                <HighlightedText text={formData.closing} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-400 italic text-sm">클로징 문구가 작성되지 않았습니다.</div>
                    )}
                </article>
            </div>
        </div>
    );
}
