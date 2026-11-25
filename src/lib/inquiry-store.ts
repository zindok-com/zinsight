import { createHmac } from 'node:crypto';
import { prisma } from '@/lib/db';
import { isDevMode } from '@/lib/token-config';
import { inquiryProductOptions, type InquiryInput, type InquirySource, type UtmValues } from '@/lib/inquiry';
import { siteConfig } from '@/config/site';

/**
 * 진사이트 이용 문의 저장·알림 (서버 전용).
 *
 * 저장 테이블 inquiries는 아직 schema.prisma에 없습니다 (스키마 변경은 승인 후, 쿼리안: docs/migrations/inquiries.sql).
 * 그 전까지는 원시 SQL로 저장을 시도하고, 테이블이 없으면 저장 실패로 처리합니다.
 * 승인 후 Prisma 모델(Inquiry)이 생기면 이 파일의 SQL만 prisma.inquiry 호출로 바꿉니다.
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

/** 같은 IP 해시의 최근 접수 수 (서버 인스턴스와 무관하게 DB 기준). 테이블이 없으면 null */
export async function countRecentInquiries(ipHash: string, windowMs: number): Promise<number | null> {
    try {
        const since = new Date(Date.now() - windowMs);
        const rows = await prisma.$queryRaw<Array<{ n: bigint | number }>>`
            SELECT COUNT(*) AS n FROM inquiries WHERE ip_hash = ${ipHash} AND created_at >= ${since}`;
        return Number(rows[0]?.n ?? 0);
    } catch {
        return null;
    }
}

/** 저장 후 새 id. 실패(테이블 없음 등)하면 null */
export async function saveInquiry(record: InquiryRecord): Promise<number | null> {
    const { source, input, pagePath, utm, ipHash } = record;
    try {
        const rows = await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`
                INSERT INTO inquiries
                    (source, company_name, contact_name, phone, email, products, message, page_path, utm, ip_hash, consent_at)
                VALUES
                    (${source}, ${input.companyName}, ${input.contactName}, ${input.phone || null}, ${input.email || null},
                     ${JSON.stringify(input.products)}, ${input.message || null}, ${pagePath}, ${utm ? JSON.stringify(utm) : null},
                     ${ipHash}, ${new Date()})`;
            return tx.$queryRaw<Array<{ id: bigint | number }>>`SELECT LAST_INSERT_ID() AS id`;
        });
        const id = Number(rows[0]?.id ?? 0);
        return id > 0 ? id : null;
    } catch (error) {
        console.error('[inquiry] 저장 실패:', error instanceof Error ? error.message : error);
        return null;
    }
}

export async function markInquiryNotified(id: number): Promise<void> {
    try {
        await prisma.$executeRaw`UPDATE inquiries SET notified_at = ${new Date()} WHERE id = ${id}`;
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
