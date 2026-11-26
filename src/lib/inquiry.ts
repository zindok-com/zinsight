import { siteConfig } from '@/config/site';

/**
 * 진사이트 이용 문의 입력 규칙 (클라이언트 폼·서버 API 공용).
 * 고객사 링크 페이지 '연락처 남기기'(link-page-lead.ts)와는 별개입니다.
 */
export const INQUIRY_COMPANY_MAX = 200;
export const INQUIRY_NAME_MAX = 50;
export const INQUIRY_PHONE_MAX = 30;
export const INQUIRY_EMAIL_MAX = 254;
export const INQUIRY_MESSAGE_MAX = 2000;
/** 폼을 연 뒤 이 시간 안에 보내면 자동 입력으로 보고 저장하지 않음 */
export const INQUIRY_MIN_FILL_MS = 3000;
/**
 * 숨김 함정 필드 이름 (사람에게는 보이지 않음, 값이 있으면 저장하지 않음).
 * 'website'·'url'·'company'처럼 브라우저 자동 완성이 채우는 이름은 쓰지 않음 (진짜 문의가 버려짐)
 */
export const INQUIRY_HONEYPOT_FIELD = 'zi_hp_check';

export const INQUIRY_SOURCES = ['zinsight', 'zindok'] as const;
export type InquirySource = (typeof INQUIRY_SOURCES)[number];

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
export type UtmValues = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-() ]+$/;

/** 관심 항목 선택지: /services '무엇을 해 드리나요' 카드와 같은 목록 (가격 없음) */
export function inquiryProductOptions(): Array<{ id: string; name: string }> {
    return siteConfig.partnership.offerings.map(({ id, name }) => ({ id, name }));
}

export interface InquiryInput {
    companyName: string;
    contactName: string;
    phone: string;
    email: string;
    products: string[];
    message: string;
    consent: boolean;
}

export type InquiryField = 'companyName' | 'contactName' | 'contact' | 'phone' | 'email' | 'products' | 'message' | 'consent';

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function normalizeInquiryInput(raw: Record<string, unknown>): InquiryInput {
    const validIds = new Set(siteConfig.partnership.offerings.map((i) => i.id));
    const products = Array.isArray(raw.products)
        ? Array.from(new Set(raw.products.filter((p): p is string => typeof p === 'string' && validIds.has(p))))
        : [];
    return {
        companyName: text(raw.companyName).replace(/\s+/g, ' '),
        contactName: text(raw.contactName).replace(/\s+/g, ' '),
        phone: text(raw.phone),
        email: text(raw.email).toLowerCase(),
        products,
        message: text(raw.message).replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n'),
        consent: raw.consent === true,
    };
}

/** 항목별 오류 문구. 비어 있으면 통과 */
export function validateInquiryInput(input: InquiryInput): Partial<Record<InquiryField, string>> {
    const errors: Partial<Record<InquiryField, string>> = {};
    if (!input.companyName) errors.companyName = '회사명을 입력해 주세요.';
    else if (input.companyName.length > INQUIRY_COMPANY_MAX) errors.companyName = `회사명은 ${INQUIRY_COMPANY_MAX}자 이내로 입력해 주세요.`;

    if (!input.contactName) errors.contactName = '담당자 이름을 입력해 주세요.';
    else if (input.contactName.length > INQUIRY_NAME_MAX) errors.contactName = `이름은 ${INQUIRY_NAME_MAX}자 이내로 입력해 주세요.`;

    if (!input.phone && !input.email) errors.contact = '전화번호나 이메일 중 하나는 입력해 주세요.';
    if (input.phone) {
        const digits = input.phone.replace(/\D/g, '');
        if (input.phone.length > INQUIRY_PHONE_MAX || !PHONE_PATTERN.test(input.phone) || digits.length < 8 || digits.length > 15) {
            errors.phone = '전화번호 형식을 확인해 주세요.';
        }
    }
    if (input.email && (input.email.length > INQUIRY_EMAIL_MAX || !EMAIL_PATTERN.test(input.email))) {
        errors.email = '이메일 형식을 확인해 주세요.';
    }
    if (input.message.length > INQUIRY_MESSAGE_MAX) errors.message = `메시지는 ${INQUIRY_MESSAGE_MAX}자 이내로 입력해 주세요.`;
    if (!input.consent) errors.consent = '개인정보 수집·이용에 동의해 주세요.';
    return errors;
}

/** 들어온 페이지 경로 (쿼리 제외, 500자) */
export function normalizePagePath(v: unknown): string | null {
    const s = text(v);
    if (!s.startsWith('/')) return null;
    return s.split(/[?#]/)[0].slice(0, 500) || null;
}

export function normalizeUtm(v: unknown): UtmValues | null {
    if (!v || typeof v !== 'object') return null;
    const out: UtmValues = {};
    for (const key of UTM_KEYS) {
        const value = text((v as Record<string, unknown>)[key]).slice(0, 100);
        if (value) out[key] = value;
    }
    return Object.keys(out).length > 0 ? out : null;
}
