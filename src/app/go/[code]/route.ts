import { NextResponse, after, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { SITE_BASE_URL } from '@/lib/site';
import { buildQrDestination } from '@/lib/qr-link';

// 모드 변경이 바로 반영되도록 캐시하지 않음 (301 금지, 302 + no-store)
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow' };

// 메신저 링크 미리보기·검색 크롤러는 스캔 집계에서 제외
const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|kakaotalk-scrap|scrap|headless|lighthouse|curl|wget|python|httpclient/i;
const MOBILE_UA = /mobile|android|iphone|ipad|ipod/i;

function redirectTo(location: string) {
    return NextResponse.redirect(location, { status: 302, headers: NO_STORE });
}

// KST 기준 오늘 날짜 (DATE 컬럼 저장용 UTC 자정 값)
function kstToday(): Date {
    const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
    return new Date(`${ymd}T00:00:00.000Z`);
}

async function handle(request: NextRequest, code: string, countScan: boolean) {
    const normalized = code.trim().toLowerCase();
    const link = await prisma.qrLink
        .findUnique({
            where: { code: normalized },
            include: { organization: { select: { id: true, slug: true } } },
        })
        .catch(() => null);

    // 미등록·비활성 code는 홈으로
    if (!link || !link.is_active) return redirectTo(`${SITE_BASE_URL}/`);

    const ua = request.headers.get('user-agent') ?? '';
    const purpose = request.headers.get('sec-purpose') ?? request.headers.get('purpose') ?? '';
    if (countScan && !BOT_UA.test(ua) && !/prefetch/i.test(purpose)) {
        const device = MOBILE_UA.test(ua) ? 'mobile' : 'desktop';
        const date = kstToday();
        // 응답을 먼저 보내고 집계는 뒤에서 처리 (리다이렉트 지연 방지)
        after(async () => {
            await prisma.qrScanDaily
                .upsert({
                    where: { qr_link_id_date_device: { qr_link_id: link.id, date, device } },
                    create: { qr_link_id: link.id, date, device, count: 1 },
                    update: { count: { increment: 1 } },
                })
                .catch((error) => console.error('QR 스캔 집계 실패:', error));
        });
    }

    const slugOrId = link.organization.slug || String(link.organization.id);
    return redirectTo(buildQrDestination(normalized, slugOrId, link.mode));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    return handle(request, code, true);
}

// curl -I 등 HEAD 요청은 같은 응답을 주되 집계하지 않음
export async function HEAD(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    return handle(request, code, false);
}
