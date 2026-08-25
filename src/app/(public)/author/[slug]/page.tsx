import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { getPublicAuthorBySlug } from '@/actions/admin/author-actions';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const author = await getPublicAuthorBySlug(slug);

    if (!author) {
        return {
            title: 'Author Not Found',
            robots: { index: false, follow: false }
        };
    }

    const title = `${author.name} 에디터 프로필`;
    const description = author.bio || `${author.name} 에디터가 작성한 진사이트 매거진 기사 목록입니다.`;
    const ogImage = author.avatarUrl || '/img/zinsight_icon.png';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'profile',
            images: [{ url: ogImage, width: 600, height: 600, alt: author.name }]
        }
    };
}

export default async function AuthorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const author = await getPublicAuthorBySlug(slug);

    if (!author) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface pb-24">
            <main className="mx-auto max-w-[1024px] px-6 pt-12">
                {/* Back Link */}
                <Link 
                    href="/magazine" 
                    className="inline-flex items-center gap-2 text-ui-label font-ui-label font-semibold text-zi-outline-variant hover:text-zi-primary transition-colors mb-10"
                >
                    <ArrowLeft className="w-4 h-4" />
                    BACK TO MAGAZINE
                </Link>

                {/* Author Card */}
                <div className="bg-zi-surface-container-low border border-zi-divider/50 rounded-zi-card p-8 md:p-10 shadow-sm relative overflow-hidden mb-16">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {author.avatarUrl ? (
                            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                <Image
                                    src={author.avatarUrl}
                                    alt={author.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        ) : (
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-150 flex items-center justify-center font-bold text-indigo-600 text-3xl shadow-md flex-shrink-0">
                                {author.name.slice(0, 2)}
                            </div>
                        )}
                        <div className="text-center md:text-left space-y-4 min-w-0">
                            <div>
                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-600 tracking-wider border border-indigo-100 uppercase mb-2">
                                    진사이트 매거진 에디터
                                </span>
                                <h1 className="text-3xl md:text-4xl font-serif font-bold text-zi-primary tracking-tight">
                                    {author.name}
                                </h1>
                            </div>
                            <p className="text-zi-on-surface-variant font-body-md text-base leading-relaxed max-w-2xl">
                                {author.bio || '안녕하세요. 진사이트 매거진 에디터입니다. 깊이 있는 비즈니스 분석과 마켓 인사이트를 전해드립니다.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Articles Header */}
                <div className="mb-10 border-b border-zi-divider pb-4 flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-bold text-zi-primary flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-500" />
                        {author.name} 에디터의 기사 ({author.posts.length})
                    </h2>
                </div>

                {/* Articles Grid */}
                {author.posts.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-zi-divider rounded-zi-card bg-zi-surface-container-low/40">
                        <p className="text-zi-on-surface-variant">아직 발행한 기사가 없습니다. 새로운 글을 준비 중입니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {author.posts.map((post) => {
                            const categoryLabel = post.category?.name || '인사이트';
                            return (
                                <Link 
                                    href={`/magazine/${post.slug}`} 
                                    key={post.id} 
                                    className="flex flex-col group cursor-pointer"
                                >
                                    <div className="mb-5 aspect-[16/10] bg-zi-surface-container-low rounded-zi-card overflow-hidden relative shadow-sm">
                                        {post.thumbnailUrl ? (
                                            <Image 
                                                src={post.thumbnailUrl} 
                                                alt={post.title}
                                                fill
                                                className="object-cover transition-all duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 italic transition-all duration-500 group-hover:scale-105">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <span className="mb-3.5 block text-ui-label font-ui-label font-bold uppercase tracking-wider text-indigo-500">
                                        {categoryLabel}
                                    </span>
                                    <h3 className="mb-3 font-h3 text-h3 text-zi-primary group-hover:text-indigo-600 transition-colors leading-snug">
                                        {post.title}
                                    </h3>
                                    <p className="mb-6 line-clamp-3 overflow-hidden text-body-md font-body-md text-zi-on-surface-variant leading-relaxed">
                                        {post.summary || '기사 요약이 존재하지 않습니다.'}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between border-t border-zi-divider/60 pt-4 text-zi-outline text-ui-label">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center text-indigo-500 font-semibold group-hover:translate-x-1 transition-transform">
                                            읽기 <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
