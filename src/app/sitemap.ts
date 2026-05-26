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
    ];

    // Dynamic magazine routes
    let magazineRoutes: MetadataRoute.Sitemap = [];
    try {
        const magazinePosts = await prisma.magazinePost.findMany({
            where: {
                status: 'PUBLISHED',
                deletedAt: null,
            },
            select: {
                slug: true,
                updatedAt: true,
                createdAt: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        magazineRoutes = magazinePosts.map((post) => ({
            url: `${baseUrl}/magazine/${post.slug}`,
            lastModified: post.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch (error) {
        console.error('[sitemap] DB 조회 실패, 빈 매거진 목록으로 진행:', error);
    }

    return [...staticRoutes, ...magazineRoutes];
}
