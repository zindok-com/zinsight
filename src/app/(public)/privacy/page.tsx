import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Settings, Info, Lock, Mail, Scale } from 'lucide-react';

const domain = "www.zinsight.co.kr";
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    title: '개인?�보처리방침',
    description: '진사?�트(Zinsight) 개인?�보처리방침. 개인?�보 ?�집 목적, 보유 기간, GA4 쿠키 ?�집 거�? �?보안 관�??�책을 ?�내?�니??',
    alternates: {
        canonical: `${baseUrl}/privacy`,
    },
};

const sections = [
    { id: 'sec-1', title: '??�?(처리 목적)' },
    { id: 'sec-2', title: '??�?(?�집?�는 ??��)' },
    { id: 'sec-3', title: '??�?(보유 �??�용기간)' },
    { id: 'sec-4', title: '??�?(GA4 쿠키 거�? 가?�드)' },
    { id: 'sec-5', title: '??�?(?�전???�보 조치)' },
    { id: 'sec-6', title: '??�?(보호책임??�?문의)' },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface pb-24">
            <main className="mx-auto max-w-[1024px] px-6 pt-16">
                
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                {/* ?�더 ?�션 */}
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                <div className="text-center mb-16">
                    <h1 className="font-h1 text-[36px] md:text-[44px] leading-tight text-zi-primary mb-4 tracking-tight uppercase">
                        Privacy Policy
                    </h1>
                    <p className="text-body-md text-zi-on-surface-variant max-w-lg mx-auto">
                        Zinsight???�원?�의 개인?�보�?매우 ?�중?�게 ?�루�? 개인?�보보호법에 ?�거?�여 권리?� 보안??철�??�게 준?�하�?보호?�니??
                    </p>
                </div>

                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                {/* 미려?????�위�?*/}
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                <div className="flex justify-center border-b border-zi-divider mb-16">
                    <div className="flex gap-12 font-ui-label text-ui-label font-bold tracking-widest text-[14px]">
                        <Link 
                            href="/terms" 
                            className="pb-4 border-b-2 border-transparent text-zi-outline hover:text-zi-primary uppercase transition-all"
                        >
                            ?�용?��? (Terms)
                        </Link>
                        <Link 
                            href="/privacy" 
                            className="pb-4 border-b-2 border-zi-primary text-zi-primary uppercase transition-all"
                        >
                            개인?�보처리방침 (Privacy)
                        </Link>
                    </div>
                </div>

                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                {/* 2??메인 ?�이?�웃 */}
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* 좌측 ?�티???�커 메뉴 (Desktop ?�용) */}
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

                    {/* ?�측 방침 본문 기술 */}
                    <div className="lg:col-span-8 flex flex-col gap-12">
                        
                        <div className="text-right text-[12px] text-zi-outline font-ui-label mb-4">
                            ?�행?�자: 2026??5??18??
                        </div>

                        {/* ??�?*/}
                        <section id="sec-1" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">01</span>
                                ??�?(개인?�보??처리 목적)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>주식?�사 Zinsight(?�하 &quot;?�사&quot;)???�음??목적???�해 개인?�보�?처리?�니?? 처리?�고 ?�는 개인?�보???�음??목적 ?�외???�도로는 ?�용?��? ?�으�? ?�용 목적??변경되??경우?�는 개인?�보보호�???8조에 ?�라 ?�전 ?�의�?받는 ???�요??조치�??�행???�정?�니??</p>
                                <p>1. <strong>?�원 가??�?관�?/strong>: 가???�사 ?�인, ?�원???�비???�공???�른 본인 ?�별·?�증, ?�원?�격 ?��?·관�? ?�한??본인?�인???�행???�른 본인?�인, ?�비??부???�용 방�?, 각종 고�?·?��? ?�을 목적?�로 개인?�보�?처리?�니??</p>
                                <p>2. <strong>B2B ?�비??�?콘텐�??�공</strong>: ?�사?�트 ?�이??Insight Radar) ?�?�보??맞춤 ?�공, ?�료 ?�비???�금 결제 �??�산, ?�스?�터 �??��?매거�?콘텐�?발송 ?�을 목적?�로 개인?�보�?처리?�니??</p>
                            </div>
                        </section>

                        {/* ??�?*/}
                        <section id="sec-2" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">02</span>
                                ??�?(?�집?�는 개인?�보????��)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>?�사???�비???�공???�해 최소?�의 ??��???�음�?같이 ?�집?�고 ?�습?�다.</p>
                                <div className="bg-zi-surface-container-low rounded-zi-card p-5 border border-zi-divider flex flex-col gap-3 text-[13.5px]">
                                    <p>??<strong>?�원가????(?�수)</strong>: ?�메??주소(?�이??, 비�?번호, ?�름, ?�사�? 부??직책</p>
                                    <p>??<strong>?�스?�터 �?매거�?구독 ?�청 ??(?�택)</strong>: ?�메??주소</p>
                                    <p>??<strong>?�터???�비???�용 과정?�서 ?�동 ?�성?�어 ?�집?�는 ??��</strong>: IP 주소, 쿠키(Cookie), 방문 ?�시, ?�비???�용 기록, 브라?��? ?�형, Vercel/Next.js ?�스???�트?�크 ?�스??로그</p>
                                </div>
                            </div>
                        </section>

                        {/* ??�?*/}
                        <section id="sec-3" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">03</span>
                                ??�?(개인?�보??보유 �??�용기간)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. ?�사??법령???�른 개인?�보 보유·?�용기간 ?�는 ?�원?�로부???�집 ?�에 ?�의받�? 개인?�보 보유·?�용기간 ?�에??개인?�보�?처리 �?보유?�니??</p>
                                <p>2. <strong>보유 기간</strong>: ?�원??개인?�보???�원 ?�퇴 ???�는 ?�스?�터 구독 ?��? ??즉시 ?�기?�는 것을 ?�칙?�로 ?�니??</p>
                                <p>3. ?? 관계법?�의 규정???�하??보존???�요가 ?�는 경우 ?�사???�래?� 같이 법령?�서 ?�한 ?�정??기간 ?�안 ?�원?�보�?보�??�니??</p>
                                <ul className="list-disc pl-5 flex flex-col gap-1.5 text-[14px]">
                                    <li>계약 ?�는 �?��철회 ?�에 관??기록: 5??(?�자?�거???�에?�의 ?�비?�보?�에 관??법률)</li>
                                    <li>?�비?�의 불만 ?�는 분쟁처리??관??기록: 3??(?�자?�거???�에?�의 ?�비?�보?�에 관??법률)</li>
                                    <li>?�속 로그 기록: 3개월 (?�신비�?보호�?</li>
                                </ul>
                            </div>
                        </section>

                        {/* ??�?(GA4 쿠키 ?�명 �?거�? 가?�드 - 강조 카드) */}
                        <section id="sec-4" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-6 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">04</span>
                                ??�?(개인?�보 ?�동 ?�집 ?�치???�치·?�영 �?거�?)
                            </h2>
                            
                            <div className="bg-zi-blue/5 border border-zi-blue/20 rounded-zi-card p-6 mb-6 flex items-start gap-4">
                                <Settings className="w-6 h-6 text-zi-blue shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-h4 text-[16px] text-zi-blue font-bold mb-2">
                                        구�? ?�널리틱??GA4) 분석 ?�?�에 ?�??고�?
                                    </h4>
                                    <p className="text-[13.5px] text-zi-on-surface-variant leading-relaxed">
                                        �??�이?�는 ?��???방문 ?�턴 �??�계 분석??목적?�로 Google Analytics(GA4)�??�용?�여 분석??쿠키 ?�이?��? ?�시 ?�집?�니?? ?�집??분석 ?�보??마�???개선???�해?�만 ?�용?�니??
                                    </p>
                                </div>
                            </div>

                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>1. <strong>쿠키(Cookie)?�?</strong>: 쿠키???�사?�트�??�영?�는???�용?�는 ?�버가 ?�원??브라?��???보내???�주 ?��? ?�스???�일로서 ?�원??컴퓨???�드?�스?�에 ?�?�됩?�다.</p>
                                <p>2. <strong>?�집 거�? 방법</strong>: ?�원?� 쿠키 ?�치???�???�택권을 가지�??�습?�다. 브라?��? ?�션???�정?�으로써 모든 쿠키�??�용?�거?? 쿠키가 ?�?�될 ?�마???�인??거치거나, 모든 쿠키???�?�을 거�??????�습?�다. ?�만, 쿠키 ?�?�을 거�???경우 ?��? 개인???�비??�??�동 로그?�이 ?�요??기능???�용???�려?�???�을 ???�습?�다.</p>
                                
                                <div className="bg-zi-surface-container-low rounded-zi-card p-5 border border-zi-divider">
                                    <h4 className="font-bold text-[14px] text-zi-primary mb-3 flex items-center gap-1.5">
                                        <Info className="w-4 h-4 text-zi-outline" />
                                        ?�??브라?��?�?쿠키 ?�집 거�? ?�정 경로
                                    </h4>
                                    <ul className="flex flex-col gap-2.5 text-[13px] leading-relaxed text-zi-on-surface-variant">
                                        <li>??<strong>Chrome</strong>: ?�측 ?�단 ?�보�????�정 ??개인?�보 �?보안 ???�드 ?�티 쿠키 ??쿠키 차단 ?�정</li>
                                        <li>??<strong>Apple Safari</strong>: ?�정 ??개인?�보 보호 ??모든 쿠키 차단 ?�는 ?�사?�트 ?�이??관�?/li>
                                        <li>??<strong>Microsoft Edge</strong>: ?�측 ?�단 ?�정 ??쿠키 �??�이??권한 ??쿠키 �??�이???�이??관�?�???��</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* ??�?*/}
                        <section id="sec-5" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">05</span>
                                ??�?(개인?�보???�전???�보 조치)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>?�사??개인?�보보호�???9조에 ?�라 ?�음�?같이 ?�전???�보???�요??기술?? 관리적 �?물리??조치�?취하�??�습?�다.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13.5px]">
                                    <div className="p-4 bg-zi-surface-container-low border border-zi-divider rounded-zi-card flex gap-3">
                                        <Lock className="w-5 h-5 text-zi-outline shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-bold text-zi-primary mb-1">비�?번호 ?�방???�호??/h5>
                                            <p className="text-[12.5px] leading-normal text-zi-on-surface-variant">?�원??비�?번호???�방???�시 ?�수 ?�고리즘???�해 철�????�호?�되??관리되�? 관리자???????�습?�다.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zi-surface-container-low border border-zi-divider rounded-zi-card flex gap-3">
                                        <Shield className="w-5 h-5 text-zi-outline shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-bold text-zi-primary mb-1">HTTPS ?�호???�신</h5>
                                            <p className="text-[12.5px] leading-normal text-zi-on-surface-variant">Vercel SSL ?�로?�콜???�재?�여 ?�용?��? ???�버 �??��???모든 ?�킷 ?�이?��? ?�전?�게 ?�호???�송?�니??</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ??�?*/}
                        <section id="sec-6" className="scroll-mt-24 pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">06</span>
                                ??�?(개인?�보 보호책임??�?문의)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>?�사??개인?�보 처리??관???�무�?총괄?�서 책임지�? 개인?�보 처리?� 관?�한 ?�보주체??불만처리 �??�해구제 ?�을 ?�하???�래?� 같이 개인?�보 보호책임?��? 지?�하�??�습?�다.</p>
                                
                                <div className="bg-zi-surface-container-low border border-zi-divider rounded-zi-card p-5 flex items-start gap-4">
                                    <Mail className="w-5 h-5 text-zi-primary shrink-0 mt-0.5" />
                                    <div className="text-[13.5px] leading-relaxed">
                                        <p>??<strong>?�당 부??/strong>: Zinsight 개인?�보보호 �?기술지???�영??/p>
                                        <p>??<strong>보호책임??직책</strong>: 최고보안책임??(CISO)</p>
                                        <p>??<strong>문의 ?�메??/strong>: <a href="mailto:support@zinsight.co.kr" className="text-zi-primary font-semibold hover:underline">support@zinsight.co.kr</a></p>
                                    </div>
                                </div>
                                <p className="text-[13.5px]">?�원?�께?�는 ?�사???�비???�는 ?�면)�??�용?�시면서 발생??모든 개인?�보 보호 관??문의, 불만처리, ?�해구제 ?�에 관???�항??개인?�보 보호책임??�??�당부?�로 문의?�실 ???�으�? ?�사???�속?�고 ?�실?�게 ?��????�릴 ?�정?�니??</p>
                            </div>
                        </section>

                    </div>
                </div>

            </main>
        </div>
    );
}

