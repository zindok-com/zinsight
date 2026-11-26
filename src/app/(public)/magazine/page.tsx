import { sponsoredBadgeLabel } from '@/config/site';
import type { Metadata } from 'next';
import Image from 'next/image';
import { cardImageSrc } from '@/lib/image-variants';
import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { getPublicMagazinePosts } from '@/actions/public/magazine-actions';
import { getRadarRegions } from '@/actions/insight-radar-actions';
import RadarSocialProof from '@/components/public/RadarSocialProof';
import { buildSocialMetadata, getMagazinePostPath } from '@/lib/site';
import { formatMagazineDate } from '@/lib/magazine-date';

export const revalidate = 1800; // 30분마다 ISR 재생성

const domain = "www.zinsight.co.kr";
const baseUrl = `https://${domain}`;

const MAGAZINE_TITLE = '진사이트 매거진 — 로컬 비즈니스 허브';
const MAGAZINE_DESCRIPTION = '안양·의왕·광명 등 지역 기업과 기관의 이야기를 기사로 정리해 전하는 진사이트 매거진입니다. 지역 지면별로 최신 기사를 모아 봅니다.';

export const metadata: Metadata = {
    title: { absolute: MAGAZINE_TITLE },
    description: MAGAZINE_DESCRIPTION,
    alternates: {
        canonical: `${baseUrl}/magazine`,
    },
    ...buildSocialMetadata({
        title: MAGAZINE_TITLE,
        description: MAGAZINE_DESCRIPTION,
        path: '/magazine',
    }),
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

const getPostUrl = getMagazinePostPath;

interface PageProps {
    searchParams: Promise<{ q?: string; keyword?: string }>;
}

export default async function MagazinePage({ searchParams }: PageProps) {
    const params = await searchParams;
    const keyword = params.q || params.keyword || '';
    const isSearchMode = !!keyword;

    const [allPosts, regions] = await Promise.all([
        getPublicMagazinePosts(keyword, { excludeNews: !isSearchMode }),
        getRadarRegions(),
    ]);

    // 1번: 피처드 스토리 (Hero) - 검색 모드가 아닐 때만 노출
    const featuredPost = !isSearchMode ? (allPosts.find(p => p.isPortalFeatured) || allPosts[0] || null) : null;
    
    // 2~5번: 트렌딩 사이드바 (More Headlines) - 검색 모드가 아닐 때만 노출
    const sideArticles = !isSearchMode ? allPosts
        .filter(p => p.portalSidePriority >= 1 && p.portalSidePriority <= 4)
        .sort((a, b) => a.portalSidePriority - b.portalSidePriority) : [];
        
    // 0번: 메인 리스트 (최신순, 피처드 및 사이드 기사는 중복 노출되지 않도록 필터링)
    const gridArticles = isSearchMode ? allPosts : allPosts.filter(p => !p.isPortalFeatured && p.portalSidePriority === 0);

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            <div className="mx-auto max-w-zi-container px-4 sm:px-6 py-8 sm:py-12">
                {/* ─────────────────────────────── */}
                {/* 매거진 헤더 */}
                {/* ─────────────────────────────── */}
                <div className="mb-8 sm:mb-16 flex flex-col md:flex-row items-start sm:items-end justify-between border-b border-zi-divider pb-5 sm:pb-8 gap-3 sm:gap-0">
                    <div>
                        <span className="mb-2 block text-ui-label font-ui-label font-semibold text-zi-secondary uppercase tracking-widest">
                            {isSearchMode ? `키워드 검색 결과 (${allPosts.length}건)` : '최신 에디션'}
                        </span>
                        <h1 className="font-h1 text-[26px] sm:text-[34px] lg:text-h1 text-zi-primary uppercase tracking-tighter">
                            {isSearchMode ? `"${keyword}" 검색` : '진사이트 매거진'}
                        </h1>
                        {!isSearchMode && (
                            <p className="mt-1.5 text-[16px] sm:text-[20px] font-bold text-slate-700">로컬 비즈니스 허브</p>
                        )}
                    </div>
                    {isSearchMode ? (
                        <Link href="/magazine" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4">
                            전체 에디션 보기
                        </Link>
                    ) : (
                        <div className="hidden text-right md:block">
                            <p className="max-w-sm text-body-md font-body-md text-zi-on-surface-variant leading-relaxed break-keep [text-wrap:balance]">
                                지역 기업과 기관의 이야기를 기사로 정리해 전합니다.
                            </p>
                        </div>
                    )}
                </div>

                {/* ─────────────────────────────── */}
                {/* 피처드 스토리 (Hero) */}
                {/* ─────────────────────────────── */}
                {featuredPost && (
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 mb-12 sm:mb-16 items-center">
                        <div className="lg:col-span-6 flex flex-col justify-center order-2 lg:order-1">
                            <div className="mb-4">
                                <span className="font-ui-label text-[11px] uppercase tracking-widest bg-zi-surface-container-highest px-3 py-1 rounded-full text-zi-primary font-bold">
                                    {featuredPost.category?.isLocal && featuredPost.region 
                                        ? `${featuredPost.region.name} ${featuredPost.category.name}` 
                                        : (featuredPost.category?.name || '소식')}
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
                                        featuredPost.authorName || '진사이트 편집부'
                                    )}
                                </span>
                                <span>•</span>
                                <time dateTime={new Date(featuredPost.publishedAt || featuredPost.createdAt).toISOString()}>
                                    {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' })}
                                </time>
                            </div>
                        </div>
                        <div className="lg:col-span-6 aspect-[16/10] w-full order-1 lg:order-2">
                            <Link href={getPostUrl(featuredPost)} className="w-full h-full bg-slate-50 border border-zi-divider/30 rounded-zi-card overflow-hidden shadow-sm relative block group">
                                {featuredPost.thumbnailUrl ? (
                                    <Image 
                                        src={featuredPost.thumbnailUrl} 
                                        alt={featuredPost.title}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 640px"
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

                {/* ─────────────────────────────── */}
                {/* 지역 지면 바로가기 (검색 모드 제외) */}
                {/* ─────────────────────────────── */}
                {!isSearchMode && regions.length > 0 && (
                    <section aria-labelledby="magazine-regions-title" className="mb-12 sm:mb-16">
                        <h2 id="magazine-regions-title" className="mb-4 flex items-center gap-2 font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline">
                            <MapPin className="h-4 w-4 text-rose-500" aria-hidden="true" /> 지역 지면
                        </h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                            {regions.map((reg) => (
                                <Link
                                    key={reg.id}
                                    href={`/magazine/local/${reg.slug}`}
                                    className="group flex items-center justify-between rounded-zi-card border border-zi-divider bg-white p-5 transition-all duration-300 hover:border-indigo-200 hover:shadow-sm"
                                >
                                    <div>
                                        <p className="text-lg font-bold text-slate-800 transition-colors group-hover:text-indigo-600">{reg.name} 지면</p>
                                        <p className="mt-1 text-xs text-slate-500">{reg.name} 관내 기업·기관 소식</p>
                                    </div>
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 transition-colors group-hover:bg-indigo-50">
                                        <ArrowRight className="h-4 w-4 text-slate-400 transition-colors group-hover:text-indigo-600" aria-hidden="true" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ─────────────────────────────── */}
                {/* 서브 섹션 (그리드 + 사이드바) */}
                {/* ─────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
                    {/* 메인 리스트 */}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 self-start">
                        {gridArticles.length > 0 ? (
                            gridArticles.map((article) => {
                                const categoryLabel = article.category?.name || '인사이트';
                                
                                return (
                                    <Link key={article.id} href={getPostUrl(article)} className="flex flex-col group cursor-pointer">
                                        <div className="mb-4 sm:mb-6 aspect-[16/10] bg-zi-surface-container-low rounded-zi-card overflow-hidden relative">
                                            {article.thumbnailUrl ? (
                                                <Image 
                                                    src={cardImageSrc(article.thumbnailUrl)} 
                                                    alt={article.title}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                                                    className="object-cover transition-all duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="h-full w-full transition-all duration-500 group-hover:scale-105 bg-zi-surface-container" />
                                            )}
                                            {(article as any).isPaid && (
                                                <div className="absolute top-2 right-2 z-10 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50/90 backdrop-blur-sm border border-amber-200 px-2 py-0.5 rounded-full">
                                                    {sponsoredBadgeLabel((article as any).category?.slug)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-start">
                                            <span className="mb-2 block text-ui-label font-ui-label font-semibold uppercase tracking-wider text-zi-secondary">
                                                {article.region?.name ? `${article.region.name} • ${categoryLabel}` : categoryLabel}
                                            </span>
                                            <h4 className="mb-2 font-h3 text-[18px] sm:text-h3 text-zi-primary group-hover:text-zi-secondary transition-colors line-clamp-2 leading-snug">
                                                {article.title}
                                            </h4>
                                            <p className="mb-4 line-clamp-3 overflow-hidden text-body-md font-body-md text-zi-on-surface-variant leading-relaxed">
                                                <HighlightedText text={article.summary || ''} />
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between border-t border-zi-divider pt-3 text-zi-outline text-ui-label">
                                            <span>{article.author?.name || article.authorName || '진사이트 편집부'}</span>
                                            <time dateTime={new Date(article.publishedAt || article.createdAt).toISOString()}>
                                                {formatMagazineDate(article.publishedAt || article.createdAt)}
                                            </time>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-16 px-8 border border-dashed border-zi-divider rounded-zi-card bg-zi-surface-container-low flex flex-col items-center justify-center text-center">
                                <h3 className="font-h3 text-h3 text-zi-primary mb-3">
                                    등록된 기사가 없습니다.
                                </h3>
                                <p className="text-body-md text-zi-on-surface-variant max-w-sm">
                                    독자 여러분을 위한 새로운 에디션과 깊이 있는 리포트를 준비 중입니다. 조금만 기다려 주세요!
                                </p>
                            </div>
                        )}
                    </div>
                    {/* 사이드바 */}
                    <div className="lg:col-span-4 flex flex-col gap-8 sm:gap-12 self-start">
                        <RadarSocialProof limit={8} />
 
                        {/* 트렌딩 사이드바 */}
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
                                            <span>{article.category?.name || article.region?.name || '소식'}</span>
                                            <span>•</span>
                                            <span>{article.author?.name || article.authorName || '진사이트 편집부'}</span>
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
                                    추가적인 주요 헤드라인을 준비 중입니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
