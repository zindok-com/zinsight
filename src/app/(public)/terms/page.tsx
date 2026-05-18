import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, FileText, Ban, AlertTriangle, Scale } from 'lucide-react';

const domain = process.env.DOMAIN || 'zinsight.co.kr';
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    title: '이용약관 | Zinsight',
    description: 'Zinsight 서비스 이용약관. 콘텐츠 저작권 보호, 무단 크롤링 금지 및 면책 조항을 명시합니다.',
    alternates: {
        canonical: `${baseUrl}/terms`,
    },
};

const sections = [
    { id: 'sec-1', title: '제1조 (목적)' },
    { id: 'sec-2', title: '제2조 (용어의 정의)' },
    { id: 'sec-3', title: '제3조 (약관의 개정 및 효력)' },
    { id: 'sec-4', title: '제4조 (서비스의 제공 및 변경)' },
    { id: 'sec-5', title: '제5조 (지식재산권 및 크롤링 금지)' },
    { id: 'sec-6', title: '제6조 (회사의 책임 제한 및 면책)' },
    { id: 'sec-7', title: '제7조 (손해배상 및 관할법원)' },
];

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface pb-24">
            <main className="mx-auto max-w-[1024px] px-6 pt-16">
                
                {/* ─────────────────────────────── */}
                {/* 헤더 섹션 */}
                {/* ─────────────────────────────── */}
                <div className="text-center mb-16">
                    <h1 className="font-h1 text-[36px] md:text-[44px] leading-tight text-zi-primary mb-4 tracking-tight uppercase">
                        Terms of Service
                    </h1>
                    <p className="text-body-md text-zi-on-surface-variant max-w-lg mx-auto">
                        Zinsight 플랫폼 및 서비스 이용에 관한 권리와 의무, 핵심적인 법적 제한 사항을 안내해 드립니다.
                    </p>
                </div>

                {/* ─────────────────────────────── */}
                {/* 미려한 탭 스위처 */}
                {/* ─────────────────────────────── */}
                <div className="flex justify-center border-b border-zi-divider mb-16">
                    <div className="flex gap-12 font-ui-label text-ui-label font-bold tracking-widest text-[14px]">
                        <Link 
                            href="/terms" 
                            className="pb-4 border-b-2 border-zi-primary text-zi-primary uppercase transition-all"
                        >
                            이용약관 (Terms)
                        </Link>
                        <Link 
                            href="/privacy" 
                            className="pb-4 border-b-2 border-transparent text-zi-outline hover:text-zi-primary uppercase transition-all"
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
                            <Scale className="w-5 h-5 text-zi-primary" />
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

                    {/* 우측 약관 본문 기술 */}
                    <div className="lg:col-span-8 flex flex-col gap-12">
                        
                        <div className="text-right text-[12px] text-zi-outline font-ui-label mb-4">
                            시행일자: 2026년 5월 18일
                        </div>

                        {/* 제1조 */}
                        <section id="sec-1" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">01</span>
                                제1조 (목적)
                            </h2>
                            <p className="text-body-md text-zi-on-surface-variant leading-[1.8]">
                                본 약관은 주식회사 Zinsight(이하 &quot;회사&quot;)가 운영하는 온라인 B2B 비즈니스 인텔리전스 플랫폼 및 매거진 서비스(이하 &quot;서비스&quot;)를 이용함에 있어, 회사와 회원의 권리, 의무, 책임 사항 및 서비스 이용과 관련된 필수 요건을 규정함을 목적으로 합니다.
                            </p>
                        </section>

                        {/* 제2조 */}
                        <section id="sec-2" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">02</span>
                                제2조 (용어의 정의)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. <strong>&quot;서비스&quot;</strong>라 함은 회사가 제공하는 &apos;인사이트 레이더(Insight Radar)&apos; 기업/산업 데이터 분석 대시보드, &apos;Zinsight 매거진&apos; 뉴스레터 콘텐츠 및 비즈니스 관련 큐레이션 정보 일체를 의미합니다.</p>
                                <p>2. <strong>&quot;회원&quot;</strong>이라 함은 회사의 서비스에 접속하여 본 약관에 동의하고 계정을 등록한 실무자, 기업 또는 개인 이용자를 뜻합니다.</p>
                                <p>3. <strong>&quot;콘텐츠&quot;</strong>라 함은 서비스상에 게재된 텍스트, 이미지, 수치 분석 데이터, 산업 리포트, 뉴스레터 자료 등 회사가 제작 및 유통하는 모든 유무형의 정보를 의미합니다.</p>
                            </div>
                        </section>

                        {/* 제3조 */}
                        <section id="sec-3" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">03</span>
                                제3조 (약관의 개정 및 효력)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. 본 약관은 서비스 웹사이트 및 관련 어플리케이션에 공지함으로써 효력이 발생합니다.</p>
                                <p>2. 회사는 관계 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있으며, 변경된 약관은 적용일자 7일 전(회원에게 불리한 변경의 경우 30일 전)부터 웹사이트 공지사항 또는 이메일을 통해 사전 고지합니다.</p>
                                <p>3. 회원이 개정 약관의 효력 발생일 이후에도 서비스를 계속 이용할 경우, 개정된 약관 조항에 동의한 것으로 간주합니다.</p>
                            </div>
                        </section>

                        {/* 제4조 */}
                        <section id="sec-4" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">04</span>
                                제4조 (서비스의 제공 및 변경)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. 회사는 회원에게 B2B 기업 시장 정보 수집 가공 및 매거진 구독 서비스를 연중무휴 24시간 제공함을 원칙으로 합니다.</p>
                                <p>2. 설비의 보수 점검, 교체 및 고장, 통신 두절 또는 운영상의 불가피한 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수 있으며, 이 경우 지체 없이 공지합니다.</p>
                            </div>
                        </section>

                        {/* 제5조 (저작권 & 크롤링 금지 - 강조 카드) */}
                        <section id="sec-5" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-6 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">05</span>
                                제5조 (지식재산권 및 크롤링 금지)
                            </h2>
                            
                            <div className="bg-red-500/5 border border-red-500/20 rounded-zi-card p-6 mb-6 flex items-start gap-4">
                                <Ban className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-h4 text-[16px] text-red-500 font-bold mb-2">
                                        데이터 무단 복제 및 상업적 크롤링 엄격 금지
                                    </h4>
                                    <p className="text-[13.5px] text-zi-on-surface-variant leading-relaxed">
                                        Zinsight 내의 모든 산업 분류 지표, 뉴스레터 텍스트, 요약 큐레이션 데이터는 회사의 자산입니다. 비즈니스 내부 참고용 외의 무단 도용 및 복제는 민형사상의 대상입니다.
                                    </p>
                                </div>
                            </div>

                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. 회사가 작성하여 서비스에 게재한 모든 분석 자료, 가공 정보, 리포트 텍스트 및 디자인에 대한 저작권 및 기타 지식재산권은 전부 회사에 귀속됩니다.</p>
                                <p>2. 회원은 서비스를 이용함으로써 얻은 정보를 회사의 사전 서면 승낙 없이 복제, 송신, 출판, 배포, 방송 등 기타 어떠한 방법으로도 영리 목적으로 이용하거나 제3자에게 배포 및 재판매할 수 없습니다.</p>
                                <p>3. <strong>[크롤링 금지]</strong> 회원은 어떠한 경우에도 자동화된 수단(로봇, 웹 크롤러, 스크래퍼, AI 트레이닝 봇 등)을 사용하여 서비스의 데이터베이스를 무단 수집, 파싱, 인덱싱하거나 가공할 수 없습니다. 이를 위반할 경우 즉각 계정이 영구 정지되며, 저작권법 및 영업비밀보호에 관한 법률 등에 의거하여 손해배상 청구를 포함한 법적 조치가 집행됩니다.</p>
                            </div>
                        </section>

                        {/* 제6조 (책임 제한 - 강조 카드) */}
                        <section id="sec-6" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-6 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">06</span>
                                제6조 (회사의 책임 제한 및 면책)
                            </h2>

                            <div className="bg-zi-blue/5 border border-zi-blue/20 rounded-zi-card p-6 mb-6 flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-zi-blue shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-h4 text-[16px] text-zi-blue font-bold mb-2">
                                        정보의 참고적 활용 및 비즈니스 결과 면책
                                    </h4>
                                    <p className="text-[13.5px] text-zi-on-surface-variant leading-relaxed">
                                        Zinsight가 제공하는 정보는 개별 투자, 고용, 상거래 계약 등의 직접적인 손익이나 성공을 보장하지 않습니다. 당사는 의사결정의 참고 자료에 대해서만 보증합니다.
                                    </p>
                                </div>
                            </div>

                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. 회사가 서비스 내에서 제공하는 모든 기업 정보, 뉴스레터 텍스트 및 분석 리포트는 각 정보 출처와 분석 기술을 바탕으로 작성된 <strong>의사결정 참고용 자료</strong>에 불과합니다.</p>
                                <p>2. 회사는 제공되는 분석 정보의 신뢰성, 정확성, 무결성에 대하여 보증하지 않으며, 회원이 이를 바탕으로 집행한 개별 영업 행동, 자금 투자, 채용 계약 등 모든 독자적 비즈니스 결과물(투자 손실, 기회비용 상실 등)로 인해 입은 재정적 손실에 대해 일체의 법적 책임과 손해배상 의무를 부담하지 않습니다.</p>
                                <p>3. 회사는 천재지변, 전시 사태, 국가 비상사태, 디도스(DDoS) 공격 및 기간통신사업자의 회선 장애 등 불가항력적인 외부 원인으로 인하여 서비스를 제공할 수 없게 된 경우에는 그에 대한 책임이 면제됩니다.</p>
                            </div>
                        </section>

                        {/* 제7조 */}
                        <section id="sec-7" className="scroll-mt-24 pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">07</span>
                                제7조 (손해배상 및 관할법원)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. 회원 또는 회사가 본 약관의 규정을 위반하여 상대방에게 손해를 입힌 경우, 그 귀책 당사자는 상대방이 입은 실제 손해에 대하여 배상할 책임이 있습니다.</p>
                                <p>2. 회사와 회원 간에 발생한 분쟁에 관한 소송은 대한민국의 법률을 준거법으로 하며, 민사소송법이 규정하는 회사 본사 소재지의 관할법원을 제1심 전속 관할법원으로 합니다.</p>
                            </div>
                        </section>

                    </div>
                </div>

            </main>
        </div>
    );
}
