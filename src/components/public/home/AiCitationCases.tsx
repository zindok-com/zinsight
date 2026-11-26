import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, MessageSquareText, Newspaper } from 'lucide-react';
import type { AiCitationCase } from '@/config/site';

/**
 * 메인 'AI가 진사이트를 인용한 사례' 블록 (데이터: src/config/site.ts aiCitations).
 * 공개 동의(consented)가 true이고 필수 값이 있는 사례만 노출. 0건이면 '이렇게 작동합니다' 3단계로 대체
 */
export function AiCitationCases({ cases }: { cases: AiCitationCase[] }) {
    const visible = cases.filter((c) => c.consented && c.aiService && c.question && c.checkedAt && c.imageUrl);
    if (visible.length === 0) return <HowItWorks />;

    return (
        <section aria-labelledby="ai-citations-title" className="border-y border-zi-divider bg-white py-10 sm:py-16">
            <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                <div className="mb-8 sm:mb-12 text-center">
                    <h2 id="ai-citations-title" className="mb-3 text-[20px] sm:text-zi-headline-md font-bold text-zi-primary">
                        AI가 진사이트를 인용한 사례
                    </h2>
                    <p className="mx-auto max-w-2xl text-zi-body-md text-slate-500 break-keep">
                        AI 서비스에 실제로 물어본 질문과, 답변에 근거로 쓰인 진사이트 기사·프로필입니다.
                    </p>
                </div>

                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                    {visible.map((item) => (
                        <li key={item.id}>
                            <article className="flex h-full flex-col overflow-hidden rounded-zi-card border border-zi-divider bg-zi-surface">
                                <div className="relative aspect-[4/3] bg-slate-100">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.imageAlt ?? `${item.aiService} 답변 화면: ${item.question}`}
                                        fill
                                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                                        className="object-contain"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col p-4 sm:p-5">
                                    <p className="mb-2 flex flex-wrap items-center gap-x-2 text-[12px] font-semibold text-zi-blue">
                                        <span>{item.aiService}</span>
                                        <span aria-hidden="true" className="text-slate-300">·</span>
                                        <time dateTime={item.checkedAt} className="text-slate-500">
                                            {item.checkedAt.replace(/-/g, '.')} 확인
                                        </time>
                                    </p>
                                    <p className="text-[15px] sm:text-[16px] font-bold leading-snug text-slate-900 break-keep">
                                        <span className="sr-only">물어본 질문: </span>“{item.question}”
                                    </p>
                                    {item.links.length > 0 && (
                                        <ul className="mt-auto space-y-1.5 pt-4">
                                            {item.links.map((link) => (
                                                <li key={link.href}>
                                                    <Link href={link.href} className="inline-flex items-center gap-1 text-[13px] font-semibold text-zi-primary hover:underline">
                                                        {link.label}
                                                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </article>
                        </li>
                    ))}
                </ul>
                <p className="mt-6 text-center text-[12px] text-slate-400 break-keep">AI 답변은 질문 시점과 서비스에 따라 달라질 수 있습니다.</p>
            </div>
        </section>
    );
}

const STEPS = [
    { icon: MessageSquareText, title: '검색·AI 질문', body: '고객이 검색창이나 AI 서비스에 업체·제품을 물어봅니다.' },
    { icon: Newspaper, title: '진사이트 기사·기업 프로필', body: '정리된 기사와 기업 프로필이 답변의 근거 자료가 됩니다.' },
    { icon: Building2, title: '우리 회사 홈페이지·문의', body: '프로필과 카드에서 홈페이지 방문과 문의로 이어집니다.' },
];

/** 공개 가능한 인용 사례가 없을 때 대신 보여 주는 3단계 설명 */
function HowItWorks() {
    return (
        <section aria-labelledby="how-it-works-title" className="border-y border-zi-divider bg-white py-10 sm:py-16">
            <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                <div className="mb-8 sm:mb-12 text-center">
                    <h2 id="how-it-works-title" className="mb-3 text-[20px] sm:text-zi-headline-md font-bold text-zi-primary">
                        이렇게 작동합니다
                    </h2>
                    <p className="mx-auto max-w-2xl text-zi-body-md text-slate-500 break-keep">
                        기업 이야기를 검색과 AI가 읽기 쉬운 기사·프로필로 정리해, 찾아온 고객이 우리 회사까지 오게 합니다.
                    </p>
                </div>

                <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
                    {STEPS.map(({ icon: Icon, title, body }, i) => (
                        <li key={title} className="relative">
                            <div className="flex h-full items-start gap-4 rounded-zi-card border border-zi-divider bg-zi-surface p-5 md:flex-col md:gap-3 md:p-6">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zi-primary/5 text-zi-primary">
                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="mb-1 text-[12px] font-bold tracking-wider text-zi-blue">STEP {i + 1}</p>
                                    <h3 className="mb-1.5 text-[16px] font-bold text-slate-900 break-keep">{title}</h3>
                                    <p className="text-[14px] leading-relaxed text-slate-600 break-keep">{body}</p>
                                </div>
                            </div>
                            {i < STEPS.length - 1 && (
                                <ArrowRight
                                    aria-hidden="true"
                                    className="absolute left-1/2 -bottom-3 z-10 h-5 w-5 -translate-x-1/2 rotate-90 rounded-full bg-white text-slate-300 md:left-auto md:-right-[18px] md:top-1/2 md:bottom-auto md:translate-x-0 md:-translate-y-1/2 md:rotate-0"
                                />
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
