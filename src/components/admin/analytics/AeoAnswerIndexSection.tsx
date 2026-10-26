'use client';

import React, { useState, useTransition } from 'react';
import {
    Bot,
    Sparkles,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    ArrowUpRight,
    FileCheck2,
    HelpCircle,
    TrendingUp,
} from 'lucide-react';
import type { AeoAuditResult } from '@/actions/aeo-actions';
import {
    getOrRunAeoAuditForOrganization,
    getOrRunAeoAuditForArticle,
} from '@/actions/aeo-actions';

interface AeoAnswerIndexSectionProps {
    initialAudit: AeoAuditResult | null | undefined;
    entityType: 'organization' | 'article';
    entityId: number;
}

export function AeoAnswerIndexSection({
    initialAudit,
    entityType,
    entityId,
}: AeoAnswerIndexSectionProps) {
    const [audit, setAudit] = useState<AeoAuditResult | null>(initialAudit ?? null);
    const [isPending, startTransition] = useTransition();

    const handleRunAudit = () => {
        startTransition(async () => {
            const next =
                entityType === 'organization'
                    ? await getOrRunAeoAuditForOrganization(entityId, true)
                    : await getOrRunAeoAuditForArticle(entityId, true);
            if (next) {
                setAudit(next);
            }
        });
    };

    if (!audit) {
        return (
            <div className="border rounded-2xl p-6 bg-card space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-base font-bold">🤖 AI 인용 지수 (AEO Answer Index)</h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleRunAudit}
                        disabled={isPending}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
                        {isPending ? '시뮬레이션 감사 중...' : '프롬프트 시뮬레이션 감사 실행'}
                    </button>
                </div>
                <p className="text-xs text-muted-foreground">
                    타겟 산업·지역 프롬프트 시뮬레이션 감사 데이터를 불러올 수 없습니다. 우측 버튼을 눌러 즉시 진단하세요.
                </p>
            </div>
        );
    }

    const scoreColor =
        audit.answerIndex >= 70
            ? 'text-emerald-600'
            : audit.answerIndex >= 45
            ? 'text-indigo-600'
            : 'text-amber-600';

    const scoreBadgeClass =
        audit.answerIndex >= 70
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : audit.answerIndex >= 45
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : 'bg-amber-50 text-amber-700 border-amber-200';

    return (
        <div className="border border-indigo-100 rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-indigo-50/40 via-white to-white space-y-6 shadow-2xs">
            {/* 상단 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white">
                            <Bot className="w-4 h-4" />
                        </span>
                        <h3 className="text-base font-bold text-slate-900">
                            AEO &apos;Answer Index&apos; (AI 답변 인용 지수)
                        </h3>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${scoreBadgeClass}`}>
                            Synthetic Prompt Audit ({audit.promptCount}개 타겟 질의)
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        주요 생성형 AI(ChatGPT, Gemini, Perplexity, Google AI Overviews)가{' '}
                        <strong className="text-slate-700">{audit.targetName}</strong>을(를) 실제 답변 출처로 인용하는 정량 지표(0~100점)입니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRunAudit}
                    disabled={isPending}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto shrink-0 print:hidden"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
                    {isPending ? 'AI 프롬프트 감사 중...' : '프롬프트 감사 재실행'}
                </button>
            </div>

            {/* 1. 핵심 KPI + 월간 리포트용 인용률 상승 증명 카드 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 종합 점수 게이지 */}
                <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">종합 Answer Index</span>
                        <span className="text-[11px] font-medium text-slate-400">100점 만점</span>
                    </div>
                    <div className="my-3 flex items-baseline gap-2">
                        <span className={`text-4xl font-black tracking-tight ${scoreColor}`}>
                            {audit.answerIndex}
                        </span>
                        <span className="text-sm font-bold text-slate-400">/ 100점</span>
                        {audit.deltaIndex > 0 && (
                            <span className="ml-auto inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <ArrowUpRight className="w-3.5 h-3.5" />+{audit.deltaIndex}점 상승
                            </span>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                                style={{ width: `${audit.answerIndex}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>AI 브랜드 언급률: <strong className="text-slate-800">{audit.mentionRate}%</strong></span>
                            <span>출처 인용률: <strong className="text-indigo-600">{audit.citationRate}%</strong></span>
                        </div>
                    </div>
                </div>

                {/* 월간 리드 리포트 인용률 변화 증명 (구독 이탈 방어용) */}
                <div className="lg:col-span-8 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-950">
                                리빙 프로필·매거진 최적화 전후 AI 인용률 변화 (월간 리포트 핵심 지표)
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200">
                            구독 성과 증명
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
                        <div className="bg-white/90 border border-emerald-100 rounded-lg p-3">
                            <div className="text-[11px] text-slate-500">최적화 이전 (Baseline)</div>
                            <div className="text-xl font-bold text-slate-500 mt-0.5">
                                {audit.baselineIndex}%
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">단순 웹 노출 수준</div>
                        </div>

                        <div className="bg-white border border-emerald-300 rounded-lg p-3 shadow-2xs">
                            <div className="text-[11px] font-semibold text-emerald-700">현재 AI 인용 지수</div>
                            <div className="text-2xl font-black text-emerald-600 mt-0.5 flex items-center gap-1.5">
                                <span>{audit.baselineIndex}%</span>
                                <span className="text-slate-400 text-sm">➡️</span>
                                <span>{audit.answerIndex}%</span>
                            </div>
                            <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                                진사이트 구조화 프로필·기사 반영
                            </div>
                        </div>

                        <div className="bg-white/90 border border-emerald-100 rounded-lg p-3">
                            <div className="text-[11px] text-slate-500">인용 경쟁력 상승폭</div>
                            <div className="text-xl font-extrabold text-indigo-600 mt-0.5">
                                +{Math.max(0, audit.deltaIndex)}%p 상승
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                타겟 키워드 {audit.industryKeywords.length}개 기준
                            </div>
                        </div>
                    </div>

                    <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                        💡 <strong>인사이트:</strong> Schema.org(JSON-LD) 리빙 프로필 유지관리와 심층 매거진 아티클 연결을 통해 생성형 AI가 산업·지역 대표 사례 질의 시 <strong>{audit.targetName}</strong>을(를) 출처로 채택할 확률이 초기 대비 <strong>+{Math.max(0, audit.deltaIndex)}%p</strong> 향상되었습니다.
                    </p>
                </div>
            </div>

            {/* 2. 4대 생성형 AI 엔진별 인용 준비도 */}
            <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    주요 생성형 AI 엔진별 인용 성과 분석
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {audit.engines.map((eng) => {
                        const badgeColor =
                            eng.status === '높음'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : eng.status === '보통'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200';
                        return (
                            <div
                                key={eng.engine}
                                className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col justify-between gap-2"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-slate-900">{eng.engine}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                            인용도 {eng.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-2xl font-extrabold text-slate-900">{eng.score}</span>
                                        <span className="text-xs text-slate-400">/ 100</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                                    {eng.citationNote}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. 타겟 프롬프트 시뮬레이션 감사 결과 (Synthetic Prompt Audit) */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                        타겟 산업·지역 프롬프트 시뮬레이션 감사 상세 ({audit.prompts.length}개 쿼리)
                    </h4>
                    {audit.industryKeywords.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[11px] text-slate-400 mr-1">타겟 키워드:</span>
                            {audit.industryKeywords.slice(0, 5).map((kw, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                                >
                                    #{kw}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                    <th className="py-2.5 px-3.5 font-semibold">시뮬레이션 질의 (Synthetic Prompt)</th>
                                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">질의 의도</th>
                                    <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">브랜드 언급</th>
                                    <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">진사이트 출처 인용</th>
                                    <th className="py-2.5 px-3 text-right font-semibold whitespace-nowrap">인용 신뢰도</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {audit.prompts.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3 px-3.5 max-w-md">
                                            <div className="font-semibold text-slate-900">
                                                &ldquo;{item.prompt}&rdquo;
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                                {item.simulatedSnippet}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                                            {item.intent}
                                        </td>
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                            {item.mentioned ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="w-3 h-3" /> 언급됨
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                                                    미언급
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                            {item.citedSource ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    <CheckCircle2 className="w-3 h-3" /> 출처 채택
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                    보강 권장
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap tabular-nums">
                                            {item.confidence}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 4. 필수 기술적 한계 고지 (Disclaimer) */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <strong>필수 고지 (AI 측정 구조 안내):</strong> 유저가 출처 링크를 클릭하지 않고 ChatGPT·Gemini·Perplexity 등 AI 답변 화면만 확인한 뒤 이탈한 <strong>&lsquo;AI 단순 노출 수(Zero-Click Impression)&rsquo;는 빅테크 비공개 정책상 어떤 기술로도 직접 조회가 원천 불가</strong>합니다. 이에 따라 진사이트의 <strong>Answer Index</strong>는 타겟 산업·지역 표준 쿼리를 주기적으로 시뮬레이션 검증하는 <strong>&lsquo;프롬프트 시뮬레이션 감사(Synthetic Prompt Audit)&rsquo;</strong>와 GA4 AI 레퍼러 실유입 데이터를 결합하여 산출됩니다.
                </div>
            </div>
        </div>
    );
}
