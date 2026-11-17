'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const START_EVENT = 'admin-nav-progress:start';

/** 주소가 지금 페이지와 다를 때만 진행 막대를 시작 */
export function startNavProgress(href?: string) {
    if (typeof window === 'undefined') return;
    if (href) {
        const next = new URL(href, window.location.href);
        if (next.origin !== window.location.origin) return;
        if (next.pathname === window.location.pathname && next.search === window.location.search) return;
    }
    window.dispatchEvent(new Event(START_EVENT));
}

/** router.push / replace 할 때 진행 막대도 같이 시작하는 useRouter */
export function useProgressRouter() {
    const router = useRouter();
    return useMemo(
        () => ({
            ...router,
            push: (href: string, options?: Parameters<typeof router.push>[1]) => {
                startNavProgress(href);
                router.push(href, options);
            },
            replace: (href: string, options?: Parameters<typeof router.replace>[1]) => {
                startNavProgress(href);
                router.replace(href, options);
            },
        }),
        [router],
    );
}

/** 관리자 화면 이동 중 상단에 표시하는 얇은 진행 막대 */
export function NavProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState<number | null>(null);
    const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
    const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
    const active = useRef(false);

    const clearTimers = () => {
        if (trickle.current) clearInterval(trickle.current);
        if (safety.current) clearTimeout(safety.current);
        if (hide.current) clearTimeout(hide.current);
        trickle.current = safety.current = hide.current = null;
    };

    const finish = () => {
        if (!active.current) return;
        active.current = false;
        clearTimers();
        setProgress(100);
        hide.current = setTimeout(() => setProgress(null), 250);
    };

    const start = () => {
        if (active.current) return;
        active.current = true;
        clearTimers();
        setProgress(10);
        // 90%까지 천천히 차오르다 이동이 끝나면 100%
        trickle.current = setInterval(() => {
            setProgress((p) => (p === null ? p : Math.min(90, p + Math.max(0.5, (90 - p) * 0.08))));
        }, 200);
        // 같은 화면 재요청 등으로 주소가 안 바뀌어도 막대가 남지 않게
        safety.current = setTimeout(finish, 15000);
    };

    // 주소(경로·쿼리)가 바뀌면 이동 완료
    useEffect(() => {
        finish();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]);

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const anchor = (event.target as Element | null)?.closest?.('a');
            if (!anchor || !anchor.href) return;
            if (anchor.target && anchor.target !== '_self') return;
            if (anchor.hasAttribute('download')) return;
            startNavProgress(anchor.href);
        };
        const onStart = () => start();
        document.addEventListener('click', onClick, true);
        window.addEventListener(START_EVENT, onStart);
        return () => {
            document.removeEventListener('click', onClick, true);
            window.removeEventListener(START_EVENT, onStart);
            clearTimers();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (progress === null) return null;
    return (
        <div
            role="progressbar"
            aria-label="페이지 불러오는 중"
            aria-valuenow={Math.round(progress)}
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
        >
            <div
                className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-[width,opacity] duration-200 ease-out"
                style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
            />
        </div>
    );
}
