import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { AiCitationCase } from '@/config/site';

/**
 * 메인 'AI 답변에 인용된 사례' 블록.
 * 데이터는 src/config/site.ts aiCitations 배열. 비어 있으면 블록 자체를 렌더링하지 않습니다.
 */
export function AiCitationCases({ cases }: { cases: AiCitationCase[] }) {
    if (cases.length === 0) return null;

    return (
        <section aria-labelledby="ai-citations-title" className="border-y border-zi-divider bg-white py-10 sm:py-16">
            <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                <div className="mb-8 sm:mb-12 text-center">
                    <h2 id="ai-citations-title" className="mb-3 text-[20px] sm:text-zi-headline-md font-bold text-zi-primary">
                        AI 답변에 인용된 사례
                    </h2>
                    <p className="mx-auto max-w-2xl text-zi-body-md text-slate-500 break-keep">
                        진사이트 기사와 프로필이 AI 답변의 근거로 쓰인 사례입니다.
                    </p>
                </div>

                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                    {cases.map((item) => (
                        <li key={`${item.title}-${item.checkedAt}`}>
                            <article className="flex h-full flex-col overflow-hidden rounded-zi-card border border-zi-divider bg-zi-surface">
                                <div className="relative aspect-[4/3] bg-slate-100">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.imageAlt ?? `${item.source} 답변 화면: ${item.title}`}
                                        fill
                                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                                        className="object-contain"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col p-4 sm:p-5">
                                    <p className="mb-2 flex flex-wrap items-center gap-x-2 text-[12px] font-semibold text-zi-blue">
                                        <span>{item.source}</span>
                                        <span aria-hidden="true" className="text-slate-300">·</span>
                                        <time dateTime={item.checkedAt} className="text-slate-500">
                                            {item.checkedAt.replace(/-/g, '.')} 확인
                                        </time>
                                    </p>
                                    <h3 className="text-[16px] sm:text-[17px] font-bold leading-snug text-slate-900 break-keep">
                                        {item.title}
                                    </h3>
                                    {item.articleHref && (
                                        <Link
                                            href={item.articleHref}
                                            className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-semibold text-zi-primary hover:underline"
                                        >
                                            {item.articleTitle ?? '관련 기사 보기'}
                                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                        </Link>
                                    )}
                                </div>
                            </article>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
