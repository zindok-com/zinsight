import type { Metadata } from "next";
import { SITE_DESCRIPTION } from '@/lib/site';
import Script from 'next/script';
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const domain = "www.zinsight.co.kr";
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: {
        template: "%s | 진사이트",
        default: "진사이트 - AEO·SEO·GEO 통합 검색최적화 플랫폼",
    },
    description: SITE_DESCRIPTION,
    keywords: ["진사이트", "zinsight", "진독", "zindok", "인사이트 레이더", "기업 분석", "산업 동향", "시장 리서치", "뉴스레터", "비즈니스 인텔리전스", "GEO", "SEO", "AEO", "테크니컬 마케팅"],
    authors: [{ name: "진사이트 편집부" }],
    creator: "진사이트",
    publisher: "진사이트",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/icon.svg", type: "image/svg+xml" },
            { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        shortcut: "/favicon.ico",
        apple: [
            { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
    },
    openGraph: {
        type: "website",
        locale: "ko_KR",
        url: baseUrl,
        siteName: "진사이트",
        title: "진사이트 - AEO·SEO·GEO 통합 검색최적화 플랫폼",
        description: SITE_DESCRIPTION,
        images: [
            {
                url: "/img/zinsight_icon.png",
                width: 1200,
                height: 630,
                alt: "진사이트",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "진사이트 - AEO·SEO·GEO 통합 검색최적화 플랫폼",
        description: SITE_DESCRIPTION,
        images: ["/img/zinsight_icon.png"],
    },
    verification: {
        other: {
            "naver-site-verification": ["460f328e32dcc34b1fec50c5def9ecbb83037c7b"],
        },
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const gaId = process.env.NEXT_PUBLIC_GA_ID ? process.env.NEXT_PUBLIC_GA_ID : 'G-JV3R82PMH4';
    return (
        <html lang="ko" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap"
                />
            </head>
            <body
                className={cn(
                    "min-h-screen bg-zi-surface font-sans antialiased text-zi-on-surface",
                    inter.variable
                )}
            >
                {children}
                {/* 🚀 Google Analytics (GA4) 태그 삽입 */}
                {gaId && (
                <>
                    {/* 구글 추적 스크립트 비동기 로드 */}
                    <Script
                    src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                    strategy="afterInteractive" // 페이지가 인터랙티브해진 직후에 로드하여 성능 최적화
                    />
                    {/* 초기화 및 설정 코드 실행 */}
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
                {/* 🗞️ Google 선호하는 출처(Preferred Source) 버튼 초기화 스크립트 */}
                <Script
                    src="https://news.google.com/swg/js/v1/publisher.js"
                    strategy="afterInteractive"
                />
                <Toaster />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
