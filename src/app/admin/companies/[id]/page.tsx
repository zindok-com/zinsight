'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { prisma } from '@/lib/db';
import { ingestByOrganization } from '@/actions/ingest-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Newspaper, Loader2, MapPin, Calendar, Globe, User } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Organization {
    id: number;
    company_name: string;
    entity_type: string | null;
    business_summary: string | null;
    hq_location: string | null;
    founded_year: string | null;
    ceo_name: string | null;
    company_url: string | null;
    region: { id: number; name: string; slug: string } | null;
    ingestions: Array<{
        id: number;
        source: string;
        fetched_at: string;
        article: {
            id: number;
            title: string;
            pub_date: string | null;
            link: string | null;
        } | null;
    }>;
    _count: { company_articles: number; ingestions: number };
}

export default function CompanyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const [company, setCompany] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [ingesting, setIngesting] = useState(false);

    useEffect(() => {
        fetch(`/api/companies/${id}`)
            .then(res => res.json())
            .then(data => { setCompany(data); setLoading(false); })
            .catch(() => { toast.error('조직 정보를 불러올 수 없습니다.'); setLoading(false); });
    }, [id]);

    async function handleIngest() {
        if (!company) return;
        setIngesting(true);
        toast.info(`"${company.company_name}" 연관 기사 수집 중...`);
        try {
            const result = await ingestByOrganization(id);
            if (result.success) {
                toast.success(result.message);
                // 페이지 새로고침으로 목록 갱신
                window.location.reload();
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            toast.error('수집 중 오류가 발생했습니다.');
        } finally {
            setIngesting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zi-primary" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <p>조직을 찾을 수 없습니다.</p>
                <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> 돌아가기
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            {/* 헤더 */}
            <div className="flex items-center gap-4">
                <Link href="/admin/companies">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" /> 목록
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{company.company_name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        {company.entity_type && (
                            <Badge variant="outline" className="text-xs">{company.entity_type}</Badge>
                        )}
                        {company.region && (
                            <Badge className="bg-zi-primary/10 text-zi-primary border-0 text-xs">
                                <MapPin className="h-3 w-3 mr-1" />{company.region.name}
                            </Badge>
                        )}
                    </div>
                </div>
                <Button
                    onClick={handleIngest}
                    disabled={ingesting}
                    className="bg-zi-primary hover:bg-zi-primary/90 text-white"
                >
                    {ingesting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />수집 중...</>
                    ) : (
                        <><Newspaper className="h-4 w-4 mr-2" />연관 기사 수집</>
                    )}
                </Button>
            </div>

            {/* 기본 정보 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {company.hq_location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span>{company.hq_location}</span>
                        </div>
                    )}
                    {company.founded_year && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>설립 {company.founded_year}</span>
                        </div>
                    )}
                    {company.ceo_name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span>대표 {company.ceo_name}</span>
                        </div>
                    )}
                    {company.company_url && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Globe className="h-4 w-4 flex-shrink-0" />
                            <a href={company.company_url} target="_blank" rel="noopener noreferrer"
                               className="text-zi-primary hover:underline truncate">
                                {company.company_url}
                            </a>
                        </div>
                    )}
                    {company.business_summary && (
                        <div className="sm:col-span-2 text-muted-foreground leading-relaxed">
                            {company.business_summary}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 수집 기사 통계 */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-zi-primary">{company._count.company_articles}</p>
                        <p className="text-sm text-muted-foreground mt-1">연결 기사</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-zi-primary">{company._count.ingestions}</p>
                        <p className="text-sm text-muted-foreground mt-1">수집 기사 (MANUAL_ORG)</p>
                    </CardContent>
                </Card>
            </div>

            {/* 최근 수집 기사 목록 */}
            {company.ingestions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Newspaper className="h-4 w-4 text-zi-primary" />
                            최근 수집 기사 (조직 우선 수집)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {company.ingestions.map((ing) => (
                                <div key={ing.id} className="flex items-start gap-3 p-3 border border-zi-divider rounded-lg hover:bg-zi-surface/50 transition-colors">
                                    <Badge variant="outline" className="text-[10px] flex-shrink-0 mt-0.5">
                                        {ing.source}
                                    </Badge>
                                    <div className="min-w-0 flex-1">
                                        {ing.article ? (
                                            <>
                                                <p className="text-sm font-medium truncate">{ing.article.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                    {ing.article.pub_date && (
                                                        <span>{new Date(ing.article.pub_date).toLocaleDateString('ko-KR')}</span>
                                                    )}
                                                    {ing.article.link && (
                                                        <a href={ing.article.link} target="_blank" rel="noopener noreferrer"
                                                           className="text-zi-primary hover:underline">원문 보기</a>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">기사 정보 없음</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {new Date(ing.fetched_at).toLocaleDateString('ko-KR')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
