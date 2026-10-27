import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog';
import { prisma } from '@/lib/db';

export const metadata = {
    // 루트 template('%s | 진사이트')이 겹치지 않도록 absolute로 고정하고 하위 페이지용 template을 별도 지정
    title: {
        absolute: '진사이트 관리자',
        template: '%s | 진사이트 관리자',
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const pendingSubmissionsCount = await prisma.organizationSubmission
        .count({ where: { status: 'PENDING' } })
        .catch(() => 0);

    return (
        <ConfirmDialogProvider>
            <div className="flex min-h-screen flex-col md:flex-row">
                {/* Sidebar는 useSearchParams를 쓰므로 Suspense 경계 필요 */}
                <Suspense fallback={<div className="hidden md:block w-64 shrink-0 bg-slate-900" />}>
                    <Sidebar pendingSubmissionsCount={pendingSubmissionsCount} />
                </Suspense>
                <main className="flex-1 p-6 min-w-0">
                    {children}
                </main>
            </div>
        </ConfirmDialogProvider>
    );
}
