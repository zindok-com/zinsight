import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "MICE Scout Admin",
    description: "Internal dashboard for MICE Scout",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
                <div className="flex min-h-screen flex-col md:flex-row">
                    <Sidebar />
                    <main className="flex-1 p-6 overflow-auto">
                        {children}
                    </main>
                </div>
                <Toaster />
            </body>
        </html>
    );
}
