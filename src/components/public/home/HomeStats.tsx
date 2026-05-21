'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const LottieIcon = dynamic(() => import('@/components/ui/LottieIcon').then(mod => mod.LottieIcon), {
    ssr: false,
    loading: () => <div className="h-9 w-9 bg-sky-200/20 rounded-full animate-pulse" />
});

interface StatsCounterProps {
    value: number;
    duration?: number;
}

function StatsCounter({ value, duration = 1500 }: StatsCounterProps) {
    const [count, setCount] = useState(0);
    const countRef = useRef<number>(0);
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Ease out function
            const easeOutQuad = (t: number) => t * (2 - t);
            const currentCount = Math.floor(easeOutQuad(progress) * value);
            
            setCount(currentCount);
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [isVisible, value, duration]);

    return <span ref={elementRef}>{count.toLocaleString()}</span>;
}

interface StatBadgeProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    unit: string;
    index: number;
}

function StatBadge({ icon, label, value, unit, index }: StatBadgeProps) {
    return (
        <div 
            className="group relative overflow-hidden rounded-zi-card border border-[#30363D] bg-[#161B22] p-5 shadow-none transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_8px_30px_rgba(56,189,248,0.25)] hover:border-[#38BDF8]"
            style={{ 
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both' 
            }}
        >
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 border border-sky-200/50 shadow-[0_0_12px_rgba(56,189,248,0.15)] text-sky-700 transition-all duration-300 group-hover:bg-sky-50 group-hover:border-sky-300 group-hover:text-sky-800 group-hover:scale-105">
                    {icon}
                </div>
                
                <div className="flex items-baseline gap-1">
                    <span className="font-mono tabular-nums text-2xl font-bold tracking-tight text-sky-400 group-hover:text-sky-300 transition-colors">
                        <StatsCounter value={value} />
                    </span>
                    <span className="text-xs font-medium text-slate-400">{unit}</span>
                </div>

                <p className="font-ui-label text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {label}
                </p>
            </div>

            {/* 하단 강조 라인 (Zinsight 시그니처 네온 블루 적용) */}
            <div className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[#38BDF8] transition-all duration-500 group-hover:w-1/3 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
        </div>
    );
}

interface HomeStatsProps {
    totalStats: {
        totalCompanies: number;
        totalArticles: number;
        totalIndustries: number;
        totalKeywords: number;
    };
}

export function HomeStats({ totalStats }: HomeStatsProps) {
    const statsData = [
        { 
            icon: <LottieIcon name="network" size={36} speed={0.7} hover={true} />, 
            label: '분석 조직', 
            value: totalStats.totalCompanies, 
            unit: '개' 
        },
        { 
            icon: <LottieIcon name="news" size={36} speed={0.7} hover={true} />, 
            label: '수집 기사', 
            value: totalStats.totalArticles, 
            unit: '건' 
        },
        { 
            icon: <LottieIcon name="chart" size={36} speed={0.7} hover={true} />, 
            label: '산업 분야', 
            value: totalStats.totalIndustries, 
            unit: '개' 
        },
        { 
            icon: <LottieIcon name="bulb" size={36} speed={0.7} hover={true} />, 
            label: '추적 키워드', 
            value: totalStats.totalKeywords, 
            unit: '개' 
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, idx) => (
                <StatBadge key={stat.label} {...stat} index={idx} />
            ))}
        </div>
    );
}
