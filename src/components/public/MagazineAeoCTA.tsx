'use client';

import { useState } from 'react';
import { submitConsultingRequest } from '@/actions/consulting-actions';
import { CheckCircle2, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function MagazineAeoCTA() {
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !companyName) return;

        setStatus('loading');
        try {
            const res = await submitConsultingRequest({ email, companyName, industry });
            if (res.success) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-white p-8 rounded-zi-card border border-zi-primary/10 shadow-xl shadow-zi-primary/5 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-zi-primary/5 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-8 h-8 text-zi-primary" />
                    </div>
                    <h3 className="font-h3 text-[22px] text-zi-primary mb-2">진단 요청 접수 완료</h3>
                    <p className="text-body-md text-zi-on-surface-variant mb-6 px-4">
                        신청하신 기업명과 메일 주소로 분석이 시작되었습니다. <span className="font-bold text-zi-primary">AEO 노출 지수 리포트</span>는 정밀 분석을 거쳐 일주일 내 발송됩니다.
                    </p>
                    
                    <div className="w-full bg-zi-surface-container-low p-5 rounded-zi-card border border-zi-outline-variant/20 text-left mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-zi-secondary" />
                            <span className="text-[12px] font-bold text-zi-secondary uppercase tracking-tighter">Process Information</span>
                        </div>
                        <p className="text-[14px] text-zi-on-surface mb-3 leading-relaxed">
                            AI 에이전트와 검색 엔진이 <span className="text-zi-primary font-bold">{companyName}</span>의 정보를 얼마나 정확하게 학습하고 인지하는지 다각도로 검토합니다.
                        </p>
                        <p className="text-[13px] text-zi-on-surface-variant italic border-t border-zi-outline-variant/30 pt-3">
                            * 분석 결과에 따라 검색 최적화를 위한 Zinsight 매거진 전문 기사 발행 솔루션이 함께 제안될 수 있습니다.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => {
                            setStatus('idle');
                            setCompanyName('');
                            setIndustry('');
                        }}
                        className="text-zi-outline hover:text-zi-primary font-ui-label text-[13px] transition-colors"
                    >
                        다른 기업 신청하기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-zi-primary to-[#002a5a] p-8 rounded-zi-card border border-white/10 shadow-2xl">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-zi-secondary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
                <div className="mb-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-widest mb-3 border border-white/10">
                        AEO Diagnosis
                    </span>
                    <h3 className="font-h2 text-[24px] text-white mb-3 leading-tight tracking-tight">
                        우리 기업은 챗GPT에서 어떻게 검색될까?
                    </h3>
                    <p className="text-[15px] text-white/70 leading-relaxed font-light">
                        AI 에이전트가 당사의 정보를 정확히 학습하고 있는지 확인하세요. 무료 AEO 노출 지수 리포트를 보내드립니다.
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="space-y-4">
                        <div className="group">
                            <input
                                type="email"
                                required
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-zi-btn border border-white/20 bg-white/5 text-white placeholder:text-white/30 text-body-md focus:border-white/50 focus:bg-white/10 outline-none transition-all"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            <input
                                type="text"
                                required
                                placeholder="회사명 (필수)"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-zi-btn border border-white/20 bg-white/5 text-white placeholder:text-white/30 text-body-md focus:border-white/50 focus:bg-white/10 outline-none transition-all"
                            />
                            <input
                                type="text"
                                placeholder="산업군 (선택)"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-zi-btn border border-white/20 bg-white/5 text-white placeholder:text-white/30 text-body-md focus:border-white/50 focus:bg-white/10 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full mt-4 py-4 bg-white text-zi-primary font-bold rounded-zi-btn hover:bg-white/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                데이터 수집 중...
                            </>
                        ) : (
                            '무료 진단 리포트 받기'
                        )}
                    </button>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-red-300 text-[13px] mt-2 justify-center bg-red-500/10 py-2 rounded-zi-btn">
                            <AlertCircle className="w-4 h-4" />
                            <span>오류가 발생했습니다. 잠시 후 다시 시도해주세요.</span>
                        </div>
                    )}
                </form>
                
                <p className="mt-6 text-[11px] text-white/40 text-center leading-relaxed">
                    * 신청 즉시 데이터 매칭을 시작하며,<br />영업일 기준 일주일 내 리포트가 발송됩니다.
                </p>
            </div>
        </div>
    );
}
