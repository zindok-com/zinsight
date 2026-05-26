import type { Metadata } from "next";
import Script from 'next/script';
import { Inter, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const notoSerifKR = Noto_Serif_KR({
    subsets: ["latin"],
    weight: ["400", "600", "700"],
    display: "swap",
    variable: "--font-serif",
});

const domain = process.env.DOMAIN || "zinsight.co.kr";
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || baseUrl),
    title: {
        template: "%s | 진사이트 (Zinsight)",
        default: "Zinsight - 마케팅·리서치 및 GEO·SEO 인텔리전스 미디어 | 진사이트",
    },
    description: "진사이트(Zinsight)는 최신 마케팅 트렌드와 차세대 검색 최적화(GEO/SEO) 인텔리전스를 다루는 리서치 미디어입니다. AI 시대의 시장 동향과 비즈니스 통찰력을 제공합니다.",
    keywords: ["zinsight", "인사이트", "기업 분석", "산업 동향", "시장 리서치", "뉴스레터", "비즈니스 인텔리전스", "GEO", "SEO", "테크니컬 마케팅"],
    authors: [{ name: "Zinsight Team" }],
    creator: "Zinsight",
    publisher: "Zinsight",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: "/img/zinsight_icon.png",
        shortcut: "/img/zinsight_icon.png",
        apple: "/img/zinsight_icon.png",
    },
    openGraph: {
        type: "website",
        locale: "ko_KR",
        url: baseUrl,
        siteName: "Zinsight (진사이트)",
        title: "Zinsight - 마케팅·리서치 및 GEO·SEO 인텔리전스 미디어 | 진사이트",
        description: "진사이트(Zinsight)는 최신 마케팅 트렌드와 차세대 검색 최적화(GEO/SEO) 인텔리전스를 다루는 리서치 미디어입니다.",
        images: [
            {
                url: "/img/zinsight_icon.png",
                width: 1200,
                height: 630,
                alt: "Zinsight",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Zinsight - 마케팅·리서치 및 GEO·SEO 인텔리전스 미디어 | 진사이트",
        description: "진사이트(Zinsight)는 최신 마케팅 트렌드와 차세대 검색 최적화(GEO/SEO) 인텔리전스를 다루는 리서치 미디어입니다. AI 시대의 시장 동향과 비즈니스 통찰력을 제공합니다.",
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
    const gaId = process.env.NEXT_PUBLIC_GA_ID?process.env.NEXT_PUBLIC_GA_ID : 'G-JV3R82PMH4';
    return (
        <html lang="ko" suppressHydrationWarning>
            <body
                className={cn(
                    "min-h-screen bg-zi-surface font-sans antialiased text-zi-on-surface",
                    notoSerifKR.variable,
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
                <Toaster />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
