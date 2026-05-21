import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/public/layout/public-navbar';
import { PublicFooter } from '@/components/public/layout/public-footer';

export const metadata: Metadata = {
    title: {
        template: '%s | Zinsight',
        default: 'Zinsight — 마케팅·리서치 및 GEO·SEO 인텔리전스 미디어',
    },
    description: '진사이트(Zinsight)는 최신 마케팅 트렌드와 차세대 검색 최적화(GEO/SEO) 인텔리전스를 다루는 리서치 미디어입니다. AI 시대의 시장 동향과 비즈니스 통찰력을 제공합니다.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-zi-surface">
            <PublicNavbar />
            <main className="flex-1">{children}</main>
            <PublicFooter />
        </div>
    );
}
