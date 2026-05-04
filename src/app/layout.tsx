import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const newsreader = Newsreader({
    subsets: ["latin"],
    style: ["normal", "italic"],
    weight: ["400", "600"],
    variable: "--font-serif",
});

export const metadata: Metadata = {
    title: {
        template: "%s | zinsight",
        default: "zinsight — 당신의 시간을 지킵니다",
    },
    description: "산업별 기업 동향과 최신 뉴스를 한눈에. zinsight Insight Radar.",
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
                <SpeedInsights />
            </body>
        </html>
    );
}
