'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Newspaper, Building2, GraduationCap } from 'lucide-react';
import { ImpressionTracker } from '@/components/public/analytics/ImpressionTracker';

function HighlightedText({ text }: { text: string }) {
    if (!text) return null;
    const parts = text.split(/(\*\*\{.*?\}\*\*|\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**{') && part.endsWith('}**')) {
                    const content = part.slice(3, -3);
                    return <span key={i} className="font-bold text-zi-primary underline decoration-zi-primary/30 underline-offset-4">{content}</span>;
                }
                if (part.startsWith('**') && part.endsWith('**')) {
                    const content = part.slice(2, -2);
                    return <span key={i} className="font-bold text-zi-primary">{content}</span>;
                }
                return part;
            })}
        </>
    );
}

interface RegionHubClientProps {
    regionName: string;
    regionSlug: string;
    posts: any[];
    localHeadline: any | null;
}

export default function RegionHubClient({ regionName, regionSlug, posts, localHeadline }: RegionHubClientProps) {
    const [activeTab, setActiveTab] = useState<'spotlight' | 'briefing' | 'edu-collab'>('spotlight');

    // 카테고리별 필터링
    const filteredPosts = posts.filter(p => p.category?.slug === activeTab);

    const tabs = [
        { 
            id: 'spotlight' as const, 
            label: `${regionName} 기업 스포트라이트`, 
            desc: '관내 스타트업, 소상공인, 전통기업 심층 인터뷰 및 성장 성공사례', 
            icon: Newspaper 
        },
        { 
            id: 'briefing' as const, 
            label: '지원사업 · 정책 브리핑', 
            desc: `${regionName}${regionName.endsWith('시') ? '' : '시'} 및 경기도 산하 진흥원의 지원사업, 정책자금 공고 요약`, 
            icon: Building2 
        },
        {
            id: 'edu-collab' as const,
            label: '산학협력 · 교육',
            desc: '관내 대학 및 산학협력단의 협력 사업, 인재양성 프로그램 소식을 전하는 코너입니다.',
            icon: GraduationCap
        },
    ];

    return (
        <div className="space-y-16">
            {/* 로컬 대표 헤드라인 기사 노출 영역 */}
            {localHeadline && (
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 mb-4 items-center">
                    <div className="lg:col-span-6 flex flex-col justify-center order-2 lg:order-1">
                        <div className="mb-4">
                            <span className="font-ui-label text-[10px] uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-700 font-bold">
                                이달의 {regionName} 기업 스포트라이트
                            </span>
                        </div>
                        <ImpressionTracker postId={localHeadline.id}>
                            <Link href={`/magazine/local/${regionSlug}/${localHeadline.slug}`} className="group block cursor-pointer">
                                <h2 className="font-h1 text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-zi-on-surface mb-4 sm:mb-6 group-hover:text-zi-secondary transition-colors leading-tight">
                                    {localHeadline.title}
                                </h2>
                                <p className="font-body-md text-body-md sm:font-body-lg sm:text-body-lg text-zi-on-surface-variant mb-6 sm:mb-8">
                                    <HighlightedText 
                                        text={localHeadline.summary ?? (localHeadline.content ? localHeadline.content.slice(0, 180) + '...' : '')} 
                                    />
                                </p>
                            </Link>
                        </ImpressionTracker>
                        <div className="flex items-center gap-4 text-zi-outline font-ui-label text-ui-label border-t border-zi-divider pt-4">
                            <span className="text-zi-on-surface font-semibold">
                                By {localHeadline.author?.name || localHeadline.authorName || 'Zinsight 편집부'}
                            </span>
                            <span>•</span>
                            <span>{new Date(localHeadline.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                    <div className="lg:col-span-6 aspect-[16/10] w-full order-1 lg:order-2">
                        <Link href={`/magazine/local/${regionSlug}/${localHeadline.slug}`} className="w-full h-full bg-slate-50 border border-zi-divider/30 rounded-zi-card overflow-hidden shadow-sm relative block group">
                            {localHeadline.thumbnailUrl ? (
                                <Image 
                                    src={localHeadline.thumbnailUrl} 
                                    alt={localHeadline.title}
                                    fill
                                    className="object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-zi-primary/10 to-zi-secondary/5 flex items-center justify-center text-zi-outline-variant italic">
                                    No Image Available
                                </div>
                            )}
                        </Link>
                    </div>
                </section>
            )}

            {/* 탭 네비게이션 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zi-divider pb-6">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`p-5 rounded-zi-card border text-left transition-all duration-300 ${
                                isActive 
                                    ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' 
                                    : 'border-zi-divider bg-white hover:border-slate-300 hover:shadow-xs'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`font-bold text-sm sm:text-base ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                                    {tab.label}
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed break-keep [text-wrap:balance]">
                                {tab.desc}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* 기사 목록 출력 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map((article) => {
                        const industryName = article.industries?.[0]?.industry?.name || '인사이트';
                        
                        return (
                            <ImpressionTracker postId={article.id} key={article.id}>
                                <Link 
                                    href={`/magazine/local/${regionSlug}/${article.slug}`} 
                                    className="flex flex-col group cursor-pointer"
                                >
                                    <div className="mb-4 sm:mb-6 aspect-[16/10] bg-zi-surface-container-low rounded-zi-card overflow-hidden relative">
                                        {article.thumbnailUrl ? (
                                            <Image 
                                                src={article.thumbnailUrl} 
                                                alt={article.title}
                                                fill
                                                className="object-cover transition-all duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="h-full w-full transition-all duration-500 group-hover:scale-105 bg-zi-surface-container" />
                                        )}
                                        {article.isPaid && (
                                            <div className="absolute top-2 right-2 z-10 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50/90 backdrop-blur-sm border border-amber-200 px-2 py-0.5 rounded-full">
                                                {article.category?.slug === 'edu-collab' ? '협력 기관' : '파트너'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-start">
                                        <span className="mb-2 block text-ui-label font-ui-label font-semibold uppercase tracking-wider text-zi-secondary">
                                            {industryName}
                                        </span>
                                        <h4 className="mb-2 font-h3 text-[18px] sm:text-h3 text-zi-primary group-hover:text-zi-secondary transition-colors line-clamp-2 leading-snug">
                                            {article.title}
                                        </h4>
                                        <p className="mb-4 line-clamp-3 overflow-hidden text-body-md font-body-md text-zi-on-surface-variant leading-relaxed">
                                            <HighlightedText text={article.summary || ''} />
                                        </p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t border-zi-divider pt-3 text-zi-outline text-ui-label">
                                        <span>{article.author?.name || article.authorName || 'Zinsight 편집부'}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </Link>
                            </ImpressionTracker>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 border border-dashed border-zi-divider rounded-zi-card bg-zi-surface-container-low flex flex-col items-center justify-center text-center">
                        <p className="text-body-md text-zi-on-surface-variant max-w-sm">
                            이 탭에 등록된 소식이 없습니다. 조만간 새로운 소식을 전해드리겠습니다!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
