import Image from 'next/image';
import Link from 'next/link';
import { ViewTracker } from '@/components/public/analytics/ViewTracker';

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
                                            className="text-indigo-600 hover:text-indigo-800 underline underline-offset-4 decoration-indigo-300 font-semibold transition-colors"
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
        <div className="min-h-screen bg-zi-surface text-zi-on-surface pb-24">
            {/* 데이터 분석용 뷰 카운터 */}
            <ViewTracker postId={post.id} />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
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
                        <span>발행: {post.author?.name || post.authorName || 'Zinsight 편집부'}</span>
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
                            <span key={`org-${po.organization.id}`} className="px-3 py-1.5 bg-zi-surface-container-low text-zi-on-surface-variant rounded-full text-[13px] font-medium border border-zi-divider/50">
                                # {po.organization.company_name}
                            </span>
                        ))}
                    </div>
                )}

                {/* isPaid 기사 하단 편집 독립성 고지 */}
                {post.isPaid && (
                    <p className="mt-8 text-[11px] text-zi-outline leading-relaxed border-t border-zi-divider pt-5 italic">
                        {post.category?.slug === 'edu-collab'
                            ? '본 콘텐츠는 진사이트와 협력 관계에 있는 기관의 의뢰로 제작된 콘텐츠입니다. 콘텐츠의 편집 방향과 서술 방식은 진사이트 편집부가 독립적으로 결정합니다.'
                            : '본 콘텐츠는 진사이트와 제휴 계약을 체결한 파트너사의 의뢰로 제작된 스폰서드 콘텐츠입니다. 콘텐츠의 편집 방향과 서술 방식은 진사이트 편집부가 독립적으로 결정합니다.'
                        }
                    </p>
                )}
            </main>
        </div>
    );
}
