'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getAuthors() {
    try {
        return await prisma.author.findMany({
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error('Failed to get authors:', error);
        return [];
    }
}

export async function createAuthor(data: {
    name: string;
    slug: string;
    avatarUrl?: string;
    bio?: string;
}) {
    try {
        const name = data.name.trim();
        let slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        
        if (!name) return { success: false, error: '이름을 입력해주세요.' };
        if (!slug) return { success: false, error: '올바른 슬러그를 입력해주세요.' };

        // Check duplicates
        const existingName = await prisma.author.findUnique({ where: { name } });
        if (existingName) return { success: false, error: '이미 존재하는 발행자 이름입니다.' };

        const existingSlug = await prisma.author.findUnique({ where: { slug } });
        if (existingSlug) return { success: false, error: '이미 존재하는 슬러그입니다.' };

        const author = await prisma.author.create({
            data: {
                name,
                slug,
                avatarUrl: data.avatarUrl || null,
                bio: data.bio || null
            }
        });

        revalidatePath('/admin/magazine/authors');
        revalidatePath('/magazine');
        revalidatePath('/');
        return { success: true, author };
    } catch (error: any) {
        console.error('Failed to create author:', error);
        return { success: false, error: error.message };
    }
}

export async function updateAuthor(
    id: number,
    data: {
        name: string;
        slug: string;
        avatarUrl?: string;
        bio?: string;
    }
) {
    try {
        const name = data.name.trim();
        let slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        
        if (!name) return { success: false, error: '이름을 입력해주세요.' };
        if (!slug) return { success: false, error: '올바른 슬러그를 입력해주세요.' };

        // Check duplicates excluding self
        const existingName = await prisma.author.findFirst({
            where: { name, id: { not: id } }
        });
        if (existingName) return { success: false, error: '이미 존재하는 발행자 이름입니다.' };

        const existingSlug = await prisma.author.findFirst({
            where: { slug, id: { not: id } }
        });
        if (existingSlug) return { success: false, error: '이미 존재하는 슬러그입니다.' };

        const author = await prisma.author.update({
            where: { id },
            data: {
                name,
                slug,
                avatarUrl: data.avatarUrl || null,
                bio: data.bio || null
            }
        });

        // Revalidate public routes
        revalidatePath('/admin/magazine/authors');
        revalidatePath(`/author/${author.slug}`);
        revalidatePath('/magazine');
        revalidatePath('/');
        
        // Find and revalidate all posts authored by this author
        const posts = await prisma.magazinePost.findMany({
            where: { authorId: id },
            select: { slug: true }
        });
        for (const post of posts) {
            revalidatePath(`/magazine/${post.slug}`);
        }

        return { success: true, author };
    } catch (error: any) {
        console.error('Failed to update author:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteAuthor(id: number) {
    try {
        const author = await prisma.author.findUnique({
            where: { id },
            select: { slug: true }
        });
        
        if (!author) return { success: false, error: '발행자를 찾을 수 없습니다.' };

        // Delete from database (relation onDelete: SetNull handles post references)
        await prisma.author.delete({
            where: { id }
        });

        revalidatePath('/admin/magazine/authors');
        revalidatePath(`/author/${author.slug}`);
        revalidatePath('/magazine');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete author:', error);
        return { success: false, error: error.message };
    }
}

export async function getPublicAuthorBySlug(slug: string) {
    try {
        return await prisma.author.findUnique({
            where: { slug },
            include: {
                posts: {
                    where: {
                        status: 'PUBLISHED',
                        deletedAt: null
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        category: true,
                        region: true,
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to get public author by slug:', error);
        return null;
    }
}
