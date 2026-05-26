import Link from 'next/link';

export function PublicFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-zi-divider bg-white">
            <div className="mx-auto max-w-zi-container px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-col items-start justify-between gap-8 sm:gap-12 md:flex-row">
                    {/* 브랜드 블록 */}
                    <div className="max-w-xs">
                        <span className="mb-3 block text-lg font-bold text-zi-primary">Zinsight</span>
                        <p className="mb-0 text-[13px] text-slate-500 leading-relaxed">
                            복잡한 데이터를 명료한 인사이트로 전환하여<br className="hidden sm:inline" /> 비즈니스의 미래를 제시합니다.
                        </p>
                    </div>

                    {/* 링크 그리드 — 항상 3열 */}
                    <div className="grid grid-cols-3 gap-4 sm:gap-8 md:gap-12 w-full md:w-auto">
                        <div className="flex flex-col gap-2 sm:gap-3">
                            <span className="text-[11px] sm:text-zi-label font-bold uppercase text-zi-primary tracking-wider">탐색</span>
                            <Link href="/insight-radar" className="text-[12px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug">인사이트 레이더</Link>
                            <Link href="/magazine" className="text-[12px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug">매거진 아카이브</Link>
                        </div>
                        <div className="flex flex-col gap-2 sm:gap-3">
                            <span className="text-[11px] sm:text-zi-label font-bold uppercase text-zi-primary tracking-wider">정보</span>
                            <Link href="https://www.zindok.com" target="_blank" className="text-[12px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug">Zinsight 소개</Link>
                            <Link href="https://www.zindok.com" target="_blank" className="text-[12px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug">문의하기</Link>
                        </div>
                        <div className="flex flex-col gap-2 sm:gap-3">
                            <span className="text-[11px] sm:text-zi-label font-bold uppercase text-zi-primary tracking-wider">법령</span>
                            <Link href="/terms" className="text-[12px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug">이용약관</Link>
                            <Link href="/privacy" className="text-[12px] sm:text-zi-body-md text-slate-500 hover:underline decoration-1 leading-snug">개인정보처리방침</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 하단 저작권 바 */}
            <div className="border-t border-zi-divider">
                <div className="mx-auto flex max-w-zi-container flex-col items-center justify-between gap-2 px-4 sm:px-6 py-5 md:flex-row">
                    <p className="text-xs font-medium tracking-wide text-slate-400">
                        © {currentYear} Zinsight. All rights reserved.
                    </p>
                    <p className="text-xs font-medium tracking-wide text-slate-400">
                        Designed for Intelligent Decision Making.
                    </p>
                </div>
            </div>
        </footer>
    );
}
