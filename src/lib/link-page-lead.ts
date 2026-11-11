/**
 * 링크 페이지 '연락처 남기기' 입력 규칙 (클라이언트·서버 공용)
 */
export const LEAD_NAME_MAX = 50;
export const LEAD_PHONE_MAX = 30;
export const LEAD_EMAIL_MAX = 254;
export const LEAD_MEMO_MAX = 500;
/** 접수일로부터 보관 기간 (지나면 자동 삭제) */
export const LEAD_RETENTION_DAYS = 365;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-() ]+$/;

export interface LeadInput {
    name: string;
    phone: string;
    email: string;
    memo: string;
    consent: boolean;
}

export type LeadField = 'name' | 'contact' | 'phone' | 'email' | 'memo' | 'consent';

/** 입력값 정리 (앞뒤 공백 제거, 메모의 연속 빈 줄 축소) */
export function normalizeLeadInput(raw: Partial<Record<keyof LeadInput, unknown>>): LeadInput {
    const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
    return {
        name: text(raw.name).replace(/\s+/g, ' '),
        phone: text(raw.phone),
        email: text(raw.email).toLowerCase(),
        memo: text(raw.memo).replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n'),
        consent: raw.consent === true,
    };
}

/** 항목별 오류 문구. 비어 있으면 통과 */
export function validateLeadInput(input: LeadInput): Partial<Record<LeadField, string>> {
    const errors: Partial<Record<LeadField, string>> = {};
    if (!input.name) errors.name = '이름을 입력해 주세요.';
    else if (input.name.length > LEAD_NAME_MAX) errors.name = `이름은 ${LEAD_NAME_MAX}자 이내로 입력해 주세요.`;

    if (!input.phone && !input.email) errors.contact = '전화번호나 이메일 중 하나는 입력해 주세요.';
    if (input.phone) {
        const digits = input.phone.replace(/\D/g, '');
        if (input.phone.length > LEAD_PHONE_MAX || !PHONE_PATTERN.test(input.phone) || digits.length < 8 || digits.length > 15) {
            errors.phone = '전화번호 형식을 확인해 주세요.';
        }
    }
    if (input.email && (input.email.length > LEAD_EMAIL_MAX || !EMAIL_PATTERN.test(input.email))) {
        errors.email = '이메일 형식을 확인해 주세요.';
    }
    if (input.memo.length > LEAD_MEMO_MAX) errors.memo = `메모는 ${LEAD_MEMO_MAX}자 이내로 입력해 주세요.`;
    if (!input.consent) errors.consent = '개인정보 수집·이용 및 제공에 동의해 주세요.';
    return errors;
}
