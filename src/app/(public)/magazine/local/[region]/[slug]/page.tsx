import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import MagazinePostDetail from '@/components/public/magazine/MagazinePostDetail';

// MagazinePostDetail과 동일한 카테고리 레이블 매핑 (메타데이터 일치)
function getCategoryLabel(category: { name?: string; slug: string } | null | undefined): string {
    if (!category) return '뉴스레터';
    if (category.name) return category.name;
    switch (category.slug) {
        case 'tech-marketing': return '테크 · 마케팅';
        case 'spotlight': return '기업 스포트라이트';
        case 'briefing': return '관내 소식';
        case 'newsletter': return '뉴스레터';
        default:
            return category.slug || '뉴스레터';
    }
}

export const revalidate = 3600; // 1시간마다 ISR 재생성
export const dynamicParams = true;

interface PageProps {
    params: Promise<{ region: string; slug: string }>;
}



// 지자체별 지리 정보 사전 맵핑 (Geotagging 용)
const regionGeoMap: Record<string, { lat: number; lng: number; address: string }> = {
    anyang: { lat: 37.3943, lng: 126.9568, address: 'South Korea, Gyeonggi-do, Anyang-si' },
    seongnam: { lat: 37.4200, lng: 127.1265, address: 'South Korea, Gyeonggi-do, Seongnam-si' },
    busan: { lat: 35.1796, lng: 129.0756, address: 'South Korea, Busan' }
};

export async function generateStaticParams() {
    try {
        const posts = await prisma.magazinePost.findMany({
            where: {
                status: 'PUBLISHED',
                deletedAt: null,
                category: { isLocal: true },
                regionId: { not: null }
            },
            include: {
                region: true,
                category: true,
                author: true,
                organizations: { include: { organization: true } }
            }
        });

        return posts
            .filter(post => post.region !== null)
            .map((post) => ({
                region: post.region!.slug,
                slug: post.slug,
            }));
    } catch (error) {
        console.error('[generateStaticParams] Failed to query local posts:', error);
        return [];
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { region: regionSlug, slug } = await params;
    const domain = process.env.DOMAIN || 'zinsight.co.kr';
    const baseUrl = `https://${domain}`;

    let post = null;
    try {
        post = await prisma.magazinePost.findFirst({
            where: { 
                slug,
                category: { isLocal: true },
                region: { slug: regionSlug }
            },
            include: {
                category: true,
                organizations: { include: { organization: true } },
                author: true,
                region: true
            }
        });
    } catch (error) {
        console.error('[generateMetadata] Failed to query local post:', error);
    }

    if (!post || post.deletedAt !== null) {
        return {
            title: 'Not Found',
            robots: { index: false, follow: false },
        };
    }

    const title = `${post.title} | ${post.region?.name || '로컬'} | Zinsight Magazine`;
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
        if (!description) description = `${post.title} — Zinsight Magazine 로컬 비즈니스 뉴스`;
    }
    description = description.replace(/\*\*/g, '').replace(/\*\{.*?\}\*/g, '').slice(0, 160);

    const ogImage = post.thumbnailUrl || `${baseUrl}/img/zinsight_icon.png`;
    const categoryLabel = getCategoryLabel(post.category);
    // 화면 배지와 동일한 소스로 article:tag 다중 출력
    const tags = [
        categoryLabel,
        post.region?.name || '로컬',
        ...(post.isPaid ? ['파트너'] : []),
        ...post.organizations.map((po: any) => po.organization.company_name),
        ...(post.targetKeywords
            ? post.targetKeywords.split(',').map((t: string) => t.trim()).filter(Boolean)
            : []),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i); // 중복 제거

    return {
        title,
        description,
        // 포스트별 동적 키워드
        keywords: tags,
        alternates: {
            canonical: `${baseUrl}/magazine/local/${regionSlug}/${post.slug}`,
        },
        robots: {
            index: post.status === 'PUBLISHED',
            follow: post.status === 'PUBLISHED',
        },
        openGraph: {
            title,
            description,
            type: 'article',
            url: `${baseUrl}/magazine/local/${regionSlug}/${post.slug}`,
            publishedTime: post.createdAt.toISOString(),
            modifiedTime: post.updatedAt.toISOString(),
            section: 'Local Business',
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

export default async function LocalDetailPage({ params }: PageProps) {
    const { region: regionSlug, slug } = await params;

    let post = null;
    try {
        post = await prisma.magazinePost.findFirst({
            where: { 
                slug,
                category: { isLocal: true },
                region: { slug: regionSlug }
            },
            include: {
                category: true,
                organizations: {
                    include: {
                        organization: true
                    }
                },
                author: true,
                region: true
            }
        });
    } catch (error) {
        console.error('[LocalDetailPage] Failed to load local post:', error);
    }

    if (!post || post.deletedAt !== null || post.status !== 'PUBLISHED') {
        notFound();
    }

    const domain = process.env.DOMAIN || 'zinsight.co.kr';
    const baseUrl = `https://${domain}`;

    const geoData = regionGeoMap[regionSlug] || { lat: 37.5665, lng: 126.9780, address: 'Seoul, South Korea' };

    const ldCategoryLabel = getCategoryLabel(post.category);
    const ldKeywords = [
        ldCategoryLabel,
        post.region?.name || '로컬',
        ...(post.isPaid ? ['파트너', 'Sponsored Content'] : []),
        ...post.organizations.map((po: any) => po.organization.company_name),
        ...(post.targetKeywords
            ? post.targetKeywords.split(',').map((t: string) => t.trim()).filter(Boolean)
            : []),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i);

    // NewsArticle 스키마, 브레드크럼, 지오태깅(spatialCoverage) 통합 JSON-LD
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                '@id': `${baseUrl}/magazine/local/${regionSlug}/${post.slug}#breadcrumb`,
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
                        'name': 'Local Hub',
                        'item': `${baseUrl}/magazine/local`
                    },
                    {
                        '@type': 'ListItem',
                        'position': 4,
                        'name': post.region?.name || 'Local Region',
                        'item': `${baseUrl}/magazine/local/${regionSlug}`
                    },
                    {
                        '@type': 'ListItem',
                        'position': 5,
                        'name': post.title,
                        'item': `${baseUrl}/magazine/local/${regionSlug}/${post.slug}`
                    }
                ]
            },
            {
                '@type': 'NewsArticle',
                '@id': `${baseUrl}/magazine/local/${regionSlug}/${post.slug}#article`,
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
                'articleSection': post.category?.slug === 'edu-collab' ? '산학협력 · 교육' : '로컬 비즈니스',
                'keywords': ldKeywords.join(', '),
                'spatialCoverage': {
                    '@type': 'Place',
                    'name': post.region?.name || 'Local Region',
                    'geo': {
                        '@type': 'GeoCoordinates',
                        'latitude': geoData.lat,
                        'longitude': geoData.lng
                    },
                    'address': {
                        '@type': 'PostalAddress',
                        'addressLocality': post.region?.name || 'Local Region',
                        'addressCountry': 'KR'
                    }
                },
                'mentions': [
                    ...(post.region ? [{ '@type': 'Place', 'name': post.region.name }] : []),
                    ...post.organizations.map((po: any) => ({
                        // 산학협력 카테고리는 EducationalOrganization 타입으로 마크업
                        '@type': post.category?.slug === 'edu-collab'
                            ? 'EducationalOrganization'
                            : 'Organization',
                        'name': po.organization.company_name,
                        'sameAs': `${baseUrl}/insight-radar/${po.organization.id}`
                    })),
                ],
                ...(post.isPaid && post.organizations.length > 0 ? {
                    'isAccessibleForFree': true,
                    'sponsor': {
                        '@type': post.category?.slug === 'edu-collab'
                            ? 'EducationalOrganization'
                            : 'Organization',
                        'name': post.organizations[0].organization.company_name,
                        'sameAs': `${baseUrl}/insight-radar/${post.organizations[0].organization.id}`
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
                    '@id': `${baseUrl}/magazine/local/${regionSlug}/${post.slug}`,
                },
            }
        ]
    };

    const breadcrumb = (
        <div className="text-[11px] sm:text-xs text-zi-outline font-ui-label flex items-center gap-1.5 flex-wrap">
            <Link href="/magazine" className="hover:text-zi-secondary transition-colors">Magazine</Link>
            <span>&gt;</span>
            <Link href="/magazine/local" className="hover:text-zi-secondary transition-colors">Local Hub</Link>
            <span>&gt;</span>
            <Link href={`/magazine/local/${regionSlug}`} className="hover:text-zi-secondary transition-colors">{post.region?.name || 'Local'}</Link>
            <span>&gt;</span>
            <span className="text-zi-on-surface-variant font-medium line-clamp-1">{post.title}</span>
        </div>
    );

    return (
        <MagazinePostDetail 
            post={post}
            breadcrumb={breadcrumb}
            backLink={`/magazine/local/${regionSlug}`}
            jsonLd={jsonLd}
        />
    );
}
