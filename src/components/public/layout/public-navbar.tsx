'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: '인사이트 레이더', href: '/insight-radar' },
    { label: '매거진', href: '/magazine' },
];

export function PublicNavbar() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zi-divider bg-white">
            <div className="mx-auto flex h-20 max-w-zi-container items-center justify-between px-6">
                {/* 로고 */}
                <Link
                    href="/"
                    className="text-2xl font-bold tracking-tighter text-zi-primary font-h2"
                >
                    Zinsight
                </Link>

                {/* 데스크탑 네비게이션 (우측 정렬) */}
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
            </div>
        </header>
    );
}
