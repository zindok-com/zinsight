import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

// sitemap 자체도 1시간마다 재생성
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const domain = process.env.DOMAIN || 'zinsight.co.kr'; // fallback 수정
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${domain}`;

    // Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/magazine`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/insight-radar`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/magazine/tech-marketing`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/magazine/local`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
    ];

    let magazineRoutes: MetadataRoute.Sitemap = [];
    let regionRoutes: MetadataRoute.Sitemap = [];
    
    try {
        // Fetch active regions for sitemap inclusion
        const regions = await prisma.region.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true }
        });

        regionRoutes = regions.map((reg) => ({
            url: `${baseUrl}/magazine/local/${reg.slug}`,
            lastModified: reg.updatedAt,
            changeFrequency: 'daily' as const,
            priority: 0.8,
        }));

        const magazinePosts = await prisma.magazinePost.findMany({
            where: {
                status: 'PUBLISHED',
                deletedAt: null,
            },
            select: {
                slug: true,
                updatedAt: true,
                createdAt: true,
                category: {
                    select: { isLocal: true }
                },
                region: {
                    select: { slug: true }
                }
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        magazineRoutes = magazinePosts.map((post) => {
            const path = post.category?.isLocal && post.region 
                ? `/magazine/local/${post.region.slug}/${post.slug}`
                : `/magazine/tech-marketing/${post.slug}`;
            return {
                url: `${baseUrl}${path}`,
                lastModified: post.updatedAt,
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            };
        });

        // Fetch active organizations for sitemap inclusion
        const organizations = await prisma.organization.findMany({
            select: { id: true, updated_at: true },
            orderBy: { updated_at: 'desc' }
        });

        const orgRoutes: MetadataRoute.Sitemap = organizations.map((org) => ({
            url: `${baseUrl}/insight-radar/${org.id}`,
            lastModified: org.updated_at,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));

        return [...staticRoutes, ...regionRoutes, ...magazineRoutes, ...orgRoutes];
    } catch (error) {
        console.error('[sitemap] DB 조회 실패, 기본 목록으로 진행:', error);
    }

    return [...staticRoutes, ...regionRoutes, ...magazineRoutes];
}
