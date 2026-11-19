import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { isExternalHref, isPagePublished, siteConfig } from '@/config/site';
import { buildBreadcrumbId, buildSocialMetadata, buildWebPageId, serializeJsonLd, SITE_BASE_URL, SITE_ORGANIZATION_ID, SITE_WEBSITE_ID } from '@/lib/site';
import { cn } from '@/lib/utils';

// 서비스 메뉴판 (초안). 메뉴·가격은 src/config/site.ts services, 공개 여부는 pages.services.published
const PATH = '/services';
const PAGE_URL = `${SITE_BASE_URL}${PATH}`;
const { brand, contact, services } = siteConfig;
const published = isPagePublished('services');

const title = '서비스';
const description = `${brand.name}의 기업 홍보 서비스: 기사·프로필·${siteConfig.card.displayName}로 검색·AI 답변 노출부터 고객 문의 연결까지.`;

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: PAGE_URL },
    robots: published ? { index: true, follow: true } : { index: false, follow: false },
    ...buildSocialMetadata({ title, description, path: PATH }),
};

export default function ServicesPage() {
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

    const contactExternal = isExternalHref(contact.href);

    return (
        <div className="bg-zi-surface">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

            <section className="mx-auto max-w-zi-container px-4 sm:px-6 pt-10 pb-8 sm:pt-20 sm:pb-12 text-center">
                <h1 className="font-h1 text-[26px] sm:text-[34px] lg:text-h1 leading-tight text-zi-primary mb-4 break-keep">
                    {brand.name} 서비스
                </h1>
                <p className="mx-auto max-w-2xl text-body-md text-zi-on-surface-variant break-keep">
                    고객이 기업을 찾고, 믿고, 연락하기까지 필요한 것을 단계별로 제공합니다.
                </p>
            </section>

            <section aria-label="서비스 목록" className="mx-auto max-w-zi-container px-4 sm:px-6 pb-12 sm:pb-20">
                {services.length === 0 ? (
                    <p className="rounded-zi-card border border-zi-divider bg-white p-8 text-center text-zi-on-surface-variant">
                        서비스 안내를 준비하고 있습니다.
                    </p>
                ) : (
                    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((item) => {
                            const ready = item.status === '지금 가능';
                            return (
                                <li key={item.name} className="flex flex-col rounded-zi-card border border-zi-divider bg-white p-5 sm:p-6">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-zi-blue/10 px-2.5 py-0.5 text-[12px] font-semibold text-zi-blue">
                                            {item.funnelStage} 단계
                                        </span>
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-[12px] font-semibold',
                                                ready ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            )}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                    <h2 className="mb-3 text-[18px] font-bold text-slate-900 break-keep">{item.name}</h2>
                                    <p className="mb-2 text-[12px] font-semibold text-slate-400">받는 것</p>
                                    <ul className="mb-5 flex flex-col gap-1.5">
                                        {item.deliverables.map((d) => (
                                            <li key={d} className="flex items-start gap-2 text-[14px] text-zi-on-surface-variant break-keep">
                                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-zi-primary" aria-hidden="true" />
                                                {d}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-auto border-t border-zi-divider pt-4 text-[15px] font-bold text-zi-primary">{item.price}</p>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <div className="mt-10 text-center">
                    <Link
                        href={contact.href}
                        {...(contactExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="inline-flex items-center justify-center rounded-zi-btn bg-zi-primary px-8 py-3.5 text-ui-label font-ui-label text-white transition-all hover:bg-zi-primary/90 active:scale-95"
                    >
                        상담 {contact.label}하기
                    </Link>
                </div>
            </section>
        </div>
    );
}
