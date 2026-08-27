import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Building2, MapPin, Calendar, User, Target, Zap, Briefcase, Tag } from 'lucide-react';
import { getRadarCompanyDetail } from '@/actions/insight-radar-actions';

interface PageProps {
    params: Promise<{ id: string }>;
}

// 지자체별 지리 정보 사전 맵핑 (Geotagging 용)
const regionGeoMap: Record<string, { lat: number; lng: number; address: string }> = {
    anyang: { lat: 37.3943, lng: 126.9568, address: 'South Korea, Gyeonggi-do, Anyang-si' },
    seongnam: { lat: 37.4200, lng: 127.1265, address: 'South Korea, Gyeonggi-do, Seongnam-si' },
    busan: { lat: 35.1796, lng: 129.0756, address: 'South Korea, Busan' }
};

// 동적 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const company = await getRadarCompanyDetail(id);
    if (!company) return { title: '조직을 찾을 수 없습니다' };

    const domain = process.env.DOMAIN || 'zinsight.co.kr';
    const baseUrl = `https://${domain}`;
    const url = `${baseUrl}/insight-radar/${company.slug || company.id}`;
    
    let description = company.business_summary;
    const coreKw = parseKeywords(company.core_keywords);
    
    if (!description) {
        const products = coreKw?.products?.join(', ') || '';
        const tech = coreKw?.technology?.join(', ') || '';
        description = `${company.region?.name || '지역'}에 위치한 ${company.company_name}의 ${products ? products + ' 및 ' : ''}${tech ? tech + ' ' : ''}비즈니스 전문 프로필과 마켓 인사이트를 확인하세요.`;
    }

    const title = `${company.company_name} 프로필 - 인사이트 레이더`;
    
    const tags = [
        company.company_name,
        ...(company.aliases ? JSON.parse(JSON.stringify(company.aliases)) : []),
        company.region?.name,
        ...(coreKw?.technology || []),
        ...(coreKw?.target_market || [])
    ].filter(Boolean);

    return {
        title,
        description,
        keywords: tags,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            type: 'profile',
            url,
            siteName: '진사이트',
            locale: 'ko_KR',
            // company_logo가 있다면 images에 추가할 수 있지만 현재 없으므로 기본 로고 사용
            images: [{ url: `${baseUrl}/img/zinsight_icon.png`, width: 1200, height: 630, alt: company.company_name }]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [`${baseUrl}/img/zinsight_icon.png`]
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

export default async function InsightRadarDetailPage({ params }: PageProps) {
    const { id } = await params;
    const company = await getRadarCompanyDetail(id);

    if (!company) notFound();

    // slug가 존재하고, 현재 URL 파라미터(id)가 slug와 다른 경우 (숫자 ID 등으로 접근 시) 301 영구 리다이렉트
    if (company.slug && id !== company.slug) {
        permanentRedirect(`/insight-radar/${company.slug}`);
    }

    const coreKw = parseKeywords(company.core_keywords);
    const domain = process.env.DOMAIN || 'zinsight.co.kr';
    const baseUrl = `https://${domain}`;
    const url = `${baseUrl}/insight-radar/${company.slug || company.id}`;

    // 백링크 리스트 파싱 (최대 3개)
    const rawBacklinks = company.backlinks;
    let backlinksList: Array<{ title: string; url: string }> = [];
    if (Array.isArray(rawBacklinks) && rawBacklinks.length > 0) {
        backlinksList = rawBacklinks.slice(0, 3).map((item: any) => ({
            title: item.title || '바로가기',
            url: item.url || '',
        })).filter(item => item.url.trim() !== '');
    } else if (typeof rawBacklinks === 'string') {
        try {
            const parsed = JSON.parse(rawBacklinks);
            if (Array.isArray(parsed) && parsed.length > 0) {
                backlinksList = parsed.slice(0, 3).map((item: any) => ({
                    title: item.title || '바로가기',
                    url: item.url || '',
                })).filter(item => item.url.trim() !== '');
            }
        } catch {}
    }
    if (backlinksList.length === 0 && company.company_url) {
        backlinksList = [{ title: '홈페이지 바로가기', url: company.company_url }];
    }
    
    const geoData = (company.region && regionGeoMap[company.region.slug]) || { lat: 37.5665, lng: 126.9780, address: 'Seoul, South Korea' };

    // JSON-LD 구조화 데이터 생성
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                '@id': `${url}#breadcrumb`,
                'itemListElement': [
                    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': baseUrl },
                    { '@type': 'ListItem', 'position': 2, 'name': 'Insight Radar', 'item': `${baseUrl}/insight-radar` },
                    { '@type': 'ListItem', 'position': 3, 'name': company.region?.name || 'Region', 'item': `${baseUrl}/insight-radar?region=${company.region?.id}` },
                    { '@type': 'ListItem', 'position': 4, 'name': company.company_name, 'item': url }
                ]
            },
            {
                '@type': company.entity_type === '대학/교육기관' ? 'EducationalOrganization' : 'Organization',
                '@id': `${url}#organization`,
                'name': company.company_name,
                'alternateName': company.aliases ? JSON.parse(JSON.stringify(company.aliases)) : undefined,
                'url': company.company_url || url,
                'foundingDate': company.founded_year || undefined,
                'founder': company.ceo_name ? { '@type': 'Person', 'name': company.ceo_name } : undefined,
                'address': company.hq_location ? {
                    '@type': 'PostalAddress',
                    'addressLocality': company.region?.name || '',
                    'streetAddress': company.hq_location,
                    'addressCountry': 'KR'
                } : undefined,
                'location': company.region ? {
                    '@type': 'Place',
                    'name': company.region.name,
                    'geo': {
                        '@type': 'GeoCoordinates',
                        'latitude': geoData.lat,
                        'longitude': geoData.lng
                    }
                } : undefined,
                'knowsAbout': coreKw?.technology?.join(', ') || undefined,
                'makesOffer': coreKw?.products?.join(', ') || undefined,
                'seeks': coreKw?.target_market?.join(', ') || undefined,
                'subjectOf': company.recentArticles?.map((article: any) => ({
                    '@type': 'Article',
                    'headline': article.title,
                    'url': article.url || undefined
                }))
            }
        ]
    };

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            {/* JSON-LD 삽입 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main className="mx-auto max-w-zi-container px-6 py-12">
                {/* ── 뒤로가기 ── */}
                <Link
                    href="/insight-radar"
                    className="mb-8 inline-flex items-center gap-2 text-zi-label font-semibold text-zi-on-surface-variant transition-colors hover:text-zi-primary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    인사이트 레이더로 돌아가기
                </Link>

                {/* ─────────────────────────────── */}
                {/* 1. Header & Profile Section     */}
                {/* ─────────────────────────────── */}
                <section className="mb-12">
                    {/* 1. Header Section */}
                    <div className="border-b border-slate-200 pb-10 mb-8">
                        <div className="mb-6">
                            <div className="flex flex-col gap-3 mb-6">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#001736] font-serif tracking-tight">
                                    {company.company_name}
                                </h1>
                                {backlinksList.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {backlinksList.map((link, idx) => (
                                            <a 
                                                key={idx}
                                                href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-zi-blue hover:bg-zi-blue hover:text-white font-semibold text-sm transition-all duration-200 shadow-sm shrink-0 group"
                                            >
                                                <span>{link.title || '바로가기'}</span>
                                                <ExternalLink size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                                {/* 지자체/지역 태그 */}
                                <div className="flex flex-wrap gap-2.5">
                                    {company.region && (
                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-zi-secondary bg-teal-50 border border-teal-100 rounded-lg">
                                            <Tag size={14} /> {company.region.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-xl text-slate-600 leading-relaxed max-w-4xl font-medium">
                            {company.business_summary || '등록된 비즈니스 요약이 없습니다.'}
                        </p>
                    </div>

                    {/* 2. Metadata Insight Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 py-7 px-8 bg-zi-blue rounded-xl border border-blue-400/20 mb-10 shadow-sm">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-sm text-blue-100 font-medium">대표자</span>
                            <span className="text-base text-white font-semibold">{company.ceo_name || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 md:border-l border-white/20 md:pl-8">
                            <span className="text-sm text-blue-100 font-medium">설립연도</span>
                            <span className="text-base text-white font-semibold">{company.founded_year || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 md:border-l border-white/20 md:pl-8">
                            <span className="text-sm text-blue-100 font-medium">소재지</span>
                            <span className="text-base text-white font-semibold">{company.hq_location || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 md:border-l border-white/20 md:pl-8">
                            <span className="text-sm text-blue-100 font-medium">조직유형</span>
                            <span className="text-base text-white font-semibold">{company.entity_type || 'Enterprise'}</span>
                        </div>
                    </div>

                    {/* 3. Key References Section */}
                    {Array.isArray(company.key_references) && company.key_references.length > 0 && (
                        <div>
                            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Target size={18} className="text-[#002B5B]" /> 주요 레퍼런스
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {(company.key_references as string[]).map((ref, i) => (
                                    <span key={i} className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-[#002B5B] transition-colors cursor-default shadow-sm">
                                        {ref}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* ─────────────────────────────── */}
                {/* 2. Strategic Positioning        */}
                {/* ─────────────────────────────── */}
                <section className="mb-12">
                    <div className="mb-6 flex items-center gap-2">
                        <Target className="h-6 w-6 text-zi-blue" />
                        <h2 className="text-2xl font-bold text-zi-primary font-serif tracking-tight">Strategic Positioning</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Products */}
                        <div className="border border-zi-divider bg-white p-6 rounded-xl shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">핵심 제품 및 서비스</h4>
                            <div className="flex flex-wrap gap-2">
                                {coreKw?.products && coreKw.products.length > 0 ? (
                                    coreKw.products.map((p: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                                            {p}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-slate-400 italic">정보 없음</span>
                                )}
                            </div>
                        </div>

                        {/* Technology */}
                        <div className="border border-zi-divider bg-white p-6 rounded-xl shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">핵심 기술 (Tech)</h4>
                            <div className="flex flex-wrap gap-2">
                                {coreKw?.technology && coreKw.technology.length > 0 ? (
                                    coreKw.technology.map((t: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                                            {t}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-slate-400 italic">정보 없음</span>
                                )}
                            </div>
                        </div>

                        {/* Target Market */}
                        <div className="border border-zi-divider bg-white p-6 rounded-xl shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">타겟 시장 (Market)</h4>
                            <div className="flex flex-wrap gap-2">
                                {coreKw?.target_market && coreKw.target_market.length > 0 ? (
                                    coreKw.target_market.map((m: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
                                            {m}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-slate-400 italic">정보 없음</span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────── */}
                {/* 3. Intelligence Report (Status) */}
                {/* ─────────────────────────────── */}
                <section className="mb-12">
                    <div className="bg-gradient-to-br from-zi-primary to-slate-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                            <Zap className="w-64 h-64 text-white" />
                        </div>
                        <div className="relative z-10">
                            <span className="mb-4 inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-200">
                                Intelligence Report
                            </span>
                            <h3 className="font-serif text-3xl font-bold mb-8">최근 동향 및 현황</h3>
                            
                            <div className="space-y-8 max-w-4xl">
                                <div className="relative pl-4 before:absolute before:left-0 before:top-1.5 before:bottom-1 before:w-1 before:bg-blue-500/50 before:rounded-full">
                                    <h4 className="text-sm font-bold text-blue-300 mb-2 uppercase tracking-wide">
                                        비즈니스 요약
                                    </h4>
                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-lg leading-relaxed text-slate-200 font-medium">
                                            {company.business_summary || '최신 비즈니스 동향 정보를 수집 중입니다.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────── */}
                {/* 4. Activity Timeline            */}
                {/* ─────────────────────────────── */}
                <section>
                    <div className="mb-8 flex items-center justify-between border-b border-zi-divider pb-4">
                        <h2 className="text-2xl font-bold text-zi-primary font-serif tracking-tight flex items-center gap-2">
                            <Tag className="h-6 w-6 text-slate-400" />
                            Activity Timeline
                        </h2>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold">
                            총 {company.articleCount.toLocaleString()}건 중 주요 {company.recentArticles.length}건
                        </span>
                    </div>

                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        {company.recentArticles.length > 0 ? (
                            company.recentArticles.map((article: typeof company.recentArticles[number], idx: number) => (
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
            </main>
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
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
            {/* 도트 마커 */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${isMagazine ? 'bg-amber-500' : 'bg-zi-blue'}`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            
            {/* 컨텐츠 카드 */}
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-xl border shadow-sm transition-all hover:shadow-md ${isMagazine ? 'border-amber-200 bg-amber-50/5' : 'border-zi-divider'}`}>
                <div className="flex items-center justify-between mb-3">
                    {isMagazine ? (
                        <span className="text-xs font-extrabold uppercase text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded border border-amber-200 flex items-center gap-1">
                            <span aria-hidden="true">✦</span> 진사이트(Zinsight) PARTNER
                        </span>
                    ) : (
                        <span className="text-xs font-bold uppercase text-zi-blue bg-blue-50 px-2 py-1 rounded">{category}</span>
                    )}
                    <time className="text-xs font-semibold text-slate-400">{date}</time>
                </div>
                <h3 className="mb-3 text-base font-bold text-zi-primary leading-snug">{title}</h3>
                {summary && (
                    <p className="line-clamp-2 text-sm text-slate-500 mb-4 leading-relaxed">{summary}</p>
                )}
                {url && (
                    isMagazine ? (
                        <Link
                            href={url}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-650 hover:text-indigo-800 transition-colors"
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
