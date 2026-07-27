import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, Building2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { getLocalPosts, getRegions } from '@/actions/public/magazine-actions';
import { ImpressionTracker } from '@/components/public/analytics/ImpressionTracker';

export const revalidate = 1800; // 30분마다 ISR 재생성

const domain = process.env.DOMAIN || 'zinsight.co.kr';
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    title: {
        absolute: '로컬 비즈니스 허브 | Zinsight Magazine',
    },
    description: '전국 주요 지자체 및 지역 진흥원의 정책 자금, 관내 테크 스타트업 릴레이 인터뷰 및 골목상권 소상공인과의 디지털 상생 스토리를 다룹니다.',
    alternates: {
        canonical: `${baseUrl}/magazine/local`,
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



export default async function LocalHubPage() {
    const [regions, localPosts] = await Promise.all([
        getRegions(),
        getLocalPosts()
    ]);

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            <main className="mx-auto max-w-zi-container px-4 sm:px-6 py-8 sm:py-12">
                {/* 브레드크럼 */}
                <div className="mb-4 text-xs text-zi-outline font-ui-label flex items-center gap-1.5">
                    <Link href="/magazine" className="hover:text-zi-secondary transition-colors">Magazine</Link>
                    <span>&gt;</span>
                    <span className="text-zi-on-surface-variant">Local Hub</span>
                </div>

                <div className="mb-12 flex flex-col md:flex-row items-start sm:items-end justify-between border-b border-zi-divider pb-5 gap-3">
                    <div>
                        <span className="mb-2 block text-ui-label font-ui-label font-semibold text-zi-secondary uppercase tracking-widest flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" /> B2G & SME SYNERGY
                        </span>
                        <h1 className="font-h1 text-[26px] sm:text-[34px] lg:text-h1 text-zi-primary uppercase tracking-tighter">
                            로컬 비즈니스 허브
                        </h1>
                    </div>
                    <div className="max-w-md text-right hidden md:block">
                        <p className="text-xs text-zi-on-surface-variant leading-relaxed break-keep [text-wrap:balance]">
                            지자체와 소상공인의 디지털 상생 및 스타트업 육성 스토리 등<br />
                            공익적 목적에 부합하는 특화 지면입니다.
                        </p>
                    </div>
                </div>

                {/* 1단계: 지자체/지역 선택 그리드 */}
                <section className="mb-16">
                    <h3 className="font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline mb-6 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-500" /> Select Target Region
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regions.map((reg) => (
                            <Link 
                                href={`/magazine/local/${reg.slug}`} 
                                key={reg.id} 
                                className="group p-6 rounded-zi-card border border-zi-divider bg-white hover:border-indigo-200 hover:shadow-sm transition-all duration-300 flex items-center justify-between"
                            >
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{reg.name} 지면</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{reg.name} 관내 소식 및 스타트업 인터뷰</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* 2단계: 최신 로컬 리스트 */}
                <section className="border-t border-zi-divider pt-12">
                    <h3 className="font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline mb-8">
                        Latest Local Business Stories
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                        {localPosts.length > 0 ? (
                            localPosts.map((article) => {
                                return (
                                    <ImpressionTracker postId={article.id} key={article.id}>
                                        <Link href={`/magazine/local/${article.region?.slug || 'unknown'}/${article.slug}`} className="flex flex-col group cursor-pointer">
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
                                            </div>
                                            <div className="flex-1 flex flex-col justify-start">
                                                <div className="flex items-center gap-1.5 mb-2 text-ui-label font-ui-label font-semibold uppercase tracking-wider text-zi-secondary">
                                                    <span>{article.region?.name || '공통'}</span>
                                                    <span>•</span>
                                                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                                                        {article.category?.name || '로컬 소식'}
                                                    </span>
                                                </div>
                                                <h4 className="mb-2 font-h3 text-[18px] sm:text-h3 text-zi-primary group-hover:text-zi-secondary transition-colors line-clamp-2 leading-snug">
                                                    {article.title}
                                                </h4>
                                                <p className="mb-4 line-clamp-3 overflow-hidden text-body-md font-body-md text-zi-on-surface-variant leading-relaxed">
                                                    <HighlightedText text={article.summary || ''} />
                                                </p>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between border-t border-zi-divider pt-3 text-zi-outline text-ui-label">
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
                                    등록된 기사가 없습니다. 지역 소식 및 인터뷰를 준비 중입니다.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
