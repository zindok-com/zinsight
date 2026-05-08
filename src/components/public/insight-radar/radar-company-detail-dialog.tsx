'use client';

import { useState, useTransition } from 'react';
import { ExternalLink, Loader2, Building2, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { getRadarCompanyDetail } from '@/actions/insight-radar-actions';

interface RadarCompanyDetailDialogProps {
    companyId: number;
    companyName: string;
}

type CompanyDetail = Awaited<ReturnType<typeof getRadarCompanyDetail>>;

function extractKeywords(raw: unknown): string[] {
    if (!raw) return [];
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
            return parsed
                .map((item) => (typeof item === 'string' ? item : item?.text ?? item?.keyword ?? ''))
                .filter(Boolean);
        }
    } catch {
        return [];
    }
    return [];
}

export function RadarCompanyDetailDialog({ companyId, companyName }: RadarCompanyDetailDialogProps) {
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState<CompanyDetail>(null);
    const [isPending, startTransition] = useTransition();

    function handleOpen(isOpen: boolean) {
        setOpen(isOpen);
        // 다이얼로그가 열릴 때 데이터 로드
        if (isOpen && !detail) {
            startTransition(async () => {
                const data = await getRadarCompanyDetail(companyId);
                setDetail(data);
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button
                    id={`company-detail-btn-${companyId}`}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-primary hover:text-primary"
                >
                    상세보기 →
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {companyName}
                    </DialogTitle>
                </DialogHeader>

                {isPending ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : detail ? (
                    <div className="space-y-5 pt-1">
                        {/* 산업 & 유형 */}
                        <div className="flex flex-wrap gap-2">
                            {detail.entity_type && (
                                <Badge variant="secondary">{detail.entity_type}</Badge>
                            )}
                            {'industry' in detail && detail.industry && (
                                <Badge variant="outline">
                                    {(detail.industry as { name: string }).name}
                                </Badge>
                            )}
                        </div>

                        {/* 사업 요약 */}
                        {detail.business_summary && (
                            <div>
                                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    사업 요약
                                </h4>
                                <p className="text-sm leading-relaxed text-foreground">
                                    {detail.business_summary}
                                </p>
                            </div>
                        )}

                        {/* 키워드 (핵심 & 최신) */}
                        <div className="flex flex-col gap-4">
                            {(() => {
                                const coreKws = extractKeywords(detail.core_keywords);
                                if (coreKws.length === 0) return null;
                                return (
                                    <div>
                                        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            핵심 키워드
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {coreKws.map((kw, i) => (
                                                <Badge key={i} variant="secondary" className="font-normal">
                                                    #{kw}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {(() => {
                                const recentKws = extractKeywords(detail.recent_keywords);
                                if (recentKws.length === 0) return null;
                                return (
                                    <div>
                                        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            최신 추출 키워드
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {recentKws.map((kw, i) => (
                                                <Badge key={i} variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-normal">
                                                    #{kw}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* 최근 동향 */}
                        {detail.recent_status && (
                            <div>
                                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    최근 동향
                                </h4>
                                <p className="text-sm leading-relaxed text-foreground">
                                    {detail.recent_status}
                                </p>
                            </div>
                        )}

                        {/* 관련 기사 */}
                        {detail.recentArticles && detail.recentArticles.length > 0 && (
                            <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    최근 관련 기사{' '}
                                    <span className="normal-case text-muted-foreground/60">
                                        (총 {detail.articleCount}건)
                                    </span>
                                </h4>
                                <ul className="space-y-2">
                                    {detail.recentArticles.map((article: {
                                        id: number;
                                        title: string;
                                        pub_date: Date | null;
                                        source: string;
                                        url: string | null;
                                        summary: string | null;
                                    }) => (
                                        <li
                                            key={article.id}
                                            className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 text-sm font-medium leading-snug">
                                                    {article.title}
                                                </p>
                                                {article.pub_date && (
                                                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(article.pub_date), 'yyyy.MM.dd', {
                                                            locale: ko,
                                                        })}
                                                        {article.source && ` · ${article.source}`}
                                                    </span>
                                                )}
                                            </div>
                                            {article.url && (
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0 text-primary hover:text-primary/80"
                                                    aria-label="원문 보기"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        데이터를 불러오는 중 오류가 발생했습니다.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
