'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * 전 페이지 공통 외부 스크립트 (GA4, Google 선호 출처 버튼, Vercel 분석).
 * 외부 공유 통계(/share/...)는 주소에 열람 토큰이 들어 있어 어떤 분석 도구에도 보내지 않음.
 * (루트 layout에서 headers()로 경로를 읽으면 모든 페이지가 동적 렌더링이 되므로 클라이언트에서 경로 확인)
 */
export function RootScripts({ gaId }: { gaId: string | null }) {
    const pathname = usePathname();
    if (pathname?.startsWith('/share/')) return null;
    return (
        <>
            {gaId && (
                <>
                    <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());

                        gtag('config', '${gaId}', {
                        page_path: window.location.pathname,
                        });
                    `}
                    </Script>
                </>
            )}
            {/* Google 선호하는 출처(Preferred Source) 버튼 초기화 스크립트 */}
            <Script src="https://news.google.com/swg/js/v1/publisher.js" strategy="afterInteractive" />
            <Analytics />
            <SpeedInsights />
        </>
    );
}
