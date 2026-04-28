import { TrendingUp } from 'lucide-react';

interface TrendingKeyword {
    id: number;
    keyword_text: string;
    count: number;
    industryName: string;
}

interface RadarTrendingKeywordsProps {
    keywords: TrendingKeyword[];
}

/**
 * count 기준 최댓값 대비 상대적 크기를 계산하여 태그 클라우드 형태로 렌더링합니다.
 */
export function RadarTrendingKeywords({ keywords }: RadarTrendingKeywordsProps) {
    if (keywords.length === 0) {
        return (
            <p className="py-4 text-center text-sm text-muted-foreground">
                트렌드 키워드가 없습니다.
            </p>
        );
    }

    const maxCount = Math.max(...keywords.map((k) => k.count), 1);

    /**
     * count 비율에 따라 폰트 크기 클래스를 반환합니다.
     */
    function getSizeClass(count: number): string {
        const ratio = count / maxCount;
        if (ratio > 0.8) return 'text-base font-bold';
        if (ratio > 0.6) return 'text-sm font-semibold';
        if (ratio > 0.4) return 'text-sm font-medium';
        if (ratio > 0.2) return 'text-xs font-medium';
        return 'text-xs';
    }

    /**
     * count 비율에 따라 배경 색상 강도를 반환합니다.
     */
    function getColorClass(count: number): string {
        const ratio = count / maxCount;
        if (ratio > 0.8) return 'bg-primary text-primary-foreground';
        if (ratio > 0.5) return 'bg-primary/20 text-primary';
        return 'bg-muted text-muted-foreground';
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                인기 키워드
            </div>
            <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                    <span
                        key={kw.id}
                        id={`trending-kw-${kw.id}`}
                        title={`${kw.industryName} · ${kw.count}건`}
                        className={`cursor-default rounded-full px-3 py-1 transition-opacity hover:opacity-80 ${getSizeClass(kw.count)} ${getColorClass(kw.count)}`}
                    >
                        {kw.keyword_text}
                    </span>
                ))}
            </div>
        </div>
    );
}
