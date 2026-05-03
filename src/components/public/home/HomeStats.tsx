'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Building2, Newspaper, Layers, Tag } from 'lucide-react';

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
            className="group relative overflow-hidden rounded-zi-card border border-zi-divider bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-zi-blue/20"
            style={{ 
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both' 
            }}
        >
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zi-surface-high text-zi-primary transition-colors">
                    {icon}
                </div>
                
                <div className="flex items-baseline gap-1">
                    <span className="font-data-num text-2xl font-bold tracking-tight text-zi-primary">
                        <StatsCounter value={value} />
                    </span>
                    <span className="text-xs font-medium text-zi-on-surface-variant">{unit}</span>
                </div>

                <p className="font-ui-label text-[11px] font-bold uppercase tracking-widest text-zi-outline">
                    {label}
                </p>
            </div>

            {/* 하단 강조 라인 (중앙 정렬에 맞춰 수정) */}
            <div className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-zi-blue transition-all duration-500 group-hover:w-1/3" />
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
        { icon: <Building2 className="h-7 w-7" />, label: '분석 조직', value: totalStats.totalCompanies, unit: '개' },
        { icon: <Newspaper className="h-7 w-7" />, label: '수집 기사', value: totalStats.totalArticles, unit: '건' },
        { icon: <Layers className="h-7 w-7" />, label: '산업 분야', value: totalStats.totalIndustries, unit: '개' },
        { icon: <Tag className="h-7 w-7" />, label: '추적 키워드', value: totalStats.totalKeywords, unit: '개' },
    ];

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, idx) => (
                <StatBadge key={stat.label} {...stat} index={idx} />
            ))}
        </div>
    );
}
