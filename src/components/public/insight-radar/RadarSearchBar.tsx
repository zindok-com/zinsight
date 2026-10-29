'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { RADAR_SORTS, RADAR_SORT_LABEL, type RadarSort } from '@/lib/radar';

interface RadarSearchBarProps {
    regions: { id: number; name: string }[];
    entityTypes: string[];
    currentRegionId?: number;
    currentEntityType?: string;
    currentQuery?: string;
    currentSort: RadarSort;
    total: number;
    /** 조직 수가 적으면 정렬 UI를 숨김 */
    showSort: boolean;
}

/**
 * 지역 셀렉트 · 유형 칩 · 검색 · 결과 건수를 한 줄로 압축한 툴바.
 * GET 폼이라 JS 없이도 동작하고, JS가 있으면 셀렉트 변경 시 바로 적용한다.
 */
export function RadarSearchBar({
    regions,
    entityTypes,
    currentRegionId,
    currentEntityType,
    currentQuery,
    currentSort,
    total,
    showSort,
}: RadarSearchBarProps) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    // 폼 값으로 쿼리 구성 (빈 값·기본 정렬은 생략해 URL을 짧게 유지)
    const buildHref = (overrides: Record<string, string | undefined> = {}) => {
        const sp = new URLSearchParams();
        const form = formRef.current;
        const values: Record<string, string | undefined> = {
            regionId: form ? (form.elements.namedItem('regionId') as HTMLSelectElement).value : currentRegionId?.toString(),
            entityType: currentEntityType,
            q: form ? (form.elements.namedItem('q') as HTMLInputElement).value.trim() : currentQuery,
            sort: form && showSort ? (form.elements.namedItem('sort') as HTMLSelectElement).value : currentSort,
            ...overrides,
        };
        for (const [key, value] of Object.entries(values)) {
            if (!value || (key === 'sort' && value === 'recent')) continue;
            sp.set(key, value);
        }
        const qs = sp.toString();
        return qs ? `/insight-radar?${qs}` : '/insight-radar';
    };

    // 칩 링크는 서버 렌더링 시점의 현재 조건 기준으로 생성 (JS 없이도 이동 가능)
    const chipHref = (entityType?: string) => {
        const sp = new URLSearchParams();
        if (currentRegionId) sp.set('regionId', String(currentRegionId));
        if (entityType) sp.set('entityType', entityType);
        if (currentQuery) sp.set('q', currentQuery);
        if (currentSort !== 'recent') sp.set('sort', currentSort);
        const qs = sp.toString();
        return qs ? `/insight-radar?${qs}` : '/insight-radar';
    };

    const hasFilter = !!(currentRegionId || currentEntityType || currentQuery);

    return (
        <div className="mb-5 sm:mb-6">
            <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zi-primary break-keep">
                    관심 있는 조직과 기술 트렌드를 탐색하세요
                </h1>
                <p className="mt-1 text-sm text-slate-600">관내 기업·기관을 지역별로 탐색하세요</p>
            </div>

            <form
                ref={formRef}
                action="/insight-radar"
                method="get"
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    router.push(buildHref());
                }}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:flex-row lg:items-center"
            >
                {currentEntityType && <input type="hidden" name="entityType" value={currentEntityType} />}
                <label htmlFor="radar-region" className="sr-only">지역</label>
                <select
                    id="radar-region"
                    name="regionId"
                    defaultValue={currentRegionId?.toString() ?? ''}
                    onChange={() => router.push(buildHref())}
                    className="h-11 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 lg:w-40"
                >
                    <option value="">전체 지역</option>
                    {regions.map((reg) => (
                        <option key={reg.id} value={reg.id}>
                            {reg.name}
                        </option>
                    ))}
                </select>

                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <label htmlFor="radar-q" className="sr-only">조직 검색</label>
                    <input
                        id="radar-q"
                        key={currentQuery ?? ''}
                        type="search"
                        name="q"
                        defaultValue={currentQuery ?? ''}
                        maxLength={100}
                        placeholder="조직명, 핵심 키워드, 관련 기술 검색"
                        className="h-11 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="submit"
                        className="h-11 flex-1 rounded-lg bg-zi-blue px-5 text-sm font-bold text-white hover:bg-blue-700 lg:flex-none"
                    >
                        검색
                    </button>
                    {hasFilter && (
                        <Link
                            href="/insight-radar"
                            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-zi-primary"
                            aria-label="검색 조건 초기화"
                        >
                            <X className="h-4 w-4" />
                        </Link>
                    )}
                </div>
                {showSort && (
                    <>
                        <label htmlFor="radar-sort" className="sr-only">정렬</label>
                        <select
                            id="radar-sort"
                            name="sort"
                            defaultValue={currentSort}
                            onChange={() => router.push(buildHref())}
                            className="h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                            {RADAR_SORTS.map((s) => (
                                <option key={s} value={s}>
                                    {RADAR_SORT_LABEL[s]}
                                </option>
                            ))}
                        </select>
                    </>
                )}
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {entityTypes.length > 1 ? (
                    <ul className="flex flex-wrap gap-1.5" aria-label="조직 유형">
                        {[undefined, ...entityTypes].map((type) => {
                            const active = (currentEntityType ?? undefined) === type;
                            return (
                                <li key={type ?? 'all'}>
                                    <Link
                                        href={chipHref(type)}
                                        aria-current={active ? 'page' : undefined}
                                        className={`inline-flex min-h-11 items-center rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                                            active
                                                ? 'border-zi-primary bg-zi-primary text-white'
                                                : 'border-slate-300 bg-white text-slate-700 hover:border-zi-primary hover:text-zi-primary'
                                        }`}
                                    >
                                        {type ?? '전체'}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <span />
                )}
                <p className="text-sm text-slate-600" aria-live="polite">
                    <strong className="font-bold text-zi-primary tabular-nums">{total.toLocaleString()}</strong>개
                </p>
            </div>
        </div>
    );
}
