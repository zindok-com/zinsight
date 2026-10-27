'use client';

import Link from 'next/link';
import {
    ExternalLink,
    Newspaper,
    Search,
    Plus,
    Loader2,
    X,
    RefreshCw,
    Edit3,
    BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CompanyArticlesPanelProps {
    company: any;
    activeTab: 'linked' | 'ingested';
    setActiveTab: (tab: 'linked' | 'ingested') => void;
    totalRelatedCount: number;
    combinedIngestedArticles: any[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    handleSearchArticles: () => void;
    isSearching: boolean;
    searchResults: any[];
    isArticleLinked: (articleId: number) => boolean;
    isPending: boolean;
    handleLinkArticle: (article: any) => void;
    handleUnlinkArticle: (articleId: number, title: string) => void;
    handleIngestNews: () => void;
    ingesting: boolean;
}

export function CompanyArticlesPanel({
    company,
    activeTab,
    setActiveTab,
    totalRelatedCount,
    combinedIngestedArticles,
    searchQuery,
    setSearchQuery,
    handleSearchArticles,
    isSearching,
    searchResults,
    isArticleLinked,
    isPending,
    handleLinkArticle,
    handleUnlinkArticle,
    handleIngestNews,
    ingesting,
}: CompanyArticlesPanelProps) {
    return (
        <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
                {/* 커스텀 탭 헤더 */}
                <div className="flex border-b border-border">
                    <button
                        type="button"
                        onClick={() => setActiveTab('linked')}
                        className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 ${
                            activeTab === 'linked'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        연관 기사 관리 ({totalRelatedCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('ingested')}
                        className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 ${
                            activeTab === 'ingested'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        수집 기사 내역 ({combinedIngestedArticles.length})
                    </button>
                </div>

                {/* 탭 1: 수기 연관 기사 관리 및 매거진 포스트 & 검색 추가 */}
                {activeTab === 'linked' && (
                    <div className="space-y-4">
                        {/* 1. 자체 매거진 포스트 목록 (자동 연동) */}
                        {company.magazinePosts && company.magazinePosts.length > 0 && (
                            <Card className="border-amber-200/80 bg-amber-50/20 dark:bg-amber-950/20">
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                                            <BookOpen className="h-4 w-4" />
                                            ✦ ZINSIGHT 매거진 기사 (자동 연동)
                                        </CardTitle>
                                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px]">
                                            {company.magazinePosts.length}건
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        매거진 포스트 작성 시 이 조직을 연결한 기사입니다.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-2">
                                    {company.magazinePosts.map((mpo: any) => {
                                        const post = mpo.magazinePost;
                                        const postPublicHref = post.category?.isLocal
                                            ? `/magazine/local/${post.region?.slug || 'anyang'}/${post.slug}`
                                            : `/magazine/tech-marketing/${post.slug}`;

                                        return (
                                            <div
                                                key={post.id}
                                                className="group p-2.5 border border-amber-200/70 dark:border-amber-900/50 rounded-lg bg-card text-xs flex items-start justify-between gap-2"
                                            >
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge variant="outline" className="text-[10px] bg-amber-100/60 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300">
                                                            {post.category?.name || '매거진'}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                                                        </span>
                                                    </div>
                                                    <a
                                                        href={postPublicHref}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-medium text-slate-900 dark:text-slate-100 hover:text-amber-600 line-clamp-2 leading-snug flex items-center gap-1"
                                                    >
                                                        {post.title}
                                                        <ExternalLink className="h-3 w-3 inline opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                    </a>
                                                </div>

                                                <Link href={`/admin/magazine/edit/${post.id}`}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-[11px] gap-1 text-slate-700 shrink-0"
                                                        title="매거진 에디터에서 편집"
                                                    >
                                                        <Edit3 className="h-3 w-3" />
                                                        편집
                                                    </Button>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {/* 2. 기사 검색 & 수기 연결 박스 */}
                        <Card className="border-blue-200/80 bg-blue-50/20 dark:bg-blue-950/20">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                                    <Plus className="h-4 w-4" /> 기사 검색 및 수기 연결
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    데이터베이스에 수집된 기사를 제목으로 찾아 조직의 연관 기사로 연결합니다.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSearchArticles();
                                            }
                                        }}
                                        placeholder="기사 제목 검색..."
                                        className="h-8 text-xs bg-background"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handleSearchArticles}
                                        disabled={isSearching}
                                        className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                    >
                                        {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                    </Button>
                                </div>

                                {/* 검색 결과 목록 */}
                                {searchResults.length > 0 && (
                                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-background/80">
                                        <p className="text-[11px] font-semibold text-muted-foreground px-1">
                                            검색 결과 ({searchResults.length}건)
                                        </p>
                                        {searchResults.map(art => {
                                            const alreadyLinked = isArticleLinked(art.id);
                                            return (
                                                <div
                                                    key={art.id}
                                                    className="flex items-start justify-between gap-2 p-2 rounded border bg-card text-xs hover:border-blue-300 transition-colors"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium line-clamp-1 text-slate-800 dark:text-slate-200">
                                                            {art.title.replace(/<[^>]*>?/gm, '')}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                                            <span>{art.source || '언론사'}</span>
                                                            {art.pub_date && (
                                                                <span>{new Date(art.pub_date).toLocaleDateString('ko-KR')}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant={alreadyLinked ? "secondary" : "default"}
                                                        disabled={alreadyLinked || isPending}
                                                        onClick={() => handleLinkArticle(art)}
                                                        className={`h-7 px-2 text-[11px] shrink-0 ${alreadyLinked ? 'bg-muted text-muted-foreground' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                                    >
                                                        {alreadyLinked ? '연결됨' : '+ 연결'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 3. 현재 수기 연결된 기사 목록 */}
                        <Card>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                                        <Newspaper className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                                        수기 연결된 외부 기사 목록
                                    </CardTitle>
                                    <Badge variant="secondary" className="text-xs">
                                        {company.company_articles.length}건
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    수기 또는 기사관리에서 연결되어 프로필 타임라인에 노출되는 기사입니다.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                {company.company_articles.length === 0 ? (
                                    <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground text-xs">
                                        수기 연결된 외부 기사가 없습니다.<br />위의 검색창이나 수집 기사 탭에서 연결해보세요.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                                        {company.company_articles.map((ca: any) => {
                                            const art = ca.article;
                                            if (!art) return null;
                                            return (
                                                <div
                                                    key={ca.id}
                                                    className="group p-3 border rounded-lg bg-card hover:border-slate-400 transition-all flex items-start justify-between gap-3 text-xs"
                                                >
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <a
                                                            href={art.link || art.canonical_link || '#'}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 line-clamp-2 leading-snug flex items-center gap-1"
                                                        >
                                                            {art.title.replace(/<[^>]*>?/gm, '')}
                                                            <ExternalLink className="h-3 w-3 inline opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                        </a>
                                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                            <span>{art.source || '수집 기사'}</span>
                                                            <span>·</span>
                                                            <span>
                                                                {art.pub_date
                                                                    ? new Date(art.pub_date).toLocaleDateString('ko-KR')
                                                                    : '날짜 미상'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleUnlinkArticle(art.id, art.title)}
                                                        disabled={isPending}
                                                        className="h-7 w-7 text-muted-foreground hover:text-red-600 shrink-0"
                                                        title="연결 해제"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 탭 2: 조직 기반 자동 수집 및 DB 키워드 매칭 기사 내역 */}
                {activeTab === 'ingested' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                                            <RefreshCw className="h-4 w-4 text-blue-600" />
                                            수집 및 키워드 매칭 기사 내역
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            네이버 뉴스 수집 및 DB 내 조직명/별칭과 일치하는 기사 목록입니다.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleIngestNews}
                                        disabled={ingesting}
                                        className="h-8 text-xs gap-1 shrink-0"
                                    >
                                        {ingesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                        기사 수집
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                {combinedIngestedArticles.length === 0 ? (
                                    <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground text-xs">
                                        수집된 기사가 없습니다.<br />상단의 &quot;기사 수집&quot; 버튼을 눌러보세요.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                                        {combinedIngestedArticles.map(item => {
                                            const art = item.article;
                                            if (!art) return null;
                                            const alreadyLinked = isArticleLinked(art.id);
                                            return (
                                                <div
                                                    key={art.id}
                                                    className="p-3 border rounded-lg bg-card text-xs flex items-start justify-between gap-3"
                                                >
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-muted">
                                                                {item.source}
                                                            </Badge>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {new Date(item.date).toLocaleDateString('ko-KR')}
                                                            </span>
                                                        </div>
                                                        <a
                                                            href={art.link || art.canonical_link || '#'}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 line-clamp-2 leading-snug flex items-center gap-1"
                                                        >
                                                            {art.title.replace(/<[^>]*>?/gm, '')}
                                                            <ExternalLink className="h-3 w-3 inline opacity-70 shrink-0" />
                                                        </a>
                                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                            <span>{art.source || '언론사'}</span>
                                                            <span>·</span>
                                                            <span>
                                                                {art.pub_date
                                                                    ? new Date(art.pub_date).toLocaleDateString('ko-KR')
                                                                    : '날짜 미상'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant={alreadyLinked ? "secondary" : "outline"}
                                                        disabled={alreadyLinked || isPending}
                                                        onClick={() => handleLinkArticle(art)}
                                                        className={`h-7 px-2 text-[11px] shrink-0 ${alreadyLinked ? 'bg-muted text-muted-foreground' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                                                    >
                                                        {alreadyLinked ? '연결됨' : '+ 연관기사 연결'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
