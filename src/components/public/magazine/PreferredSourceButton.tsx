// Server Component — 마크업만 출력, publisher.js 가 자동으로 스캔·초기화합니다.
export function PreferredSourceButton() {
    return (
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        // @ts-ignore — google-add-preferred-source-btn 은 Google SWG 비표준 HTML 속성
        <div google-add-preferred-source-btn="" data-theme="light" />
    );
}
