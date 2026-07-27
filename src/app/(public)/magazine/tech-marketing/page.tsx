import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { getTechMarketingPosts } from '@/actions/public/magazine-actions';
import { getRadarIndustries } from '@/actions/insight-radar-actions';
import { ImpressionTracker } from '@/components/public/analytics/ImpressionTracker';

export const revalidate = 1800; // 30분마다 ISR 재생성

const domain = process.env.DOMAIN || 'zinsight.co.kr';
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    title: {
        absolute: '테크 · 마케팅 저널 | Zinsight Magazine',
    },
    description: '인공지능(AI) 시대의 GEO/SEO 마케팅 전략, B2B 리서치 분석 보고서를 다루는 기술 전문 저널 지면입니다.',
    alternates: {
        canonical: `${baseUrl}/magazine/tech-marketing`,
    },
};

function HighlightedText({ text }: { text: string }) {
    if (!text) return null;
    
    const parts = text.split(/(\*\*\{.*?\}\*\*|\*\*.*?\*\*)/g);
    
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**{') && part.endsWith('}**')) {
                    const content = part.slice(3, -3);
                    return <span key={i} className="font-bold text-zi-primary underline decoration-zi-primary/30 underline-offset-4">{content}</span>;
                }
                if (part.startsWith('**') && part.endsWith('**')) {
                    const content = part.slice(2, -2);
                    return <span key={i} className="font-bold text-zi-primary">{content}</span>;
                }
                return part;
            })}
        </>
    );
}

export default async function TechMarketingPage() {
    const allPosts = await getTechMarketingPosts();

    // 1번: 헤드라인 (테크 마케팅 전용 헤드라인 지정)
    const featuredPost = allPosts.find(p => p.isTechFeatured) || allPosts[0] || null;
    
    // 일반 기사 리스트
    const gridArticles = featuredPost 
        ? allPosts.filter(p => p.id !== featuredPost.id) 
        : allPosts;

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            <main className="mx-auto max-w-zi-container px-4 sm:px-6 py-8 sm:py-12">
                {/* 브레드크럼 */}
                <div className="mb-4 text-xs text-zi-outline font-ui-label flex items-center gap-1.5">
                    <Link href="/magazine" className="hover:text-zi-secondary transition-colors">Magazine</Link>
                    <span>&gt;</span>
                    <span className="text-zi-on-surface-variant">Tech & Marketing</span>
                </div>

                <div className="mb-8 sm:mb-12 flex flex-col md:flex-row items-start sm:items-end justify-between border-b border-zi-divider pb-5 gap-3">
                    <div>
                        <span className="mb-2 block text-ui-label font-ui-label font-semibold text-zi-secondary uppercase tracking-widest flex items-center gap-1.5">
                            <Newspaper className="w-4 h-4" /> CORE JOURNALISM
                        </span>
                        <h1 className="font-h1 text-[26px] sm:text-[34px] lg:text-h1 text-zi-primary uppercase tracking-tighter">
                            테크 · 마케팅 저널
                        </h1>
                    </div>
                    <div className="max-w-md text-right hidden md:block">
                        <p className="text-xs text-zi-on-surface-variant leading-relaxed break-keep [text-wrap:balance]">
                            AI 시대의 고품격 B2B 리서치 보고서 및<br />
                            최신 검색 최적화(GEO·SEO) 기술 동향.
                        </p>
                    </div>
                </div>

                {/* featuredPost */}
                {featuredPost && (
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 mb-12 sm:mb-20 items-center">
                        <div className="lg:col-span-6 flex flex-col justify-center order-2 lg:order-1">
                            <div className="mb-4">
                                <span className="font-ui-label text-[10px] uppercase tracking-widest bg-zi-surface-container-highest px-3 py-1 rounded-full text-zi-primary font-bold">
                                    {featuredPost.category?.slug === 'tech-marketing' ? 'Digital Marketing' : 'Newsletter'}
                                </span>
                            </div>
                            <ImpressionTracker postId={featuredPost.id}>
                                <Link href={`/magazine/tech-marketing/${featuredPost.slug}`} className="group block cursor-pointer">
                                    <h2 className="font-h1 text-[22px] sm:text-[28px] lg:text-h1 text-zi-on-surface mb-4 group-hover:text-zi-secondary transition-colors">
                                        {featuredPost.title}
                                    </h2>
                                    <p className="font-body-md text-body-md text-zi-on-surface-variant mb-6">
                                        <HighlightedText 
                                            text={featuredPost.summary ?? (featuredPost.content ? featuredPost.content.slice(0, 180) + '...' : '')} 
                                        />
                                    </p>
                                </Link>
                            </ImpressionTracker>
                            <div className="flex items-center gap-4 text-zi-outline font-ui-label text-ui-label border-t border-zi-divider pt-4">
                                <span className="text-zi-on-surface font-semibold">
                                    By {featuredPost.author?.name || featuredPost.authorName || 'Zinsight 편집부'}
                                </span>
                                <span>•</span>
                                <span>{new Date(featuredPost.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="lg:col-span-6 aspect-[4/3] w-full order-1 lg:order-2">
                            <Link href={`/magazine/tech-marketing/${featuredPost.slug}`} className="w-full h-full bg-zi-surface-container-low rounded-zi-card overflow-hidden shadow-sm relative block group">
                                {featuredPost.thumbnailUrl ? (
                                    <Image 
                                        src={featuredPost.thumbnailUrl} 
                                        alt={featuredPost.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        priority
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-zi-primary/10 to-zi-secondary/5 flex items-center justify-center text-zi-outline-variant italic">
                                        No Image Available
                                    </div>
                                )}
                            </Link>
                        </div>
                    </section>
                )}

                {/* 그리드 기사 목록 */}
                <div className="border-t border-zi-divider pt-12">
                    <h3 className="font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline mb-8">
                        Latest Technical Articles
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                        {gridArticles.length > 0 ? (
                            gridArticles.map((article) => {
                                const industryName = article.industries?.[0]?.industry?.name || '인사이트';
                                
                                return (
                                    <ImpressionTracker postId={article.id} key={article.id}>
                                        <Link href={`/magazine/tech-marketing/${article.slug}`} className="flex flex-col group cursor-pointer h-full">
                                            <div className="mb-4 sm:mb-6 aspect-[16/10] bg-zi-surface-container-low rounded-zi-card overflow-hidden relative">
                                                {article.thumbnailUrl ? (
                                                    <Image 
                                                        src={article.thumbnailUrl} 
                                                        alt={article.title}
                                                        fill
                                                        className="object-cover transition-all duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full transition-all duration-500 group-hover:scale-105 bg-zi-surface-container" />
                                                )}
                                                {article.isPaid && (
                                                    <div className="absolute top-2 right-2 z-10 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50/90 backdrop-blur-sm border border-amber-200 px-2 py-0.5 rounded-full">
                                                        파트너
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-start">
                                                <span className="mb-2 block text-ui-label font-ui-label font-semibold uppercase tracking-wider text-zi-secondary">
                                                    {industryName}
                                                </span>
                                                <h4 className="mb-2 font-h3 text-[18px] sm:text-h3 text-zi-primary group-hover:text-zi-secondary transition-colors line-clamp-2 leading-snug">
                                                    {article.title}
                                                </h4>
                                                <p className="mb-4 line-clamp-3 overflow-hidden text-body-md font-body-md text-zi-on-surface-variant leading-relaxed">
                                                    <HighlightedText text={article.summary || ''} />
                                                </p>
                                            </div>
                                            <div className="mt-auto flex items-center justify-between border-t border-zi-divider pt-3 text-zi-outline text-ui-label">
                                                <span>{article.author?.name || article.authorName || 'Zinsight 편집부'}</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </div>
                                        </Link>
                                    </ImpressionTracker>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-16 px-8 border border-dashed border-zi-divider rounded-zi-card bg-zi-surface-container-low flex flex-col items-center justify-center text-center">
                                <p className="text-body-md text-zi-on-surface-variant max-w-sm">
                                    등록된 기사가 없습니다. 새로운 인사이트를 준비 중입니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
