'use client';

import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleReferencesProps {
    references: string[];
}

export function CollapsibleReferences({ references }: CollapsibleReferencesProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!references || references.length === 0) return null;

    const visibleOnMobileLimit = 3;
    const hasMore = references.length > visibleOnMobileLimit;

    return (
        <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Target size={18} className="text-[#002B5B]" /> 주요 레퍼런스
                </h3>
                {hasMore && (
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="sm:hidden text-xs font-bold text-zi-blue flex items-center gap-0.5 py-1"
                    >
                        <span>{isExpanded ? '접기' : `+${references.length - visibleOnMobileLimit}개 더보기`}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {references.map((ref, i) => {
                    const isHiddenOnMobile = !isExpanded && i >= visibleOnMobileLimit;
                    return (
                        <span
                            key={i}
                            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-[#002B5B] transition-colors cursor-default shadow-sm ${
                                isHiddenOnMobile ? 'hidden sm:inline-flex' : 'inline-flex'
                            }`}
                        >
                            {ref}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
