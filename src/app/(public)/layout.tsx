import { PublicNavbar } from '@/components/public/layout/public-navbar';
import { PublicFooter } from '@/components/public/layout/public-footer';

// title·description은 루트 레이아웃 값을 그대로 사용 (여기서 재선언하면 title template이 중복 적용됨)

import { prisma } from '@/lib/db';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
    let regions: any[] = [];
    
    try {
        regions = await prisma.region.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error('[PublicLayout] Failed to query active regions, using empty array fallback:', error);
        regions = [];
    }

    return (
        <div className="flex min-h-screen flex-col bg-zi-surface">
            <PublicNavbar regions={regions} />
            <main className="flex-1">{children}</main>
            <PublicFooter />
        </div>
    );
}
