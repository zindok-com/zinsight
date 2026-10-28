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
                        <h3 className="text-base font-bold">🤖 AEO 콘텐츠 준비도 지수 (내부 평가)</h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleRunAudit}
                        disabled={isPending}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
                        {isPending ? '내부 준비도 평가 중...' : '콘텐츠 준비도 평가 실행'}
                    </button>
                </div>
                <p className="text-xs text-muted-foreground">
                    아직 산출된 내부 콘텐츠 준비도 평가 데이터가 없습니다. 우측 버튼을 눌러 즉시 진단하세요.
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
                            AEO 콘텐츠 준비도 지수 (내부 구조화 평가)
                        </h3>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${scoreBadgeClass}`}>
                            내부 구조화 진단 ({audit.promptCount}개 예상 질의 기준)
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        생성형 AI(ChatGPT, Gemini, Perplexity 등)가{' '}
                        <strong className="text-slate-700">{audit.targetName}</strong>의 정보를 명확히 파악할 수 있도록 내부 프로필·기사·구조화 데이터(JSON-LD)가 얼마나 갖춰져 있는지 평가한 <strong>내부 준비도 점수(0~100점)</strong>입니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRunAudit}
                    disabled={isPending}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto shrink-0 print:hidden"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
                    {isPending ? '내부 준비도 재계산 중...' : '준비도 점수 재계산'}
                </button>
            </div>

            {/* 1. 핵심 KPI + 콘텐츠 구조화 전후 비교 카드 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 종합 점수 게이지 */}
                <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">종합 준비도 점수 (내부 평가)</span>
                        <span className="text-[11px] font-medium text-slate-400">100점 만점</span>
                    </div>
                    <div className="my-3 flex items-baseline gap-2">
                        <span className={`text-4xl font-black tracking-tight ${scoreColor}`}>
                            {audit.answerIndex}
                        </span>
                        <span className="text-sm font-bold text-slate-400">/ 100점</span>
                        {audit.deltaIndex > 0 && (
                            <span className="ml-auto inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <ArrowUpRight className="w-3.5 h-3.5" />+{audit.deltaIndex}점 향상
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
                            <span>예상 질의 커버리지: <strong className="text-slate-800">{audit.mentionRate}%</strong></span>
                            <span>구조화 데이터 충족률: <strong className="text-indigo-600">{audit.citationRate}%</strong></span>
                        </div>
                    </div>
                </div>

                {/* 프로필·매거진 최적화 전후 비교 */}
                <div className="lg:col-span-8 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-950">
                                프로필·매거진 등록 전후 AEO 콘텐츠 준비도 비교
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200">
                            내부 구조화 수준 비교
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
                        <div className="bg-white/90 border border-emerald-100 rounded-lg p-3">
                            <div className="text-[11px] text-slate-500">기본 미등록 상태 (기준치)</div>
                            <div className="text-xl font-bold text-slate-500 mt-0.5">
                                {audit.baselineIndex}점
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">프로필·스키마 미적용 시</div>
                        </div>

                        <div className="bg-white border border-emerald-300 rounded-lg p-3 shadow-2xs">
                            <div className="text-[11px] font-semibold text-emerald-700">현재 내부 준비도 점수</div>
                            <div className="text-2xl font-black text-emerald-600 mt-0.5 flex items-center gap-1.5">
                                <span>{audit.baselineIndex}점</span>
                                <span className="text-slate-400 text-sm">➡️</span>
                                <span>{audit.answerIndex}점</span>
                            </div>
                            <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                                진사이트 구조화 프로필·기사 반영
                            </div>
                        </div>

                        <div className="bg-white/90 border border-emerald-100 rounded-lg p-3">
                            <div className="text-[11px] text-slate-500">콘텐츠 준비도 향상폭</div>
                            <div className="text-xl font-extrabold text-indigo-600 mt-0.5">
                                +{Math.max(0, audit.deltaIndex)}점 향상
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                등록 키워드 {audit.industryKeywords.length}개 기준
                            </div>
                        </div>
                    </div>

                    <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                        💡 <strong>평가 요약:</strong> Schema.org(JSON-LD) 프로필 데이터와 매거진·뉴스 아티클 연결을 통해 <strong>{audit.targetName}</strong>의 내부 AEO 콘텐츠 준비도 점수가 기준치 대비 <strong>+{Math.max(0, audit.deltaIndex)}점</strong> 높게 구성되어 있습니다.
                    </p>
                </div>
            </div>

            {/* 2. 4대 생성형 AI 엔진별 콘텐츠 적합도 */}
            <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    주요 AI 엔진별 콘텐츠 적합도 (내부 구조 기준)
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
                                            적합도 {eng.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-2xl font-extrabold text-slate-900">{eng.score}</span>
                                        <span className="text-xs text-slate-400">/ 100점</span>
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

            {/* 3. 예상 질문 유형별 내부 콘텐츠 충족도 평가 */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                        예상 질문 유형별 내부 콘텐츠 충족도 평가 ({audit.prompts.length}개 항목)
                    </h4>
                    {audit.industryKeywords.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[11px] text-slate-400 mr-1">등록 키워드:</span>
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
                                    <th className="py-2.5 px-3.5 font-semibold">예상 질문 유형 (Target Query)</th>
                                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">평가 영역</th>
                                    <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">기본 정보 충족</th>
                                    <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">심층·구조화 충족</th>
                                    <th className="py-2.5 px-3 text-right font-semibold whitespace-nowrap">내부 평가 점수</th>
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
                                                    <CheckCircle2 className="w-3 h-3" /> 기준 충족
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                                                    정보 부족
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                            {item.citedSource ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    <CheckCircle2 className="w-3 h-3" /> 구조화 완료
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                    보강 권장
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap tabular-nums">
                                            {item.confidence}점
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 4. 내부 평가 지표 기준 안내 */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <strong>내부 평가 지표 기준 안내:</strong> 본 섹션의 수치는 외부 AI 검색엔진의 실제 사용자 검색 히스토리가 아니라, 진사이트 내부의 <strong>프로필 완성도(요약문·핵심 키워드·FAQ·JSON-LD 스키마)와 연결된 매거진·뉴스 기사 수</strong>를 바탕으로 산출한 <strong>내부 콘텐츠 준비도 평가 점수</strong>입니다. 실제 AI 서비스를 통한 방문자 클릭 유입 수는 하단의 <strong>&lsquo;유입 채널(AI 서비스)&rsquo;</strong> 및 <strong>&lsquo;세부 유입 플랫폼&rsquo;</strong> 지표를 참고해 주세요.
                </div>
            </div>
        </div>
    );
}
