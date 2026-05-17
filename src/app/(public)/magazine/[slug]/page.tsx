import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Metadata } from 'next';

export const revalidate = 3600; // 1시간마다 점진적 정적 재생성(ISR)
export const dynamicParams = true; // 빌드 타임에 생성되지 않은 새 포스트도 온디맨드로 정적 생성

export async function generateStaticParams() {
    const posts = await prisma.magazinePost.findMany({
        where: {
            status: 'PUBLISHED',
            deletedAt: null,
        },
        select: {
            slug: true,
        },
    });

    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const domain = process.env.DOMAIN || 'zinsight.com';
    const baseUrl = `https://${domain}`;

    const post = await prisma.magazinePost.findUnique({
        where: { slug },
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
        }
    });

    if (!post || post.deletedAt !== null) return { title: 'Not Found' };

    const title = `${post.title} | Zinsight Magazine`;
    const description = post.summary || (post.content.length > 150 ? post.content.slice(0, 150) + '...' : post.content);
    const ogImage = post.thumbnailUrl || `${baseUrl}/img/zinsight_icon.png`;
    
    // 키워드 태그 목록 추출
    const tags = [
        ...post.industries.map(pi => pi.industry.name),
        ...post.organizations.map(po => po.organization.company_name)
    ];

    return {
        title,
        description,
        alternates: {
            canonical: `${baseUrl}/magazine/${post.slug}`,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        openGraph: {
            title,
            description,
            type: 'article',
            url: `${baseUrl}/magazine/${post.slug}`,
            publishedTime: post.createdAt.toISOString(),
            modifiedTime: post.updatedAt.toISOString(),
            section: post.category === 'DEEP_DIVE' ? 'Deep Dive' : 'Newsletter',
            authors: [post.authorName || 'Zinsight 편집부'],
            tags: tags.length > 0 ? tags : undefined,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

// 텍스트 강조 처리를 위한 컴포넌트
function HighlightedText({ text }: { text: string }) {
    if (!text) return null;
    
    // 줄바꿈 처리
    const lines = text.split('\n');
    
    return (
        <>
            {lines.map((line, lineIdx) => {
                const parts = line.split(/(\*\*\{.*?\}\*\*|\*\*.*?\*\*)/g);
                return (
                    <span key={lineIdx} className="block mb-4 last:mb-0">
                        {parts.map((part, i) => {
                            if (part.startsWith('**{') && part.endsWith('}**')) {
                                const content = part.slice(3, -3);
                                return <span key={i} className="font-bold text-zi-blue underline decoration-zi-blue/30 underline-offset-4">{content}</span>;
                            }
                            if (part.startsWith('**') && part.endsWith('**')) {
                                const content = part.slice(2, -2);
                                return <span key={i} className="font-bold text-zi-blue">{content}</span>;
                            }
                            return part;
                        })}
                    </span>
                );
            })}
        </>
    );
}

export default async function MagazinePostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    if (!slug) {
        notFound();
    }

    const post = await prisma.magazinePost.findUnique({
        where: { slug },
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
        }
    });

    if (!post || post.deletedAt !== null) {
        notFound();
    }

    // JSON 형태인지 확인하고 파싱
    let parsedContent: {
        lead?: string;
        bodies?: { title: string; content: string }[];
        closing?: string;
    } | null = null;

    try {
        if (post.content.trim().startsWith('{')) {
            parsedContent = JSON.parse(post.content);
        }
    } catch (e) {
        console.error("Failed to parse content JSON:", e);
    }

    const isDeepDive = post.category === 'DEEP_DIVE';
    const mainIndustry = post.industries?.[0]?.industry?.name || '인사이트';

    const domain = process.env.DOMAIN || 'zinsight.com';
    const baseUrl = `https://${domain}`;

    // JSON-LD 구조화 데이터 구축 (Article Schema)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        'headline': post.title,
        'description': post.summary || (post.content.length > 150 ? post.content.slice(0, 150) + '...' : post.content),
        'image': post.thumbnailUrl ? [post.thumbnailUrl] : [`${baseUrl}/img/zinsight_icon.png`],
        'datePublished': post.createdAt.toISOString(),
        'dateModified': post.updatedAt.toISOString(),
        'author': {
            '@type': 'Person',
            'name': post.authorName || 'Zinsight 편집부',
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
            '@id': `${baseUrl}/magazine/${post.slug}`,
        },
        'keywords': [
            post.category === 'DEEP_DIVE' ? 'Deep Dive' : 'Newsletter',
            ...post.industries.map(pi => pi.industry.name),
            ...post.organizations.map(po => po.organization.company_name),
        ].join(', '),
    };

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface pb-24">
            {/* SEO 구조화 데이터 주입 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main className="mx-auto max-w-[1024px] px-6 pt-12">
                {/* ─────────────────────────────── */}
                {/* 내비게이션 & 메타 정보 */}
                {/* ─────────────────────────────── */}
                <div className="mb-12">
                    <Link href="/magazine" className="inline-flex items-center gap-2 text-ui-label font-ui-label font-semibold text-zi-outline-variant hover:text-zi-primary transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        BACK TO MAGAZINE
                    </Link>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <span className="font-ui-label text-[11px] uppercase tracking-widest bg-zi-surface-container-highest px-3 py-1.5 rounded-full text-zi-blue font-bold">
                            {isDeepDive ? 'Deep Dive' : 'Newsletter'}
                        </span>
                        <span className="text-zi-outline font-ui-label text-ui-label font-semibold uppercase tracking-widest">
                            {mainIndustry}
                        </span>
                    </div>
                    
                    <h1 className="font-h1 text-[36px] md:text-[42px] leading-[1.2] text-zi-primary mb-6 tracking-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-between border-y border-zi-divider py-4 mt-8">
                        <div className="flex items-center gap-4 text-zi-outline font-ui-label text-[13px]">
                            <span className="text-zi-on-surface font-semibold">By {post.authorName || 'Zinsight 편집부'}</span>
                            <span>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex gap-2">
                            {/* 향후 공유 버튼 등을 위한 공간 */}
                        </div>
                    </div>
                </div>

                {/* ─────────────────────────────── */}
                {/* 썸네일 */}
                {/* ─────────────────────────────── */}
                {post.thumbnailUrl && (
                    <div className="w-full aspect-[16/9] bg-zi-surface-container-low rounded-zi-card overflow-hidden relative mb-16 shadow-sm">
                        <Image 
                            src={post.thumbnailUrl} 
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                {/* ─────────────────────────────── */}
                {/* 본문 영역 */}
                {/* ─────────────────────────────── */}
                <article className="prose prose-lg max-w-none prose-headings:text-zi-primary prose-p:text-zi-on-surface-variant prose-p:leading-[1.8] prose-p:font-body-md">
                    {parsedContent ? (
                        <div className="flex flex-col gap-12">
                            {/* 리드 (Lead) */}
                            {parsedContent.lead && (
                                <div className="text-[20px] leading-[1.7] font-body-lg text-zi-on-surface border-l-4 border-zi-blue pl-6 py-2 bg-gradient-to-r from-zi-blue/5 to-transparent rounded-r-lg">
                                    <HighlightedText text={parsedContent.lead} />
                                </div>
                            )}

                            {/* 바디 (Bodies) */}
                            {parsedContent.bodies && parsedContent.bodies.map((body, idx) => (
                                <section key={idx} className="flex flex-col gap-6 scroll-mt-24" id={`section-${idx}`}>
                                    {body.title && (
                                        <h2 className="font-h2 text-h2 text-zi-primary border-b border-zi-divider pb-4 flex items-center gap-3">
                                            <span className="text-zi-blue text-h3 opacity-50 font-serif italic">{(idx + 1).toString().padStart(2, '0')}.</span>
                                            {body.title}
                                        </h2>
                                    )}
                                    <div className="text-[17px]">
                                        <HighlightedText text={body.content} />
                                    </div>
                                </section>
                            ))}

                            {/* 클로징 (Closing) */}
                            {parsedContent.closing && (
                                <div className="mt-8 p-8 bg-zi-surface-container-low rounded-zi-card border border-zi-divider/50 text-[17px]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-zi-blue" />
                                        <span className="font-ui-label text-ui-label font-bold text-zi-secondary uppercase tracking-widest">
                                            Closing Thoughts
                                        </span>
                                    </div>
                                    <HighlightedText text={parsedContent.closing} />
                                </div>
                            )}
                        </div>
                    ) : (
                        /* 구형 데이터 포맷 (단순 텍스트) */
                        <div className="text-[17px]">
                            <HighlightedText text={post.content} />
                        </div>
                    )}
                </article>

                {/* ─────────────────────────────── */}
                {/* 관련 태그 (Tags) */}
                {/* ─────────────────────────────── */}
                {(post.industries.length > 0 || post.organizations.length > 0) && (
                    <div className="mt-16 pt-8 border-t border-zi-divider flex flex-wrap gap-2">
                        {post.industries.map(pi => (
                            <span key={`ind-${pi.industry.id}`} className="px-3 py-1.5 bg-zi-surface-container-low text-zi-on-surface-variant rounded-full text-[13px] font-medium border border-zi-divider/50">
                                # {pi.industry.name}
                            </span>
                        ))}
                        {post.organizations.map(po => (
                            <span key={`org-${po.organization.id}`} className="px-3 py-1.5 bg-zi-surface-container-low text-zi-on-surface-variant rounded-full text-[13px] font-medium border border-zi-divider/50">
                                # {po.organization.company_name}
                            </span>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
