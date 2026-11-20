/**
 * 조직 외부 링크 → 공식 채널(organization_channels) 이전 + 기존 클릭 키(auto:{n}·link:{id}) → ch:{id} 매핑
 *
 * 실행 (기본은 계획만 출력, DB 변경 없음):
 *   npx ts-node -T -O '{"module":"commonjs","moduleResolution":"node"}' scripts/migrate-org-channels.ts
 * 실제 반영:
 *   ... scripts/migrate-org-channels.ts --apply
 * 한 조직만:  --org 233
 *
 * - 공식 채널이 이미 있는 조직은 채널을 만들지 않고, 남은 auto:/link: 클릭만 그 채널로 매핑한다 (다시 실행해도 안전)
 * - 채널 원본: company_url(대표 홈페이지) + backlinks + brochure_url + extra_materials, 그리고 링크 페이지 등록 링크(organization_links)
 * - 기존 컬럼(company_url·backlinks·brochure_url·extra_materials·organization_links)은 지우거나 바꾸지 않는다 (되돌리기용)
 * - auto:{n} 매핑은 이전 규칙의 기본 목록 n번째 주소로 찾고, 집계에 남은 '당시 문구'가 맞을 때만 바꾼다. 안 맞으면 보고만
 */
import 'dotenv/config';
import { prisma } from '../src/lib/db';
import {
    CHANNEL_TYPES,
    channelsFromLegacy,
    detectChannelType,
    normalizeChannelUrl,
    sameChannelUrl,
    smartstoreRootOf,
    type ChannelType,
    type PreparedChannel,
} from '../src/lib/org-channels';
import { deriveDefaultOrgLinks } from '../src/lib/org-links';

const APPLY = process.argv.includes('--apply');
const orgArg = process.argv.indexOf('--org');
const ONLY_ORG = orgArg !== -1 ? Number(process.argv[orgArg + 1]) : null;

type LegacyRow = { id: number; label: string; url: string; kind: string; display: string; subtitle: string | null; thumbnail_url: string | null; sort_order: number; is_visible: boolean };
type PlannedChannel = PreparedChannel & { card?: { display: string; subtitle: string | null; thumbnail_url: string | null; sort_order: number; is_visible: boolean } };

const LEGACY_KIND_TYPE: Record<string, ChannelType> = { homepage: 'homepage', brochure: 'brochure', shop: 'smartstore' };

/** 비교용 주소: 정리 + 스마트스토어 상품 주소는 스토어 주소 */
function matchKey(url: string): string {
    const n = normalizeChannelUrl(url);
    const u = n.ok ? n.url : url.trim();
    return smartstoreRootOf(u) ?? u;
}

function findChannel<T extends { url: string }>(channels: T[], url: string): T | undefined {
    const key = matchKey(url);
    return channels.find((c) => sameChannelUrl(c.url, key));
}

function planChannels(org: { company_url: string | null; backlinks: unknown; brochure_url: string | null; extra_materials: unknown }, legacyRows: LegacyRow[], notes: string[]) {
    const fromProfile = channelsFromLegacy(org);
    notes.push(...fromProfile.notes);
    const planned: PlannedChannel[] = fromProfile.channels.map((c) => ({ ...c }));

    // 링크 페이지 등록 링크: 같은 주소면 카드 설정만 붙이고, 없는 주소면 채널로 추가
    for (const row of legacyRows) {
        const n = normalizeChannelUrl(row.url);
        if (!n.ok) {
            notes.push(`건너뜀(등록 링크 주소 오류): link:${row.id} ${row.url}`);
            continue;
        }
        const card = { display: row.display, subtitle: row.subtitle, thumbnail_url: row.thumbnail_url, sort_order: row.sort_order, is_visible: row.is_visible };
        const existing = findChannel(planned, row.url);
        if (existing) {
            existing.card = card;
            continue;
        }
        const type: ChannelType = detectChannelType(n.url) ?? LEGACY_KIND_TYPE[row.kind] ?? 'other';
        const finalType = type;
        const label = row.label.trim() && row.label.trim() !== CHANNEL_TYPES[finalType].defaultText ? row.label.trim().slice(0, 100) : null;
        if (finalType === 'other') notes.push(`기타로 분류(등록 링크): ${row.label} ${n.url}`);
        planned.push({
            id: null,
            type: finalType,
            url: smartstoreRootOf(n.url) ?? n.url,
            label: finalType === 'other' ? label ?? '바로가기' : label,
            is_primary: finalType === 'homepage' && !planned.some((c) => c.is_primary),
            card,
        });
    }

    // 등록 링크가 있던 조직: 등록 목록에 없던 채널은 카드에서 숨겨 지금 카드 모습을 유지
    if (legacyRows.length > 0) {
        const maxOrder = Math.max(0, ...legacyRows.map((r) => r.sort_order));
        for (const [i, c] of planned.entries()) {
            if (!c.card) c.card = { display: CHANNEL_TYPES[c.type].defaultDisplay, subtitle: null, thumbnail_url: null, sort_order: maxOrder + 1 + i, is_visible: false };
        }
    }
    return planned;
}

async function main() {
    console.log(`=== 공식 채널 이전 (${APPLY ? '반영' : '계획만, DB 변경 없음'}) ===`);
    const orgs = await prisma.organization.findMany({
        where: ONLY_ORG ? { id: ONLY_ORG } : {},
        orderBy: { id: 'asc' },
        select: {
            id: true,
            company_name: true,
            company_url: true,
            backlinks: true,
            brochure_url: true,
            extra_materials: true,
            links: { orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] },
            channels: { where: { deleted_at: null }, orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] },
        },
    });

    const otherList: string[] = [];
    const unmappedList: string[] = [];

    for (const org of orgs) {
        const notes: string[] = [];
        console.log(`\n[${org.id}] ${org.company_name}`);

        // 1. 채널 계획
        let channels: Array<{ id: number | null; url: string; type: ChannelType }> = org.channels.map((c) => ({ id: c.id, url: c.url, type: c.channel_type as ChannelType }));
        let planned: PlannedChannel[] = [];
        if (org.channels.length > 0) {
            console.log(`  공식 채널 이미 있음 ${org.channels.length}개 → 채널 생성 건너뜀`);
        } else {
            planned = planChannels(org, org.links as LegacyRow[], notes);
            channels = planned.map((c) => ({ id: null, url: c.url, type: c.type }));
            for (const [i, c] of planned.entries()) {
                const card = c.card ? ` · 카드 ${c.card.display}${c.card.is_visible ? '' : '(숨김)'}` : '';
                console.log(`  + ${i + 1}. ${c.type}${c.is_primary ? '(대표)' : ''} ${c.url}${c.label ? ` "${c.label}"` : ''}${card}`);
            }
        }
        for (const n of notes) {
            console.log(`  · ${n}`);
            if (n.startsWith('기타로 분류')) otherList.push(`[${org.id}] ${org.company_name}: ${n}`);
        }

        // 2. 클릭 키 매핑 계획 (auto:{n} → 이전 규칙 기본 목록 n번째 주소, link:{id} → 등록 링크 주소)
        const derived = deriveDefaultOrgLinks(org);
        const legacyKeys = await prisma.linkPageDaily.groupBy({
            by: ['link_key', 'label'],
            where: { organization_id: org.id, OR: [{ link_key: { startsWith: 'auto:' } }, { link_key: { startsWith: 'link:' } }] },
            _sum: { count: true },
        });
        const keyMap = new Map<string, number>(); // 이전 키 → planned/channels 인덱스
        const byKey = new Map<string, { labels: Set<string>; count: number }>();
        for (const k of legacyKeys) {
            const item = byKey.get(k.link_key) ?? { labels: new Set<string>(), count: 0 };
            item.labels.add(k.label);
            item.count += k._sum.count ?? 0;
            byKey.set(k.link_key, item);
        }
        for (const [key, info] of byKey) {
            let url: string | null = null;
            let expectedLabel: string | null = null;
            if (key.startsWith('auto:')) {
                const d = derived[Number(key.slice(5))];
                url = d?.url ?? null;
                expectedLabel = d?.label ?? null;
            } else {
                const row = org.links.find((l) => l.id === Number(key.slice(5)));
                url = row?.url ?? null;
                expectedLabel = row?.label ?? null;
            }
            const labelOk = expectedLabel !== null && [...info.labels].every((l) => l === expectedLabel || l === '');
            const index = url ? channels.findIndex((c) => sameChannelUrl(c.url, matchKey(url!))) : -1;
            if (!url || index === -1 || !labelOk) {
                const reason = !url ? '원래 링크를 찾을 수 없음' : index === -1 ? `채널 없음(${url})` : `문구 불일치(기록: ${[...info.labels].join('/')}, 현재 규칙: ${expectedLabel})`;
                console.log(`  ! ${key} 클릭 ${info.count} → 매핑 안 함: ${reason}`);
                unmappedList.push(`[${org.id}] ${org.company_name}: ${key} 클릭 ${info.count} — ${reason}`);
                continue;
            }
            keyMap.set(key, index);
            console.log(`  → ${key} "${[...info.labels].join('/')}" 클릭 ${info.count} → 채널 ${index + 1}번(${channels[index].type})`);
        }

        if (!APPLY) continue;

        // 3. 반영 (조직 단위 트랜잭션)
        const before = await prisma.linkPageDaily.aggregate({ where: { organization_id: org.id, event: 'click' }, _sum: { count: true } });
        await prisma.$transaction(async (tx) => {
            const ids: number[] = channels.map((c) => c.id ?? 0);
            for (const [i, c] of planned.entries()) {
                const created = await tx.organizationChannel.create({
                    data: { organization_id: org.id, channel_type: c.type, url: c.url, label: c.label, is_primary: c.is_primary, sort_order: i },
                });
                ids[i] = created.id;
                if (c.card) {
                    await tx.organizationCardItem.create({
                        data: { organization_id: org.id, channel_id: created.id, display: c.card.display, subtitle: c.card.subtitle, thumbnail_url: c.card.thumbnail_url, sort_order: c.card.sort_order, is_visible: c.card.is_visible },
                    });
                }
            }

            for (const [oldKey, index] of keyMap) {
                const newKey = `ch:${ids[index]}`;
                const rows = await tx.linkPageDaily.findMany({ where: { organization_id: org.id, link_key: oldKey } });
                for (const r of rows) {
                    const clash = await tx.linkPageDaily.findUnique({
                        where: { organization_id_date_source_code_event_link_key: { organization_id: org.id, date: r.date, source_code: r.source_code, event: r.event, link_key: newKey } },
                    });
                    if (clash) {
                        // 같은 날·경로에 새 키 행이 이미 있으면 합침 (순방문자는 합산: 같은 사람이 두 키로 눌렀으면 약간 많게 잡힘)
                        await tx.linkPageDaily.update({ where: { id: clash.id }, data: { count: clash.count + r.count, unique_count: clash.unique_count + r.unique_count } });
                        await tx.linkPageDaily.delete({ where: { id: r.id } });
                    } else {
                        await tx.linkPageDaily.update({ where: { id: r.id }, data: { link_key: newKey } });
                    }
                }
                await tx.linkPageEvent.updateMany({ where: { organization_id: org.id, link_key: oldKey }, data: { link_key: newKey } });
            }
        });
        const after = await prisma.linkPageDaily.aggregate({ where: { organization_id: org.id, event: 'click' }, _sum: { count: true } });
        const ok = (before._sum.count ?? 0) === (after._sum.count ?? 0);
        console.log(`  ✓ 반영 완료 · 클릭 합계 ${before._sum.count ?? 0} → ${after._sum.count ?? 0} ${ok ? '(같음)' : '(다름! 확인 필요)'}`);
    }

    console.log('\n=== 기타로 옮긴 항목 ===');
    console.log(otherList.length ? otherList.join('\n') : '(없음)');
    console.log('\n=== 매핑하지 않은 클릭 ===');
    console.log(unmappedList.length ? unmappedList.join('\n') : '(없음)');
    if (!APPLY) console.log('\n계획만 출력했습니다. 반영하려면 --apply 를 붙여 다시 실행하세요.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
