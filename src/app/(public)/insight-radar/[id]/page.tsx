import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    AtSign,
    BookOpen,
    Download,
    ExternalLink,
    Facebook,
    Globe,
    Instagram,
    Linkedin,
    MessageSquare,
    Twitter,
    Youtube,
    type LucideIcon,
} from 'lucide-react';
import { getRadarCompanyDetail, getRadarSimilarCompanies } from '@/actions/insight-radar-actions';
import { OrganizationTracker } from '@/components/public/analytics/ArticleTracker';
import { CollapsibleTagGroup } from '@/components/public/insight-radar/CollapsibleTagGroup';
import { ProfileOverview } from '@/components/public/insight-radar/profile/ProfileOverview';
import { ProfileSectionNav } from '@/components/public/insight-radar/profile/ProfileSectionNav';
import { ProfileTimelineList } from '@/components/public/insight-radar/profile/ProfileTimelineList';
import { ProfileVideo } from '@/components/public/insight-radar/profile/ProfileVideo';
import { sanitizeHref, safeHttpUrl } from '@/lib/utils';
import {
    buildRadarTimeline,
    formatCompanyAge,
    formatFoundedDate,
    formatRadarDate,
    getOrgInitial,
    type RadarTimelineArticle,
} from '@/lib/radar';
import {
    SITE_BASE_URL,
    buildWebPageId,
    buildOrganizationId,
    buildBreadcrumbId,
    toAbsoluteUrl,
    serializeJsonLd,
    parsePostalAddress,
    parseCleanStringArray,
    extractFirstParagraph,
} from '@/lib/site';

export const revalidate = 3600; // 1시간마다 ISR 재생성 (크롤러 응답 속도 및 캐시 효율 극대화)
export const dynamicParams = true;

interface PageProps {
    params: Promise<{ id: string }>;
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const company = await getRadarCompanyDetail(id);
    if (!company) return { title: '조직을 찾을 수 없습니다' };

    const url = `${SITE_BASE_URL}/insight-radar/${company.slug || company.id}`;
    
    const aliases = parseAliases(company.aliases);
    const aliasesText = aliases.length > 0 ? ` (${aliases.slice(0, 2).join(', ')})` : '';
    const coreKw = parseKeywords(company.core_keywords);
    
    const keyFeature = coreKw?.technology?.[0] || coreKw?.products?.[0] || '';
    const regionName = company.region?.name ? `${company.region.name} ` : '';

    // 검색 최적화(SEO) 맞춤 타이틀 생성 (회사명 + 별칭 + 지역 + 핵심키워드)
    const title = `${company.company_name}${aliasesText} - ${regionName}${keyFeature ? keyFeature + ' ' : ''}기업 분석 프로필`;
    // <title>에는 루트 template이 '| 진사이트'를 붙이므로, template이 적용되지 않는 OG/트위터에만 직접 붙임
    const socialTitle = `${title} | 진사이트`;

    let description = company.business_summary;
    if (!description) {
        const products = coreKw?.products?.slice(0, 3).join(', ') || '';
        const tech = coreKw?.technology?.slice(0, 3).join(', ') || '';
        description = `${regionName ? regionName + '소재 ' : ''}${company.company_name}의 ${products ? products + ' 및 ' : ''}${tech ? tech + ' ' : ''}비즈니스 전문 프로필과 시장 인사이트를 확인하세요.`;
    } else if (description.length > 150) {
        description = description.slice(0, 150) + '...';
    }

    const tags = [
        company.company_name,
        ...aliases,
        company.region?.name,
        ...(coreKw?.technology || []),
        ...(coreKw?.products || []),
        ...(coreKw?.target_market || []),
        '기업 분석',
        '인사이트 레이더',
        '진사이트'
    ].filter(Boolean) as string[];

    return {
        title,
        description,
        keywords: tags,
        alternates: { canonical: url },
        openGraph: {
            title: socialTitle,
            description,
            type: 'profile',
            url,
            siteName: '진사이트',
            images: [{ url: `${SITE_BASE_URL}/img/zinsight_icon.png`, width: 1200, height: 630, alt: company.company_name }]
        },
        twitter: {
            card: 'summary_large_image',
            title: socialTitle,
            description,
            images: [`${SITE_BASE_URL}/img/zinsight_icon.png`]
        }
    };
}

/**
 * 기업의 핵심 키워드를 파싱하는 헬퍼 함수
 */
function parseKeywords(keywordsStr: any) {
    if (!keywordsStr) return null;
    try {
        if (typeof keywordsStr === 'string') {
            return JSON.parse(keywordsStr);
        }
        return keywordsStr as { products?: string[]; technology?: string[]; target_market?: string[] };
    } catch {
        return null;
    }
}

/**
 * 기업 별칭(aliases)을 안전하게 파싱하는 헬퍼 함수
 */
function parseAliases(aliases: any): string[] {
    if (!aliases) return [];
    if (Array.isArray(aliases)) return aliases.map(String).filter(Boolean);
    if (typeof aliases === 'string') {
        try {
            const parsed = JSON.parse(aliases);
            if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
            return aliases.split(',').map((s: string) => s.trim()).filter(Boolean);
        } catch {
            return aliases.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
    }
    return [];
}

export default async function InsightRadarDetailPage({ params }: PageProps) {
    const { id } = await params;
    const company = await getRadarCompanyDetail(id);

    if (!company) notFound();

    // slug가 존재하고, 현재 URL 파라미터(id)가 slug와 다른 경우 (숫자 ID 등으로 접근 시) 301 영구 리다이렉트
    if (company.slug && id !== company.slug) {
        permanentRedirect(`/insight-radar/${company.slug}`);
    }

    const similarCompanies = await getRadarSimilarCompanies(company.id, 3);
    const aliases = parseAliases(company.aliases);
    const coreKw = parseKeywords(company.core_keywords);
    const pageSlug = company.slug || String(company.id);
    const url = `${SITE_BASE_URL}/insight-radar/${pageSlug}`;

    // 백링크 파싱 및 A2: sameAs (에디터 백링크 2·3번 추출)
    const rawBacklinks = company.backlinks;
    let parsedBacklinks: Array<{ title: string; url: string }> = [];
    if (Array.isArray(rawBacklinks) && rawBacklinks.length > 0) {
        parsedBacklinks = rawBacklinks;
    } else if (typeof rawBacklinks === 'string') {
        try {
            const parsed = JSON.parse(rawBacklinks);
            if (Array.isArray(parsed)) {
                parsedBacklinks = parsed;
            }
        } catch {}
    }

    // 화면 우측 상단 바로가기 버튼용 리스트 (최대 3개)
    let backlinksList: Array<{ title: string; url: string }> = parsedBacklinks
        .slice(0, 3)
        .map((item: any) => ({
            title: item.title || '바로가기',
            url: item.url || '',
        }))
        .filter((item) => item.url.trim() !== '');

    if (backlinksList.length === 0 && company.company_url) {
        backlinksList = [{ title: '홈페이지 바로가기', url: company.company_url }];
    }

    // sameAs: 공식 웹사이트 및 백링크 URL 통합 (중복 제거)
    const sameAsUrls: string[] = [];
    if (company.company_url && (company.company_url.startsWith('http://') || company.company_url.startsWith('https://'))) {
        sameAsUrls.push(company.company_url);
    }
    for (const item of parsedBacklinks) {
        const rawUrl = typeof item?.url === 'string' ? item.url.trim() : '';
        if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
            if (!sameAsUrls.includes(rawUrl)) {
                sameAsUrls.push(rawUrl);
            }
        }
    }

    // A3: description
    const orgDescription = company.business_summary || extractFirstParagraph(company.business_summary);

    // A4: address 분리
    const address = parsePostalAddress(company.hq_location, company.region?.name);

    // A5: knowsAbout - 정제된 기술 키워드 배열
    const knowsAbout = parseCleanStringArray(coreKw?.technology);

    // A6: makesOffer - 제품/서비스별 Offer 배열
    const productNames = parseCleanStringArray(coreKw?.products);
    const makesOffer = productNames.map((name) => ({
        '@type': 'Offer',
        'itemOffered': {
            '@type': 'Service',
            'name': name,
        },
    }));

    // A7: seeks - 타겟 시장 배열
    const seeks = parseCleanStringArray(coreKw?.target_market);

    // A8: subjectOf - 연결된 관련 기사
    const subjectOf = company.recentArticles
        ?.map((article: any) => ({
            '@type': 'Article',
            'headline': article.title,
            'url': toAbsoluteUrl(article.url),
        }))
        .filter((a: any) => a.headline && a.url);

    // A9: logo - 로고 필드
    const rawLogo = (company as any).logo_url || (company as any).company_logo;
    const logoUrl = typeof rawLogo === 'string' && rawLogo.trim() ? toAbsoluteUrl(rawLogo) : undefined;

    // JSON-LD 구조화 데이터 생성 (@graph: ProfilePage, BreadcrumbList, Organization)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'ProfilePage',
                '@id': buildWebPageId(url),
                'url': url,
                'name': `${company.company_name} 기업 분석 프로필`,
                'description': orgDescription || `${company.company_name}의 비즈니스 프로필 및 기술 분석`,
                'isPartOf': {
                    '@type': 'WebSite',
                    '@id': `${SITE_BASE_URL}/#website`,
                    'name': '진사이트',
                    'url': SITE_BASE_URL,
                },
                'breadcrumb': {
                    '@id': buildBreadcrumbId(url),
                },
                'mainEntity': {
                    '@id': buildOrganizationId(url),
                },
            },
            {
                '@type': 'BreadcrumbList',
                '@id': buildBreadcrumbId(url),
                'itemListElement': [
                    { '@type': 'ListItem', 'position': 1, 'name': '홈', 'item': SITE_BASE_URL },
                    { '@type': 'ListItem', 'position': 2, 'name': '인사이트 레이더', 'item': `${SITE_BASE_URL}/insight-radar` },
                    { '@type': 'ListItem', 'position': 3, 'name': company.region?.name || '지역', 'item': `${SITE_BASE_URL}/insight-radar?region=${company.region?.id}` },
                    { '@type': 'ListItem', 'position': 4, 'name': company.company_name, 'item': url },
                ],
            },
            {
                '@type': company.entity_type === '대학/교육기관' ? 'EducationalOrganization' : 'Organization',
                '@id': buildOrganizationId(url),
                'name': company.company_name,
                ...(aliases.length > 0 ? { 'alternateName': aliases } : {}),
                ...(orgDescription ? { 'description': orgDescription } : {}),
                'url': company.company_url || url,
                ...(sameAsUrls.length > 0 ? { 'sameAs': sameAsUrls } : {}),
                ...(logoUrl ? { 'logo': logoUrl } : {}),
                ...(company.founded_year ? { 'foundingDate': company.founded_year } : {}),
                ...(company.ceo_name ? { 'founder': { '@type': 'Person', 'name': company.ceo_name } } : {}),
                ...(address ? { 'address': address } : {}),
                ...(company.region ? {
                    'location': {
                        '@type': 'Place',
                        'name': company.region.name,
                    },
                } : {}),
                ...(knowsAbout.length > 0 ? { 'knowsAbout': knowsAbout } : {}),
                ...(makesOffer.length > 0 ? { 'makesOffer': makesOffer } : {}),
                ...(seeks.length > 0 ? { 'seeks': seeks } : {}),
                ...(subjectOf && subjectOf.length > 0 ? { 'subjectOf': subjectOf } : {}),
            },
        ],
    };

    // ── 화면 표시용 데이터 (값이 없는 항목은 행·버튼 자체를 숨김) ──
    const foundedLabel = formatFoundedDate(company.founded_year);
    const companyAge = formatCompanyAge(company.founded_year);
    const latestActivity = formatRadarDate(company.latestArticleDate);
    // 모바일 정보 표 (유형은 헤더 뱃지와 중복이라 제외). 데스크톱은 우측 레일 "핵심 정보"로 통합
    const infoRows = [
        { label: '대표자', value: company.ceo_name },
        { label: '설립', value: foundedLabel },
        { label: '소재지', value: company.hq_location },
    ].filter((row): row is { label: string; value: string } => !!row.value && !!String(row.value).trim());
    const railRows = [
        { label: '유형 · 지역', value: [company.entity_type, company.region?.name].filter(Boolean).join(' · ') },
        { label: '대표자', value: company.ceo_name },
        { label: '설립 · 업력', value: [foundedLabel, companyAge].filter(Boolean).join(' · ') },
        { label: '소재지', value: company.hq_location },
        { label: '연관 기사', value: `${company.articleCount.toLocaleString()}건` },
        { label: '최근 활동', value: latestActivity },
    ].filter((row): row is { label: string; value: string } => !!row.value && !!String(row.value).trim());

    // 문의 연결처: 문의 URL → 이메일 → 전화 중 조직이 공개한 첫 번째 (모두 없으면 버튼 숨김)
    const inquiryHref =
        (company.inquiry_url ? sanitizeHref(company.inquiry_url) : null) ||
        (company.contact_email ? `mailto:${company.contact_email}` : null) ||
        (company.contact_phone ? `tel:${company.contact_phone.replace(/[^0-9+]/g, '')}` : null);
    const inquiryIsWeb = !!inquiryHref && /^https?:/i.test(inquiryHref);
    const brochureHref = safeHttpUrl(company.brochure_url);
    const homepageHref = safeHttpUrl(company.company_url) ??
        (company.company_url ? safeHttpUrl(`https://${company.company_url}`) : undefined);
    const externalLinks = backlinksList
        .map((link) => ({
            title: link.title,
            url: safeHttpUrl(link.url.startsWith('http') ? link.url : `https://${link.url}`),
        }))
        .filter((link): link is { title: string; url: string } => !!link.url);
    // 모바일 아이콘 줄: 홈페이지는 CTA 버튼과 중복이라 제외
    const normalizeUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '').toLowerCase();
    const iconLinks = externalLinks.filter((link) => !homepageHref || normalizeUrl(link.url) !== normalizeUrl(homepageHref));

    const references = Array.isArray(company.key_references)
        ? (company.key_references as unknown[]).map(String).filter((r) => r.trim())
        : [];
    const hasProducts = !!(coreKw?.products?.length || coreKw?.technology?.length || coreKw?.target_market?.length);
    const hasVideo = !!safeHttpUrl(company.video_url);

    const timelineArticles: RadarTimelineArticle[] = company.recentArticles.map(
        (article: (typeof company.recentArticles)[number]) => ({
            key: `${article.isMagazine ? 'm' : 'a'}-${article.id}`,
            title: article.title,
            summary: article.summary ?? '',
            url: article.url ?? undefined,
            isMagazine: !!article.isMagazine,
            category: article.isMagazine ? '진사이트 매거진' : formatSourceLabel(article.source),
            thumbnailUrl: article.thumbnailUrl ?? null,
            pubDate: article.pub_date,
        })
    );
    const { items: timeline } = buildRadarTimeline(references, timelineArticles, [company.company_name, ...aliases]);

    const navSections = [
        { id: 'overview', label: '개요' },
        ...(hasProducts ? [{ id: 'products', label: '제품·서비스' }] : []),
        { id: 'activity', label: '주요 활동' },
    ];

    const inquiryButton = (placement: string, className: string) =>
        inquiryHref ? (
            <a
                href={inquiryHref}
                {...(inquiryIsWeb ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                data-ga-event="cta_inquiry_click"
                data-ga-placement={placement}
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-zi-blue px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 ${className}`}
            >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                문의하기
            </a>
        ) : null;

    const homepageButton = (label: string, className: string) =>
        homepageHref ? (
            <a
                href={homepageHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-zi-primary transition-colors hover:border-zi-blue hover:text-zi-blue ${className}`}
            >
                {label}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
        ) : null;

    const brochureLinkProps = (placement: string) => ({
        href: brochureHref,
        target: '_blank',
        rel: 'noopener noreferrer',
        'data-ga-event': 'cta_download_click',
        'data-ga-placement': placement,
    });

    const sectionHeading = 'mb-3 text-lg sm:text-xl font-bold text-zi-primary font-serif tracking-tight break-keep';

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            {/* GA4 조직 프로필 뷰 및 아웃바운드 링크 트래커 */}
            <OrganizationTracker
                orgId={company.id}
                slug={company.slug || String(company.id)}
                region={company.region?.name ?? null}
            />
            {/* JSON-LD 삽입 (HTML 파싱 충돌 방지를 위해 < 문자를 < 로 이스케이프) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
            />
            <div className="mx-auto max-w-zi-container px-4 sm:px-6 py-5 sm:py-8 lg:py-10">
                {/* ── 뒤로가기 ── */}
                <Link
                    href="/insight-radar"
                    className="mb-4 sm:mb-6 inline-flex min-h-11 items-center gap-2 text-zi-label font-semibold text-zi-on-surface-variant transition-colors hover:text-zi-primary"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    인사이트 레이더로 돌아가기
                </Link>

                {/* ── 헤더: 로고/이니셜 + 조직명 + 유형·지역 / 데스크톱 CTA (문의 primary, 홈페이지 secondary) ── */}
                <header className="mb-4 lg:mb-8 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:pb-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {company.logo_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={company.logo_url} alt={`${company.company_name} 로고`} className="max-h-full max-w-full object-contain p-2" />
                            ) : (
                                <span className="text-xl sm:text-2xl font-bold text-zi-primary" aria-hidden="true">
                                    {getOrgInitial(company.company_name)}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-4xl font-bold text-[#001736] font-serif tracking-tight break-keep">
                                {company.company_name}
                            </h1>
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                                {company.entity_type && (
                                    <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold text-zi-secondary">
                                        {company.entity_type}
                                    </span>
                                )}
                                {company.region && <span className="font-medium">{company.region.name}</span>}
                            </p>
                        </div>
                    </div>
                    {(inquiryHref || homepageHref) && (
                        <div className="hidden lg:flex shrink-0 items-center gap-2">
                            {inquiryButton('header', '')}
                            {homepageButton('홈페이지 바로가기', '')}
                        </div>
                    )}
                </header>

                {/* ── 모바일 CTA: [문의하기][홈페이지] 2분할 + 외부 링크·소개자료 아이콘 줄 ── */}
                {(inquiryHref || homepageHref || iconLinks.length > 0 || brochureHref) && (
                    <div className="mb-6 flex flex-col gap-2 lg:hidden">
                        {(inquiryHref || homepageHref) && (
                            <div className="flex gap-2">
                                {inquiryButton('mobile_bar', 'flex-1 min-h-12')}
                                {homepageButton('홈페이지', 'flex-1 min-h-12')}
                            </div>
                        )}
                        {(iconLinks.length > 0 || brochureHref) && (
                            <ul className="flex flex-wrap gap-2" aria-label="외부 링크">
                                {iconLinks.map((link) => {
                                    const Icon = externalLinkIcon(link.url);
                                    return (
                                        <li key={link.url}>
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`${link.title} (새 창)`}
                                                title={link.title}
                                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-zi-blue hover:text-zi-blue"
                                            >
                                                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                                            </a>
                                        </li>
                                    );
                                })}
                                {brochureHref && (
                                    <li>
                                        <a
                                            {...brochureLinkProps('mobile_bar')}
                                            aria-label="소개자료 다운로드 (새 창)"
                                            className="flex h-11 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-zi-blue hover:text-zi-blue"
                                        >
                                            <Download className="h-4 w-4" aria-hidden="true" />
                                            소개자료
                                        </a>
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
                    {/* ─── main: DOM 순서 = 모바일 순서, 데스크톱은 lg:order로만 재배치 (CLS 방지) ─── */}
                    <div className="flex min-w-0 flex-col gap-8 lg:gap-10">
                        {/* 섹션 아웃라인 + 스크롤 스파이 (데스크톱 전용) */}
                        <ProfileSectionNav
                            sections={navSections}
                            className="hidden lg:block lg:order-first sticky top-20 z-20 -mb-4 border-b border-slate-200 bg-zi-surface/95 backdrop-blur"
                        />

                        {/* 소개 영상 (모바일 1순위, 데스크톱 3순위) */}
                        {hasVideo && (
                            <ProfileVideo
                                videoUrl={company.video_url as string}
                                posterUrl={safeHttpUrl(company.video_poster_url) ?? null}
                                orgName={company.company_name}
                                orgId={company.id}
                                slug={pageSlug}
                                className="lg:order-3"
                            />
                        )}

                        {/* 주요 정보 라벨-값 표 (모바일 전용, 데스크톱은 우측 레일 "핵심 정보"에 통합) */}
                        {infoRows.length > 0 && (
                            <section aria-labelledby="info-heading" className="lg:hidden">
                                <h2 id="info-heading" className="sr-only">주요 정보</h2>
                                <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                                    {infoRows.map((row) => (
                                        <div key={row.label} className="flex items-baseline gap-4 py-3">
                                            <dt className="w-14 shrink-0 text-[13px] font-medium text-slate-500">{row.label}</dt>
                                            <dd className="min-w-0 text-[14px] font-semibold text-slate-900 tabular-nums break-keep">{row.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </section>
                        )}

                        {/* 1) 개요 */}
                        <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-36 lg:order-1">
                            <h2 id="overview-heading" className={sectionHeading}>
                                {company.company_name} 개요
                            </h2>
                            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                                {company.business_summary?.trim() ? (
                                    <ProfileOverview text={company.business_summary} />
                                ) : (
                                    <p className="text-slate-400 italic">등록된 비즈니스 요약이 없습니다.</p>
                                )}
                            </div>
                        </section>

                        {/* 2) 제품·서비스 */}
                        {hasProducts && (
                            <section id="products" aria-labelledby="products-heading" className="scroll-mt-36 lg:order-4">
                                <h2 id="products-heading" className={sectionHeading}>
                                    {company.company_name} 제품·서비스
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-start">
                                    <CollapsibleTagGroup
                                        title="핵심 제품 및 서비스"
                                        items={coreKw?.products}
                                        badgeStyle={{ bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' }}
                                    />
                                    <CollapsibleTagGroup
                                        title="핵심 기술 (Tech)"
                                        items={coreKw?.technology}
                                        badgeStyle={{ bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' }}
                                    />
                                    <CollapsibleTagGroup
                                        title="타겟 시장 (Market)"
                                        items={coreKw?.target_market}
                                        badgeStyle={{ bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-100' }}
                                    />
                                </div>
                            </section>
                        )}

                        {/* 3) 주요 활동: 레퍼런스 + 관련 기사 통합 타임라인 */}
                        <section id="activity" aria-labelledby="activity-heading" className="scroll-mt-36 lg:order-5">
                            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                <h2 id="activity-heading" className={sectionHeading.replace('mb-3 ', '')}>
                                    {company.company_name} 주요 활동
                                </h2>
                                {company.articleCount > 0 && (
                                    <span className="text-sm font-semibold text-slate-600 tabular-nums">
                                        관련 기사 {company.articleCount.toLocaleString()}건
                                    </span>
                                )}
                            </div>
                            {timeline.length > 0 ? (
                                <ProfileTimelineList total={timeline.length}>
                                    {timeline.map((item) =>
                                        item.kind === 'article' ? (
                                            <ArticleTimelineRow key={item.key} dateLabel={item.dateLabel} article={item.article} />
                                        ) : (
                                            <li key={item.key} className="flex gap-3 sm:gap-4 px-4 py-3 sm:px-5">
                                                <TimelineDate label={item.dateLabel} />
                                                <p className="min-w-0 flex-1 text-sm sm:text-[15px] leading-relaxed text-slate-800 break-keep">{item.text}</p>
                                            </li>
                                        )
                                    )}
                                </ProfileTimelineList>
                            ) : (
                                <div className="py-8 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                                    등록된 활동과 수집된 기사가 없습니다.
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ─── 우측 레일 (데스크톱 sticky). 모바일에서는 본문 뒤에 유사 조직만 표시 ─── */}
                    <aside aria-label={`${company.company_name} 요약`} className="min-w-0">
                        <div className="flex flex-col gap-5 lg:sticky lg:top-24">
                            <div className="hidden lg:block rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                {(inquiryHref || brochureHref) && (
                                    <div className="mb-5 flex flex-col gap-2">
                                        {inquiryButton('rail', 'w-full')}
                                        {brochureHref && (
                                            <a
                                                {...brochureLinkProps('rail')}
                                                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-zi-primary transition-colors hover:border-zi-blue hover:text-zi-blue"
                                            >
                                                <Download className="h-4 w-4" aria-hidden="true" />
                                                소개자료
                                            </a>
                                        )}
                                    </div>
                                )}
                                <h2 className="mb-3 text-sm font-bold text-zi-primary">핵심 정보</h2>
                                <dl className="space-y-2.5 text-sm">
                                    {railRows.map((row) => (
                                        <div key={row.label} className="flex justify-between gap-3">
                                            <dt className="shrink-0 text-[13px] text-slate-500">{row.label}</dt>
                                            <dd className="min-w-0 text-right font-semibold text-slate-900 tabular-nums break-keep">{row.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {externalLinks.length > 0 && (
                                <div className="hidden lg:block rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h2 className="mb-2 text-sm font-bold text-zi-primary">외부 링크</h2>
                                    <ul>
                                        {externalLinks.map((link) => (
                                            <li key={link.url}>
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex min-h-11 w-full items-center justify-between gap-1.5 text-sm font-semibold text-blue-700 hover:text-zi-blue"
                                                >
                                                    <span>{link.title}</span>
                                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {similarCompanies.length > 0 && (
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h2 className="mb-2 text-sm font-bold text-zi-primary">유사 조직</h2>
                                    <ul className="divide-y divide-slate-100">
                                        {similarCompanies.map((org) => (
                                            <li key={org.id}>
                                                <Link
                                                    href={`/insight-radar/${org.slug || org.id}`}
                                                    className="flex min-h-14 items-center gap-3 py-2.5 group"
                                                >
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-bold text-zi-primary">
                                                        {org.logo_url ? (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img src={org.logo_url} alt="" loading="lazy" className="max-h-full max-w-full object-contain p-1" />
                                                        ) : (
                                                            <span aria-hidden="true">{getOrgInitial(org.company_name)}</span>
                                                        )}
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-zi-blue">
                                                            {org.company_name}
                                                        </span>
                                                        <span className="block truncate text-xs text-slate-500">
                                                            {[org.entity_type, org.regionName, ...org.sharedKeywords].filter(Boolean).join(' · ')}
                                                        </span>
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 내부 컴포넌트
// ─────────────────────────────────────────────

const SOURCE_LABEL: Record<string, string> = {
    NAVER_NEWS: '뉴스',
    News: '뉴스',
};

function formatSourceLabel(source: string | null | undefined): string {
    if (!source) return '뉴스';
    return SOURCE_LABEL[source] ?? source;
}

/** 외부 링크 주소로 아이콘 선택 (모르는 곳은 지구본) */
function externalLinkIcon(url: string): LucideIcon {
    let host = '';
    try {
        host = new URL(url).hostname.replace(/^www\./, '');
    } catch {}
    if (host.includes('instagram.com')) return Instagram;
    if (host.includes('threads.net') || host.includes('threads.com')) return AtSign;
    if (host.includes('youtube.com') || host.includes('youtu.be')) return Youtube;
    if (host.includes('facebook.com')) return Facebook;
    if (host.includes('linkedin.com')) return Linkedin;
    if (host === 'x.com' || host.includes('twitter.com')) return Twitter;
    if (host.includes('blog.') || host.includes('brunch.co.kr') || host.includes('tistory.com')) return BookOpen;
    return Globe;
}

function TimelineDate({ label }: { label: string | null }) {
    return label ? (
        <time className="w-[3.75rem] sm:w-16 shrink-0 pt-px text-xs sm:text-sm font-bold text-slate-500 tabular-nums">{label}</time>
    ) : (
        <span className="w-[3.75rem] sm:w-16 shrink-0 text-sm text-slate-300" aria-label="시기 미기재">—</span>
    );
}

function ArticleTimelineRow({ dateLabel, article }: { dateLabel: string | null; article: RadarTimelineArticle }) {
    const titleClass = 'text-[15px] sm:text-base font-bold leading-snug text-zi-primary hover:text-zi-blue';
    return (
        <li className="flex gap-3 sm:gap-4 p-4 sm:px-5">
            <TimelineDate label={dateLabel} />
            <div className="min-w-0 flex-1">
                <p className={`mb-0.5 text-xs font-semibold ${article.isMagazine ? 'text-amber-800' : 'text-zi-blue'}`}>{article.category}</p>
                <h3>
                    {article.url ? (
                        article.isMagazine ? (
                            <Link href={article.url} className={titleClass}>{article.title}</Link>
                        ) : (
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className={titleClass}>
                                {article.title}
                                <ExternalLink className="ml-1 inline h-3 w-3 align-baseline text-slate-400" aria-label="(새 창)" />
                            </a>
                        )
                    ) : (
                        <span className={titleClass}>{article.title}</span>
                    )}
                </h3>
                {article.summary && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{article.summary}</p>}
            </div>
            {article.thumbnailUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={article.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="h-14 w-16 sm:h-[72px] sm:w-28 shrink-0 rounded-lg border border-slate-100 object-cover"
                />
            )}
        </li>
    );
}
