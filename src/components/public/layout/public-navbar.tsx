'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, ChevronUp, MapPin, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import { getContactLink, getHeaderLinks, getMagazineSubLinks, type NavLink } from '@/config/navigation';

interface PublicNavbarProps {
    regions?: Array<{ id: number | string; name: string; slug: string }>;
}

// 메뉴 정의는 src/config/navigation.ts (노출 여부는 src/config/site.ts)
const magazineLinks = getMagazineSubLinks();
const headerLinks = getHeaderLinks();
const contactLink = getContactLink();

function externalProps(link: NavLink) {
    return link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}

export function PublicNavbar({ regions = [] }: PublicNavbarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [mobileMagazineOpen, setMobileMagazineOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const openMenu = () => {
        // 매거진 하위 페이지에 있으면 아코디언을 펼친 상태로 열어 현재 위치를 바로 보여줌
        setMobileMagazineOpen(pathname.startsWith('/magazine'));
        setIsOpen(true);
    };

    // 메뉴 열릴 때 body 스크롤 잠금, 닫기 버튼으로 포커스 이동, Esc로 닫기
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        const menuButton = menuButtonRef.current;
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKeyDown);
            menuButton?.focus();
        };
    }, [isOpen]);

    // 경로 변경 시 메뉴 닫기
    useEffect(() => {
        setIsOpen(false);
        setMobileMagazineOpen(false);
    }, [pathname]);

    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-zi-divider bg-white">
                <div className="mx-auto flex h-16 sm:h-20 max-w-zi-container items-center justify-between px-4 sm:px-6">
                    {/* 로고 */}
                    <Link
                        href="/"
                        className="text-xl sm:text-2xl font-bold tracking-tighter text-zi-primary font-h2"
                    >
                        {siteConfig.brand.name}
                    </Link>

                    {/* 데스크탑 네비게이션: 매거진 / 인사이트 레이더 / 서비스 / 진사이트 소개 / 문의 */}
                    <nav className="hidden items-center gap-6 lg:gap-10 md:flex">
                        {/* 매거진 드롭다운 메뉴 (Hover Trigger) */}
                        <div className="relative group py-2">
                            <button
                                aria-haspopup="true"
                                className={cn(
                                    'flex items-center gap-1 text-ui-label font-ui-label tracking-[0.05em] pb-1 transition-all duration-150 group-hover:text-zi-primary',
                                    pathname.startsWith('/magazine')
                                        ? 'border-b-2 border-zi-primary text-zi-primary font-semibold'
                                        : 'text-slate-500 hover:text-zi-primary'
                                )}
                            >
                                매거진
                                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
                            </button>

                            {/* 드롭다운 서브메뉴 판넬 */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 hidden group-hover:block group-focus-within:block w-[360px] bg-white border border-zi-divider rounded-zi-card shadow-xl p-5 mt-1 z-50 animate-fade-in before:content-[''] before:absolute before:h-4 before:-top-4 before:left-0 before:right-0">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* 매거진 구분 */}
                                    <div className="space-y-3.5">
                                        <span className="text-[11px] font-bold tracking-widest text-slate-400 block border-b border-zi-divider pb-1 flex items-center gap-1">
                                            <Newspaper className="w-3 h-3 text-indigo-500" /> 매거진
                                        </span>
                                        <div className="flex flex-col gap-2.5">
                                            {magazineLinks.map((link) => (
                                                <Link key={link.href} href={link.href} className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                                                    {link.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 지자체별 지면 */}
                                    <div className="space-y-3.5 border-l border-zi-divider pl-6">
                                        <span className="text-[11px] font-bold tracking-widest text-slate-400 block border-b border-zi-divider pb-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-rose-500" /> 지역 지면
                                        </span>
                                        <div className="flex flex-col gap-2">
                                            {regions.length > 0 ? (
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

                        {headerLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                {...externalProps(link)}
                                className={cn(
                                    'text-ui-label font-ui-label tracking-[0.05em] pb-1 transition-all duration-150 active:scale-95',
                                    isActive(link.href)
                                        ? 'border-b-2 border-zi-primary text-zi-primary font-semibold'
                                        : 'text-slate-500 hover:text-zi-primary'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* 문의 CTA (연결 대상은 설정 contact) */}
                        <Link
                            href={contactLink.href}
                            {...externalProps(contactLink)}
                            className="rounded-zi-btn border border-zi-primary bg-transparent px-5 py-2 text-ui-label font-ui-label text-zi-primary transition-all hover:bg-zi-primary hover:text-white active:scale-95"
                        >
                            {contactLink.label}
                        </Link>
                    </nav>

                    {/* 모바일 햄버거 버튼 */}
                    <button
                        ref={menuButtonRef}
                        className="flex h-11 w-11 items-center justify-center rounded-md text-zi-primary transition-colors hover:bg-zi-surface-container md:hidden"
                        onClick={openMenu}
                        aria-label="메뉴 열기"
                        aria-expanded={isOpen}
                        aria-controls="mobile-nav-drawer"
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
                    aria-hidden="true"
                />
            )}

            {/* 모바일 드로어 패널 */}
            {isOpen && (
                <div
                    id="mobile-nav-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-label="사이트 메뉴"
                    className="fixed right-0 top-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-2xl md:hidden flex flex-col drawer-slide-in"
                >
                    {/* 드로어 헤더 */}
                    <div className="flex items-center justify-between border-b border-zi-divider px-6 py-5">
                        <span className="text-lg font-bold tracking-tighter text-zi-primary">
                            {siteConfig.brand.name}
                        </span>
                        <button
                            ref={closeButtonRef}
                            className="flex h-10 w-10 items-center justify-center rounded-md text-zi-outline transition-colors hover:bg-zi-surface-container"
                            onClick={() => setIsOpen(false)}
                            aria-label="메뉴 닫기"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* 드로어 네비게이션 */}
                    <nav className="flex flex-col gap-1.5 px-4 py-6 overflow-y-auto">
                        {/* 매거진 대메뉴 + 아코디언 토글 */}
                        <div>
                            <button
                                onClick={() => setMobileMagazineOpen(!mobileMagazineOpen)}
                                aria-expanded={mobileMagazineOpen}
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
                                    {magazineLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            aria-current={pathname === link.href ? 'page' : undefined}
                                            className={cn('text-sm font-semibold py-2.5 hover:text-indigo-600', pathname === link.href ? 'text-indigo-600' : 'text-slate-700')}
                                        >
                                            • {link.label}
                                        </Link>
                                    ))}

                                    {/* 지자체 목록 */}
                                    {regions.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                            <span className="text-[11px] text-slate-400 font-bold block mb-1">지역 지면</span>
                                            {regions.map((reg) => (
                                                <Link
                                                    key={reg.id}
                                                    href={`/magazine/local/${reg.slug}`}
                                                    aria-current={pathname.startsWith(`/magazine/local/${reg.slug}`) ? 'page' : undefined}
                                                    className={cn('text-sm font-medium py-2 block hover:text-indigo-600', pathname.startsWith(`/magazine/local/${reg.slug}`) ? 'text-indigo-600' : 'text-slate-500')}
                                                >
                                                    - {reg.name} 지면
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {headerLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                {...externalProps(link)}
                                className={cn(
                                    'flex items-center rounded-lg px-4 py-3.5 text-[15px] font-medium tracking-wide transition-all active:scale-95',
                                    isActive(link.href)
                                        ? 'bg-zi-primary text-white font-semibold'
                                        : 'text-zi-on-surface hover:bg-zi-surface-container'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* 드로어 하단 CTA: 문의 */}
                    <div className="mt-auto border-t border-zi-divider px-4 py-6">
                        <Link
                            href={contactLink.href}
                            {...externalProps(contactLink)}
                            className="flex w-full items-center justify-center rounded-zi-btn border border-zi-primary bg-transparent px-5 py-3 text-sm font-semibold text-zi-primary transition-all hover:bg-zi-primary hover:text-white active:scale-95"
                        >
                            {contactLink.label}
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
