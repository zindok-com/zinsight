'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, Building2, MapPin, ChevronDown, Check, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Region {
    id: number;
    name: string;
    slug: string;
}

interface MagazineSubNavbarProps {
    regions?: Region[];
}

export function MagazineSubNavbar({ regions = [] }: MagazineSubNavbarProps) {
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 경로가 /magazine 으로 시작하는 페이지에서만 노출
    if (!pathname.startsWith('/magazine')) {
        return null;
    }

    // 경로 매칭 활성 판단
    const isHomeActive = pathname === '/magazine';
    const isTechActive = pathname.startsWith('/magazine/tech-marketing');
    const isLocalHubActive = pathname === '/magazine/local';
    
    // 현재 접속한 지자체 지면 확인 (/magazine/local/[regionSlug])
    const currentRegionSlug = pathname.startsWith('/magazine/local/') && pathname !== '/magazine/local'
        ? pathname.split('/')[3]
        : null;

    const currentRegion = currentRegionSlug 
        ? regions.find((r) => r.slug === currentRegionSlug)
        : null;

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 라우트 변경 시 드롭다운 닫기
    useEffect(() => {
        setIsDropdownOpen(false);
    }, [pathname]);

    return (
        <nav aria-label="매거진 서브 네비게이션" className="sticky top-16 sm:top-20 z-40 w-full border-b border-zi-divider/80 bg-white/95 backdrop-blur-md shadow-2xs transition-all duration-200">
            <div className="mx-auto flex max-w-zi-container items-center justify-between px-4 sm:px-6">
                {/* 탭 버튼 가로 스크롤 컨테이너 */}
                <div className="flex items-center gap-1.5 sm:gap-2 py-2 overflow-x-auto scrollbar-none whitespace-nowrap text-xs sm:text-sm font-ui-label font-medium w-full">
                    
                    {/* 1. 매거진 포털 홈 */}
                    <Link
                        href="/magazine"
                        className={cn(
                            'flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full transition-all duration-150 active:scale-95 shrink-0',
                            isHomeActive
                                ? 'bg-zi-primary text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:text-zi-primary hover:bg-slate-100/80'
                        )}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>매거진 홈</span>
                    </Link>

                    {/* 구분을 위한 미세 나눔선 */}
                    <span className="text-slate-300 select-none text-xs shrink-0">•</span>

                    {/* 2. 테크 · 마케팅 저널 */}
                    <Link
                        href="/magazine/tech-marketing"
                        className={cn(
                            'flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full transition-all duration-150 active:scale-95 shrink-0',
                            isTechActive
                                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70'
                        )}
                    >
                        <Newspaper className="w-3.5 h-3.5" />
                        <span>테크 · 마케팅 저널</span>
                    </Link>

                    {/* 구분을 위한 미세 나눔선 */}
                    <span className="text-slate-300 select-none text-xs shrink-0">•</span>

                    {/* 3. 로컬 비즈니스 허브 */}
                    <Link
                        href="/magazine/local"
                        className={cn(
                            'flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full transition-all duration-150 active:scale-95 shrink-0',
                            isLocalHubActive
                                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                        )}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>로컬 비즈니스 허브</span>
                    </Link>

                    {/* 구분을 위한 미세 나눔선 */}
                    <span className="text-slate-300 select-none text-xs shrink-0">•</span>

                    {/* 4. 지자체별 선택 드롭다운 스위처 */}
                    <div className="relative shrink-0" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen((prev) => !prev)}
                            className={cn(
                                'flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all duration-150 active:scale-95 border',
                                currentRegion
                                    ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold shadow-2xs'
                                    : isDropdownOpen
                                        ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold'
                                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50'
                            )}
                        >
                            <MapPin className={cn("w-3.5 h-3.5", currentRegion ? "text-rose-600" : "text-slate-400")} />
                            <span>
                                {currentRegion ? `${currentRegion.name} 지면` : '지자체 선택'}
                            </span>
                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                        </button>

                        {/* 지자체 퀵 선택 패널 */}
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-zi-divider rounded-zi-card shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-zi-divider/50 mb-1 flex items-center justify-between">
                                    <span>지자체 특화 지면 목록</span>
                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-normal">{regions.length}개 지역</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto py-1">
                                    <Link
                                        href="/magazine/local"
                                        className={cn(
                                            'flex items-center justify-between px-3.5 py-2 text-xs font-semibold transition-colors',
                                            isLocalHubActive ? 'text-emerald-700 bg-emerald-50/60' : 'text-slate-700 hover:bg-slate-50'
                                        )}
                                    >
                                        <span>🏛️ 전체 로컬 허브 홈</span>
                                        {isLocalHubActive && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                    </Link>
                                    <div className="my-1 border-t border-slate-100" />
                                    {regions.length > 0 ? (
                                        regions.map((reg) => {
                                            const isThisRegion = currentRegionSlug === reg.slug;
                                            return (
                                                <Link
                                                    key={reg.id}
                                                    href={`/magazine/local/${reg.slug}`}
                                                    className={cn(
                                                        'flex items-center justify-between px-3.5 py-2 text-xs transition-colors',
                                                        isThisRegion 
                                                            ? 'text-rose-700 bg-rose-50 font-bold' 
                                                            : 'text-slate-700 hover:bg-slate-50 font-medium'
                                                    )}
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className={cn("w-3 h-3", isThisRegion ? "text-rose-600" : "text-slate-400")} />
                                                        {reg.name} 지면
                                                    </span>
                                                    {isThisRegion && <Check className="w-3.5 h-3.5 text-rose-600" />}
                                                </Link>
                                            );
                                        })
                                    ) : (
                                        <div className="px-3.5 py-2 text-xs text-slate-400 italic">
                                            개설된 지자체가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
