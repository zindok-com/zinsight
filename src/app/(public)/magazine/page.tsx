import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getRadarLatestArticles, getRadarIndustries } from '@/actions/insight-radar-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Magazine',
    description: '현대 비즈니스와 마케팅의 본질을 꿰뚫는 데이터 기반의 깊이 있는 시선. The Zinsight Magazine.',
};

export default async function MagazinePage() {
    const [latestArticles, industries] = await Promise.all([
        getRadarLatestArticles({}, 9),
        getRadarIndustries(),
    ]);

    const featuredArticle = latestArticles[0] ?? null;
    const sideArticles = latestArticles.slice(1, 3);
    const gridArticles = latestArticles.slice(3, 9);

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            <main className="mx-auto max-w-zi-container px-6 py-zi-stack-lg">
                {/* ─────────────────────────────── */}
                {/* 매거진 헤더 */}
                {/* ─────────────────────────────── */}
                <div className="mb-zi-stack-lg flex items-end justify-between border-b border-zi-divider pb-zi-stack-md">
                    <div>
                        <span className="mb-2 block text-zi-label font-semibold text-zi-blue uppercase tracking-widest">
                            Latest Edition
                        </span>
                        <h1 className="font-serif text-zi-display font-semibold leading-none text-zi-navy">
                            The Intelligence Hub
                        </h1>
                    </div>
                    <div className="hidden text-right md:block">
                        <p className="max-w-xs text-zi-body-md text-zi-on-surface-variant">
                            현대 비즈니스와 마케팅의 본질을 꿰뚫는 데이터 기반의 깊이 있는 시선.
                        </p>
                    </div>
                </div>

                {/* ─────────────────────────────── */}
                {/* 피처드 스토리 (Hero) */}
                {/* ─────────────────────────────── */}
                <section className="mb-16 grid grid-cols-1 gap-zi-gutter lg:grid-cols-12">
                    {/* 메인 피처 기사 */}
                    <div className="lg:col-span-8">
                        {/* 커버 이미지 플레이스홀더 */}
                        <div className="relative mb-6 aspect-video overflow-hidden bg-zi-surface-high">
                            <div className="absolute inset-0 bg-gradient-to-br from-zi-navy/20 to-zi-blue/10" />
                        </div>

                        <div className="max-w-3xl">
                            <span className="mb-4 inline-block bg-zi-navy px-3 py-1 text-zi-label font-semibold text-white">
                                COVER STORY
                            </span>
                            <h2 className="font-serif mb-4 text-zi-headline-lg font-semibold leading-tight text-zi-navy">
                                {featuredArticle?.title ?? '데이터 주권 시대의 마케팅: 개인화의 한계와 새로운 윤리적 표준'}
                            </h2>
                            <p className="mb-6 text-zi-body-lg text-zi-on-surface-variant">
                                {featuredArticle?.summary
                                    ? featuredArticle.summary.slice(0, 200) + (featuredArticle.summary.length > 200 ? '…' : '')
                                    : '쿠키리스 시대의 도래와 함께 마케팅 기술 지형이 급변하고 있습니다. 단순한 추적을 넘어 소비자와의 진정한 신뢰 관계를 구축하기 위한 글로벌 선두 기업들의 전략적 전환을 심층 분석합니다.'}
                            </p>

                            {/* 저자 정보 */}
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zi-surface-high" />
                                <div>
                                    <p className="text-zi-label font-semibold text-zi-navy">
                                        {featuredArticle?.source ?? 'Zinsight 편집부'}
                                    </p>
                                    <p className="text-zi-caption text-zi-on-surface-variant">Strategic Analysis Unit</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 우측 사이드 */}
                    <div className="flex flex-col gap-8 lg:col-span-4">
                        {sideArticles.map((article, idx) => (
                            <div key={article.id} className="border-t border-zi-divider pt-6">
                                <span className="mb-2 block text-zi-label font-semibold text-zi-blue uppercase">
                                    {idx === 0 ? 'Opinion' : 'Trends'}
                                </span>
                                <h3 className="mb-2 text-zi-headline-md font-bold text-zi-navy">
                                    {article.title}
                                </h3>
                                <p className="line-clamp-3 text-zi-body-md text-zi-on-surface-variant">
                                    {article.summary ?? ''}
                                </p>
                            </div>
                        ))}

                        {/* 뉴스레터 구독 박스 */}
                        <div className="border-t border-zi-divider bg-zi-surface-low p-6 pt-6">
                            <span className="mb-4 block text-zi-label font-semibold text-zi-navy uppercase">
                                Newsletter
                            </span>
                            <p className="mb-4 text-zi-body-md">
                                매주 월요일 아침, 가장 예리한 마켓 인사이트를 편지함으로 보내드립니다.
                            </p>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="email"
                                    placeholder="이메일 주소"
                                    className="border border-zi-divider bg-white px-3 py-3 text-zi-body-md outline-none focus:border-zi-navy"
                                />
                                <button className="bg-zi-navy py-3 text-zi-label font-semibold uppercase tracking-widest text-white transition-opacity hover:opacity-90">
                                    Subscribe Now
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 구분선 */}
                <hr className="mb-16 border-zi-divider" />

                {/* ─────────────────────────────── */}
                {/* 서브 기사 그리드 (3열) */}
                {/* ─────────────────────────────── */}
                <section className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
                    {(gridArticles.length > 0 ? gridArticles : FALLBACK_ARTICLES).map((article, idx) => {
                        const isReal = 'id' in article;
                        return (
                            <article key={isReal ? article.id : idx} className="flex flex-col">
                                {/* 이미지 플레이스홀더 */}
                                <div className="mb-6 aspect-square overflow-hidden bg-zi-surface-high" />

                                <div className="flex-1">
                                    <span className="mb-3 block text-zi-label font-semibold uppercase tracking-wider text-zi-blue">
                                        {isReal ? article.industryName : (article as typeof FALLBACK_ARTICLES[0]).category}
                                    </span>
                                    <h4 className="mb-4 text-zi-headline-md font-bold text-zi-navy">
                                        {isReal ? article.title : (article as typeof FALLBACK_ARTICLES[0]).title}
                                    </h4>
                                    <p className="mb-6 text-zi-body-md text-zi-on-surface-variant">
                                        {isReal
                                            ? (article.summary ?? '').slice(0, 100)
                                            : (article as typeof FALLBACK_ARTICLES[0]).excerpt}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between border-t border-zi-divider pt-4">
                                        <span className="text-zi-caption text-zi-on-surface-variant">
                                            {isReal
                                                ? article.source ?? 'Zinsight'
                                                : (article as typeof FALLBACK_ARTICLES[0]).author}
                                        </span>
                                        <ArrowRight className="h-4 w-4 text-zi-navy" />
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>

                {/* ─────────────────────────────── */}
                {/* Insight Radar 링크 섹션 */}
                {/* ─────────────────────────────── */}
                <section className="mt-20">
                    <div className="mb-8 flex items-center justify-between">
                        <h3 className="font-serif text-zi-headline-lg font-semibold text-zi-navy">Insight Radar</h3>
                        <Link
                            href="/insight-radar"
                            className="text-zi-label font-semibold text-zi-blue hover:underline"
                        >
                            모든 인사이트 보기
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {/* 대형 피처 셀 */}
                        <div className="flex flex-col justify-between bg-zi-navy p-8 text-white md:col-span-2 md:row-span-2">
                            <div>
                                <span className="mb-4 block text-zi-label font-semibold uppercase tracking-widest text-zi-blue-bright">
                                    Industry Update
                                </span>
                                <h4 className="font-serif text-zi-headline-lg leading-tight text-white">
                                    {industries[0]
                                        ? `${industries[0].name} 분야 최신 인사이트 및 핵심 기업 동향`
                                        : "이커머스 시장의 '초저가 공습', 장기적인 생존 전략은 무엇인가?"}
                                </h4>
                            </div>
                            <Link
                                href="/insight-radar"
                                className="flex items-center gap-2 text-zi-label font-semibold text-zi-blue-bright hover:opacity-80 transition-opacity"
                            >
                                REPORT DOWNLOAD
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {/* 알림 셀 */}
                        <div className="border border-zi-divider bg-white p-6">
                            <span className="mb-2 block text-zi-label font-semibold text-zi-error uppercase">Alert</span>
                            <h5 className="mb-2 text-lg font-bold text-zi-navy">
                                {industries[1] ? `${industries[1].name} 분야 주요 변동 사항` : '구글의 서드파티 쿠키 중단 재연기 소식'}
                            </h5>
                            <p className="text-zi-caption text-zi-on-surface-variant">마케팅 자동화 도구들의 대응 현황 요약.</p>
                        </div>

                        {/* 데이터 셀 */}
                        <div className="border border-zi-divider bg-white p-6">
                            <span className="mb-2 block text-zi-label font-semibold text-zi-blue uppercase">Data</span>
                            <h5 className="mb-2 text-lg font-bold text-zi-navy">최신 기사 수집 현황</h5>
                            <p className="text-zi-caption text-zi-on-surface-variant">
                                {industries.length > 0 ? `${industries.length}개 산업 분야 모니터링 중.` : '숏폼 플랫폼의 압도적 우위 지속.'}
                            </p>
                        </div>

                        {/* 웨비나 셀 */}
                        <div className="flex items-center justify-between border border-zi-divider bg-zi-surface-high p-6 md:col-span-2">
                            <div>
                                <span className="mb-1 block text-zi-label font-semibold text-zi-on-surface-variant uppercase">
                                    Upcoming Webinar
                                </span>
                                <h5 className="text-zi-headline-md font-bold text-zi-navy">
                                    AI 네이티브 마케팅 조직 구축법
                                </h5>
                            </div>
                            <button className="border border-zi-navy px-4 py-2 text-zi-label font-semibold text-zi-navy transition-colors hover:bg-zi-navy hover:text-white">
                                신청하기
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

// ─────────────────────────────────────────────
// 폴백 아티클 데이터
// ─────────────────────────────────────────────

const FALLBACK_ARTICLES = [
    {
        category: 'Interview',
        title: '"데이터는 숫자가 아니라 고객의 언어입니다"',
        excerpt: '글로벌 커머스 플랫폼 CMO가 밝히는 데이터 기반 스토리텔링의 정수.',
        author: 'Zinsight 편집부',
    },
    {
        category: 'Analysis',
        title: '핀테크의 다음 장: 임베디드 금융의 폭발적 성장',
        excerpt: '비금융 플랫폼에 금융 서비스가 녹아드는 내재화 트렌드가 가져올 결제 시장의 재편.',
        author: 'Zinsight 편집부',
    },
    {
        category: 'Culture',
        title: '하이브리드 워크가 기업의 브랜드 정체성에 미치는 영향',
        excerpt: '물리적 공간이 사라진 시대, 어떻게 조직의 문화를 유지하고 강력한 브랜딩을 실현할 것인가.',
        author: 'Zinsight 편집부',
    },
];
