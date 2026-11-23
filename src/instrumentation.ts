import { getLinkStatsSecret } from '@/lib/link-stats-secret';

/** 서버 인스턴스 시작 시 1회: 필수 비밀값이 없으면 요청을 받기 전에 멈춤 (개발 환경은 경고만) */
export function register() {
    getLinkStatsSecret();
}
