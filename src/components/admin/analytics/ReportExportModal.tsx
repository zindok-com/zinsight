'use client';

import { useState } from 'react';
import { saveAnalyticsReport } from '@/actions/admin/analytics-actions';

interface Props {
    entityType: 'article' | 'organization';
    entityId: number;
    entityName: string;
    currentPeriod: string;
    analyticsData: object;
    onClose: () => void;
}

export function ReportExportModal({
    entityType,
    entityId,
    entityName,
    currentPeriod,
    analyticsData,
    onClose,
}: Props) {
    const [reportType, setReportType] = useState<'simple' | 'detailed'>('simple');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const periodDaysMap: Record<string, number> = { '7': 7, '30': 30, '90': 90, 'all': 0 };
    const periodLabel: Record<string, string> = { '7': '최근 7일', '30': '최근 30일', '90': '최근 90일', 'all': '전체 기간' };
    const periodDays = periodDaysMap[currentPeriod] ?? 30;
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    const handlePrint = async () => {
        if (!saved) {
            setIsSaving(true);
            try {
                await saveAnalyticsReport({
                    entityType,
                    entityId,
                    entityName,
                    reportType,
                    periodDays,
                    dataSnapshot: analyticsData,
                });
                setSaved(true);
            } catch (e) {
                console.error('[ReportExportModal] 스냅샷 저장 실패:', e);
            } finally {
                setIsSaving(false);
            }
        }
        window.print();
    };

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold">📄 리포트 생성</h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
                    </div>

                    <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">대상</p>
                        <p className="font-medium">{entityName}</p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">리포트 형식</p>
                        <div className="flex gap-2">
                            {(['simple', 'detailed'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setReportType(t)}
                                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                                        reportType === t
                                            ? 'bg-foreground text-background border-foreground'
                                            : 'text-muted-foreground border-border hover:text-foreground'
                                    }`}
                                >
                                    {t === 'simple' ? '간편형' : '상세형'}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            간편형: 핵심 수치 요약 / 상세형: 차트·퍼널·방문자 속성 전체 포함
                        </p>
                    </div>

                    <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground space-y-0.5">
                        <p>📅 기간: {periodLabel[currentPeriod] ?? currentPeriod}</p>
                        <p>🕒 기준일: {today}</p>
                        <p>✅ 생성 시 데이터가 스냅샷으로 저장됩니다. 이력 → 관리 &gt; 애널리틱스 리포트</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                            취소
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={isSaving}
                            className="flex-1 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
                        >
                            {isSaving ? '저장 중…' : '🖨 인쇄 / PDF 저장'}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body > *:not(#analytics-print-target) {
                        display: none !important;
                    }
                    #analytics-print-target {
                        display: block !important;
                    }
                }
            `}</style>
        </>
    );
}