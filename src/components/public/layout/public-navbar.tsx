'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: '인사이트 레이더', href: '/insight-radar' },
    { label: '매거진', href: '/magazine' },
];

export function PublicNavbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

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
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'text-ui-label font-ui-label tracking-[0.05em] pb-1 transition-all duration-150 active:scale-95',
                                        isActive
                                            ? 'border-b-2 border-zi-primary text-zi-primary font-semibold'
                                            : 'text-slate-500 hover:text-zi-primary'
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}

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
            <div
                className={cn(
                    'fixed right-0 top-0 z-50 h-full w-72 bg-white shadow-2xl md:hidden',
                    'flex flex-col',
                    isOpen ? 'drawer-slide-in' : 'translate-x-full',
                )}
                style={{ transition: isOpen ? undefined : 'transform 0.2s ease-in' }}
                aria-hidden={!isOpen}
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
                <nav className="flex flex-col gap-1 px-4 py-6">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center rounded-lg px-4 py-3.5 text-[15px] font-medium tracking-wide transition-all active:scale-95',
                                    isActive
                                        ? 'bg-zi-primary text-white'
                                        : 'text-zi-on-surface hover:bg-zi-surface-container'
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
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
        </>
    );
}
