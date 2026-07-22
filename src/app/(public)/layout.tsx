import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/public/layout/public-navbar';
import { PublicFooter } from '@/components/public/layout/public-footer';

export const metadata: Metadata = {
    title: {
        template: '%s | 진사이트 (Zinsight)',
        default: 'Zinsight - B2B 세일즈 & GEO·SEO 마케팅 멀티 플랫폼 | 진사이트 (Zinsight)',
    },
    description: '진사이트(Zinsight)는 GEO·SEO 기반의 파트너 콘텐츠 마케팅 미디어입니다. 기업의 이야기를 저널리즘 형식으로 정제하여 검색과 AI 답변 생태계에 최적화된 방식으로 전달합니다.',
};

import { VisitorTracker } from '@/components/public/analytics/VisitorTracker';
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
            <VisitorTracker />
            <PublicNavbar regions={regions} />
            <main className="flex-1">{children}</main>
            <PublicFooter />
        </div>
    );
}
