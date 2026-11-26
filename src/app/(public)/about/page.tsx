import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Newspaper, Radar } from 'lucide-react';
import { isPagePublished, siteConfig } from '@/config/site';
import { getPublishedPostPaths } from '@/actions/public/magazine-actions';
import {
    buildBreadcrumbId,
    buildSiteOrganizationJsonLd,
    buildSocialMetadata,
    buildWebPageId,
    serializeJsonLd,
    SITE_BASE_URL,
    SITE_ORGANIZATION_ID,
    SITE_WEBSITE_ID,
} from '@/lib/site';

// 진사이트 소개. 상단 메뉴에는 없고 푸터 '진사이트 소개'로만 들어옴.
// 문구·걸어온 길·편집 원칙은 src/config/site.ts about, 운영사 정보는 company, 공개 여부는 pages.about.published
export const revalidate = 3600;

const PATH = '/about';
const PAGE_URL = `${SITE_BASE_URL}${PATH}`;
const { brand, company, about, contact } = siteConfig;
const published = isPagePublished('about');

const title = `${brand.name} 소개`;
const description = about.metaDescription;

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: PAGE_URL },
    robots: published ? { index: true, follow: true } : { index: false, follow: false },
    ...buildSocialMetadata({ title, description, path: PATH }),
};

const SECTIONS = [
    {
        icon: Newspaper,
        name: `${brand.name} 매거진`,
        href: '/magazine',
        body: `${siteConfig.identity.serviceAreas} 등 지역 기업과 기관을 취재해 기사로 소개합니다. 지역별 지면에서 우리 동네 기업 소식을 볼 수 있습니다.`,
        cta: '매거진 보기',
    },
    {
        icon: Radar,
        name: '인사이트 레이더',
        href: '/insight-radar',
        body: '지역 기업·기관의 사업 소개, 제품·서비스, 관련 기사를 한 장의 프로필로 정리합니다.',
        cta: '기업 프로필 보기',
    },
];

const sectionTitle = 'mb-6 text-[20px] sm:text-zi-headline-md font-bold text-zi-primary';

export default async function AboutPage() {
    const timeline = about.timeline.filter((item) => item.visible);
    const postPaths = await getPublishedPostPaths(timeline.flatMap((item) => (item.postSlug ? [item.postSlug] : [])));

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
                publisher: { '@id': SITE_ORGANIZATION_ID },
                breadcrumb: { '@id': buildBreadcrumbId(PAGE_URL) },
            },
            // 메인과 같은 진사이트 Organization (운영사 진독 parentOrganization 포함)
            buildSiteOrganizationJsonLd(),
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

    const companyInfo: Array<{ label: string; value: string; href?: string; external?: boolean }> = [
        { label: '상호', value: `${company.name}(${company.englishName})` },
        { label: '대표', value: company.ceo },
        { label: '사업자등록번호', value: company.businessNumber },
        { label: '주소', value: company.address },
        { label: '전화', value: company.phone, href: `tel:${company.phone.replace(/[^0-9+]/g, '')}` },
        { label: '이메일', value: company.email, href: `mailto:${company.email}` },
        { label: '홈페이지', value: company.homepage.replace(/^https?:\/\/(www\.)?/, ''), href: company.homepage, external: true },
    ];

    return (
        <div className="bg-zi-surface">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

            {/* 정체성 */}
            <section className="mx-auto max-w-zi-container px-4 sm:px-6 pt-10 pb-10 sm:pt-20 sm:pb-16 text-center">
                <h1 className="mb-4 font-h1 text-[26px] sm:text-[34px] lg:text-h1 leading-tight text-zi-primary break-keep">{title}</h1>
                <p className="mx-auto max-w-3xl text-[17px] sm:text-[20px] font-semibold leading-relaxed text-slate-800 break-keep">{about.identity}</p>
            </section>

            {/* 매거진·인사이트 레이더 */}
            <section aria-labelledby="about-what" className="border-t border-zi-divider bg-white py-12 sm:py-16">
                <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                    <h2 id="about-what" className={sectionTitle}>
                        {brand.name}가 하는 일
                    </h2>
                    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                        {SECTIONS.map(({ icon: Icon, ...item }) => (
                            <li key={item.name} className="flex flex-col rounded-zi-card border border-zi-divider bg-zi-surface p-5 sm:p-6">
                                <h3 className="mb-2 flex items-center gap-2 text-[17px] font-bold text-slate-900">
                                    <Icon className="h-5 w-5 text-zi-primary" aria-hidden="true" />
                                    {item.name}
                                </h3>
                                <p className="text-[14px] leading-relaxed text-zi-on-surface-variant break-keep">{item.body}</p>
                                <Link href={item.href} className="mt-auto inline-flex min-h-11 items-center gap-1 self-start pt-3 text-[13px] font-semibold text-zi-primary hover:underline underline-offset-2">
                                    {item.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* 편집 원칙·후원 콘텐츠 표기 정책 (대표 확정 전 about.showEditorial=false로 숨김) */}
            {about.showEditorial && (
                <section id="editorial" aria-labelledby="about-editorial" className="scroll-mt-24 border-t border-zi-divider py-12 sm:py-16">
                    <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                        <h2 id="about-editorial" className={sectionTitle}>
                            편집 원칙
                        </h2>
                        <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {about.editorialPrinciples.map((item, i) => (
                                <li key={item.title} className="rounded-zi-card border border-zi-divider bg-white p-4 sm:p-5">
                                    <p className="mb-1 text-[15px] font-bold text-slate-900">
                                        {i + 1}. {item.title}
                                    </p>
                                    <p className="text-[14px] leading-relaxed text-zi-on-surface-variant break-keep">
                                        {item.body.replace('{correctionEmail}', company.correctionEmail)}
                                    </p>
                                </li>
                            ))}
                        </ol>

                        <h3 className="mt-10 mb-4 text-[18px] font-bold text-zi-primary">후원 콘텐츠 표기 정책</h3>
                        <ul className="list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-zi-on-surface-variant break-keep">
                            {about.sponsorshipPolicy.map((line) => (
                                <li key={line}>{line}</li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* 운영사 */}
            <section aria-labelledby="about-company" className="border-t border-zi-divider bg-white py-12 sm:py-16">
                <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                    <h2 id="about-company" className={sectionTitle}>
                        운영사 {company.name}({company.englishName.toUpperCase()})
                    </h2>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[14px] sm:max-w-2xl">
                        {companyInfo.map(({ label, value, href, external }) => (
                            <div key={label} className="contents">
                                <dt className="text-slate-400">{label}</dt>
                                <dd className="text-slate-800 break-keep">
                                    {href ? (
                                        <a
                                            href={href}
                                            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                            className="inline-flex items-center gap-1 text-zi-primary hover:underline underline-offset-2"
                                        >
                                            {value}
                                            {external && <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
                                        </a>
                                    ) : (
                                        value
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* 걸어온 길 */}
            {timeline.length > 0 && (
                <section aria-labelledby="about-history" className="border-t border-zi-divider py-12 sm:py-16">
                    <div className="mx-auto max-w-zi-container px-4 sm:px-6">
                        <h2 id="about-history" className={sectionTitle}>
                            걸어온 길
                        </h2>
                        <ol className="relative max-w-2xl border-l-2 border-zi-divider pl-6">
                            {timeline.map((item) => {
                                const href = item.postSlug ? postPaths[item.postSlug] : undefined;
                                return (
                                    <li key={item.title} className="relative pb-6 last:pb-0">
                                        <span aria-hidden="true" className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-zi-primary" />
                                        <p className="text-[13px] font-semibold text-zi-blue">{item.date}</p>
                                        <p className="mt-0.5 text-[15px] font-semibold text-slate-900 break-keep">{item.title}</p>
                                        {href && (
                                            <Link href={href} className="mt-1 inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-zi-primary hover:underline underline-offset-2">
                                                관련 기사 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                            </Link>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </section>
            )}

            {/* 기업 등록·제휴 문의: 눈에 띄지 않는 글자 링크 */}
            <p className="border-t border-zi-divider py-8 text-center text-[13px] text-slate-500">
                <Link href={contact.href} data-zi-cta="about_footer" className="inline-flex min-h-11 items-center gap-1 px-2 underline-offset-2 hover:text-zi-primary hover:underline">
                    {contact.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
            </p>
        </div>
    );
}
