import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Settings, Info, Lock, Mail, Scale } from 'lucide-react';

const domain = process.env.DOMAIN || 'zinsight.co.kr';
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    title: '개인정보처리방침',
    description: '진사이트(Zinsight) 개인정보처리방침. 개인정보 수집 목적, 보유 기간, GA4 쿠키 수집 거부 및 보안 관리 대책을 안내합니다.',
    alternates: {
        canonical: `${baseUrl}/privacy`,
    },
};

const sections = [
    { id: 'sec-1', title: '제1조 (처리 목적)' },
    { id: 'sec-2', title: '제2조 (수집하는 항목)' },
    { id: 'sec-3', title: '제3조 (보유 및 이용기간)' },
    { id: 'sec-4', title: '제4조 (GA4 쿠키 거부 가이드)' },
    { id: 'sec-5', title: '제5조 (안전성 확보 조치)' },
    { id: 'sec-6', title: '제6조 (보호책임자 및 문의)' },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface pb-24">
            <main className="mx-auto max-w-[1024px] px-6 pt-16">
                
                {/* ─────────────────────────────── */}
                {/* 헤더 섹션 */}
                {/* ─────────────────────────────── */}
                <div className="text-center mb-16">
                    <h1 className="font-h1 text-[36px] md:text-[44px] leading-tight text-zi-primary mb-4 tracking-tight uppercase">
                        Privacy Policy
                    </h1>
                    <p className="text-body-md text-zi-on-surface-variant max-w-lg mx-auto">
                        Zinsight는 회원님의 개인정보를 매우 소중하게 다루며, 개인정보보호법에 의거하여 권리와 보안을 철저하게 준수하고 보호합니다.
                    </p>
                </div>

                {/* ─────────────────────────────── */}
                {/* 미려한 탭 스위처 */}
                {/* ─────────────────────────────── */}
                <div className="flex justify-center border-b border-zi-divider mb-16">
                    <div className="flex gap-12 font-ui-label text-ui-label font-bold tracking-widest text-[14px]">
                        <Link 
                            href="/terms" 
                            className="pb-4 border-b-2 border-transparent text-zi-outline hover:text-zi-primary uppercase transition-all"
                        >
                            이용약관 (Terms)
                        </Link>
                        <Link 
                            href="/privacy" 
                            className="pb-4 border-b-2 border-zi-primary text-zi-primary uppercase transition-all"
                        >
                            개인정보처리방침 (Privacy)
                        </Link>
                    </div>
                </div>

                {/* ─────────────────────────────── */}
                {/* 2열 메인 레이아웃 */}
                {/* ─────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* 좌측 스티키 앵커 메뉴 (Desktop 전용) */}
                    <aside className="hidden lg:block lg:col-span-4 sticky top-24 bg-zi-surface-container-low/40 p-6 rounded-zi-card border border-zi-divider">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zi-divider">
                            <Shield className="w-5 h-5 text-zi-primary" />
                            <span className="font-ui-label text-ui-label font-bold text-zi-primary tracking-widest uppercase">
                                Quick Navigation
                            </span>
                        </div>
                        <nav className="flex flex-col gap-3 font-ui-label text-[13px]">
                            {sections.map((sec) => (
                                <a 
                                    key={sec.id} 
                                    href={`#${sec.id}`}
                                    className="text-zi-on-surface-variant hover:text-zi-primary hover:underline transition-colors block leading-relaxed"
                                >
                                    {sec.title}
                                </a>
                            ))}
                        </nav>
                    </aside>

                    {/* 우측 방침 본문 기술 */}
                    <div className="lg:col-span-8 flex flex-col gap-12">
                        
                        <div className="text-right text-[12px] text-zi-outline font-ui-label mb-4">
                            시행일자: 2026년 5월 18일
                        </div>

                        {/* 제1조 */}
                        <section id="sec-1" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">01</span>
                                제1조 (개인정보의 처리 목적)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>주식회사 Zinsight(이하 &quot;회사&quot;)는 다음의 목적을 위해 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 사전 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                                <p>1. <strong>회원 가입 및 관리</strong>: 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 제한적 본인확인제 시행에 따른 본인확인, 서비스 부정 이용 방지, 각종 고지·통지 등을 목적으로 개인정보를 처리합니다.</p>
                                <p>2. <strong>B2B 서비스 및 콘텐츠 제공</strong>: 인사이트 레이더(Insight Radar) 대시보드 맞춤 제공, 유료 서비스 요금 결제 및 정산, 뉴스레터 및 타겟 매거진 콘텐츠 발송 등을 목적으로 개인정보를 처리합니다.</p>
                            </div>
                        </section>

                        {/* 제2조 */}
                        <section id="sec-2" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">02</span>
                                제2조 (수집하는 개인정보의 항목)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>회사는 서비스 제공을 위해 최소한의 항목을 다음과 같이 수집하고 있습니다.</p>
                                <div className="bg-zi-surface-container-low rounded-zi-card p-5 border border-zi-divider flex flex-col gap-3 text-[13.5px]">
                                    <p>• <strong>회원가입 시 (필수)</strong>: 이메일 주소(아이디), 비밀번호, 이름, 회사명, 부서/직책</p>
                                    <p>• <strong>뉴스레터 및 매거진 구독 신청 시 (선택)</strong>: 이메일 주소</p>
                                    <p>• <strong>인터넷 서비스 이용 과정에서 자동 생성되어 수집되는 항목</strong>: IP 주소, 쿠키(Cookie), 방문 일시, 서비스 이용 기록, 브라우저 유형, Vercel/Next.js 호스트 네트워크 시스템 로그</p>
                                </div>
                            </div>
                        </section>

                        {/* 제3조 */}
                        <section id="sec-3" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">03</span>
                                제3조 (개인정보의 보유 및 이용기간)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 회원으로부터 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리 및 보유합니다.</p>
                                <p>2. <strong>보유 기간</strong>: 회원의 개인정보는 회원 탈퇴 시 또는 뉴스레터 구독 해지 시 즉시 파기하는 것을 원칙으로 합니다.</p>
                                <p>3. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.</p>
                                <ul className="list-disc pl-5 flex flex-col gap-1.5 text-[14px]">
                                    <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                                    <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                                    <li>접속 로그 기록: 3개월 (통신비밀보호법)</li>
                                </ul>
                            </div>
                        </section>

                        {/* 제4조 (GA4 쿠키 설명 및 거부 가이드 - 강조 카드) */}
                        <section id="sec-4" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-6 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">04</span>
                                제4조 (개인정보 자동 수집 장치의 설치·운영 및 거부)
                            </h2>
                            
                            <div className="bg-zi-blue/5 border border-zi-blue/20 rounded-zi-card p-6 mb-6 flex items-start gap-4">
                                <Settings className="w-6 h-6 text-zi-blue shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-h4 text-[16px] text-zi-blue font-bold mb-2">
                                        구글 애널리틱스(GA4) 분석 대응에 대한 고지
                                    </h4>
                                    <p className="text-[13.5px] text-zi-on-surface-variant leading-relaxed">
                                        본 사이트는 유저의 방문 패턴 및 통계 분석을 목적으로 Google Analytics(GA4)를 사용하여 분석용 쿠키 데이터를 임시 수집합니다. 수집된 분석 정보는 마케팅 개선을 위해서만 활용됩니다.
                                    </p>
                                </div>
                            </div>

                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>1. <strong>쿠키(Cookie)란?</strong>: 쿠키는 웹사이트를 운영하는데 이용되는 서버가 회원의 브라우저에 보내는 아주 작은 텍스트 파일로서 회원의 컴퓨터 하드디스크에 저장됩니다.</p>
                                <p>2. <strong>수집 거부 방법</strong>: 회원은 쿠키 설치에 대한 선택권을 가지고 있습니다. 브라우저 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다. 다만, 쿠키 저장을 거부할 경우 일부 개인화 서비스 및 자동 로그인이 필요한 기능의 이용에 어려움이 있을 수 있습니다.</p>
                                
                                <div className="bg-zi-surface-container-low rounded-zi-card p-5 border border-zi-divider">
                                    <h4 className="font-bold text-[14px] text-zi-primary mb-3 flex items-center gap-1.5">
                                        <Info className="w-4 h-4 text-zi-outline" />
                                        대표 브라우저별 쿠키 수집 거부 설정 경로
                                    </h4>
                                    <ul className="flex flex-col gap-2.5 text-[13px] leading-relaxed text-zi-on-surface-variant">
                                        <li>• <strong>Chrome</strong>: 우측 상단 더보기 ➔ 설정 ➔ 개인정보 및 보안 ➔ 서드 파티 쿠키 ➔ 쿠키 차단 설정</li>
                                        <li>• <strong>Apple Safari</strong>: 설정 ➔ 개인정보 보호 ➔ 모든 쿠키 차단 또는 웹사이트 데이터 관리</li>
                                        <li>• <strong>Microsoft Edge</strong>: 우측 상단 설정 ➔ 쿠키 및 사이트 권한 ➔ 쿠키 및 사이트 데이터 관리 및 삭제</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 제5조 */}
                        <section id="sec-5" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">05</span>
                                제5조 (개인정보의 안전성 확보 조치)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적, 관리적 및 물리적 조치를 취하고 있습니다.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13.5px]">
                                    <div className="p-4 bg-zi-surface-container-low border border-zi-divider rounded-zi-card flex gap-3">
                                        <Lock className="w-5 h-5 text-zi-outline shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-bold text-zi-primary mb-1">비밀번호 단방향 암호화</h5>
                                            <p className="text-[12.5px] leading-normal text-zi-on-surface-variant">회원의 비밀번호는 단방향 해시 함수 알고리즘을 통해 철저히 암호화되어 관리되며, 관리자도 알 수 없습니다.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zi-surface-container-low border border-zi-divider rounded-zi-card flex gap-3">
                                        <Shield className="w-5 h-5 text-zi-outline shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-bold text-zi-primary mb-1">HTTPS 암호화 통신</h5>
                                            <p className="text-[12.5px] leading-normal text-zi-on-surface-variant">Vercel SSL 프로토콜을 탑재하여 사용자와 웹 서버 간 오가는 모든 패킷 데이터를 안전하게 암호화 전송합니다.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 제6조 */}
                        <section id="sec-6" className="scroll-mt-24 pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">06</span>
                                제6조 (개인정보 보호책임자 및 문의)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                                
                                <div className="bg-zi-surface-container-low border border-zi-divider rounded-zi-card p-5 flex items-start gap-4">
                                    <Mail className="w-5 h-5 text-zi-primary shrink-0 mt-0.5" />
                                    <div className="text-[13.5px] leading-relaxed">
                                        <p>• <strong>담당 부서</strong>: Zinsight 개인정보보호 및 기술지원 운영실</p>
                                        <p>• <strong>보호책임자 직책</strong>: 최고보안책임자 (CISO)</p>
                                        <p>• <strong>문의 이메일</strong>: <a href="mailto:support@zinsight.co.kr" className="text-zi-primary font-semibold hover:underline">support@zinsight.co.kr</a></p>
                                    </div>
                                </div>
                                <p className="text-[13.5px]">회원님께서는 회사의 서비스(또는 화면)를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있으며, 회사는 신속하고 성실하게 답변해 드릴 예정입니다.</p>
                            </div>
                        </section>

                    </div>
                </div>

            </main>
        </div>
    );
}
