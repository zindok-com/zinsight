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

type ContentBlock = BulletBlock | ParagraphBlock;

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

    for (const rawLine of lines) {
        const trimmed = rawLine.trim();

        if (!trimmed) {
            if (currentBullets.length > 0) {
                blocks.push({ type: 'bullets', items: currentBullets });
                currentBullets = [];
            }
            continue;
        }

        const isBullet = /^[•\-\*▪]\s*/.test(trimmed) || trimmed.startsWith('•');
        if (isBullet) {
            const itemText = trimmed.replace(/^[•\-\*▪]\s*/, '').trim();
            currentBullets.push(itemText);
        } else {
            if (currentBullets.length > 0) {
                blocks.push({ type: 'bullets', items: currentBullets });
                currentBullets = [];
            }
            blocks.push({ type: 'paragraph', text: rawLine });
        }
    }

    if (currentBullets.length > 0) {
        blocks.push({ type: 'bullets', items: currentBullets });
    }

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

                return (
                    <p key={`para-${idx}`} className="leading-relaxed">
                        {block.text}
                    </p>
                );
            })}
        </div>
    );
}
