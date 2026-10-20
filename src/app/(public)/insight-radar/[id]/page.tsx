import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Target, Tag } from 'lucide-react';
import { getRadarCompanyDetail } from '@/actions/insight-radar-actions';
import { OrganizationTracker } from '@/components/public/analytics/ArticleTracker';
import { CollapsibleBusinessSummary } from '@/components/public/insight-radar/CollapsibleBusinessSummary';
import { CollapsibleReferences } from '@/components/public/insight-radar/CollapsibleReferences';
import { CollapsibleTagGroup } from '@/components/public/insight-radar/CollapsibleTagGroup';
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

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            {/* GA4 조직 프로필 뷰 및 아웃바운드 링크 트래커 */}
            <OrganizationTracker
                orgId={company.id}
                slug={company.slug || String(company.id)}
                region={company.region?.name ?? null}
            />
            {/* JSON-LD 삽입 (HTML 파싱 충돌 방지를 위해 < 문자를 \u003c 로 이스케이프) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
            />
            <div className="mx-auto max-w-zi-container px-4 sm:px-6 py-6 sm:py-12">
                {/* ── 뒤로가기 ── */}
                <Link
                    href="/insight-radar"
                    className="mb-6 sm:mb-8 inline-flex items-center gap-2 text-zi-label font-semibold text-zi-on-surface-variant transition-colors hover:text-zi-primary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    인사이트 레이더로 돌아가기
                </Link>

                {/* ─────────────────────────────── */}
                {/* 1. Header & Profile Section     */}
                {/* ─────────────────────────────── */}
                <section className="mb-10 sm:mb-12">
                    {/* 1. Header Section */}
                    <div className="border-b border-slate-200 pb-8 sm:pb-10 mb-6 sm:mb-8">
                        <div className="mb-4 sm:mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
                                <h1 className="flex-1 min-w-0 text-2xl sm:text-4xl lg:text-5xl font-bold text-[#001736] font-serif tracking-tight">
                                    {company.company_name}
                                </h1>
                                {backlinksList.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-0 sm:pt-1">
                                        {backlinksList.map((link, idx) => (
                                            <a 
                                                key={idx}
                                                href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-zi-blue hover:bg-zi-blue hover:text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm group"
                                            >
                                                <span>{link.title || '바로가기'}</span>
                                                <ExternalLink size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-3">
                                {/* 지자체/지역 태그 */}
                                <div className="flex flex-wrap gap-2">
                                    {company.region && (
                                        <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-zi-secondary bg-teal-50 border border-teal-100 rounded-lg">
                                            <Tag size={13} /> {company.region.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <CollapsibleBusinessSummary
                            text={company.business_summary}
                            fallback="등록된 비즈니스 요약이 없습니다."
                            className="text-[16px] text-slate-600 max-w-4xl font-normal leading-relaxed"
                            bulletColor="text-zi-secondary"
                            paragraphSpacing="space-y-2.5"
                        />
                    </div>

                    {/* 2. Metadata Insight Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 py-5 sm:py-7 px-5 sm:px-8 bg-zi-blue rounded-xl border border-blue-400/20 mb-8 sm:mb-10 shadow-sm">
                        <div className="flex flex-col gap-1 sm:gap-1.5">
                            <span className="text-xs sm:text-sm text-blue-100 font-medium">대표자</span>
                            <span className="text-sm sm:text-base text-white font-semibold">{company.ceo_name || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1 sm:gap-1.5 md:border-l border-white/20 md:pl-8">
                            <span className="text-xs sm:text-sm text-blue-100 font-medium">설립연도</span>
                            <span className="text-sm sm:text-base text-white font-semibold">{company.founded_year || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1 sm:gap-1.5 md:border-l border-white/20 md:pl-8">
                            <span className="text-xs sm:text-sm text-blue-100 font-medium">소재지</span>
                            <span className="text-sm sm:text-base text-white font-semibold line-clamp-2 md:line-clamp-1 break-keep" title={company.hq_location || '-'}>{company.hq_location || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1 sm:gap-1.5 md:border-l border-white/20 md:pl-8">
                            <span className="text-xs sm:text-sm text-blue-100 font-medium">조직유형</span>
                            <span className="text-sm sm:text-base text-white font-semibold">{company.entity_type || 'Enterprise'}</span>
                        </div>
                    </div>

                    {/* 3. Key References Section */}
                    {Array.isArray(company.key_references) && company.key_references.length > 0 && (
                        <CollapsibleReferences references={company.key_references as string[]} />
                    )}
                </section>

                {/* ─────────────────────────────── */}
                {/* 2. 전략적 포지셔닝               */}
                {/* ─────────────────────────────── */}
                <section className="mb-10 sm:mb-12">
                    <div className="mb-4 sm:mb-6 flex items-center gap-2">
                        <Target className="h-5 w-5 sm:h-6 sm:w-6 text-zi-blue" />
                        <h2 className="text-xl sm:text-2xl font-bold text-zi-primary font-serif tracking-tight">
                            {company.company_name} 전략적 포지셔닝 및 핵심 역량
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">
                        {/* Products */}
                        <CollapsibleTagGroup
                            title="핵심 제품 및 서비스"
                            items={coreKw?.products}
                            badgeStyle={{
                                bg: 'bg-blue-50',
                                text: 'text-blue-700',
                                border: 'border-blue-100',
                            }}
                        />

                        {/* Technology */}
                        <CollapsibleTagGroup
                            title="핵심 기술 (Tech)"
                            items={coreKw?.technology}
                            badgeStyle={{
                                bg: 'bg-indigo-50',
                                text: 'text-indigo-700',
                                border: 'border-indigo-100',
                            }}
                        />

                        {/* Target Market */}
                        <CollapsibleTagGroup
                            title="타겟 시장 (Market)"
                            items={coreKw?.target_market}
                            badgeStyle={{
                                bg: 'bg-emerald-50',
                                text: 'text-emerald-700',
                                border: 'border-emerald-100',
                            }}
                        />
                    </div>
                </section>

                {/* ─────────────────────────────── */}
                {/* 3. Activity Timeline            */}
                {/* ─────────────────────────────── */}
                <section>
                    <div className="mb-6 sm:mb-8 flex items-center justify-between border-b border-zi-divider pb-3 sm:pb-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-zi-primary font-serif tracking-tight flex items-center gap-2">
                            <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                            {company.company_name} 주요 활동 및 관련 기사 타임라인
                        </h2>
                        <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-slate-100 text-slate-600 rounded-full text-xs sm:text-sm font-semibold">
                            총 {company.articleCount.toLocaleString()}건 중 주요 {company.recentArticles.length}건
                        </span>
                    </div>

                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-4 sm:before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        {company.recentArticles.length > 0 ? (
                            company.recentArticles.map((article: typeof company.recentArticles[number]) => (
                                <TimelineItem
                                    key={article.id}
                                    date={article.pub_date
                                        ? new Date(article.pub_date).toLocaleDateString('ko-KR', {
                                              year: 'numeric',
                                              month: '2-digit',
                                              day: '2-digit',
                                          })
                                        : '날짜 없음'
                                    }
                                    category={article.source ?? 'News'}
                                    title={article.title}
                                    summary={article.summary?.slice(0, 150) ?? ''}
                                    url={article.url ?? undefined}
                                />
                            ))
                        ) : (
                            <div className="relative py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                수집된 기사가 없습니다. 뉴스 수집 후 다시 확인해 주세요.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 내부 컴포넌트
// ─────────────────────────────────────────────

function TimelineItem({
    date,
    category,
    title,
    summary,
    url,
}: {
    date: string;
    category: string;
    title: string;
    summary: string;
    url?: string;
}) {
    const isMagazine = category === 'ZINSIGHT_MAGAZINE';
    return (
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3 sm:py-4">
            {/* 도트 마커 */}
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-3 sm:border-4 border-white text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${isMagazine ? 'bg-amber-500' : 'bg-zi-blue'}`}>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
            </div>
            
            {/* 컨텐츠 카드 */}
            <div className={`w-[calc(100%-2.75rem)] sm:w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 sm:p-6 rounded-xl border shadow-sm transition-all hover:shadow-md ${isMagazine ? 'border-amber-200 bg-amber-50/5' : 'border-zi-divider'}`}>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    {isMagazine ? (
                        <span className="text-[11px] sm:text-xs font-extrabold uppercase text-amber-700 bg-amber-100/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded border border-amber-200 flex items-center gap-1">
                            <span aria-hidden="true">✦</span> 진사이트 PARTNER
                        </span>
                    ) : (
                        <span className="text-[11px] sm:text-xs font-bold uppercase text-zi-blue bg-blue-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded">{category}</span>
                    )}
                    <time className="text-[11px] sm:text-xs font-semibold text-slate-400">{date}</time>
                </div>
                <h3 className="mb-2 sm:mb-3 text-sm sm:text-base font-bold text-zi-primary leading-snug">{title}</h3>
                {summary && (
                    <p className="line-clamp-2 text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4 leading-relaxed">{summary}</p>
                )}
                {url && (
                    isMagazine ? (
                        <Link
                            href={url}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            매거진 기사 보기
                            <ExternalLink className="h-3 w-3 text-indigo-500" />
                        </Link>
                    ) : (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-zi-primary hover:text-zi-blue transition-colors"
                        >
                            원문 보기
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    )
                )}
            </div>
        </div>
    );
}
