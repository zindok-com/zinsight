'use client';

import React, { useRef, useState, useEffect } from 'react';
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
    const [activeIndex, setActiveIndex] = useState(0);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
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

    // 스크롤 위치로 현재 활성 dot 계산
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleScroll = () => {
            const cardWidth = el.querySelector('div')?.clientWidth || el.clientWidth;
            const gap = 48;
            const index = Math.round(el.scrollLeft / (cardWidth + gap));
            setActiveIndex(Math.min(index, posts.length - 1));
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [posts.length]);

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
            {/* 데스크탑 내비게이션 버튼 */}
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
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 pt-4 px-4 sm:px-0 sm:gap-8 lg:gap-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', scrollPaddingLeft: '1rem' }}
            >
                {posts.map((post, index) => (
                    <div 
                        key={post.id} 
                        className="w-[82vw] flex-shrink-0 snap-start sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-32px)] lg:flex-shrink-0"
                    >
                        <Link href={`/magazine/${post.slug}`} className="group/card block h-full">
                            <article className="flex h-full flex-col">
                                {/* 이미지 영역 */}
                                <div 
                                    className="relative mb-4 sm:mb-6 aspect-[4/3] overflow-hidden rounded-zi-card"
                                    style={{ backgroundColor: placeholderColors[index % 3] }}
                                >
                                    {post.thumbnailUrl ? (
                                        <Image
                                            src={post.thumbnailUrl}
                                            alt={post.title}
                                            fill
                                            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 33vw"
                                            className="object-cover transition-all duration-500 group-hover/card:scale-105"
                                        />
                                    ) : (
                                        <div className="h-full w-full transition-all duration-500 group-hover/card:scale-105" />
                                    )}
                                </div>

                                {/* 카테고리 레이블 */}
                                <span className="mb-2 sm:mb-3 text-zi-label font-semibold uppercase tracking-widest text-zi-blue text-[11px]">
                                    {post.industryName}
                                </span>

                                {/* 제목 */}
                                <h3 className="font-serif mb-3 sm:mb-4 text-[17px] sm:text-zi-headline-lg font-semibold leading-tight transition-colors group-hover/card:text-zi-blue">
                                    {post.title}
                                </h3>

                                {/* 요약 */}
                                <p className="line-clamp-3 text-[13px] sm:text-zi-body-md text-zi-on-surface-variant leading-relaxed">
                                    {post.summary?.split(/(\*\*.*?\*\*)/).map((part, i) => 
                                        part.startsWith('**') && part.endsWith('**') 
                                            ? <strong key={i} className="font-bold text-zi-primary">{part.slice(2, -2)}</strong>
                                            : part
                                    )}
                                </p>

                                {/* 메타 정보 */}
                                <div className="mt-auto flex items-center justify-between border-t border-zi-divider pt-4 text-zi-caption text-slate-400 mt-4">
                                    <span>{post.authorName || 'Zinsight 편집부'}</span>
                                    <span>{new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}</span>
                                </div>
                            </article>
                        </Link>
                    </div>
                ))}
                
                {/* 빈 카드 플레이스홀더 (PC 전용) */}
                {[1, 2].map((i) => (
                    <div 
                        key={`placeholder-${i}`} 
                        className="hidden lg:block w-[82vw] flex-shrink-0 snap-start sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-32px)] lg:flex-shrink-0 opacity-50 select-none"
                    >
                        <article className="flex h-full flex-col">
                            {/* 이미지 영역 */}
                            <div className="relative mb-4 sm:mb-6 aspect-[4/3] overflow-hidden rounded-zi-card bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center">
                                <span className="text-slate-400 text-sm font-medium tracking-widest">COMING SOON</span>
                            </div>

                            {/* 카테고리 레이블 */}
                            <div className="mb-2 sm:mb-3 h-4 w-20 bg-slate-100 rounded animate-pulse"></div>

                            {/* 제목 */}
                            <div className="mb-3 sm:mb-4 h-6 w-3/4 bg-slate-100 rounded animate-pulse"></div>

                            {/* 요약 */}
                            <div className="space-y-2 mb-4">
                                <div className="h-3.5 w-full bg-slate-100 rounded animate-pulse"></div>
                                <div className="h-3.5 w-5/6 bg-slate-100 rounded animate-pulse"></div>
                                <div className="h-3.5 w-4/6 bg-slate-100 rounded animate-pulse"></div>
                            </div>
                            
                            {/* 메타 정보 */}
                            <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                                <div className="h-3 w-16 bg-slate-100 rounded animate-pulse"></div>
                                <div className="h-3 w-16 bg-slate-100 rounded animate-pulse"></div>
                            </div>
                        </article>
                    </div>
                ))}
            </div>

            {/* 모바일 전용 dot indicator */}
            {posts.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-2 lg:hidden">
                    {posts.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (scrollRef.current) {
                                    const cardWidth = scrollRef.current.querySelector('div')?.clientWidth || scrollRef.current.clientWidth;
                                    scrollRef.current.scrollTo({ left: i * (cardWidth + 48), behavior: 'smooth' });
                                }
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === activeIndex
                                    ? 'w-6 bg-zi-primary'
                                    : 'w-1.5 bg-zi-outline-variant'
                            }`}
                            aria-label={`슬라이드 ${i + 1}로 이동`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
