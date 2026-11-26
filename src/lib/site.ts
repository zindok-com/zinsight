import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

/**
 * 진사이트 (zinsight.co.kr) 전역 사이트 상수 및 메타데이터 / Schema.org JSON-LD 헬퍼
 */

export const SITE_DOMAIN = siteConfig.brand.domain;
export const SITE_BASE_URL = siteConfig.brand.baseUrl;
export const SITE_NAME = siteConfig.brand.name;

// 사이트 대표 설명: 메타 description·OG·트위터·WebSite 스키마 공통 (값은 src/config/site.ts)
export const SITE_DESCRIPTION = siteConfig.identity.metaDescription;

/** 진사이트 Organization 노드 @id (메인 JSON-LD에 정의, 기사 publisher 등에서 참조) */
export const SITE_ORGANIZATION_ID = `${SITE_BASE_URL}/#organization`;
export const SITE_WEBSITE_ID = `${SITE_BASE_URL}/#website`;

/**
 * Schema.org @id 생성 헬퍼
 */
export function buildWebPageId(pageUrl: string): string {
    return pageUrl;
}

export function buildOrganizationId(pageUrl: string): string {
    return `${pageUrl}#organization`;
}

export function buildBreadcrumbId(pageUrl: string): string {
    return `${pageUrl}#breadcrumb`;
}

export function buildArticleId(pageUrl: string): string {
    return `${pageUrl}#article`;
}

/**
 * 상대 경로 또는 도메인을 받아 항상 https://www.zinsight.co.kr 기반의 절대 URL로 정규화
 */
export function toAbsoluteUrl(pathOrUrl: string | null | undefined): string {
    if (!pathOrUrl) return SITE_BASE_URL;
    const trimmed = pathOrUrl.trim();
    if (!trimmed) return SITE_BASE_URL;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${SITE_BASE_URL}${cleanPath}`;
}

/** 진사이트 소식(공지성) 분류 slug: 매거진 홈 목록·메인 슬라이드에서 빼고 /magazine/news에만 노출 */
export const ZINSIGHT_NEWS_CATEGORY = 'zinsight-news';

/**
 * 매거진 기사의 정규 경로. /magazine/[slug]는 이 경로로 301 리다이렉트만 하므로 내부 링크는 항상 이 함수를 사용합니다.
 */
export function getMagazinePostPath(post: {
    slug: string;
    category?: { isLocal: boolean } | null;
    region?: { slug: string } | null;
}): string {
    return post.category?.isLocal && post.region
        ? `/magazine/local/${post.region.slug}/${post.slug}`
        : `/magazine/tech-marketing/${post.slug}`;
}

/**
 * 페이지별 OG/트위터 메타데이터 생성.
 * 페이지가 openGraph/twitter를 지정하지 않으면 루트 레이아웃의 홈 제목이 그대로 노출되므로,
 * 목록·허브·정적 페이지는 이 헬퍼로 지정합니다.
 * <title>과 달리 OG/트위터에는 루트 template이 적용되지 않아 '| 진사이트'를 직접 붙입니다.
 */
export function buildSocialMetadata({
    title,
    description,
    path,
    type = 'website',
    image,
}: {
    title: string;
    description: string;
    path: string;
    type?: 'website' | 'profile';
    image?: { url: string; width?: number; height?: number; alt?: string };
}): Pick<Metadata, 'openGraph' | 'twitter'> {
    const socialTitle = `${title} | ${SITE_NAME}`;
    const ogImage = image ?? { url: siteConfig.brand.logoPath, alt: SITE_NAME };
    return {
        openGraph: {
            type,
            locale: 'ko_KR',
            siteName: SITE_NAME,
            url: toAbsoluteUrl(path),
            title: socialTitle,
            description,
            images: [ogImage],
        },
        twitter: {
            card: 'summary_large_image',
            title: socialTitle,
            description,
            images: [ogImage.url],
        },
    };
}

/**
 * 진사이트 Organization JSON-LD 노드. 운영사 진독은 parentOrganization으로 연결하고,
 * @id는 인사이트 레이더의 진독 프로필 Organization과 같게 맞춰 두 그래프가 이어지게 합니다.
 */
export function buildSiteOrganizationJsonLd() {
    const { brand, company, identity, jsonLd } = siteConfig;
    return {
        '@type': 'Organization',
        '@id': SITE_ORGANIZATION_ID,
        'name': brand.name,
        'alternateName': [brand.alternateName],
        'url': SITE_BASE_URL,
        'description': identity.metaDescription,
        'logo': {
            '@type': 'ImageObject',
            'url': toAbsoluteUrl(brand.logoPath),
        },
        'parentOrganization': {
            '@type': 'Organization',
            '@id': `${SITE_BASE_URL}/insight-radar/${company.radarSlug}#organization`,
            'name': company.name,
            'alternateName': company.englishName,
            'url': company.homepage,
            'address': {
                '@type': 'PostalAddress',
                'addressCountry': 'KR',
                ...jsonLd.address,
            },
            'telephone': company.phone,
            'email': company.email,
            'taxID': company.businessNumber,
        },
    };
}

/** 기사 JSON-LD publisher: 메인 Organization @id 참조 + 구글 기사 요건용 name·logo */
export function buildArticlePublisherJsonLd() {
    return {
        '@type': 'Organization',
        '@id': SITE_ORGANIZATION_ID,
        'name': SITE_NAME,
        'logo': {
            '@type': 'ImageObject',
            'url': toAbsoluteUrl(siteConfig.brand.logoPath),
        },
    };
}

/**
 * JSON-LD 스크립트 태그 내 HTML 파싱 충돌(예: </script>) 및 XSS 방지를 위해 < 문자를 \u003c 로 이스케이프
 */
export function serializeJsonLd(data: unknown): string {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * 주소 텍스트(hq_location) 및 지자체명(regionName)을 분리하여
 * Schema.org PostalAddress 객체로 변환
 */
export interface StructuredPostalAddress {
    '@type': 'PostalAddress';
    addressCountry: 'KR';
    addressRegion?: string;
    addressLocality?: string;
    streetAddress?: string;
}

const SIDO_PREFIX_REGEX = /^(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원특별자치도|강원도|충청북도|충청남도|전북특별자치도|전라북도|전라남도|경상북도|경상남도|제주특별자치도|제주도|서울시|서울|경기|인천|부산|대구|대전|광주|울산|세종)/;

export function parsePostalAddress(
    hqLocation: string | null | undefined,
    regionName: string | null | undefined
): StructuredPostalAddress | undefined {
    if (!hqLocation || !hqLocation.trim()) return undefined;

    const trimmed = hqLocation.trim();

    // 1. 광역 지자체 (시/도) 정규식 추출
    const matchSido = trimmed.match(SIDO_PREFIX_REGEX);
    let addressRegion: string | undefined = matchSido ? matchSido[0] : undefined;

    // 주소 텍스트에 시·도가 없으나 regionName이 있는 경우 기본 매핑
    if (!addressRegion && regionName) {
        if (regionName.includes('서울')) addressRegion = '서울특별시';
        else if (regionName.includes('인천')) addressRegion = '인천광역시';
        else if (regionName.includes('부산')) addressRegion = '부산광역시';
        else addressRegion = '경기도';
    }

    // 2. 기초 지자체 (시/군/구) - 관할 지역
    const addressLocality: string | undefined = regionName?.trim() || undefined;

    // 3. 상세 주소 (streetAddress): hqLocation에서 addressRegion과 addressLocality를 순차적으로 제거
    let remaining = trimmed;
    if (addressRegion && remaining.startsWith(addressRegion)) {
        remaining = remaining.slice(addressRegion.length).trim();
    }
    if (addressLocality && remaining.startsWith(addressLocality)) {
        remaining = remaining.slice(addressLocality.length).trim();
    }
    // 선두 쉼표나 공백 정리
    remaining = remaining.replace(/^[,\s]+/, '').trim();

    const streetAddress = remaining || trimmed;

    const address: StructuredPostalAddress = {
        '@type': 'PostalAddress',
        addressCountry: 'KR',
    };

    if (addressRegion) address.addressRegion = addressRegion;
    if (addressLocality) address.addressLocality = addressLocality;
    if (streetAddress) address.streetAddress = streetAddress;

    return address;
}

/**
 * 쉼표 구분 문자열 또는 문자열 배열을 받아 정제된 중복 없는 문자열 배열로 반환
 */
export function parseCleanStringArray(input: unknown): string[] {
    if (!input) return [];
    const list = Array.isArray(input) ? input : [input];
    const result: string[] = [];
    for (const item of list) {
        if (typeof item === 'string') {
            for (const part of item.split(',')) {
                const trimmed = part.trim();
                if (trimmed && !result.includes(trimmed)) {
                    result.push(trimmed);
                }
            }
        }
    }
    return result;
}

/**
 * 텍스트에서 첫 번째 문단(단락)만 추출
 */
export function extractFirstParagraph(text: string | null | undefined): string | undefined {
    if (!text || !text.trim()) return undefined;
    const paragraphs = text
        .split(/\r?\n\s*\r?\n|\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);
    return paragraphs[0] || undefined;
}
