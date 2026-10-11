/**
 * 대한민국 주요 지자체 및 도시 표준 지리 좌표 (위도·경도) 맵
 * Schema.org GeoCoordinates 및 로컬 GEO 최적화용
 */
export interface GeoCoordinate {
    lat: number;
    lng: number;
    address: string;
    koreanName?: string;
}

export const REGION_GEO_MAP: Record<string, GeoCoordinate> = {
    anyang: { lat: 37.3943, lng: 126.9568, address: 'South Korea, Gyeonggi-do, Anyang-si', koreanName: '안양시' },
    seongnam: { lat: 37.4200, lng: 127.1265, address: 'South Korea, Gyeonggi-do, Seongnam-si', koreanName: '성남시' },
    busan: { lat: 35.1796, lng: 129.0756, address: 'South Korea, Busan', koreanName: '부산광역시' },
    seoul: { lat: 37.5665, lng: 126.9780, address: 'South Korea, Seoul', koreanName: '서울특별시' },
    incheon: { lat: 37.4563, lng: 126.7052, address: 'South Korea, Incheon', koreanName: '인천광역시' },
    suwon: { lat: 37.2636, lng: 127.0286, address: 'South Korea, Gyeonggi-do, Suwon-si', koreanName: '수원시' },
    yongin: { lat: 37.2411, lng: 127.1776, address: 'South Korea, Gyeonggi-do, Yongin-si', koreanName: '용인시' },
    goyang: { lat: 37.6584, lng: 126.8320, address: 'South Korea, Gyeonggi-do, Goyang-si', koreanName: '고양시' },
    hwaseong: { lat: 37.1995, lng: 126.8315, address: 'South Korea, Gyeonggi-do, Hwaseong-si', koreanName: '화성시' },
    daejeon: { lat: 36.3504, lng: 127.3845, address: 'South Korea, Daejeon', koreanName: '대전광역시' },
    daegu: { lat: 35.8714, lng: 128.6014, address: 'South Korea, Daegu', koreanName: '대구광역시' },
    gwangju: { lat: 35.1595, lng: 126.8526, address: 'South Korea, Gwangju', koreanName: '광주광역시' },
    ulsan: { lat: 35.5384, lng: 129.3114, address: 'South Korea, Ulsan', koreanName: '울산광역시' },
    sejong: { lat: 36.4800, lng: 127.2890, address: 'South Korea, Sejong', koreanName: '세종특별자치시' },
    jeju: { lat: 33.4996, lng: 126.5312, address: 'South Korea, Jeju-do', koreanName: '제주특별자치도' },
};

export const DEFAULT_GEO_COORDINATE: GeoCoordinate = {
    lat: 37.5665,
    lng: 126.9780,
    address: 'South Korea, Seoul',
    koreanName: '대한민국',
};

export function getGeoCoordinateBySlug(slug: string | null | undefined): GeoCoordinate {
    if (!slug) return DEFAULT_GEO_COORDINATE;
    const lower = slug.toLowerCase().trim();
    return REGION_GEO_MAP[lower] || DEFAULT_GEO_COORDINATE;
}
