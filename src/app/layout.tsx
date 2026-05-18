import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const newsreader = Newsreader({
    subsets: ["latin"],
    style: ["normal", "italic"],
    weight: ["400", "600"],
    variable: "--font-serif",
});

const domain = process.env.DOMAIN || "zinsight.com";
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || baseUrl),
    title: {
        template: "%s | zinsight",
        default: "zinsight — 당신의 시간을 지킵니다",
    },
    description: "산업별 기업 동향과 최신 뉴스를 한눈에. zinsight Insight Radar.",
    keywords: ["zinsight", "인사이트", "기업 분석", "산업 동향", "시장 리서치", "뉴스레터", "비즈니스 인텔리전스"],
    authors: [{ name: "zinsight Team" }],
    creator: "zinsight",
    publisher: "zinsight",
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
        siteName: "zinsight",
        title: "zinsight — 당신의 시간을 지킵니다",
        description: "산업별 기업 동향과 최신 뉴스를 한눈에. zinsight Insight Radar.",
        images: [
            {
                url: "/img/zinsight_icon.png",
                width: 1200,
                height: 630,
                alt: "zinsight",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "zinsight — 당신의 시간을 지킵니다",
        description: "산업별 기업 동향과 최신 뉴스를 한눈에. zinsight Insight Radar.",
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
    return (
        <html lang="ko" suppressHydrationWarning>
            <body
                className={cn(
                    "min-h-screen bg-zi-surface font-sans antialiased text-zi-on-surface",
                    inter.variable,
                    newsreader.variable
                )}
            >
                {children}
                <Toaster />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
