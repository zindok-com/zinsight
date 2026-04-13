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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const MENU_ITEMS = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Industries', href: '/admin/industries', icon: Building2 },
    { name: 'Keywords', href: '/admin/keywords', icon: Tags },
    { name: 'Articles', href: '/admin/articles', icon: Newspaper },
    { name: 'Export', href: '/admin/export', icon: Download },
];

export function Sidebar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="md:hidden p-4 border-b flex items-center justify-between">
                <div className="font-bold text-lg">MICE Scout</div>
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
                    <h1 className="text-2xl font-bold tracking-tight">MICE Scout</h1>
                    <p className="text-xs text-slate-400 mt-1">Admin Dashboard</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
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
                </nav>

                <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
                    v3.0.0 (DB Edition)
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
