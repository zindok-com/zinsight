import type { Metadata } from 'next';

// 초대 토큰이 담긴 등록 페이지는 검색 노출 대상이 아님
export const metadata: Metadata = {
    title: '기관 정보 등록',
    robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return children;
}
