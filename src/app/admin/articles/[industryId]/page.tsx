'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getIndustryById } from '@/actions/industry-actions';
import { getKeywords } from '@/actions/keyword-actions';
import { getArticles } from '@/actions/article-actions';
import { ingestByIndustry, ingestByKeyword, type IngestReport } from '@/actions/ingest-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
    RefreshCw, Download, ArrowLeft, Loader2,
    CheckCircle, AlertTriangle, ExternalLink, X, FileJson
} from 'lucide-react';

type Industry = NonNullable<Awaited<ReturnType<typeof getIndustryById>>>;
type Keyword = Awaited<ReturnType<typeof getKeywords>>[number];
type ArticlePage = Awaited<ReturnType<typeof getArticles>>;
type ArticleItem = ArticlePage['articles'][number];

// ─── 수집 결과 패널 ───────────────────────────────────────────────────────────
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
                        <div className="flex gap-4">
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

// ─── 기사 상세 Drawer ─────────────────────────────────────────────────────────
function ArticleDrawer({ article, onClose }: { article: ArticleItem; onClose: () => void }) {
    const [showRaw, setShowRaw] = useState(false);

    // ESC 키로 닫기
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const ingestion = article.ingestions[0];

    return (
        <>
            {/* 오버레이 */}
            <div
                className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                onClick={onClose}
            />
            {/* Drawer 패널 */}
            <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col drawer-slide-in">
                {/* Drawer 헤더 */}
                <div className="flex items-start justify-between gap-3 px-6 py-4 border-b bg-slate-50">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-mono">Article #{article.id}</p>
                        <h2 className="text-base font-semibold leading-snug break-words">{article.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors mt-0.5"
                        aria-label="닫기"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Drawer 본문 */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* 메타 정보 */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">키워드</p>
                            <p className="font-medium">{ingestion?.keyword?.keyword_text ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">중복 여부</p>
                            {ingestion?.is_duplicate
                                ? <Badge variant="secondary">중복</Badge>
                                : <Badge className="bg-green-100 text-green-800 hover:bg-green-100">신규</Badge>}
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">최초 수집일</p>
                            <p>{new Date(article.created_at).toLocaleString('ko-KR')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">마지막 갱신</p>
                            <p>{new Date(article.updated_at).toLocaleString('ko-KR')}</p>
                        </div>
                        {article.pub_date && (
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground mb-0.5">발행일 (pub_date)</p>
                                <p>{new Date(article.pub_date).toLocaleString('ko-KR')}</p>
                            </div>
                        )}
                    </div>

                    {/* 본문 요약 */}
                    {article.description && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">요약 (Description)</p>
                            <p className="text-sm leading-relaxed text-slate-700 bg-slate-50 rounded-md p-3 border">
                                {article.description}
                            </p>
                        </div>
                    )}

                    {/* 링크 */}
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">링크</p>
                        <div className="space-y-1.5">
                            <a
                                href={article.canonical_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline break-all"
                            >
                                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{article.canonical_link}</span>
                            </a>
                            {article.link && article.link !== article.canonical_link && (
                                <a
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:underline break-all"
                                >
                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">Naver 링크: {article.link}</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* raw_json 토글 */}
                    <div>
                        <button
                            onClick={() => setShowRaw(v => !v)}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-slate-700 transition-colors"
                        >
                            <FileJson className="h-4 w-4" />
                            {showRaw ? 'raw_json 숨기기' : 'raw_json 원문 보기'}
                        </button>
                        {showRaw && (
                            <pre className="mt-2 text-xs bg-slate-900 text-slate-100 p-4 rounded-md overflow-auto max-h-72 leading-relaxed">
                                {JSON.stringify(article.raw_json, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>

                {/* Drawer 푸터 */}
                <div className="px-6 py-4 border-t bg-slate-50 flex justify-between items-center">
                    <a
                        href={article.canonical_link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button size="sm" className="gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" /> 원문 보기
                        </Button>
                    </a>
                    <Button size="sm" variant="outline" onClick={onClose}>닫기</Button>
                </div>
            </div>
        </>
    );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function ArticlesByIndustryPage() {
    const params = useParams();
    const router = useRouter();
    const industryId = Number(params.industryId);

    const [industry, setIndustry] = useState<Industry | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [selectedKeywordId, setSelectedKeywordId] = useState<number | ''>('');
    const [createdMonth, setCreatedMonth] = useState('');
    const [pubMonth, setPubMonth] = useState('');
    const [articleData, setArticleData] = useState<ArticlePage | null>(null);
    const [page, setPage] = useState(1);
    const [ingestLoading, setIngestLoading] = useState(false);
    const [ingestReport, setIngestReport] = useState<IngestReport | null>(null);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [drawerArticle, setDrawerArticle] = useState<ArticleItem | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState<'industry' | 'keyword'>('industry');

    useEffect(() => {
        if (!industryId || isNaN(industryId)) {
            setLoadError('잘못된 산업 ID입니다.');
            setInitialLoading(false);
            return;
        }
        getIndustryById(industryId)
            .then(ex => {
                if (!ex) {
                    setLoadError(`산업(ID: ${industryId})를 찾을 수 없습니다.`);
                } else {
                    setIndustry(ex);
                    return getKeywords(ex.id, false).then(setKeywords);
                }
            })
            .catch(err => {
                console.error(err);
                setLoadError('산업 정보를 불러오는 중 오류가 발생했습니다.');
            })
            .finally(() => setInitialLoading(false));
    }, [industryId]);

    const loadArticles = useCallback(async (p = 1) => {
        if (!industry) return;
        setLoadingArticles(true);
        try {
            const data = await getArticles({
                industryId: industry.id,
                keywordId: selectedKeywordId ? Number(selectedKeywordId) : undefined,
                createdMonth: createdMonth || undefined,
                pubMonth: pubMonth || undefined,
                page: p,
                pageSize: 50,
            });
            setArticleData(data);
            setPage(p);
        } catch (err) {
            console.error(err);
            toast.error('기사 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoadingArticles(false);
        }
    }, [industry, selectedKeywordId, createdMonth, pubMonth]);

    useEffect(() => {
        if (industry) loadArticles(1);
    }, [industry, loadArticles]);

    function openConfirmModal(type: 'industry' | 'keyword') {
        if (type === 'keyword' && !selectedKeywordId) {
            toast.error('키워드를 선택하세요.');
            return;
        }
        setConfirmType(type);
        setIsConfirmOpen(true);
    }

    async function executeIngest() {
        setIsConfirmOpen(false);
        if (confirmType === 'industry') {
            await handleIngestIndustry();
        } else {
            await handleIngestKeyword();
        }
    }

    async function handleIngestIndustry() {
        if (!industry) return;
        setIngestLoading(true);
        setIngestReport(null);
        toast.info('산업 단위 수집 중...');
        const report = await ingestByIndustry(industry.id);
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
            industry: industry?.name,
            filters: { keyword_id: selectedKeywordId, createdMonth, pubMonth },
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
                keyword_id: a.ingestions[0]?.keyword_id,
            })),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `articles_ex${industryId}_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('JSON 내보내기 완료');
    }

    // ─── 렌더 분기 ───
    if (initialLoading) {
        return (
            <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>산업 정보 불러오는 중...</span>
            </div>
        );
    }

    if (loadError || !industry) {
        return (
            <div className="py-20 flex flex-col items-center gap-4">
                <AlertTriangle className="h-10 w-10 text-red-400" />
                <p className="text-muted-foreground">{loadError ?? '산업를 찾을 수 없습니다.'}</p>
                <Button variant="outline" onClick={() => router.push('/admin/articles')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> 목록으로
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* 헤더 */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin/articles')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{industry.name}</h1>
                        <p className="text-xs text-muted-foreground">ID: {industry.id} · slug: {industry.slug}</p>
                    </div>
                </div>

                {/* 필터 + 수집 패널 */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">필터 및 수집</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">키워드</label>
                                <select
                                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-slate-400"
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
                                <label className="text-xs font-medium text-muted-foreground">수집일</label>
                                <input
                                    type="month"
                                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    value={createdMonth}
                                    onChange={e => setCreatedMonth(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">발행일</label>
                                <input
                                    type="month"
                                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    value={pubMonth}
                                    onChange={e => setPubMonth(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={() => loadArticles(1)} variant="outline" disabled={loadingArticles}>
                                <RefreshCw className={`h-4 w-4 mr-1 ${loadingArticles ? 'animate-spin' : ''}`} />
                                조회
                            </Button>
                            <Button onClick={() => openConfirmModal('industry')} disabled={ingestLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {ingestLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                                산업 단위 수집
                            </Button>
                            <Button onClick={() => openConfirmModal('keyword')} disabled={ingestLoading || !selectedKeywordId} variant="outline">
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

                {/* 수집 결과 */}
                {ingestReport && <IngestReportPanel report={ingestReport} />}

                {/* ─── 기사 테이블 ─── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                            <span>기사 목록</span>
                            {articleData && (
                                <span className="text-muted-foreground font-normal text-xs">
                                    총 {articleData.total.toLocaleString()}건 ({articleData.totalPages}페이지)
                                    <span className="ml-2 text-slate-400">· 행 클릭 시 상세 보기</span>
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingArticles ? (
                            <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                불러오는 중...
                            </div>
                        ) : articleData && articleData.articles.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                기사가 없습니다. 수집 버튼을 눌러 기사를 가져오세요.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                {/* table-fixed + 명시적 컬럼 비율 */}
                                <table className="w-full text-sm table-fixed">
                                    <colgroup>
                                        <col style={{ width: '60%' }} />
                                        <col style={{ width: '13%' }} />
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '7%' }} />
                                    </colgroup>
                                    <thead>
                                        <tr className="border-b text-xs text-muted-foreground">
                                            <th className="text-left py-2 pr-3 font-medium">제목</th>
                                            <th className="text-left py-2 pr-3 font-medium">키워드</th>
                                            <th className="text-left py-2 pr-3 font-medium">수집일</th>
                                            <th className="text-left py-2 pr-3 font-medium">발행일</th>
                                            <th className="text-center py-2 font-medium">중복</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {articleData?.articles.map((a: ArticleItem) => (
                                            <tr
                                                key={a.id}
                                                className="border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                                                onClick={() => setDrawerArticle(a)}
                                            >
                                                {/* 제목 컬럼 — 60% */}
                                                <td className="py-2 pr-3">
                                                    <p className="font-medium line-clamp-1 text-slate-800">{a.title}</p>
                                                    {a.description && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>
                                                    )}
                                                </td>
                                                {/* 키워드 */}
                                                <td className="py-2 pr-3">
                                                    {a.ingestions[0]?.keyword?.keyword_text && (
                                                        <Badge variant="outline" className="text-xs max-w-full truncate block w-fit">
                                                            {a.ingestions[0].keyword.keyword_text}
                                                        </Badge>
                                                    )}
                                                </td>
                                                {/* 수집일 */}
                                                <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(a.created_at).toLocaleDateString('ko-KR')}
                                                </td>
                                                {/* 발행일 */}
                                                <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {a.pub_date ? new Date(a.pub_date).toLocaleDateString('ko-KR') : '-'}
                                                </td>
                                                {/* 중복 */}
                                                <td className="py-2 text-center">
                                                    {a.ingestions[0]?.is_duplicate
                                                        ? <Badge variant="secondary" className="text-xs">중복</Badge>
                                                        : <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">신규</Badge>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* 페이지네이션 */}
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

            {/* 기사 상세 Drawer */}
            {drawerArticle && (
                <ArticleDrawer
                    article={drawerArticle}
                    onClose={() => setDrawerArticle(null)}
                />
            )}

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>새 기사 수집</DialogTitle>
                        <DialogDescription>
                            {confirmType === 'industry'
                                ? '모든 활성 키워드를 대상으로 네이버 뉴스 API를 호출하여 기사를 수집하시겠습니까? (API 호출량이 많을 수 있습니다)'
                                : '선택한 키워드에 대해 네이버 뉴스 API를 호출하여 기사를 수집하시겠습니까?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>취소</Button>
                        <Button onClick={executeIngest} className="bg-blue-600 hover:bg-blue-700 text-white">
                            수집 실행
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
