import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, FileText, Ban, AlertTriangle, Scale } from 'lucide-react';

const domain = "www.zinsight.co.kr";
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    title: '?�용?��?',
    description: '진사?�트(Zinsight) ?�비???�용?��?. 콘텐�??�?�권 보호, 무단 ?�롤�?금�? �?면책 조항??명시?�니??',
    alternates: {
        canonical: `${baseUrl}/terms`,
    },
};

const sections = [
    { id: 'sec-1', title: '??�?(목적)' },
    { id: 'sec-2', title: '??�?(?�어???�의)' },
    { id: 'sec-3', title: '??�?(?��???개정 �??�력)' },
    { id: 'sec-4', title: '??�?(?�비?�의 ?�공 �?변�?' },
    { id: 'sec-5', title: '??�?(지?�재?�권 �??�롤�?금�?)' },
    { id: 'sec-6', title: '??�?(?�사??책임 ?�한 �?면책)' },
    { id: 'sec-7', title: '??�?(?�해배상 �?관?�법??' },
];

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface pb-24">
            <main className="mx-auto max-w-[1024px] px-6 pt-16">
                
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                {/* ?�더 ?�션 */}
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                <div className="text-center mb-16">
                    <h1 className="font-h1 text-[36px] md:text-[44px] leading-tight text-zi-primary mb-4 tracking-tight uppercase">
                        Terms of Service
                    </h1>
                    <p className="text-body-md text-zi-on-surface-variant max-w-lg mx-auto">
                        Zinsight ?�랫??�??�비???�용??관??권리?� ?�무, ?�심?�인 법적 ?�한 ?�항???�내???�립?�다.
                    </p>
                </div>

                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                {/* 미려?????�위�?*/}
                {/* ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */}
                <div className="flex justify-center border-b border-zi-divider mb-16">
                    <div className="flex gap-12 font-ui-label text-ui-label font-bold tracking-widest text-[14px]">
                        <Link 
                            href="/terms" 
                            className="pb-4 border-b-2 border-zi-primary text-zi-primary uppercase transition-all"
                        >
                            ?�용?��? (Terms)
                        </Link>
                        <Link 
                            href="/privacy" 
                            className="pb-4 border-b-2 border-transparent text-zi-outline hover:text-zi-primary uppercase transition-all"
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

                    {/* ?�측 ?��? 본문 기술 */}
                    <div className="lg:col-span-8 flex flex-col gap-12">
                        
                        <div className="text-right text-[12px] text-zi-outline font-ui-label mb-4">
                            ?�행?�자: 2026??5??18??
                        </div>

                        {/* ??�?*/}
                        <section id="sec-1" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">01</span>
                                ??�?(목적)
                            </h2>
                            <p className="text-body-md text-zi-on-surface-variant leading-[1.8]">
                                �??��??� 주식?�사 Zinsight(?�하 &quot;?�사&quot;)가 ?�영?�는 ?�라??B2B 비즈?�스 ?�텔리전???�랫??�?매거�??�비???�하 &quot;?�비??quot;)�??�용?�에 ?�어, ?�사?� ?�원??권리, ?�무, 책임 ?�항 �??�비???�용�?관?�된 ?�수 ?�건??규정?�을 목적?�로 ?�니??
                            </p>
                        </section>

                        {/* ??�?*/}
                        <section id="sec-2" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">02</span>
                                ??�?(?�어???�의)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. <strong>&quot;?�비??quot;</strong>???��? ?�사가 ?�공?�는 &apos;?�사?�트 ?�이??Insight Radar)&apos; 기업/?�업 ?�이??분석 ?�?�보?? &apos;Zinsight 매거�?apos; ?�스?�터 콘텐�?�?비즈?�스 관???�레?�션 ?�보 ?�체�??��??�니??</p>
                                <p>2. <strong>&quot;?�원&quot;</strong>?�라 ?��? ?�사???�비?�에 ?�속?�여 �??��????�의?�고 계정???�록???�무?? 기업 ?�는 개인 ?�용?��? ?�합?�다.</p>
                                <p>3. <strong>&quot;콘텐�?quot;</strong>???��? ?�비?�상??게재???�스?? ?��?지, ?�치 분석 ?�이?? ?�업 리포?? ?�스?�터 ?�료 ???�사가 ?�작 �??�통?�는 모든 ?�무?�의 ?�보�??��??�니??</p>
                            </div>
                        </section>

                        {/* ??�?*/}
                        <section id="sec-3" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">03</span>
                                ??�?(?��???개정 �??�력)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. �??��??� ?�비???�사?�트 �?관???�플리�??�션??공�??�으로써 ?�력??발생?�니??</p>
                                <p>2. ?�사??관�?법령???�배?��? ?�는 범위 ?�에??�??��???개정?????�으�? 변경된 ?��??� ?�용?�자 7?????�원?�게 불리??변경의 경우 30????부???�사?�트 공�??�항 ?�는 ?�메?�을 ?�해 ?�전 고�??�니??</p>
                                <p>3. ?�원??개정 ?��????�력 발생???�후?�도 ?�비?��? 계속 ?�용??경우, 개정???��? 조항???�의??것으�?간주?�니??</p>
                            </div>
                        </section>

                        {/* ??�?*/}
                        <section id="sec-4" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">04</span>
                                ??�?(?�비?�의 ?�공 �?변�?
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. ?�사???�원?�게 B2B 기업 ?�장 ?�보 ?�집 가�?�?매거�?구독 ?�비?��? ?�중무휴 24?�간 ?�공?�을 ?�칙?�로 ?�니??</p>
                                <p>2. ?�비??보수 ?��?, 교체 �?고장, ?�신 ?�절 ?�는 ?�영?�의 불�??�한 ?�유가 발생??경우 ?�비???�공???�시?�으�?중단?????�으�? ??경우 지�??�이 공�??�니??</p>
                            </div>
                        </section>

                        {/* ??�?(?�?�권 & ?�롤�?금�? - 강조 카드) */}
                        <section id="sec-5" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-6 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">05</span>
                                ??�?(지?�재?�권 �??�롤�?금�?)
                            </h2>
                            
                            <div className="bg-red-500/5 border border-red-500/20 rounded-zi-card p-6 mb-6 flex items-start gap-4">
                                <Ban className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-h4 text-[16px] text-red-500 font-bold mb-2">
                                        ?�이??무단 복제 �??�업???�롤�??�격 금�?
                                    </h4>
                                    <p className="text-[13.5px] text-zi-on-surface-variant leading-relaxed">
                                        Zinsight ?�의 모든 ?�업 분류 지?? ?�스?�터 ?�스?? ?�약 ?�레?�션 ?�이?�는 ?�사???�산?�니?? 비즈?�스 ?��? 참고???�의 무단 ?�용 �?복제??민형?�상???�?�입?�다.
                                    </p>
                                </div>
                            </div>

                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. ?�사가 ?�성?�여 ?�비?�에 게재??모든 분석 ?�료, 가�??�보, 리포???�스??�??�자?�에 ?�???�?�권 �?기�? 지?�재?�권?� ?��? ?�사??귀?�됩?�다.</p>
                                <p>2. ?�원?� ?�비?��? ?�용?�으로써 ?��? ?�보�??�사???�전 ?�면 ?�낙 ?�이 복제, ?�신, 출판, 배포, 방송 ??기�? ?�떠??방법?�로???�리 목적?�로 ?�용?�거?????�에�?배포 �??�판매할 ???�습?�다.</p>
                                <p>3. <strong>[?�롤�?금�?]</strong> ?�원?� ?�떠??경우?�도 ?�동?�된 ?�단(로봇, ???�롤?? ?�크?�퍼, AI ?�레?�닝 �??????�용?�여 ?�비?�의 ?�이?�베?�스�?무단 ?�집, ?�싱, ?�덱?�하거나 가공할 ???�습?�다. ?��? ?�반??경우 즉각 계정???�구 ?��??�며, ?�?�권�?�??�업비�?보호??관??법률 ?�에 ?�거?�여 ?�해배상 �?���??�함??법적 조치가 집행?�니??</p>
                            </div>
                        </section>

                        {/* ??�?(책임 ?�한 - 강조 카드) */}
                        <section id="sec-6" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-6 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">06</span>
                                ??�?(?�사??책임 ?�한 �?면책)
                            </h2>

                            <div className="bg-zi-blue/5 border border-zi-blue/20 rounded-zi-card p-6 mb-6 flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-zi-blue shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-h4 text-[16px] text-zi-blue font-bold mb-2">
                                        ?�보??참고???�용 �?비즈?�스 결과 면책
                                    </h4>
                                    <p className="text-[13.5px] text-zi-on-surface-variant leading-relaxed">
                                        Zinsight가 ?�공?�는 ?�보??개별 ?�자, 고용, ?�거??계약 ?�의 직접?�인 ?�익?�나 ?�공??보장?��? ?�습?�다. ?�사???�사결정??참고 ?�료???�?�서�?보증?�니??
                                    </p>
                                </div>
                            </div>

                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. ?�사가 ?�비???�에???�공?�는 모든 기업 ?�보, ?�스?�터 ?�스??�?분석 리포?�는 �??�보 출처?� 분석 기술??바탕?�로 ?�성??<strong>?�사결정 참고???�료</strong>??불과?�니??</p>
                                <p>2. ?�사???�공?�는 분석 ?�보???�뢰?? ?�확?? 무결?�에 ?�?�여 보증?��? ?�으�? ?�원???��? 바탕?�로 집행??개별 ?�업 ?�동, ?�금 ?�자, 채용 계약 ??모든 ?�자??비즈?�스 결과�??�자 ?�실, 기회비용 ?�실 ??�??�해 ?��? ?�정???�실???�???�체??법적 책임�??�해배상 ?�무�?부?�하지 ?�습?�다.</p>
                                <p>3. ?�사??천재지변, ?�시 ?�태, �?? 비상?�태, ?�도??DDoS) 공격 �?기간?�신?�업?�의 ?�선 ?�애 ??불�???��?�인 ?��? ?�인?�로 ?�하???�비?��? ?�공?????�게 ??경우?�는 그에 ?�??책임??면제?�니??</p>
                            </div>
                        </section>

                        {/* ??�?*/}
                        <section id="sec-7" className="scroll-mt-24 pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">07</span>
                                ??�?(?�해배상 �?관?�법??
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. ?�원 ?�는 ?�사가 �??��???규정???�반?�여 ?��?방에�??�해�??�힌 경우, �?귀�??�사?�는 ?��?방이 ?��? ?�제 ?�해???�?�여 배상??책임???�습?�다.</p>
                                <p>2. ?�사?� ?�원 간에 발생??분쟁??관???�송?� ?�?��?�?�� 법률??준거법?�로 ?�며, 민사?�송법이 규정?�는 ?�사 본사 ?�재지??관?�법?�을 ?????�속 관?�법?�으�??�니??</p>
                            </div>
                        </section>

                    </div>
                </div>

            </main>
        </div>
    );
}

