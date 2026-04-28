import Link from 'next/link';
import { Zap } from 'lucide-react';

export function PublicFooter() {
    return (
        <footer className="border-t border-border/40 bg-muted/30">
            <div className="container mx-auto max-w-screen-xl px-6 py-8">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground">
                            <Zap className="h-3 w-3" />
                        </span>
                        <span className="font-semibold text-foreground">zinsight</span>
                        <span>— 당신의 시간을 지킵니다</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} zindok. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
