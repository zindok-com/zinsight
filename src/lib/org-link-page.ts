import { cache } from 'react';
import { prisma } from '@/lib/db';
import { getMagazinePostPath } from '@/lib/site';
import { sanitizeHref, safeHttpUrl } from '@/lib/utils';
import { buildListTagline } from '@/lib/radar';
import { deriveDefaultOrgLinks, type OrgLinkDisplay } from '@/lib/org-links';
import { CHANNEL_TYPES, channelTypeOf, detectChannelType, resolveOrgChannels, type ChannelType } from '@/lib/org-channels';
import { ACTIVE_CHANNELS } from '@/lib/org-channel-store';

export interface LinkPageLink {
    /** 클릭 집계 키: 공식 채널은 ch:{id}. 채널 이전 전 조직은 link:{id} 또는 기본 링크 auto:{n} */
    key: string;
    label: string;
    url: string;
    channelType: ChannelType;
    display: OrgLinkDisplay;
    subtitle: string | null;
    thumbnailUrl: string | null;
}

export interface LinkPageArticle {
    id: number;
    title: string;
    path: string;
    thumbnailUrl: string | null;
    date: Date | null;
}

export interface LinkPageInquiry {
    href: string;
    type: 'tel' | 'mail' | 'url';
}

export interface LinkPageData {
    id: number;
    slug: string;
    name: string;
    logoUrl: string | null;
    tagline: string | null;
    /** 하단 '문의하기' 주 동작: 전화번호가 있으면 tel:, 없으면 문의 URL·메일 */
    inquiry: LinkPageInquiry | null;
    /** 소개 영상 (자체 파일 또는 유튜브). 없으면 영상 섹션을 렌더링하지 않음 */
    videoUrl: string | null;
    videoPosterUrl: string | null;
    articles: LinkPageArticle[];
    links: LinkPageLink[];
}

/** 링크 페이지 데이터. 관리자 등록 링크가 없으면 기존 외부 링크·홈페이지·소개자료로 기본 목록 구성 */
export const getOrgLinkPage = cache(async (slugOrId: string): Promise<LinkPageData | null> => {
    const numericId = /^\d+$/.test(slugOrId) ? Number(slugOrId) : null;
    const org = await prisma.organization.findFirst({
        where: { OR: [{ slug: slugOrId }, ...(numericId ? [{ id: numericId }] : [])] },
        select: {
            id: true,
            slug: true,
            company_name: true,
            logo_url: true,
            tagline: true,
            business_summary: true,
            company_url: true,
            backlinks: true,
            brochure_url: true,
            extra_materials: true,
            inquiry_url: true,
            contact_email: true,
            contact_phone: true,
            video_url: true,
            video_poster_url: true,
            links: { where: { is_visible: true }, orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] },
            channels: ACTIVE_CHANNELS,
            cardItems: { select: { channel_id: true, display: true, subtitle: true, thumbnail_url: true, sort_order: true, is_visible: true } },
            magazinePosts: {
                where: { magazinePost: { status: 'PUBLISHED', deletedAt: null } },
                orderBy: { magazinePost: { publishedAt: 'desc' } },
                take: 2,
                select: {
                    magazinePost: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
                            publishedAt: true,
                            createdAt: true,
                            category: { select: { isLocal: true } },
                            region: { select: { slug: true } },
                        },
                    },
                },
            },
        },
    });
    if (!org) return null;

    const links: LinkPageLink[] =
        org.channels.length > 0 ? cardLinksFromChannels(org.channels, org.cardItems) : await legacyCardLinks(org);

    // 문의 연결처: 링크 페이지는 현장(휴대폰) 사용이 많아 전화 하나만. 전화가 없을 때만 문의 URL → 메일
    const toInquiry = (href: string | null | undefined): LinkPageInquiry | null => {
        if (!href) return null;
        const type = href.startsWith('tel:') ? 'tel' : href.startsWith('mailto:') ? 'mail' : 'url';
        return { href, type };
    };
    const phoneDigits = org.contact_phone?.replace(/[^0-9+]/g, '') ?? '';
    const phone = toInquiry(phoneDigits.length >= 8 ? `tel:${phoneDigits}` : null);
    const urlOrMail =
        toInquiry(org.inquiry_url ? sanitizeHref(org.inquiry_url) : null) ||
        toInquiry(org.contact_email ? `mailto:${org.contact_email}` : null);
    const inquiry = phone ?? urlOrMail;

    return {
        id: org.id,
        slug: org.slug || String(org.id),
        name: org.company_name,
        logoUrl: org.logo_url,
        tagline: buildListTagline(org.company_name, org.tagline, org.business_summary),
        inquiry,
        videoUrl: safeHttpUrl(org.video_url) ?? null,
        videoPosterUrl: safeHttpUrl(org.video_poster_url) ?? null,
        articles: org.magazinePosts.map(({ magazinePost: p }) => ({
            id: p.id,
            title: p.title,
            path: getMagazinePostPath(p),
            thumbnailUrl: p.thumbnailUrl,
            date: p.publishedAt ?? p.createdAt,
        })),
        links,
    };
});

type CardItemRow = { channel_id: number; display: string; subtitle: string | null; thumbnail_url: string | null; sort_order: number; is_visible: boolean };

function isDisplay(v: string): v is OrgLinkDisplay {
    return v === 'card' || v === 'button' || v === 'icon';
}

/**
 * 공식 채널 → 카드 링크. 카드 설정이 있는 채널은 설정 순서대로, 설정이 없는 채널(새로 추가한 채널 등)은
 * 종류의 기본 형태로 맨 뒤에 붙인다. 숨김 설정만 빠진다
 */
export function cardLinksFromChannels(
    rows: Parameters<typeof resolveOrgChannels>[0],
    items: CardItemRow[]
): LinkPageLink[] {
    const channels = resolveOrgChannels(rows, {});
    const itemOf = new Map(items.map((i) => [i.channel_id, i]));
    const withItem = channels.filter((c) => c.id !== null && itemOf.has(c.id));
    const withoutItem = channels.filter((c) => c.id === null || !itemOf.has(c.id));
    withItem.sort((a, b) => itemOf.get(a.id!)!.sort_order - itemOf.get(b.id!)!.sort_order);
    return [...withItem, ...withoutItem].flatMap((c) => {
        const item = c.id !== null ? itemOf.get(c.id) : undefined;
        if (item && !item.is_visible) return [];
        const display = item && isDisplay(item.display) ? item.display : CHANNEL_TYPES[c.type].defaultDisplay;
        return [
            {
                key: `ch:${c.id}`,
                label: c.text,
                url: c.url,
                channelType: c.type,
                display,
                subtitle: display === 'card' ? item?.subtitle ?? null : null,
                thumbnailUrl: display === 'card' ? item?.thumbnail_url ?? null : null,
            },
        ];
    });
}

const LEGACY_KIND_TYPE: Record<string, ChannelType> = { homepage: 'homepage', brochure: 'brochure', shop: 'smartstore' };

/** 공식 채널 이전 전 조직: 기존 동작 그대로 (등록 링크가 있으면 그 목록, 없으면 기본 목록 auto:{n}) */
async function legacyCardLinks(org: {
    id: number;
    company_url: string | null;
    backlinks: unknown;
    brochure_url: string | null;
    extra_materials: unknown;
    links: Array<{ id: number; label: string; url: string; kind: string; display: string; subtitle: string | null; thumbnail_url: string | null }>;
}): Promise<LinkPageLink[]> {
    const typeOf = (url: string, kind: string): ChannelType => detectChannelType(url) ?? channelTypeOf(LEGACY_KIND_TYPE[kind] ?? 'other');
    const hasRegistered = org.links.length > 0 || (await prisma.organizationLink.count({ where: { organization_id: org.id } })) > 0;
    if (hasRegistered) {
        return org.links.map((l) => ({
            key: `link:${l.id}`,
            label: l.label,
            url: l.url,
            channelType: typeOf(l.url, l.kind),
            display: isDisplay(l.display) ? l.display : 'button',
            subtitle: l.subtitle,
            thumbnailUrl: l.thumbnail_url,
        }));
    }
    return deriveDefaultOrgLinks(org).map((l, i) => ({
        key: `auto:${i}`,
        label: l.label,
        url: l.url,
        channelType: typeOf(l.url, l.kind),
        display: l.display,
        subtitle: l.subtitle,
        thumbnailUrl: l.thumbnail_url,
    }));
}
