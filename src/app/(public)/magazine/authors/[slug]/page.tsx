import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { ArrowLeft, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const author = await prisma.author.findUnique({ where: { slug } });
    if (!author) return { title: 'Not Found' };
    return {
        title: `${author.name} 발행자 프로필`,
        description: author.bio || `${author.name}의 발행 기사를 확인하세요.`,
    };
}

export default async function AuthorProfilePage({ params }: PageProps) {
    const { slug } = await params;

    const author = await prisma.author.findUnique({
        where: { slug },
        include: {
            posts: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: {
                    category: true,
                    region: { select: { slug: true, name: true } },
                },
            },
        },
    });

    if (!author) notFound();

    const initials = author.name.slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface pb-24">
            <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
                {/* 뒤로가기 */}
                <Link
                    href="/magazine"
                    className="inline-flex items-center gap-2 mb-10 text-sm font-semibold text-zi-on-surface-variant hover:text-zi-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    매거진 홈으로
                </Link>

                {/* 발행자 프로필 헤더 */}
                <section className="flex flex-col sm:flex-row items-center sm:items-start gap-7 mb-14 pb-10 border-b border-zi-divider">
                    {/* 아바타 */}
                    {author.avatarUrl ? (
                        <div className="relative w-24 h-24 shrink-0">
                            <Image
                                src={author.avatarUrl}
                                alt={author.name}
                                fill
                                className="rounded-full object-cover border-4 border-white shadow-lg"
                            />
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border-4 border-white shadow-lg">
                            <span className="text-3xl font-bold text-indigo-600">{initials}</span>
                        </div>
                    )}

                    {/* 이름 & 소개 */}
                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">발행자</p>
                        <h1 className="text-3xl sm:text-4xl font-bold text-zi-on-surface tracking-tight mb-3">
                            {author.name}
                        </h1>
                        {author.bio && (
                            <p className="text-[15px] text-slate-500 leading-relaxed max-w-xl">
                                {author.bio}
                            </p>
                        )}
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-xs font-bold text-indigo-700">
                                발행 기사 {author.posts.length}건
                            </span>
                        </div>
                    </div>
                </section>

                {/* 발행 기사 목록 */}
                <section>
                    <h2 className="text-lg font-bold text-zi-on-surface mb-6 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-500" />
                        발행 기사
                    </h2>

                    {author.posts.length === 0 ? (
                        <p className="text-slate-400 text-sm py-12 text-center">아직 발행된 기사가 없습니다.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {author.posts.map((post) => {
                                const isLocal = post.category?.isLocal;
                                const href = isLocal
                                    ? `/magazine/local/${post.region?.slug}/${post.slug}`
                                    : `/magazine/tech-marketing/${post.slug}`;

                                return (
                                    <Link
                                        key={post.id}
                                        href={href}
                                        className="group flex flex-col bg-white border border-zi-divider rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        {/* 썸네일 */}
                                        {post.thumbnailUrl ? (
                                            <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                                                <Image
                                                    src={post.thumbnailUrl}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-video w-full bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-slate-300" />
                                            </div>
                                        )}

                                        {/* 본문 */}
                                        <div className="p-4 flex-1 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {post.category && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                        {post.category.name || post.category.slug}
                                                    </span>
                                                )}
                                                {post.region && (
                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                        {post.region.name}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-[15px] text-zi-on-surface leading-snug line-clamp-2 group-hover:text-zi-primary transition-colors">
                                                {post.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-auto">
                                                {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
