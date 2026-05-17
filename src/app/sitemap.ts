import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const domain = process.env.DOMAIN || 'zinsight.com';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${domain}`;

    // Static routes
    const staticRoutes = [
        '',
        '/magazine',
        '/insight-radar',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic magazine routes
    const magazinePosts = await prisma.magazinePost.findMany({
        where: {
            status: 'PUBLISHED',
            deletedAt: null,
        },
        select: {
            slug: true,
            updatedAt: true,
        },
    });

    const magazineRoutes = magazinePosts.map((post) => ({
        url: `${baseUrl}/magazine/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }));

    return [...staticRoutes, ...magazineRoutes];
}
