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

/** 진사이트 이용 안내(/services) 상품 표 한 줄. 가격은 모두 VAT 별도 원 단위 정수 */
export interface PricingItem {
    /** 문의 폼 관심 상품 값·통계에 쓰는 고정 id (이름이 바뀌어도 유지) */
    id: string;
    name: string;
    /** 받는 것·조건 한 줄 */
    summary: string;
    /** 정가 (null이면 priceNote만 표시) */
    price: number | null;
    /** 가격 앞뒤 단위 (예: '월', '채널당') */
    pricePrefix?: string;
    /** 가격 대신 또는 가격 옆에 붙는 문구 (예: '무료', '상담 후 안내', '연 99,000원') */
    priceNote?: string;
    /** 다른 상품과 함께 구매 시 안내 (예: '카드와 함께 4만 원') */
    bundleNote?: string;
    /** 프로모션 가격 (promo 기간에만 표시) */
    promoPrice?: number;
    /** 이 줄 전용 버튼 문구 (없으면 표에 버튼 없음) */
    cta?: string;
}

export interface AiCitationCase {
    /** 고정 id (예: 'daelim') */
    id: string;
    /** 공개 동의 여부. true인 사례만 메인에 노출 */
    consented: boolean;
    /** AI 서비스 이름 (예: 'ChatGPT', 'Gemini', '구글 AI 개요') */
    aiService: string;
    /** 물어본 질문 원문 */
    question: string;
    /** 확인 날짜 YYYY-MM-DD */
    checkedAt: string;
    /** 답변 캡처 이미지 주소 (/img/... 또는 스토리지 주소) */
    imageUrl: string;
    imageAlt?: string;
    /** 답변에 인용된 진사이트 기사·프로필 */
    links: Array<{ label: string; href: string }>;
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
        // 명함 기준 주소 (푸터·소개 페이지). JSON-LD 주소는 아래 jsonLd.address (승인 후 맞춤)
        address: '경기도 안양시 동안구 시민대로327번길 11-41 9층 26-4호',
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
        /** 보조 문구 (히어로 슬로건 위·푸터) */
        tagline: 'SEO·AEO·GEO 통합 기업 미디어 플랫폼',
        heroDescription:
            '기업 이야기를 기사와 프로필로 정리해 검색과 AI 답변에 남기고, 찾아온 고객이 연락까지 이어지게 합니다.',
        metaDescription:
            '진사이트는 기업 기사와 프로필로 검색·AI 답변에 노출되고, 방문 고객을 문의로 연결하는 진독의 기업 홍보 플랫폼입니다.',
        defaultTitle: '진사이트 | AI가 가장 먼저 찾는 기업으로 만듭니다',
        ogTitle: '진사이트 | AI가 가장 먼저 찾는 기업으로 만듭니다',
        ogDescription:
            '진사이트는 기업 기사와 프로필로 검색·AI 답변에 노출되고, 방문 고객을 문의로 연결하는 진독의 기업 홍보 플랫폼입니다.',
        footerIntro: 'AI가 가장 먼저 찾는 기업으로 만듭니다. SEO·AEO·GEO 통합 기업 미디어 플랫폼, 진독(ZINDOK)이 운영합니다.',
        magazineIntro: '지역 기업과 기관의 이야기를 기사로 정리해 전합니다.',
        keywords: ['진사이트', 'zinsight', '진독', 'zindok', '인사이트 레이더', '기업 홍보', '기업 프로필', 'AI 검색 노출', 'AEO', 'SEO', 'GEO'],
    },

    /** 진사이트 자체 이용 문의 (헤더 버튼·푸터). 고객사 '문의하기'와 별개 */
    contact: {
        label: '이용 문의',
        href: '/services', // 상품 표(메뉴판)부터 보이고, 페이지 안 버튼이 #inquiry 폼으로 이동
        /** 카드·프로필 하단 작은 글자 링크 */
        registerLabel: '우리 회사도 진사이트에 등록하기',
    },

    nav: {
        /** 헤더·푸터 메뉴에 '테크 · 마케팅 저널' 노출 (URL·글은 유지) */
        showTechJournal: true,
    },

    home: {
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

    /** 인사이트 레이더 프로필 */
    radarProfile: {
        /** 헤더에 보일 공식 채널 수 (대표 홈페이지 포함, 소개자료 제외). 저장 개수 제한은 아님 */
        headerChannelCount: 3,
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

    /**
     * 진사이트 이용 안내(/services) 상품·가격 (제안가, 대표 확정 전이라 자주 바뀜. 값만 바꾸면 표·문의 폼이 함께 바뀜)
     * - 가격은 VAT 별도. 효과(검색 순위·AI 노출)를 약속하는 문구는 넣지 않습니다.
     * - JSON-LD는 아직 위 services 배열을 씁니다 (Offer 반영은 승인 후)
     */
    pricing: {
        pageTitle: '진사이트 이용 안내 — 기업 프로필·카드 등록',
        vatNote: '가격은 모두 VAT 별도입니다.',
        /** 프로모션: endsAt(한국 시간 그날 끝)이 지나면 프로모션 열·문구가 자동으로 숨겨짐 */
        promo: {
            label: '2026 프로모션',
            endsAt: '2026-12-31',
            note: '2026년 12월 31일 계약분까지',
        },
        items: [
            { id: 'basic-diagnosis', name: '마케팅 기본 진단', summary: '홈페이지·검색·채널 현황을 보고 개선할 점을 정리해 드립니다.', price: null, priceNote: '무료', cta: '무료 진단 신청' },
            { id: 'ai-diagnosis', name: 'AI 노출 진단', summary: 'AI 답변·검색에서 회사가 어떻게 보이는지 점검합니다.', price: 30000, bundleNote: '이후 상품 구매 시 금액 차감' },
            { id: 'card', name: '진사이트 카드(링크 페이지) 세팅', summary: '연락처·채널·소개 영상을 한 페이지에 모은 모바일 카드', price: 20000 },
            { id: 'profile', name: '기업 프로필', summary: '인사이트 레이더 기업 프로필과 검색·AI가 읽는 구조화 데이터', price: 30000, bundleNote: '카드와 함께 4만 원' },
            { id: 'card-maintenance', name: '카드 유지', summary: '카드 운영·방문 통계 제공', price: 9900, pricePrefix: '월', priceNote: '연 99,000원' },
            { id: 'article', name: '기사', summary: '진사이트 매거진 기업 기사 1건, 프로필 연결', price: 50000, bundleNote: '다른 상품과 함께 3만 5천 원' },
            { id: 'org-set', name: '조직 등록 세트', summary: '프로필 + 카드 + 기사 1건 + AI 노출 진단', price: 100000 },
            { id: 'video-standard', name: '회사 소개 영상 표준형', summary: '정해진 구성으로 만드는 회사 소개 영상', price: 250000, promoPrice: 190000 },
            { id: 'video-custom', name: '회사 소개 영상 맞춤형', summary: '회사에 맞춰 구성·촬영을 정하는 소개 영상', price: 450000, promoPrice: 350000 },
            { id: 'channels', name: '외부 채널 세팅', summary: '블로그·SNS 등 외부 채널 개설·정리', price: 30000, pricePrefix: '채널당', priceNote: '4종 10만 원' },
            { id: 'growth-package', name: '성장 회차 패키지', summary: '기사·채널 운영을 회차별로 이어 가는 반복 상품', price: null, priceNote: '상담 후 안내' },
            { id: 'maintenance-subscription', name: '유지관리 구독', summary: '프로필·카드·채널 정보를 계속 최신으로 관리', price: null, priceNote: '상담 후 안내' },
        ] satisfies PricingItem[],
        paymentSteps: ['문의', '견적', '세금계산서 발행', '계좌이체'],
        paymentNote: '카드 결제는 받지 않습니다.',
        disclaimer: '검색 순위나 AI 답변 노출을 보장하지 않습니다. 기업 정보를 검색과 AI가 읽기 쉬운 형태로 정리해 드립니다.',
        /** 문의 접수 개인정보 보관 기간 (처리방침과 같게) */
        retentionNote: '접수일로부터 1년 보관 후 파기 (삭제 요청 시 즉시 파기)',
    },

    /** 하단 교차 링크: 진독 홈페이지·콘텐츠 마케팅 (리뉴얼 전까지 주소 관리, 비우면 숨김) */
    crossLink: {
        label: '홈페이지·콘텐츠 마케팅도 필요하세요?',
        cta: '진독 알아보기',
        href: 'https://www.zindok.com',
    },

    /**
     * 구조화 데이터(JSON-LD) 전용 값. 화면 문구·주소와 따로 두어, JSON-LD 변경은 승인 후에만 반영
     * 변경안(보고만): description = identity.metaDescription, address = 경기도 / 안양시 동안구 / 시민대로327번길 11-41 9층 26-4호
     */
    jsonLd: {
        description:
            '진사이트는 기업 기사와 프로필로 검색·AI 답변에 노출되고, 방문 고객을 문의로 연결하는 진독의 기업 홍보 플랫폼입니다.',
        address: '경기도 안양시 동안구 관양1744, 9층 안양창업지원센터',
    },

    /**
     * 메인 'AI가 진사이트를 인용한 사례'. consented가 true인 사례만 노출,
     * 노출할 사례가 없으면 '이렇게 작동합니다' 3단계로 대체
     */
    aiCitations: [
        {
            id: 'daelim',
            consented: false, // 공개 동의 전
            aiService: '',
            question: '',
            checkedAt: '',
            imageUrl: '',
            links: [],
        },
        {
            id: 'telling',
            consented: false, // 공개 동의 전
            aiService: '',
            question: '',
            checkedAt: '',
            imageUrl: '',
            links: [],
        },
    ] as AiCitationCase[],
};

/** 헤더·푸터의 새 페이지 링크는 공개 후에만 노출 */
export function isPagePublished(page: keyof typeof siteConfig.pages): boolean {
    return siteConfig.pages[page].published;
}

/** 프로모션 기간인지 (endsAt 날짜의 한국 시간 23:59:59까지) */
export function isPromoActive(now: Date = new Date()): boolean {
    const end = new Date(`${siteConfig.pricing.promo.endsAt}T23:59:59.999+09:00`);
    return now.getTime() <= end.getTime();
}

/** 30000 → '3만 원', 9900 → '9,900원', 35000 → '3만 5천 원' */
export function formatWon(value: number): string {
    if (value >= 10000) {
        const man = Math.floor(value / 10000);
        const rest = value % 10000;
        if (rest === 0) return `${man.toLocaleString('ko-KR')}만 원`;
        if (rest % 1000 === 0) return `${man.toLocaleString('ko-KR')}만 ${rest / 1000}천 원`;
    }
    return `${value.toLocaleString('ko-KR')}원`;
}

export function isExternalHref(href: string): boolean {
    return /^https?:\/\//i.test(href);
}
