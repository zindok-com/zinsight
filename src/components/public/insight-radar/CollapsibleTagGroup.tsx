'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleTagGroupProps {
    title: string;
    items?: string[] | null;
    badgeStyle: {
        bg: string;
        text: string;
        border: string;
    };
    emptyText?: string;
}

export function CollapsibleTagGroup({
    title,
    items,
    badgeStyle,
    emptyText = '정보 없음'
}: CollapsibleTagGroupProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsCollapse, setNeedsCollapse] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // 2줄 높이 기준 (태그 py-1, text-xs/sm, gap-1.5/2 기준 약 72px)
        // 2줄을 초과하면 scrollHeight가 대략 76px 이상이 됨
        const checkOverflow = () => {
            if (el.scrollHeight > 76) {
                setNeedsCollapse(true);
            } else {
                setNeedsCollapse(false);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [items]);

    return (
        <div className="border border-zi-divider bg-white p-4 sm:p-6 rounded-xl shadow-sm flex flex-col justify-between transition-all">
            <div>
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
                    {needsCollapse && (
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs font-bold text-zi-blue hover:text-blue-700 flex items-center gap-0.5 transition-colors shrink-0"
                            aria-expanded={isExpanded}
                        >
                            <span>{isExpanded ? '접기' : '더보기'}</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                    )}
                </div>

                <div className="relative">
                    <div
                        ref={containerRef}
                        className={`flex flex-wrap gap-1.5 sm:gap-2 transition-all duration-300 ${
                            !isExpanded && needsCollapse ? 'max-h-[72px] overflow-hidden' : 'max-h-none'
                        }`}
                    >
                        {items && items.length > 0 ? (
                            items.map((item, i) => (
                                <span
                                    key={i}
                                    className={`px-2.5 sm:px-3 py-1 ${badgeStyle.bg} ${badgeStyle.text} rounded-full text-xs sm:text-sm font-medium border ${badgeStyle.border}`}
                                >
                                    {item}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs sm:text-sm text-slate-400 italic">{emptyText}</span>
                        )}
                    </div>

                    {!isExpanded && needsCollapse && (
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                </div>
            </div>
        </div>
    );
}
