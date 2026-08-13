'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RadarRegionWithStats } from '@/actions/insight-radar-actions';

interface RadarFilterBarProps {
    regions: RadarRegionWithStats[];
    selectedRegionId?: number;
    selectedEntityType?: string;
    searchQuery?: string;
}

const ENTITY_TYPES = [
    { value: 'company', label: '기업' },
    { value: 'institution', label: '기관' },
    { value: 'center', label: '센터' },
];

export function RadarFilterBar({
    regions,
    selectedRegionId,
    selectedEntityType,
    searchQuery = '',
}: RadarFilterBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [inputValue, setInputValue] = useState(searchQuery);

    /**
     * URL 쿼리 파라미터를 업데이트하여 필터를 적용합니다.
     */
    function updateParams(updates: Record<string, string | undefined>) {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '') {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        // 필터 변경 시 페이지 초기화
        params.delete('page');
        startTransition(() => {
            router.push(`/insight-radar?${params.toString()}`);
        });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        updateParams({ q: inputValue || undefined });
    }

    function clearAll() {
        setInputValue('');
        startTransition(() => {
            router.push('/insight-radar');
        });
    }

    const hasActiveFilter = selectedRegionId || selectedEntityType || searchQuery;

    return (
        <div className="space-y-4">
            {/* 검색창 */}
            <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id="radar-search"
                    placeholder="기업명, 키워드, 요약 내용 검색..."
                    className="pl-9 pr-24"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isPending}
                />
                <Button
                    type="submit"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                    disabled={isPending}
                >
                    검색
                </Button>
            </form>

            {/* 지역 필터 */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    지역
                </p>
                <div className="flex flex-wrap gap-2">
                    <Badge
                        id="filter-region-all"
                        variant={!selectedRegionId ? 'default' : 'outline'}
                        className="cursor-pointer select-none"
                        onClick={() => updateParams({ regionId: undefined })}
                    >
                        전체
                    </Badge>
                    {regions.map((region) => (
                        <Badge
                            id={`filter-region-${region.id}`}
                            key={region.id}
                            variant={selectedRegionId === region.id ? 'default' : 'outline'}
                            className="cursor-pointer select-none"
                            onClick={() =>
                                updateParams({ regionId: String(region.id) })
                            }
                        >
                            {region.name}
                            <span className="ml-1 text-xs opacity-60">
                                {region.organizationCount}
                            </span>
                        </Badge>
                    ))}
                </div>
            </div>

            {/* 조직 유형 필터 */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    조직 유형
                </p>
                <div className="flex flex-wrap gap-2">
                    <Badge
                        id="filter-entity-all"
                        variant={!selectedEntityType ? 'default' : 'outline'}
                        className="cursor-pointer select-none"
                        onClick={() => updateParams({ entityType: undefined })}
                    >
                        전체
                    </Badge>
                    {ENTITY_TYPES.map((type) => (
                        <Badge
                            id={`filter-entity-${type.value}`}
                            key={type.value}
                            variant={selectedEntityType === type.value ? 'default' : 'outline'}
                            className="cursor-pointer select-none"
                            onClick={() => updateParams({ entityType: type.value })}
                        >
                            {type.label}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* 필터 초기화 */}
            {hasActiveFilter && (
                <Button
                    id="radar-filter-clear"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground text-xs gap-1"
                    onClick={clearAll}
                    disabled={isPending}
                >
                    <X className="h-3 w-3" />
                    필터 초기화
                </Button>
            )}
        </div>
    );
}
