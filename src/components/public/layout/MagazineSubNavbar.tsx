'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, Building2, MapPin, LayoutGrid } from 'lucide-react';
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

    return (
        <nav aria-label="매거진 서브 네비게이션" className="sticky top-16 sm:top-20 z-40 w-full border-b border-zi-divider/80 bg-white/95 backdrop-blur-md shadow-2xs transition-all duration-200">
            <div className="mx-auto flex max-w-zi-container items-center px-4 sm:px-6">
                {/* 수평 스크롤 탭 컨테이너 (팝오버 짤림 문제 없는 직관적 칩 나열) */}
                <div className="flex items-center gap-1.5 sm:gap-2 py-2.5 overflow-x-auto scrollbar-none whitespace-nowrap text-xs sm:text-sm font-ui-label font-medium w-full">
                    
                    {/* 1. 매거진 포털 홈 */}
                    <Link
                        href="/magazine"
                        className={cn(
                            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-150 active:scale-95 shrink-0 border',
                            isHomeActive
                                ? 'bg-zi-primary border-zi-primary text-white font-bold shadow-xs'
                                : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:text-zi-primary hover:bg-slate-100'
                        )}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>매거진 홈</span>
                    </Link>

                    {/* 2. 테크 · 마케팅 저널 */}
                    <Link
                        href="/magazine/tech-marketing"
                        className={cn(
                            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-150 active:scale-95 shrink-0 border',
                            isTechActive
                                ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs'
                                : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70'
                        )}
                    >
                        <Newspaper className="w-3.5 h-3.5" />
                        <span>테크 · 마케팅 저널</span>
                    </Link>

                    {/* 3. 로컬 비즈니스 허브 */}
                    <Link
                        href="/magazine/local"
                        className={cn(
                            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-150 active:scale-95 shrink-0 border',
                            isLocalHubActive
                                ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs'
                                : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                        )}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>로컬 비즈니스 허브</span>
                    </Link>

                    {/* 구분을 위한 구별선 */}
                    {regions.length > 0 && (
                        <span className="text-slate-300 select-none text-xs px-1 shrink-0">|</span>
                    )}

                    {/* 4. 지자체별 지면 탭 칩 직접 나열 */}
                    {regions.map((reg) => {
                        const isThisRegion = currentRegionSlug === reg.slug;
                        return (
                            <Link
                                key={reg.id}
                                href={`/magazine/local/${reg.slug}`}
                                className={cn(
                                    'flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-150 active:scale-95 shrink-0 border text-xs',
                                    isThisRegion
                                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-xs'
                                        : 'bg-white border-slate-200 text-slate-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50/40'
                                )}
                            >
                                <MapPin className={cn("w-3 h-3", isThisRegion ? "text-rose-600" : "text-slate-400")} />
                                <span>{reg.name} 지면</span>
                            </Link>
                        );
                    })}

                </div>
            </div>
        </nav>
    );
}
