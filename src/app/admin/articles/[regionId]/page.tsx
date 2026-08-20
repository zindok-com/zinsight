'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getRegionById } from '@/actions/admin/region-actions';
import { getKeywords } from '@/actions/keyword-actions';
import { getArticles, deleteArticlesByDate } from '@/actions/article-actions';
import { ingestByRegion, ingestByKeyword, type IngestReport } from '@/actions/ingest-actions';
import { searchOrganizations, linkArticleToCompany, unlinkArticleFromCompany } from '@/actions/company-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
    RefreshCw, Download, ArrowLeft, Loader2,
    CheckCircle, AlertTriangle, ExternalLink, X, FileJson, Trash2
} from 'lucide-react';

// Awaited type for Region is needed, we can define it directly
type Region = { id: number; name: string; slug: string; isActive: boolean; createdAt: Date; updatedAt: Date };
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
function ArticleDrawer({ article, onClose, onRefresh }: { article: ArticleItem; onClose: () => void; onRefresh: () => void }) {
    const [showRaw, setShowRaw] = useState(false);
    const [orgSearch, setOrgSearch] = useState('');
    const [orgResults, setOrgResults] = useState<Array<{ id: number; company_name: string }>>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [linkedOrgs, setLinkedOrgs] = useState<Array<{ id: number; company_name: string }>>(() => {
        return article.company_articles?.map((ca: any) => ca.company).filter(Boolean) || [];
    });

    // ESC 키로 닫기
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSearchOrg = async (query: string) => {
        setOrgSearch(query);
        if (!query.trim()) {
            setOrgResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const results = await searchOrganizations(query);
            setOrgResults(results);
        } catch {
            setOrgResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLinkOrg = async (orgId: number, orgName: string) => {
        const res = await linkArticleToCompany(article.id, orgId);
        if (res.success) {
            toast.success(`"${orgName}" 조직 연관 기사로 연결되었습니다.`);
            setLinkedOrgs(prev => [...prev.filter(o => o.id !== orgId), { id: orgId, company_name: orgName }]);
            setOrgSearch('');
            setOrgResults([]);
            onRefresh();
        } else {
            toast.error('연결 실패: ' + res.error);
        }
    };

    const handleUnlinkOrg = async (orgId: number, orgName: string) => {
        const res = await unlinkArticleFromCompany(article.id, orgId);
        if (res.success) {
            toast.success(`"${orgName}" 연결이 해제되었습니다.`);
            setLinkedOrgs(prev => prev.filter(o => o.id !== orgId));
            onRefresh();
        } else {
            toast.error('해제 실패: ' + res.error);
        }
    };

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
                            <p className="text-xs text-muted-foreground mb-0.5">수집 출처 / 방식</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {ingestion?.source === 'MANUAL_ORG' ? (
                                    <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 font-bold">조직 기반 수집</Badge>
                                ) : (
                                    <Badge variant="outline">키워드 크롤링</Badge>
                                )}
                                {ingestion?.keyword?.keyword_text && (
                                    <span className="text-xs font-semibold text-blue-600">#{ingestion.keyword.keyword_text}</span>
                                )}
                                {(ingestion?.organization?.company_name || linkedOrgs[0]?.company_name) && (
                                    <span className="text-xs font-bold text-indigo-600">
                                        🏢 {ingestion?.organization?.company_name || linkedOrgs[0]?.company_name}
                                    </span>
                                )}
                            </div>
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

                    {/* ─── 조직 연관 기사 연결 섹션 ─── */}
                    <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">조직 연관 기사 연결</p>
                            <span className="text-[11px] text-muted-foreground">프로필에 연관기사로 노출될 조직 선택</span>
                        </div>

                        {/* 연결된 조직 목록 */}
                        <div className="flex flex-wrap gap-2">
                            {linkedOrgs.length > 0 ? (
                                linkedOrgs.map(org => (
                                    <span key={org.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                                        🏢 {org.company_name}
                                        <button
                                            type="button"
                                            onClick={() => handleUnlinkOrg(org.id, org.company_name)}
                                            className="text-indigo-400 hover:text-red-500 font-bold ml-0.5 transition-colors"
                                            title="연결 해제"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic">연결된 수기 조직이 없습니다.</p>
                            )}
                        </div>

                        {/* 조직 검색 입력 */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="조직(회사) 이름으로 검색하여 연관 기사에 연결..."
                                value={orgSearch}
                                onChange={e => handleSearchOrg(e.target.value)}
                                className="w-full text-xs border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-2.5 text-slate-400" />}
                            {orgResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto z-20 divide-y">
                                    {orgResults.map(org => (
                                        <button
                                            key={org.id}
                                            type="button"
                                            onClick={() => handleLinkOrg(org.id, org.company_name)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between text-slate-700 font-medium"
                                        >
                                            <span>🏢 {org.company_name}</span>
                                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100 px-1.5 py-0.5 rounded">+ 연결</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
export default function ArticlesByRegionPage() {
    const params = useParams();
    const router = useRouter();
    const regionId = Number(params.regionId);

    const [region, setRegion] = useState<Region | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [selectedKeywordId, setSelectedKeywordId] = useState<number | ''>('');
    const [selectedSource, setSelectedSource] = useState<string>('');
    const [createdMonth, setCreatedMonth] = useState('');
    const [pubMonth, setPubMonth] = useState('');
    const [articleData, setArticleData] = useState<ArticlePage | null>(null);
    const [page, setPage] = useState(1);
    const [ingestLoading, setIngestLoading] = useState(false);
    const [ingestReport, setIngestReport] = useState<IngestReport | null>(null);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [drawerArticle, setDrawerArticle] = useState<ArticleItem | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState<'region' | 'keyword'>('region');
    const [ingestDisplay, setIngestDisplay] = useState<number>(10);
    const [ingestSort, setIngestSort] = useState<'sim' | 'date'>('date');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteDate, setDeleteDate] = useState(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (!regionId || isNaN(regionId)) {
            setLoadError('잘못된 지역 ID입니다.');
            setInitialLoading(false);
            return;
        }
        getRegionById(regionId)
            .then((ex: any) => {
                if (!ex) {
                    setLoadError(`지역(ID: ${regionId})을 찾을 수 없습니다.`);
                } else {
                    setRegion(ex);
                    return getKeywords(ex.id, false).then(setKeywords);
                }
            })
            .catch(err => {
                console.error(err);
                setLoadError('지역 정보를 불러오는 중 오류가 발생했습니다.');
            })
            .finally(() => setInitialLoading(false));
    }, [regionId]);

    const loadArticles = useCallback(async (p = 1) => {
        if (!region) return;
        setLoadingArticles(true);
        try {
            const data = await getArticles({
                regionId: region.id,
                keywordId: selectedKeywordId ? Number(selectedKeywordId) : undefined,
                source: selectedSource || undefined,
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
    }, [region, selectedKeywordId, selectedSource, createdMonth, pubMonth]);

    useEffect(() => {
        if (region) loadArticles(1);
    }, [region, loadArticles]);

    function openConfirmModal(type: 'region' | 'keyword') {
        if (type === 'keyword' && !selectedKeywordId) {
            toast.error('키워드를 선택하세요.');
            return;
        }
        setConfirmType(type);
        setIsConfirmOpen(true);
    }

    async function executeIngest() {
        setIsConfirmOpen(false);
        if (confirmType === 'region') {
            await handleIngestRegion();
        } else {
            await handleIngestKeyword();
        }
    }

    async function handleIngestRegion() {
        if (!region) return;
        setIngestLoading(true);
        setIngestReport(null);
        toast.info('지역 단위 수집 중...');
        const report = await ingestByRegion(region.id, ingestDisplay, ingestSort);
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
        const report = await ingestByKeyword(Number(selectedKeywordId), ingestDisplay, ingestSort);
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
            region: region?.name,
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
        a.download = `articles_region${regionId}_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('JSON 내보내기 완료');
    }

    async function handleDeleteArticles() {
        if (!deleteDate) {
            toast.error('삭제할 날짜를 선택하세요.');
            return;
        }

        const confirmFirst = window.confirm(
            `정말로 ${deleteDate}에 수집된 이 지역의 모든 기사를 데이터베이스에서 영구 삭제하시겠습니까?\n이 작업은 즉시 실행되며 복구할 수 없습니다.`
        );
        if (!confirmFirst) return;

        setDeleteLoading(true);
        try {
            const res = await deleteArticlesByDate(deleteDate, region?.id);
            if (res.success) {
                toast.success(res.message);
                setIsDeleteModalOpen(false);
                loadArticles(1);
            } else {
                toast.error('기사 삭제 실패');
            }
        } catch (err: unknown) {
            console.error(err);
            toast.error('기사 삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleteLoading(false);
        }
    }

    // ─── 렌더 분기 ───
    if (initialLoading) {
        return (
            <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>지역 정보 불러오는 중...</span>
            </div>
        );
    }

    if (loadError || !region) {
        return (
            <div className="py-20 flex flex-col items-center gap-4">
                <AlertTriangle className="h-10 w-10 text-red-400" />
                <p className="text-muted-foreground">{loadError ?? '지역을 찾을 수 없습니다.'}</p>
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
                        <h1 className="text-2xl font-bold tracking-tight">{region.name}</h1>
                        <p className="text-xs text-muted-foreground">ID: {region.id} · slug: {region.slug}</p>
                    </div>
                </div>

                {/* 필터 + 수집 패널 */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">필터 및 수집</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">수집 방식</label>
                                <select
                                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    value={selectedSource}
                                    onChange={e => setSelectedSource(e.target.value)}
                                >
                                    <option value="">전체 수집 방식</option>
                                    <option value="REGION_CRAWL">키워드 크롤링 (REGION_CRAWL)</option>
                                    <option value="MANUAL_ORG">조직 기반 수집 (MANUAL_ORG)</option>
                                </select>
                            </div>
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
                            <Button onClick={() => openConfirmModal('region')} disabled={ingestLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {ingestLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                                지역 단위 수집
                            </Button>
                            <Button onClick={() => openConfirmModal('keyword')} disabled={ingestLoading || !selectedKeywordId} variant="outline">
                                {ingestLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                                키워드 단위 수집
                            </Button>
                            <Button onClick={() => setIsDeleteModalOpen(true)} variant="destructive">
                                <Trash2 className="h-4 w-4 mr-1" />
                                수집일 기준 삭제
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
                                        <col style={{ width: '55%' }} />
                                        <col style={{ width: '18%' }} />
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '7%' }} />
                                    </colgroup>
                                    <thead>
                                        <tr className="border-b text-xs text-muted-foreground">
                                            <th className="text-left py-2 pr-3 font-medium">제목</th>
                                            <th className="text-left py-2 pr-3 font-medium">키워드 / 수집 출처</th>
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
                                                {/* 제목 컬럼 — 55% */}
                                                <td className="py-2 pr-3">
                                                    <p className="font-medium line-clamp-1 text-slate-800">{a.title}</p>
                                                    {a.description && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>
                                                    )}
                                                </td>
                                                {/* 키워드 / 수집 출처 */}
                                                <td className="py-2 pr-3">
                                                    {(() => {
                                                        const ing = a.ingestions[0];
                                                        const orgName = ing?.organization?.company_name || a.company_articles?.[0]?.company?.company_name;

                                                        if (ing?.source === 'MANUAL_ORG' || orgName) {
                                                            return (
                                                                <Badge className="text-xs max-w-full truncate block w-fit bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                                                                    🏢 {orgName || '조직 수집'}
                                                                </Badge>
                                                            );
                                                        }

                                                        if (ing?.keyword?.keyword_text) {
                                                            return (
                                                                <Badge variant="outline" className="text-xs max-w-full truncate block w-fit border-blue-200 bg-blue-50 text-blue-700">
                                                                    #{ing.keyword.keyword_text}
                                                                </Badge>
                                                            );
                                                        }

                                                        return <span className="text-xs text-slate-400">—</span>;
                                                    })()}
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
                    onRefresh={() => loadArticles(page)}
                />
            )}

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>새 기사 수집</DialogTitle>
                        <DialogDescription>
                            {confirmType === 'region'
                                ? '모든 활성 키워드를 대상으로 네이버 뉴스 API를 호출하여 기사를 수집하시겠습니까? (API 호출량이 많을 수 있습니다)'
                                : '선택한 키워드에 대해 네이버 뉴스 API를 호출하여 기사를 수집하시겠습니까?'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm">수집 기사 수</label>
                            <select 
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={ingestDisplay} 
                                onChange={e => setIngestDisplay(Number(e.target.value))}
                            >
                                <option value={10}>10개</option>
                                <option value={20}>20개</option>
                                <option value={30}>30개</option>
                                <option value={40}>40개</option>
                                <option value={50}>50개</option>
                                <option value={100}>100개</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm">정렬 기준</label>
                            <select 
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={ingestSort} 
                                onChange={e => setIngestSort(e.target.value as 'sim' | 'date')}
                            >
                                <option value="sim">관련도순 (sim)</option>
                                <option value="date">최신순 (date)</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>취소</Button>
                        <Button onClick={executeIngest} className="bg-blue-600 hover:bg-blue-700 text-white">
                            수집 실행
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            수집일 기준 기사 삭제
                        </DialogTitle>
                        <DialogDescription>
                            선택한 수집일(created_at)에 수집된 이 지역의 기사들을 데이터베이스에서 영구 삭제합니다. (소프트 삭제 미적용)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">수집일 선택</label>
                            <input 
                                type="date"
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={deleteDate} 
                                onChange={e => setDeleteDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleteLoading}>취소</Button>
                        <Button onClick={handleDeleteArticles} disabled={deleteLoading || !deleteDate} className="bg-red-600 hover:bg-red-700 text-white font-medium">
                            {deleteLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                            삭제 실행
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
