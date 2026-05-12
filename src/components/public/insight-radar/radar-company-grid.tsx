import { Building2, FileText, ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RadarCompanyCard } from '@/actions/insight-radar-actions';
import { RadarCompanyDetailDialog } from './radar-company-detail-dialog';

interface RadarCompanyGridProps {
    companies: RadarCompanyCard[];
    total: number;
}

/**
 * `core_keywords` 필드(JSON)에서 키워드 텍스트 배열을 안전하게 추출합니다.
 */
function extractKeywords(raw: unknown): string[] {
    if (!raw) return [];
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
            return parsed
                .map((item) => (typeof item === 'string' ? item : item?.text ?? item?.keyword ?? ''))
                .filter(Boolean)
                .slice(0, 5);
        }
    } catch {
        // JSON 파싱 실패 시 빈 배열 반환
    }
    return [];
}

/**
 * 엔티티 타입을 한국어 레이블로 변환합니다.
 */
function getEntityLabel(type: string | null): string {
    const map: Record<string, string> = {
        company: '기업',
        institution: '기관',
        center: '센터',
        organization: '단체',
    };
    return type ? (map[type] ?? type) : '기업';
}

export function RadarCompanyGrid({ companies, total }: RadarCompanyGridProps) {
    if (companies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <Building2 className="mb-4 h-12 w-12 opacity-30" />
                <p className="text-lg font-medium">조건에 맞는 조직이 없습니다</p>
                <p className="mt-1 text-sm">필터를 변경하거나 초기화해보세요.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 결과 수 표시 */}
            <p className="text-sm text-muted-foreground">
                총 <span className="font-semibold text-foreground">{total.toLocaleString()}</span>개 조직
            </p>

            {/* 기업 카드 그리드 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {companies.map((company) => {
                    const keywords = extractKeywords(company.core_keywords);

                    return (
                        <Card
                            key={company.id}
                            id={`company-card-${company.id}`}
                            className="group flex flex-col transition-shadow hover:shadow-md"
                        >
                            <CardHeader className="pb-3">
                                {/* 조직 유형 & 산업 뱃지 */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-wrap gap-1.5">
                                        <Badge variant="secondary" className="text-xs">
                                            {getEntityLabel(company.entity_type)}
                                        </Badge>
                                        {company.allIndustries && company.allIndustries.length > 0 ? (
                                            company.allIndustries.map((ind) => (
                                                <Badge key={ind.id} variant="outline" className="text-xs">
                                                    {ind.name}
                                                </Badge>
                                            ))
                                        ) : company.industry && (
                                            <Badge variant="outline" className="text-xs">
                                                {company.industry.name}
                                            </Badge>
                                        )}
                                    </div>
                                    {/* 기사 수 */}
                                    {company.articleCount > 0 && (
                                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                            <FileText className="h-3 w-3" />
                                            {company.articleCount}
                                        </span>
                                    )}
                                </div>

                                {/* 기업명 */}
                                <h3 className="mt-2 line-clamp-1 text-base font-semibold leading-tight">
                                    {company.company_name}
                                </h3>
                            </CardHeader>

                            <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                                {/* 사업 요약 */}
                                {company.business_summary && (
                                    <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                                        {company.business_summary}
                                    </p>
                                )}

                                {/* 핵심 키워드 태그 */}
                                {keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {keywords.map((kw, i) => (
                                            <span
                                                key={i}
                                                className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                                            >
                                                #{kw}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* 최신 추출 키워드 (recent_keywords) */}
                                {(() => {
                                    const recentKws = extractKeywords(company.recent_keywords);
                                    if (recentKws.length === 0) return null;
                                    return (
                                        <div className="flex flex-wrap gap-1">
                                            {recentKws.map((kw, i) => (
                                                <span
                                                    key={i}
                                                    className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 border border-blue-100"
                                                >
                                                    #{kw}
                                                </span>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {/* 하단: 날짜 & 상세 버튼 */}
                                <div className="mt-auto flex items-center justify-between pt-2">
                                    {company.latestArticleDate ? (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(company.latestArticleDate), 'yy.MM.dd', {
                                                locale: ko,
                                            })}
                                        </span>
                                    ) : (
                                        <span />
                                    )}
                                    <RadarCompanyDetailDialog companyId={company.id} companyName={company.company_name} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
