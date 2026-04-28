import Link from 'next/link';
import { Zap } from 'lucide-react';

export function PublicNavbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
                {/* 로고 */}
                <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <Zap className="h-4 w-4" />
                    </span>
                    <span>zinsight</span>
                </Link>

                {/* 네비게이션 */}
                <nav className="flex items-center gap-6 text-sm">
                    <Link
                        href="/insight-radar"
                        className="text-foreground/80 transition-colors hover:text-foreground font-medium"
                    >
                        Insight Radar
                    </Link>
                    <Link
                        href="/magazine"
                        className="text-foreground/80 transition-colors hover:text-foreground font-medium"
                    >
                        Magazine
                    </Link>
                    <Link
                        href="/admin"
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Admin
                    </Link>
                </nav>
            </div>
        </header>
    );
}
