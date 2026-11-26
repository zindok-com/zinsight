import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import {
    getRadarLatestArticles,
    getRadarTrendingKeywords,
    getRadarCompanies,
} from '@/actions/insight-radar-actions';
import { getHeadlineMagazinePosts } from '@/actions/public/magazine-actions';
import { MagazineCarousel } from '@/components/public/home/MagazineCarousel';
import { AiCitationCases } from '@/components/public/home/AiCitationCases';
import { buildSiteOrganizationJsonLd, serializeJsonLd, SITE_BASE_URL, SITE_DESCRIPTION, SITE_NAME, SITE_ORGANIZATION_ID, SITE_WEBSITE_ID } from '@/lib/site';
import { siteConfig } from '@/config/site';

export const revalidate = 3600; // 1시간마다 ISR 재생성 (force-dynamic 제거 → 구글봇이 안정적으로 캐시된 HTML 수집 가능)

export const metadata: Metadata = {
    alternates: {
        canonical: SITE_BASE_URL,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default async function PublicHomePage() {
    const { identity, home } = siteConfig;
    // 홈 페이지에 필요한 데이터를 병렬로 조회
    const [{ companies: featuredCompanies }, latestArticles, trendingKeywords, headlinePosts] =
        await Promise.all([
            getRadarCompanies({}, 1, 3),
            getRadarLatestArticles({}, 3),
            getRadarTrendingKeywords(undefined, 8),
            getHeadlineMagazinePosts(),
        ]);

    // WebSite + Organization + Navigation JSON-LD 구조화 데이터
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            buildSiteOrganizationJsonLd(),
            {
                '@type': 'WebSite',
                '@id': SITE_WEBSITE_ID,
                'url': SITE_BASE_URL,
                'name': SITE_NAME,
                'alternateName': [siteConfig.brand.alternateName],
                'description': SITE_DESCRIPTION,
                'inLanguage': 'ko-KR',
                'publisher': {
                    '@id': SITE_ORGANIZATION_ID,
                },
                'potentialAction': {
                    '@type': 'SearchAction',
                    'target': 'https://www.zinsight.co.kr/insight-radar?q={search_term_string}',
                    'query-input': 'required name=search_term_string',
                },
            },
            {
                '@type': 'SiteNavigationElement',
                '@id': 'https://www.zinsight.co.kr/#nav-magazine',
                'name': '매거진',
                'url': 'https://www.zinsight.co.kr/magazine',
            },
            {
                '@type': 'SiteNavigationElement',
                '@id': 'https://www.zinsight.co.kr/#nav-radar',
                'name': '인사이트 레이더',
                'url': 'https://www.zinsight.co.kr/insight-radar',
            },
        ],
    };

    return (
        <>
            <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            {/* JSON-LD 구조화 데이터 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
            />
            {/* ─────────────────────────────── */}
            {/* Hero 섹션 */}
            {/* ─────────────────────────────── */}
            <section className="relative overflow-hidden pb-16 pt-10 sm:pb-32 sm:pt-20">
                <div className="relative z-10 mx-auto max-w-zi-container px-4 sm:px-6 text-center">
                    {/* 헤드라인: 보조 문구·슬로건·설명은 src/config/site.ts identity */}
                    <p className="mb-3 sm:mb-4 text-[13px] sm:text-[15px] font-semibold tracking-wide text-zi-blue break-keep">{identity.tagline}</p>
                    <h1 className="font-h1 text-[26px] sm:text-[34px] lg:text-h1 leading-tight text-zi-primary mb-5 sm:mb-8 break-keep">
                        {identity.slogan}
                    </h1>
                    <p className="font-body-md text-body-md sm:font-body-lg sm:text-body-lg text-zi-on-surface-variant max-w-3xl mx-auto mb-8 sm:mb-12 break-keep">
                        {identity.heroDescription}
                    </p>

                    {/* 통합 검색바 (인사이트 레이더 이동 버튼으로 사용되던 부분 주석 처리) */}
                    {/* 
                    <div className="mx-auto mb-12 max-w-2xl relative">
                        <Link href="/insight-radar" className="group relative block">
                            <div className="flex h-16 w-full items-center rounded-zi-btn border border-zi-outline-variant bg-zi-surface pl-14 pr-6 transition-all shadow-sm group-hover:shadow-md group-hover:border-zi-primary-container">
                                <svg
                                    className="absolute left-4 h-6 w-6 text-zi-outline"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-body-md font-body-md text-zi-on-surface-variant">
                                    산업, 기업 또는 최신 트렌드를 검색하세요
                                </span>
                            </div>
                        </Link>
                    </div>
                    */}

                    {/* CTA 버튼 */}
                    <div className="flex flex-col justify-center gap-3 sm:flex-row mt-2 px-2 sm:px-0">
                        <Link
                            href="/insight-radar"
                            className="inline-flex items-center justify-center rounded-zi-btn bg-zi-primary px-8 py-3.5 text-ui-label font-ui-label text-white transition-all active:scale-95 shadow-sm hover:bg-zi-primary/90 gap-2"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                            </svg>
                            인사이트 레이더 둘러보기
                        </Link>
                        <Link
                            href={siteConfig.contact.href}
                            data-zi-cta="home_hero"
                            className="inline-flex items-center justify-center rounded-zi-btn border border-zi-outline-variant bg-transparent px-8 py-3.5 text-ui-label font-ui-label text-zi-on-surface transition-all active:scale-95 hover:bg-zi-surface-container-low gap-2"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            우리 회사도 등록하기
                        </Link>
                        {/* AI 노출 진단 버튼 슬롯: 상품 확정 후 설정에서 켬 */}
                        {home.aiDiagnosis.enabled && home.aiDiagnosis.href && (
                            <Link
                                href={home.aiDiagnosis.href}
                                className="inline-flex items-center justify-center rounded-zi-btn border border-zi-blue bg-transparent px-8 py-3.5 text-ui-label font-ui-label text-zi-blue transition-all active:scale-95 hover:bg-zi-blue/5"
                            >
                                {home.aiDiagnosis.label}
                            </Link>
                        )}
                    </div>
                </div>

                {/* 장식 요소 */}
                <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 -skew-x-12 translate-x-1/2 bg-slate-100/30" />
            </section>

            {/* ─────────────────────────────── */}
            {/* AI 인용 사례 (aiCitations, 공개 동의된 사례만) — 없으면 '이렇게 작동합니다' 3단계 */}
            {/* ─────────────────────────────── */}
            <AiCitationCases cases={siteConfig.aiCitations} />

            {/* ─────────────────────────────── */}
            {/* 실시간 인사이트 레이더 섹션 (추후 기능 추가 시 사용을 위해 주석 처리) */}
            {/* ─────────────────────────────── */}
            {/* 
            <section className="mx-auto max-w-zi-container border-t border-zi-divider px-6 py-24">
                <div className="mb-12 flex items-end justify-between">
                    <div>
                        <h2 className="mb-2 text-zi-headline-md font-bold text-zi-primary">
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

                <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                    <div className="flex flex-col justify-between border border-zi-divider bg-white p-8 md:col-span-8">
                        <div>
                            <div className="mb-8 flex items-start justify-between">
                                <span className="bg-zi-primary px-3 py-1 text-zi-label font-semibold tracking-wider text-white uppercase">
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

                    <div className="flex flex-col gap-6 md:col-span-4">
                        <div className="border border-zi-divider bg-zi-surface-low p-6">
                            <h4 className="mb-4 text-zi-label font-semibold uppercase tracking-wider text-slate-500">
                                Emerging Entity
                            </h4>
                            {featuredCompanies[1] ? (
                                <>
                                    <p className="mb-2 text-zi-headline-md font-bold text-zi-primary">
                                        {featuredCompanies[1].company_name}
                                    </p>
                                    <p className="text-zi-caption text-zi-on-surface-variant">
                                        {featuredCompanies[1].business_summary?.slice(0, 50) ?? '업종 정보 없음'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="mb-2 text-zi-headline-md font-bold text-zi-primary">Replicate AI</p>
                                    <p className="text-zi-caption text-zi-on-surface-variant">오픈소스 모델 서빙 시장의 파괴적 혁신자</p>
                                </>
                            )}
                            <div className="mt-6 flex items-center justify-between border-t border-zi-divider pt-4">
                                <span className="text-zi-label font-semibold">Signal Strength</span>
                                <span className="font-bold text-zi-blue">Strong</span>
                            </div>
                        </div>

                        <div className="relative overflow-hidden border border-zi-divider bg-white p-6">
                            <h4 className="mb-4 text-zi-label font-semibold uppercase tracking-wider text-slate-500">
                                Market Sentiment
                            </h4>
                            <p className="text-zi-headline-md font-bold text-zi-primary">Bullish Neutral</p>
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
            */}

            {/* ─────────────────────────────── */}
            {/* 매거진 프리뷰 섹션 */}
            {/* ─────────────────────────────── */}
            <section className="border-y border-zi-divider bg-white py-12 sm:py-24">
                <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                    {/* 매거진 헤더 */}
                    <div className="mb-8 sm:mb-16 text-center">
                        <h2 className="font-serif mb-3 text-[24px] sm:text-zi-display font-semibold italic text-zi-primary">
                            진사이트 매거진
                        </h2>
                        <p className="text-zi-body-md text-slate-500">
                            {identity.magazineIntro}
                        </p>
                    </div>

                    {/* 매거진 캐러셀 */}
                    <div className="mt-8">
                        <MagazineCarousel posts={headlinePosts} />
                    </div>
                </div>
            </section>
        </div>
    </>
    );
}

