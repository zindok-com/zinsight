'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface RadarSearchBarProps {
    industries: { id: number; name: string }[];
    currentIndustryId?: number;
    currentQuery?: string;
}

export function RadarSearchBar({ industries, currentIndustryId, currentQuery }: RadarSearchBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [q, setQ] = useState(currentQuery || '');
    const [industryId, setIndustryId] = useState(currentIndustryId?.toString() || '');

    // URL 파라미터가 변경되면 로컬 상태도 동기화 (뒤로 가기 등 대응)
    useEffect(() => {
        setQ(searchParams.get('q') || '');
        setIndustryId(searchParams.get('industryId') || '');
    }, [searchParams]);

    const handleSearch = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (q) {
            params.set('q', q);
        } else {
            params.delete('q');
        }
        
        if (industryId) {
            params.set('industryId', industryId);
        } else {
            params.delete('industryId');
        }
        
        params.delete('page'); // 필터 변경 시 페이지 초기화
        
        router.push(`/insight-radar?${params.toString()}`);
    }, [q, industryId, router, searchParams]);

    const handleClear = () => {
        setQ('');
        setIndustryId('');
        router.push('/insight-radar');
    };

    return (
        <div className="mb-12 flex flex-col gap-3 md:flex-row md:items-center">
            {/* 산업 필터 셀렉트 */}
            <div className="relative min-w-[220px]">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zi-outline">
                    <Filter className="h-4 w-4" />
                </div>
                <select
                    value={industryId}
                    onChange={(e) => setIndustryId(e.target.value)}
                    className="h-14 w-full appearance-none rounded-zi-btn border border-zi-outline-variant bg-white pl-12 pr-10 text-zi-body-md text-zi-primary focus:border-zi-primary focus:outline-none transition-all"
                >
                    <option value="">전체 산업 분야</option>
                    {industries.map((ind) => (
                        <option key={ind.id} value={ind.id}>
                            {ind.name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zi-outline">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* 통합 검색창 */}
            <div className="relative flex-1">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zi-outline">
                    <Search className="h-5 w-5" />
                </div>
                <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="기업명 또는 핵심 키워드를 검색하세요"
                    className="h-14 w-full rounded-zi-btn border border-zi-outline-variant bg-white pl-12 pr-12 text-zi-body-md text-zi-primary placeholder:text-zi-outline focus:border-zi-primary focus:outline-none shadow-sm transition-all"
                />
                {q && (
                    <button
                        onClick={() => setQ('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zi-outline hover:text-zi-primary"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* 검색 버튼 */}
            <button
                onClick={handleSearch}
                className="h-14 rounded-zi-btn bg-zi-primary px-10 font-bold text-white transition-all hover:bg-zi-secondary active:scale-95 shadow-sm"
            >
                검색
            </button>

            {/* 초기화 버튼 (필터가 있을 때만 표시 가능하지만 상시 배치도 가능) */}
            {(q || industryId) && (
                <button
                    onClick={handleClear}
                    className="h-14 rounded-zi-btn border border-zi-divider bg-zi-surface px-4 text-zi-outline hover:text-zi-primary transition-all"
                    title="필터 초기화"
                >
                    <X className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}
