'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * 화면에 들어올 때 한 번만 모션을 재생하는 감싸개 (스타일: globals.css의 data-reveal 규칙).
 * 서버 HTML에는 data-reveal이 없어 내용이 그대로 보인다(크롤러·스크립트 없는 환경).
 * 마운트 시 아직 화면 밖이면 "armed"로 숨겼다가, 들어오면 "play". 움직임 줄이기 설정이면 아무것도 하지 않는다.
 */
export function RevealOnView({ children, className }: { children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        // 이미 화면 위쪽까지 올라와 있으면 숨겼다 다시 보이는 깜빡임을 피하려고 바로 재생.
        // 화면 아래 끝에 살짝 걸친 정도면 숨겨 두고 스크롤해 들어올 때 재생
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.6 && rect.bottom > 0;
        el.dataset.reveal = inView ? 'play' : 'armed';
        if (inView) return;

        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    el.dataset.reveal = 'play';
                    io.disconnect();
                }
            },
            // 화면 아래 끝에 걸치자마자가 아니라, 위쪽 75% 선까지 올라왔을 때 재생 (시선이 닿은 뒤 움직이도록)
            { threshold: 0, rootMargin: '0px 0px -25% 0px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
}
