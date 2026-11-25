import { createHmac } from 'node:crypto';
import { prisma } from '@/lib/db';
import { isDevMode } from '@/lib/token-config';
import { inquiryProductOptions, type InquiryInput, type InquirySource, type UtmValues } from '@/lib/inquiry';
import { siteConfig } from '@/config/site';

/**
 * 진사이트 이용 문의 저장·알림 (서버 전용). 테이블: inquiries (prisma Inquiry 모델)
 * 저장 실패 시 null을 돌려주고, 호출 쪽(api/inquiries)이 메일만이라도 보냄
 */

export interface InquiryRecord {
    source: InquirySource;
    input: InquiryInput;
    pagePath: string | null;
    utm: UtmValues | null;
    ipHash: string | null;
}

const DEV_ONLY_SECRET = 'dev-only-inquiry-ip-secret';

/**
 * 요청 제한용 IP 해시 (날짜를 섞은 HMAC, 원문 IP는 저장하지 않음).
 * 비밀값은 INQUIRY_IP_SECRET 전용 (다른 비밀값으로 대신하지 않음). 없으면 해시 없이 저장하고 DB 기준 제한을 건너뜀
 */
export function inquiryIpHash(ip: string): string | null {
    if (!ip || ip === 'unknown') return null;
    const secret = process.env.INQUIRY_IP_SECRET?.trim() || (isDevMode() ? DEV_ONLY_SECRET : '');
    if (!secret) return null;
    const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
    return createHmac('sha256', `${secret}:${ymd}`).update(ip).digest('hex').slice(0, 32);
}

/** 같은 IP 해시의 최근 접수 수 (서버 인스턴스와 무관하게 DB 기준). 조회 실패 시 null */
export async function countRecentInquiries(ipHash: string, windowMs: number): Promise<number | null> {
    try {
        return await prisma.inquiry.count({
            where: { ip_hash: ipHash, created_at: { gte: new Date(Date.now() - windowMs) } },
        });
    } catch {
        return null;
    }
}

/** 저장 후 새 id. 실패하면 null */
export async function saveInquiry(record: InquiryRecord): Promise<number | null> {
    const { source, input, pagePath, utm, ipHash } = record;
    try {
        const row = await prisma.inquiry.create({
            data: {
                source,
                company_name: input.companyName,
                contact_name: input.contactName,
                phone: input.phone || null,
                email: input.email || null,
                products: input.products,
                message: input.message || null,
                page_path: pagePath,
                utm: utm ?? undefined,
                ip_hash: ipHash,
                consent_at: new Date(),
            },
            select: { id: true },
        });
        return row.id;
    } catch (error) {
        console.error('[inquiry] 저장 실패:', error instanceof Error ? error.message : error);
        return null;
    }
}

export async function markInquiryNotified(id: number): Promise<void> {
    try {
        await prisma.inquiry.update({ where: { id }, data: { notified_at: new Date() } });
    } catch {}
}

/** 줄바꿈을 없앤 한 줄 문자열 (메일 제목 헤더 주입 방지) */
function oneLine(v: string, max = 80): string {
    return v.replace(/[\r\n]+/g, ' ').slice(0, max);
}

/**
 * 대표에게 알림 메일 (Resend HTTP API, 본문은 일반 텍스트).
 * 설정(RESEND_API_KEY·INQUIRY_MAIL_FROM·INQUIRY_NOTIFY_TO)이 없거나 실패하면 false. 예외를 던지지 않음
 */
export async function sendInquiryNotification(record: InquiryRecord, savedId: number | null): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.INQUIRY_MAIL_FROM?.trim();
    const to = (process.env.INQUIRY_NOTIFY_TO ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    if (!apiKey || !from || to.length === 0) {
        console.warn('[inquiry] 알림 메일 설정이 없어 메일을 보내지 않았습니다.');
        return false;
    }

    const { input, source, pagePath, utm } = record;
    const names = new Map(inquiryProductOptions().map((p) => [p.id, p.name]));
    const products = input.products.map((id) => names.get(id) ?? id).join(', ') || '(선택 없음)';
    const lines = [
        `새 ${siteConfig.brand.name} 이용 문의가 접수됐습니다.${savedId ? ` (접수 번호 ${savedId})` : ' (DB 저장 실패 — 이 메일이 유일한 기록입니다)'}`,
        '',
        `출처: ${source}`,
        `회사명: ${input.companyName}`,
        `담당자: ${input.contactName}`,
        `전화: ${input.phone || '-'}`,
        `이메일: ${input.email || '-'}`,
        `관심 상품: ${products}`,
        '',
        '메시지:',
        input.message || '(없음)',
        '',
        `들어온 페이지: ${pagePath ?? '-'}`,
        `UTM: ${utm ? Object.entries(utm).map(([k, v]) => `${k}=${v}`).join(' ') : '-'}`,
    ];

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from,
                to,
                subject: `[${siteConfig.brand.name} 이용 문의] ${oneLine(input.companyName)} · ${oneLine(input.contactName, 30)}`,
                text: lines.join('\n'),
                ...(input.email ? { reply_to: input.email } : {}),
            }),
            signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
            console.error('[inquiry] 알림 메일 실패:', res.status);
            return false;
        }
        return true;
    } catch (error) {
        console.error('[inquiry] 알림 메일 오류:', error instanceof Error ? error.message : error);
        return false;
    }
}
