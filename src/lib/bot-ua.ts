// 통계 집계에서 제외할 User-Agent: 검색엔진 크롤러, 메신저·SNS 링크 미리보기 봇, 자동화 도구
// (QR 스캔 /go/[code]와 링크 페이지 수집 /api/track이 같은 기준을 사용)
const BOT_UA =
    /bot|crawl|spider|slurp|preview|scrap|headless|lighthouse|facebookexternalhit|facebookcatalog|kakaotalk-scrap|slackbot|twitterbot|telegrambot|discordbot|whatsapp|linkedinbot|skypeuripreview|yeti|daumoa|bingpreview|mediapartners|google-inspectiontool|bytespider|curl|wget|python|httpclient|axios|node-fetch|go-http-client|okhttp|java\//i;

const MOBILE_UA = /mobile|android|iphone|ipad|ipod/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
    // User-Agent가 비어 있는 요청도 사람 방문으로 보지 않음
    return !ua || BOT_UA.test(ua);
}

export function deviceFromUserAgent(ua: string | null | undefined): 'mobile' | 'desktop' {
    return ua && MOBILE_UA.test(ua) ? 'mobile' : 'desktop';
}
