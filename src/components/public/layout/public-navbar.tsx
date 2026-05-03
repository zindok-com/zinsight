'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: '인사이트 레이더', href: '/insight-radar' },
    { label: '매거진', href: '/magazine' },
    { label: '소개', href: '/about' },
];

export function PublicNavbar() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zi-divider bg-white">
            <div className="mx-auto flex h-20 max-w-zi-container items-center justify-between px-6">
                {/* 로고 */}
                <div className="flex items-center gap-12">
                    <Link
                        href="/"
                        className="text-xl font-bold tracking-tighter text-zi-primary font-h2"
                    >
                        Zinsight
                    </Link>

                    {/* 데스크탑 네비게이션 */}
                    <nav className="hidden items-center gap-8 md:flex">
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
                    </nav>
                </div>

                {/* 우측 액션 */}
                <div className="flex items-center gap-4">
                    <button
                        className="p-2 text-slate-500 transition-colors hover:text-zi-navy"
                        aria-label="검색"
                    >
                        <Search className="h-5 w-5" />
                    </button>

                    {/* 어드민 링크 (소형 배지 형태) */}
                    <Link
                        href="/admin"
                        className="hidden rounded-none border border-zi-navy px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zi-navy transition-colors hover:bg-zi-navy hover:text-white md:block"
                    >
                        Admin
                    </Link>
                </div>
            </div>
        </header>
    );
}
