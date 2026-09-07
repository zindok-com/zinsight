import React from 'react';

interface FormattedBusinessSummaryProps {
    text?: string | null;
    fallback?: string;
    className?: string;
    bulletColor?: string;
    paragraphSpacing?: string;
}

interface BulletBlock {
    type: 'bullets';
    items: string[];
}

interface ParagraphBlock {
    type: 'paragraph';
    text: string;
}

interface SpacerBlock {
    type: 'spacer';
    size: 'md' | 'lg' | 'xl';
}

interface DividerBlock {
    type: 'divider';
}

type ContentBlock = BulletBlock | ParagraphBlock | SpacerBlock | DividerBlock;

export function FormattedBusinessSummary({
    text,
    fallback = '등록된 비즈니스 요약이 없습니다.',
    className = '',
    bulletColor = 'text-blue-600',
    paragraphSpacing = 'space-y-4',
}: FormattedBusinessSummaryProps) {
    if (!text || !text.trim()) {
        return <p className={`leading-relaxed text-slate-400 italic ${className}`}>{fallback}</p>;
    }

    const lines = text.split('\n');
    const blocks: ContentBlock[] = [];
    let currentBullets: string[] = [];
    let emptyLineCount = 0;

    const flushBullets = () => {
        if (currentBullets.length > 0) {
            blocks.push({ type: 'bullets', items: currentBullets });
            currentBullets = [];
        }
    };

    const flushSpacers = () => {
        if (emptyLineCount === 1) {
            blocks.push({ type: 'spacer', size: 'md' });
        } else if (emptyLineCount === 2) {
            blocks.push({ type: 'spacer', size: 'lg' });
        } else if (emptyLineCount >= 3) {
            blocks.push({ type: 'spacer', size: 'xl' });
        }
        emptyLineCount = 0;
    };

    for (const rawLine of lines) {
        const trimmed = rawLine.trim();

        if (!trimmed) {
            flushBullets();
            emptyLineCount++;
            continue;
        }

        // 새 내용이 시작되면 이전 빈 줄들을 비례 스페이서로 확정
        flushSpacers();

        // 1. 구분선 매칭 (---, ***, ___)
        if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            flushBullets();
            blocks.push({ type: 'divider' });
            continue;
        }

        // 2. 명시적 여백 태그 매칭 ([여백], [space], [space:lg])
        if (/^\[(여백|space|spacer)(:?(sm|md|lg|xl)?)\]$/i.test(trimmed)) {
            flushBullets();
            const match = trimmed.match(/^\[(여백|space|spacer)(:?(sm|md|lg|xl)?)\]$/i);
            const sizeStr = match?.[2]?.replace(':', '').toLowerCase() || 'md';
            const size = sizeStr === 'xl' ? 'xl' : sizeStr === 'lg' ? 'lg' : 'md';
            blocks.push({ type: 'spacer', size });
            continue;
        }

        // 3. 글머리 기호 행 매칭 (•, -, *, ▪ 등)
        const isBullet = /^[•\-\*▪]\s*/.test(trimmed) || trimmed.startsWith('•');
        if (isBullet) {
            const itemText = trimmed.replace(/^[•\-\*▪]\s*/, '').trim();
            currentBullets.push(itemText);
        } else {
            flushBullets();
            blocks.push({ type: 'paragraph', text: rawLine });
        }
    }

    flushBullets();

    return (
        <div className={`${paragraphSpacing} ${className}`}>
            {blocks.map((block, idx) => {
                if (block.type === 'bullets') {
                    return (
                        <ul key={`bullets-${idx}`} className="space-y-2.5 my-1.5 pl-0.5">
                            {block.items.map((item, itemIdx) => (
                                <li key={`bullet-${itemIdx}`} className="flex items-start gap-2.5">
                                    <span className={`font-bold shrink-0 select-none text-base leading-relaxed ${bulletColor}`}>
                                        •
                                    </span>
                                    <span className="leading-relaxed flex-1">{item}</span>
                                </li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === 'spacer') {
                    const heightClass = block.size === 'xl' ? 'h-10' : block.size === 'lg' ? 'h-7' : 'h-4';
                    return <div key={`spacer-${idx}`} className={heightClass} aria-hidden="true" />;
                }

                if (block.type === 'divider') {
                    return (
                        <div key={`divider-${idx}`} className="py-3">
                            <hr className="border-current opacity-15" />
                        </div>
                    );
                }

                return (
                    <p key={`para-${idx}`} className="leading-relaxed">
                        {block.text}
                    </p>
                );
            })}
        </div>
    );
}
