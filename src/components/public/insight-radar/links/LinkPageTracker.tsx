'use client';

import { useEffect } from 'react';
import { detectLinkType } from '@/components/public/analytics/ArticleTracker';

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

const TRACK_ENDPOINT = '/api/track';
const SRC_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
// 같은 링크를 1초 안에 다시 누르면(더블 탭) 한 번만 기록
const CLICK_DEBOUNCE_MS = 1000;

function storageGet(key: string): string | null {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

function storageSet(key: string, value: string) {
    try {
        sessionStorage.setItem(key, value);
    } catch {}
}

/**
 * 유입 경로: /go를 거치면 ?src=코드로 들어오고, 같은 탭 안에서는 새로고침·뒤로 가기에도 유지.
 * 주소창의 src는 지우지 않음 (주소 변경 시 GA4가 페이지뷰를 한 번 더 보내기 때문)
 */
function resolveSource(slug: string): string {
    const storageKey = `zi_links_src_${slug}`;
    const fromUrl = (new URLSearchParams(window.location.search).get('src') ?? '').trim().toLowerCase();
    if (SRC_PATTERN.test(fromUrl)) {
        storageSet(storageKey, fromUrl);
        return fromUrl;
    }
    return storageGet(storageKey) ?? 'direct';
}

function send(body: Record<string, string>) {
    const json = JSON.stringify(body);
    try {
        const sent = navigator.sendBeacon?.(TRACK_ENDPOINT, new Blob([json], { type: 'application/json' }));
        if (!sent) {
            void fetch(TRACK_ENDPOINT, { method: 'POST', body: json, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
        }
    } catch {}
}

/**
 * 링크 페이지 통계 수집. 자체 서버 집계(/api/track)가 기준이고 GA4는 보조.
 * - 방문: 페이지가 열린 뒤 탭당 1회 (새로고침 중복 제외)
 * - 클릭: data-link-key가 붙은 링크. 이동은 막지 않음
 */
export function LinkPageTracker({ slug, orgId }: { slug: string; orgId: number }) {
    useEffect(() => {
        const source = resolveSource(slug);

        const viewKey = `zi_links_viewed_${slug}`;
        if (!storageGet(viewKey)) {
            storageSet(viewKey, '1');
            send({ event: 'view', slug, src: source });
        }

        const root = document.getElementById('org-links');
        if (!root) return;
        const lastClick = new Map<string, number>();

        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-link-key]');
            if (!anchor) return;
            const key = anchor.dataset.linkKey ?? '';
            const label = anchor.dataset.linkLabel ?? '';
            const kind = anchor.dataset.linkKind ?? '';

            const now = Date.now();
            if (now - (lastClick.get(key) ?? 0) < CLICK_DEBOUNCE_MS) return;
            lastClick.set(key, now);

            send({ event: 'click', slug, src: source, key, label, kind });
            sendGaEvent({ anchor, key, kind, slug, orgId, source });
        };

        // 가운데 클릭(새 탭)도 집계
        root.addEventListener('click', handleClick);
        root.addEventListener('auxclick', handleClick);
        return () => {
            root.removeEventListener('click', handleClick);
            root.removeEventListener('auxclick', handleClick);
        };
    }, [slug, orgId]);

    return null;
}

// GA4(보조): 기존 이벤트 이름을 재사용하고 page_type=link_page로 구분
function sendGaEvent({
    anchor,
    key,
    kind,
    slug,
    orgId,
    source,
}: {
    anchor: HTMLAnchorElement;
    key: string;
    kind: string;
    slug: string;
    orgId: number;
    source: string;
}) {
    if (!window.gtag) return;
    const common = { page_type: 'link_page', org_slug: slug, link_kind: kind, source_code: source, transport_type: 'beacon' };

    if (kind === 'external' || kind === 'social') {
        window.gtag('event', 'outbound_link_click', {
            ...common,
            source_id: orgId,
            source_type: 'link_page',
            link_type: detectLinkType(anchor.href),
            target_url: anchor.href,
        });
    } else if (kind === 'cta') {
        window.gtag('event', 'cta_inquiry_click', { ...common, organization_id: orgId, organization_slug: slug, cta_placement: 'link_page' });
    } else if (key === 'profile') {
        window.gtag('event', 'radar_profile_click', { ...common, organization_identifier: slug });
    } else if (key.startsWith('article:')) {
        const articleSlug = anchor.pathname.split('/').filter(Boolean).pop() ?? '';
        window.gtag('event', 'magazine_article_click', { ...common, organization_id: orgId, organization_slug: slug, target_article: articleSlug });
    }
}
