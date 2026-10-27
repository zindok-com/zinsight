'use client';

import React from 'react';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';

export interface MagazineSectionNavProps {
    activeSectionId: string;
    hasTitle: boolean;
    hasLead: boolean;
    hasClosing: boolean;
    canPublish: boolean;
    formData: {
        title: string;
        slug: string;
        lead: string;
        bodies: Array<{ title: string; content: string }>;
        closing: string;
    };
    scrollToSection: (e: React.MouseEvent, id: string, bodyIndex?: number) => void;
}

export function MagazineSectionNav({
    activeSectionId,
    hasTitle,
    hasLead,
    hasClosing,
    canPublish,
    formData,
    scrollToSection,
}: MagazineSectionNavProps) {
    return (
        <aside className="hidden lg:block min-w-0 min-h-0 h-full overflow-y-auto overflow-x-hidden">
            <nav className="flex flex-col gap-1 w-full py-3 text-[11px] bg-white border border-slate-200 rounded-xl shadow-sm px-2 overflow-x-hidden">
                <p className="font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2 pt-1">섹션 이동</p>

                {/* 기본 정보 */}
                <a
                    href="#section-meta"
                    onClick={(e) => scrollToSection(e, 'section-meta')}
                    className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                        activeSectionId === 'section-meta'
                            ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                    }`}
                >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                        <span className="flex items-center gap-1.5 truncate">📋 기본 정보</span>
                        {hasTitle ? (
                            <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                        ) : (
                            <span className="text-slate-300 shrink-0 font-normal">○</span>
                        )}
                    </div>
                    <div className={`text-[10px] mt-0.5 pl-0.5 truncate ${activeSectionId === 'section-meta' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                        {hasTitle
                            ? `제목 ${formData.title.length}자`
                            : <span className="text-amber-500">제목 미입력</span>}
                    </div>
                </a>

                {/* 카테고리 안내 */}
                <a
                    href="#section-guide"
                    onClick={(e) => scrollToSection(e, 'section-guide')}
                    className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 truncate ${
                        activeSectionId === 'section-guide'
                            ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                    }`}
                >
                    📖 카테고리 안내
                </a>

                {/* 조직·슬러그 */}
                <a
                    href="#section-org-slug"
                    onClick={(e) => scrollToSection(e, 'section-org-slug')}
                    className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                        activeSectionId === 'section-org-slug'
                            ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                    }`}
                >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                        <span className="truncate">🔗 조직·슬러그</span>
                        {formData.slug ? (
                            <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                        ) : (
                            <span className="text-slate-300 shrink-0 font-normal">○</span>
                        )}
                    </div>
                    {formData.slug && (
                        <div className={`text-[10px] mt-0.5 pl-0.5 font-mono truncate ${activeSectionId === 'section-org-slug' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                            /{formData.slug}
                        </div>
                    )}
                </a>

                <div className="w-full h-px bg-slate-100 my-1 mx-1" />

                {/* 리드 */}
                <a
                    href="#section-lead"
                    onClick={(e) => scrollToSection(e, 'section-lead')}
                    className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                        activeSectionId === 'section-lead'
                            ? 'bg-indigo-50 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                    }`}
                >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                        <span className="truncate">① 리드</span>
                        {hasLead ? (
                            <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                        ) : (
                            <span className="text-amber-500 shrink-0 font-semibold text-[10px]">필수</span>
                        )}
                    </div>
                    <div className={`text-[10px] mt-0.5 truncate ${activeSectionId === 'section-lead' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                        {hasLead ? `${formData.lead.length}자` : <span className="text-amber-500">미입력</span>}
                    </div>
                </a>

                {formData.bodies.map((_, i) => {
                    const bodyFilled = formData.bodies[i]?.title.trim() !== '' || formData.bodies[i]?.content.trim() !== '';
                    const isSectionActive = activeSectionId === `section-body-${i}`;
                    return (
                        <a
                            key={i}
                            href={`#section-body-${i}`}
                            onClick={(e) => scrollToSection(e, `section-body-${i}`, i)}
                            className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                                isSectionActive
                                    ? 'bg-indigo-50/80 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1 min-w-0">
                                <span className="truncate">
                                    ② 섹션 {i + 1}
                                    {formData.bodies[i]?.title ? ` — ${formData.bodies[i].title.slice(0, 8)}${formData.bodies[i].title.length > 8 ? '…' : ''}` : ''}
                                </span>
                                {bodyFilled ? (
                                    <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                                ) : (
                                    <span className="text-slate-300 shrink-0 font-normal">○</span>
                                )}
                            </div>
                            <div className={`text-[10px] mt-0.5 truncate ${isSectionActive ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                {bodyFilled ? `${formData.bodies[i].content.length}자` : '미입력'}
                            </div>
                        </a>
                    );
                })}

                {/* 클로징 */}
                <a
                    href="#section-closing"
                    onClick={(e) => scrollToSection(e, 'section-closing')}
                    className={`group px-2.5 py-2 rounded-lg transition-all border-l-2 ${
                        activeSectionId === 'section-closing'
                            ? 'bg-indigo-50 text-indigo-900 font-bold border-indigo-600 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                    }`}
                >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                        <span className="truncate">③ 클로징</span>
                        {hasClosing ? (
                            <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                        ) : (
                            <span className="text-amber-500 shrink-0 font-semibold text-[10px]">필수</span>
                        )}
                    </div>
                    <div className={`text-[10px] mt-0.5 truncate ${activeSectionId === 'section-closing' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                        {hasClosing ? `${formData.closing.length}자` : <span className="text-amber-500">미입력</span>}
                    </div>
                </a>

                {/* 전체 완료 상태 요약 */}
                <div className="mt-2 mx-1 px-2 py-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${canPublish ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <span className={`text-[10px] font-semibold truncate ${canPublish ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {canPublish ? '발행 준비 완료' : '필수 항목 미완성'}
                        </span>
                    </div>
                </div>
            </nav>
        </aside>
    );
}

export function MagazineRoutingGuide({
    guideOpen,
    setGuideOpen,
}: {
    guideOpen: boolean;
    setGuideOpen: (open: boolean) => void;
}) {
    return (
        <div id="section-guide" className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/10 border border-slate-200 rounded-xl space-y-4 text-xs text-slate-600 shadow-xs scroll-mt-24">
            <button
                type="button"
                onClick={() => setGuideOpen(!guideOpen)}
                className="w-full flex items-center justify-between font-semibold text-slate-800 text-sm hover:text-indigo-600 transition-colors focus:outline-none"
            >
                <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-600" />
                    매거진 카테고리 & URL 라우팅 가이드
                </span>
                {guideOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
            </button>
            {guideOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200/60">
                    {/* 테크 & 마케팅 지면 그룹 */}
                    <div className="p-4 bg-white border border-slate-100 rounded-lg space-y-3 shadow-2xs">
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                            Core 테크 지면 (URL: <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[11px]">/magazine/tech-marketing/*</code>)
                        </h4>
                        <div className="space-y-3 pl-3 border-l border-slate-100">
                            <div className="space-y-1">
                                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px]">뉴스레터 (NEWSLETTER)</span>
                                <p className="text-slate-500">주 단위 기술 트렌드 및 요약 분석 지면</p>
                            </div>
                            <div className="space-y-1">
                                <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[10px]">디지털 마케팅 (INTELLIGENCE_REPORT)</span>
                                <p className="text-slate-500">SEO, GEO를 활용한 디지털 마케팅 분석 리포트</p>
                            </div>
                        </div>
                    </div>

                    {/* 로컬 비즈니스 지면 그룹 */}
                    <div className="p-4 bg-white border border-slate-100 rounded-lg space-y-3 shadow-2xs">
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            로컬 비즈니스 지면 (URL: <code className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded text-[11px]">/magazine/local/[지자체]/*</code>)
                        </h4>
                        <div className="space-y-3 pl-3 border-l border-slate-100">
                            <div className="space-y-1">
                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">기업 스포트라이트 (VALLEY_NOW)</span>
                                <p className="text-slate-500">관내 스타트업, 소상공인, 전통기업 심층 인터뷰 및 성장 성공사례 (기존 &apos;밸리 나우&apos; + &apos;SME 그로스&apos; 통합)</p>
                            </div>
                            <div className="space-y-1">
                                <span className="font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded text-[10px]">지원사업 · 정책 브리핑 (LOCAL_SME)</span>
                                <p className="text-slate-500">관내 및 도 산하 진흥원의 지원사업, 정책자금, 공모전 공고 요약 브리핑 (민간 정보 피드)</p>
                            </div>
                            <div className="space-y-1">
                                <span className="font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded text-[10px]">산학협력 · 교육 (EDU_COLLAB)</span>
                                <p className="text-slate-500">관내 대학 및 산학협력단의 협력 사업, 인재양성 프로그램 소식. isPaid 시 &apos;협력 기관&apos; 배지 표시.</p>
                            </div>
                            <p className="text-[10px] text-emerald-600 font-semibold mt-1">※ 로컬 기사는 반드시 &apos;연계 지역&apos;을 지정해야 합니다.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
