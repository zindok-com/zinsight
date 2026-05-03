import type { Metadata } from 'next';
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
    const sideArticles = latestArticles.slice(1, 4);
    const gridArticles = latestArticles.slice(4, 10);

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            <main className="mx-auto max-w-zi-container px-6 py-12">
                {/* ─────────────────────────────── */}
                {/* 매거진 헤더 */}
                {/* ─────────────────────────────── */}
                <div className="mb-16 flex flex-col md:flex-row items-end justify-between border-b border-zi-divider pb-8">
                    <div>
                        <span className="mb-2 block text-ui-label font-ui-label font-semibold text-zi-secondary uppercase tracking-widest">
                            Latest Edition
                        </span>
                        <h1 className="font-h1 text-h1 text-zi-primary">
                            The Intelligence Hub
                        </h1>
                    </div>
                    <div className="hidden text-right md:block">
                        <p className="max-w-xs text-body-md font-body-md text-zi-on-surface-variant">
                            현대 비즈니스와 마케팅의 본질을 꿰뚫는 데이터 기반의 깊이 있는 시선.
                        </p>
                    </div>
                </div>

                {/* ─────────────────────────────── */}
                {/* 피처드 스토리 (Hero) */}
                {/* ─────────────────────────────── */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24 items-center">
                    <div className="lg:col-span-6 flex flex-col justify-center order-2 lg:order-1">
                        <div className="mb-4">
                            <span className="font-ui-label text-[10px] uppercase tracking-widest bg-zi-surface-container-highest px-3 py-1 rounded-full text-zi-primary font-bold">
                                Deep Dive
                            </span>
                        </div>
                        <h2 className="font-h1 text-h1 text-zi-on-surface mb-6">
                            {featuredArticle?.title ?? '글로벌 공급망 재편과 아시아 테크 허브의 부상'}
                        </h2>
                        <p className="font-body-lg text-body-lg text-zi-on-surface-variant mb-8">
                            {featuredArticle?.summary
                                ? featuredArticle.summary.slice(0, 180) + '...'
                                : '지정학적 긴장이 고조되는 가운데, 반도체 및 첨단 기술 산업의 무게 중심이 어떻게 이동하고 있는지 심층 분석합니다.'}
                        </p>
                        <div className="flex items-center gap-4 text-zi-outline font-ui-label text-ui-label border-t border-zi-divider pt-4">
                            <span className="text-zi-on-surface font-semibold">By {featuredArticle?.source ?? 'Zinsight 편집부'}</span>
                            <span>•</span>
                            <span>12 Min Read</span>
                        </div>
                    </div>
                    <div className="lg:col-span-6 aspect-[4/3] w-full order-1 lg:order-2">
                        <div className="w-full h-full bg-zi-surface-container-low rounded-zi-card overflow-hidden shadow-sm relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-zi-primary/10 to-zi-secondary/5" />
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────── */}
                {/* 서브 섹션 (그리드 + 사이드바) */}
                {/* ─────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* 메인 리스트 */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                        {(gridArticles.length > 0 ? gridArticles : FALLBACK_ARTICLES).map((article, idx) => {
                            const isReal = 'id' in article;
                            return (
                                <article key={isReal ? article.id : idx} className="flex flex-col group cursor-pointer">
                                    <div className="mb-6 aspect-[16/10] bg-zi-surface-container-low rounded-zi-card overflow-hidden">
                                        <div className="h-full w-full transition-all duration-500 group-hover:scale-105 bg-zi-surface-container" />
                                    </div>
                                    <span className="mb-3 block text-ui-label font-ui-label font-semibold uppercase tracking-wider text-zi-secondary">
                                        {isReal ? article.industryName : (article as any).category}
                                    </span>
                                    <h4 className="mb-4 font-h3 text-h3 text-zi-primary group-hover:text-zi-secondary transition-colors">
                                        {isReal ? article.title : (article as any).title}
                                    </h4>
                                    <p className="mb-6 line-clamp-3 text-body-md font-body-md text-zi-on-surface-variant">
                                        {isReal ? article.summary : (article as any).excerpt}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between border-t border-zi-divider pt-4 text-zi-outline text-ui-label">
                                        <span>{isReal ? article.source : (article as any).author}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* 사이드바 */}
                    <div className="lg:col-span-4 flex flex-col gap-12">
                        <div className="bg-zi-surface-container-low p-8 rounded-zi-card border border-zi-divider">
                            <h3 className="font-h3 text-h3 text-zi-primary mb-4">Newsletter</h3>
                            <p className="text-body-md font-body-md text-zi-on-surface-variant mb-6">
                                매주 월요일 아침, 가장 예리한 마켓 인사이트를 편지함으로 보내드립니다.
                            </p>
                            <div className="flex flex-col gap-3">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-3 rounded-zi-btn border border-zi-outline-variant bg-white text-body-md focus:border-zi-primary outline-none transition-all"
                                />
                                <button className="w-full py-3 bg-zi-primary text-white font-ui-label rounded-zi-btn hover:bg-zi-primary/90 transition-all active:scale-[0.98]">
                                    Subscribe
                                </button>
                            </div>
                        </div>

                        {/* 트렌딩 사이드바 */}
                        <div className="flex flex-col gap-6">
                            <h3 className="font-ui-label text-ui-label font-bold uppercase tracking-widest text-zi-outline pb-2 border-b border-zi-divider">
                                More Headlines
                            </h3>
                            {sideArticles.map((article) => (
                                <div key={article.id} className="group cursor-pointer">
                                    <h4 className="font-h3 text-[18px] leading-snug text-zi-primary mb-2 group-hover:text-zi-secondary transition-colors">
                                        {article.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-zi-outline text-[12px]">
                                        <span>{article.industryName}</span>
                                        <span>•</span>
                                        <span>{article.source}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

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
