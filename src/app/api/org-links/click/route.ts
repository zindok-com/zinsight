import { NextResponse, after, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { LINK_KEY_PATTERN } from '@/lib/org-links';

// 링크 페이지 링크별 클릭 집계. IP·UA 원문은 저장하지 않고 조직·링크·일자·진입 경로별 건수만 누적
export const dynamic = 'force-dynamic';

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|kakaotalk-scrap|scrap|headless|lighthouse|curl|wget|python|httpclient/i;
const KINDS = new Set(['profile', 'article', 'inquiry', 'home', 'homepage', 'sns', 'brochure', 'shop', 'event', 'custom']);
const NO_CONTENT = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

// KST 기준 오늘 날짜 (DATE 컬럼 저장용 UTC 자정 값)
function kstToday(): Date {
    const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
    return new Date(`${ymd}T00:00:00.000Z`);
}

export async function POST(request: NextRequest) {
    if (BOT_UA.test(request.headers.get('user-agent') ?? '')) return NO_CONTENT();

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
    const key = typeof payload?.key === 'string' ? payload.key : '';
    const kind = typeof payload?.kind === 'string' ? payload.kind : '';
    const label = typeof payload?.label === 'string' ? payload.label.trim().slice(0, 100) : '';
    const entry = payload?.entry === 'qr' ? 'qr' : 'direct';
    if (!slug || !LINK_KEY_PATTERN.test(key) || !KINDS.has(kind) || !label) return NO_CONTENT();

    after(async () => {
        try {
            const org = await prisma.organization.findFirst({
                where: { OR: [{ slug }, ...(/^\d+$/.test(slug) ? [{ id: Number(slug) }] : [])] },
                select: { id: true },
            });
            if (!org) return;
            const date = kstToday();
            await prisma.organizationLinkClickDaily.upsert({
                where: {
                    organization_id_link_key_date_entry: { organization_id: org.id, link_key: key, date, entry },
                },
                create: { organization_id: org.id, link_key: key, link_kind: kind, label, date, entry, count: 1 },
                update: { count: { increment: 1 }, label, link_kind: kind },
            });
        } catch (error) {
            console.error('링크 클릭 집계 실패:', error);
        }
    });

    return NO_CONTENT();
}
