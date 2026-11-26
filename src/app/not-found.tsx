import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

// 없는 주소 공통 안내 (Next.js 기본 영문 404 대신). /share 아래는 share/not-found.tsx가 따로 처리
export const metadata: Metadata = {
    title: '페이지를 찾을 수 없습니다',
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
            <Link href="/" className="text-[20px] font-bold text-zi-primary">
                {siteConfig.brand.name}
            </Link>
            <h1 className="text-lg font-bold text-slate-900">페이지를 찾을 수 없습니다</h1>
            <p className="text-sm leading-relaxed text-slate-600 break-keep">
                주소를 확인하시거나 매거진·인사이트 레이더에서 찾아 주세요.
            </p>
            <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                <Link
                    href="/magazine"
                    className="inline-flex min-h-11 items-center justify-center rounded-zi-btn bg-zi-primary px-6 text-[14px] font-bold text-white hover:bg-zi-primary/90"
                >
                    {siteConfig.brand.name} 매거진
                </Link>
                <Link
                    href="/insight-radar"
                    className="inline-flex min-h-11 items-center justify-center rounded-zi-btn border border-zi-primary bg-white px-6 text-[14px] font-bold text-zi-primary hover:bg-zi-primary hover:text-white"
                >
                    인사이트 레이더
                </Link>
            </div>
        </main>
    );
}
