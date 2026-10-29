'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FormattedBusinessSummary } from '../FormattedBusinessSummary';

interface ProfileOverviewProps {
    text: string;
}

// 접힌 상태 높이: 본문 16px × leading-relaxed(1.625) × 5줄 ≈ 130px
const COLLAPSED_CLASS = 'max-h-[8.125rem] overflow-hidden';

/**
 * 기업 개요. 접힌 상태에서도 전문이 DOM에 있고(CSS max-height로만 가림) 검색엔진이 전체를 읽는다.
 * 핵심 문구 강조(**굵게**)는 FormattedBusinessSummary가 <strong>으로 렌더링한다.
 */
export function ProfileOverview({ text }: ProfileOverviewProps) {
    const [expanded, setExpanded] = useState(false);
    // 서버·클라이언트가 같은 결과를 내도록 길이로만 판정 (측정 기반 판정은 CLS 유발)
    const isLong = text.trim().length > 220 || text.trim().split('\n').filter(Boolean).length > 2;

    return (
        <div>
            <div className={`relative ${isLong && !expanded ? COLLAPSED_CLASS : ''}`}>
                <FormattedBusinessSummary
                    text={text}
                    className="text-[16px] leading-relaxed text-slate-700"
                    bulletColor="text-zi-secondary"
                    paragraphSpacing="space-y-2.5"
                />
                {isLong && !expanded && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
                )}
            </div>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-zi-blue hover:text-blue-700"
                >
                    {expanded ? '접기' : '더보기'}
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
            )}
        </div>
    );
}
