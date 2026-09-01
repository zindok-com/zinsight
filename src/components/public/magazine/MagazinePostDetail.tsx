import Image from 'next/image';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
import { ViewTracker } from '@/components/public/analytics/ViewTracker';
import { PreferredSourceButton } from '@/components/public/magazine/PreferredSourceButton';
import { ArticleTracker } from '@/components/public/analytics/ArticleTracker';

interface HighlightedTextProps {
    text: string;
}

function HighlightedText({ text }: HighlightedTextProps) {
    if (!text) return null;
    
    const lines = text.split('\n');
    
    return (
        <>
            {lines.map((line, lineIdx) => {
                const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
                if (imgMatch) {
                    const alt = imgMatch[1];
                    const url = imgMatch[2];
                    return (
                        <span key={lineIdx} className="block my-6 text-center">
                            <img 
                                src={url} 
                                alt={alt} 
                                className="mx-auto rounded-zi-card max-h-[450px] object-contain shadow-sm border border-zi-divider/30" 
                            />
                            {alt && <span className="block text-xs text-zi-outline-variant mt-2 italic">{alt}</span>}
                        </span>
                    );
                }

                const rawUrlMatch = line.trim().match(/^https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S+)?$/i);
                if (rawUrlMatch) {
                    const url = rawUrlMatch[0];
                    return (
                        <span key={lineIdx} className="block my-6 text-center">
                            <img 
                                src={url} 
                                alt="Image" 
                                className="mx-auto rounded-zi-card max-h-[450px] object-contain shadow-sm border border-zi-divider/30" 
                            />
                        </span>
                    );
                }

                const parts = line.split(/(\*\*\{.*?\}\*\*|\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
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
                            if (part.startsWith('[') && part.endsWith(')')) {
                                const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
                                if (match) {
                                    const linkText = match[1];
                                    const url = match[2];
                                    return (
                                        <a 
                                            key={i} 
                                            href={url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="font-bold text-zi-blue underline underline-offset-4 decoration-zi-blue/30 hover:text-zi-blue/80 transition-colors"
                                        >
                                            {linkText}
                                        </a>
                                    );
                                }
                            }
                            return part;
                        })}
                    </span>
                );
            })}
        </>
    );
}

function getCategoryLabel(category: any) {
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

interface MagazinePostDetailProps {
    post: any;
    breadcrumb: React.ReactNode;
    backLink: string;
    jsonLd: any;
}

export default function MagazinePostDetail({ post, breadcrumb, backLink, jsonLd }: MagazinePostDetailProps) {
    const categoryLabel = getCategoryLabel(post.category);
    const mainIndustry = post.targetKeywords 
        ? post.targetKeywords.split(',')[0].trim() 
        : (post.industries?.[0]?.industry?.name || '인사이트');

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

    const tags = post.targetKeywords
        ? post.targetKeywords.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '')
        : [];

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface pb-24 relative">
            {/* 데이터 분석용 뷰 카운터 */}
            <ViewTracker postId={post.id} />
            {/* GA4 커스텀 이벤트 트래커 */}
            <ArticleTracker
                postId={post.id}
                slug={post.slug}
                category={post.category?.slug ?? 'unknown'}
                region={post.region?.slug ?? null}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main className="mx-auto max-w-4xl xl:max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
                <div className={post.organizations && post.organizations.length > 0 ? "xl:grid xl:grid-cols-[1fr_280px] xl:gap-12 items-start xl:relative" : ""}>
                    {/* 메인 기사 영역 */}
                    <div className="min-w-0">
                        {/* 브레드크럼 */}
                        <div className="mb-8">
                            {breadcrumb}
                        </div>

                        {/* 기사 헤더 */}
                        <header className="mb-12">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="text-ui-label font-ui-label font-bold uppercase tracking-widest text-zi-secondary bg-zi-surface-container-high px-3 py-1 rounded-full">
                                    {categoryLabel}
                                </span>
                                <span className="text-zi-outline text-ui-label">•</span>
                                <span className="text-ui-label font-ui-label font-bold text-zi-primary uppercase tracking-widest bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                                    {mainIndustry}
                                </span>
                                {post.region && (
                                    <>
                                        <span className="text-zi-outline text-ui-label">•</span>
                                        <span className="text-ui-label font-ui-label font-semibold text-zi-on-surface-variant">
                                            {post.region.name}
                                        </span>
                                    </>
                                )}
                                {post.isPaid && (
                                    <>
                                        <span className="text-zi-outline text-ui-label">•</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <span aria-hidden="true">✦</span>
                                            {post.category?.slug === 'edu-collab' ? '협력 기관' : '파트너'}
                                        </span>
                                    </>
                                )}
                            </div>

                            <h1 className="font-h1 text-[24px] sm:text-[32px] lg:text-h1 text-zi-on-surface mb-6 leading-tight">
                                {post.title}
                            </h1>

                            <div className="flex items-center gap-4 text-ui-label font-ui-label text-zi-outline">
                                <span>발행: {post.author?.name || post.authorName || '진사이트 편집부'}</span>
                                <span>•</span>
                                <span>{new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </header>

                        {/* 썸네일 이미지 */}
                        {post.thumbnailUrl && (
                            <div className="mb-12 aspect-[16/9] w-full bg-slate-50 border border-zi-divider/30 rounded-zi-card overflow-hidden relative shadow-sm">
                                <Image 
                                    src={post.thumbnailUrl} 
                                    alt={post.title}
                                    fill
                                    priority
                                    className="object-contain"
                                />
                            </div>
                        )}

                        {/* 본문 콘텐츠 */}
                        <article className="prose prose-zi max-w-none text-zi-on-surface">
                            {parsedContent ? (
                                /* 구조화된 JSON 데이터 포맷 */
                                <div className="space-y-12">
                                    {/* 리드 섹션 */}
                                    {parsedContent.lead && (
                                        <h2 className="font-sans m-0 p-6 sm:p-8 bg-zi-surface-container-low rounded-zi-card border border-zi-divider/50 text-[17px] sm:text-[18px] leading-relaxed font-medium text-zi-on-surface-variant italic">
                                            <HighlightedText text={parsedContent.lead} />
                                        </h2>
                                    )}

                                    {/* 본문 섹션들 */}
                                    {parsedContent.bodies && parsedContent.bodies.map((section, idx) => (
                                        <div key={idx} className="space-y-4">
                                            <h3 className="font-h2 text-[20px] sm:text-h2 text-zi-primary border-b border-zi-divider pb-2.5">
                                                {section.title}
                                            </h3>
                                            <div className="text-[16px] leading-relaxed whitespace-pre-line text-zi-on-surface">
                                                <HighlightedText text={section.content} />
                                            </div>
                                        </div>
                                    ))}

                                    {/* 클로징 섹션 */}
                                    {parsedContent.closing && (
                                        <div className="pt-8 border-t border-dashed border-zi-divider text-[16px] leading-relaxed">
                                            <HighlightedText text={parsedContent.closing} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* 구형 데이터 포맷 */
                                <div className="text-[16px]">
                                    <HighlightedText text={post.content} />
                                </div>
                            )}
                        </article>

                        {/* 관련 태그 */}
                        {((tags && tags.length > 0) || post.organizations.length > 0) && (
                            <div className="mt-16 pt-8 border-t border-zi-divider flex flex-wrap gap-2">
                                {tags.map((tag: string, idx: number) => (
                                    <Link
                                        key={`tag-${idx}`}
                                        href={`/magazine?q=${encodeURIComponent(tag)}`}
                                        className="px-3 py-1.5 bg-zi-surface-container-low text-zi-on-surface-variant hover:text-indigo-600 hover:border-indigo-300 rounded-full text-[13px] font-medium border border-zi-divider/50 transition-colors"
                                    >
                                        # {tag}
                                    </Link>
                                ))}
                                {post.organizations.map((po: any) => (
                                    <Link
                                        key={`org-${po.organization.id}`}
                                        href={`/insight-radar/${po.organization.slug || po.organization.id}`}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full text-[13px] font-medium border border-indigo-200/60 transition-colors"
                                    >
                                        # {po.organization.company_name}
                                    </Link>
                                ))}
                            </div>
                        )}



                        {/* ── 발행자 섹션 ── */}
                        {(post.author || post.authorName) && (() => {
                            const authorName = post.author?.name || post.authorName || '진사이트 편집부';
                            const authorSlug = post.author?.slug;
                            const avatarUrl  = post.author?.avatarUrl;
                            const bio        = post.author?.bio;
                            const initials   = authorName.slice(0, 2).toUpperCase();

                            const card = (
                                <div className="flex items-start gap-5">
                                    {/* 아바타 */}
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={authorName}
                                            className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-white shadow-md"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border-2 border-white shadow-md">
                                            <span className="text-lg font-bold text-indigo-600">{initials}</span>
                                        </div>
                                    )}
                                    {/* 텍스트 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">발행자</span>
                                        </div>
                                        <p className="mt-0.5 font-bold text-slate-900 text-base leading-snug">{authorName}</p>
                                        {bio && (
                                            <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed line-clamp-3">{bio}</p>
                                        )}
                                        {authorSlug && (
                                            <Link
                                                href={`/magazine/authors/${authorSlug}`}
                                                className="inline-flex items-center gap-1 mt-2.5 text-[12px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                            >
                                                발행자 프로필 보기 →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );

                            return (
                                <div className="mt-12 pt-8 border-t border-zi-divider">
                                    <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/80 rounded-2xl shadow-sm">
                                        {card}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* isPaid 기사 하단 편집 독립성 고지 */}
                        {/* Google 선호하는 출처 버튼 */}
                        <div className="mt-8 pt-6 border-t border-zi-divider">
                            <PreferredSourceButton />
                        </div>

                        {post.isPaid && (
                            <p className="mt-8 text-[11px] text-zi-outline leading-relaxed border-t border-zi-divider pt-5 italic">
                                {post.category?.slug === 'edu-collab'
                                    ? '본 콘텐츠는 진사이트와 협력 관계에 있는 기관의 의뢰로 제작된 콘텐츠입니다. 콘텐츠의 편집 방향과 서술 방식은 진사이트 편집부가 독립적으로 결정합니다.'
                                    : '본 콘텐츠는 진사이트와 제휴 계약을 체결한 파트너사의 의뢰로 제작된 스폰서드 콘텐츠입니다. 콘텐츠의 편집 방향과 서술 방식은 진사이트 편집부가 독립적으로 결정합니다.'
                                }
                            </p>
                        )}
                    </div>

                    {/* 우측 고정(Sticky/Floating) 조직 프로필 바로가기 위젯 (데스크톱 xl 이상) */}
                    {post.organizations && post.organizations.length > 0 && (
                        <aside className="hidden xl:block sticky top-[35vh] space-y-4 self-start">
                            <div className="p-5 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl">
                                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <Building2 className="w-4 h-4 text-indigo-500" />
                                    <span>연관 조직 프로필</span>
                                </div>
                                <div className="space-y-5">
                                    {post.organizations.map((po: any) => (
                                        <div key={po.organization.id} className="group flex flex-col gap-3">
                                            {/* 조직명 + 유형 배지 */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                                    {po.organization.company_name}
                                                </span>
                                                {po.organization.entity_type && (
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded shrink-0">
                                                        {po.organization.entity_type}
                                                    </span>
                                                )}
                                            </div>
                                            {/* 비즈니스 요약 */}
                                            {po.organization.business_summary && (
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                    {po.organization.business_summary}
                                                </p>
                                            )}
                                            {/* 설명 문구 */}
                                            <p className="text-[11px] text-slate-400 leading-snug">
                                                최신 기사, 투자 유치, GEO 마케팅 인덱스를 인사이트 레이더에서 확인해보세요.
                                            </p>
                                            {/* CTA 버튼 */}
                                            <Link
                                                href={`/insight-radar/${po.organization.slug || po.organization.id}`}
                                                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-200 active:scale-[0.98]"
                                            >
                                                <span>인사이트 레이더에서 프로필 보기</span>
                                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </main>

            {/* 모바일/태블릿 플로팅 퀵 버튼 (<xl) */}
            {post.organizations && post.organizations.length > 0 && (
                <div className="xl:hidden fixed bottom-6 right-6 z-40">
                    <Link
                        href={`/insight-radar/${post.organizations[0].organization.slug || post.organizations[0].organization.id}`}
                        className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold text-xs rounded-full shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all border border-indigo-500"
                    >
                        <Building2 className="w-4 h-4" />
                        <span>{post.organizations[0].organization.company_name} 프로필 →</span>
                    </Link>
                </div>
            )}
        </div>
    );
}
