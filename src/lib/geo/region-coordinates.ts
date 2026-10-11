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
    // 경기 남부 핵심 지자체
    anyang: { lat: 37.3943, lng: 126.9568, address: 'South Korea, Gyeonggi-do, Anyang-si', koreanName: '안양시' },
    uiwang: { lat: 37.3448, lng: 126.9682, address: 'South Korea, Gyeonggi-do, Uiwang-si', koreanName: '의왕시' },
    gunpo: { lat: 37.3616, lng: 126.9352, address: 'South Korea, Gyeonggi-do, Gunpo-si', koreanName: '군포시' },
    gwacheon: { lat: 37.4292, lng: 126.9877, address: 'South Korea, Gyeonggi-do, Gwacheon-si', koreanName: '과천시' },
    gwangmyeong: { lat: 37.4786, lng: 126.8647, address: 'South Korea, Gyeonggi-do, Gwangmyeong-si', koreanName: '광명시' },
    siheung: { lat: 37.3802, lng: 126.8029, address: 'South Korea, Gyeonggi-do, Siheung-si', koreanName: '시흥시' },
    ansan: { lat: 37.3219, lng: 126.8309, address: 'South Korea, Gyeonggi-do, Ansan-si', koreanName: '안산시' },
    bucheon: { lat: 37.5034, lng: 126.7660, address: 'South Korea, Gyeonggi-do, Bucheon-si', koreanName: '부천시' },
    seongnam: { lat: 37.4200, lng: 127.1265, address: 'South Korea, Gyeonggi-do, Seongnam-si', koreanName: '성남시' },
    suwon: { lat: 37.2636, lng: 127.0286, address: 'South Korea, Gyeonggi-do, Suwon-si', koreanName: '수원시' },
    yongin: { lat: 37.2411, lng: 127.1776, address: 'South Korea, Gyeonggi-do, Yongin-si', koreanName: '용인시' },
    hwaseong: { lat: 37.1995, lng: 126.8315, address: 'South Korea, Gyeonggi-do, Hwaseong-si', koreanName: '화성시' },
    pyeongtaek: { lat: 36.9921, lng: 127.1129, address: 'South Korea, Gyeonggi-do, Pyeongtaek-si', koreanName: '평택시' },
    osan: { lat: 37.1499, lng: 127.0772, address: 'South Korea, Gyeonggi-do, Osan-si', koreanName: '오산시' },
    anseong: { lat: 37.0080, lng: 127.2797, address: 'South Korea, Gyeonggi-do, Anseong-si', koreanName: '안성시' },
    icheon: { lat: 37.2723, lng: 127.4351, address: 'South Korea, Gyeonggi-do, Icheon-si', koreanName: '이천시' },
    yeoju: { lat: 37.2983, lng: 127.6370, address: 'South Korea, Gyeonggi-do, Yeoju-si', koreanName: '여주시' },
    gwangju_gyeonggi: { lat: 37.4093, lng: 127.2559, address: 'South Korea, Gyeonggi-do, Gwangju-si', koreanName: '광주시(경기)' },
    hanam: { lat: 37.5393, lng: 127.2148, address: 'South Korea, Gyeonggi-do, Hanam-si', koreanName: '하남시' },

    // 경기 북부 지자체
    goyang: { lat: 37.6584, lng: 126.8320, address: 'South Korea, Gyeonggi-do, Goyang-si', koreanName: '고양시' },
    paju: { lat: 37.7600, lng: 126.7799, address: 'South Korea, Gyeonggi-do, Paju-si', koreanName: '파주시' },
    gimpo: { lat: 37.6152, lng: 126.7157, address: 'South Korea, Gyeonggi-do, Gimpo-si', koreanName: '김포시' },
    namyangju: { lat: 37.6360, lng: 127.2165, address: 'South Korea, Gyeonggi-do, Namyangju-si', koreanName: '남양주시' },
    guri: { lat: 37.5943, lng: 127.1296, address: 'South Korea, Gyeonggi-do, Guri-si', koreanName: '구리시' },
    uijeongbu: { lat: 37.7381, lng: 127.0337, address: 'South Korea, Gyeonggi-do, Uijeongbu-si', koreanName: '의정부시' },
    yangju: { lat: 37.7853, lng: 127.0458, address: 'South Korea, Gyeonggi-do, Yangju-si', koreanName: '양주시' },
    pocheon: { lat: 37.8949, lng: 127.2003, address: 'South Korea, Gyeonggi-do, Pocheon-si', koreanName: '포천시' },
    dongducheon: { lat: 37.9036, lng: 127.0607, address: 'South Korea, Gyeonggi-do, Dongducheon-si', koreanName: '동두천시' },
    gapyeong: { lat: 37.8315, lng: 127.5097, address: 'South Korea, Gyeonggi-do, Gapyeong-gun', koreanName: '가평군' },
    yangpyeong: { lat: 37.4917, lng: 127.4875, address: 'South Korea, Gyeonggi-do, Yangpyeong-gun', koreanName: '양평군' },
    yeoncheon: { lat: 38.0964, lng: 127.0749, address: 'South Korea, Gyeonggi-do, Yeoncheon-gun', koreanName: '연천군' },

    // 광역시 및 특별시·자치시
    seoul: { lat: 37.5665, lng: 126.9780, address: 'South Korea, Seoul', koreanName: '서울특별시' },
    incheon: { lat: 37.4563, lng: 126.7052, address: 'South Korea, Incheon', koreanName: '인천광역시' },
    busan: { lat: 35.1796, lng: 129.0756, address: 'South Korea, Busan', koreanName: '부산광역시' },
    daegu: { lat: 35.8714, lng: 128.6014, address: 'South Korea, Daegu', koreanName: '대구광역시' },
    daejeon: { lat: 36.3504, lng: 127.3845, address: 'South Korea, Daejeon', koreanName: '대전광역시' },
    gwangju: { lat: 35.1595, lng: 126.8526, address: 'South Korea, Gwangju', koreanName: '광주광역시' },
    ulsan: { lat: 35.5384, lng: 129.3114, address: 'South Korea, Ulsan', koreanName: 'ulsan광역시' },
    sejong: { lat: 36.4800, lng: 127.2890, address: 'South Korea, Sejong', koreanName: '세종특별자치시' },
    jeju: { lat: 33.4996, lng: 126.5312, address: 'South Korea, Jeju-do', koreanName: '제주특별자치도' },

    // 지방 거점 주요 지자체
    cheongju: { lat: 36.6424, lng: 127.4890, address: 'South Korea, Chungcheongbuk-do, Cheongju-si', koreanName: '청주시' },
    cheonan: { lat: 36.8151, lng: 127.1139, address: 'South Korea, Chungcheongnam-do, Cheonan-si', koreanName: '천안시' },
    jeonju: { lat: 35.8242, lng: 127.1480, address: 'South Korea, Jeollabuk-do, Jeonju-si', koreanName: '전주시' },
    changwon: { lat: 35.2280, lng: 128.6811, address: 'South Korea, Gyeongsangnam-do, Changwon-si', koreanName: '창원시' },
    pohang: { lat: 36.0190, lng: 129.3435, address: 'South Korea, Gyeongsangbuk-do, Pohang-si', koreanName: '포항시' },
    wonju: { lat: 37.3422, lng: 127.9202, address: 'South Korea, Gangwon-do, Wonju-si', koreanName: '원주시' },
    chuncheon: { lat: 37.8813, lng: 127.7298, address: 'South Korea, Gangwon-do, Chuncheon-si', koreanName: '춘천시' },
};

export const DEFAULT_GEO_COORDINATE: GeoCoordinate = {
    lat: 37.5665,
    lng: 126.9780,
    address: 'South Korea, Seoul',
    koreanName: '대한민국',
};

export function getGeoCoordinateBySlug(slugOrName: string | null | undefined): GeoCoordinate {
    if (!slugOrName) return DEFAULT_GEO_COORDINATE;
    const lower = slugOrName.toLowerCase().trim();
    
    // 1. 슬러그 직접 일치
    if (REGION_GEO_MAP[lower]) return REGION_GEO_MAP[lower];
    
    // 2. 한국어 지자체명 기반 Fallback (예: '의왕시', '의왕', '광명' 등 매칭)
    const normalized = lower.replace(/(시|군|구)$/, '');
    const foundByName = Object.values(REGION_GEO_MAP).find((geo) => {
        if (!geo.koreanName) return false;
        const geoNorm = geo.koreanName.replace(/(시|군|구)$/, '');
        return geo.koreanName === lower || geoNorm === normalized;
    });
    if (foundByName) return foundByName;

    return DEFAULT_GEO_COORDINATE;
}
