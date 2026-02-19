'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getExhibitionBySlug } from '@/actions/exhibition-actions';
import { getKeywords } from '@/actions/keyword-actions';
import { getArticles } from '@/actions/article-actions';
import { ingestByExhibition, ingestByKeyword, type IngestReport } from '@/actions/ingest-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, ArrowLeft, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

type Exhibition = Awaited<ReturnType<typeof getExhibitionBySlug>>;
type Keyword = Awaited<ReturnType<typeof getKeywords>>[number];
type ArticlePage = Awaited<ReturnType<typeof getArticles>>;
type ArticleItem = ArticlePage['articles'][number];

function IngestReportPanel({ report }: { report: IngestReport }) {
    return (
        <Card className={`border-l-4 ${report.success ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    {report.success
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : <AlertTriangle className="h-4 w-4 text-red-500" />}
                    수집 결과
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{report.message}</p>
                {report.success && (
                    <>
                        <div className="flex gap-4 text-muted-foreground">
                            <span className="text-green-600 font-semibold">신규: {report.newCount}</span>
                            <span className="text-yellow-600 font-semibold">중복: {report.dupCount}</span>
                            <span className="text-red-600 font-semibold">실패: {report.failCount}</span>
                        </div>
                        {report.perKeyword.length > 1 && (
                            <table className="w-full text-xs border-collapse mt-2">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-1">키워드</th>
                                        <th className="text-right py-1">신규</th>
                                        <th className="text-right py-1">중복</th>
                                        <th className="text-right py-1">실패</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.perKeyword.map(pk => (
                                        <tr key={pk.keywordId} className="border-b last:border-0">
                                            <td className="py-1">{pk.keywordText}</td>
                                            <td className="text-right py-1 text-green-600">{pk.newCount}</td>
                                            <td className="text-right py-1 text-yellow-600">{pk.dupCount}</td>
                                            <td className="text-right py-1 text-red-600">{pk.failCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function ArticlesByExhibitionPage() {
    const params = useParams();
    const router = useRouter();
    const exhibitionSlug = params.exhibitionSlug as string;

    const [exhibition, setExhibition] = useState<Exhibition | null>(null);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [selectedKeywordId, setSelectedKeywordId] = useState<number | ''>('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [articleData, setArticleData] = useState<ArticlePage | null>(null);
    const [page, setPage] = useState(1);
    const [ingestLoading, setIngestLoading] = useState(false);
    const [ingestReport, setIngestReport] = useState<IngestReport | null>(null);
    const [loadingArticles, setLoadingArticles] = useState(false);

    useEffect(() => {
        getExhibitionBySlug(exhibitionSlug).then(ex => {
            setExhibition(ex);
            if (ex) {
                getKeywords(ex.id, false).then(setKeywords);
            }
        });
    }, [exhibitionSlug]);

    const loadArticles = useCallback(async (p = 1) => {
        if (!exhibition) return;
        setLoadingArticles(true);
        const data = await getArticles({
            exhibitionId: exhibition.id,
            keywordId: selectedKeywordId ? Number(selectedKeywordId) : undefined,
            fromDate: fromDate ? new Date(fromDate) : undefined,
            toDate: toDate ? new Date(toDate + 'T23:59:59') : undefined,
            page: p,
            pageSize: 50,
        });
        setArticleData(data);
        setPage(p);
        setLoadingArticles(false);
    }, [exhibition, selectedKeywordId, fromDate, toDate]);

    useEffect(() => {
        if (exhibition) loadArticles(1);
    }, [exhibition, loadArticles]);

    async function handleIngestExhibition() {
        if (!exhibition) return;
        setIngestLoading(true);
        setIngestReport(null);
        toast.info('전시회 단위 수집 중...');
        const report = await ingestByExhibition(exhibition.id);
        setIngestReport(report);
        setIngestLoading(false);
        if (report.success) toast.success(report.message);
        else toast.error(report.message);
        loadArticles(1);
    }

    async function handleIngestKeyword() {
        if (!selectedKeywordId) { toast.error('키워드를 선택하세요.'); return; }
        setIngestLoading(true);
        setIngestReport(null);
        toast.info('키워드 단위 수집 중...');
        const report = await ingestByKeyword(Number(selectedKeywordId));
        setIngestReport(report);
        setIngestLoading(false);
        if (report.success) toast.success(report.message);
        else toast.error(report.message);
        loadArticles(1);
    }

    function handleExportJson() {
        if (!articleData || articleData.articles.length === 0) { toast.error('내보낼 기사가 없습니다.'); return; }
        const payload = {
            export_at: new Date().toISOString(),
            exhibition: exhibition?.name,
            filters: { keyword_id: selectedKeywordId, fromDate, toDate },
            count: articleData.total,
            articles: articleData.articles.map((a: ArticleItem) => ({
                id: a.id,
                canonical_link: a.canonical_link,
                title: a.title,
                description: a.description,
                pub_date: a.pub_date,
                created_at: a.created_at,
                updated_at: a.updated_at,
                is_duplicate: a.ingestions[0]?.is_duplicate,
                keyword: a.ingestions[0]?.keyword?.keyword_text,
            })),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `articles_${exhibitionSlug}_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('JSON 내보내기 완료');
    }

    if (!exhibition) return <div className="py-12 text-center text-muted-foreground">불러오는 중...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin/articles')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{exhibition.name}</h1>
                    <p className="text-xs text-muted-foreground font-mono">{exhibitionSlug}</p>
                </div>
            </div>

            {/* Filter Panel */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">필터 및 수집</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">키워드</label>
                            <select
                                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                value={selectedKeywordId}
                                onChange={e => setSelectedKeywordId(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">전체 키워드</option>
                                {keywords.map(kw => (
                                    <option key={kw.id} value={kw.id}>{kw.keyword_text}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">수집일 시작 (created_at)</label>
                            <input
                                type="date"
                                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">수집일 종료</label>
                            <input
                                type="date"
                                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => loadArticles(1)} variant="outline" disabled={loadingArticles}>
                            <RefreshCw className={`h-4 w-4 mr-1 ${loadingArticles ? 'animate-spin' : ''}`} />
                            조회
                        </Button>
                        <Button onClick={handleIngestExhibition} disabled={ingestLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {ingestLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                            전시회 단위 수집
                        </Button>
                        <Button onClick={handleIngestKeyword} disabled={ingestLoading || !selectedKeywordId} variant="outline">
                            {ingestLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                            키워드 단위 수집
                        </Button>
                        <Button onClick={handleExportJson} variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            JSON Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Ingest Report */}
            {ingestReport && <IngestReportPanel report={ingestReport} />}

            {/* Article Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                        <span>기사 목록</span>
                        {articleData && (
                            <span className="text-muted-foreground font-normal text-xs">
                                총 {articleData.total.toLocaleString()}건 ({articleData.totalPages}페이지)
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingArticles ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            불러오는 중...
                        </div>
                    ) : articleData && articleData.articles.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            기사가 없습니다. 수집 버튼을 눌러 기사를 가져오세요.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-xs text-muted-foreground">
                                        <th className="text-left py-2 pr-3 font-medium">제목</th>
                                        <th className="text-left py-2 pr-3 font-medium w-24">키워드</th>
                                        <th className="text-left py-2 pr-3 font-medium w-28">최초수집일</th>
                                        <th className="text-left py-2 pr-3 font-medium w-28">마지막갱신</th>
                                        <th className="text-center py-2 font-medium w-16">중복</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {articleData?.articles.map((a: ArticleItem) => (
                                        <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="py-2 pr-3">
                                                <a
                                                    href={a.canonical_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline line-clamp-2"
                                                >
                                                    {a.title}
                                                </a>
                                                {a.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>
                                                )}
                                            </td>
                                            <td className="py-2 pr-3">
                                                {a.ingestions[0]?.keyword?.keyword_text && (
                                                    <Badge variant="outline" className="text-xs truncate max-w-[100px]">
                                                        {a.ingestions[0].keyword.keyword_text}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(a.created_at).toLocaleDateString('ko-KR')}
                                            </td>
                                            <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(a.updated_at).toLocaleDateString('ko-KR')}
                                            </td>
                                            <td className="py-2 text-center">
                                                {a.ingestions[0]?.is_duplicate
                                                    ? <Badge variant="secondary" className="text-xs">중복</Badge>
                                                    : <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-100">신규</Badge>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {articleData && articleData.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => loadArticles(page - 1)}>이전</Button>
                                    <span className="text-sm text-muted-foreground">{page} / {articleData.totalPages}</span>
                                    <Button size="sm" variant="outline" disabled={page === articleData.totalPages} onClick={() => loadArticles(page + 1)}>다음</Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
