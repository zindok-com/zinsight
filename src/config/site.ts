/**
 * 진사이트 사이트 설정 (한 곳에서 바꾸면 전 사이트에 반영)
 *
 * - 회사 정보·정체성 문구·메뉴 노출·홈 블록·카드 이름·새 페이지 공개 여부를 모읍니다.
 * - 헤더(클라이언트 컴포넌트)에서도 읽으므로 서버 전용 코드를 import하지 않는 순수 데이터만 둡니다.
 * - 문구·주소·메뉴·가격 중 '제안' 표시가 있는 값은 대표 확정 전 기본값입니다. 확정되면 값만 바꿉니다.
 * - 비밀값(키·토큰)은 여기에 두지 않습니다.
 */

export type FunnelStage = '인지' | '관심' | '고려' | '전환' | '유지' | '측정';

export interface ServiceItem {
    /** 메뉴 이름 */
    name: string;
    /** 고객 퍼널에서 맡는 단계 */
    funnelStage: FunnelStage;
    /** 고객이 받는 것 */
    deliverables: string[];
    /** 가격 표기 (예: '월 30만 원', '상담 후 안내') */
    price: string;
    status: '지금 가능' | '준비 중';
}

export interface AiCitationCase {
    /** 사례 제목 (예: '○○ 기업, 구글 AI 개요에 소개') */
    title: string;
    /** 확인한 곳 (예: '구글 AI 개요', 'Gemini', 'ChatGPT') */
    source: string;
    /** 확인 날짜 YYYY-MM-DD */
    checkedAt: string;
    /** 캡처 이미지 주소 (/img/... 또는 스토리지 주소) */
    imageUrl: string;
    imageAlt?: string;
    /** 관련 기사 경로 (/magazine/...) */
    articleHref?: string;
    articleTitle?: string;
}

export const siteConfig = {
    brand: {
        name: '진사이트',
        alternateName: 'Zinsight',
        domain: 'www.zinsight.co.kr',
        baseUrl: 'https://www.zinsight.co.kr',
        logoPath: '/img/zinsight_icon.png',
    },

    /** 운영사 정보: 푸터 사업자 정보·JSON-LD·약관·개인정보처리방침·공유 통계 화면에 공통 사용 */
    company: {
        name: '진독',
        englishName: 'Zindok',
        ceo: '이태경',
        businessNumber: '346-15-02742',
        // 주소 확정 전: 현재 푸터 값 유지. 이 한 줄만 바꾸면 푸터·JSON-LD가 함께 바뀜
        address: '경기도 안양시 동안구 관양1744, 9층 안양창업지원센터',
        phone: '010-9756-3400',
        // 대표 이메일 하나로 문의·개인정보 문의 공통 사용
        email: 'ceo@zindok.com',
        homepage: 'https://www.zindok.com',
        /** 인사이트 레이더에 등록된 진독 프로필 slug (JSON-LD 운영사 @id 연결용) */
        radarSlug: 'zindok',
    },

    /** 정체성 문구 (제안 문구, 확정 시 교체) */
    identity: {
        slogan: 'AI가 가장 먼저 찾는 기업으로 만듭니다',
        heroDescription:
            '기업 이야기를 기사와 프로필로 정리해 검색과 AI 답변에 남기고, 찾아온 고객이 연락까지 이어지게 합니다.',
        metaDescription:
            '진사이트는 기업 기사와 프로필로 검색·AI 답변에 노출되고, 방문 고객을 문의로 연결하는 진독의 기업 홍보 플랫폼입니다.',
        defaultTitle: '진사이트 | AI가 가장 먼저 찾는 기업으로 만듭니다',
        ogTitle: '진사이트 | AI가 가장 먼저 찾는 기업으로 만듭니다',
        ogDescription:
            '진사이트는 기업 기사와 프로필로 검색·AI 답변에 노출되고, 방문 고객을 문의로 연결하는 진독의 기업 홍보 플랫폼입니다.',
        footerIntro: '진독이 운영하는 기업 홍보 플랫폼. 기사와 프로필로 AI가 먼저 찾는 기업을 만듭니다.',
        magazineIntro: '지역 기업과 기관의 이야기를 기사로 정리해 전합니다.',
        keywords: ['진사이트', 'zinsight', '진독', 'zindok', '인사이트 레이더', '기업 홍보', '기업 프로필', 'AI 검색 노출', 'AEO', 'SEO', 'GEO'],
    },

    /** 문의 연결 대상 (확정 전: 진독 홈페이지) */
    contact: {
        label: '문의',
        href: 'https://www.zindok.com',
    },

    nav: {
        /** 헤더·푸터 메뉴에 '테크 · 마케팅 저널' 노출 (URL·글은 유지) */
        showTechJournal: true,
    },

    home: {
        /** '진사이트 현황' 숫자 블록 노출 */
        showStats: true,
        /** 'AI 노출 진단' 버튼 슬롯 (상품 확정 후 켬) */
        aiDiagnosis: {
            enabled: false,
            label: 'AI 노출 진단 받기',
            href: '',
        },
    },

    /** 링크 페이지(진사이트 카드) */
    card: {
        displayName: '진사이트 카드',
    },

    /** 인사이트 레이더 목록 (검색어 없는 기본 화면) */
    radarList: {
        title: '안양·광명·의왕 기업·기관 프로필',
        description: '안양·광명·의왕 기업과 기관의 사업 소개, 제품·서비스, 최근 기사를 프로필로 정리했습니다.',
    },

    /** 새 페이지 공개 여부: false인 동안 noindex·sitemap 제외·메뉴 숨김 */
    pages: {
        about: { published: false },
        services: { published: false },
    },

    /** 서비스 메뉴판 (예시, 실제 메뉴·가격은 확정 후 입력) */
    services: [
        {
            name: '기업 프로필 등록',
            funnelStage: '고려' as const,
            deliverables: ['인사이트 레이더 기업 프로필', '검색·AI가 읽는 구조화 데이터', '진사이트 카드(링크 페이지)'],
            price: '상담 후 안내',
            status: '지금 가능' as const,
        },
        {
            name: '기업 기사 발행',
            funnelStage: '관심' as const,
            deliverables: ['진사이트 매거진 기사', '프로필 연결', '방문 통계 리포트'],
            price: '상담 후 안내',
            status: '준비 중' as const,
        },
    ] satisfies ServiceItem[],

    /** 메인 'AI 답변에 인용된 사례' (비어 있으면 블록 숨김, 공개 여부·캡처는 확정 후 입력) */
    aiCitations: [] as AiCitationCase[],
};

/** 헤더·푸터의 새 페이지 링크는 공개 후에만 노출 */
export function isPagePublished(page: keyof typeof siteConfig.pages): boolean {
    return siteConfig.pages[page].published;
}

export function isExternalHref(href: string): boolean {
    return /^https?:\/\//i.test(href);
}
