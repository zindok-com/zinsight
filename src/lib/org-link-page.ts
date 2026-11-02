import { cache } from 'react';
import { prisma } from '@/lib/db';
import { getMagazinePostPath } from '@/lib/site';
import { sanitizeHref } from '@/lib/utils';
import { buildListTagline } from '@/lib/radar';
import { deriveDefaultOrgLinks, detectSocialPlatform, type OrgLinkDisplay, type OrgLinkKind, type SocialPlatform } from '@/lib/org-links';

export interface LinkPageLink {
    /** 클릭 집계 키 (link:{id} 또는 기본 링크는 auto:{n}) */
    key: string;
    label: string;
    url: string;
    kind: OrgLinkKind;
    display: OrgLinkDisplay;
    subtitle: string | null;
    thumbnailUrl: string | null;
    platform: SocialPlatform | null;
}

export interface LinkPageArticle {
    id: number;
    title: string;
    path: string;
    thumbnailUrl: string | null;
    date: Date | null;
}

export interface LinkPageData {
    id: number;
    slug: string;
    name: string;
    logoUrl: string | null;
    tagline: string | null;
    inquiryHref: string | null;
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
            inquiry_url: true,
            contact_email: true,
            contact_phone: true,
            links: { where: { is_visible: true }, orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] },
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

    // 관리자가 한 번이라도 저장한 조직은 등록 목록만 사용 (숨김만 있어도 기본 목록으로 되돌리지 않음)
    const hasRegistered = org.links.length > 0 || (await prisma.organizationLink.count({ where: { organization_id: org.id } })) > 0;
    const links: LinkPageLink[] = hasRegistered
        ? org.links.map((l) => ({
              key: `link:${l.id}`,
              label: l.label,
              url: l.url,
              kind: l.kind as OrgLinkKind,
              display: l.display as OrgLinkDisplay,
              subtitle: l.subtitle,
              thumbnailUrl: l.thumbnail_url,
              platform: detectSocialPlatform(l.url),
          }))
        : deriveDefaultOrgLinks(org).map((l, i) => ({
              key: `auto:${i}`,
              label: l.label,
              url: l.url,
              kind: l.kind,
              display: l.display,
              subtitle: l.subtitle,
              thumbnailUrl: l.thumbnail_url,
              platform: detectSocialPlatform(l.url),
          }));

    // 문의 연결처: 프로필과 같은 우선순위 (문의 URL → 이메일 → 전화)
    const inquiryHref =
        (org.inquiry_url ? sanitizeHref(org.inquiry_url) : null) ||
        (org.contact_email ? `mailto:${org.contact_email}` : null) ||
        (org.contact_phone ? `tel:${org.contact_phone.replace(/[^0-9+]/g, '')}` : null);

    return {
        id: org.id,
        slug: org.slug || String(org.id),
        name: org.company_name,
        logoUrl: org.logo_url,
        tagline: buildListTagline(org.company_name, org.tagline, org.business_summary),
        inquiryHref,
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
