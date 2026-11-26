/**
 * 진사이트 사이트 설정 (한 곳에서 바꾸면 전 사이트에 반영)
 *
 * - 회사 정보·정체성 문구·메뉴 노출·홈 블록·카드 이름·새 페이지 공개 여부를 모읍니다.
 * - 헤더(클라이언트 컴포넌트)에서도 읽으므로 서버 전용 코드를 import하지 않는 순수 데이터만 둡니다.
 * - 문구·주소·메뉴·가격 중 '제안' 표시가 있는 값은 대표 확정 전 기본값입니다. 확정되면 값만 바꿉니다.
 * - 비밀값(키·토큰)은 여기에 두지 않습니다.
 */

/** 진사이트 소개(/about) '걸어온 길' 한 줄 */
export interface AboutTimelineItem {
    /** 표시 날짜 (예: '2026.09.28'). 미확정이면 빈 값 + visible: false */
    date: string;
    title: string;
    /** 관련 진사이트 기사 slug (공개 기사면 링크) */
    postSlug?: string;
    visible: boolean;
}

/** 기업 등록·제휴 안내(/services) '무엇을 해 드리는지' 카드 한 장 (가격 없음) */
export interface PartnershipOffering {
    /** 문의 폼 관심 항목 값·통계에 쓰는 고정 id (이름이 바뀌어도 유지) */
    id: string;
    name: string;
    /** 해 드리는 일 한 줄 */
    summary: string;
    /** 이름 옆 작은 표시 (예: '무료') */
    badge?: string;
}

/** 가격표 한 줄 (진사이트에는 표시하지 않음, 진독 견적 페이지 재사용용). 가격은 모두 VAT 별도 원 단위 정수 */
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
        /** 기사 정정 요청 받는 주소 (/about 편집 원칙) */
        correctionEmail: 'ceo@zindok.com',
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
            '기업 이야기를 기사와 프로필로 정리해, 검색과 AI가 회사를 정확히 소개하도록 돕습니다.',
        metaDescription:
            '진사이트는 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼입니다. 기사와 기업 프로필로 검색과 AI 답변에 회사가 정확히 소개되도록 돕습니다. 진독(ZINDOK)이 운영합니다.',
        defaultTitle: '진사이트 | AI가 가장 먼저 찾는 기업으로 만듭니다',
        ogTitle: '진사이트 | AI가 가장 먼저 찾는 기업으로 만듭니다',
        ogDescription:
            '진사이트는 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼입니다. 기사와 기업 프로필로 검색과 AI 답변에 회사가 정확히 소개되도록 돕습니다. 진독(ZINDOK)이 운영합니다.',
        footerIntro: '진사이트는 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼입니다. 진독(ZINDOK)이 운영합니다.',
        magazineIntro: '지역 기업과 기관의 이야기를 기사로 정리해 전합니다.',
        keywords: ['진사이트', 'zinsight', '진독', 'zindok', '인사이트 레이더', '지역 기업', '기업 프로필', '기업 미디어', 'AEO', 'SEO', 'GEO'],
    },

    /** 진사이트 자체 기업 등록·제휴 문의 (푸터·프로필·카드 하단). 고객사 '문의하기'와 별개 */
    contact: {
        label: '기업 등록·제휴 문의',
        href: '/services', // 기업 등록·제휴 안내. 상단 메뉴에는 두지 않고 푸터·프로필·카드 하단 글자 링크로만 들어옴
        /** 카드·프로필 하단 작은 글자 링크 */
        registerLabel: '우리 회사도 진사이트에 소개되고 싶다면',
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
        /** 프로필 제목 꼬리 ('{회사}: {지역} {키워드} 기업 프로필'). 바꾸면 ArticleTracker가 제목에서 떼어 내는 문구도 함께 바뀜 */
        titleSuffix: '기업 프로필',
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
        about: { published: true },
        services: { published: false },
    },

    /**
     * 진사이트 소개(/about). 상단 메뉴에는 넣지 않고 푸터 '진사이트 소개'로만 들어옴.
     * 운영사 정보는 company, 정정 요청 주소는 company.correctionEmail에서 읽음
     */
    about: {
        identity: '진사이트는 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼입니다.',
        metaDescription: '진사이트는 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼입니다. 진사이트 매거진과 인사이트 레이더, 운영사 진독(ZINDOK)을 소개합니다.',
        /** 편집 원칙·후원 콘텐츠 표기 정책 블록 노출 (대표 확정 전 false) */
        showEditorial: false,
        /** 편집 원칙 (초안). {correctionEmail}은 company.correctionEmail로 바뀜 */
        editorialPrinciples: [
            { title: '취재 기반', body: '기업·기관을 직접 취재하거나 공개 자료를 확인해 씁니다. 확인되지 않은 수치나 효과는 쓰지 않습니다.' },
            { title: '사실 확인', body: '회사 이름, 연락처, 사업 내용은 기업이 준 자료와 공식 채널로 확인합니다. 기사마다 작성일과 수정일을 표시합니다.' },
            { title: '편집 독립', body: '기사의 구성, 표현, 게재 여부는 진사이트 편집부가 정합니다. 취재 대상은 게재 전 사실 확인을 위해 원고를 볼 수 있으며, 수정 요청은 사실 관계에 한해 반영합니다.' },
            { title: '정정', body: '사실과 다른 내용이 확인되면 바로 고치고, 고친 날짜를 남깁니다. 정정 요청: {correctionEmail}' },
            { title: '보장하지 않음', body: '검색 순위나 AI 답변 노출을 약속하지 않습니다.' },
        ],
        /** 후원 콘텐츠 표기 정책 (초안) */
        sponsorshipPolicy: [
            "기업·기관이 비용을 내거나 제휴 계약으로 의뢰한 기사는 '파트너 콘텐츠(협찬)'로 분류하고 '협찬' 배지를 붙입니다. 교육·공공 기관과의 협력 기사는 '협력 기관'으로 표시합니다.",
            '표시 위치: 기사 제목 위 배지, 매거진 목록과 메인 카드의 배지, 기사 끝 고지문.',
            "후원 기사 안의 외부 링크에는 rel=\"sponsored\"를 붙입니다.",
            "운영사 진독이 당사자인 기사(협약·공동 사업 등)는 기사 끝에 '운영사 진독이 참여한 협약입니다'처럼 이해관계를 밝힙니다.",
            '후원 여부와 관계없이 편집 원칙을 똑같이 적용합니다.',
            "운영사 진독의 자체 소식은 '진사이트 소식'으로 따로 분류합니다.",
        ],
        /**
         * 걸어온 길. postSlug가 있으면 공개 기사로 링크 (없거나 비공개면 글자만).
         * 날짜 미확정 항목은 visible: false로 숨김
         */
        timeline: [
            { date: '2026.05', title: '진사이트 첫 소개', postSlug: 'zindok-b2b-seo-marketing-ai-sales-intelligence', visible: true },
            { date: '2026.09', title: '1기 검증 파트너 모집 (약 20개사)', visible: true },
            { date: '2026.09.28', title: '광명 G-SMART HUB 오픈랩 PoC 워크숍 IR 발표', visible: true },
            { date: '', title: '네이버클라우드 스타트업 파트너십(NCP 그린하우스) 합류', visible: false }, // 날짜 확인 중
            { date: '2026.10.19', title: '안양산업진흥원·대림대학교·진독 산학협력 협약', postSlug: 'industry-academia-zindok-mou', visible: true },
        ] as AboutTimelineItem[],
    },

    /** 후원(유료) 기사 표기. 기사 isPaid 기준 */
    sponsorship: {
        name: '파트너 콘텐츠(협찬)',
        badge: '협찬',
        /** 교육·공공 협력(분류 edu-collab) 배지 */
        eduBadge: '협력 기관',
    },

    /**
     * 기업 등록·제휴 안내(/services). 진사이트에는 가격을 싣지 않음 (가격은 상담·진독에서 안내)
     * - 효과(검색 순위·AI 노출)를 약속하는 문구, '기사 판매'·'기사 1건' 같은 표현은 넣지 않습니다.
     * - offerings가 카드·문의 폼 관심 항목·JSON-LD(Service 목록)에 함께 쓰입니다.
     */
    partnership: {
        pageTitle: '기업 등록·제휴 안내',
        intro: '진사이트는 지역 기업을 취재하고 소개하는 기업 미디어 플랫폼입니다. 기업 프로필 등록과 취재·제휴 문의를 받습니다.',
        metaDescription: '진사이트 기업 프로필·진사이트 카드 등록과 기업 취재·제휴 문의 안내. 무료 마케팅 기본 진단부터 맞춤 제안까지 상담해 드립니다.',
        offerings: [
            { id: 'basic-diagnosis', name: '마케팅 기본 진단', badge: '무료', summary: '홈페이지·검색·채널 현황을 점검합니다.' },
            { id: 'ai-diagnosis', name: 'AI 노출 진단', summary: 'AI 답변·검색에서 회사가 어떻게 소개되는지 점검합니다.' },
            { id: 'profile', name: '기업 프로필', summary: '인사이트 레이더에 등록하고, 검색·AI가 읽는 회사 정보를 정리합니다.' },
            { id: 'card', name: '진사이트 카드', summary: '연락처·채널·소개 영상을 모은 모바일 카드, 명함 QR, 방문 통계를 제공합니다.' },
            { id: 'article', name: '기업 스포트라이트 취재', summary: '진사이트 매거진이 기업을 취재해 기사로 소개합니다.' },
            { id: 'video', name: '회사 소개 영상', summary: '60~80초 세로형 모션그래픽. 촬영 없이 회사 자료로 만듭니다.' },
            { id: 'channels', name: '공식 채널 정리', summary: '구글 비즈니스 프로필·네이버 스마트플레이스·SNS를 개설하고 정리합니다.' },
            { id: 'ongoing-care', name: '꾸준한 관리', summary: '회차마다 프로필·기사를 갱신하고 AI 답변 노출을 다시 측정해 월간 리포트로 드립니다.' },
        ] satisfies PartnershipOffering[],
        steps: ['문의', '무료 진단', '맞춤 제안·견적', '진행'],
        disclaimer: '검색 순위나 AI 답변 노출을 보장하지 않습니다. 기업 정보를 검색과 AI가 읽기 쉬운 형태로 정리해 드립니다.',
        /** 문의 접수 개인정보 보관 기간 (처리방침과 같게) */
        retentionNote: '접수일로부터 1년 보관 후 파기 (삭제 요청 시 즉시 파기)',
    },

    /**
     * 상품·가격 보관용 (제안가). 진사이트 화면에는 표시하지 않음 — 진독 견적 페이지에서 재사용 예정.
     * 지금 어디에서도 읽지 않습니다 (isPromoActive·formatWon도 보관). 지우지 마세요.
     */
    pricing: {
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
    },

    /** 하단 교차 링크: 진독 홈페이지·콘텐츠 마케팅 (리뉴얼 전까지 주소 관리, 비우면 숨김) */
    crossLink: {
        label: '운영사 진독(ZINDOK)에서 홈페이지·콘텐츠 마케팅도 함께 안내해 드립니다',
        cta: '진독 알아보기',
        href: 'https://www.zindok.com',
    },

    /** 구조화 데이터(JSON-LD) 운영사 주소 (PostalAddress로 나눔, company.address와 같은 주소). 설명은 identity.metaDescription 사용 */
    jsonLd: {
        address: {
            addressRegion: '경기도',
            addressLocality: '안양시 동안구',
            streetAddress: '시민대로327번길 11-41 9층 26-4호',
        },
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

/** 후원 기사 배지 문구: 교육·공공 협력 분류는 '협력 기관', 그 외 '협찬' */
/** 기사 분류 표시 이름: DB 분류 이름 그대로, 없으면 '매거진' (배지·article:tag·JSON-LD keywords 공통) */
export function magazineCategoryLabel(category?: { name?: string | null } | null): string {
    return category?.name?.trim() || '매거진';
}

export function sponsoredBadgeLabel(categorySlug?: string | null): string {
    return categorySlug === 'edu-collab' ? siteConfig.sponsorship.eduBadge : siteConfig.sponsorship.badge;
}

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
