'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProfileTimelineListProps {
    total: number;
    children: ReactNode;
}

// 접힌 상태에서 보이는 항목 수 (Tailwind 임의 변형은 정적 문자열이어야 하므로 아래 클래스와 함께 고정)
const VISIBLE_COUNT = 8;
const COLLAPSED_CLASS = '[&>li:nth-child(n+9)]:hidden';

/**
 * 주요 활동 타임라인 목록. 서버가 렌더링한 항목 전부가 DOM에 있고, 접힌 상태에서는 CSS로만 가린다.
 */
export function ProfileTimelineList({ total, children }: ProfileTimelineListProps) {
    const [expanded, setExpanded] = useState(false);
    const hasMore = total > VISIBLE_COUNT;

    return (
        <div>
            <ol
                className={`divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm ${
                    hasMore && !expanded ? COLLAPSED_CLASS : ''
                }`}
            >
                {children}
            </ol>
            {hasMore && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-zi-blue hover:text-blue-700"
                >
                    {expanded ? '접기' : `${total - VISIBLE_COUNT}건 더보기`}
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
            )}
        </div>
    );
}
