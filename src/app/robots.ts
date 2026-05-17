import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const domain = process.env.DOMAIN || 'zinsight.com';
    const baseUrl = `https://${domain}`;

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/login', '/api'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
