import Link from 'next/link';
import { BarChart3, Edit, Inbox, Link2 } from 'lucide-react';

export type OrgAdminTab = 'edit' | 'analytics' | 'link-analytics' | 'leads';

const TABS: Array<{ tab: OrgAdminTab; label: string; path: string; icon: React.ReactNode }> = [
    { tab: 'edit', label: '편집', path: '', icon: <Edit className="w-3.5 h-3.5" /> },
    { tab: 'analytics', label: '애널리틱스', path: '/analytics', icon: <BarChart3 className="w-3.5 h-3.5 text-emerald-600" /> },
    { tab: 'link-analytics', label: '링크 페이지 통계', path: '/link-analytics', icon: <Link2 className="w-3.5 h-3.5 text-indigo-600" /> },
    { tab: 'leads', label: '받은 연락처', path: '/leads', icon: <Inbox className="w-3.5 h-3.5 text-amber-600" /> },
];

/** 조직 관리 화면 공통 탭 (서버·클라이언트 컴포넌트 양쪽에서 사용) */
export function OrgAdminTabs({ orgId, active, unreadLeads }: { orgId: number | string; active: OrgAdminTab; unreadLeads?: number }) {
    return (
        <div className="flex gap-2 border-b overflow-x-auto">
            {TABS.map(({ tab, label, path, icon }) => {
                const badge =
                    tab === 'leads' && unreadLeads ? (
                        <span className="ml-0.5 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold leading-4 text-white tabular-nums" aria-label={`새 접수 ${unreadLeads}건`}>
                            {unreadLeads}
                        </span>
                    ) : null;
                return tab === active ? (
                    <span key={tab} className="pb-2 px-1 text-sm font-semibold border-b-2 border-foreground flex items-center gap-1.5 whitespace-nowrap" aria-current="page">
                        {icon}
                        {label}
                        {badge}
                    </span>
                ) : (
                    <Link
                        key={tab}
                        href={`/admin/companies/${orgId}${path}`}
                        className="pb-2 px-1 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 whitespace-nowrap"
                    >
                        {icon}
                        {label}
                        {badge}
                    </Link>
                );
            })}
        </div>
    );
}
