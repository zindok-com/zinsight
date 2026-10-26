'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Radio,
    Building2,
    MapPin,
    ShieldCheck,
    ExternalLink,
    Globe2,
    Clock,
    Sparkles,
    Users,
    FileText,
} from 'lucide-react';
import type { RealtimeOverview } from '@/lib/analytics/types';
import type { VisitorOrgLogItem } from '@/actions/visitor-org-actions';

interface RealtimeAndB2BVisitorsCardProps {
    realtime: RealtimeOverview | null | undefined;
    visitorLogs: VisitorOrgLogItem[];
    b2bCount: number;
    totalLogCount: number;
}

export function RealtimeAndB2BVisitorsCard({
    realtime,
    visitorLogs,
    b2bCount,
    totalLogCount,
}: RealtimeAndB2BVisitorsCardProps) {
    const [tab, setTab] = useState<'b2b' | 'all'>('b2b');

    const filteredLogs =
        tab === 'b2b'
            ? visitorLogs.filter((l) => l.is_b2b)
            : visitorLogs;

    const displayLogs = filteredLogs.length > 0 ? filteredLogs : visitorLogs;

    const formatRelativeTime = (dateInput: Date | string) => {
        const d = new Date(dateInput);
        const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diffSec < 60) return '방금 전';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
        return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-5">
            {/* 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <h3 className="text-base font-bold text-white">
                            실시간 방문자 & B2B 기업·기관 네트워크 식별
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            GA4 Realtime + ASN/Whois 역추적
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        현재 실시간 접속 현황(도시 단위)과 공인 IP 대역(ASN/Whois) 기반 방문 기업·대학교·지자체 네트워크를 식별합니다.
                    </p>
                </div>

                {/* 탭 전환 */}
                <div className="flex items-center gap-1.5 bg-slate-900/70 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setTab('b2b')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            tab === 'b2b'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        기업·기관·대학망 ({b2bCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            tab === 'all'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Globe2 className="w-3.5 h-3.5" />
                        전체 네트워크 ({totalLogCount})
                    </button>
                </div>
            </div>

            {/* 상단 2단: GA4 실시간 위젯 + B2B 방문 기관 피드 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* 좌측 4컬럼: GA4 Realtime 요약 */}
                <div className="lg:col-span-4 bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-between space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                                GA4 실시간 활성 사용자 (최근 30분)
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                LIVE
                            </span>
                        </div>

                        <div className="flex items-baseline gap-2 my-2">
                            <span className="text-4xl font-extrabold text-white tracking-tight">
                                {(realtime?.activeUsers30m ?? 0).toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">명 접속 중</span>
                        </div>

                        {/* 실시간 접속 도시 */}
                        <div className="mt-4 space-y-2">
                            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-indigo-400" />
                                실시간 접속 지역 (Top Cities)
                            </div>
                            {realtime?.topCities && realtime.topCities.length > 0 ? (
                                <div className="space-y-1.5">
                                    {realtime.topCities.slice(0, 5).map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between text-xs bg-slate-800/70 px-2.5 py-1.5 rounded-lg border border-slate-700/40"
                                        >
                                            <span className="text-slate-200 font-medium truncate">
                                                {item.city === '(not set)' ? '지역 미상 (모바일/VPN)' : item.city}
                                            </span>
                                            <span className="text-emerald-400 font-bold tabular-nums">
                                                {item.activeUsers}명
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-slate-500 bg-slate-800/40 rounded-lg p-3 text-center">
                                    현재 30분 내 집계된 실시간 지역 데이터가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 실시간 활성 화면 */}
                    {realtime?.topPages && realtime.topPages.length > 0 && (
                        <div className="pt-3 border-t border-slate-800 space-y-1.5">
                            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-cyan-400" />
                                실시간 열람 중인 화면
                            </div>
                            {realtime.topPages.slice(0, 3).map((pg, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300 gap-2">
                                    <span className="truncate">{pg.screenName}</span>
                                    <span className="text-cyan-400 font-semibold shrink-0">{pg.activeUsers}명</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 우측 8컬럼: B2B 기관/기업 네트워크 역추적 로그 */}
                <div className="lg:col-span-8 bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                                공인 IP 대역(ASN/Whois) 역추적 방문 기관·네트워크 로그
                            </span>
                            <span className="text-[11px] text-slate-400">
                                최근 {displayLogs.length}건 표시
                            </span>
                        </div>

                        {displayLogs.length === 0 ? (
                            <div className="py-10 px-4 text-center space-y-2 border border-dashed border-slate-700/60 rounded-xl bg-slate-900/30">
                                <Users className="w-7 h-7 text-slate-500 mx-auto" />
                                <p className="text-xs font-semibold text-slate-300">
                                    아직 기록된 외부 기관/네트워크 방문 로그가 없습니다.
                                </p>
                                <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                                    외부 방문자가 매거진 기사 또는 인사이트 레이더 조직 프로필을 열람하면 공인 IP의 ASN/Whois 기관명이 자동으로 이곳에 기록됩니다. (예: 안양시청 행정망, 대림대학교, 기업 사내망 등)
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto max-h-[310px] overflow-y-auto pr-1">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-900 z-10">
                                        <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                                            <th className="py-2 pr-3 font-medium">식별된 기관 / 네트워크</th>
                                            <th className="py-2 px-2 font-medium">지역</th>
                                            <th className="py-2 px-2 font-medium">열람 콘텐츠</th>
                                            <th className="py-2 pl-2 text-right font-medium">방문 시각</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-xs">
                                        {displayLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="py-2.5 pr-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                                                log.is_b2b
                                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                                    : 'bg-slate-700/60 text-slate-300 border border-slate-600/50'
                                                            }`}
                                                        >
                                                            {log.is_b2b ? 'B2B·기관망' : '일반 통신망'}
                                                        </span>
                                                        <span className="font-semibold text-white truncate max-w-[210px]">
                                                            {log.org_name}
                                                        </span>
                                                        {log.asn && (
                                                            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                                                                {log.asn}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-2 text-slate-300 whitespace-nowrap">
                                                    {log.city || log.country || '-'}
                                                </td>
                                                <td className="py-2.5 px-2 max-w-[200px]">
                                                    <Link
                                                        href={log.page_path}
                                                        target="_blank"
                                                        className="text-indigo-300 hover:text-indigo-200 hover:underline inline-flex items-center gap-1 truncate max-w-full"
                                                    >
                                                        <span className="truncate">
                                                            {log.target_name || log.page_path}
                                                        </span>
                                                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                                                    </Link>
                                                </td>
                                                <td className="py-2.5 pl-2 text-right text-slate-400 whitespace-nowrap tabular-nums">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-slate-500" />
                                                        {formatRelativeTime(log.visited_at)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {tab === 'b2b' && b2bCount === 0 && totalLogCount > 0 && (
                        <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            현재 B2B 전용망 방문 기록이 없어 전체 통신망 방문 기록({totalLogCount}건)을 함께 표시하고 있습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* 개인정보보호법 준수 고지 배너 */}
            <div className="flex items-start gap-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                    <span className="font-semibold text-slate-300">개인정보보호법 및 통신 표준 준수 안내:</span>{' '}
                    비로그인 일반 방문자의 개인 신원(성명·연락처 등 개인특정정보)은 웹 기술 표준 및 법령상 수집이 불가합니다. 본 시스템은 글로벌 B2B 애널리틱스 표준에 따라 원문 IP를 SHA-256으로 비식별 해시 처리하고, 공인 IP 대역의 ASN/Whois 기관 할당 정보만을 조회하여 기업·대학·공공기관 단위의 방문 트렌드를 표출합니다.
                </div>
            </div>
        </div>
    );
}
