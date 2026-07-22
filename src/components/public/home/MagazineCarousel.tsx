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
    author?: {
        name: string;
        slug: string;
    } | null;
    createdAt: Date;
}

interface MagazineCarouselProps {
    posts: MagazinePost[];
}

export function MagazineCarousel({ posts }: MagazineCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const isScrolling = useRef(false);

    const hasMultiple = posts && posts.length > 1;

    // 만약 기사가 2개 이상일 때만 전후로 복제하여 seamless 무한 순환 구조 제공
    const clonedPosts = hasMultiple ? [...posts, ...posts, ...posts] : posts;

    // 초기 마운트 시 2번째 클론 세트(중간) 시작 부분으로 스크롤 위치 이동
    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !hasMultiple) return;

        const cardWidth = el.querySelector('div')?.clientWidth || el.clientWidth;
        const gap = 48; // gap-12 sm:gap-8 lg:gap-12
        const step = cardWidth + gap;

        // 중간 섹션의 첫 기사 위치로 스크롤 설정
        el.scrollLeft = posts.length * step;
    }, [posts, hasMultiple]);

    const scroll = (direction: 'left' | 'right') => {
        if (isScrolling.current || !scrollRef.current || !hasMultiple) return;

        const el = scrollRef.current;
        const { scrollLeft, clientWidth } = el;
        const cardWidth = el.querySelector('div')?.clientWidth || el.clientWidth;
        const gap = 48;
        const step = cardWidth + gap;
        const middleStart = posts.length * step;

        isScrolling.current = true;

        const targetScrollLeft = direction === 'left' 
            ? scrollLeft - step
            : scrollLeft + step;

        el.scrollTo({
            left: targetScrollLeft,
            behavior: 'smooth'
        });

        // 400ms 후 부드러운 스크롤이 끝나면 즉시 보이지 않게 위치를 보정 (Seamless Wrap)
        setTimeout(() => {
            if (!el) {
                isScrolling.current = false;
                return;
            }

            const currentScrollLeft = el.scrollLeft;

            // 오른쪽 영역(3번째 섹션의 끝)으로 들어설 때 중간 섹션으로 무한 순간 이동
            if (currentScrollLeft >= middleStart + posts.length * step) {
                el.scrollTo({
                    left: currentScrollLeft - posts.length * step,
                    behavior: 'auto'
                });
            }
            // 왼쪽 영역(1번째 섹션)으로 들어설 때 중간 섹션으로 무한 순간 이동
            else if (currentScrollLeft < middleStart) {
                el.scrollTo({
                    left: currentScrollLeft + posts.length * step,
                    behavior: 'auto'
                });
            }

            isScrolling.current = false;
        }, 400);
    };

    // 스크롤 및 터치 스와이프 발생 시 dot 활성 인덱스 계산 및 드래그 끝 시점 미세 보정
    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !hasMultiple) return;

        let scrollTimeout: NodeJS.Timeout;

        const handleScroll = () => {
            const cardWidth = el.querySelector('div')?.clientWidth || el.clientWidth;
            const gap = 48;
            const step = cardWidth + gap;
            const middleStart = posts.length * step;

            const offset = el.scrollLeft - middleStart;
            const index = Math.round(offset / step);
            const normalizedIndex = ((index % posts.length) + posts.length) % posts.length;
            setActiveIndex(normalizedIndex);

            // 사용자가 수동 드래그/스와이프 시 스크롤이 멈추면 위치 보정
            if (!isScrolling.current) {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const currentScrollLeft = el.scrollLeft;
                    if (currentScrollLeft >= middleStart + posts.length * step) {
                        el.scrollTo({
                            left: currentScrollLeft - posts.length * step,
                            behavior: 'auto'
                        });
                    } else if (currentScrollLeft < middleStart) {
                        el.scrollTo({
                            left: currentScrollLeft + posts.length * step,
                            behavior: 'auto'
                        });
                    }
                }, 150);
            }
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [posts.length, hasMultiple]);

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
            {/* 데스크탑 내비게이션 버튼 (기사가 2개 이상일 때만 표시) */}
            {hasMultiple && (
                <>
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
                </>
            )}

            {/* 슬라이드 컨테이너 */}
            <div 
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 pt-4 px-4 sm:px-0 sm:gap-8 lg:gap-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', scrollPaddingLeft: '1rem' }}
            >
                {clonedPosts.map((post, index) => (
                    <div 
                        key={`${post.id}-${index}`} 
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
                                        <>
                                            {/* Blurred ambient background */}
                                            <Image
                                                src={post.thumbnailUrl}
                                                alt=""
                                                fill
                                                sizes="10px"
                                                className="object-cover blur-md scale-110 opacity-30 select-none pointer-events-none"
                                            />
                                            {/* Sharp foreground image using object-contain */}
                                            <Image
                                                src={post.thumbnailUrl}
                                                alt={post.title}
                                                fill
                                                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-contain p-2 transition-all duration-500 group-hover/card:scale-105"
                                            />
                                        </>
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
                                    <span>{post.author?.name || post.authorName || 'Zinsight 편집부'}</span>
                                    <span>{new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}</span>
                                </div>
                            </article>
                        </Link>
                    </div>
                ))}
            </div>

            {/* 모바일 전용 dot indicator (기사가 2개 이상일 때만 표시) */}
            {hasMultiple && (
                <div className="flex justify-center gap-1.5 mt-2 lg:hidden">
                    {posts.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (scrollRef.current) {
                                    const cardWidth = scrollRef.current.querySelector('div')?.clientWidth || scrollRef.current.clientWidth;
                                    const step = cardWidth + 48;
                                    const middleStart = posts.length * step;
                                    scrollRef.current.scrollTo({ left: middleStart + i * step, behavior: 'smooth' });
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
