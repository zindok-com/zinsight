'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';

interface RadarCompanyCard {
    id: number;
    company_name: string;
    entity_type: string | null;
    business_summary: string | null;
    core_keywords: any;
    recent_keywords: any;
    industry: {
        id: number;
        name: string;
        slug: string;
    } | null;
    articleCount: number;
}

interface RadarCompanyTableProps {
    companies: RadarCompanyCard[];
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

export function RadarCompanyTable({ companies }: RadarCompanyTableProps) {
    const router = useRouter();

    const handleRowClick = (id: number) => {
        router.push(`/insight-radar/${id}`);
    };

    return (
        <div className="overflow-hidden border border-zi-divider bg-white rounded-zi-card shadow-sm hover:shadow-md transition-shadow">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-zi-divider bg-zi-surface-container-low/50">
                            <th className="px-6 py-4 font-ui-label text-[12px] font-bold uppercase tracking-widest text-zi-outline">
                                기관/기업명
                            </th>
                            <th className="px-6 py-4 font-ui-label text-[12px] font-bold uppercase tracking-widest text-zi-outline">
                                구분
                            </th>
                            <th className="px-6 py-4 font-ui-label text-[12px] font-bold uppercase tracking-widest text-zi-outline">
                                산업군
                            </th>
                            <th className="px-6 py-4 font-ui-label text-[12px] font-bold uppercase tracking-widest text-zi-outline">
                                핵심 키워드
                            </th>
                            <th className="px-6 py-4 text-right font-ui-label text-[12px] font-bold uppercase tracking-widest text-zi-outline">
                                연관 기사수
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zi-divider">
                        {companies.length > 0 ? (
                            companies.map((company) => (
                                <tr
                                    key={company.id}
                                    onClick={() => handleRowClick(company.id)}
                                    className="group cursor-pointer transition-all hover:bg-zi-surface-container-low"
                                >
                                    {/* 기관/기업명 */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded bg-zi-surface-high text-zi-primary group-hover:bg-zi-primary group-hover:text-white transition-colors">
                                                <Building2 className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold text-zi-primary group-hover:text-zi-secondary transition-colors decoration-zi-secondary/30 group-hover:underline">
                                                {company.company_name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* 구분 */}
                                    <td className="px-6 py-5">
                                        <span className="inline-flex bg-zi-surface-container px-2.5 py-1 rounded-sm font-ui-label text-[11px] font-bold text-zi-secondary uppercase tracking-tighter">
                                            {company.entity_type || '기업'}
                                        </span>
                                    </td>

                                    {/* 산업군 */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1.5">
                                            {company.allIndustries && company.allIndustries.length > 0 ? (
                                                company.allIndustries.map((ind) => (
                                                    <span key={ind.id} className="text-zi-body-sm text-zi-on-surface-variant font-medium bg-zi-surface-container-low px-2 py-0.5 rounded border border-zi-divider whitespace-nowrap">
                                                        {ind.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-zi-body-md text-zi-on-surface-variant font-medium">
                                                    {company.industry?.name || '알 수 없음'}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* 핵심 키워드 */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                                            {(() => {
                                                const kw = parseKeywords(company.core_keywords);
                                                if (!kw) return <span className="text-zi-caption text-zi-outline">-</span>;
                                                
                                                const allKws = [
                                                    ...(kw.products || []),
                                                    ...(kw.technology || []),
                                                    ...(kw.target_market || [])
                                                ].slice(0, 3);

                                                if (allKws.length === 0) return <span className="text-zi-caption text-zi-outline">-</span>;

                                                return allKws.map((k, i) => (
                                                    <span 
                                                        key={i} 
                                                        className="px-2 py-0.5 rounded-sm bg-zi-surface-high border border-zi-divider text-[10px] font-bold text-zi-primary transition-colors group-hover:border-zi-primary/20"
                                                    >
                                                        {k}
                                                    </span>
                                                ));
                                            })()}
                                        </div>
                                    </td>

                                    {/* 연관 기사수 */}
                                    <td className="px-6 py-5 text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                            <span className="bg-zi-primary text-white px-3 py-0.5 rounded-full text-[12px] font-bold group-hover:bg-zi-secondary transition-colors">
                                                {company.articleCount}
                                            </span>
                                            <span className="text-[11px] font-bold text-zi-outline uppercase tracking-tighter">Items</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-zi-outline">
                                    해당 조건에 맞는 조직을 찾을 수 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
