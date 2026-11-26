'use server';

import { prisma } from '@/lib/db';
import { getMagazinePostPath, ZINSIGHT_NEWS_CATEGORY } from '@/lib/site';
import { sponsoredBadgeLabel } from '@/config/site';

/** 메인 슬라이드 기사 수 */
const HOME_SLIDE_COUNT = 12;

export async function getPublicMagazinePosts(keyword?: string, options: { excludeNews?: boolean } = {}) {
    const where: any = { 
        status: 'PUBLISHED',
        deletedAt: null
    };
    if (options.excludeNews) {
        where.category = { slug: { not: ZINSIGHT_NEWS_CATEGORY } };
    }

    if (keyword) {
        where.OR = [
            { title: { contains: keyword } },
            { targetKeywords: { contains: keyword } },
            { content: { contains: keyword } }
        ];
    }

    return await prisma.magazinePost.findMany({
        where,
        include: {
            category: true,
            organizations: {
                include: {
                    organization: true
                }
            },
            author: true,
            region: true
        },
        orderBy: [
            { publishedAt: 'desc' },
            { createdAt: 'desc' }
        ]
    });
}

/**
 * 메인 매거진 슬라이드: 최신 발행 기사 12편 자동, 관리자 '홈 노출'(isInHomeSection) 체크 기사는 맨 앞에 고정.
 * 진사이트 소식 분류는 제외
 */
export async function getHeadlineMagazinePosts() {
    const rows = await prisma.magazinePost.findMany({
        where: { 
            status: 'PUBLISHED',
            deletedAt: null,
            category: { slug: { not: ZINSIGHT_NEWS_CATEGORY } }
        },
        include: {
            category: true,
            organizations: {
                include: {
                    organization: true
                }
            },
            author: true,
            region: true
        },
        orderBy: [
            { isInHomeSection: 'desc' },
            { publishedAt: 'desc' },
            { createdAt: 'desc' }
        ],
        take: HOME_SLIDE_COUNT
    });
    const posts = rows; // 정렬: 고정(홈 노출) 먼저, 그다음 최신순

    return posts.map(post => ({
        id: post.id,
        title: post.title,
        summary: post.summary,
        slug: post.slug,
        href: getMagazinePostPath(post),
        industryName: post.category?.name ?? '',
        /** 후원 기사 배지 ('협찬'·'협력 기관'), 아니면 null */
        sponsoredBadge: post.isPaid ? sponsoredBadgeLabel(post.category?.slug) : null,
        thumbnailUrl: post.thumbnailUrl,
        authorName: post.authorName,
        author: post.author ? {
            name: post.author.name,
            slug: post.author.slug,
        } : null,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt
    }));
}

/** slug별 공개 기사 주소 (/about 걸어온 길 링크용). 없거나 비공개인 slug는 빠짐 */
export async function getPublishedPostPaths(slugs: string[]): Promise<Record<string, string>> {
    if (slugs.length === 0) return {};
    try {
        const rows = await prisma.magazinePost.findMany({
            where: { slug: { in: slugs }, status: 'PUBLISHED', deletedAt: null },
            select: { slug: true, category: { select: { isLocal: true } }, region: { select: { slug: true } } },
        });
        return Object.fromEntries(rows.map((r) => [r.slug, getMagazinePostPath(r)]));
    } catch {
        return {};
    }
}

/** 진사이트 소식 목록 (/magazine/news). 기사 주소는 /magazine/tech-marketing/{slug} 그대로 */
export async function getZinsightNewsPosts() {
    return await prisma.magazinePost.findMany({
        where: { 
            status: 'PUBLISHED',
            deletedAt: null,
            category: { slug: ZINSIGHT_NEWS_CATEGORY }
        },
        include: {
            category: true,
            region: true,
            author: true
        },
        orderBy: [
            { publishedAt: 'desc' },
            { createdAt: 'desc' }
        ]
    });
}

export async function getLocalPosts(regionSlug?: string) {
    const whereClause: any = {
        status: 'PUBLISHED',
        deletedAt: null,
        category: {
            slug: {
                in: ['spotlight', 'briefing', 'edu-collab']
            }
        }
    };

    if (regionSlug) {
        whereClause.region = {
            slug: regionSlug
        };
    }

    return await prisma.magazinePost.findMany({
        where: whereClause,
        include: {
            category: true,
            organizations: {
                include: {
                    organization: true
                }
            },
            author: true,
            region: true
        },
        orderBy: [
            { publishedAt: 'desc' },
            { createdAt: 'desc' }
        ]
    });
}

export async function getRegions() {
    try {
        return await prisma.region.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error('[getRegions] Failed to query regions:', error);
        return [];
    }
}

