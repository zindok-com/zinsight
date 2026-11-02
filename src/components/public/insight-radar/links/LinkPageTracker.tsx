'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

// 진입 경로: QR(utm_medium=qr)로 들어온 세션은 이후 새로고침·뒤로 가기에도 qr로 유지
function resolveEntry(slug: string): 'qr' | 'direct' {
    const storageKey = `zi_links_entry_${slug}`;
    const fromQr = new URLSearchParams(window.location.search).get('utm_medium') === 'qr';
    try {
        if (fromQr) sessionStorage.setItem(storageKey, 'qr');
        return fromQr || sessionStorage.getItem(storageKey) === 'qr' ? 'qr' : 'direct';
    } catch {
        return fromQr ? 'qr' : 'direct';
    }
}

/**
 * 링크 페이지 클릭 추적. data-link-key가 붙은 링크 클릭 시
 * GA4 link_click 이벤트 전송 + 서버 일자별 집계(sendBeacon, 이동을 막지 않음)
 */
export function LinkPageTracker({ slug }: { slug: string }) {
    useEffect(() => {
        const entry = resolveEntry(slug);
        const root = document.getElementById('org-links');
        if (!root) return;

        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-link-key]');
            if (!anchor) return;
            const key = anchor.dataset.linkKey ?? '';
            const label = anchor.dataset.linkLabel ?? '';
            const kind = anchor.dataset.linkKind ?? '';

            window.gtag?.('event', 'link_click', {
                organization_slug: slug,
                link_key: key,
                link_label: label,
                link_type: kind,
                entry_path: entry,
                transport_type: 'beacon',
            });

            const body = JSON.stringify({ slug, key, label, kind, entry });
            try {
                const sent = navigator.sendBeacon?.('/api/org-links/click', new Blob([body], { type: 'application/json' }));
                if (!sent) {
                    void fetch('/api/org-links/click', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } });
                }
            } catch {}
        };

        // 가운데 클릭(새 탭)도 집계
        root.addEventListener('click', handleClick);
        root.addEventListener('auxclick', handleClick);
        return () => {
            root.removeEventListener('click', handleClick);
            root.removeEventListener('auxclick', handleClick);
        };
    }, [slug]);

    return null;
}
