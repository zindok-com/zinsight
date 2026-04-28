import type { Metadata } from 'next';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PublicNavbar } from '@/components/public/layout/public-navbar';
import { PublicFooter } from '@/components/public/layout/public-footer';

export const metadata: Metadata = {
    title: {
        template: '%s | zinsight',
        default: 'zinsight — 당신의 시간을 지킵니다',
    },
    description: '산업별 기업 동향과 최신 뉴스를 한눈에. zinsight Insight Radar.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />
            <main className="flex-1">{children}</main>
            <PublicFooter />
        </div>
    );
}
