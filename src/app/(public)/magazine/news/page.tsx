import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getZinsightNewsPosts } from '@/actions/public/magazine-actions';
import { cardImageSrc } from '@/lib/image-variants';
import { buildSocialMetadata, getMagazinePostPath, SITE_BASE_URL } from '@/lib/site';
import { formatMagazineDate } from '@/lib/magazine-date';

/**
 * 진사이트 소식 (공지성 분류 zinsight-news). 상단 메뉴 대신 푸터 링크로만 들어옴.
 * 기사 주소는 /magazine/tech-marketing/{slug} 그대로 (getMagazinePostPath)
 */
export const revalidate = 1800;

const TITLE = '진사이트 소식';
const DESCRIPTION = '진사이트 서비스 소개와 운영 소식을 전합니다.';

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: `${SITE_BASE_URL}/magazine/news` },
    ...buildSocialMetadata({ title: TITLE, description: DESCRIPTION, path: '/magazine/news' }),
};

export default async function ZinsightNewsPage() {
    const posts = await getZinsightNewsPosts();

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            <div className="mx-auto max-w-zi-container px-4 sm:px-6 py-8 sm:py-12">
                <nav aria-label="경로" className="mb-4 flex items-center gap-1.5 text-xs text-zi-outline font-ui-label">
                    <Link href="/magazine" className="hover:text-zi-secondary transition-colors">매거진</Link>
                    <span aria-hidden="true">&gt;</span>
                    <span className="text-zi-on-surface-variant">{TITLE}</span>
                </nav>
                <div className="mb-8 sm:mb-12 border-b border-zi-divider pb-5 sm:pb-8">
                    <h1 className="font-h1 text-[26px] sm:text-[34px] lg:text-h1 text-zi-primary tracking-tighter">{TITLE}</h1>
                    <p className="mt-2 text-body-md text-zi-on-surface-variant break-keep">{DESCRIPTION}</p>
                </div>

                {posts.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 sm:gap-10">
                        {posts.map((post) => {
                            const date = post.publishedAt || post.createdAt;
                            return (
                                <li key={post.id}>
                                    <Link href={getMagazinePostPath(post)} className="group flex h-full flex-col">
                                        <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-zi-card bg-zi-surface-container-low">
                                            {post.thumbnailUrl ? (
                                                <Image
                                                    src={cardImageSrc(post.thumbnailUrl)}
                                                    alt={post.title}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                                                    className="object-cover transition-all duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-zi-surface-container" />
                                            )}
                                        </div>
                                        <h2 className="mb-2 line-clamp-2 font-h3 text-[18px] sm:text-h3 leading-snug text-zi-primary transition-colors group-hover:text-zi-secondary">
                                            {post.title}
                                        </h2>
                                        {post.summary && (
                                            <p className="mb-4 line-clamp-3 text-body-md text-zi-on-surface-variant leading-relaxed">{post.summary.replace(/\*\*\{?|\}?\*\*/g, '')}</p>
                                        )}
                                        <div className="mt-auto flex items-center justify-between border-t border-zi-divider pt-3 text-ui-label text-zi-outline">
                                            <time dateTime={new Date(date).toISOString()}>{formatMagazineDate(date)}</time>
                                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="rounded-zi-card border border-dashed border-zi-divider bg-zi-surface-container-low px-6 py-16 text-center text-body-md text-zi-on-surface-variant">
                        아직 등록된 소식이 없습니다.
                    </p>
                )}
            </div>
        </div>
    );
}
