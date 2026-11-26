import { isExternalHref, isPagePublished, siteConfig } from '@/config/site';

/**
 * 헤더·푸터 메뉴 정의. 노출 여부는 src/config/site.ts 값(nav·pages·contact)을 따릅니다.
 * 매거진의 지역 지면은 DB(활성 지역)에서 받아 헤더가 붙입니다.
 */

export interface NavLink {
    label: string;
    href: string;
    external: boolean;
}

/** 매거진 하위 메뉴 (지역 지면은 헤더가 DB 활성 지역으로 붙임). 진사이트 소식은 푸터에만 */
export function getMagazineSubLinks(): NavLink[] {
    return [{ label: '매거진 홈', href: '/magazine', external: false }];
}

/** 푸터 '진사이트 소식' (공지성 분류, 상단 메뉴에는 넣지 않음) */
export const ZINSIGHT_NEWS_LINK: NavLink = { label: '진사이트 소식', href: '/magazine/news', external: false };

/** 헤더 매거진 다음의 일반 메뉴 (공개 전 페이지는 숨김) */
export function getHeaderLinks(): NavLink[] {
    const links: NavLink[] = [{ label: '인사이트 레이더', href: '/insight-radar', external: false }];
    if (isPagePublished('services')) links.push({ label: '이용 안내', href: '/services', external: false });
    if (isPagePublished('about')) links.push({ label: '진사이트 소개', href: '/about', external: false });
    return links;
}

export function getContactLink(): NavLink {
    const { label, href } = siteConfig.contact;
    return { label, href, external: isExternalHref(href) };
}

/** 푸터 '진사이트 소개': 공개 전에는 운영사 홈페이지로 */
export function getAboutLink(): NavLink {
    if (isPagePublished('about')) return { label: '진사이트 소개', href: '/about', external: false };
    return { label: '진사이트 소개', href: siteConfig.company.homepage, external: true };
}
