'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, ChevronUp, MapPin, Newspaper, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicNavbarProps {
    regions?: any[];
}

export function PublicNavbar({ regions = [] }: PublicNavbarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [mobileMagazineOpen, setMobileMagazineOpen] = useState(false);

    // 메뉴 열릴 때 body 스크롤 잠금
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // 경로 변경 시 메뉴 닫기
    useEffect(() => {
        setIsOpen(false);
        setMobileMagazineOpen(false);
    }, [pathname]);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-zi-divider bg-white">
                <div className="mx-auto flex h-16 sm:h-20 max-w-zi-container items-center justify-between px-4 sm:px-6">
                    {/* 로고 */}
                    <Link
                        href="/"
                        className="text-xl sm:text-2xl font-bold tracking-tighter text-zi-primary font-h2"
                    >
                        Zinsight
                    </Link>

                    {/* 데스크탑 네비게이션 */}
                    <nav className="hidden items-center gap-10 md:flex">
                        {/* 인사이트 레이더 단일 링크 */}
                        <Link
                            href="/insight-radar"
                            className={cn(
                                'text-ui-label font-ui-label tracking-[0.05em] pb-1 transition-all duration-150 active:scale-95',
                                pathname.startsWith('/insight-radar')
                                    ? 'border-b-2 border-zi-primary text-zi-primary font-semibold'
                                    : 'text-slate-500 hover:text-zi-primary'
                            )}
                        >
                            인사이트 레이더
                        </Link>

                        {/* 매거진 드롭다운 메뉴 (Hover Trigger) */}
                        <div className="relative group py-2">
                            <button
                                className={cn(
                                    'flex items-center gap-1 text-ui-label font-ui-label tracking-[0.05em] pb-1 transition-all duration-150 group-hover:text-zi-primary',
                                    pathname.startsWith('/magazine')
                                        ? 'border-b-2 border-zi-primary text-zi-primary font-semibold'
                                        : 'text-slate-500 hover:text-zi-primary'
                                )}
                            >
                                매거진
                                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
                            </button>

                            {/* 드롭다운 서브메뉴 판넬 */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 hidden group-hover:block w-[360px] bg-white border border-zi-divider rounded-zi-card shadow-xl p-5 mt-1 z-50 animate-fade-in before:content-[''] before:absolute before:h-4 before:-top-4 before:left-0 before:right-0">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* 저널 카테고리 */}
                                    <div className="space-y-3.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block border-b border-zi-divider pb-1 flex items-center gap-1">
                                            <Newspaper className="w-3 h-3 text-indigo-500" /> Journals
                                        </span>
                                        <div className="flex flex-col gap-2.5">
                                            <Link href="/magazine" className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                                                매거진 포털 홈
                                            </Link>
                                            <Link href="/magazine/tech-marketing" className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                                                테크 · 마케팅 저널
                                            </Link>
                                            <Link href="/magazine/local" className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                                                로컬 비즈니스 허브
                                            </Link>
                                        </div>
                                    </div>

                                    {/* 지자체별 지면 */}
                                    <div className="space-y-3.5 border-l border-zi-divider pl-6">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block border-b border-zi-divider pb-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-rose-500" /> B2G Regions
                                        </span>
                                        <div className="flex flex-col gap-2">
                                            {regions && regions.length > 0 ? (
                                                regions.map((reg) => (
                                                    <Link
                                                        key={reg.id}
                                                        href={`/magazine/local/${reg.slug}`}
                                                        className="text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                                                    >
                                                        {reg.name} 지면
                                                    </Link>
                                                ))
                                            ) : (
                                                <span className="text-[11px] text-slate-400 italic">개설된 지면이 없습니다.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 회사 홈페이지 CTA */}
                        <Link
                            href="https://www.zindok.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-zi-btn border border-zi-primary bg-transparent px-5 py-2 text-ui-label font-ui-label text-zi-primary transition-all hover:bg-zi-primary hover:text-white active:scale-95"
                        >
                            Zindok 바로가기
                        </Link>
                    </nav>

                    {/* 모바일 햄버거 버튼 */}
                    <button
                        className="flex items-center justify-center rounded-md p-2 text-zi-primary transition-colors hover:bg-zi-surface-container md:hidden"
                        onClick={() => setIsOpen(true)}
                        aria-label="메뉴 열기"
                        aria-expanded={isOpen}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </header>

            {/* 모바일 드로어 오버레이 */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-label="메뉴 닫기"
                />
            )}

            {/* 모바일 드로어 패널 */}
            {isOpen && (
                <div
                    className="fixed right-0 top-0 z-50 h-full w-72 bg-white shadow-2xl md:hidden flex flex-col drawer-slide-in"
                >
                    {/* 드로어 헤더 */}
                    <div className="flex items-center justify-between border-b border-zi-divider px-6 py-5">
                        <span className="text-lg font-bold tracking-tighter text-zi-primary">
                            Zinsight
                        </span>
                        <button
                            className="rounded-md p-1.5 text-zi-outline transition-colors hover:bg-zi-surface-container"
                            onClick={() => setIsOpen(false)}
                            aria-label="메뉴 닫기"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* 드로어 네비게이션 */}
                    <nav className="flex flex-col gap-1.5 px-4 py-6 overflow-y-auto">
                        {/* 레이더 단일 링크 */}
                        <Link
                            href="/insight-radar"
                            className={cn(
                                'flex items-center rounded-lg px-4 py-3.5 text-[15px] font-medium tracking-wide transition-all active:scale-95',
                                pathname.startsWith('/insight-radar')
                                    ? 'bg-zi-primary text-white font-semibold'
                                    : 'text-zi-on-surface hover:bg-zi-surface-container'
                            )}
                        >
                            인사이트 레이더
                        </Link>

                        {/* 매거진 대메뉴 + 아코디언 토글 */}
                        <div>
                            <button
                                onClick={() => setMobileMagazineOpen(!mobileMagazineOpen)}
                                className={cn(
                                    'flex w-full items-center justify-between rounded-lg px-4 py-3.5 text-[15px] font-medium tracking-wide transition-all',
                                    pathname.startsWith('/magazine')
                                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                                        : 'text-zi-on-surface hover:bg-zi-surface-container'
                                )}
                            >
                                <span>매거진</span>
                                {mobileMagazineOpen ? (
                                    <ChevronUp className="w-4 h-4 text-slate-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                )}
                            </button>

                            {/* 모바일 매거진 서브 아코디언 링크 */}
                            {mobileMagazineOpen && (
                                <div className="mt-1 ml-4 pl-4 border-l-2 border-indigo-100 flex flex-col gap-1">
                                    <Link
                                        href="/magazine"
                                        className="text-slate-700 text-xs font-semibold py-2 hover:text-indigo-600"
                                    >
                                        • 매거진 홈
                                    </Link>
                                    <Link
                                        href="/magazine/tech-marketing"
                                        className="text-slate-700 text-xs font-semibold py-2 hover:text-indigo-600"
                                    >
                                        • 테크 · 마케팅 저널
                                    </Link>
                                    <Link
                                        href="/magazine/local"
                                        className="text-slate-700 text-xs font-semibold py-2 hover:text-indigo-600"
                                    >
                                        • 로컬 비즈니스 허브
                                    </Link>

                                    {/* 지자체 목록 */}
                                    {regions && regions.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                            <span className="text-[10px] text-slate-400 font-bold block mb-1">지자체 지면</span>
                                            {regions.map((reg) => (
                                                <Link
                                                    key={reg.id}
                                                    href={`/magazine/local/${reg.slug}`}
                                                    className="text-slate-500 text-xs font-medium py-1.5 block hover:text-indigo-600"
                                                >
                                                    - {reg.name} 지면
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* 드로어 하단 CTA */}
                    <div className="mt-auto border-t border-zi-divider px-4 py-6">
                        <Link
                            href="https://www.zindok.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center rounded-zi-btn border border-zi-primary bg-transparent px-5 py-3 text-sm font-semibold text-zi-primary transition-all hover:bg-zi-primary hover:text-white active:scale-95"
                        >
                            Zindok 바로가기 →
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
