'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Newspaper, Building2, Store } from 'lucide-react';
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
}

export default function RegionHubClient({ regionName, regionSlug, posts }: RegionHubClientProps) {
    const [activeTab, setActiveTab] = useState<'VALLEY_NOW' | 'LOCAL_SME' | 'MARKET_FLASH'>('VALLEY_NOW');

    // 카테고리별 필터링
    const filteredPosts = posts.filter(p => p.category === activeTab);

    const tabs = [
        { id: 'VALLEY_NOW' as const, label: `${regionName} 밸리 나우`, desc: '관내 테크 스타트업 인터뷰 및 지자체 소식', icon: Newspaper },
        { id: 'LOCAL_SME' as const, label: '로컬 SME 그로스', desc: '소상공인 디지털 상생 및 전통기업 그로스', icon: Building2 },
        { id: 'MARKET_FLASH' as const, label: '마켓 플래시', desc: '프랜차이즈, 신상 핫플 및 이벤트 보도자료', icon: Store },
    ];

    return (
        <div className="space-y-12">
            {/* 탭 네비게이션 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-zi-divider pb-6">
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
                            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
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
                                    className="flex flex-col group cursor-pointer h-full"
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
                                    </div>
                                    <span className="mb-3 block text-ui-label font-ui-label font-semibold uppercase tracking-wider text-zi-secondary">
                                        {industryName}
                                    </span>
                                    <h4 className="mb-3 sm:mb-4 font-h3 text-[18px] sm:text-h3 text-zi-primary group-hover:text-zi-secondary transition-colors line-clamp-2">
                                        {article.title}
                                    </h4>
                                    <p className="mb-6 line-clamp-3 overflow-hidden text-body-md font-body-md text-zi-on-surface-variant">
                                        <HighlightedText text={article.summary || ''} />
                                    </p>
                                    <div className="mt-auto flex items-center justify-between border-t border-zi-divider pt-4 text-zi-outline text-ui-label">
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
