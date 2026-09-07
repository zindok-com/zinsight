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
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface DividerBlock {
    type: 'divider';
}

type ContentBlock = BulletBlock | ParagraphBlock | SpacerBlock | DividerBlock;

function renderHighlightedParts(text: string) {
    const parts = text.split(/(\*\*\{.*?\}\*\*|\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
        if (part.startsWith('**{') && part.endsWith('}**')) {
            const content = part.slice(3, -3);
            return (
                <span key={i} className="font-bold underline decoration-current/30 underline-offset-4">
                    {content}
                </span>
            );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.slice(2, -2);
            return (
                <strong key={i} className="font-bold">
                    {content}
                </strong>
            );
        }
        if (part.startsWith('[') && part.endsWith(')')) {
            const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (match) {
                const linkText = match[1];
                const url = match[2];
                return (
                    <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-bold underline underline-offset-4 decoration-current/30 hover:opacity-80 transition-opacity"
                    >
                        {linkText}
                    </a>
                );
            }
        }
        return part;
    });
}

export function FormattedBusinessSummary({
    text,
    fallback = '등록된 비즈니스 요약이 없습니다.',
    className = '',
    bulletColor = 'text-blue-600',
    paragraphSpacing = 'space-y-2.5',
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
            blocks.push({ type: 'spacer', size: 'sm' });
        } else if (emptyLineCount === 2) {
            blocks.push({ type: 'spacer', size: 'md' });
        } else if (emptyLineCount >= 3) {
            blocks.push({ type: 'spacer', size: 'lg' });
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

        // 2. 명시적 여백 태그 매칭 ([여백], [여백:좁게], [여백:sm], [space:xs] 등)
        if (/^\[(여백|space|spacer)(:?(xs|sm|md|lg|xl|좁게|미세|보통|중간|넓게)?)\]$/i.test(trimmed)) {
            flushBullets();
            const match = trimmed.match(/^\[(여백|space|spacer)(:?(xs|sm|md|lg|xl|좁게|미세|보통|중간|넓게)?)\]$/i);
            const sizeRaw = match?.[2]?.replace(':', '').toLowerCase() || 'xs';
            let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'xs';
            if (sizeRaw === 'xs' || sizeRaw === '좁게' || sizeRaw === '미세') size = 'xs';
            else if (sizeRaw === 'sm') size = 'sm';
            else if (sizeRaw === 'md' || sizeRaw === '보통' || sizeRaw === '중간') size = 'md';
            else if (sizeRaw === 'lg' || sizeRaw === '넓게') size = 'lg';
            else if (sizeRaw === 'xl') size = 'xl';
            blocks.push({ type: 'spacer', size });
            continue;
        }

        // 3. 글머리 기호 행 매칭 (•, ▪ 또는 단독 -, * 뒤에 공백)
        const bulletMatch = trimmed.match(/^(?:([•▪])\s*|([\-\*])(?!\2)\s+)(.*)$/);
        if (bulletMatch) {
            const itemText = bulletMatch[3].trim();
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
                                    <span className="leading-relaxed flex-1">
                                        {renderHighlightedParts(item)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === 'spacer') {
                    const heightClass = 
                        block.size === 'xs' ? 'h-[5px]' :
                        block.size === 'sm' ? 'h-2.5' :
                        block.size === 'md' ? 'h-[18px]' :
                        block.size === 'lg' ? 'h-7' : 'h-10';
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
                        {renderHighlightedParts(block.text)}
                    </p>
                );
            })}
        </div>
    );
}
