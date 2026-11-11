import { createHmac } from 'node:crypto';
import { NextResponse, after, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { deviceFromUserAgent, isBotUserAgent } from '@/lib/bot-ua';
import { LINK_KEY_PATTERN, LINK_PAGE_LINK_KINDS } from '@/lib/org-links';
import { QR_CODE_PATTERN } from '@/lib/qr-link';
import { rateLimit, MINUTE } from '@/lib/rate-limit';

// 링크 페이지 방문·클릭 수집 (고객사 제공 통계의 기준 데이터).
// IP·UA 원문은 저장하지 않고, 날짜별 비밀값으로 해시한 순방문 식별값만 원본 이벤트에 90일 보관
export const dynamic = 'force-dynamic';

const RAW_RETENTION_DAYS = 90;
const NO_CONTENT = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
const KINDS = new Set<string>(LINK_PAGE_LINK_KINDS);
const EVENTS = new Set<unknown>(['view', 'click', 'video']);

// KST 기준 오늘 (DATE 컬럼 저장용 UTC 자정 값, 그날 시작 시각, 해시용 문자열)
function kstDay() {
    const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
    return { ymd, date: new Date(`${ymd}T00:00:00.000Z`), start: new Date(`${ymd}T00:00:00.000+09:00`) };
}

// 날짜가 바뀌면 같은 사람도 다른 값이 되도록 날짜를 섞은 HMAC (비밀값은 환경변수, DB에 남기지 않음)
function visitorHash(ip: string, ua: string, ymd: string): string | null {
    const secret = process.env.LINK_STATS_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!ip || !secret) return null;
    return createHmac('sha256', `${secret}:${ymd}`).update(`${ip}|${ua}`).digest('hex').slice(0, 32);
}

function clientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    return (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '').trim();
}

export async function POST(request: NextRequest) {
    const ua = request.headers.get('user-agent') ?? '';
    if (isBotUserAgent(ua)) return NO_CONTENT();
    // 통계 부풀리기·DB 부하 방지: IP당 분당 60회
    if (!rateLimit(`track:${clientIp(request)}`, 60, MINUTE)) return NO_CONTENT();

    // 다른 사이트에서 보낸 요청은 집계하지 않음
    const origin = request.headers.get('origin');
    if (origin) {
        let originHost = '';
        try {
            originHost = new URL(origin).host;
        } catch {}
        if (originHost !== request.nextUrl.host) return NO_CONTENT();
    }

    let payload: any;
    try {
        payload = JSON.parse(await request.text());
    } catch {
        return NO_CONTENT();
    }

    const slug = typeof payload?.slug === 'string' ? payload.slug.slice(0, 255) : '';
    // view: 페이지 방문, click: 링크·버튼 클릭, video: 소개 영상 첫 재생
    const event = EVENTS.has(payload?.event) ? (payload.event as 'view' | 'click' | 'video') : null;
    const src = typeof payload?.src === 'string' ? payload.src.trim().toLowerCase() : '';
    if (!slug || !event) return NO_CONTENT();

    let linkKey = '';
    let linkKind = '';
    let label = '';
    if (event === 'click') {
        linkKey = typeof payload?.key === 'string' ? payload.key : '';
        linkKind = typeof payload?.kind === 'string' ? payload.kind : '';
        label = typeof payload?.label === 'string' ? payload.label.trim().slice(0, 100) : '';
        if (!LINK_KEY_PATTERN.test(linkKey) || !KINDS.has(linkKind) || !label) return NO_CONTENT();
    }

    const device = deviceFromUserAgent(ua);
    const ip = clientIp(request);

    after(async () => {
        try {
            const org = await prisma.organization.findFirst({
                where: { OR: [{ slug }, ...(/^\d+$/.test(slug) ? [{ id: Number(slug) }] : [])] },
                select: { id: true },
            });
            if (!org) return;

            // 해당 조직에 발급된 /go 코드만 유입 경로로 인정 (그 밖은 direct)
            let sourceCode = 'direct';
            if (src && QR_CODE_PATTERN.test(src)) {
                const qr = await prisma.qrLink.findFirst({ where: { code: src, organization_id: org.id }, select: { id: true } });
                if (qr) sourceCode = src;
            }

            const day = kstDay();
            const hash = visitorHash(ip, ua, day.ymd);
            // 그날 같은 경로·이벤트·링크로 처음 온 사람이면 순방문자 +1
            const seen = hash
                ? await prisma.linkPageEvent.findFirst({
                      where: {
                          organization_id: org.id,
                          visitor_hash: hash,
                          event,
                          source_code: sourceCode,
                          link_key: event === 'click' ? linkKey : null,
                          created_at: { gte: day.start },
                      },
                      select: { id: true },
                  })
                : null;
            const isNewVisitor = !!hash && !seen;

            await prisma.linkPageEvent.create({
                data: {
                    organization_id: org.id,
                    event,
                    link_key: event === 'click' ? linkKey : null,
                    link_kind: event === 'click' ? linkKind : null,
                    source_code: sourceCode,
                    device,
                    visitor_hash: hash,
                },
            });
            await prisma.linkPageDaily.upsert({
                where: {
                    organization_id_date_source_code_event_link_key: {
                        organization_id: org.id,
                        date: day.date,
                        source_code: sourceCode,
                        event,
                        link_key: linkKey,
                    },
                },
                create: {
                    organization_id: org.id,
                    date: day.date,
                    source_code: sourceCode,
                    event,
                    link_key: linkKey,
                    link_kind: linkKind,
                    label,
                    count: 1,
                    unique_count: isNewVisitor ? 1 : 0,
                },
                update: {
                    count: { increment: 1 },
                    ...(isNewVisitor ? { unique_count: { increment: 1 } } : {}),
                    ...(event === 'click' ? { label, link_kind: linkKind } : {}),
                },
            });

            // 원본 이벤트 보관 기간 정리 (별도 크론 없이 요청 100건 중 1건꼴로 수행)
            if (Math.random() < 0.01) {
                const cutoff = new Date(Date.now() - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
                await prisma.linkPageEvent.deleteMany({ where: { created_at: { lt: cutoff } } });
            }
        } catch (error) {
            console.error('링크 페이지 통계 집계 실패:', error);
        }
    });

    return NO_CONTENT();
}
