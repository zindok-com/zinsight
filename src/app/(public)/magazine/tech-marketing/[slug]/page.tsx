import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import MagazinePostDetail from '@/components/public/magazine/MagazinePostDetail';

// MagazinePostDetail과 동일한 카테고리 레이블 매핑 (메타데이터 일치)
function getCategoryLabel(category: { slug: string } | null | undefined): string {
    if (!category) return 'Newsletter';
    switch (category.slug) {
        case 'tech-marketing': return 'Digital Marketing';
        case 'spotlight': return 'Spotlight';
        case 'briefing': return 'Briefing';
        case 'newsletter':
        default:
            return 'Newsletter';
    }
}

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
    const categoryLabel = getCategoryLabel(post.category);
    // 화면 배지와 동일한 소스로 article:tag 다중 출력
    const tags = [
        categoryLabel,
        ...(post.isPaid ? ['파트너'] : []),
        ...post.industries.map((pi: any) => pi.industry.name),
        ...post.organizations.map((po: any) => po.organization.company_name),
        ...(post.targetKeywords
            ? post.targetKeywords.split(',').map((t: string) => t.trim()).filter(Boolean)
            : []),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i); // 중복 제거

    return {
        title,
        description,
        // 포스트별 동적 키워드
        keywords: tags.join(', '),
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

    const ldCategoryLabel = getCategoryLabel(post.category);
    const ldKeywords = [
        ldCategoryLabel,
        ...(post.isPaid ? ['파트너', 'Sponsored Content'] : []),
        ...post.industries.map((pi: any) => pi.industry.name),
        ...post.organizations.map((po: any) => po.organization.company_name),
        ...(post.targetKeywords
            ? post.targetKeywords.split(',').map((t: string) => t.trim()).filter(Boolean)
            : []),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i);

    // NewsArticle 스키마 및 브레드크럼 통합 JSON-LD
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
                '@type': 'NewsArticle',
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
                'articleSection': '테크 · 마케팅',
                'keywords': ldKeywords.join(', '),
                'mentions': [
                    ...post.organizations.map((po: any) => ({
                        '@type': 'Organization',
                        'name': po.organization.company_name,
                    })),
                ],
                ...(post.isPaid && post.organizations.length > 0 ? {
                    'isAccessibleForFree': true,
                    'sponsor': {
                        '@type': 'Organization',
                        'name': post.organizations[0].organization.company_name,
                    },
                } : {}),
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
