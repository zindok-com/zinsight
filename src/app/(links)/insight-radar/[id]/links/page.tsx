import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, Mail, Phone } from 'lucide-react';
import { getOrgLinkPage, type LinkPageLink } from '@/lib/org-link-page';
import { SOCIAL_PLATFORM_LABEL, linkPageKindOf, type LinkPageLinkKind } from '@/lib/org-links';
import { formatRadarDate, getOrgInitial } from '@/lib/radar';
import { BrandIcon } from '@/components/public/insight-radar/links/BrandIcon';
import { LinkPageTracker } from '@/components/public/insight-radar/links/LinkPageTracker';
import { LinkPageVideo } from '@/components/public/insight-radar/links/LinkPageVideo';
import { LinkPageLeadForm } from '@/components/public/insight-radar/links/LinkPageLeadForm';

// 링크 페이지는 사이트 공통 헤더·푸터 없이 단독 화면으로 렌더링 (명함 QR·SNS 프로필 링크용)
export const revalidate = 300;

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const data = await getOrgLinkPage(decodeURIComponent(id));
    if (!data) return { title: '링크를 찾을 수 없습니다', robots: { index: false, follow: false } };
    const title = `${data.name} 링크`;
    const description = data.tagline ?? `${data.name}의 홈페이지·SNS·소식을 한 곳에서 확인하세요.`;
    return {
        title,
        description,
        // 검색 색인 제외 (프로필 페이지가 대표 문서), 링크는 따라가도록 follow
        robots: { index: false, follow: true },
        openGraph: { title: `${title} | 진사이트`, description, type: 'website', siteName: '진사이트', locale: 'ko_KR' },
        twitter: { card: 'summary', title: `${title} | 진사이트`, description },
    };
}

const cardClass =
    'flex min-h-[76px] items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zi-blue';

function isExternal(url: string): boolean {
    return /^https?:\/\//i.test(url);
}

function Thumb({ src, fallback }: { src: string | null; fallback?: React.ReactNode }) {
    return (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
            {src ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
                fallback
            )}
        </span>
    );
}

// 통계 수집 속성 (kind는 통계용 종류: external | internal | cta | social)
function trackAttrs(link: { key: string; label: string; kind: LinkPageLinkKind }) {
    return { 'data-link-key': link.key, 'data-link-label': link.label, 'data-link-kind': link.kind };
}

function linkTrackAttrs(link: LinkPageLink) {
    return trackAttrs({ key: link.key, label: link.label, kind: linkPageKindOf(link) });
}

export default async function OrgLinksPage({ params }: PageProps) {
    const { id } = await params;
    const data = await getOrgLinkPage(decodeURIComponent(id));
    if (!data) notFound();

    const profilePath = `/insight-radar/${encodeURIComponent(data.slug)}`;
    const iconLinks = data.links.filter((l) => l.display === 'icon');
    const cardLinks = data.links.filter((l) => l.display === 'card');
    const buttonLinks = data.links.filter((l) => l.display === 'button');
    const inquiryIsPhone = data.inquiryHref?.startsWith('tel:');

    return (
        <div className="min-h-screen bg-slate-100">
            <main
                id="org-links"
                className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-slate-50 sm:shadow-sm"
            >
                {/* ① 로고·조직명·한 줄 소개 */}
                <header className="bg-gradient-to-b from-blue-50 via-slate-50 to-slate-50 px-5 pt-10 pb-5 text-center">
                    <span className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-3xl font-bold text-zi-primary shadow-sm">
                        {data.logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={data.logoUrl} alt={`${data.name} 로고`} className="max-h-full max-w-full object-contain p-2" />
                        ) : (
                            <span aria-hidden="true">{getOrgInitial(data.name)}</span>
                        )}
                    </span>
                    <h1 className="mt-4 font-serif text-2xl font-bold text-zi-primary break-keep">{data.name}</h1>
                    {data.tagline && <p className="mt-1.5 text-sm leading-relaxed text-slate-600 line-clamp-2 break-keep">{data.tagline}</p>}

                    {/* ② SNS 아이콘 */}
                    {iconLinks.length > 0 && (
                        <ul className="mt-5 flex flex-wrap items-center justify-center gap-3">
                            {iconLinks.map((link) => (
                                <li key={link.key}>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={iconLabel(link)}
                                        title={iconLabel(link)}
                                        {...linkTrackAttrs(link)}
                                        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zi-blue"
                                    >
                                        <BrandIcon platform={link.platform} />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </header>

                <div className="flex-1 px-4 pb-28">
                    {/* 소개 영상: 불러오기 전에는 접혀 있다가 준비되면 펼쳐짐 (모바일 무음 자동재생) */}
                    {data.videoUrl && (
                        <LinkPageVideo videoUrl={data.videoUrl} posterUrl={data.videoPosterUrl} orgName={data.name} slug={data.slug} />
                    )}

                    {/* ③ 카드형 링크: 프로필(항상 첫 번째) → 최근 매거진 기사 → 관리자 카드 */}
                    <ul className="flex flex-col gap-3" aria-label="주요 링크">
                        <li>
                            <a href={profilePath} {...trackAttrs({ key: 'profile', label: '진사이트 프로필 전체 보기', kind: 'internal' })} className={cardClass}>
                                <Thumb
                                    src={null}
                                    fallback={
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src="/img/zinsight_icon.png" alt="" className="h-full w-full object-cover" />
                                    }
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[11px] font-semibold text-zi-blue">진사이트 인사이트 레이더</span>
                                    <span className="block truncate text-[15px] font-bold text-slate-900">프로필 전체 보기</span>
                                    <span className="block truncate text-xs text-slate-500">개요 · 제품·서비스 · 주요 활동</span>
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                            </a>
                        </li>
                        {data.articles.map((article) => {
                            const date = formatRadarDate(article.date);
                            return (
                                <li key={article.id}>
                                    <a
                                        href={article.path}
                                        {...trackAttrs({ key: `article:${article.id}`, label: article.title, kind: 'internal' })}
                                        className={cardClass}
                                    >
                                        <Thumb src={article.thumbnailUrl} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[11px] font-semibold text-amber-700">
                                                진사이트 매거진{date ? ` · ${date}` : ''}
                                            </span>
                                            <span className="block text-[15px] font-bold leading-snug text-slate-900 line-clamp-2 break-keep">{article.title}</span>
                                        </span>
                                    </a>
                                </li>
                            );
                        })}
                        {cardLinks.map((link) => (
                            <li key={link.key}>
                                <a
                                    href={link.url}
                                    {...(isExternal(link.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                    {...linkTrackAttrs(link)}
                                    className={cardClass}
                                >
                                    <Thumb src={link.thumbnailUrl} fallback={<BrandIcon platform={link.platform} className="h-6 w-6" />} />
                                    <span className="min-w-0 flex-1">
                                        {link.subtitle && <span className="block truncate text-[11px] font-semibold text-slate-500">{link.subtitle}</span>}
                                        <span className="block text-[15px] font-bold leading-snug text-slate-900 line-clamp-2 break-keep">{link.label}</span>
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>

                    {/* ④ 버튼형 링크 */}
                    {buttonLinks.length > 0 && (
                        <ul className="mt-5 flex flex-col gap-2.5" aria-label="바로가기">
                            {buttonLinks.map((link) => (
                                <li key={link.key}>
                                    <a
                                        href={link.url}
                                        {...(isExternal(link.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                        {...linkTrackAttrs(link)}
                                        className="flex min-h-[52px] items-center justify-center rounded-xl bg-white px-4 text-center text-[15px] font-bold text-slate-900 shadow-sm ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zi-blue break-keep"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* ⑥ 하단 표기 */}
                    <p className="mt-10 text-center text-xs text-slate-400">
                        <a
                            href="/insight-radar"
                            {...trackAttrs({ key: 'home', label: '진사이트 인사이트 레이더', kind: 'internal' })}
                            className="inline-flex min-h-11 items-center px-2 underline-offset-2 hover:text-slate-600 hover:underline"
                        >
                            진사이트 인사이트 레이더
                        </a>
                    </p>
                </div>

                {/* ⑤ 하단 고정 바: 문의하기(연락 수단이 있을 때) + 연락처 남기기 */}
                <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[480px] border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
                    <div className={data.inquiryHref ? 'grid grid-cols-2 gap-2' : ''}>
                        {data.inquiryHref && (
                            <a
                                href={data.inquiryHref}
                                {...(isExternal(data.inquiryHref) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                {...trackAttrs({ key: 'inquiry', label: '문의하기', kind: 'cta' })}
                                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-zi-blue text-[15px] font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zi-blue"
                            >
                                {inquiryIsPhone ? <Phone className="h-4 w-4" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
                                문의하기
                            </a>
                        )}
                        <LinkPageLeadForm slug={data.slug} orgName={data.name} primary={!data.inquiryHref} />
                    </div>
                </div>
            </main>
            <LinkPageTracker slug={data.slug} orgId={data.id} />
        </div>
    );
}

function iconLabel(link: LinkPageLink): string {
    const platformLabel = link.platform ? SOCIAL_PLATFORM_LABEL[link.platform] : null;
    return platformLabel && link.label !== platformLabel ? `${platformLabel}: ${link.label}` : link.label;
}
