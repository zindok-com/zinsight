import type { Metadata } from "next";
import { SITE_DESCRIPTION } from '@/lib/site';
import { siteConfig } from '@/config/site';
import { Inter, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { RootScripts } from "@/components/RootScripts";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
// 제목용 명조체: 같은 도메인에서 셀프 호스팅(외부 CSS 렌더 차단 제거).
// 가변 폰트(weight 미지정)로 400·600·700을 한 벌의 파일로 처리해 굵기별 중복 다운로드 제거.
// 한글은 글자 범위별로 수십 개 파일로 나뉘므로 preload를 끄고 실제 쓰인 글자 파일만 받게 함.
const notoSerifKR = Noto_Serif_KR({
    display: "swap",
    preload: false,
    variable: "--font-serif",
});

const { brand, identity } = siteConfig;
const baseUrl = brand.baseUrl;

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: {
        template: `%s | ${brand.name}`,
        default: identity.defaultTitle,
    },
    description: SITE_DESCRIPTION,
    keywords: identity.keywords,
    authors: [{ name: `${brand.name} 편집부` }],
    creator: brand.name,
    publisher: brand.name,
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
        siteName: brand.name,
        title: identity.ogTitle,
        description: identity.ogDescription,
        images: [
            {
                url: brand.logoPath,
                width: 1200,
                height: 630,
                alt: brand.name,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: identity.ogTitle,
        description: identity.ogDescription,
        images: [brand.logoPath],
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
    // GA는 Vercel 운영 배포에서만 수집 (로컬 dev·프리뷰 트래픽이 운영 통계에 섞이지 않도록)
    const gaId = process.env.VERCEL_ENV === 'production'
        ? (process.env.NEXT_PUBLIC_GA_ID || 'G-JV3R82PMH4')
        : null;
    return (
        <html lang="ko" suppressHydrationWarning>
            <body
                className={cn(
                    "min-h-screen bg-zi-surface font-sans antialiased text-zi-on-surface",
                    inter.variable,
                    notoSerifKR.variable
                )}
            >
                {children}
                {/* GA·Google 선호 출처·Vercel 분석: 외부 공유 통계(/share)에서는 넣지 않음 (토큰 주소 외부 전송 방지) */}
                <RootScripts gaId={gaId} />
                <Toaster />
            </body>
        </html>
    );
}
