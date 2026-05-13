'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getMagazinePosts() {
    return await prisma.magazinePost.findMany({
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

export async function createMagazinePost(data: {
    title: string;
    content: string;
    category?: 'NEWSLETTER' | 'DEEP_DIVE';
    slug?: string;
    thumbnailUrl?: string;
    industryIds: number[];
    organizationIds?: number[];
    status?: string;
}) {
    try {
        const { industryIds, organizationIds = [], slug: providedSlug, category = 'NEWSLETTER', ...postData } = data;
        
        let slug = providedSlug;

        // Auto-slug for NEWSLETTER if not provided
        if (!slug && category === 'NEWSLETTER' && industryIds.length > 0) {
            const industry = await prisma.industry.findUnique({
                where: { id: industryIds[0] },
                select: { slug: true }
            });
            if (industry) {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                slug = `${year}-${month}-${industry.slug}`;
                
                // Check if slug exists, if so append random
                const existing = await prisma.magazinePost.findUnique({ where: { slug } });
                if (existing) {
                    slug += '-' + Math.random().toString(36).substring(2, 5);
                }
            }
        }

        // Generic slug generation if still not set
        if (!slug) {
            slug = data.title
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-4);
        }

        const post = await prisma.magazinePost.create({
            data: {
                ...postData,
                category,
                slug,
                industries: {
                    create: industryIds.map(id => ({
                        industryId: id
                    }))
                },
                organizations: {
                    create: organizationIds.map(id => ({
                        organizationId: id
                    }))
                }
            }
        });

        revalidatePath('/admin/magazine');
        revalidatePath('/admin');
        return { success: true, post };
    } catch (error: any) {
        console.error('Failed to create magazine post:', error);
        return { success: false, error: error.message };
    }
}

export async function updateMagazinePost(id: number, data: {
    title: string;
    content: string;
    category: 'NEWSLETTER' | 'DEEP_DIVE';
    slug: string;
    thumbnailUrl?: string;
    industryIds: number[];
    organizationIds?: number[];
    status?: string;
}) {
    try {
        const { industryIds, organizationIds = [], ...postData } = data;

        const post = await prisma.magazinePost.update({
            where: { id },
            data: {
                ...postData,
                industries: {
                    deleteMany: {},
                    create: industryIds.map(id => ({
                        industryId: id
                    }))
                },
                organizations: {
                    deleteMany: {},
                    create: organizationIds.map(id => ({
                        organizationId: id
                    }))
                }
            }
        });

        revalidatePath('/admin/magazine');
        revalidatePath('/admin');
        return { success: true, post };
    } catch (error: any) {
        console.error('Failed to update magazine post:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteMagazinePost(id: number) {
    try {
        await prisma.magazinePost.delete({
            where: { id }
        });
        revalidatePath('/admin/magazine');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete magazine post:', error);
        return { success: false, error: error.message };
    }
}

export async function updateHeadlinePriority(id: number, priority: number) {
    try {
        await prisma.$transaction(async (tx) => {
            // 만약 새로 설정하려는 우선순위가 0보다 크다면, 
            // 이미 해당 우선순위를 가진 다른 포스트가 있는지 확인하고 0으로 초기화
            if (priority > 0) {
                await tx.magazinePost.updateMany({
                    where: { 
                        headlinePriority: priority,
                        id: { not: id }
                    },
                    data: { headlinePriority: 0 }
                });
            }

            // 현재 포스트의 우선순위 업데이트
            await tx.magazinePost.update({
                where: { id },
                data: { headlinePriority: priority }
            });
        });

        revalidatePath('/admin/magazine');
        revalidatePath('/admin/magazine/headlines');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update headline priority:', error);
        return { success: false, error: error.message };
    }
}
