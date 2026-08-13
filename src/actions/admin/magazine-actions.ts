'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function revalidateMagazinePostPaths(postId: number, oldSlug?: string) {
    try {
        const post = await prisma.magazinePost.findUnique({
            where: { id: postId },
            include: { region: true, category: true }
        });

        if (!post) return;

        // 1. Revalidate listing index pages
        revalidatePath('/magazine');
        revalidatePath('/magazine/tech-marketing');
        revalidatePath('/magazine/local');
        revalidatePath('/');
        revalidatePath('/admin/magazine');
        revalidatePath('/admin/magazine/headlines');
        revalidatePath('/admin');

        // 2. Revalidate dynamic path
        if (oldSlug) {
            revalidatePath(`/magazine/${oldSlug}`);
        }
        revalidatePath(`/magazine/${post.slug}`);

        if (post.category?.isLocal && post.region?.slug) {
            revalidatePath(`/magazine/local/${post.region.slug}`);
            revalidatePath(`/magazine/local/${post.region.slug}/${post.slug}`);
            if (oldSlug) {
                revalidatePath(`/magazine/local/${post.region.slug}/${oldSlug}`);
            }
        } else {
            revalidatePath(`/magazine/tech-marketing/${post.slug}`);
            if (oldSlug) {
                revalidatePath(`/magazine/tech-marketing/${oldSlug}`);
            }
        }
    } catch (e) {
        console.error('Failed to revalidate magazine post paths:', e);
    }
}

function processMagazineContent(content: string, providedSummary?: string) {
    let sections: any = {
        lead: '',
        bodies: [],
        closing: ''
    };

    let isAlreadyJson = false;
    try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && ('lead' in parsed || 'bodies' in parsed)) {
            sections = parsed;
            isAlreadyJson = true;
        }
    } catch (e) {
        // Not a JSON string, fallback to markdown parsing
    }

    if (!isAlreadyJson) {
        // 섹션별 분리 로직 (마크다운 기반)
        // 1. 리드 추출
        const leadMatch = content.match(/\*\*\(리드\)\*\*\s*([\s\S]*?)(?=\*\*\(|$)/);
        if (leadMatch) sections.lead = leadMatch[1].trim();

        // 2. 본문 섹션들 추출
        const bodyMatches = content.matchAll(/\*\*\(본문\s*\d+\s*[—|-]\s*(.*?)\)\*\*\s*([\s\S]*?)(?=\*\*\(|$)/g);
        for (const match of bodyMatches) {
            sections.bodies.push({
                title: match[1].trim(),
                content: match[2].trim()
            });
        }

        // 3. 클로징 추출
        const closingMatch = content.match(/\*\*\(클로징\)\*\*\s*([\s\S]*?)(?=\*\*\(|$)/);
        if (closingMatch) sections.closing = closingMatch[1].trim();
    }

    // 요약(summary)은 리드 내용을 기본으로 사용
    const summary = providedSummary || sections.lead || '';

    // 전체 본문을 구조화된 JSON 문자열로 저장
    const structuredContent = JSON.stringify(sections);

    return { summary, cleanedContent: structuredContent };
}

export async function getMagazinePosts() {
    return await prisma.magazinePost.findMany({
        where: {
            deletedAt: null
        },
        include: {
            category: true,
            region: true,
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
    categoryId: number;
    slug?: string;
    thumbnailUrl?: string;
    organizationIds?: number[];
    status?: string;
    regionId?: number | null;
    targetKeywords?: string | null;
    isPaid?: boolean;
}) {
    try {
        const { organizationIds = [], slug: providedSlug, categoryId, regionId = null, targetKeywords = null, lead, bodies, closing, ...postData } = data as any;
        
        let slug = providedSlug;

        const categoryRecord = await prisma.magazineCategory.findUnique({
            where: { id: categoryId }
        });

        // Auto-slug for NEWSLETTER if not provided
        if (!slug && categoryRecord?.slug === 'newsletter') {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            slug = `${year}-${month}-newsletter`;
            
            // Check if slug exists, if so append random
            const existing = await prisma.magazinePost.findUnique({ where: { slug } });
            if (existing) {
                slug += '-' + Math.random().toString(36).substring(2, 5);
            }
        }

        // Generic slug generation if still not set
        if (!slug) {
            slug = data.title
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-4);
        }

        // Content processing: Extract summary from lead and clean markers
        const { summary: extractedSummary, cleanedContent } = processMagazineContent(postData.content, (postData as any).summary);

        const post = await prisma.magazinePost.create({
            data: {
                ...postData,
                content: cleanedContent,
                summary: extractedSummary,
                categoryId,
                slug,
                regionId,
                targetKeywords,
                organizations: {
                    create: organizationIds.map((id: number) => ({
                        organizationId: id
                    }))
                }
            }
        });

        await revalidateMagazinePostPaths(post.id);
        return { success: true, post };
    } catch (error: any) {
        console.error('Failed to create magazine post:', error);
        return { success: false, error: error.message };
    }
}

export async function updateMagazinePost(id: number, data: {
    title: string;
    content: string;
    categoryId: number;
    slug: string;
    thumbnailUrl?: string;
    organizationIds?: number[];
    status?: string;
    regionId?: number | null;
    targetKeywords?: string | null;
    isPaid?: boolean;
}) {
    try {
        const oldPost = await prisma.magazinePost.findUnique({
            where: { id },
            select: { slug: true }
        });

        const { organizationIds = [], regionId = null, targetKeywords = null, categoryId, lead, bodies, closing, ...postData } = data as any;

        // Content processing: Extract summary from lead and clean markers
        const { summary: extractedSummary, cleanedContent } = processMagazineContent(postData.content, (postData as any).summary);

        const post = await prisma.magazinePost.update({
            where: { id },
            data: {
                ...postData,
                content: cleanedContent,
                summary: extractedSummary,
                categoryId,
                regionId,
                targetKeywords,
                organizations: {
                    deleteMany: {},
                    create: organizationIds.map((id: number) => ({
                        organizationId: id
                    }))
                }
            }
        });

        await revalidateMagazinePostPaths(post.id, oldPost?.slug);
        return { success: true, post };
    } catch (error: any) {
        console.error('Failed to update magazine post:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteMagazinePost(id: number) {
    try {
        const postBeforeDelete = await prisma.magazinePost.findUnique({
            where: { id },
            include: { region: true, category: true }
        });

        const post = await prisma.magazinePost.update({
            where: { id },
            data: {
                deletedAt: new Date()
            }
        });
        
        if (postBeforeDelete) {
            await revalidateMagazinePostPaths(id, postBeforeDelete.slug);
        }
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete magazine post:', error);
        return { success: false, error: error.message };
    }
}

export async function updateHomeSectionStatus(id: number, active: boolean) {
    try {
        await prisma.magazinePost.update({
            where: { id },
            data: { isInHomeSection: active }
        });
        await revalidateMagazinePostPaths(id);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update home section status:', error);
        return { success: false, error: error.message };
    }
}

export async function updatePortalFeaturedStatus(id: number, active: boolean) {
    try {
        await prisma.$transaction(async (tx) => {
            if (active) {
                await tx.magazinePost.updateMany({
                    where: { isPortalFeatured: true, id: { not: id } },
                    data: { isPortalFeatured: false }
                });
            }
            await tx.magazinePost.update({
                where: { id },
                data: { isPortalFeatured: active }
            });
        });
        await revalidateMagazinePostPaths(id);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update portal featured status:', error);
        return { success: false, error: error.message };
    }
}

export async function updatePortalSidePriority(id: number, priority: number) {
    try {
        await prisma.$transaction(async (tx) => {
            if (priority > 0) {
                await tx.magazinePost.updateMany({
                    where: { portalSidePriority: priority, id: { not: id } },
                    data: { portalSidePriority: 0 }
                });
            }
            await tx.magazinePost.update({
                where: { id },
                data: { portalSidePriority: priority }
            });
        });
        await revalidateMagazinePostPaths(id);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update portal side priority:', error);
        return { success: false, error: error.message };
    }
}

export async function migrateMagazineContent() {
    try {
        const posts = await prisma.magazinePost.findMany();
        let migratedCount = 0;

        for (const post of posts) {
            // 이미 JSON 형태라면 스킵
            if (post.content.trim().startsWith('{')) continue;

            const { summary, cleanedContent } = processMagazineContent(post.content, post.summary || undefined);

            await prisma.magazinePost.update({
                where: { id: post.id },
                data: {
                    content: cleanedContent,
                    summary: summary
                }
            });
            migratedCount++;
        }

        revalidatePath('/magazine');
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, count: migratedCount };
    } catch (error: any) {
        console.error('Migration failed:', error);
        return { success: false, error: error.message };
    }
}

export async function updateMultipleMagazinePostsStatus(ids: number[], status: string) {
    try {
        const posts = await prisma.magazinePost.findMany({
            where: { id: { in: ids } },
            select: { id: true, slug: true }
        });

        await prisma.magazinePost.updateMany({
            where: {
                id: { in: ids }
            },
            data: {
                status
            }
        });
        for (const post of posts) {
            await revalidateMagazinePostPaths(post.id);
        }
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update multiple posts status:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTechFeaturedStatus(id: number, active: boolean) {
    try {
        await prisma.$transaction(async (tx) => {
            if (active) {
                await tx.magazinePost.updateMany({
                    where: { isTechFeatured: true, id: { not: id } },
                    data: { isTechFeatured: false }
                });
            }
            await tx.magazinePost.update({
                where: { id },
                data: { isTechFeatured: active }
            });
        });
        await revalidateMagazinePostPaths(id);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update tech featured status:', error);
        return { success: false, error: error.message };
    }
}

export async function updateLocalFeaturedStatus(id: number, active: boolean) {
    try {
        const post = await prisma.magazinePost.findUnique({
            where: { id },
            select: { regionId: true }
        });
        if (!post) {
            return { success: false, error: '기사를 찾을 수 없습니다.' };
        }
        await prisma.$transaction(async (tx) => {
            if (active && post.regionId) {
                await tx.magazinePost.updateMany({
                    where: { regionId: post.regionId, isLocalFeatured: true, id: { not: id } },
                    data: { isLocalFeatured: false }
                });
            }
            await tx.magazinePost.update({
                where: { id },
                data: { isLocalFeatured: active }
            });
        });
        await revalidateMagazinePostPaths(id);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update local featured status:', error);
        return { success: false, error: error.message };
    }
}

export async function getMagazineCategories() {
    try {
        return await prisma.magazineCategory.findMany({
            orderBy: { id: 'asc' }
        });
    } catch (error: any) {
        console.error('Failed to get magazine categories:', error);
        return [];
    }
}
