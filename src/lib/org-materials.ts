import { safeHttpUrl } from '@/lib/utils';

/** 소개자료 외 추가 자료 버튼 (제안서·카탈로그 등). 버튼 이름은 관리자가 정한다. */
export type ExtraMaterial = {
    label: string;
    url: string;
};

export const EXTRA_MATERIALS_MAX = 5;
export const EXTRA_MATERIAL_LABEL_MAX = 30;

/**
 * 저장·표시 전 정리: 이름과 http(s) 주소가 모두 있는 항목만, 최대 5개.
 * DB의 Json 값이나 관리자 입력 어느 쪽을 넣어도 된다.
 */
export function normalizeExtraMaterials(input: unknown): ExtraMaterial[] {
    if (!Array.isArray(input)) return [];
    const result: ExtraMaterial[] = [];
    for (const raw of input) {
        const label = String((raw as { label?: unknown })?.label ?? '').trim().slice(0, EXTRA_MATERIAL_LABEL_MAX);
        const url = safeHttpUrl(String((raw as { url?: unknown })?.url ?? '').trim());
        if (!label || !url || url.length > 512) continue;
        result.push({ label, url });
        if (result.length >= EXTRA_MATERIALS_MAX) break;
    }
    return result;
}
