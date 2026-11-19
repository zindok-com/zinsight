import { ShareBrand } from '@/components/share-stats/ShareStatsParts';

// 끊긴·만료된·없는 링크 모두 같은 안내 (링크 존재 여부를 드러내지 않음)
export default function ShareNotFound() {
    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
            <ShareBrand />
            <h1 className="text-lg font-bold">페이지를 열 수 없습니다</h1>
            <p className="text-sm leading-relaxed text-slate-600">
                주소가 잘못되었거나 공유가 끝난 링크입니다.
                <br />
                통계 링크를 받은 담당자에게 새 링크를 요청해 주세요.
            </p>
        </main>
    );
}
