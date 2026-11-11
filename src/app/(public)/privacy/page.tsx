import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Settings, Info, Lock, Mail, Scale } from 'lucide-react';
import { buildSocialMetadata } from '@/lib/site';

const domain = "www.zinsight.co.kr";
const baseUrl = `https://${domain}`;

export const metadata: Metadata = {
    title: '개인정보처리방침',
    description: '진사이트 개인정보처리방침. 개인정보 수집 목적, 보유 기간, GA4 쿠키 수집 거부 및 보안 관리 대책을 안내합니다.',
    alternates: {
        canonical: `${baseUrl}/privacy`,
    },
    ...buildSocialMetadata({
        title: '개인정보처리방침',
        description: '진사이트 개인정보처리방침. 개인정보 수집 목적, 보유 기간, GA4 쿠키 수집 거부 및 보안 관리 대책을 안내합니다.',
        path: '/privacy',
    }),
};

const sections = [
    { id: 'sec-1', title: '제1조 (처리 목적)' },
    { id: 'sec-2', title: '제2조 (수집하는 항목)' },
    { id: 'sec-3', title: '제3조 (보유 및 이용기간)' },
    { id: 'sec-4', title: '제4조 (처리 위탁·제3자 제공 및 국외 이전)' },
    { id: 'sec-5', title: '제5조 (GA4 쿠키 거부 가이드)' },
    { id: 'sec-6', title: '제6조 (정보주체의 권리)' },
    { id: 'sec-7', title: '제7조 (안전성 확보 조치)' },
    { id: 'sec-8', title: '제8조 (보호책임자 및 문의)' },
];

// 처리 위탁·국외 이전 업체 (제4조 표)
const processors = [
    {
        name: 'Vercel Inc.',
        country: '미국',
        task: '웹사이트 호스팅 및 서버 운영',
        items: '접속 IP 주소, 요청 기록(접속 일시·페이지·브라우저 정보)',
        retention: '위탁 계약 종료 시까지 (서버 접속 기록은 Vercel 정책에 따른 단기 보관)',
    },
    {
        name: 'Google LLC',
        country: '미국',
        task: '방문 통계 분석 (Google Analytics 4)',
        items: '쿠키 식별자, 방문 페이지·일시, 기기·브라우저 정보, 대략적 위치(도시 단위)',
        retention: 'GA4 데이터 보존 설정 기간',
    },
    {
        name: 'IPinfo, Inc.',
        country: '미국',
        task: '접속 IP가 속한 네트워크의 소유 기관명 조회',
        items: '접속 IP 주소',
        retention: '조회 시점에만 전송 (회사는 원문 IP를 저장하지 않음)',
    },
    {
        name: 'NAVER Cloud Corp.',
        country: '대한민국',
        task: '이미지·첨부 파일 저장소 운영',
        items: '기관 등록 시 제출한 로고·첨부 파일',
        retention: '위탁 계약 종료 시까지',
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface pb-24">
            <div className="mx-auto max-w-[1024px] px-6 pt-16">
                
                {/* ─────────────────────────────── */}
                {/* 헤더 섹션 */}
                {/* ─────────────────────────────── */}
                <div className="text-center mb-16">
                    <h1 className="font-h1 text-[36px] md:text-[44px] leading-tight text-zi-primary mb-4 tracking-tight uppercase">
                        Privacy Policy
                    </h1>
                    <p className="text-body-md text-zi-on-surface-variant max-w-lg mx-auto">
                        진독은 회원님의 개인정보를 매우 소중하게 다루며, 개인정보보호법에 의거하여 권리와 보안을 철저하게 준수하고 보호합니다.
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
                            시행일자: 2026년 11월 11일
                        </div>

                        {/* 제1조 */}
                        <section id="sec-1" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">01</span>
                                제1조 (개인정보의 처리 목적)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>진독(이하 &quot;회사&quot;)는 다음의 목적을 위해 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 사전 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                                <p>1. <strong>상담 및 진단 신청 응대</strong>: AEO 진단·상담 신청자에게 결과 안내, 상담 연락 및 서비스 소개를 목적으로 처리합니다.</p>
                                <p>2. <strong>기업·기관 정보 등록</strong>: 초대 링크로 제출된 기업·기관 정보를 검토하여 인사이트 레이더 프로필로 게시하기 위해 처리합니다.</p>
                                <p>3. <strong>링크 페이지 연락처 남기기</strong>: 기업·기관 링크 페이지에서 방문자가 남긴 연락처와 메모를 접수하여 해당 기업·기관에 전달하고, 문의에 응대하기 위해 처리합니다.</p>
                                <p>4. <strong>서비스 운영 및 통계</strong>: 방문 통계 분석, 방문 기업·기관 단위의 관심 콘텐츠 파악, 링크 페이지 유입·클릭 집계, 부정 이용 방지 및 보안을 목적으로 처리합니다.</p>
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
                                    <p>• <strong>AEO 진단·상담 신청 시</strong>: 기업(기관)명, 이메일 주소 또는 연락처, 업종·지역</p>
                                    <p>• <strong>링크 페이지 연락처 남기기</strong>: 이름, 전화번호 또는 이메일, 메모(선택), 접수 일시, 유입 경로 코드, 기기 유형(모바일·PC)</p>
                                    <p>• <strong>기업·기관 정보 등록 시</strong>: 기업(기관)명, 대표자명, 설립연도, 소재지, 홈페이지 주소, 로고, 사업 소개 (공개 게시를 전제로 제출받는 정보)</p>
                                    <p>• <strong>서비스 이용 과정에서 자동 수집되는 항목</strong>: 접속 IP 주소, 쿠키(Cookie), 방문 일시, 방문 페이지, 유입 경로(리퍼러), 브라우저·기기 유형</p>
                                </div>
                                <div className="bg-zi-surface-container-low rounded-zi-card p-5 border border-zi-divider flex flex-col gap-3 text-[13.5px]">
                                    <p className="font-bold text-zi-primary">접속 IP의 처리 방식</p>
                                    <p>• <strong>방문 기업·기관 식별</strong>: 접속 IP가 속한 네트워크의 소유 기관명(예: 대학·공공기관 전용망)을 조회하여 기관 단위 방문 통계를 만듭니다. 개인을 식별하지 않으며, 원문 IP는 저장하지 않고 비밀 키로 처리한 해시값만 저장합니다.</p>
                                    <p>• <strong>링크 페이지 통계</strong>: 같은 날 같은 방문자를 한 번만 세기 위해 IP와 브라우저 정보를 날마다 바뀌는 키로 해시 처리한 값만 저장합니다. 날짜가 바뀌면 같은 방문자인지 알 수 없습니다.</p>
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
                                <p>2. <strong>항목별 보유 기간</strong></p>
                                <ul className="list-disc pl-5 flex flex-col gap-1.5 text-[14px]">
                                    <li>AEO 진단·상담 신청 정보: 신청일로부터 1년 (정보주체가 삭제를 요청하면 즉시 파기)</li>
                                    <li>링크 페이지 연락처 남기기 접수 내용: 접수일로부터 1년 (정보주체가 삭제를 요청하면 즉시 파기)</li>
                                    <li>기업·기관 등록 정보: 프로필 게시 기간 동안 (게시 중단 요청 시 지체 없이 파기)</li>
                                    <li>방문 기업·기관 식별 기록(IP 해시값 포함): 수집일로부터 1년</li>
                                    <li>링크 페이지 방문·클릭 원본 기록: 수집일로부터 90일 (이후 개인을 식별할 수 없는 일별 합계만 보관)</li>
                                </ul>
                                <p>3. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 법령에서 정한 일정한 기간 동안 보관합니다.</p>
                                <ul className="list-disc pl-5 flex flex-col gap-1.5 text-[14px]">
                                    <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                                    <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                                    <li>접속 로그 기록: 3개월 (통신비밀보호법)</li>
                                </ul>
                            </div>
                        </section>

                        {/* 제4조 */}
                        <section id="sec-4" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">04</span>
                                제4조 (개인정보 처리의 위탁·제3자 제공 및 국외 이전)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있으며, 이 중 국외 업체에는 서비스 이용 시 네트워크를 통해 개인정보가 전송됩니다(국외 이전). 회사는 개인정보를 제3자에게 판매하지 않으며, 아래 &lsquo;제3자 제공&rsquo;의 경우를 제외하고 제공하지 않습니다.</p>
                                <div className="bg-zi-surface-container-low rounded-zi-card p-5 border border-zi-divider text-[13.5px] leading-relaxed">
                                    <p className="font-bold text-zi-primary mb-1.5">제3자 제공 · 링크 페이지 연락처 남기기</p>
                                    <p>• <strong>제공받는 자</strong>: 방문자가 연락처를 남긴 링크 페이지의 해당 기업·기관</p>
                                    <p>• <strong>제공 목적</strong>: 문의 응대 및 연락</p>
                                    <p>• <strong>제공 항목</strong>: 이름, 전화번호 또는 이메일, 메모</p>
                                    <p>• <strong>보유 기간</strong>: 제공받는 자의 문의 응대 목적 달성 시까지 (회사 보관분은 접수일로부터 1년)</p>
                                    <p>• 연락처를 남길 때 별도 동의를 받으며, 동의하지 않으면 연락처 남기기를 이용할 수 없습니다.</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {processors.map((p) => (
                                        <div key={p.name} className="bg-zi-surface-container-low rounded-zi-card p-5 border border-zi-divider text-[13.5px] leading-relaxed">
                                            <p className="font-bold text-zi-primary mb-1.5">{p.name} <span className="font-normal text-zi-outline">· {p.country}</span></p>
                                            <p>• <strong>위탁 업무</strong>: {p.task}</p>
                                            <p>• <strong>이전·처리 항목</strong>: {p.items}</p>
                                            <p>• <strong>보유 기간</strong>: {p.retention}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[13.5px]">국외 이전은 서비스 접속 시점에 암호화된 네트워크(HTTPS)로 이루어집니다. Google Analytics로의 이전은 제5조의 방법으로 쿠키를 거부하여 막을 수 있으며, 호스팅(Vercel)과 기관 식별 조회(IPinfo)로의 전송을 원하지 않으시면 제8조의 연락처로 요청해 주십시오.</p>
                            </div>
                        </section>

                        {/* 제5조 (GA4 쿠키 설명 및 거부 가이드 - 강조 카드) */}
                        <section id="sec-5" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-6 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">05</span>
                                제5조 (개인정보 자동 수집 장치의 설치·운영 및 거부)
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

                        {/* 제6조 */}
                        <section id="sec-6" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">06</span>
                                제6조 (정보주체의 권리·의무 및 행사 방법)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-3">
                                <p>1. 정보주체는 회사에 대해 언제든지 개인정보 열람, 정정·삭제, 처리 정지를 요구할 수 있습니다.</p>
                                <p>2. 권리 행사는 제8조의 이메일로 요청하실 수 있으며, 회사는 본인 확인 후 지체 없이 조치하고 결과를 알려드립니다.</p>
                                <p>3. 개인정보 침해에 대한 신고나 상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118) 또는 개인정보분쟁조정위원회(www.kopico.go.kr, 1833-6972)에 문의하실 수 있습니다.</p>
                            </div>
                        </section>

                        {/* 제7조 */}
                        <section id="sec-7" className="scroll-mt-24 border-b border-zi-divider pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">07</span>
                                제7조 (개인정보의 안전성 확보 조치)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적, 관리적 및 물리적 조치를 취하고 있습니다.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13.5px]">
                                    <div className="p-4 bg-zi-surface-container-low border border-zi-divider rounded-zi-card flex gap-3">
                                        <Lock className="w-5 h-5 text-zi-outline shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-bold text-zi-primary mb-1">관리자 접근 통제</h5>
                                            <p className="text-[12.5px] leading-normal text-zi-on-surface-variant">관리자 계정은 단방향 암호화된 비밀번호와 2단계 인증(OTP)으로 보호되며, 개인정보에 접근할 수 있는 인원을 최소한으로 제한합니다.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zi-surface-container-low border border-zi-divider rounded-zi-card flex gap-3">
                                        <Scale className="w-5 h-5 text-zi-outline shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-bold text-zi-primary mb-1">접속 IP 비식별 처리</h5>
                                            <p className="text-[12.5px] leading-normal text-zi-on-surface-variant">통계 목적으로 다루는 접속 IP는 원문을 저장하지 않고, 비밀 키 기반 해시값으로만 저장합니다.</p>
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

                        {/* 제8조 */}
                        <section id="sec-8" className="scroll-mt-24 pb-8">
                            <h2 className="font-h3 text-h3 text-zi-primary mb-4 flex items-center gap-2.5">
                                <span className="bg-zi-surface-container-highest px-3 py-1 rounded-full text-[12px] font-bold text-zi-blue font-ui-label">08</span>
                                제8조 (개인정보 보호책임자 및 문의)
                            </h2>
                            <div className="text-body-md text-zi-on-surface-variant leading-[1.8] flex flex-col gap-4">
                                <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                                
                                <div className="bg-zi-surface-container-low border border-zi-divider rounded-zi-card p-5 flex items-start gap-4">
                                    <Mail className="w-5 h-5 text-zi-primary shrink-0 mt-0.5" />
                                    <div className="text-[13.5px] leading-relaxed">
                                        <p>• <strong>담당 부서</strong>: 진독 개인정보보호 및 기술지원 운영실</p>
                                        <p>• <strong>보호책임자 직책</strong>: 최고보안책임자 (CISO)</p>
                                        <p>• <strong>문의 이메일</strong>: <a href="mailto:cto@zindok.com" className="text-zi-primary font-semibold hover:underline">cto@zindok.com</a></p>
                                    </div>
                                </div>
                                <p className="text-[13.5px]">회원님께서는 회사의 서비스(또는 화면)를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있으며, 회사는 신속하고 성실하게 답변해 드릴 예정입니다.</p>
                            </div>
                        </section>

                    </div>
                </div>

            </div>
        </div>
    );
}
