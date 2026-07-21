'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

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
    categoryId: number;
    slug?: string;
    thumbnailUrl?: string;
    industryIds?: number[];
    organizationIds?: number[];
    status?: string;
    regionId?: number | null;
    targetKeywords?: string | null;
}) {
    try {
        const { industryIds = [], organizationIds = [], slug: providedSlug, categoryId, regionId = null, targetKeywords = null, lead, bodies, closing, ...postData } = data as any;
        
        let slug = providedSlug;

        const categoryRecord = await prisma.magazineCategory.findUnique({
            where: { id: categoryId }
        });

        // Auto-slug for NEWSLETTER if not provided
        if (!slug && categoryRecord?.slug === 'newsletter' && industryIds.length > 0) {
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
                industries: {
                    create: industryIds.map((id: number) => ({
                        industryId: id
                    }))
                },
                organizations: {
                    create: organizationIds.map((id: number) => ({
                        organizationId: id
                    }))
                }
            }
        });

        revalidatePath('/magazine');
        revalidatePath('/');
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
    categoryId: number;
    slug: string;
    thumbnailUrl?: string;
    industryIds?: number[];
    organizationIds?: number[];
    status?: string;
    regionId?: number | null;
    targetKeywords?: string | null;
}) {
    try {
        const { industryIds = [], organizationIds = [], regionId = null, targetKeywords = null, categoryId, lead, bodies, closing, ...postData } = data as any;

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
                industries: {
                    deleteMany: {},
                    create: industryIds.map((id: number) => ({
                        industryId: id
                    }))
                },
                organizations: {
                    deleteMany: {},
                    create: organizationIds.map((id: number) => ({
                        organizationId: id
                    }))
                }
            }
        });

        revalidatePath('/magazine');
        revalidatePath('/');
        revalidatePath(`/magazine/${post.slug}`);
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
        const post = await prisma.magazinePost.update({
            where: { id },
            data: {
                deletedAt: new Date()
            }
        });
        revalidatePath('/magazine');
        revalidatePath('/');
        revalidatePath(`/magazine/${post.slug}`);
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

        revalidatePath('/magazine');
        revalidatePath('/');
        revalidatePath('/admin/magazine');
        revalidatePath('/admin/magazine/headlines');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update headline priority:', error);
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
            select: { slug: true }
        });

        await prisma.magazinePost.updateMany({
            where: {
                id: { in: ids }
            },
            data: {
                status
            }
        });
        revalidatePath('/magazine');
        revalidatePath('/');
        for (const post of posts) {
            revalidatePath(`/magazine/${post.slug}`);
        }
        revalidatePath('/admin/magazine');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update multiple posts status:', error);
        return { success: false, error: error.message };
    }
}

export async function updateLocalHeadlinePriority(id: number, priority: number) {
    try {
        const post = await prisma.magazinePost.findUnique({
            where: { id },
            select: { regionId: true, slug: true }
        });

        if (!post) {
            return { success: false, error: '기사를 찾을 수 없습니다.' };
        }

        await prisma.$transaction(async (tx) => {
            // 만약 새로 설정하려는 로컬 헤드라인 우선순위가 1(대표)이고, 기사에 연계 지역이 지정되어 있다면
            // 동일 지역의 다른 모든 로컬 기사의 localHeadlinePriority를 0으로 초기화
            if (priority > 0 && post.regionId) {
                await tx.magazinePost.updateMany({
                    where: { 
                        regionId: post.regionId,
                        localHeadlinePriority: priority,
                        id: { not: id }
                    },
                    data: { localHeadlinePriority: 0 }
                });
            }

            // 현재 포스트의 로컬 헤드라인 우선순위 업데이트
            await tx.magazinePost.update({
                where: { id },
                data: { localHeadlinePriority: priority }
            });
        });

        revalidatePath('/magazine');
        revalidatePath('/magazine/local');
        if (post.regionId) {
            const region = await prisma.region.findUnique({ where: { id: post.regionId } });
            if (region) {
                revalidatePath(`/magazine/local/${region.slug}`);
            }
        }
        revalidatePath('/');
        revalidatePath('/admin/magazine');
        revalidatePath('/admin/magazine/headlines');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update local headline priority:', error);
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
