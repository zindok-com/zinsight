'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Building2,
    Tags,
    Newspaper,
    Download,
    Menu,
    Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const TOP_MENU_ITEMS = [
    { name: '대시보드', href: '/admin', icon: LayoutDashboard },
];

const INSIGHT_RADAR_ITEMS = [
    { name: '산업 관리', href: '/admin/industries', icon: Building2 },
    { name: '조직 관리', href: '/admin/companies', icon: Briefcase },
    { name: '키워드 관리', href: '/admin/keywords', icon: Tags },
    { name: '기사 관리', href: '/admin/articles', icon: Newspaper },
    { name: '데이터 내보내기', href: '/admin/export', icon: Download },
];

const MAGAZINE_ITEMS = [
    { name: '매거진 포스트', href: '/admin/magazine', icon: Newspaper },
    { name: '헤드라인 설정', href: '/admin/magazine/headlines', icon: LayoutDashboard },
    { name: '리포트 신청 목록', href: '/admin/magazine/requests', icon: Tags },
];

export function Sidebar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const renderNavItems = (items: typeof INSIGHT_RADAR_ITEMS) => (
        <div className="space-y-1">
            {items.map((item) => {
                const isActive = pathname === item.href || (
                    item.href !== '/admin' && 
                    pathname.startsWith(item.href) && 
                    !items.some(other => 
                        other.href !== item.href && 
                        pathname.startsWith(other.href) && 
                        other.href.length > item.href.length
                    )
                );
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                                ? "bg-slate-700 text-white"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                    </Link>
                );
            })}
        </div>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="md:hidden p-4 border-b flex items-center justify-between">
                <div className="font-bold text-lg">zinsight</div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <Menu />
                </Button>
            </div>

            {/* Sidebar Container */}
            <aside className={cn(
                "bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-2xl font-bold tracking-tight">zinsight</h1>
                    <p className="text-xs text-slate-400 mt-1">Admin Dashboard</p>
                </div>

                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    {renderNavItems(TOP_MENU_ITEMS)}

                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                            Insight Radar
                        </p>
                        {renderNavItems(INSIGHT_RADAR_ITEMS)}
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                            Magazine
                        </p>
                        {renderNavItems(MAGAZINE_ITEMS)}
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
                    v3.1.0 (Magazine Edition)
                </div>
            </aside>

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
