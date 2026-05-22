import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getPublicMagazinePosts } from '@/actions/magazine-actions';
import { getRadarIndustries } from '@/actions/insight-radar-actions';
import MagazineAeoCTA from '@/components/public/MagazineAeoCTA';

export const dynamic = 'force-dynamic';

const domain = process.env.DOMAIN || 'zinsight.com';
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    title: 'Zinsight Magazine',
    description: '데이터의 깊이와 저널리즘의 통찰이 만난 곳, 마케팅의 격을 높이는 프리미엄 미디어. Zinsight Magazine.',
    alternates: {
        canonical: `${baseUrl}/magazine`,
    },
    openGraph: {
        title: 'Zinsight Magazine',
        description: '데이터의 깊이와 저널리즘의 통찰이 만난 곳, 마케팅의 격을 높이는 프리미엄 미디어. Zinsight Magazine.',
        url: `${baseUrl}/magazine`,
        type: 'website',
    },
};

function HighlightedText({ text }: { text: string }) {
    if (!text) return null;
    
    // **{text}** 또는 **text** 패턴을 찾아 강조 처리
    // 1. **{...}** 패턴 처리
    // 2. **...** 패턴 처리
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

export default async function MagazinePage() {
    const [allPosts, industries] = await Promise.all([
        getPublicMagazinePosts(),
        getRadarIndustries(),
    ]);

    // 1번: 피처드 스토리
    const featuredPost = allPosts.find(p => p.headlinePriority === 1) || allPosts[0] || null;
    
    // 2~5번: 트렌딩 사이드바 (More Headlines)
    const sideArticles = allPosts
        .filter(p => p.headlinePriority >= 2 && p.headlinePriority <= 5)
        .sort((a, b) => a.headlinePriority - b.headlinePriority);
        
    // 0번: 메인 리스트 (최신순)
    const gridArticles = allPosts.filter(p => p.headlinePriority === 0);

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            <main className="mx-auto max-w-zi-container px-6 py-12">
                {/* ─────────────────────────────── */}
                {/* 매거진 헤더 */}
                {/* ─────────────────────────────── */}
                <div className="mb-16 flex flex-col md:flex-row items-end justify-between border-b border-zi-divider pb-8">
                    <div>
                        <span className="mb-2 block text-ui-label font-ui-label font-semibold text-zi-secondary uppercase tracking-widest">
                            최신 에디션
                        </span>
                        <h1 className="font-h1 text-h1 text-zi-primary uppercase tracking-tighter">
                            Zinsight Magazine
                        </h1>
                    </div>
                    <div className="hidden text-right md:block">
                        <p className="max-w-sm text-body-md font-body-md text-zi-on-surface-variant leading-relaxed">
                            데이터의 깊이와 저널리즘의 통찰이 만난 곳,<br />
                            마케팅의 격을 높이는 프리미엄 미디어
                        </p>
                    </div>
                </div>

                {/* ─────────────────────────────── */}
                {/* 피처드 스토리 (Hero) */}
                {/* ─────────────────────────────── */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24 items-center">
                    <div className="lg:col-span-6 flex flex-col justify-center order-2 lg:order-1">
                        <div className="mb-4">
                            <span className="font-ui-label text-[10px] uppercase tracking-widest bg-zi-surface-container-highest px-3 py-1 rounded-full text-zi-primary font-bold">
                                {featuredPost?.category === 'INTELLIGENCE_REPORT' ? 'Zinsight Original' :
                                 featuredPost?.category === 'TECH_AUDIT' ? 'Tech Audit' :
                                 featuredPost?.category === 'SALES_SCENARIO' ? 'Sales Guide' : 'Newsletter'}
                            </span>
                        </div>
                        {featuredPost ? (
                            <Link href={`/magazine/${featuredPost.slug}`} className="group block cursor-pointer">
                                <h2 className="font-h1 text-h1 text-zi-on-surface mb-6 group-hover:text-zi-secondary transition-colors">
                                    {featuredPost.title}
                                </h2>
                                <p className="font-body-lg text-body-lg text-zi-on-surface-variant mb-8">
                                    <HighlightedText 
                                        text={featuredPost.summary ?? (featuredPost.content ? featuredPost.content.slice(0, 180) + '...' : '')} 
                                    />
                                </p>
                            </Link>
                        ) : (
                            <>
                                <h2 className="font-h1 text-h1 text-zi-on-surface mb-6">
                                    등록된 주요 기사가 없습니다.
                                </h2>
                                <p className="font-body-lg text-body-lg text-zi-on-surface-variant mb-8">
                                    새로운 인사이트를 준비 중입니다.
                                </p>
                            </>
                        )}
                        <div className="flex items-center gap-4 text-zi-outline font-ui-label text-ui-label border-t border-zi-divider pt-4">
                            <span className="text-zi-on-surface font-semibold">By Zinsight 편집부</span>
                            <span>•</span>
                            <span>{featuredPost ? new Date(featuredPost.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                    </div>
                    <div className="lg:col-span-6 aspect-[4/3] w-full order-1 lg:order-2">
                        {featuredPost ? (
                            <Link href={`/magazine/${featuredPost.slug}`} className="w-full h-full bg-zi-surface-container-low rounded-zi-card overflow-hidden shadow-sm relative block group">
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
                        ) : (
                            <div className="w-full h-full bg-zi-surface-container-low rounded-zi-card overflow-hidden shadow-sm relative block group">
                                <div className="absolute inset-0 bg-gradient-to-br from-zi-primary/10 to-zi-secondary/5 flex items-center justify-center text-zi-outline-variant italic">
                                    No Image Available
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ─────────────────────────────── */}
                {/* 서브 섹션 (그리드 + 사이드바) */}
                {/* ─────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* 메인 리스트 */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                        {gridArticles.length > 0 ? (
                            gridArticles.map((article) => {
                                const industryName = article.industries?.[0]?.industry?.name || '인사이트';
                                
                                return (
                                    <Link href={`/magazine/${article.slug}`} key={article.id} className="flex flex-col group cursor-pointer">
                                        <div className="mb-6 aspect-[16/10] bg-zi-surface-container-low rounded-zi-card overflow-hidden relative">
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
                                        </div>
                                        <span className="mb-3 block text-ui-label font-ui-label font-semibold uppercase tracking-wider text-zi-secondary">
                                            {industryName}
                                        </span>
                                        <h4 className="mb-4 font-h3 text-h3 text-zi-primary group-hover:text-zi-secondary transition-colors">
                                            {article.title}
                                        </h4>
                                        <p className="mb-6 line-clamp-3 text-body-md font-body-md text-zi-on-surface-variant">
                                            <HighlightedText text={article.summary || ''} />
                                        </p>
                                        <div className="mt-auto flex items-center justify-between border-t border-zi-divider pt-4 text-zi-outline text-ui-label">
                                            <span>Zinsight 편집부</span>
                                            <ArrowRight className="h-4 w-4" />
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
                    <div className="lg:col-span-4 flex flex-col gap-12">
                        <MagazineAeoCTA />
 
                        {/* 트렌딩 사이드바 */}
                        {sideArticles.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                <h3 className="font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline pb-2 border-b border-zi-divider">
                                    More Headlines
                                </h3>
                                {sideArticles.map((article) => (
                                    <Link href={`/magazine/${(article as any).slug}`} key={article.id} className="group cursor-pointer block">
                                        <h4 className="font-h3 text-[18px] leading-snug text-zi-primary mb-2 group-hover:text-zi-secondary transition-colors">
                                            {article.title}
                                        </h4>
                                        <p className="mb-3 line-clamp-2 text-[13px] text-zi-on-surface-variant leading-relaxed">
                                            <HighlightedText text={(article as any).summary || (article.content ? article.content.slice(0, 100) : '')} />
                                        </p>
                                        <div className="flex items-center gap-2 text-zi-outline text-[12px]">
                                            <span>{(article as any).industries?.[0]?.industry?.name || '인사이트'}</span>
                                            <span>•</span>
                                            <span>Zinsight 편집부</span>
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
            </main>
        </div>
    );
}
