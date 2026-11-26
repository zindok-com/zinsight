/** 매거진 목록 카드 작성일 표기 (한국 시간, 예: 2026.10.20) — 메인 슬라이드와 같은 형식 */
export function formatMagazineDate(value: Date | string): string {
    return new Date(value)
        .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul' })
        .replace(/\. /g, '.')
        .replace(/\.$/, '');
}
