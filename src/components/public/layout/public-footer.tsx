import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { getAboutLink, getContactLink, ZINSIGHT_NEWS_LINK, type NavLink } from '@/config/navigation';

const { brand, company, identity } = siteConfig;

// 사업자 정보 표시 (전자상거래법·정보통신망법). 값은 src/config/site.ts company
const BUSINESS_INFO: Array<{ label: string; value: string; href?: string }> = [
    { label: '상호', value: `${company.name}(${company.englishName})` },
    { label: '대표', value: company.ceo },
    { label: '사업자등록번호', value: company.businessNumber },
    { label: '주소', value: company.address },
    { label: '전화', value: company.phone, href: `tel:${company.phone.replace(/[^0-9+]/g, '')}` },
    { label: '이메일', value: company.email, href: `mailto:${company.email}` },
];

const footerLinkClass = 'py-1 text-[13px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug';

function FooterLink({ link, cta }: { link: NavLink; cta?: string }) {
    return (
        <Link
            href={link.href}
            {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            {...(cta ? { 'data-zi-cta': cta } : {})}
            className={footerLinkClass}
        >
            {link.label}
        </Link>
    );
}

export function PublicFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-zi-divider bg-white">
            <div className="mx-auto max-w-zi-container px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-col items-start justify-between gap-8 sm:gap-12 md:flex-row">
                    {/* 브랜드 블록 */}
                    <div className="max-w-xs">
                        <span className="mb-3 block text-lg font-bold text-zi-primary">{brand.name}</span>
                        <p className="mb-0 text-[13px] text-slate-500 leading-relaxed break-keep">
                            {identity.footerIntro}
                        </p>
                    </div>

                    {/* 링크 그리드 — 항상 3열 */}
                    <div className="grid grid-cols-3 gap-4 sm:gap-8 md:gap-12 w-full md:w-auto">
                        <div className="flex flex-col gap-1 sm:gap-2">
                            <span className="text-[11px] sm:text-zi-label font-bold uppercase text-zi-primary tracking-wider">탐색</span>
                            <Link href="/insight-radar" className="py-1 text-[13px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug">인사이트 레이더</Link>
                            <Link href="/magazine" className="py-1 text-[13px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug">매거진 아카이브</Link>
                            <FooterLink link={ZINSIGHT_NEWS_LINK} />
                        </div>
                        <div className="flex flex-col gap-1 sm:gap-2">
                            <span className="text-[11px] sm:text-zi-label font-bold uppercase text-zi-primary tracking-wider">정보</span>
                            <FooterLink link={getAboutLink()} />
                            <FooterLink link={getContactLink()} cta="footer" />
                        </div>
                        <div className="flex flex-col gap-1 sm:gap-2">
                            <span className="text-[11px] sm:text-zi-label font-bold uppercase text-zi-primary tracking-wider">법령</span>
                            <Link href="/terms" className="py-1 text-[13px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug">이용약관</Link>
                            <Link href="/privacy" className="py-1 text-[13px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug">개인정보처리방침</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 사업자 정보 */}
            <div className="border-t border-zi-divider">
                <address className="mx-auto max-w-zi-container px-4 sm:px-6 py-5 not-italic text-xs leading-relaxed text-slate-500">
                    <p className="flex flex-wrap gap-x-3 gap-y-1">
                        {BUSINESS_INFO.map(({ label, value, href }) => (
                            <span key={label}>
                                <span className="text-slate-400">{label}</span>{' '}
                                {href ? <a href={href} className="hover:underline">{value}</a> : value}
                            </span>
                        ))}
                    </p>
                </address>
            </div>

            {/* 하단 저작권 바 */}
            <div className="border-t border-zi-divider">
                <div className="mx-auto flex max-w-zi-container flex-col items-center justify-between gap-2 px-4 sm:px-6 py-5 md:flex-row">
                    <p className="text-xs font-medium tracking-wide text-slate-400">
                        © {currentYear} {company.name}. All rights reserved.
                    </p>
                    {/* Lordicon 무료 라이선스 출처 표기 (애니메이션 아이콘) */}
                    <p className="text-xs font-medium tracking-wide text-slate-400">
                        Animated icons by{' '}
                        <a href="https://lordicon.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                            Lordicon.com
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
