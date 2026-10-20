import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/public/layout/public-navbar';
import { PublicFooter } from '@/components/public/layout/public-footer';

// title은 루트 레이아웃의 template('%s | 진사이트')/default를 그대로 사용 (여기서 재선언하면 default에 template이 중복 적용됨)
export const metadata: Metadata = {
    description: '진사이트는 GEO·SEO 기반의 파트너 콘텐츠 마케팅 미디어입니다. 기업의 이야기를 저널리즘 형식으로 정제하여 검색과 AI 답변 생태계에 최적화된 방식으로 전달합니다.',
};

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
