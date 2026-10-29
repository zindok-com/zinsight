'use client';

import { useEffect, useState } from 'react';

interface ProfileSectionNavProps {
    sections: { id: string; label: string }[];
    className?: string;
}

/**
 * 프로필 섹션 아웃라인 + 스크롤 스파이. 단일 URL 내 앵커(#id)로만 이동하며,
 * JS가 없어도 일반 앵커 링크로 동작한다.
 */
export function ProfileSectionNav({ sections, className = '' }: ProfileSectionNavProps) {
    const [activeId, setActiveId] = useState(sections[0]?.id);

    useEffect(() => {
        const elements = sections
            .map((s) => document.getElementById(s.id))
            .filter((el): el is HTMLElement => !!el);
        if (elements.length === 0) return;

        const visible = new Map<string, number>();
        // 상단 헤더·아웃라인 아래(약 160px)부터 화면 중간까지를 "현재 읽는 영역"으로 판정
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
                    else visible.delete(entry.target.id);
                }
                const current = sections.find((s) => visible.has(s.id));
                if (current) setActiveId(current.id);
            },
            { rootMargin: '-160px 0px -50% 0px' }
        );
        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [sections]);

    return (
        <nav aria-label="프로필 섹션" className={className}>
            <ul className="flex gap-1 overflow-x-auto">
                {sections.map((s) => {
                    const active = s.id === activeId;
                    return (
                        <li key={s.id} className="shrink-0">
                            <a
                                href={`#${s.id}`}
                                aria-current={active ? 'location' : undefined}
                                className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors ${
                                    active
                                        ? 'border-zi-blue text-zi-primary'
                                        : 'border-transparent text-slate-600 hover:text-zi-primary'
                                }`}
                            >
                                {s.label}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
