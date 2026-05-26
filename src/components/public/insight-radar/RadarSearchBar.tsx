'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X, Sparkles } from 'lucide-react';

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
        <div className="mb-10 sm:mb-14 relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-5 sm:p-8 md:p-12 shadow-2xl">
            {/* 배경 장식 요소 */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl"></div>
            <div className="pointer-events-none absolute top-10 left-1/4 w-32 h-32 rounded-full bg-indigo-400/20 blur-2xl"></div>

            <div className="relative z-10 flex flex-col items-center mb-8 text-center">
                <div className="inline-flex items-center justify-center gap-2 px-3 py-1 mb-4 rounded-full bg-white/10 border border-white/20 text-blue-50 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    Insight Radar
                </div>
                <h2 className="text-[22px] sm:text-3xl md:text-4xl font-extrabold text-white mb-2 sm:mb-3 tracking-tight break-keep">
                    관심 있는 조직과 기술 트렌드를 탐색하세요
                </h2>
                <p className="text-blue-100 text-[13px] sm:text-sm md:text-base max-w-2xl font-medium">
                    최신 산업 동향, 핵심 키워드, 그리고 연관 기사까지 한 번에 검색할 수 있습니다.
                </p>
            </div>

            {/* 메인 검색 컨테이너 (최신 트렌드 플로팅 바) */}
            <div className="relative z-10 max-w-5xl mx-auto bg-white p-2 rounded-[18px] sm:rounded-[24px] shadow-xl flex flex-col md:flex-row gap-2 items-center border border-white/40 backdrop-blur-xl">

                {/* 산업 필터 */}
                <div className="relative w-full md:w-[260px] shrink-0">
                    <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-blue-500">
                        <Filter className="h-5 w-5" />
                    </div>
                    <select
                        value={industryId}
                        onChange={(e) => setIndustryId(e.target.value)}
                        className="h-16 w-full appearance-none rounded-[18px] bg-slate-50/50 pl-14 pr-12 text-[15px] font-bold text-slate-700 focus:bg-blue-50/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer border border-transparent hover:border-slate-200"
                    >
                        <option value="">전체 산업 분야</option>
                        {industries.map((ind) => (
                            <option key={ind.id} value={ind.id}>
                                {ind.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                <div className="hidden md:block w-[1px] h-10 bg-slate-200 mx-1"></div>

                {/* 검색어 입력란 */}
                <div className="relative flex-1 w-full">
                    <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-blue-500">
                        <Search className="h-5 w-5" />
                    </div>
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="조직명, 핵심 키워드, 관련 기술 등을 검색해보세요"
                        className="h-16 w-full rounded-[18px] bg-transparent pl-14 pr-12 text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-slate-50/50 transition-all border border-transparent hover:border-slate-200"
                    />
                    {q && (
                        <button
                            onClick={() => setQ('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1.5 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex w-full md:w-auto gap-2 shrink-0">
                    {/* 검색 버튼 */}
                    <button
                        onClick={handleSearch}
                        className="h-16 flex-1 md:flex-none md:px-10 rounded-[18px] bg-blue-600 text-white font-bold text-[16px] hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                        <Search className="h-5 w-5 md:hidden lg:block" />
                        <span>검색</span>
                    </button>

                    {/* 초기화 버튼 */}
                    {(q || industryId) && (
                        <button
                            onClick={handleClear}
                            className="h-16 px-5 rounded-[18px] border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center"
                            title="검색 조건 초기화"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* 최근 검색어 / 추천 키워드 영역 (시각적 장식) */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 mt-6 text-sm">
                <span className="text-blue-200 font-medium mr-2">추천 키워드:</span>
                {['LED', '인공지능', 'AX', 'ESG', '클라우드', '자율주행'].map((keyword, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setQ(keyword);
                            // Set Q and then immediately push to URL
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('q', keyword);
                            if (industryId) params.set('industryId', industryId);
                            params.delete('page');
                            router.push(`/insight-radar?${params.toString()}`);
                        }}
                        className="px-3 py-1 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors backdrop-blur-sm"
                    >
                        #{keyword}
                    </button>
                ))}
            </div>
        </div>
    );
}
