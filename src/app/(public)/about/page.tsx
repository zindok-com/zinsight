import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { isExternalHref, isPagePublished, siteConfig } from '@/config/site';
import { buildBreadcrumbId, buildSocialMetadata, buildWebPageId, serializeJsonLd, SITE_BASE_URL, SITE_ORGANIZATION_ID, SITE_WEBSITE_ID } from '@/lib/site';

// 진사이트 소개 (초안). 공개 여부는 src/config/site.ts pages.about.published
const PATH = '/about';
const PAGE_URL = `${SITE_BASE_URL}${PATH}`;
const { brand, company, identity, contact } = siteConfig;
const published = isPagePublished('about');

const title = `${brand.name} 소개`;
const description = `${brand.name}는 ${company.name}이 운영하는 기업 홍보 플랫폼입니다. ${identity.slogan}.`;

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: PAGE_URL },
    // 공개 전에는 색인·링크 수집 모두 막음
    robots: published ? { index: true, follow: true } : { index: false, follow: false },
    ...buildSocialMetadata({ title, description, path: PATH }),
};

const WHAT_WE_DO = [
    {
        name: `${brand.name} 매거진`,
        href: '/magazine',
        body: '기업과 기관의 이야기를 기사로 정리합니다. 검색엔진과 AI가 기업을 설명할 때 근거로 삼을 수 있는 글을 남깁니다.',
    },
    {
        name: '인사이트 레이더',
        href: '/insight-radar',
        body: '기업·기관의 사업 소개, 제품·서비스, 관련 기사를 한 장의 프로필로 모읍니다. 구조화 데이터로 AI가 읽기 쉽게 정리합니다.',
    },
    {
        name: siteConfig.card.displayName,
        href: null,
        body: '명함·전시 QR로 여는 기업 링크 페이지입니다. 방문 고객이 전화·문의·연락처 남기기로 바로 연결되고, 방문과 클릭을 숫자로 확인합니다.',
    },
];

const FUNNEL = [
    { stage: '인지', role: '검색·AI 답변에서 기업 이름이 처음 보이는 단계', focus: false },
    { stage: '관심', role: '기사를 읽고 기업을 알아가는 단계', focus: false },
    { stage: '고려', role: '프로필에서 제품·서비스·활동을 확인하고 믿을 만한지 판단하는 단계', focus: true },
    { stage: '전환', role: '진사이트 카드에서 전화·문의·연락처 남기기로 이어지는 단계', focus: true },
    { stage: '유지', role: '새 소식을 기사로 이어 가며 관계를 지키는 단계', focus: false },
];

export default function AboutPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'AboutPage',
                '@id': buildWebPageId(PAGE_URL),
                url: PAGE_URL,
                name: title,
                description,
                inLanguage: 'ko-KR',
                isPartOf: { '@id': SITE_WEBSITE_ID },
                about: { '@id': SITE_ORGANIZATION_ID },
                mainEntity: { '@id': SITE_ORGANIZATION_ID },
                breadcrumb: { '@id': buildBreadcrumbId(PAGE_URL) },
            },
            {
                '@type': 'BreadcrumbList',
                '@id': buildBreadcrumbId(PAGE_URL),
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: '홈', item: SITE_BASE_URL },
                    { '@type': 'ListItem', position: 2, name: title, item: PAGE_URL },
                ],
            },
        ],
    };

    const contactExternal = isExternalHref(contact.href);

    return (
        <div className="bg-zi-surface">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

            {/* 머리말 */}
            <section className="mx-auto max-w-zi-container px-4 sm:px-6 pt-10 pb-12 sm:pt-20 sm:pb-16 text-center">
                <p className="mb-3 text-sm font-semibold text-zi-blue">{company.name}이 운영하는 {brand.name}</p>
                <h1 className="font-h1 text-[26px] sm:text-[34px] lg:text-h1 leading-tight text-zi-primary mb-5 break-keep">
                    {identity.slogan}
                </h1>
                <p className="mx-auto max-w-3xl text-body-md sm:text-body-lg text-zi-on-surface-variant break-keep">
                    {identity.heroDescription}
                </p>
            </section>

            {/* 하는 일 */}
            <section aria-labelledby="about-what" className="border-t border-zi-divider bg-white py-12 sm:py-20">
                <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                    <h2 id="about-what" className="mb-8 text-[20px] sm:text-zi-headline-md font-bold text-zi-primary">
                        {brand.name}가 하는 일
                    </h2>
                    <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        {WHAT_WE_DO.map((item) => (
                            <li key={item.name} className="flex flex-col rounded-zi-card border border-zi-divider bg-zi-surface p-5 sm:p-6">
                                <h3 className="mb-2 text-[17px] font-bold text-slate-900">{item.name}</h3>
                                <p className="text-[14px] leading-relaxed text-zi-on-surface-variant break-keep">{item.body}</p>
                                {item.href && (
                                    <Link href={item.href} className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-semibold text-zi-primary hover:underline">
                                        둘러보기 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* 고객 퍼널에서의 역할 */}
            <section aria-labelledby="about-funnel" className="border-t border-zi-divider py-12 sm:py-20">
                <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                    <h2 id="about-funnel" className="mb-3 text-[20px] sm:text-zi-headline-md font-bold text-zi-primary">
                        고객이 연락하기까지, {brand.name}의 역할
                    </h2>
                    <p className="mb-8 max-w-3xl text-[14px] sm:text-zi-body-md text-zi-on-surface-variant break-keep">
                        고객은 기업을 알게 되고, 알아보고, 믿을 만한지 따진 뒤에 연락합니다. {brand.name}는 그중 고려와 전환 단계를 맡고,
                        그 결과를 방문·클릭·문의 숫자로 측정합니다.
                    </p>
                    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                        {FUNNEL.map((item, i) => (
                            <li
                                key={item.stage}
                                className={
                                    item.focus
                                        ? 'rounded-zi-card border-2 border-zi-primary bg-white p-4'
                                        : 'rounded-zi-card border border-zi-divider bg-white/60 p-4'
                                }
                            >
                                <p className="mb-1 text-[12px] font-semibold text-slate-400">{i + 1}단계</p>
                                <p className={item.focus ? 'mb-2 text-[16px] font-bold text-zi-primary' : 'mb-2 text-[16px] font-bold text-slate-700'}>
                                    {item.stage}
                                    {item.focus && <span className="ml-1.5 align-middle text-[11px] font-semibold text-zi-blue">집중</span>}
                                </p>
                                <p className="text-[13px] leading-relaxed text-zi-on-surface-variant break-keep">{item.role}</p>
                            </li>
                        ))}
                    </ol>
                    <p className="mt-4 text-[13px] text-slate-500 break-keep">
                        측정: 진사이트 카드의 방문·링크 클릭·문의 클릭·연락처 접수를 기업별 통계로 제공합니다.
                    </p>
                </div>
            </section>

            {/* 운영사 정보 */}
            <section aria-labelledby="about-company" className="border-t border-zi-divider bg-white py-12 sm:py-20">
                <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                    <h2 id="about-company" className="mb-6 text-[20px] sm:text-zi-headline-md font-bold text-zi-primary">
                        운영사
                    </h2>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[14px] sm:max-w-2xl">
                        <dt className="text-slate-400">상호</dt>
                        <dd className="text-slate-800">
                            {company.name}({company.englishName})
                        </dd>
                        <dt className="text-slate-400">대표</dt>
                        <dd className="text-slate-800">{company.ceo}</dd>
                        <dt className="text-slate-400">사업자등록번호</dt>
                        <dd className="text-slate-800">{company.businessNumber}</dd>
                        <dt className="text-slate-400">주소</dt>
                        <dd className="text-slate-800 break-keep">{company.address}</dd>
                        <dt className="text-slate-400">이메일</dt>
                        <dd>
                            <a href={`mailto:${company.email}`} className="text-zi-primary hover:underline">
                                {company.email}
                            </a>
                        </dd>
                        <dt className="text-slate-400">홈페이지</dt>
                        <dd>
                            <a href={company.homepage} target="_blank" rel="noopener noreferrer" className="text-zi-primary hover:underline">
                                {company.homepage.replace(/^https?:\/\//, '')}
                            </a>
                        </dd>
                    </dl>
                </div>
            </section>

            {/* 문의 */}
            <section aria-labelledby="about-contact" className="border-t border-zi-divider py-12 sm:py-20 text-center">
                <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                    <h2 id="about-contact" className="mb-3 text-[20px] sm:text-zi-headline-md font-bold text-zi-primary">
                        문의
                    </h2>
                    <p className="mb-6 text-[14px] sm:text-zi-body-md text-zi-on-surface-variant break-keep">
                        기업 프로필 등록, 기사 발행, 진사이트 카드 도입을 상담해 드립니다.
                    </p>
                    <Link
                        href={contact.href}
                        {...(contactExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="inline-flex items-center justify-center rounded-zi-btn bg-zi-primary px-8 py-3.5 text-ui-label font-ui-label text-white transition-all hover:bg-zi-primary/90 active:scale-95"
                    >
                        {contact.label}
                    </Link>
                </div>
            </section>
        </div>
    );
}
