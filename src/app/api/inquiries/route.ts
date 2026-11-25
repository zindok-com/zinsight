import { NextResponse, after, type NextRequest } from 'next/server';
import {
    INQUIRY_HONEYPOT_FIELD,
    INQUIRY_MIN_FILL_MS,
    normalizeInquiryInput,
    normalizePagePath,
    normalizeUtm,
    validateInquiryInput,
    type InquirySource,
} from '@/lib/inquiry';
import { countRecentInquiries, inquiryIpHash, markInquiryNotified, saveInquiry, sendInquiryNotification, type InquiryRecord } from '@/lib/inquiry-store';
import { clientIpFromHeaders, rateLimit, HOUR } from '@/lib/rate-limit';

/**
 * 진사이트 이용 문의 접수 (진사이트 /services 폼, 이후 zindok.com/quote도 같은 API 사용 예정).
 * - source는 요청 출처(Origin)로 서버가 정함: 같은 사이트 → zinsight, INQUIRY_EXTERNAL_ORIGINS에 있는 주소 → zindok
 * - 저장 먼저, 알림 메일은 응답 뒤(after). 메일이 실패해도 접수는 유지
 * - 스팸: 함정 필드·최소 작성 시간·IP당 1시간 5회(메모리 1차 + DB 기준 2차)
 */
export const dynamic = 'force-dynamic';

const LIMIT_PER_HOUR = 5;

function externalOrigins(): Map<string, InquirySource> {
    const map = new Map<string, InquirySource>();
    for (const raw of (process.env.INQUIRY_EXTERNAL_ORIGINS ?? '').split(',')) {
        const origin = raw.trim().replace(/\/+$/, '');
        if (origin) map.set(origin, 'zindok');
    }
    return map;
}

/** 허용된 출처면 source, 아니면 null. Origin이 없으면(같은 사이트 일부 요청) zinsight */
function resolveSource(request: NextRequest): { source: InquirySource; corsOrigin: string | null } | null {
    const origin = request.headers.get('origin');
    if (!origin) return { source: 'zinsight', corsOrigin: null };
    let host = '';
    try {
        host = new URL(origin).host;
    } catch {
        return null;
    }
    if (host === request.nextUrl.host) return { source: 'zinsight', corsOrigin: null };
    const external = externalOrigins().get(origin.replace(/\/+$/, ''));
    return external ? { source: external, corsOrigin: origin } : null;
}

function json(body: unknown, status: number, corsOrigin: string | null) {
    const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
    if (corsOrigin) {
        headers['Access-Control-Allow-Origin'] = corsOrigin;
        headers['Vary'] = 'Origin';
    }
    return NextResponse.json(body, { status, headers });
}

export async function OPTIONS(request: NextRequest) {
    const resolved = resolveSource(request);
    if (!resolved?.corsOrigin) return new NextResponse(null, { status: 403 });
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': resolved.corsOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
            Vary: 'Origin',
        },
    });
}

export async function POST(request: NextRequest) {
    const resolved = resolveSource(request);
    if (!resolved) return json({ ok: false, error: '허용되지 않은 요청입니다.' }, 403, null);
    const { source, corsOrigin } = resolved;

    let payload: Record<string, unknown>;
    try {
        const parsed = JSON.parse(await request.text());
        if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
        payload = parsed as Record<string, unknown>;
    } catch {
        return json({ ok: false, error: '요청 형식이 올바르지 않습니다.' }, 400, corsOrigin);
    }

    // 함정 필드에 값이 있거나 너무 빨리 보낸 요청: 저장하지 않고 성공처럼 응답 (봇이 우회 방법을 알지 못하게)
    const honeypot = typeof payload[INQUIRY_HONEYPOT_FIELD] === 'string' && (payload[INQUIRY_HONEYPOT_FIELD] as string).trim() !== '';
    const elapsed = typeof payload.elapsedMs === 'number' ? payload.elapsedMs : 0;
    if (honeypot || elapsed < INQUIRY_MIN_FILL_MS) return json({ ok: true }, 200, corsOrigin);

    const ip = clientIpFromHeaders(request.headers);
    if (!rateLimit(`inquiry:${ip}`, LIMIT_PER_HOUR, HOUR)) {
        return json({ ok: false, error: '접수가 너무 많습니다. 잠시 후 다시 시도해 주세요.' }, 429, corsOrigin);
    }
    const ipHash = inquiryIpHash(ip);
    if (ipHash) {
        const recent = await countRecentInquiries(ipHash, HOUR);
        if (recent !== null && recent >= LIMIT_PER_HOUR) {
            return json({ ok: false, error: '접수가 너무 많습니다. 잠시 후 다시 시도해 주세요.' }, 429, corsOrigin);
        }
    }

    const input = normalizeInquiryInput(payload);
    const errors = validateInquiryInput(input);
    if (Object.keys(errors).length > 0) return json({ ok: false, errors }, 422, corsOrigin);

    const record: InquiryRecord = {
        source,
        input,
        pagePath: normalizePagePath(payload.pagePath),
        utm: normalizeUtm(payload.utm),
        ipHash,
    };

    const savedId = await saveInquiry(record);
    if (savedId) {
        after(async () => {
            if (await sendInquiryNotification(record, savedId)) await markInquiryNotified(savedId);
        });
        return json({ ok: true }, 200, corsOrigin);
    }

    // 저장 실패: 메일이라도 가면 접수로 처리 (문의를 잃지 않게)
    const mailed = await sendInquiryNotification(record, null);
    if (mailed) return json({ ok: true }, 200, corsOrigin);
    return json(
        { ok: false, error: '지금 접수할 수 없습니다. 잠시 후 다시 시도하거나 이메일로 문의해 주세요.' },
        503,
        corsOrigin
    );
}
