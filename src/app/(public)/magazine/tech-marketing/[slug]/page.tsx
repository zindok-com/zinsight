import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import MagazinePostDetail from '@/components/public/magazine/MagazinePostDetail';

export const revalidate = 3600; // 1시간마다 ISR 재생성
export const dynamicParams = true;

interface PageProps {
    params: Promise<{ slug: string }>;
}



export async function generateStaticParams() {
    const posts = await prisma.magazinePost.findMany({
        where: {
            status: 'PUBLISHED',
            deletedAt: null,
            category: { isLocal: false }
        },
        select: {
            slug: true,
        },
    });

    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const domain = process.env.DOMAIN || 'zinsight.co.kr';
    const baseUrl = `https://${domain}`;

    const post = await prisma.magazinePost.findFirst({
        where: { 
            slug,
            category: { isLocal: false }
        },
        include: {
            category: true,
            industries: { include: { industry: true } },
            organizations: { include: { organization: true } },
            author: true
        }
    });

    if (!post || post.deletedAt !== null) {
        return {
            title: 'Not Found',
            robots: { index: false, follow: false },
        };
    }

    const title = `${post.title} | Zinsight Magazine`;
    let description = post.summary || '';
    if (!description) {
        try {
            if (post.content.trim().startsWith('{')) {
                const parsed = JSON.parse(post.content);
                description = parsed.lead?.slice(0, 160) || '';
            }
        } catch {}
        if (!description && !post.content.trim().startsWith('{')) {
            description = post.content.slice(0, 160).trim();
        }
        if (!description) description = `${post.title} — Zinsight Magazine 리서치 콘텐츠`;
    }
    description = description.replace(/\*\*/g, '').replace(/\*\{.*?\}\*/g, '').slice(0, 160);

    const ogImage = post.thumbnailUrl || `${baseUrl}/img/zinsight_icon.png`;
    const tags = [
        ...post.industries.map(pi => pi.industry.name),
        ...post.organizations.map(po => po.organization.company_name)
    ];

    return {
        title,
        description,
        alternates: {
            canonical: `${baseUrl}/magazine/tech-marketing/${post.slug}`,
        },
        robots: {
            index: post.status === 'PUBLISHED',
            follow: post.status === 'PUBLISHED',
        },
        openGraph: {
            title,
            description,
            type: 'article',
            url: `${baseUrl}/magazine/tech-marketing/${post.slug}`,
            publishedTime: post.createdAt.toISOString(),
            modifiedTime: post.updatedAt.toISOString(),
            section: 'Tech & Marketing',
            authors: [post.author?.name || post.authorName || 'Zinsight 편집부'],
            tags: tags.length > 0 ? tags : undefined,
            locale: 'ko_KR',
            siteName: 'Zinsight',
            images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function TechMarketingDetailPage({ params }: PageProps) {
    const { slug } = await params;

    const post = await prisma.magazinePost.findFirst({
        where: { 
            slug,
            category: { isLocal: false }
        },
        include: {
            category: true,
            industries: {
                include: {
                    industry: true
                }
            },
            organizations: {
                include: {
                    organization: true
                }
            },
            author: true,
            region: true
        }
    });

    if (!post || post.deletedAt !== null || post.status !== 'PUBLISHED') {
        notFound();
    }

    const domain = process.env.DOMAIN || 'zinsight.co.kr';
    const baseUrl = `https://${domain}`;

    // Tech Article 스키마 및 브레드크럼 통합 JSON-LD
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                '@id': `${baseUrl}/magazine/tech-marketing/${post.slug}#breadcrumb`,
                'itemListElement': [
                    {
                        '@type': 'ListItem',
                        'position': 1,
                        'name': 'Home',
                        'item': baseUrl
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'name': 'Magazine',
                        'item': `${baseUrl}/magazine`
                    },
                    {
                        '@type': 'ListItem',
                        'position': 3,
                        'name': 'Tech & Marketing',
                        'item': `${baseUrl}/magazine/tech-marketing`
                    },
                    {
                        '@type': 'ListItem',
                        'position': 4,
                        'name': post.title,
                        'item': `${baseUrl}/magazine/tech-marketing/${post.slug}`
                    }
                ]
            },
            {
                '@type': 'TechArticle',
                '@id': `${baseUrl}/magazine/tech-marketing/${post.slug}#article`,
                'headline': post.title,
                'description': post.summary || (post.content.length > 150 ? post.content.slice(0, 150) + '...' : post.content),
                'image': post.thumbnailUrl ? [
                    `${post.thumbnailUrl}?ar=16:9`,
                    `${post.thumbnailUrl}?ar=4:3`,
                    `${post.thumbnailUrl}?ar=1:1`
                ] : [
                    `${baseUrl}/img/zinsight_icon.png?ar=16:9`,
                    `${baseUrl}/img/zinsight_icon.png?ar=4:3`,
                    `${baseUrl}/img/zinsight_icon.png?ar=1:1`
                ],
                'datePublished': post.createdAt.toISOString(),
                'dateModified': post.updatedAt.toISOString(),
                'author': {
                    '@type': 'Person',
                    'name': post.author?.name || post.authorName || 'Zinsight 편집부',
                },
                'publisher': {
                    '@type': 'Organization',
                    'name': 'Zinsight',
                    'logo': {
                        '@type': 'ImageObject',
                        'url': `${baseUrl}/img/zinsight_icon.png`,
                    },
                },
                'mainEntityOfPage': {
                    '@type': 'WebPage',
                    '@id': `${baseUrl}/magazine/tech-marketing/${post.slug}`,
                },
                'keywords': [
                    post.category?.name || '뉴스레터',
                    ...post.industries.map((pi: any) => pi.industry.name),
                ].join(', '),
            }
        ]
    };

    const breadcrumb = (
        <div className="text-[11px] sm:text-xs text-zi-outline font-ui-label flex items-center gap-1.5 flex-wrap">
            <Link href="/magazine" className="hover:text-zi-secondary transition-colors">Magazine</Link>
            <span>&gt;</span>
            <Link href="/magazine/tech-marketing" className="hover:text-zi-secondary transition-colors">Tech & Marketing</Link>
            <span>&gt;</span>
            <span className="text-zi-on-surface-variant font-medium line-clamp-1">{post.title}</span>
        </div>
    );

    return (
        <MagazinePostDetail 
            post={post}
            breadcrumb={breadcrumb}
            backLink="/magazine/tech-marketing"
            jsonLd={jsonLd}
        />
    );
}
