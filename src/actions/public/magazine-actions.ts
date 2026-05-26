'use server';

import { prisma } from '@/lib/db';

export async function getPublicMagazinePosts() {
    return await prisma.magazinePost.findMany({
        where: { 
            status: 'PUBLISHED',
            deletedAt: null
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
            }
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
            }
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
        createdAt: post.createdAt
    }));
}
