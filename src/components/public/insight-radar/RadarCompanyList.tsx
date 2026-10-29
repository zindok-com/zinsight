import Link from 'next/link';
import { ArrowRight, SearchX } from 'lucide-react';
import type { RadarCompanyCard } from '@/actions/insight-radar-actions';
import {
    extractRadarTagline,
    flattenRadarKeywords,
    formatCompanyAge,
    formatRadarDate,
    getOrgInitial,
    parseRadarKeywords,
} from '@/lib/radar';

interface RadarCompanyListProps {
    companies: RadarCompanyCard[];
    isInitialState?: boolean;
}

function OrgMark({ name, logoUrl, size }: { name: string; logoUrl?: string | null; size: 'sm' | 'md' }) {
    const box = size === 'md' ? 'h-10 w-10 text-base' : 'h-9 w-9 text-sm';
    return (
        <span className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white font-bold text-zi-primary`}>
            {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain p-1" />
            ) : (
                <span aria-hidden="true">{getOrgInitial(name)}</span>
            )}
        </span>
    );
}

/**
 * 조직 목록. 데스크톱(lg 이상)은 시맨틱 테이블, 모바일은 컴팩트 카드.
 * 두 표현 모두 서버 렌더링되며 조직명은 실제 <a href> 링크.
 */
export function RadarCompanyList({ companies, isInitialState }: RadarCompanyListProps) {
    if (!companies || companies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <SearchX className="mb-4 h-10 w-10 text-slate-300" aria-hidden="true" />
                <h2 className="mb-2 text-base font-bold text-zi-on-surface">조직을 찾을 수 없습니다</h2>
                <p className="text-sm text-zi-on-surface-variant">해당 조건에 맞는 조직 또는 기업 데이터가 없습니다.</p>
                {!isInitialState && (
                    <Link
                        href="/insight-radar"
                        className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-zi-primary transition-colors hover:bg-zi-surface-container"
                    >
                        전체 조직 보기 <ArrowRight className="h-4 w-4" />
                    </Link>
                )}
            </div>
        );
    }

    const rows = companies.map((company) => {
        const keywords = flattenRadarKeywords(parseRadarKeywords(company.core_keywords));
        return {
            company,
            href: `/insight-radar/${company.slug || company.id}`,
            meta: [company.entity_type, company.region?.name ?? company.hq_location].filter(Boolean).join(' · '),
            tagline: extractRadarTagline(company.business_summary),
            keywords,
            age: formatCompanyAge(company.founded_year),
            latest: formatRadarDate(company.latestArticleDate),
        };
    });

    return (
        <>
            {/* ── 데스크톱: 표형 목록 ── */}
            <div className="hidden lg:block rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full table-fixed border-collapse text-left">
                    <caption className="sr-only">등록된 기관 및 기업 목록</caption>
                    <thead className="sticky top-20 z-10 bg-slate-50">
                        <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                            <th scope="col" className="w-[22%] rounded-tl-xl px-4 py-3">조직</th>
                            <th scope="col" className="px-4 py-3">한 줄 소개</th>
                            <th scope="col" className="w-[26%] px-4 py-3">핵심 키워드</th>
                            <th scope="col" className="w-[7%] px-3 py-3 text-right">업력</th>
                            <th scope="col" className="w-[8%] px-3 py-3 text-right">연관 기사</th>
                            <th scope="col" className="w-[10%] rounded-tr-xl px-4 py-3 text-right">최근 활동</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map(({ company, href, meta, tagline, keywords, age, latest }) => (
                            // 조직명 링크를 행 전체로 늘려 행 클릭을 보조 동작으로 제공 (JS 불필요)
                            <tr key={company.id} className="relative h-[60px] transition-colors hover:bg-blue-50/50 focus-within:bg-blue-50/50">
                                <th scope="row" className="px-4 py-2.5 font-normal">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <OrgMark name={company.company_name} logoUrl={company.logo_url} size="sm" />
                                        <div className="min-w-0">
                                            <Link
                                                href={href}
                                                className="block truncate text-[15px] font-bold text-zi-primary after:absolute after:inset-0 after:content-[''] hover:text-zi-blue focus-visible:outline-none"
                                            >
                                                {company.company_name}
                                            </Link>
                                            {meta && <span className="block truncate text-xs text-slate-500">{meta}</span>}
                                        </div>
                                    </div>
                                </th>
                                <td className="px-4 py-2.5 text-sm text-slate-700">
                                    {tagline && <p className="line-clamp-2 leading-snug">{tagline}</p>}
                                </td>
                                <td className="px-4 py-2.5">
                                    {keywords.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1">
                                            {keywords.slice(0, 3).map((k) => (
                                                <span key={k} title={k} className="max-w-[7.5rem] truncate rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                    {k}
                                                </span>
                                            ))}
                                            {keywords.length > 3 && (
                                                <span className="text-xs font-semibold text-slate-500" aria-label={`외 ${keywords.length - 3}개`}>
                                                    +{keywords.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 text-right text-sm text-slate-700 tabular-nums">{age}</td>
                                <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-900 tabular-nums">
                                    {company.articleCount > 0 ? `${company.articleCount}건` : null}
                                </td>
                                <td className="px-4 py-2.5 text-right text-sm text-slate-700 tabular-nums">{latest}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── 모바일: 컴팩트 카드 ── */}
            <ul className="flex flex-col gap-2 lg:hidden" aria-label="등록된 기관 및 기업 목록">
                {rows.map(({ company, href, tagline, keywords, latest }) => {
                    const extra = keywords.length - 2;
                    const keywordText = keywords.slice(0, 2).join(' · ');
                    // 기사 수·날짜는 잘리지 않게 고정, 길어지는 키워드 쪽만 말줄임
                    const statParts = [
                        company.articleCount > 0 ? `기사 ${company.articleCount}건` : null,
                        latest,
                    ].filter(Boolean);
                    return (
                        <li key={company.id}>
                            <Link
                                href={href}
                                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors active:bg-slate-50"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex min-w-0 items-center gap-2.5">
                                        <OrgMark name={company.company_name} logoUrl={company.logo_url} size="sm" />
                                        <span className="truncate text-[15px] font-bold text-zi-primary">{company.company_name}</span>
                                    </span>
                                    {company.entity_type && (
                                        <span className="shrink-0 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold text-zi-secondary">
                                            {company.entity_type}
                                        </span>
                                    )}
                                </div>
                                {tagline && <p className="mt-2 line-clamp-2 text-sm leading-snug text-slate-700">{tagline}</p>}
                                {(keywordText || statParts.length > 0) && (
                                    <p className="mt-2 flex min-w-0 items-center gap-1 text-xs text-slate-500 tabular-nums">
                                        {keywordText && <span className="min-w-0 truncate">{keywordText}</span>}
                                        {extra > 0 && <span className="shrink-0">+{extra}</span>}
                                        {statParts.length > 0 && (
                                            <span className="shrink-0">
                                                {keywordText && <span aria-hidden="true">· </span>}
                                                {statParts.join(' · ')}
                                            </span>
                                        )}
                                    </p>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
