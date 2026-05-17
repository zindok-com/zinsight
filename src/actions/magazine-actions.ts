'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

function processMagazineContent(content: string, providedSummary?: string) {
    const sections: any = {
        lead: '',
        bodies: [],
        closing: ''
    };

    // 섹션별 분리 로직
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

    // 요약(summary)은 리드 내용을 기본으로 사용
    const summary = providedSummary || sections.lead;

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

        // Content processing: Extract summary from lead and clean markers
        const { summary: extractedSummary, cleanedContent } = processMagazineContent(postData.content, (postData as any).summary);

        const post = await prisma.magazinePost.create({
            data: {
                ...postData,
                content: cleanedContent,
                summary: extractedSummary,
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

        // Content processing: Extract summary from lead and clean markers
        const { summary: extractedSummary, cleanedContent } = processMagazineContent(postData.content, (postData as any).summary);

        const post = await prisma.magazinePost.update({
            where: { id },
            data: {
                ...postData,
                content: cleanedContent,
                summary: extractedSummary,
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
        await prisma.magazinePost.update({
            where: { id },
            data: {
                deletedAt: new Date()
            }
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

        revalidatePath('/admin');
        return { success: true, count: migratedCount };
    } catch (error: any) {
        console.error('Migration failed:', error);
        return { success: false, error: error.message };
    }
}

export async function updateMultipleMagazinePostsStatus(ids: number[], status: string) {
    try {
        await prisma.magazinePost.updateMany({
            where: {
                id: { in: ids }
            },
            data: {
                status
            }
        });
        revalidatePath('/admin/magazine');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update multiple posts status:', error);
        return { success: false, error: error.message };
    }
}
