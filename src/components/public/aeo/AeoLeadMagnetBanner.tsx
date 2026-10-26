'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Bot,
    Sparkles,
    Search,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Loader2,
    TrendingUp,
    Send,
    X,
} from 'lucide-react';
import {
    diagnoseCompanyForLeadMagnet,
    submitAeoLeadMagnetRequest,
    type AeoAuditResult,
} from '@/actions/aeo-actions';

export function AeoLeadMagnetBanner() {
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [diagnosing, setDiagnosing] = useState(false);

    const [result, setResult] = useState<{
        isRegistered: boolean;
        orgSlug?: string | null;
        orgId?: number | null;
        audit: AeoAuditResult;
        potentialIndexAfterOptimization: number;
    } | null>(null);

    const [contactEmail, setContactEmail] = useState('');
    const [submittingLead, setSubmittingLead] = useState(false);
    const [leadSubmitted, setLeadSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleDiagnose = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) {
            setErrorMsg('진단할 기업명 또는 기관명을 입력해 주세요.');
            return;
        }
        setErrorMsg(null);
        setLeadSubmitted(false);
        setDiagnosing(true);
        try {
            const res = await diagnoseCompanyForLeadMagnet(companyName.trim(), industry.trim());
            setResult(res);
        } catch {
            setErrorMsg('AI 인용 지수 진단 중 일시적인 오류가 발생했습니다.');
        } finally {
            setDiagnosing(false);
        }
    };

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactEmail.trim() || !result) return;
        setSubmittingLead(true);
        try {
            const res = await submitAeoLeadMagnetRequest({
                companyName: result.audit.targetName,
                email: contactEmail.trim(),
                industry: industry.trim() || result.audit.industryKeywords.join(', '),
                answerIndex: result.audit.answerIndex,
            });
            if (res.success) {
                setLeadSubmitted(true);
            } else {
                setErrorMsg(res.message);
            }
        } catch {
            setErrorMsg('상담 신청 접수 중 오류가 발생했습니다.');
        } finally {
            setSubmittingLead(false);
        }
    };

    return (
        <div className="mb-8 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-[#07152e] via-[#0d234a] to-[#132d5e] text-white shadow-lg overflow-hidden">
            <div className="p-5 sm:p-7">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* 좌측 카피 영역 */}
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
                            <Bot className="w-3.5 h-3.5 text-cyan-300" />
                            무료 AEO Answer Index 진단 (AI 답변 인용 지수)
                        </div>
                        <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
                            ChatGPT·Gemini·Perplexity에 우리 기업을 질문하면 몇 점으로 인용될까요?
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            기업·기관명을 입력하면 4대 생성형 AI 엔진의 답변 출처 인용 점수(<strong className="text-cyan-300">Answer Index, 0~100점</strong>)와 리빙 프로필·매거진 발행 시 예상 상승률을 즉시 시뮬레이션합니다.
                        </p>
                    </div>

                    {/* 우측 즉시 진단 입력 폼 */}
                    <form
                        onSubmit={handleDiagnose}
                        className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0"
                    >
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="기업명 또는 기관명 (예: 대림대학교)"
                            className="px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-300/70 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 sm:w-52"
                        />
                        <input
                            type="text"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="주력 분야/지역 (선택)"
                            className="px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-300/70 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 sm:w-44"
                        />
                        <button
                            type="submit"
                            disabled={diagnosing}
                            className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm inline-flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-60 whitespace-nowrap cursor-pointer"
                        >
                            {diagnosing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    AI 감사 중...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4" />
                                    AI 인용 지수 진단
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {errorMsg && (
                    <div className="mt-3 text-xs text-rose-200 bg-rose-500/20 border border-rose-400/30 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* 진단 결과 패널 */}
                {result && (
                    <div className="mt-6 pt-6 border-t border-white/15 space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-300" />
                                <span className="text-sm font-bold text-white">
                                    [{result.audit.targetName}] AEO Answer Index 시뮬레이션 감사 결과
                                </span>
                                {result.isRegistered ? (
                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                        ✓ 진사이트 리빙 프로필 등록 조직
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                        ⚠ 구조화 리빙 프로필 미등록 (AI 인용 결핍 위험)
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setResult(null)}
                                className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1"
                            >
                                <X className="w-3.5 h-3.5" /> 닫기
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* 현재 Answer Index vs 도입 후 예상 상승치 */}
                            <div className="lg:col-span-5 bg-white/10 border border-white/15 rounded-xl p-4 flex flex-col justify-between gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-300">
                                        현재 AI 답변 인용 지수 (Answer Index)
                                    </span>
                                    <span className="text-[11px] text-cyan-300 font-semibold">
                                        6개 표준 프롬프트 감사
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 my-1">
                                    <div>
                                        <div className="text-xs text-slate-300">현재 점수</div>
                                        <div
                                            className={`text-3xl font-black ${
                                                result.audit.answerIndex >= 65
                                                    ? 'text-emerald-300'
                                                    : result.audit.answerIndex >= 40
                                                    ? 'text-cyan-300'
                                                    : 'text-amber-300'
                                            }`}
                                        >
                                            {result.audit.answerIndex}점
                                        </div>
                                    </div>

                                    <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />

                                    <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-3.5 py-2 flex-1">
                                        <div className="text-[11px] font-semibold text-emerald-200 flex items-center gap-1">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            리빙 프로필 + 매거진 최적화 시
                                        </div>
                                        <div className="text-2xl font-black text-emerald-300">
                                            예상 {result.potentialIndexAfterOptimization}점{' '}
                                            <span className="text-xs font-bold">
                                                (+{result.potentialIndexAfterOptimization - result.audit.answerIndex}점↑)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-200 leading-relaxed">
                                    {result.isRegistered ? (
                                        <>
                                            현재 인사이트 레이더에 등록되어 있으나, 정기 심층 매거진 기사 발행 및 FAQ 구조화 데이터 업데이트를 통해 AI 인용률을 <strong>{result.potentialIndexAfterOptimization}%</strong> 수준까지 끌어올릴 수 있습니다.
                                        </>
                                    ) : (
                                        <>
                                            생성형 AI가 참조할 수 있는 <strong>Schema.org 구조화 프로필(JSON-LD)과 검증된 심층 기사 출처가 부재</strong>하여 산업·지역 질의에서 경쟁사 대비 인용 누락이 발생하고 있습니다.
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* 4대 AI 엔진별 진단 + 리드 전환 폼 */}
                            <div className="lg:col-span-7 bg-white/10 border border-white/15 rounded-xl p-4 flex flex-col justify-between gap-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {result.audit.engines.map((eng) => (
                                        <div
                                            key={eng.engine}
                                            className="rounded-lg bg-slate-950/40 border border-white/10 p-2.5"
                                        >
                                            <div className="text-[11px] font-bold text-slate-200 truncate">
                                                {eng.engine}
                                            </div>
                                            <div className="text-xl font-black text-white mt-0.5">
                                                {eng.score}
                                                <span className="text-[10px] font-normal text-slate-400">/100</span>
                                            </div>
                                            <div
                                                className={`text-[10px] font-semibold mt-0.5 ${
                                                    eng.status === '높음'
                                                        ? 'text-emerald-300'
                                                        : eng.status === '보통'
                                                        ? 'text-cyan-300'
                                                        : 'text-amber-300'
                                                }`}
                                            >
                                                인용도 {eng.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 리드 마그넷 전환 영역 */}
                                {leadSubmitted ? (
                                    <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/40 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
                                        <span>
                                            <strong>신청 완료!</strong> 담당 에디터가 [{result.audit.targetName}] 상세 AEO 프롬프트 감사 리포트와 리빙 프로필·매거진 발행 안내서를 보내드립니다.
                                        </span>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={handleLeadSubmit}
                                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950/40 p-3 rounded-xl border border-white/10"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-cyan-300">
                                                📩 상세 AEO 인용 진단서 받기 & 리빙 프로필·매거진 발행 문의
                                            </div>
                                            <div className="text-[11px] text-slate-300">
                                                이메일 또는 연락처를 남겨주시면 6개 프롬프트 전체 감사 결과와 AI 인용률 상승 전략을 전달해 드립니다.
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="이메일 또는 연락처 입력"
                                            className="px-3 py-2 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 text-xs font-medium sm:w-52 focus:outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={submittingLead}
                                            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                                        >
                                            {submittingLead ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Send className="w-3.5 h-3.5" />
                                            )}
                                            진단서·상담 신청
                                        </button>
                                    </form>
                                )}

                                {result.isRegistered && (result.orgSlug || result.orgId) && (
                                    <div className="flex items-center justify-end">
                                        <Link
                                            href={`/insight-radar/${result.orgSlug || result.orgId}`}
                                            className="text-xs font-semibold text-cyan-300 hover:underline inline-flex items-center gap-1"
                                        >
                                            현재 등록된 [{result.audit.targetName}] 인사이트 레이더 프로필 바로가기
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
