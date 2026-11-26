'use client';

import { useEffect } from 'react';

/**
 * 진사이트 자체 이용 문의 GA4 이벤트 (고객사 '문의하기'의 cta_inquiry_click·generate_lead, 링크 페이지 자체 통계와 섞지 않음).
 * - zinsight_register_cta_click: data-zi-cta="위치"가 붙은 링크 클릭 (footer·card_footer·profile_footer·services_hero. header·header_drawer·home_hero는 2026-11-26 제거)
 * - zinsight_inquiry_form_start / zinsight_inquiry_submit: /services 문의 폼에서 직접 보냄
 * 관리자로 확인된 탭(링크 페이지 추적이 표시한 내부 트래픽)은 보내지 않음
 */
export const ZINSIGHT_CTA_EVENT = 'zinsight_register_cta_click';

function isInternal(): boolean {
    try {
        return sessionStorage.getItem('zi_links_internal') === '1';
    } catch {
        return false;
    }
}

export function sendZinsightEvent(name: string, params: Record<string, string | number> = {}) {
    if (typeof window === 'undefined' || !window.gtag || isInternal()) return;
    window.gtag('event', name, { page_path: window.location.pathname, ...params });
}

const UTM_STORAGE_KEY = 'zi_inquiry_utm';
const FROM_STORAGE_KEY = 'zi_inquiry_from';
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

function store(key: string, value: string) {
    try {
        sessionStorage.setItem(key, value);
    } catch {}
}

function read(key: string): string | null {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

/** 이 탭에서 처음 본 UTM 값 (문의 폼 숨김 값). 주소에 있으면 주소 값 우선 */
export function getInquiryUtm(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = Object.fromEntries(UTM_PARAMS.map((k) => [k, params.get(k) ?? '']).filter(([, v]) => v));
    if (Object.keys(fromUrl).length > 0) return fromUrl;
    try {
        return JSON.parse(read(UTM_STORAGE_KEY) ?? '{}') as Record<string, string>;
    } catch {
        return {};
    }
}

/** 문의로 들어오기 직전 페이지 경로 (진입 링크를 누른 곳). 없으면 현재 경로 */
export function getInquiryFromPath(): string {
    return read(FROM_STORAGE_KEY) ?? window.location.pathname;
}

export function ZinsightCtaTracker() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const utm = Object.fromEntries(UTM_PARAMS.map((k) => [k, params.get(k) ?? '']).filter(([, v]) => v));
        if (Object.keys(utm).length > 0 && !read(UTM_STORAGE_KEY)) store(UTM_STORAGE_KEY, JSON.stringify(utm));

        const onClick = (e: MouseEvent) => {
            const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-zi-cta]');
            if (!el) return;
            // 이용 안내 페이지 안의 버튼은 진입 경로를 덮어쓰지 않음
            if (window.location.pathname !== '/services') store(FROM_STORAGE_KEY, window.location.pathname);
            sendZinsightEvent(ZINSIGHT_CTA_EVENT, { cta_placement: el.dataset.ziCta || 'unknown' });
        };
        document.addEventListener('click', onClick, true);
        return () => document.removeEventListener('click', onClick, true);
    }, []);
    return null;
}
