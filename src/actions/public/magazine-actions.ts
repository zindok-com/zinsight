'use server';

import { prisma } from '@/lib/db';
import { MagazineCategory } from '@prisma/client';

export async function getPublicMagazinePosts(keyword?: string) {
    const where: any = { 
        status: 'PUBLISHED',
        deletedAt: null
    };

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
            industries: {
                include: {
                    industry: true
                }
            },
            organizations: {
                include: {
                    organization: true
                }
            },
            author: true,
            region: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function getHeadlineMagazinePosts() {
    const posts = await prisma.magazinePost.findMany({
        where: { 
            status: 'PUBLISHED',
            headlinePriority: { gt: 0 },
            deletedAt: null
        },
        include: {
            industries: {
                include: {
                    industry: true
                }
            },
            author: true
        },
        orderBy: {
            headlinePriority: 'asc'
        },
        take: 5
    });

    return posts.map(post => ({
        id: post.id,
        title: post.title,
        summary: post.summary,
        slug: post.slug,
        thumbnailUrl: post.thumbnailUrl,
        industryName: post.industries[0]?.industry?.name ?? '기타',
        authorName: post.authorName,
        author: post.author ? {
            name: post.author.name,
            slug: post.author.slug,
        } : null,
        createdAt: post.createdAt
    }));
}

export async function getTechMarketingPosts() {
    return await prisma.magazinePost.findMany({
        where: { 
            status: 'PUBLISHED',
            deletedAt: null,
            category: {
                in: ['NEWSLETTER', 'INTELLIGENCE_REPORT']
            }
        },
        include: {
            industries: {
                include: {
                    industry: true
                }
            },
            organizations: {
                include: {
                    organization: true
                }
            },
            author: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function getLocalPosts(regionSlug?: string) {
    const whereClause: any = {
        status: 'PUBLISHED',
        deletedAt: null,
        category: {
            in: ['VALLEY_NOW', 'LOCAL_SME', 'MARKET_FLASH']
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
            industries: {
                include: {
                    industry: true
                }
            },
            organizations: {
                include: {
                    organization: true
                }
            },
            author: true,
            region: true
        },
        orderBy: {
            createdAt: 'desc'
        }
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

