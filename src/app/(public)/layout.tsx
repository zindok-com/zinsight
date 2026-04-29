import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/public/layout/public-navbar';
import { PublicFooter } from '@/components/public/layout/public-footer';

export const metadata: Metadata = {
    title: {
        template: '%s | Zinsight',
        default: 'Zinsight — 인텔리전스의 정점',
    },
    description: '산업별 기업 동향과 최신 뉴스를 한눈에. 데이터로 읽는 시장의 미래.',
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
