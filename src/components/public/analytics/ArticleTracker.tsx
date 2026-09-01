'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

export type OutboundLinkType = 'homepage' | 'sns' | 'naver_blog' | 'other';

function detectLinkType(url: string): OutboundLinkType {
    const lower = url.toLowerCase();
    if (lower.includes('blog.naver.com') || lower.includes('m.blog.naver.com')) {
        return 'naver_blog';
    }
    if (
        lower.includes('instagram.com') ||
        lower.includes('youtube.com') ||
        lower.includes('youtu.be') ||
        lower.includes('facebook.com') ||
        lower.includes('linkedin.com') ||
        lower.includes('twitter.com') ||
        lower.includes('x.com') ||
        lower.includes('threads.net')
    ) {
        return 'sns';
    }
    return 'homepage';
}

interface ArticleTrackerProps {
    postId: number;
    slug: string;
    category: string;
    region?: string | null;
}

export function ArticleTracker({ postId, slug, category, region }: ArticleTrackerProps) {
    // 1. article_view: 기사 진입 시 1회 발생
    useEffect(() => {
        if (typeof window === 'undefined' || !window.gtag) return;
        window.gtag('event', 'article_view', {
            article_id: postId,
            article_slug: slug,
            article_category: category,
            article_region: region ?? 'none',
        });
    }, [postId, slug, category, region]);

    // 2. 이벤트 위임: radar_profile_click & outbound_link_click 자동 감지
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement)?.closest('a');
            if (!target || !target.href) return;

            const href = target.getAttribute('href') || '';
            const fullUrl = target.href;

            // (A) 레이더 프로필 링크 클릭 감지 (/insight-radar/[id 또는 slug])
            if (href.startsWith('/insight-radar/') || fullUrl.includes('/insight-radar/')) {
                const parts = fullUrl.split('/insight-radar/');
                const orgIdentifier = parts[1]?.split('?')[0]?.split('#')[0] || '';
                if (orgIdentifier && typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'radar_profile_click', {
                        article_id: postId,
                        article_slug: slug,
                        organization_identifier: orgIdentifier,
                    });
                }
                return;
            }

            // (B) 외부 아웃바운드 링크 클릭 감지
            if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
                const currentHost = window.location.hostname;
                try {
                    const targetHost = new URL(fullUrl).hostname;
                    if (targetHost && targetHost !== currentHost && !targetHost.includes('zinsight.co.kr')) {
                        const linkType = detectLinkType(fullUrl);
                        if (typeof window !== 'undefined' && window.gtag) {
                            window.gtag('event', 'outbound_link_click', {
                                source_id: postId,
                                source_type: 'article',
                                link_type: linkType,
                                target_url: fullUrl,
                            });
                        }
                    }
                } catch {}
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [postId, slug]);

    return null;
}

interface OrganizationTrackerProps {
    orgId: number;
    slug?: string | null;
    region?: string | null;
}

export function OrganizationTracker({ orgId, slug, region }: OrganizationTrackerProps) {
    // 1. organization_profile_view: 조직 프로필 진입 시 발생
    useEffect(() => {
        if (typeof window === 'undefined' || !window.gtag) return;
        window.gtag('event', 'organization_profile_view', {
            organization_id: orgId,
            organization_slug: slug || String(orgId),
            organization_region: region ?? 'none',
        });
    }, [orgId, slug, region]);

    // 2. 이벤트 위임: 조직 프로필 내 아웃바운드 링크 클릭 감지
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement)?.closest('a');
            if (!target || !target.href) return;

            const fullUrl = target.href;
            if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
                const currentHost = window.location.hostname;
                try {
                    const targetHost = new URL(fullUrl).hostname;
                    if (targetHost && targetHost !== currentHost && !targetHost.includes('zinsight.co.kr')) {
                        const linkType = detectLinkType(fullUrl);
                        if (typeof window !== 'undefined' && window.gtag) {
                            window.gtag('event', 'outbound_link_click', {
                                source_id: orgId,
                                source_type: 'organization',
                                link_type: linkType,
                                target_url: fullUrl,
                            });
                        }
                    }
                } catch {}
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [orgId]);

    return null;
}

