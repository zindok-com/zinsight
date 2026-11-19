import type { Metadata } from 'next';

// 외부 공유 페이지 공통: 검색 노출 금지, 토큰이 든 주소를 외부로 보내지 않음 (헤더는 next.config.js에서 함께 설정)
export const metadata: Metadata = {
    title: { absolute: '방문 통계 | 진사이트' },
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    referrer: 'no-referrer',
    openGraph: null,
    twitter: null,
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-slate-50 text-slate-900 print:min-h-0 print:bg-white">{children}</div>;
}
