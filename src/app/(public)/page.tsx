import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import {
    getRadarLatestArticles,
    getRadarTrendingKeywords,
    getRadarTotalStats,
    getRadarCompanies,
} from '@/actions/insight-radar-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Zinsight — 인텔리전스의 정점',
    description: '산업별 기업 동향과 최신 뉴스를 한눈에. 데이터로 읽는 시장의 미래.',
};

export default async function PublicHomePage() {
    // 홈 페이지에 필요한 데이터를 병렬로 조회
    const [totalStats, { companies: featuredCompanies }, latestArticles, trendingKeywords] =
        await Promise.all([
            getRadarTotalStats(),
            getRadarCompanies({}, 1, 3),
            getRadarLatestArticles({}, 3),
            getRadarTrendingKeywords(undefined, 8),
        ]);

    // 최신 기사 중 매거진 프리뷰용 상위 3건
    const magazineArticles = latestArticles.slice(0, 3);

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            {/* ─────────────────────────────── */}
            {/* Hero 섹션 */}
            {/* ─────────────────────────────── */}
            <section className="relative overflow-hidden pb-32 pt-20">
                <div className="relative z-10 mx-auto max-w-zi-container px-6 text-center">
                    {/* 수퍼 레이블 */}
                    <span className="mb-6 block text-zi-label font-semibold tracking-[0.2em] text-zi-blue uppercase">
                        Market Intelligence Terminal
                    </span>

                    {/* 헤드라인 */}
                    <h1 className="font-serif mb-12 text-zi-display font-semibold leading-tight text-zi-navy">
                        인텔리전스의 정점,
                        <br />
                        데이터로 읽는 시장의 미래
                    </h1>

                    {/* 통합 검색바 */}
                    <div className="mx-auto mb-12 max-w-3xl">
                        <Link href="/insight-radar" className="group relative block">
                            <div className="flex h-16 w-full items-center border-b-2 border-zi-navy bg-white pl-14 pr-6 transition-all">
                                <svg
                                    className="absolute left-4 h-6 w-6 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="square" strokeLinejoin="miter" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-zi-body-lg text-slate-400">
                                    산업, 기업 또는 최신 트렌드를 검색하세요
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* CTA 버튼 */}
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Link
                            href="/insight-radar"
                            className="inline-flex items-center justify-center border border-zi-navy bg-zi-navy px-8 py-4 text-zi-label font-semibold tracking-[0.05em] text-white transition-all active:scale-95"
                        >
                            Insight Radar 탐색
                        </Link>
                        <Link
                            href="/magazine"
                            className="inline-flex items-center justify-center border border-zi-navy bg-transparent px-8 py-4 text-zi-label font-semibold tracking-[0.05em] text-zi-navy transition-all active:scale-95 hover:bg-zi-surface-high"
                        >
                            Zinsight 매거진 읽기
                        </Link>
                    </div>
                </div>

                {/* 장식 요소 */}
                <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 -skew-x-12 translate-x-1/2 bg-slate-100/30" />
            </section>

            {/* ─────────────────────────────── */}
            {/* 실시간 인사이트 레이더 섹션 */}
            {/* ─────────────────────────────── */}
            <section className="mx-auto max-w-zi-container border-t border-zi-divider px-6 py-24">
                {/* 섹션 헤더 */}
                <div className="mb-12 flex items-end justify-between">
                    <div>
                        <h2 className="mb-2 text-zi-headline-md font-bold text-zi-navy">
                            실시간 인사이트 레이더
                        </h2>
                        <p className="text-zi-body-md text-zi-on-surface-variant">
                            현재 시장에서 가장 주목받는 섹터와 기술 지표입니다.
                        </p>
                    </div>
                    <Link
                        href="/insight-radar"
                        className="group flex items-center gap-2 text-zi-label font-semibold text-zi-blue"
                    >
                        전체 지표 보기
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                {/* 벤토 그리드 */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                    {/* 메인 피처 카드 */}
                    <div className="flex flex-col justify-between border border-zi-divider bg-white p-8 md:col-span-8">
                        <div>
                            <div className="mb-8 flex items-start justify-between">
                                <span className="bg-zi-navy px-3 py-1 text-zi-label font-semibold tracking-wider text-white uppercase">
                                    Trending Sector
                                </span>
                                <span className="flex items-center gap-1 text-zi-label font-semibold text-zi-error">
                                    <TrendingUp className="h-4 w-4" />
                                    +12.4%
                                </span>
                            </div>
                            {featuredCompanies[0] ? (
                                <>
                                    <h3 className="font-serif mb-4 text-zi-headline-lg font-semibold leading-tight">
                                        {featuredCompanies[0].company_name}
                                    </h3>
                                    <p className="max-w-xl text-zi-body-md text-zi-on-surface-variant">
                                        {featuredCompanies[0].business_summary ?? '비즈니스 요약 정보가 없습니다.'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="font-serif mb-4 text-zi-headline-lg font-semibold leading-tight">
                                        반도체 HBM 시장의 구조적 성장과 차세대 패키징 솔루션 분석
                                    </h3>
                                    <p className="max-w-xl text-zi-body-md text-zi-on-surface-variant">
                                        SK하이닉스와 삼성전자의 기술 로드맵을 중심으로 살펴본 차세대 메모리 시장의 주도권 변화.
                                    </p>
                                </>
                            )}
                        </div>

                        {/* 미니 바 차트 */}
                        <div className="mt-12 flex h-32 items-end gap-2">
                            {[20, 35, 50, 45, 70, 85, 100].map((h, i) => (
                                <div
                                    key={i}
                                    className="flex-1 transition-all"
                                    style={{
                                        height: `${h}%`,
                                        backgroundColor: i < 4 ? '#e5e2e1' : i < 6 ? '#005eb2' : '#001F3F',
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 사이드 카드 */}
                    <div className="flex flex-col gap-6 md:col-span-4">
                        {/* Emerging Entity */}
                        <div className="border border-zi-divider bg-zi-surface-low p-6">
                            <h4 className="mb-4 text-zi-label font-semibold uppercase tracking-wider text-slate-500">
                                Emerging Entity
                            </h4>
                            {featuredCompanies[1] ? (
                                <>
                                    <p className="mb-2 text-zi-headline-md font-bold text-zi-navy">
                                        {featuredCompanies[1].company_name}
                                    </p>
                                    <p className="text-zi-caption text-zi-on-surface-variant">
                                        {featuredCompanies[1].business_summary?.slice(0, 50) ?? '업종 정보 없음'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="mb-2 text-zi-headline-md font-bold text-zi-navy">Replicate AI</p>
                                    <p className="text-zi-caption text-zi-on-surface-variant">오픈소스 모델 서빙 시장의 파괴적 혁신자</p>
                                </>
                            )}
                            <div className="mt-6 flex items-center justify-between border-t border-zi-divider pt-4">
                                <span className="text-zi-label font-semibold">Signal Strength</span>
                                <span className="font-bold text-zi-blue">Strong</span>
                            </div>
                        </div>

                        {/* Market Sentiment */}
                        <div className="relative overflow-hidden border border-zi-divider bg-white p-6">
                            <h4 className="mb-4 text-zi-label font-semibold uppercase tracking-wider text-slate-500">
                                Market Sentiment
                            </h4>
                            <p className="text-zi-headline-md font-bold text-zi-navy">Bullish Neutral</p>
                            <p className="mt-1 text-zi-caption text-zi-on-surface-variant">
                                글로벌 투자 심리 지수: {totalStats.totalArticles > 100 ? '68' : '72'}/100
                            </p>
                            <div className="absolute -bottom-4 -right-4 opacity-5">
                                <svg className="h-24 w-24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────── */}
            {/* 매거진 프리뷰 섹션 */}
            {/* ─────────────────────────────── */}
            <section className="border-y border-zi-divider bg-white py-24">
                <div className="mx-auto max-w-zi-container px-6">
                    {/* 매거진 헤더 */}
                    <div className="mb-16 text-center">
                        <h2 className="font-serif mb-4 text-zi-display font-semibold italic text-zi-navy">
                            The Zinsight Magazine
                        </h2>
                        <p className="text-zi-body-md text-slate-500">
                            최신 마켓 인사이트와 심층 리서치를 저널리즘 형식으로 전달합니다.
                        </p>
                    </div>

                    {/* 아티클 3단 그리드 */}
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                        {magazineArticles.length > 0
                            ? magazineArticles.map((article, idx) => (
                                  <MagazineArticleCard
                                      key={article.id}
                                      category={article.industryName}
                                      title={article.title}
                                      summary={article.summary ?? ''}
                                      author={article.source ?? 'Zinsight 편집부'}
                                      readTime={`${(idx + 1) * 4 + 4} min read`}
                                      href={article.url ?? '#'}
                                      index={idx}
                                  />
                              ))
                            : FALLBACK_MAGAZINE_ARTICLES.map((article, idx) => (
                                  <MagazineArticleCard
                                      key={idx}
                                      category={article.category}
                                      title={article.title}
                                      summary={article.summary}
                                      author={article.author}
                                      readTime={article.readTime}
                                      href="#"
                                      index={idx}
                                  />
                              ))}
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────── */}
            {/* 트렌딩 키워드 섹션 */}
            {/* ─────────────────────────────── */}
            {trendingKeywords.length > 0 && (
                <section className="mx-auto max-w-zi-container border-t border-zi-divider px-6 py-16">
                    <h2 className="mb-8 text-zi-headline-md font-bold text-zi-navy">
                        트렌딩 키워드
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {trendingKeywords.map((kw) => (
                            <Link
                                key={kw.id}
                                href={`/insight-radar?q=${encodeURIComponent(kw.keyword_text)}`}
                                className="border border-zi-divider bg-white px-4 py-2 text-zi-label font-semibold text-zi-navy transition-colors hover:border-zi-blue hover:text-zi-blue"
                            >
                                {kw.keyword_text}
                                <span className="ml-2 text-zi-caption text-zi-on-surface-variant">
                                    {kw.count}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ─────────────────────────────── */}
            {/* CTA 섹션 */}
            {/* ─────────────────────────────── */}
            <section className="mx-auto max-w-zi-container border-t border-zi-divider px-6 py-24 text-center">
                <h2 className="font-serif mb-8 text-zi-headline-lg font-semibold">
                    비즈니스 의사결정의 기준을 세우십시오.
                </h2>
                <p className="mx-auto mb-12 max-w-2xl text-zi-body-lg text-zi-on-surface-variant">
                    Zinsight의 전문 분석가들이 큐레이션한 최신 리포트와 실시간 데이터 대시보드를
                    지금 바로 이용해 보세요.
                </p>
                <Link
                    href="/insight-radar"
                    className="group inline-flex items-center gap-3 bg-zi-navy px-10 py-5 font-bold text-white transition-all hover:gap-5"
                >
                    Insight Radar 탐색하기
                    <ArrowRight className="h-5 w-5" />
                </Link>
            </section>
        </div>
    );
}

// ─────────────────────────────────────────────
// 내부 컴포넌트
// ─────────────────────────────────────────────

interface MagazineArticleCardProps {
    category: string;
    title: string;
    summary: string;
    author: string;
    readTime: string;
    href: string;
    index: number;
}

function MagazineArticleCard({
    category,
    title,
    summary,
    author,
    readTime,
    href,
    index,
}: MagazineArticleCardProps) {
    // 인덱스에 따른 그레이스케일 이미지 플레이스홀더 색상
    const placeholderColors = ['#e5e2e1', '#dcd9d9', '#c4c7c9'];

    return (
        <article className="group flex cursor-pointer flex-col">
            {/* 이미지 플레이스홀더 */}
            <div
                className="mb-6 aspect-[4/5] overflow-hidden"
                style={{ backgroundColor: placeholderColors[index % 3] }}
            >
                <div className="h-full w-full transition-all duration-500 group-hover:scale-105" />
            </div>

            {/* 카테고리 레이블 */}
            <span className="mb-3 text-zi-label font-semibold uppercase tracking-widest text-zi-blue">
                {category}
            </span>

            {/* 제목 */}
            <h3 className="font-serif mb-4 text-zi-headline-lg font-semibold leading-tight transition-colors group-hover:text-zi-blue">
                {title}
            </h3>

            {/* 요약 */}
            <p className="line-clamp-3 text-zi-body-md text-zi-on-surface-variant">
                {summary}
            </p>

            {/* 메타 정보 */}
            <div className="mt-auto flex items-center justify-between border-t border-zi-divider pt-6">
                <span className="text-zi-caption text-slate-400">{author}</span>
                <span className="text-zi-caption text-slate-400">{readTime}</span>
            </div>
        </article>
    );
}

// ─────────────────────────────────────────────
// 폴백 데이터 (DB가 비어 있을 때 표시)
// ─────────────────────────────────────────────

const FALLBACK_MAGAZINE_ARTICLES = [
    {
        category: 'Macro Analysis',
        title: '공급망의 재편: 글로벌 생산 거점의 이동과 기회',
        summary: '탈중국화 현상이 가속화됨에 따라 인도와 동남아시아로 이동하는 글로벌 공급망의 핵심 축을 심층 분석합니다.',
        author: 'Michael Park',
        readTime: '8 min read',
    },
    {
        category: 'Brand Strategy',
        title: '명품의 이면: Z세대가 정의하는 새로운 럭셔리',
        summary: '소유보다 경험을, 로고보다 가치를 중시하는 새로운 세대의 소비 패턴이 시장의 패러다임을 어떻게 바꾸고 있는가.',
        author: 'Sarah Kim',
        readTime: '12 min read',
    },
    {
        category: 'Tech Frontier',
        title: '생성형 AI가 바꾸는 업무의 미래와 생산성의 한계',
        summary: '단순 업무 대체를 넘어 창의적 영역까지 침투한 AI가 기업의 조직 문화와 개인의 역량 정의에 미치는 영향.',
        author: 'David Lee',
        readTime: '15 min read',
    },
];
