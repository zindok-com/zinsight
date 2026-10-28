'use client';

import type { PlatformTrafficRow, CustomChannel } from '@/lib/analytics/types';

const CATEGORY_BADGE: Record<CustomChannel, { label: string; className: string }> = {
    ai_service: {
        label: '🤖 AI',
        className: 'bg-violet-50 text-violet-700 border-violet-200',
    },
    search: {
        label: '🔍 검색엔진',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    sns: {
        label: '📱 SNS',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    direct: {
        label: '🔗 직접',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    other: {
        label: '🌐 외부',
        className: 'bg-slate-50 text-slate-600 border-slate-200',
    },
};

function formatDuration(sec: number): string {
    if (!sec || sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    if (m === 0) return `${s}초`;
    return `${m}분 ${s}초`;
}

interface Props {
    rows: PlatformTrafficRow[];
    title?: string;
    subtitle?: string;
    compact?: boolean;
}

export function PlatformTrafficBreakdownCard({
    rows,
    title = '🌐 세부 유입처 랭킹 (네이버·구글·다음·빙·AI)',
    subtitle = 'GA4 sessionSource 기준 플랫폼별 유입 세션 및 점유율',
    compact = false,
}: Props) {
    const safeRows = rows ?? [];
    const totalSessions = safeRows.reduce((sum, r) => sum + r.sessions, 0);
    const maxSessions = safeRows.length > 0 ? Math.max(...safeRows.map((r) => r.sessions)) : 0;

    // 핵심 검색포털 + AI 빠른 요약 칩 (0건이어도 대표님 확인용으로 주요 플랫폼 하이라이트)
    const keyPlatforms = [
        { key: 'naver', label: '네이버', color: '#03c75a' },
        { key: 'google', label: '구글', color: '#4285f4' },
        { key: 'daum', label: '다음', color: '#ff5722' },
        { key: 'bing', label: '빙(Bing)', color: '#008373' },
        { key: 'chatgpt', label: 'ChatGPT', color: '#10a37f' },
        { key: 'perplexity', label: 'Perplexity', color: '#20808d' },
        { key: 'gemini', label: 'Gemini', color: '#8e75b2' },
    ];

    const rowMap = new Map(safeRows.map((r) => [r.key, r]));

    return (
        <div className="border rounded-xl p-4 sm:p-5 bg-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">{title}</h3>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                    )}
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    총 {totalSessions.toLocaleString()} 세션
                </span>
            </div>

            {/* 주요 포털 및 생성형 AI 요약 배지 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {keyPlatforms.map((kp) => {
                    const matched = rowMap.get(kp.key);
                    const sessions = matched?.sessions ?? 0;
                    const pct = matched?.sharePct ?? 0;
                    return (
                        <div
                            key={kp.key}
                            className={`rounded-lg border p-2.5 transition-colors ${
                                sessions > 0
                                    ? 'bg-white border-slate-200 shadow-2xs'
                                    : 'bg-slate-50/60 border-slate-100 opacity-75'
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: kp.color }}
                                />
                                <span className="text-xs font-semibold text-slate-700 truncate">
                                    {kp.label}
                                </span>
                            </div>
                            <div className="mt-1 flex items-baseline justify-between gap-1">
                                <span className="text-base font-bold text-slate-900">
                                    {pct}%
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    {sessions.toLocaleString()}회
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 전체 유입처 상세 랭킹 */}
            {safeRows.length > 0 ? (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    {(compact ? safeRows.slice(0, 8) : safeRows).map((row, idx) => {
                        const barWidth = maxSessions > 0 ? (row.sessions / maxSessions) * 100 : 0;
                        const badge = CATEGORY_BADGE[row.category] ?? CATEGORY_BADGE.other;
                        return (
                            <div
                                key={row.key}
                                className="flex items-center gap-3 text-xs sm:text-sm py-1"
                            >
                                {/* 좌측 고정 너비 라벨 영역 (순위 + 카테고리 배지 + 플랫폼명) */}
                                <div className="w-48 sm:w-56 shrink-0 flex items-center gap-2 min-w-0">
                                    <span className="w-5 text-xs font-bold text-slate-400 text-right shrink-0 tabular-nums">
                                        {idx + 1}
                                    </span>
                                    <span
                                        className={`w-[64px] inline-flex items-center justify-center py-0.5 rounded text-[10px] font-semibold border shrink-0 ${badge.className}`}
                                    >
                                        {badge.label}
                                    </span>
                                    <span
                                        className="flex-1 min-w-0 font-medium text-slate-800 truncate"
                                        title={row.label}
                                    >
                                        {row.label}
                                    </span>
                                </div>

                                {/* 중앙 막대 그래프 영역 (모든 행 동일 시작점 정렬) */}
                                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden min-w-[60px]">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{
                                            width: `${Math.max(barWidth, 2)}%`,
                                            backgroundColor: row.color,
                                        }}
                                    />
                                </div>

                                {/* 우측 수치 영역 */}
                                <div className="w-28 sm:w-32 text-right shrink-0 flex items-center justify-end gap-1.5 tabular-nums">
                                    <span className="font-bold text-slate-900">
                                        {row.sessions.toLocaleString()}회
                                    </span>
                                    <span className="text-xs font-semibold text-indigo-600 w-12 text-right">
                                        ({row.sharePct}%)
                                    </span>
                                </div>
                                {!compact && (
                                    <span className="hidden sm:inline-block w-16 text-right text-xs text-slate-400 shrink-0 tabular-nums">
                                        {formatDuration(row.avgDuration)}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-6 text-xs text-muted-foreground bg-slate-50/50 rounded-lg border border-dashed">
                    선택한 기간 내 집계된 세부 유입처 데이터가 없습니다.
                </div>
            )}
        </div>
    );
}
