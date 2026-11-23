// Node / Edge 공용. Node 전용 모듈을 import하지 마십시오 (instrumentation.ts에서도 읽음).
import { isDevMode } from '@/lib/token-config';

/**
 * 링크 통계 비밀값 (방문자 해시·방문 기업 IP 해시·공유 링크 원문 암호화 키 파생).
 * 다른 비밀값(JWT_SECRET 등)으로 대신하지 않음: 한 값이 새면 다른 용도까지 함께 뚫리기 때문.
 * 개발 환경만 경고 후 개발 전용 값을 씀. 그 밖의 환경은 서버 시작 시 instrumentation.ts가 멈춤.
 */
const DEV_ONLY_SECRET = 'dev-only-link-stats-secret';
let warned = false;

export function getLinkStatsSecret(): string {
    const secret = process.env.LINK_STATS_SECRET?.trim();
    if (secret) return secret;
    if (!isDevMode()) {
        throw new Error('LINK_STATS_SECRET 환경 변수가 설정되지 않았습니다.');
    }
    if (!warned) {
        warned = true;
        console.warn('[link-stats] LINK_STATS_SECRET이 없어 개발 전용 값을 사용합니다. 운영·프리뷰에는 반드시 설정하십시오.');
    }
    return DEV_ONLY_SECRET;
}
