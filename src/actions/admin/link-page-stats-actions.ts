'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { computeLinkPageStats, type LinkPageStats, type LinkPageStatsRange } from '@/lib/link-page-stats';

export type {
    LinkPageDailyRow,
    LinkPageLinkRow,
    LinkPageSourceRow,
    LinkPageStats,
    LinkPageStatsRange,
    LinkPageTotals,
} from '@/lib/link-page-stats';

// 관리자 화면용 링크 페이지 통계 (집계는 lib/link-page-stats, 외부 공유 페이지와 같은 기준)
export async function getLinkPageStats(organizationId: number, range: LinkPageStatsRange): Promise<LinkPageStats | null> {
    await requireAdmin();
    return computeLinkPageStats(organizationId, range);
}
