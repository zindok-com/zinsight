'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface MagazinePost {
    id: number;
    title: string;
    summary: string | null;
    slug: string;
    thumbnailUrl: string | null;
    industryName: string;
    authorName: string | null;
    createdAt: Date;
}

interface MagazineCarouselProps {
    posts: MagazinePost[];
}

export function MagazineCarousel({ posts }: MagazineCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            // 한번에 한 칸씩 이동하도록 조정 (카드 너비 + gap)
            const cardWidth = scrollRef.current.querySelector('div')?.clientWidth || clientWidth;
            const gap = 48; // gap-12
            const scrollTo = direction === 'left' 
                ? scrollLeft - (cardWidth + gap)
                : scrollLeft + (cardWidth + gap);
            
            scrollRef.current.scrollTo({
                left: scrollTo,
                behavior: 'smooth'
            });
        }
    };

    if (!posts || posts.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center rounded-zi-card border border-zi-divider bg-zi-surface-low text-zi-on-surface-variant">
                표시할 매거진 기사가 없습니다.
            </div>
        );
    }

    const placeholderColors = ['#e5e2e1', '#dcd9d9', '#c4c7c9'];

    return (
        <div className="group relative">
            {/* 내비게이션 버튼 */}
            <button 
                onClick={() => scroll('left')}
                className="absolute -left-4 top-[150px] z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-zi-divider bg-white shadow-md transition-all hover:bg-zi-surface-high hover:scale-105 active:scale-95 disabled:opacity-0 hidden lg:flex"
                aria-label="Previous slide"
            >
                <ChevronLeft className="h-6 w-6 text-zi-primary" />
            </button>
            <button 
                onClick={() => scroll('right')}
                className="absolute -right-4 top-[150px] z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-zi-divider bg-white shadow-md transition-all hover:bg-zi-surface-high hover:scale-105 active:scale-95 disabled:opacity-0 hidden lg:flex"
                aria-label="Next slide"
            >
                <ChevronRight className="h-6 w-6 text-zi-primary" />
            </button>

            {/* 슬라이드 컨테이너 */}
            <div 
                ref={scrollRef}
                className="flex gap-12 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-8 pt-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {posts.map((post, index) => (
                    <div 
                        key={post.id} 
                        className="w-full flex-shrink-0 snap-start md:w-[calc(33.333%-32px)]"
                    >
                        <Link href={`/magazine/${post.slug}`} className="group/card block h-full">
                            <article className="flex h-full flex-col">
                                {/* 이미지 영역 (기존 스타일: 정사각형) */}
                                <div 
                                    className="relative mb-6 aspect-square overflow-hidden"
                                    style={{ backgroundColor: placeholderColors[index % 3] }}
                                >
                                    {post.thumbnailUrl ? (
                                        <Image
                                            src={post.thumbnailUrl}
                                            alt={post.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className="object-cover transition-all duration-500 group-hover/card:scale-105"
                                        />
                                    ) : (
                                        <div className="h-full w-full transition-all duration-500 group-hover/card:scale-105" />
                                    )}
                                </div>

                                {/* 카테고리 레이블 (기존 스타일) */}
                                <span className="mb-3 text-zi-label font-semibold uppercase tracking-widest text-zi-blue">
                                    {post.industryName}
                                </span>

                                {/* 제목 (기존 스타일: font-serif, text-zi-headline-lg) */}
                                <h3 className="font-serif mb-4 text-zi-headline-lg font-semibold leading-tight transition-colors group-hover/card:text-zi-blue">
                                    {post.title}
                                </h3>

                                {/* 요약 (기존 스타일) - **텍스트** 강조 처리 */}
                                <p className="line-clamp-3 text-zi-body-md text-zi-on-surface-variant">
                                    {post.summary?.split(/(\*\*.*?\*\*)/).map((part, i) => 
                                        part.startsWith('**') && part.endsWith('**') 
                                            ? <strong key={i} className="font-bold text-zi-primary">{part.slice(2, -2)}</strong>
                                            : part
                                    )}
                                </p>

                                {/* 메타 정보 (기존 스타일) */}
                                <div className="mt-auto flex items-center justify-between border-t border-zi-divider pt-6 text-zi-caption text-slate-400">
                                    <span>{post.authorName || 'Zinsight 편집부'}</span>
                                    <span>{new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}</span>
                                </div>
                            </article>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
