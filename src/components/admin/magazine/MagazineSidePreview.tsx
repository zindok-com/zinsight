'use client';

import React from 'react';
import { Eye, Image as ImageIcon } from 'lucide-react';

export interface MagazineSidePreviewProps {
    preview: {
        title: string;
        summary: string;
        thumbnailUrl: string;
        slug: string;
        authorName: string;
        categoryLabel: string;
    };
}

export function MagazineSidePreview({ preview }: MagazineSidePreviewProps) {
    return (
        <aside className="hidden xl:block min-w-0 min-h-0 h-full overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col gap-4 w-full pr-0.5 pb-2">
                {/* 패널 헤더 */}
                <div className="flex items-center gap-2 px-1">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">실시간 미리보기</span>
                </div>

                {/* ① 구글 검색 스니펫 */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">구글 검색 스니펫</p>
                    {/* Favicon + URL 행 */}
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-slate-200 shrink-0 flex items-center justify-center">
                            <span className="text-[7px] font-bold text-slate-500">Z</span>
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[11px] text-slate-700 font-medium">진사이트</span>
                            <span className="text-[10px] text-[#006621] truncate max-w-[220px]">
                                https://www.zinsight.co.kr › magazine{preview.slug ? ` › ${preview.slug}` : ''}
                            </span>
                        </div>
                    </div>
                    {/* 제목 */}
                    <p className="text-[16px] text-[#1a0dab] leading-snug font-normal hover:underline cursor-pointer line-clamp-2">
                        {preview.title
                            ? (preview.title.length > 60 ? preview.title.slice(0, 60) + '...' : preview.title)
                            : <span className="text-slate-300 italic text-sm">제목 미입력</span>
                        }
                        {preview.title.length > 0 && (
                            <span className="text-[11px] ml-1 text-slate-400 font-normal not-italic">| 진사이트</span>
                        )}
                    </p>
                    {/* 설명 */}
                    <p className="text-[13px] text-[#4d5156] leading-snug line-clamp-3">
                        {preview.summary
                            ? (preview.summary.length > 155 ? preview.summary.slice(0, 155) + '...' : preview.summary)
                            : <span className="text-slate-300 italic">요약(Meta Description) 미입력 — 리드 첫 문장에서 자동 생성됩니다</span>
                        }
                    </p>
                    {/* 글자 수 게이지 */}
                    {preview.title && (
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>제목</span>
                                <span className={preview.title.length > 60 ? 'text-red-500 font-bold' : preview.title.length > 50 ? 'text-amber-500' : 'text-emerald-600'}>
                                    {preview.title.length} / 60자
                                </span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${preview.title.length > 60 ? 'bg-red-400' : preview.title.length > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                    style={{ width: `${Math.min((preview.title.length / 60) * 100, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>설명</span>
                                <span className={(preview.summary?.length || 0) > 155 ? 'text-red-500 font-bold' : (preview.summary?.length || 0) > 130 ? 'text-emerald-600' : 'text-slate-400'}>
                                    {preview.summary?.length || 0} / 155자
                                </span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${(preview.summary?.length || 0) > 155 ? 'bg-red-400' : (preview.summary?.length || 0) > 130 ? 'bg-emerald-400' : 'bg-slate-300'}`}
                                    style={{ width: `${Math.min(((preview.summary?.length || 0) / 155) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ② OG 카드 (SNS 공유) */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SNS 공유 미리보기 (OG 카드)</p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        {/* 썸네일 */}
                        {preview.thumbnailUrl ? (
                            <div className="w-full aspect-[1.91/1] bg-slate-100 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={preview.thumbnailUrl}
                                    alt="OG 이미지"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-full aspect-[1.91/1] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                <div className="text-center">
                                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                                    <p className="text-[10px] text-slate-400">썸네일 미설정</p>
                                </div>
                            </div>
                        )}
                        {/* 텍스트 */}
                        <div className="p-3 bg-slate-50 border-t border-slate-200">
                            <p className="text-[10px] text-slate-400 uppercase font-medium mb-1">www.zinsight.co.kr</p>
                            <p className="text-[13px] font-semibold text-slate-900 line-clamp-2 leading-snug">
                                {preview.title || <span className="text-slate-300 italic font-normal">제목 미입력</span>}
                            </p>
                            {preview.summary && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                                    {preview.summary}
                                </p>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">카카오톡·트위터·슬랙 공유 시 이렇게 보입니다</p>
                </div>

                {/* ③ 매거진 카드 미리보기 */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">매거진 카드 미리보기</p>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        {/* 썸네일 */}
                        {preview.thumbnailUrl ? (
                            <div className="w-full aspect-[16/9] bg-slate-100 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={preview.thumbnailUrl}
                                    alt="카드 이미지"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-full aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-slate-300" />
                            </div>
                        )}
                        {/* 카드 텍스트 */}
                        <div className="p-3 space-y-2">
                            <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {preview.categoryLabel || 'Newsletter'}
                                </span>
                            </div>
                            <p className="text-[13px] font-semibold text-slate-900 line-clamp-2 leading-snug">
                                {preview.title || <span className="text-slate-300 italic font-normal">제목 미입력</span>}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span>By {preview.authorName}</span>
                                <span>·</span>
                                <span>{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">매거진 목록 페이지에서 이렇게 보입니다</p>
                </div>
            </div>
        </aside>
    );
}
