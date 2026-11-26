import type { Metadata } from 'next';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { isPagePublished, siteConfig } from '@/config/site';
import { buildBreadcrumbId, buildSocialMetadata, buildWebPageId, serializeJsonLd, SITE_BASE_URL, SITE_ORGANIZATION_ID, SITE_WEBSITE_ID } from '@/lib/site';
import { inquiryProductOptions } from '@/lib/inquiry';
import { InquiryForm } from '@/components/public/services/InquiryForm';

// 기업 등록·제휴 안내 (언론사 '광고·제휴 문의'에 해당). 상단 메뉴에는 없고 푸터·프로필·카드 하단 글자 링크로만 들어옴.
// 가격은 싣지 않음 (가격 값은 src/config/site.ts pricing에 보관만). 내용은 siteConfig.partnership, 공개 여부는 pages.services.published
export const revalidate = 3600;

const PATH = '/services';
const PAGE_URL = `${SITE_BASE_URL}${PATH}`;
const { brand, partnership, crossLink, company } = siteConfig;
const published = isPagePublished('services');

const title = partnership.pageTitle;
const description = partnership.metaDescription;

export const metadata: Metadata = {
    // 기본 템플릿대로 '기업 등록·제휴 안내 | 진사이트'
    title,
    description,
    alternates: { canonical: PAGE_URL },
    robots: published ? { index: true, follow: true } : { index: false, follow: false },
    ...buildSocialMetadata({ title, description, path: PATH }),
};

export default function ServicesPage() {
    const { offerings } = partnership;

    // JSON-LD: WebPage·ItemList(Service)·BreadcrumbList. 가격·Offer는 넣지 않음
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                '@id': buildWebPageId(PAGE_URL),
                url: PAGE_URL,
                name: `${title} | ${brand.name}`,
                description,
                inLanguage: 'ko-KR',
                isPartOf: { '@id': SITE_WEBSITE_ID },
                breadcrumb: { '@id': buildBreadcrumbId(PAGE_URL) },
                mainEntity: { '@id': `${PAGE_URL}#services` },
            },
            {
                '@type': 'ItemList',
                '@id': `${PAGE_URL}#services`,
                itemListElement: offerings.map((item, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    item: {
                        '@type': 'Service',
                        name: item.name,
                        description: item.summary,
                        provider: { '@id': SITE_ORGANIZATION_ID },
                    },
                })),
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

    return (
        <div className="bg-zi-surface">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

            {/* 첫 화면 */}
            <section className="mx-auto max-w-zi-container px-4 sm:px-6 pt-10 pb-8 sm:pt-20 sm:pb-12 text-center">
                <h1 className="mx-auto mb-4 max-w-4xl font-h1 text-[26px] sm:text-[34px] lg:text-[40px] leading-tight text-zi-primary break-keep">{title}</h1>
                <p className="mx-auto max-w-2xl text-body-md text-zi-on-surface-variant break-keep">{partnership.intro}</p>
                <div className="mt-7 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
                    <a
                        href="#inquiry"
                        data-zi-cta="services_hero"
                        data-zi-product="basic-diagnosis"
                        className="inline-flex min-h-12 items-center justify-center rounded-zi-btn bg-zi-primary px-7 text-[15px] font-bold text-white transition-all hover:bg-zi-primary/90 active:scale-95"
                    >
                        무료 진단 신청
                    </a>
                    <a
                        href="#inquiry"
                        data-zi-cta="services_hero"
                        className="inline-flex min-h-12 items-center justify-center rounded-zi-btn border border-zi-primary bg-white px-7 text-[15px] font-bold text-zi-primary transition-all hover:bg-zi-primary hover:text-white active:scale-95"
                    >
                        문의하기
                    </a>
                </div>
            </section>

            {/* 무엇을 해 드리나요 (가격 없음) */}
            <section aria-labelledby="offerings-title" className="mx-auto max-w-zi-container px-4 sm:px-6 pb-12 sm:pb-16">
                <h2 id="offerings-title" className="mb-4 text-[20px] sm:text-[24px] font-bold text-zi-primary">
                    무엇을 해 드리나요
                </h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                    {offerings.map((item) => (
                        <li key={item.id} className="flex flex-col rounded-zi-card border border-zi-divider bg-white p-4 sm:p-5">
                            <h3 className="flex flex-wrap items-center gap-2 text-[16px] font-bold text-slate-900 break-keep">
                                {item.name}
                                {item.badge && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] font-semibold text-emerald-700">{item.badge}</span>
                                )}
                            </h3>
                            <p className="mt-1.5 text-[14px] leading-relaxed text-zi-on-surface-variant break-keep">{item.summary}</p>
                            <a
                                href="#inquiry"
                                data-zi-product={item.id}
                                className="mt-auto inline-flex min-h-11 items-center gap-1 self-start pt-3 text-[13px] font-semibold text-zi-primary hover:underline underline-offset-2"
                            >
                                문의하기
                                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-[13px] text-slate-500 break-keep">{partnership.disclaimer}</p>
            </section>

            {/* 진행 안내 */}
            <section aria-labelledby="steps-title" className="mx-auto max-w-zi-container px-4 sm:px-6 pb-12 sm:pb-16">
                <h2 id="steps-title" className="mb-4 text-[20px] sm:text-[24px] font-bold text-zi-primary">
                    진행 안내
                </h2>
                <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    {partnership.steps.map((step, i) => (
                        <li key={step} className="flex items-center gap-2.5 rounded-zi-card border border-zi-divider bg-white px-4 py-3.5 text-[14px] font-semibold text-slate-800 break-keep">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zi-primary text-[12px] font-bold text-white">{i + 1}</span>
                            {step}
                        </li>
                    ))}
                </ol>
            </section>

            {/* 문의 폼 */}
            <section id="inquiry" aria-labelledby="inquiry-title" className="scroll-mt-24 mx-auto max-w-zi-container px-4 sm:px-6 pb-12 sm:pb-20">
                <h2 id="inquiry-title" className="mb-2 text-[20px] sm:text-[24px] font-bold text-zi-primary">
                    기업 등록·제휴 문의
                </h2>
                <p className="mb-5 text-[14px] text-zi-on-surface-variant break-keep">
                    남겨 주시면 무료 진단 후 맞춤 제안과 견적을 안내해 드립니다. 이 문의는 {brand.name}(운영사 {company.name})로 접수됩니다.
                </p>
                <InquiryForm products={inquiryProductOptions()} retentionNote={partnership.retentionNote} contactEmail={company.email} />
            </section>

            {/* 교차 링크: 운영사 진독 (주소가 비면 숨김) */}
            {crossLink.href && (
                <section className="border-t border-zi-divider bg-white">
                    <div className="mx-auto flex max-w-zi-container flex-col items-start justify-between gap-3 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
                        <p className="text-[16px] font-bold text-slate-900 break-keep">{crossLink.label}</p>
                        <a
                            href={crossLink.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[15px] font-semibold text-zi-blue hover:underline"
                        >
                            {crossLink.cta}
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                    </div>
                </section>
            )}
        </div>
    );
}
