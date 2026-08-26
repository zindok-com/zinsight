import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getRadarCompanies } from '@/actions/insight-radar-actions';

export default async function MagazineAeoCTA() {
    const { companies } = await getRadarCompanies({}, 1, 15);
    // Duplicate companies array so it can loop seamlessly
    const marqueeItems = [...companies, ...companies];

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-zi-primary to-[#002a5a] p-6 sm:p-8 rounded-zi-card border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-zi-secondary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl mx-auto">
                <div className="mb-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-widest mb-3 border border-white/10">
                        Zinsight Radar
                    </span>
                    <h3 className="font-h2 text-[22px] sm:text-[24px] text-white mb-3 leading-tight tracking-tight">
                        최근 인사이트 레이더에 등록된 기업
                    </h3>
                    <p className="text-[14px] sm:text-[15px] text-white/70 leading-relaxed font-light break-keep">
                        차세대 AI 검색 최적화(GEO)와 웹 표준 SEO를 통해 비즈니스 가치를 입증하는 혁신 기업 리스트입니다.
                    </p>
                </div>
                
                {/* Marquee Ticker */}
                <div className="w-full overflow-hidden flex py-4 mb-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#001736] to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#001736] to-transparent z-10 pointer-events-none" />
                    
                    <div className="flex animate-marquee hover:pause whitespace-nowrap items-center">
                        {marqueeItems.map((comp, i) => (
                            <div key={`${comp.id}-${i}`} className="inline-flex items-center justify-center">
                                <span className="text-white/90 font-medium text-[15px] hover:text-white transition-colors cursor-default px-3">
                                    {comp.company_name}
                                </span>
                                <span className="text-white/30 text-xs px-2">•</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Link 
                    href="/insight-radar"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-zi-primary font-bold rounded-zi-btn hover:bg-white/90 transition-all active:scale-[0.98] shadow-lg shadow-black/20"
                >
                    인사이트 레이더 보기 <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 25s linear infinite;
                    min-width: max-content;
                }
                .hover\\:pause:hover {
                    animation-play-state: paused;
                }
            `}} />
        </div>
    );
}
