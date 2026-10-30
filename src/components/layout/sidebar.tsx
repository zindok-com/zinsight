'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Building2,
    Tags,
    Newspaper,
    Download,
    Menu,
    Briefcase,
    ShieldCheck,
    ArrowLeftRight,
    Users,
    Image,
    Globe2,
    SearchCheck,
    TrendingUp,
    PlugZap,
    FileBarChart2,
    FileCheck2,
    Sparkles,
    ClipboardList,
    QrCode,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
}

const DASHBOARD_ITEMS: NavItem[] = [
    { name: '대시보드', href: '/admin', icon: LayoutDashboard },
];

// 관제 센터는 한 페이지의 탭 구성이므로 ?tab= 값까지 비교해 현재 탭만 활성 표시
const CONTROL_ITEMS: NavItem[] = [
    { name: '관제 종합 현황', href: '/admin/seo-monitoring?tab=overview', icon: Globe2 },
    { name: '유입·실시간 방문자', href: '/admin/seo-monitoring?tab=traffic', icon: TrendingUp },
    { name: '구글 색인 모니터링', href: '/admin/seo-monitoring?tab=indexing', icon: SearchCheck },
    { name: 'API 연동 진단', href: '/admin/seo-monitoring?tab=apis', icon: PlugZap },
    { name: '애널리틱스 리포트', href: '/admin/analytics/reports', icon: FileBarChart2 },
];

const CONTENT_ITEMS: NavItem[] = [
    { name: '매거진 포스트', href: '/admin/magazine', icon: Newspaper },
    { name: '헤드라인 설정', href: '/admin/magazine/headlines', icon: Sparkles },
    { name: '발행자 관리', href: '/admin/magazine/authors', icon: Users },
    { name: '리포트 신청 목록', href: '/admin/magazine/requests', icon: ClipboardList },
];

const SETTINGS_ITEMS: NavItem[] = [
    { name: '보안 설정', href: '/admin/settings', icon: ShieldCheck },
    { name: '리다이렉트 관리', href: '/admin/settings/redirects', icon: ArrowLeftRight },
    { name: 'QR 연결 관리', href: '/admin/settings/qr-links', icon: QrCode },
];

export function Sidebar({ pendingSubmissionsCount = 0 }: { pendingSubmissionsCount?: number }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const dataItems: NavItem[] = [
        { name: '조직 관리', href: '/admin/companies', icon: Briefcase },
        {
            name: '기관 등록 신청',
            href: '/admin/companies/submissions',
            icon: FileCheck2,
            badge: pendingSubmissionsCount > 0 ? pendingSubmissionsCount : undefined,
        },
        { name: '지역(지자체) 관리', href: '/admin/magazine/regions', icon: Building2 },
        { name: '키워드 관리', href: '/admin/keywords', icon: Tags },
        { name: '기사 관리', href: '/admin/articles', icon: Newspaper },
        { name: '미디어 보관함', href: '/admin/storage', icon: Image },
        { name: '데이터 내보내기', href: '/admin/export', icon: Download },
    ];

    // 모바일 메뉴가 열려 있을 때 배경 스크롤 잠금 및 Esc로 닫기
    useEffect(() => {
        if (!mobileMenuOpen) return;
        document.body.style.overflow = 'hidden';
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileMenuOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [mobileMenuOpen]);

    const renderNavItems = (items: NavItem[]) => (
        <div className="space-y-1">
            {items.map((item) => {
                const [itemBaseHref, itemQuery] = item.href.split('?');
                const itemTab = itemQuery ? new URLSearchParams(itemQuery).get('tab') : null;
                const isActive = itemTab
                    ? pathname === itemBaseHref && (searchParams.get('tab') ?? 'overview') === itemTab
                    : pathname === itemBaseHref || (
                    itemBaseHref !== '/admin' &&
                    pathname.startsWith(itemBaseHref) &&
                    !items.some(other => {
                        const otherBase = other.href.split('?')[0];
                        return otherBase !== itemBaseHref &&
                            pathname.startsWith(otherBase) &&
                            otherBase.length > itemBaseHref.length;
                    })
                );
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                                ? "bg-slate-700 text-white"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <span className="flex items-center gap-3 min-w-0">
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.name}</span>
                        </span>
                        {item.badge != null && item.badge > 0 && (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold leading-none text-white bg-rose-500 rounded-full shrink-0">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="md:hidden sticky top-0 z-30 bg-white p-4 border-b flex items-center justify-between">
                <Link href="/" className="font-bold text-lg hover:text-slate-600 transition-colors">
                    진사이트
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? '관리자 메뉴 닫기' : '관리자 메뉴 열기'}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="admin-sidebar"
                >
                    <Menu />
                </Button>
            </div>

            {/* Sidebar Container */}
            <aside id="admin-sidebar" className={cn(
                "bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 w-64 transition-[transform,visibility] duration-300 ease-in-out md:translate-x-0 md:visible md:static md:flex md:flex-col md:self-stretch md:min-h-screen",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full invisible"
            )}>
                <div className="p-6 border-b border-slate-700">
                    <Link href="/" className="hover:text-slate-300 transition-colors block">
                        <span className="block text-2xl font-bold tracking-tight">진사이트</span>
                    </Link>
                    <p className="text-xs text-slate-400 mt-1">Admin Dashboard</p>
                </div>

                <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
                    {renderNavItems(DASHBOARD_ITEMS)}

                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-3">
                            관제 · 애널리틱스
                        </p>
                        {renderNavItems(CONTROL_ITEMS)}
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-3">
                            콘텐츠 (매거진)
                        </p>
                        {renderNavItems(CONTENT_ITEMS)}
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-3">
                            데이터 (레이더 · 보관함)
                        </p>
                        {renderNavItems(dataItems)}
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-3">
                            설정
                        </p>
                        {renderNavItems(SETTINGS_ITEMS)}
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
                    v3.2.0 (SEO·AEO Edition)
                </div>
            </aside>

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}
        </>
    );
}
