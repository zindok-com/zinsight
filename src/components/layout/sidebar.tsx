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
    Users,
    Image,
    Globe2,
    SearchCheck,
    TrendingUp,
    PlugZap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

const TOP_MENU_ITEMS = [
    { name: '대시보드', href: '/admin', icon: LayoutDashboard },
    { name: '지역(지자체) 관리', href: '/admin/magazine/regions', icon: Building2 },
    { name: '보안 설정', href: '/admin/settings', icon: ShieldCheck },
    { name: '리다이렉트 관리', href: '/admin/settings/redirects', icon: ShieldCheck },
    { name: '이미지 보관함', href: '/admin/storage', icon: Image },
];

// 관제 센터는 한 페이지의 탭 구성이므로 ?tab= 값까지 비교해 현재 탭만 활성 표시
const SEO_GEO_AEO_ITEMS = [
    { name: '관제 종합 현황', href: '/admin/seo-monitoring?tab=overview', icon: Globe2 },
    { name: '유입·실시간 방문자', href: '/admin/seo-monitoring?tab=traffic', icon: TrendingUp },
    { name: '구글 색인 모니터링', href: '/admin/seo-monitoring?tab=indexing', icon: SearchCheck },
    { name: 'API 연동 진단', href: '/admin/seo-monitoring?tab=apis', icon: PlugZap },
];

const INSIGHT_RADAR_ITEMS = [
    { name: '조직 관리', href: '/admin/companies', icon: Briefcase },
    { name: '키워드 관리', href: '/admin/keywords', icon: Tags },
    { name: '기사 관리', href: '/admin/articles', icon: Newspaper },
    { name: '데이터 내보내기', href: '/admin/export', icon: Download },
];

const MAGAZINE_ITEMS = [
    { name: '매거진 포스트', href: '/admin/magazine', icon: Newspaper },
    { name: '헤드라인 설정', href: '/admin/magazine/headlines', icon: LayoutDashboard },
    { name: '발행자 관리', href: '/admin/magazine/authors', icon: Users },
    { name: '리포트 신청 목록', href: '/admin/magazine/requests', icon: Tags },
];

export function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    const renderNavItems = (items: typeof INSIGHT_RADAR_ITEMS) => (
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
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                                ? "bg-slate-700 text-white"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
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
            {/* 모바일에서 닫혀 있을 때는 invisible로 키보드 탭 이동 대상에서도 제외 */}
            <aside id="admin-sidebar" className={cn(
                "bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 w-64 transition-[transform,visibility] duration-300 ease-in-out md:translate-x-0 md:visible md:static md:flex md:flex-col md:self-stretch md:min-h-screen",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full invisible"
            )}>
                <div className="p-6 border-b border-slate-700">
                    <Link href="/" className="hover:text-slate-300 transition-colors block">
                        {/* 각 관리자 페이지에 자체 h1이 있으므로 사이드바 로고는 제목 요소로 쓰지 않음 */}
                        <span className="block text-2xl font-bold tracking-tight">진사이트</span>
                    </Link>
                    <p className="text-xs text-slate-400 mt-1">Admin Dashboard</p>
                </div>

                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    {renderNavItems(TOP_MENU_ITEMS)}

                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                            검색·AI 최적화 관제
                        </p>
                        {renderNavItems(SEO_GEO_AEO_ITEMS)}
                    </div>

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
