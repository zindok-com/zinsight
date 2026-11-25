import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import { formatWon, isPagePublished, isPromoActive, siteConfig, type PricingItem } from '@/config/site';
import { buildBreadcrumbId, buildSocialMetadata, buildWebPageId, serializeJsonLd, SITE_BASE_URL, SITE_ORGANIZATION_ID, SITE_WEBSITE_ID } from '@/lib/site';
import { inquiryProductOptions } from '@/lib/inquiry';
import { InquiryForm } from '@/components/public/services/InquiryForm';

// 진사이트 이용 안내 (상품·가격·이용 문의). 상품·가격·프로모션은 src/config/site.ts pricing, 공개 여부는 pages.services.published
// 프로모션 종료일이 지나면 열이 숨겨지도록 1시간마다 다시 만듦 (요청 시 동적 렌더링은 하지 않음)
export const revalidate = 3600;

const PATH = '/services';
const PAGE_URL = `${SITE_BASE_URL}${PATH}`;
const { brand, services, pricing, crossLink, identity, company } = siteConfig;
const published = isPagePublished('services');

const title = pricing.pageTitle;
const description = `${identity.slogan}. ${brand.name} 기업 프로필·${siteConfig.card.displayName}·기사·AI 노출 진단 상품과 가격(VAT 별도), 이용 문의 안내.`;

export const metadata: Metadata = {
    // 제목에 이미 브랜드명이 있어 '| 진사이트' 템플릿을 붙이지 않음
    title: { absolute: title },
    description,
    alternates: { canonical: PAGE_URL },
    robots: published ? { index: true, follow: true } : { index: false, follow: false },
    ...buildSocialMetadata({ title, description, path: PATH }),
};

function PriceCell({ item }: { item: PricingItem }) {
    return (
        <>
            {item.price !== null ? (
                <span className="font-bold text-slate-900">
                    {item.pricePrefix && <span className="mr-1 font-medium text-slate-500">{item.pricePrefix}</span>}
                    {formatWon(item.price)}
                </span>
            ) : (
                <span className="font-bold text-zi-primary">{item.priceNote}</span>
            )}
            {item.price !== null && item.priceNote && <span className="block text-[13px] text-slate-500">{item.priceNote}</span>}
            {item.bundleNote && <span className="block text-[13px] text-zi-blue">{item.bundleNote}</span>}
        </>
    );
}

function CtaLink({ item, className }: { item: PricingItem; className?: string }) {
    if (!item.cta) return null;
    return (
        <a
            href="#inquiry"
            data-zi-product={item.id}
            className={`inline-flex min-h-10 items-center justify-center gap-1 rounded-zi-btn border border-zi-primary px-3 text-[13px] font-semibold text-zi-primary transition-colors hover:bg-zi-primary hover:text-white ${className ?? ''}`}
        >
            {item.cta}
        </a>
    );
}

export default function ServicesPage() {
    const promo = isPromoActive();
    const hasPromo = promo && pricing.items.some((i) => i.promoPrice);

    // JSON-LD: 기존 구조(WebPage·ItemList(Service)·BreadcrumbList) 그대로. Offer 반영은 승인 후
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
                ...(services.length > 0 ? { mainEntity: { '@id': `${PAGE_URL}#services` } } : {}),
            },
            ...(services.length > 0
                ? [
                      {
                          '@type': 'ItemList',
                          '@id': `${PAGE_URL}#services`,
                          itemListElement: services.map((item, i) => ({
                              '@type': 'ListItem',
                              position: i + 1,
                              item: {
                                  '@type': 'Service',
                                  name: item.name,
                                  description: item.deliverables.join(', '),
                                  provider: { '@id': SITE_ORGANIZATION_ID },
                              },
                          })),
                      },
                  ]
                : []),
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

            {/* 첫 화면: 슬로건 + 한 줄 설명 */}
            <section className="mx-auto max-w-zi-container px-4 sm:px-6 pt-10 pb-8 sm:pt-20 sm:pb-12 text-center">
                <h1 className="mx-auto mb-4 max-w-4xl font-h1 text-[24px] sm:text-[32px] lg:text-[40px] leading-tight text-zi-primary break-keep">{title}</h1>
                <p className="mb-3 text-[18px] sm:text-[22px] font-bold text-slate-900 break-keep">{identity.slogan}</p>
                <p className="mx-auto max-w-2xl text-body-md text-zi-on-surface-variant break-keep">{identity.heroDescription}</p>
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
                        이용 문의하기
                    </a>
                </div>
            </section>

            {/* 상품 표 */}
            <section aria-labelledby="pricing-title" className="mx-auto max-w-zi-container px-4 sm:px-6 pb-12 sm:pb-16">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <h2 id="pricing-title" className="text-[20px] sm:text-[24px] font-bold text-zi-primary">
                        상품과 가격
                    </h2>
                    <p className="text-[13px] text-slate-500">
                        {pricing.vatNote}
                        {hasPromo && <> · {pricing.promo.label}: {pricing.promo.note}</>}
                    </p>
                </div>

                {/* 넓은 화면: 표 */}
                <div className="hidden overflow-hidden rounded-zi-card border border-zi-divider bg-white md:block">
                    <table className="w-full text-left text-[14px]">
                        <caption className="sr-only">{brand.name} 상품과 가격 (VAT 별도)</caption>
                        <thead className="bg-slate-50 text-[13px] text-slate-500">
                            <tr>
                                <th scope="col" className="px-5 py-3 font-semibold">상품</th>
                                <th scope="col" className="px-5 py-3 font-semibold">내용</th>
                                <th scope="col" className="px-5 py-3 font-semibold whitespace-nowrap">가격 (VAT 별도)</th>
                                {hasPromo && (
                                    <th scope="col" className="px-5 py-3 font-semibold whitespace-nowrap text-rose-600">
                                        {pricing.promo.label}
                                    </th>
                                )}
                                <th scope="col" className="px-5 py-3"><span className="sr-only">신청</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zi-divider">
                            {pricing.items.map((item) => (
                                <tr key={item.id} className="align-top">
                                    <th scope="row" className="px-5 py-4 font-bold text-slate-900 break-keep">{item.name}</th>
                                    <td className="px-5 py-4 text-zi-on-surface-variant break-keep">{item.summary}</td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <PriceCell item={item} />
                                    </td>
                                    {hasPromo && (
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            {item.promoPrice ? <span className="font-bold text-rose-600">{formatWon(item.promoPrice)}</span> : <span className="text-slate-300">—</span>}
                                        </td>
                                    )}
                                    <td className="px-5 py-4 text-right">
                                        <CtaLink item={item} className="whitespace-nowrap" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 좁은 화면: 카드 목록 (같은 내용) */}
                <ul className="flex flex-col gap-3 md:hidden" aria-label="상품 목록">
                    {pricing.items.map((item) => (
                        <li key={item.id} className="rounded-zi-card border border-zi-divider bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-[16px] font-bold text-slate-900 break-keep">{item.name}</h3>
                                <div className="shrink-0 text-right text-[15px]">
                                    {hasPromo && item.promoPrice && item.price !== null ? (
                                        <>
                                            <span className="block text-[13px] text-slate-400 line-through">{formatWon(item.price)}</span>
                                            <span className="block font-bold text-rose-600">{formatWon(item.promoPrice)}</span>
                                        </>
                                    ) : (
                                        <PriceCell item={item} />
                                    )}
                                </div>
                            </div>
                            <p className="mt-1.5 text-[14px] text-zi-on-surface-variant break-keep">{item.summary}</p>
                            {hasPromo && item.promoPrice && (
                                <p className="mt-2 inline-block rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-semibold text-rose-600">
                                    {pricing.promo.label} · {pricing.promo.note}
                                </p>
                            )}
                            {item.cta && (
                                <div className="mt-3">
                                    <CtaLink item={item} className="w-full" />
                                </div>
                            )}
                        </li>
                    ))}
                </ul>

                <p className="mt-4 text-[13px] text-slate-500 break-keep">{pricing.disclaimer}</p>
            </section>

            {/* 결제 안내 */}
            <section aria-labelledby="payment-title" className="mx-auto max-w-zi-container px-4 sm:px-6 pb-12 sm:pb-16">
                <h2 id="payment-title" className="mb-4 text-[20px] sm:text-[24px] font-bold text-zi-primary">
                    진행·결제 안내
                </h2>
                <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    {pricing.paymentSteps.map((step, i) => (
                        <li key={step} className="flex items-center gap-2.5 rounded-zi-card border border-zi-divider bg-white px-4 py-3.5 text-[14px] font-semibold text-slate-800 break-keep">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zi-primary text-[12px] font-bold text-white">{i + 1}</span>
                            {step}
                        </li>
                    ))}
                </ol>
                <p className="mt-3 text-[13px] text-slate-500">{pricing.paymentNote}</p>
            </section>

            {/* 이용 문의 폼 */}
            <section id="inquiry" aria-labelledby="inquiry-title" className="scroll-mt-24 mx-auto max-w-zi-container px-4 sm:px-6 pb-12 sm:pb-20">
                <h2 id="inquiry-title" className="mb-2 text-[20px] sm:text-[24px] font-bold text-zi-primary">
                    {brand.name} 이용 문의
                </h2>
                <p className="mb-5 text-[14px] text-zi-on-surface-variant break-keep">
                    남겨 주시면 견적과 진행 방법을 안내해 드립니다. 이 문의는 {brand.name}(운영사 {company.name})로 접수됩니다.
                </p>
                <InquiryForm products={inquiryProductOptions()} retentionNote={pricing.retentionNote} contactEmail={company.email} />
            </section>

            {/* 교차 링크: 진독 홈페이지·콘텐츠 마케팅 (주소가 비면 숨김) */}
            {crossLink.href && (
                <section className="border-t border-zi-divider bg-white">
                    <div className="mx-auto flex max-w-zi-container flex-col items-start justify-between gap-3 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
                        <p className="text-[16px] font-bold text-slate-900 break-keep">{crossLink.label}</p>
                        <a
                            href={crossLink.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-zi-blue hover:underline"
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
