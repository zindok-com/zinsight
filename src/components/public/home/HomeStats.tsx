'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const HomeStatsContent = dynamic(() => import('./HomeStatsContent').then(mod => mod.HomeStatsContent), {
    ssr: false,
});

// 서버 렌더링 HTML에도 실제 수치가 담기도록 아이콘만 스켈레톤으로 두고 숫자·라벨은 그대로 노출
function HomeStatsPlaceholder({ totalStats }: HomeStatsProps) {
    const items = [
        { label: '분석 조직', value: totalStats.totalCompanies, unit: '개' },
        { label: '수집 기사', value: totalStats.totalArticles, unit: '건' },
        { label: '지역', value: totalStats.totalRegions, unit: '개' },
        { label: '모니터링 키워드', value: totalStats.totalKeywords, unit: '개' },
    ];
    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {items.map((item) => (
                <div key={item.label} className="rounded-zi-card border border-[#30363D] bg-[#161B22] p-4 sm:p-5 flex flex-col items-center text-center">
                    <div className="mb-3 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-800/50 animate-pulse" />
                    <div className="flex items-baseline gap-1">
                        <span className="font-mono tabular-nums text-2xl font-bold tracking-tight text-sky-400">{item.value.toLocaleString()}</span>
                        <span className="text-xs font-medium text-slate-400">{item.unit}</span>
                    </div>
                    <p className="font-ui-label text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                </div>
            ))}
        </div>
    );
}

interface HomeStatsProps {
    totalStats: {
        totalCompanies: number;
        totalArticles: number;
        totalRegions: number;
        totalKeywords: number;
    };
}

export function HomeStats({ totalStats }: HomeStatsProps) {
    const [shouldLoad, setShouldLoad] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="min-h-[142px]">
            {shouldLoad ? (
                <HomeStatsContent totalStats={totalStats} />
            ) : (
                <HomeStatsPlaceholder totalStats={totalStats} />
            )}
        </div>
    );
}
