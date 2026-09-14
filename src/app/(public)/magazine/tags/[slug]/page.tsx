import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, Newspaper, Building2 } from 'lucide-react';
import Link from 'next/link';
import { getPublicMagazinePosts } from '@/actions/public/magazine-actions';
import { getRadarRegions } from '@/actions/insight-radar-actions';
import RadarSocialProof from '@/components/public/RadarSocialProof';

export const revalidate = 1800; // 30분마??ISR ?�생??
const domain = "www.zinsight.co.kr";
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    title: '매거�?- ?�크·마�????�??& 로컬 비즈?�스 ?�브',
    description: '진사?�트 매거진�? ?�트?�사??비즈?�스 ?�사?�트�??�?�리�?기�??�로 ?�구?�한 ?�폰?�드 콘텐츠�? ?�립 리포?��? ?�께 발행?�니??',
    alternates: {
        canonical: `${baseUrl}/magazine`,
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

// 기사 카테고리/지??구성??맞춰 ?�적 URL??가?�오???�퍼 ?�수
const getPostUrl = (post: any) => {
    if (post.category?.isLocal && post.region?.slug) {
        return `/magazine/local/${post.region.slug}/${post.slug}`;
    }
    return `/magazine/tech-marketing/${post.slug}`;
};

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function TagArchivePage({ params }: PageProps) {
    const resolvedParams = await params;
    const keyword = decodeURIComponent(resolvedParams.slug || '');
    const isSearchMode = !!keyword;

    const [allPosts, regions] = await Promise.all([
        getPublicMagazinePosts(keyword),
        getRadarRegions(),
    ]);

    // 1�? ?�처???�토�?(Hero) - 검??모드가 ?�닐 ?�만 ?�출
    const featuredPost = !isSearchMode ? (allPosts.find(p => p.isPortalFeatured) || allPosts[0] || null) : null;
    
    // 2~5�? ?�렌???�이?�바 (More Headlines) - 검??모드가 ?�닐 ?�만 ?�출
    const sideArticles = !isSearchMode ? allPosts
        .filter(p => p.portalSidePriority >= 1 && p.portalSidePriority <= 4)
        .sort((a, b) => a.portalSidePriority - b.portalSidePriority) : [];
        
    // 0�? 메인 리스??(최신?? ?�처??�??�이??기사??중복 ?�출?��? ?�도�??�터�?
    const gridArticles = isSearchMode ? allPosts : allPosts.filter(p => !p.isPortalFeatured && p.portalSidePriority === 0);

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            <main className="mx-auto max-w-zi-container px-4 sm:px-6 py-8 sm:py-12">
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                {/* 매거�??�더 */}
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                <div className="mb-8 sm:mb-16 flex flex-col md:flex-row items-start sm:items-end justify-between border-b border-zi-divider pb-5 sm:pb-8 gap-3 sm:gap-0">
                    <div>
                        <span className="mb-2 block text-ui-label font-ui-label font-semibold text-zi-secondary uppercase tracking-widest">
                            {isSearchMode ? `?�워??검??결과 (${allPosts.length}�?` : '최신 ?�디??}
                        </span>
                        <h1 className="font-h1 text-[26px] sm:text-[34px] lg:text-h1 text-zi-primary uppercase tracking-tighter">
                            {isSearchMode ? `"${keyword}" 검?? : '진사?�트 매거�?}
                        </h1>
                    </div>
                    {isSearchMode ? (
                        <Link href="/magazine" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4">
                            ?�체 ?�디??보기
                        </Link>
                    ) : (
                        <div className="hidden text-right md:block">
                            <p className="max-w-sm text-body-md font-body-md text-zi-on-surface-variant leading-relaxed break-keep [text-wrap:balance]">
                                ?�이?�의 깊이?� ?�?�리즘의 ?�찰??만난 �?<br />
                                마�??�의 격을 ?�이???�리미엄 미디??                            </p>
                        </div>
                    )}
                </div>

                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                {/* ?�처???�토�?(Hero) */}
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                {featuredPost && (
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 mb-12 sm:mb-16 items-center">
                        <div className="lg:col-span-6 flex flex-col justify-center order-2 lg:order-1">
                            <div className="mb-4">
                                <span className="font-ui-label text-[10px] uppercase tracking-widest bg-zi-surface-container-highest px-3 py-1 rounded-full text-zi-primary font-bold">
                                    {featuredPost.category?.isLocal && featuredPost.region 
                                        ? `${featuredPost.region.name} ${featuredPost.category.name}` 
                                        : (featuredPost.category?.slug === 'tech-marketing' ? 'Digital Marketing' : 'Newsletter')}
                                </span>
                            </div>
                            <Link href={getPostUrl(featuredPost)} className="group block cursor-pointer">
                                <h2 className="font-h1 text-[22px] sm:text-[28px] lg:text-h1 text-zi-on-surface mb-4 sm:mb-6 group-hover:text-zi-secondary transition-colors">
                                    {featuredPost.title}
                                </h2>
                                <p className="font-body-md text-body-md sm:font-body-lg sm:text-body-lg text-zi-on-surface-variant mb-6 sm:mb-8">
                                    <HighlightedText 
                                        text={featuredPost.summary ?? (featuredPost.content ? featuredPost.content.slice(0, 180) + '...' : '')} 
                                    />
                                </p>
                            </Link>
                            <div className="flex items-center gap-4 text-zi-outline font-ui-label text-ui-label border-t border-zi-divider pt-4">
                                <span className="text-zi-on-surface font-semibold">
                                    By{' '}
                                    {featuredPost.author ? (
                                        <Link 
                                            href={`/author/${featuredPost.author.slug}`} 
                                            className="hover:text-indigo-600 underline underline-offset-4 decoration-indigo-300 transition-colors"
                                        >
                                            {featuredPost.author.name}
                                        </Link>
                                    ) : (
                                        featuredPost.authorName || '진사?�트 ?�집부'
                                    )}
                                </span>
                                <span>??/span>
                                <span>{new Date(featuredPost.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="lg:col-span-6 aspect-[16/10] w-full order-1 lg:order-2">
                            <Link href={getPostUrl(featuredPost)} className="w-full h-full bg-slate-50 border border-zi-divider/30 rounded-zi-card overflow-hidden shadow-sm relative block group">
                                {featuredPost.thumbnailUrl ? (
                                    <Image 
                                        src={featuredPost.thumbnailUrl} 
                                        alt={featuredPost.title}
                                        fill
                                        className="object-contain transition-transform duration-700 group-hover:scale-[1.02]"
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

                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                {/* ?�션 바로가�??�비게이??*/}
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    <Link href="/magazine/tech-marketing" className="group p-6 sm:p-8 rounded-zi-card border border-zi-divider bg-gradient-to-tr from-slate-900 to-indigo-950 text-white shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Newspaper className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-4" />
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">CORE JOURNALISM</span>
                            <h3 className="text-xl sm:text-2xl font-bold mt-2 mb-3">?�크 · 마�????�??/h3>
                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm">
                                기업???�크·마�????�공 ?��??� ?�략 ?�사?�트�??�트?�십 �??�체 리서�?기반?�로 ?�루??진사?�트??콘텐�?코너?�니??
                            </p>
                            <span className="mt-6 flex items-center text-xs font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors">
                                ?�크·마�???지�?바로가�?<ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </Link>

                    <Link href="/magazine/local" className="group p-6 sm:p-8 rounded-zi-card border border-indigo-100 bg-gradient-to-tr from-indigo-50/50 to-sky-50/30 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Building2 className="w-32 h-32 text-indigo-900 transform rotate-12 translate-x-8 -translate-y-4" />
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600">B2G & SME SYNERGY</span>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-3">로컬 비즈?�스 ?�브</h3>
                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-sm">
                                ?�국 주요 지?�체???�성 ?�업 ?�식, 관???�크 ?��??�업 ?�공 ?��? �??�상공인과의 ?��????�생 기사�?모아보는 ?�화 지면입?�다.
                            </p>
                            <span className="mt-6 flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                                로컬 비즈?�스 ?�브 바로가�?<ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </Link>
                </div>

                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                {/* ?�브 ?�션 (그리??+ ?�이?�바) */}
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
                    {/* 메인 리스??*/}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 self-start">
                        {gridArticles.length > 0 ? (
                            gridArticles.map((article) => {
                                const categoryLabel = article.category?.name || '?�사?�트';
                                
                                return (
                                    <Link key={article.id} href={getPostUrl(article)} className="flex flex-col group cursor-pointer">
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
                                            {(article as any).isPaid && (
                                                <div className="absolute top-2 right-2 z-10 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50/90 backdrop-blur-sm border border-amber-200 px-2 py-0.5 rounded-full">
                                                    ?�트??                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-start">
                                            <span className="mb-2 block text-ui-label font-ui-label font-semibold uppercase tracking-wider text-zi-secondary">
                                                {article.region?.name ? `${article.region.name} ??${categoryLabel}` : categoryLabel}
                                            </span>
                                            <h4 className="mb-2 font-h3 text-[18px] sm:text-h3 text-zi-primary group-hover:text-zi-secondary transition-colors line-clamp-2 leading-snug">
                                                {article.title}
                                            </h4>
                                            <p className="mb-4 line-clamp-3 overflow-hidden text-body-md font-body-md text-zi-on-surface-variant leading-relaxed">
                                                <HighlightedText text={article.summary || ''} />
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between border-t border-zi-divider pt-3 text-zi-outline text-ui-label">
                                            <span>{article.author?.name || article.authorName || '진사?�트 ?�집부'}</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-16 px-8 border border-dashed border-zi-divider rounded-zi-card bg-zi-surface-container-low flex flex-col items-center justify-center text-center">
                                <h3 className="font-h3 text-h3 text-zi-primary mb-3">
                                    ?�록??기사가 ?�습?�다.
                                </h3>
                                <p className="text-body-md text-zi-on-surface-variant max-w-sm">
                                    ?�자 ?�러분을 ?�한 ?�로???�디?�과 깊이 ?�는 리포?��? 준�?중입?�다. 조금�?기다??주세??
                                </p>
                            </div>
                        )}
                    </div>
                    {/* ?�이?�바 */}
                    <div className="lg:col-span-4 flex flex-col gap-8 sm:gap-12 self-start">
                        <RadarSocialProof limit={8} />
 
                        {/* ?�렌???�이?�바 */}
                        {sideArticles.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                <h3 className="font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline pb-2 border-b border-zi-divider">
                                    More Headlines
                                </h3>
                                {sideArticles.map((article) => (
                                    <Link key={article.id} href={getPostUrl(article)} className="group cursor-pointer block">
                                        <h4 className="font-h3 text-[18px] leading-snug text-zi-primary mb-2 group-hover:text-zi-secondary transition-colors">
                                            {article.title}
                                        </h4>
                                        <p className="mb-3 line-clamp-2 text-[13px] text-zi-on-surface-variant leading-relaxed">
                                            <HighlightedText text={(article as any).summary || (article.content ? article.content.slice(0, 100) : '')} />
                                        </p>
                                        <div className="flex items-center gap-2 text-zi-outline text-[12px]">
                                            <span>{article.category?.name || article.region?.name || '?�식'}</span>
                                            <span>??/span>
                                            <span>{article.author?.name || article.authorName || '진사?�트 ?�집부'}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 p-6 border border-dashed border-zi-divider rounded-zi-card bg-zi-surface-container-low/40">
                                <h4 className="font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline pb-2 border-b border-zi-divider">
                                    More Headlines
                                </h4>
                                <p className="text-[13px] text-zi-on-surface-variant italic">
                                    추�??�인 주요 ?�드?�인??준�?중입?�다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

