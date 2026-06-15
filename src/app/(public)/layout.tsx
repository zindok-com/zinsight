import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/public/layout/public-navbar';
import { PublicFooter } from '@/components/public/layout/public-footer';

export const metadata: Metadata = {
    title: {
        template: '%s | 진사이트 (Zinsight)',
        default: 'Zinsight - B2B 세일즈 & GEO·SEO 마케팅 멀티 플랫폼 | 진사이트 (Zinsight)',
    },
    description: '진사이트(Zinsight)는 차세대 AI 검색 최적화(GEO)와 웹 표준 SEO를 융합하여 비즈니스 가치를 입증하는 고품격 하이브리드 마케팅 인텔리전스 미디어입니다.',
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
