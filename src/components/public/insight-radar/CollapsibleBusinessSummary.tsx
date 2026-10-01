'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FormattedBusinessSummary } from './FormattedBusinessSummary';

interface CollapsibleBusinessSummaryProps {
    text?: string | null;
    fallback?: string;
    className?: string;
    bulletColor?: string;
    paragraphSpacing?: string;
}

export function CollapsibleBusinessSummary({
    text,
    fallback,
    className = '',
    bulletColor,
    paragraphSpacing,
}: CollapsibleBusinessSummaryProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text || !text.trim()) {
        return (
            <FormattedBusinessSummary
                text={text}
                fallback={fallback}
                className={className}
                bulletColor={bulletColor}
                paragraphSpacing={paragraphSpacing}
            />
        );
    }

    // 텍스트 길이가 비교적 짧은 경우(예: 120자 미만)에는 모바일에서도 토글 불필요
    const isLongText = text.trim().length > 140 || text.includes('\n');

    return (
        <div className="relative">
            <div
                className={`transition-all duration-300 ${
                    !isExpanded && isLongText
                        ? 'max-h-[135px] overflow-hidden md:max-h-none'
                        : 'max-h-none'
                }`}
            >
                <FormattedBusinessSummary
                    text={text}
                    fallback={fallback}
                    className={className}
                    bulletColor={bulletColor}
                    paragraphSpacing={paragraphSpacing}
                />
            </div>

            {/* 모바일 전용 그라디언트 페이드 & 더보기/접기 토글 */}
            {isLongText && (
                <div className="md:hidden mt-2">
                    {!isExpanded && (
                        <div className="absolute bottom-8 left-0 right-0 h-14 bg-gradient-to-t from-zi-surface via-zi-surface/80 to-transparent pointer-events-none" />
                    )}
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="relative z-10 inline-flex items-center gap-1 text-[13px] font-bold text-zi-blue hover:text-blue-700 py-1 transition-colors"
                        aria-expanded={isExpanded}
                    >
                        <span>{isExpanded ? '간략히 접기' : '비즈니스 요약 더보기'}</span>
                        {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
