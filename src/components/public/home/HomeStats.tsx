'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const HomeStatsContent = dynamic(() => import('./HomeStatsContent').then(mod => mod.HomeStatsContent), {
    ssr: false,
    loading: () => <HomeStatsPlaceholder />
});

function HomeStatsPlaceholder() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-zi-card border border-[#30363D] bg-[#161B22] p-5 h-[142px] flex flex-col items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-slate-800/50 animate-pulse mb-3" />
                    <div className="h-6 w-24 bg-slate-800/50 animate-pulse rounded mb-1" />
                    <div className="h-4 w-16 bg-slate-800/50 animate-pulse rounded" />
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
                <HomeStatsPlaceholder />
            )}
        </div>
    );
}
