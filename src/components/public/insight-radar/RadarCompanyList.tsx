'use client';

import React from 'react';
import Link from 'next/link';
import { Newspaper, Tag, ArrowRight } from 'lucide-react';
import type { RadarCompanyCard } from '@/actions/insight-radar-actions';
import { LottieIcon, LottieIconName } from '@/components/ui/LottieIcon';

interface RadarCompanyListProps {
    companies: RadarCompanyCard[];
    isInitialState?: boolean;
}

/**
 * 기업의 핵심 키워드를 파싱하는 헬퍼 함수
 */
function parseKeywords(keywordsStr: any) {
    if (!keywordsStr) return null;
    try {
        if (typeof keywordsStr === 'string') {
            return JSON.parse(keywordsStr);
        }
        return keywordsStr as { products?: string[]; technology?: string[]; target_market?: string[] };
    } catch {
        return null;
    }
}

// 조직 타입(entity_type)에 따른 컬러 테마 및 Lottie 아이콘 매핑
const ENTITY_CONFIG = {
    '기업': { 
        theme: { border: 'border-t-blue-500', iconBg: 'bg-blue-50', badgeBg: 'bg-blue-50', badgeText: 'text-blue-700', badgeBorder: 'border-blue-200', articleBg: 'bg-blue-600', arrowHover: 'group-hover:text-blue-600' },
        icon: 'network' as LottieIconName
    },
    '기관': {
        theme: { border: 'border-t-emerald-500', iconBg: 'bg-emerald-50', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', badgeBorder: 'border-emerald-200', articleBg: 'bg-emerald-600', arrowHover: 'group-hover:text-emerald-600' },
        icon: 'management' as LottieIconName
    },
    '대학': {
        theme: { border: 'border-t-violet-500', iconBg: 'bg-violet-50', badgeBg: 'bg-violet-50', badgeText: 'text-violet-700', badgeBorder: 'border-violet-200', articleBg: 'bg-violet-600', arrowHover: 'group-hover:text-violet-600' },
        icon: 'rules' as LottieIconName
    },
    'default': {
        theme: { border: 'border-t-amber-500', iconBg: 'bg-amber-50', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', badgeBorder: 'border-amber-200', articleBg: 'bg-amber-600', arrowHover: 'group-hover:text-amber-600' },
        icon: 'team' as LottieIconName
    }
};

const getEntityConfig = (entityType?: string | null) => {
    if (!entityType) return ENTITY_CONFIG.default;
    if (entityType.includes('기업')) return ENTITY_CONFIG['기업'];
    if (entityType.includes('기관')) return ENTITY_CONFIG['기관'];
    if (entityType.includes('대학')) return ENTITY_CONFIG['대학'];
    return ENTITY_CONFIG.default;
};

export function RadarCompanyList({ companies, isInitialState }: RadarCompanyListProps) {

    if (!companies || companies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center border border-zi-divider bg-white rounded-zi-card shadow-sm">
                <div className="flex items-center justify-center mb-6">
                    <LottieIcon name="search" size={80} loop autoplay />
                </div>
                <h3 className="text-zi-body-lg font-bold text-zi-on-surface mb-2">조직을 찾을 수 없습니다</h3>
                <p className="text-zi-body-md text-zi-on-surface-variant">해당 조건에 맞는 조직 또는 기업 데이터가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            {isInitialState && companies.length > 0 && (
                <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <h2 className="text-lg font-bold text-zi-on-surface">주목할 만한 기관 및 기업</h2>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company, index) => {
                const kw = parseKeywords(company.core_keywords);
                const allKws = kw 
                    ? [...(kw.products || []), ...(kw.technology || []), ...(kw.target_market || [])].slice(0, 4)
                    : [];

                // 조직 타입(entity_type)을 기반으로 테마와 아이콘을 결정
                const config = getEntityConfig(company.entity_type);
                const theme = config.theme;
                const iconName = config.icon;

                return (
                    <Link
                        key={company.id}
                        href={`/insight-radar/${company.id}`}
                        className={`group flex flex-col border border-zi-divider bg-white rounded-zi-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-zi-primary/40 border-t-[4px] ${theme.border}`}
                    >
                        {/* Header Section */}
                        <div className="p-6 pb-5 border-b border-zi-divider/50 flex-grow-0">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${theme.iconBg} transition-transform duration-300 group-hover:scale-110 shadow-sm border border-white`}>
                                        <LottieIcon name={iconName} size={42} hover={true} loop={false} autoplay={false} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-[17px] text-zi-on-surface group-hover:text-zi-primary transition-colors line-clamp-1 leading-snug">
                                            {company.company_name}
                                        </h3>
                                        <div className="mt-1.5">
                                            <span className="inline-flex bg-zi-surface-container px-2 py-0.5 rounded text-[11px] font-bold text-zi-secondary uppercase tracking-tighter shadow-sm">
                                                {company.entity_type || '기업'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Industries */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {company.allIndustries && company.allIndustries.length > 0 ? (
                                    company.allIndustries.map((ind) => (
                                        <span key={ind.id} className="text-[12px] font-medium text-zi-on-surface-variant bg-zi-surface px-2.5 py-1 rounded-md border border-zi-divider hover:bg-zi-surface-high transition-colors">
                                            {ind.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[12px] font-medium text-zi-on-surface-variant bg-zi-surface px-2.5 py-1 rounded-md border border-zi-divider">
                                        {company.industry?.name || '알 수 없음'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Body Section */}
                        <div className="p-6 flex-grow flex flex-col justify-start gap-4 bg-zi-surface/20">
                            {/* Keywords */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-3 text-zi-on-surface-variant">
                                    <Tag className="h-3.5 w-3.5" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-zi-outline">핵심 키워드</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {allKws.length > 0 ? (
                                        allKws.map((k, i) => (
                                            <span 
                                                key={i} 
                                                className={`px-2.5 py-1 rounded-md border text-[12px] font-semibold transition-colors shadow-sm ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                                            >
                                                {k}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[13px] text-zi-outline italic bg-white/50 px-3 py-1.5 rounded-md border border-dashed border-zi-divider">키워드 없음</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="px-6 py-4 mt-auto border-t border-zi-divider/50 bg-zi-surface-container-low/40 flex items-center justify-between rounded-b-zi-card">
                            <div className="flex items-center gap-2 text-zi-on-surface-variant">
                                <Newspaper className="h-4 w-4" />
                                <span className="text-[13px] font-bold text-zi-outline">연관 기사</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center justify-center text-white px-3 py-0.5 rounded-full text-xs font-bold transition-transform group-hover:scale-105 shadow-sm ${theme.articleBg}`}>
                                    {company.articleCount}
                                </span>
                                <ArrowRight className={`h-4 w-4 text-zi-outline transition-transform group-hover:translate-x-1 ${theme.arrowHover}`} />
                            </div>
                        </div>
                    </Link>
                );
            })}
            </div>
        </div>
    );
}
