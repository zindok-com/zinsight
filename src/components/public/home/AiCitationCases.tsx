import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowRight, Building2, Globe, Mail, Newspaper, Search, Sparkles } from 'lucide-react';
import type { AiCitationCase } from '@/config/site';
import { RevealOnView } from './RevealOnView';

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

/** 모션 지연(초). globals.css의 hiw-* 애니메이션이 --d로 읽는다 */
const d = (s: number) => ({ '--d': `${s}s` }) as CSSProperties;

/** 단계별 미니 화면 (장식, 스크린리더에는 숨김). 예시 문구는 실제 서비스 화면이 아님 */
function SearchVisual() {
    return (
        <div className="flex h-full flex-col justify-center gap-2.5">
            <div className="flex items-center gap-2 overflow-hidden rounded-full border border-zi-blue/30 bg-white px-3.5 py-2 text-[12px] text-zi-primary shadow-sm">
                <Search className="h-3.5 w-3.5 shrink-0 text-zi-blue" />
                <span className="hiw-type whitespace-nowrap" style={d(0.7)}>우리 동네 방수 업체 추천해줘</span>
            </div>
            <div className="hiw-pop flex items-start gap-2 self-start rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[12px] text-zi-primary shadow-sm" style={d(2.0)}>
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zi-blue" />
                <span>진사이트 기사에 따르면…</span>
            </div>
        </div>
    );
}

function ProfileVisual() {
    return (
        <div className="flex h-full flex-col justify-center gap-2">
            <div className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zi-blue/10 text-zi-blue">
                    <Building2 className="h-4 w-4" />
                </span>
                <div className="flex-1 space-y-1.5 pt-0.5">
                    <div className="hiw-line h-2 w-4/5 rounded-full bg-zi-primary" style={d(1.05)} />
                    <div className="hiw-line h-1.5 rounded-full bg-zi-blue/25" style={d(1.25)} />
                    <div className="hiw-line h-1.5 w-3/5 rounded-full bg-zi-blue/25" style={d(1.45)} />
                </div>
            </div>
            <div className="hiw-pop flex items-center gap-1.5 text-[12px] font-semibold text-zi-primary" style={d(1.7)}>
                <Newspaper className="h-3.5 w-3.5 text-zi-blue" />
                기업 프로필 · 매거진 기사
            </div>
        </div>
    );
}

function ContactVisual() {
    return (
        <div className="flex h-full flex-col justify-center gap-2">
            <div className="hiw-pop flex items-center justify-center gap-1.5 rounded-lg bg-zi-primary px-3 py-2 text-[12px] font-semibold text-white" style={d(1.6)}>
                <Globe className="h-3.5 w-3.5" />
                홈페이지 방문
            </div>
            <div className="hiw-pop rounded-lg" style={d(1.8)}>
                <div className="hiw-ring flex items-center justify-center gap-1.5 rounded-lg border border-zi-blue/40 bg-white px-3 py-2 text-[12px] font-semibold text-zi-primary" style={d(2.3)}>
                    <Mail className="h-3.5 w-3.5 text-zi-blue" />
                    문의하기
                </div>
            </div>
        </div>
    );
}

const STEPS = [
    { visual: SearchVisual, title: '검색·AI 질문', body: '고객이 검색창이나 AI 서비스에 업체·제품을 물어봅니다.' },
    { visual: ProfileVisual, title: '진사이트 기사·기업 프로필', body: '기사와 기업 프로필을 답변의 근거로 쓰기 좋게 정리합니다.' },
    { visual: ContactVisual, title: '우리 회사 홈페이지·문의', body: '프로필과 카드에서 홈페이지와 문의로 바로 갈 수 있게 합니다.' },
];

/** 공개 가능한 인용 사례가 없을 때 대신 보여 주는 3단계 설명 (화면에 들어올 때 한 번 모션) */
function HowItWorks() {
    return (
        <section aria-labelledby="how-it-works-title" className="border-y border-zi-divider bg-white py-10 sm:py-16">
            <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                <div className="mb-8 sm:mb-12 text-center">
                    <h2 id="how-it-works-title" className="mb-3 text-[20px] sm:text-zi-headline-md font-bold text-zi-primary">
                        이렇게 작동합니다
                    </h2>
                    <p className="mx-auto max-w-2xl text-zi-body-md text-slate-500 break-keep text-balance">
                        기업 이야기를 검색과 AI가 읽기 쉬운 기사·프로필로 정리해,
                        <br className="hidden sm:block" /> 찾아온 고객이 우리 회사를 쉽게 찾도록 돕습니다.
                    </p>
                </div>

                <RevealOnView>
                    <ol className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
                        {STEPS.map(({ visual: Visual, title, body }, i) => (
                            <li key={title} className="relative">
                                <div className="hiw-card flex h-full flex-col overflow-hidden rounded-zi-card border border-zi-divider bg-white" style={d(i * 0.25)}>
                                    <div aria-hidden="true" className="h-32 bg-zi-blue/[0.06] px-5 py-4 sm:h-36">
                                        <Visual />
                                    </div>
                                    <div className="flex-1 p-5 md:p-6">
                                        <p className="mb-1 text-[12px] font-bold tracking-wider text-zi-blue">STEP {i + 1}</p>
                                        <h3 className="mb-1.5 text-[16px] font-bold text-slate-900 break-keep">{title}</h3>
                                        <p className="text-[14px] leading-relaxed text-slate-600 break-keep">{body}</p>
                                    </div>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute left-1/2 -bottom-[18px] z-10 -translate-x-1/2 md:left-auto md:-right-[22px] md:top-14 md:bottom-auto md:translate-x-0"
                                    >
                                        <span className="hiw-arrow flex h-8 w-8 items-center justify-center rounded-full border border-zi-blue/30 bg-white text-zi-blue shadow-sm" style={d(0.45 + i * 0.25)}>
                                            <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" />
                                        </span>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                </RevealOnView>
            </div>
        </section>
    );
}
