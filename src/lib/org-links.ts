import { safeHttpUrl } from '@/lib/utils';

// 조직 링크 페이지(/insight-radar/[slug]/links) 공용 정의. 서버·관리자 화면에서 함께 사용

export const ORG_LINK_KINDS = ['homepage', 'sns', 'brochure', 'shop', 'event', 'custom'] as const;
export type OrgLinkKind = (typeof ORG_LINK_KINDS)[number];

export const ORG_LINK_KIND_LABEL: Record<OrgLinkKind, string> = {
    homepage: '홈페이지',
    sns: 'SNS',
    brochure: '소개자료',
    shop: '쇼핑몰',
    event: '이벤트',
    custom: '기타',
};

export const ORG_LINK_DISPLAYS = ['card', 'button', 'icon'] as const;
export type OrgLinkDisplay = (typeof ORG_LINK_DISPLAYS)[number];

export const ORG_LINK_DISPLAY_LABEL: Record<OrgLinkDisplay, string> = {
    card: '카드',
    button: '버튼',
    icon: '아이콘',
};

export const ORG_LINK_MAX = 30;

export interface OrgLinkInput {
    label: string;
    url: string;
    kind: OrgLinkKind;
    display: OrgLinkDisplay;
    subtitle: string | null;
    thumbnail_url: string | null;
    is_visible: boolean;
}

export type SocialPlatform =
    | 'instagram'
    | 'youtube'
    | 'x'
    | 'threads'
    | 'naver-blog'
    | 'facebook'
    | 'linkedin'
    | 'kakao'
    | 'tiktok'
    | 'tistory';

export const SOCIAL_PLATFORM_LABEL: Record<SocialPlatform, string> = {
    instagram: '인스타그램',
    youtube: '유튜브',
    x: 'X',
    threads: '스레드',
    'naver-blog': '네이버 블로그',
    facebook: '페이스북',
    linkedin: '링크드인',
    kakao: '카카오톡 채널',
    tiktok: '틱톡',
    tistory: '티스토리',
};

function hostOf(url: string): string {
    try {
        return new URL(url).hostname.toLowerCase().replace(/^(www|m)\./, '');
    } catch {
        return '';
    }
}

/** 주소로 SNS 플랫폼 판별 (해당 없으면 null) */
export function detectSocialPlatform(url: string): SocialPlatform | null {
    const host = hostOf(url);
    if (!host) return null;
    if (host.endsWith('instagram.com')) return 'instagram';
    if (host.endsWith('youtube.com') || host === 'youtu.be') return 'youtube';
    if (host === 'x.com' || host.endsWith('twitter.com')) return 'x';
    if (host.endsWith('threads.net') || host.endsWith('threads.com')) return 'threads';
    if (host === 'blog.naver.com') return 'naver-blog';
    if (host.endsWith('facebook.com')) return 'facebook';
    if (host.endsWith('linkedin.com')) return 'linkedin';
    if (host === 'pf.kakao.com') return 'kakao';
    if (host.endsWith('tiktok.com')) return 'tiktok';
    if (host.endsWith('tistory.com')) return 'tistory';
    return null;
}

function sameUrl(a: string, b: string): boolean {
    const norm = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
    return norm(a) === norm(b);
}

function parseBacklinks(raw: unknown): Array<{ title: string; url: string }> {
    let list: unknown = raw;
    if (typeof raw === 'string') {
        try {
            list = JSON.parse(raw);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(list)) return [];
    return list
        .map((item: any) => ({ title: String(item?.title ?? '').trim(), url: String(item?.url ?? '').trim() }))
        .filter((item) => !!safeHttpUrl(item.url));
}

/**
 * 관리자가 링크를 등록하기 전의 기본 링크 목록.
 * 기존 외부 링크(backlinks)·홈페이지·소개자료에서 만들며, SNS는 아이콘, 나머지는 버튼으로 둔다.
 */
export function deriveDefaultOrgLinks(org: {
    company_url?: string | null;
    backlinks?: unknown;
    brochure_url?: string | null;
}): OrgLinkInput[] {
    const result: OrgLinkInput[] = [];
    const push = (label: string, url: string, kind: OrgLinkKind, display: OrgLinkDisplay) => {
        if (result.some((r) => sameUrl(r.url, url))) return;
        result.push({ label, url, kind, display, subtitle: null, thumbnail_url: null, is_visible: true });
    };

    const homepage = safeHttpUrl(org.company_url);
    if (homepage) push('홈페이지 바로가기', homepage, 'homepage', 'button');

    for (const item of parseBacklinks(org.backlinks)) {
        const platform = detectSocialPlatform(item.url);
        if (platform) push(SOCIAL_PLATFORM_LABEL[platform], item.url, 'sns', 'icon');
        else if (homepage && sameUrl(item.url, homepage)) continue;
        else push(item.title || '바로가기', item.url, /smartstore|shop/i.test(item.url) ? 'shop' : 'custom', 'button');
    }

    const brochure = safeHttpUrl(org.brochure_url);
    if (brochure) push('소개자료 보기', brochure, 'brochure', 'button');

    return result;
}

function isKind(v: unknown): v is OrgLinkKind {
    return (ORG_LINK_KINDS as readonly unknown[]).includes(v);
}

function isDisplay(v: unknown): v is OrgLinkDisplay {
    return (ORG_LINK_DISPLAYS as readonly unknown[]).includes(v);
}

/** 저장 전 입력 정리: http(s) 주소만, 길이 제한, 허용되지 않은 종류·형태는 기본값 */
export function normalizeOrgLinks(input: unknown): OrgLinkInput[] {
    if (!Array.isArray(input)) return [];
    const result: OrgLinkInput[] = [];
    for (const raw of input.slice(0, ORG_LINK_MAX)) {
        const url = safeHttpUrl(String(raw?.url ?? ''));
        const label = String(raw?.label ?? '').trim().slice(0, 100);
        if (!url || url.length > 512 || !label) continue;
        const subtitle = String(raw?.subtitle ?? '').trim().slice(0, 100);
        const thumb = safeHttpUrl(String(raw?.thumbnail_url ?? ''));
        result.push({
            label,
            url,
            kind: isKind(raw?.kind) ? raw.kind : 'custom',
            display: isDisplay(raw?.display) ? raw.display : 'button',
            subtitle: subtitle || null,
            thumbnail_url: thumb && thumb.length <= 512 ? thumb : null,
            is_visible: raw?.is_visible !== false,
        });
    }
    return result;
}

// ── 링크 페이지 통계 ──
// 통계용 링크 종류: 외부 사이트 / 진사이트 프로필·기사 / 문의하기 / SNS 아이콘
export const LINK_PAGE_LINK_KINDS = ['external', 'internal', 'cta', 'social'] as const;
export type LinkPageLinkKind = (typeof LINK_PAGE_LINK_KINDS)[number];

export const LINK_PAGE_LINK_KIND_LABEL: Record<LinkPageLinkKind, string> = {
    external: '외부 사이트',
    internal: '진사이트 프로필·기사',
    cta: '문의하기·연락처 남기기',
    social: 'SNS 아이콘',
};

/** 관리자 등록·기본 링크의 통계용 종류. 아이콘형은 SNS, 진사이트 주소는 내부 링크 */
export function linkPageKindOf(link: { url: string; display: OrgLinkDisplay }): LinkPageLinkKind {
    if (link.display === 'icon') return 'social';
    if (!/^https?:\/\//i.test(link.url)) return 'internal';
    const host = hostOf(link.url);
    return host === 'zinsight.co.kr' || host.endsWith('.zinsight.co.kr') ? 'internal' : 'external';
}

// 클릭 집계 키: profile | inquiry | lead(연락처 남기기 열기) | home | article:{id} | link:{id} | auto:{n} | sns:{platform}
export const LINK_KEY_PATTERN = /^(profile|inquiry|lead|home|(article|link|auto):\d{1,10}|sns:[a-z-]{1,20})$/;
