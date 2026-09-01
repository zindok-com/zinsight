'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Save,
    Loader2,
    Building2,
    ExternalLink,
    Newspaper,
    Search,
    Plus,
    Trash2,
    Globe,
    Sparkles,
    X,
    RefreshCw,
    Edit3,
    BookOpen,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    updateCompany,
    linkArticleToCompany,
    unlinkArticleFromCompany,
} from '@/actions/company-actions';
import { ingestByOrganization } from '@/actions/ingest-actions';
import { searchArticlesByTitle } from '@/actions/article-actions';

interface Region {
    id: number;
    name: string;
    slug: string;
}

interface Article {
    id: number;
    title: string;
    pub_date: Date | string | null;
    source: string | null;
    link: string | null;
    canonical_link?: string | null;
    description?: string | null;
    created_at?: Date | string;
}

interface CompanyArticle {
    id: number;
    created_at: Date | string;
    article: Article;
}

interface MagazinePostOrganization {
    magazinePostId: number;
    organizationId: number;
    magazinePost: {
        id: number;
        title: string;
        slug: string;
        status: string;
        createdAt: Date | string;
        category?: {
            id: number;
            name: string;
            slug: string;
            isLocal: boolean;
        } | null;
        region?: {
            id: number;
            name: string;
            slug: string;
        } | null;
    };
}

interface ArticleIngestion {
    id: number;
    source: string;
    fetched_at: Date | string;
    article: Article | null;
}

interface CompanyData {
    id: number;
    company_name: string;
    slug: string | null;
    entity_type: string | null;
    company_url: string | null;
    business_summary: string | null;
    core_keywords: any;
    founded_year: string | null;
    hq_location: string | null;
    ceo_name: string | null;
    key_references: any;
    aliases: any;
    backlinks: any;
    is_featured: boolean;
    region_id: number;
    region: Region | null;
    company_articles: CompanyArticle[];
    magazinePosts?: MagazinePostOrganization[];
    ingestions: ArticleIngestion[];
    _count?: {
        company_articles: number;
        magazinePosts?: number;
        ingestions: number;
    };
}

interface Props {
    company: CompanyData;
    regions: Region[];
    matchedArticles?: Article[];
}

function parseBacklinks(rawBacklinks: any, companyUrl?: string | null): Array<{ title: string; url: string }> {
    if (Array.isArray(rawBacklinks) && rawBacklinks.length > 0) {
        return rawBacklinks.slice(0, 3).map((item: any) => ({
            title: item.title || '홈페이지 바로가기',
            url: item.url || '',
        }));
    }
    if (typeof rawBacklinks === 'string') {
        try {
            const parsed = JSON.parse(rawBacklinks);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.slice(0, 3).map((item: any) => ({
                    title: item.title || '홈페이지 바로가기',
                    url: item.url || '',
                }));
            }
        } catch { }
    }
    if (companyUrl) {
        return [{ title: '홈페이지 바로가기', url: companyUrl }];
    }
    return [{ title: '홈페이지 바로가기', url: '' }];
}

function parseKeywords(keywords: any) {
    if (!keywords) return { products: '', technology: '', target_market: '' };
    try {
        const obj = typeof keywords === 'string' ? JSON.parse(keywords) : keywords;
        return {
            products: Array.isArray(obj.products) ? obj.products.join(', ') : '',
            technology: Array.isArray(obj.technology) ? obj.technology.join(', ') : '',
            target_market: Array.isArray(obj.target_market) ? obj.target_market.join(', ') : '',
        };
    } catch {
        return { products: '', technology: '', target_market: '' };
    }
}

function parseCommaArray(val: any): string {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed.join(', ');
        } catch { }
        return val;
    }
    return '';
}

export function CompanyEditClient({ company: initialCompany, regions, matchedArticles = [] }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [company, setCompany] = useState<CompanyData>(initialCompany);

    // 폼 상태
    const kw = parseKeywords(initialCompany.core_keywords);
    const [companyName, setCompanyName] = useState(initialCompany.company_name || '');
    const [slug, setSlug] = useState(initialCompany.slug || '');
    const [entityType, setEntityType] = useState(initialCompany.entity_type || '기업');
    const [regionId, setRegionId] = useState<number>(initialCompany.region_id);
    const [businessSummary, setBusinessSummary] = useState(initialCompany.business_summary || '');
    const [hqLocation, setHqLocation] = useState(initialCompany.hq_location || '');
    const [foundedYear, setFoundedYear] = useState(initialCompany.founded_year || '');
    const [ceoName, setCeoName] = useState(initialCompany.ceo_name || '');
    const [aliases, setAliases] = useState(parseCommaArray(initialCompany.aliases));
    const [keyReferences, setKeyReferences] = useState(parseCommaArray(initialCompany.key_references));
    const [kwProducts, setKwProducts] = useState(kw.products);
    const [kwTechnology, setKwTechnology] = useState(kw.technology);
    const [kwTargetMarket, setKwTargetMarket] = useState(kw.target_market);
    const [backlinks, setBacklinks] = useState<Array<{ title: string; url: string }>>(
        parseBacklinks(initialCompany.backlinks, initialCompany.company_url)
    );
    const [isFeatured, setIsFeatured] = useState(initialCompany.is_featured);

    // 탭 상태
    const [activeTab, setActiveTab] = useState<'linked' | 'ingested'>('linked');

    // 기사 검색 & 연결 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Article[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [ingesting, setIngesting] = useState(false);

    // 백링크 관리 함수
    const addBacklink = () => {
        if (backlinks.length < 3) {
            setBacklinks([...backlinks, { title: '', url: '' }]);
        }
    };

    const updateBacklink = (index: number, field: 'title' | 'url', value: string) => {
        const next = [...backlinks];
        next[index] = { ...next[index], [field]: value };
        setBacklinks(next);
    };

    const removeBacklink = (index: number) => {
        if (backlinks.length === 1) {
            setBacklinks([{ title: '홈페이지 바로가기', url: '' }]);
            return;
        }
        setBacklinks(backlinks.filter((_, i) => i !== index));
    };

    // 저장 함수
    const handleSave = () => {
        if (!companyName.trim()) {
            toast.error('조직명은 필수입니다.');
            return;
        }

        startTransition(async () => {
            const cleanBacklinks = backlinks
                .filter(b => b.url.trim() !== '')
                .map(b => ({
                    title: b.title.trim() || '홈페이지 바로가기',
                    url: b.url.trim(),
                }))
                .slice(0, 3);

            const primaryUrl = cleanBacklinks[0]?.url || undefined;

            const core_keywords = {
                products: kwProducts.split(',').map((s: string) => s.trim()).filter(Boolean),
                technology: kwTechnology.split(',').map((s: string) => s.trim()).filter(Boolean),
                target_market: kwTargetMarket.split(',').map((s: string) => s.trim()).filter(Boolean),
            };

            const parsedAliases = aliases.split(',').map((s: string) => s.trim()).filter(Boolean);
            const parsedReferences = keyReferences.split(',').map((s: string) => s.trim()).filter(Boolean);

            const res = await updateCompany(company.id, regionId, {
                company_name: companyName.trim(),
                slug: slug.trim(),
                entity_type: entityType,
                company_url: primaryUrl,
                backlinks: cleanBacklinks,
                business_summary: businessSummary.trim(),
                founded_year: foundedYear.trim(),
                hq_location: hqLocation.trim(),
                ceo_name: ceoName.trim(),
                core_keywords,
                aliases: parsedAliases,
                key_references: parsedReferences,
                is_featured: isFeatured,
            });

            if (res.success && res.company) {
                toast.success('조직 정보가 성공적으로 저장되었습니다.');
                setCompany(prev => ({
                    ...prev,
                    ...res.company,
                    region: regions.find(r => r.id === regionId) || prev.region,
                }));
                router.refresh();
            } else {
                toast.error(res.error || '저장에 실패했습니다.');
            }
        });
    };

    // 기사 검색 함수
    const handleSearchArticles = async () => {
        if (!searchQuery.trim()) {
            toast.info('검색어를 입력해주세요.');
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchArticlesByTitle(searchQuery.trim());
            setSearchResults(results);
            if (results.length === 0) {
                toast.info('검색된 기사가 없습니다.');
            }
        } catch (err) {
            toast.error('기사 검색 중 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    // 기사 수기 연결
    const handleLinkArticle = async (article: Article) => {
        startTransition(async () => {
            const res = await linkArticleToCompany(article.id, company.id);
            if (res.success) {
                toast.success(`"${article.title.slice(0, 20)}..." 기사가 연결되었습니다.`);
                setCompany(prev => {
                    const exists = prev.company_articles.some(ca => ca.article.id === article.id);
                    if (exists) return prev;
                    return {
                        ...prev,
                        company_articles: [
                            { id: Date.now(), created_at: new Date(), article },
                            ...prev.company_articles,
                        ],
                    };
                });
                router.refresh();
            } else {
                toast.error(res.error || '기사 연결에 실패했습니다.');
            }
        });
    };

    // 기사 연결 해제
    const handleUnlinkArticle = async (articleId: number, title: string) => {
        if (!confirm(`"${title.slice(0, 25)}..." 기사의 연관 연결을 해제하시겠습니까?`)) {
            return;
        }

        startTransition(async () => {
            const res = await unlinkArticleFromCompany(articleId, company.id);
            if (res.success) {
                toast.success('기사 연결이 해제되었습니다.');
                setCompany(prev => ({
                    ...prev,
                    company_articles: prev.company_articles.filter(ca => ca.article.id !== articleId),
                }));
                router.refresh();
            } else {
                toast.error(res.error || '연결 해제에 실패했습니다.');
            }
        });
    };

    // 네이버 뉴스 기사 수집 실행
    const handleIngestNews = async () => {
        setIngesting(true);
        toast.info(`"${company.company_name}" 연관 기사를 수집 중입니다...`);
        try {
            const result = await ingestByOrganization(company.id, 10, 'sim');
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            toast.error('수집 중 오류가 발생했습니다.');
        } finally {
            setIngesting(false);
        }
    };

    const isArticleLinked = (articleId: number) => {
        return company.company_articles.some(ca => ca.article.id === articleId);
    };

    // 자동 수집 기사와 조직명으로 매칭된 기사 통합 (중복 제거)
    const combinedIngestedArticles = useMemo(() => {
        const map = new Map<number, { article: Article; source: string; date: Date | string }>();

        // 1. Ingestions (조직 전용 크롤링 로그)
        company.ingestions.forEach(ing => {
            if (ing.article) {
                map.set(ing.article.id, {
                    article: ing.article,
                    source: ing.source,
                    date: ing.fetched_at,
                });
            }
        });

        // 2. Matched Articles (조직명/별칭으로 DB에서 검색된 수집 기사)
        matchedArticles.forEach(art => {
            if (!map.has(art.id)) {
                map.set(art.id, {
                    article: art,
                    source: art.source || 'DB 키워드 매칭',
                    date: art.pub_date || art.created_at || new Date(),
                });
            }
        });

        return Array.from(map.values()).sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });
    }, [company.ingestions, matchedArticles]);

    const publicUrl = `/insight-radar/${company.slug || company.id}`;
    const magazineCount = company.magazinePosts?.length || 0;
    const linkedArticleCount = company.company_articles?.length || 0;
    const totalRelatedCount = magazineCount + linkedArticleCount;

    return (
        <div className="space-y-6">
            {/* 상단 컨트롤 바 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/admin/companies">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight">{company.company_name}</h1>
                            <Badge variant="outline" className="text-xs bg-muted">
                                {company.region?.name || '지역 미지정'}
                            </Badge>
                            {isFeatured && (
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs border-0">
                                    ★ 주요 추천 조직
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            ID: {company.id} {slug ? `· Slug: /${slug}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/companies/${company.id}/analytics`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                            <BarChart3 className="h-3.5 w-3.5" />
                            프로필 애널리틱스
                        </Button>
                    </Link>

                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center"
                    >
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950">
                            <ExternalLink className="h-3.5 w-3.5" />
                            공개 프로필 보기
                        </Button>
                    </a>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleIngestNews}
                        disabled={ingesting}
                        className="gap-1.5 text-xs text-slate-700 dark:text-slate-200"
                    >
                        {ingesting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                        ) : (
                            <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                        )}
                        연관 기사 수집
                    </Button>

                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isPending}
                        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4"
                    >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        변경사항 저장
                    </Button>
                </div>
            </div>

            {/* 메인 2단 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 좌측: 조직 정보 입력 폼 (7컬럼) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* 기본 정보 카드 */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                조직 기본 정보
                            </CardTitle>
                            <CardDescription>
                                조직의 명칭, 고유 주소, 법인 분류 및 관할 지역을 설정합니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">조직(기업)명 *</Label>
                                    <Input
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        placeholder="예: 안양산업진흥원, 주식회사 엔조이"
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold">프로필 URL Slug</Label>
                                        <span className="text-[10px] text-muted-foreground">영문/숫자/하이픈</span>
                                    </div>
                                    <Input
                                        value={slug}
                                        onChange={e => setSlug(e.target.value)}
                                        placeholder="예: anyang-industry-promotion"
                                        className="h-9"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">조직 형태</Label>
                                    <select
                                        value={entityType}
                                        onChange={e => setEntityType(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="기업">기업 (일반/스타트업/중소기업)</option>
                                        <option value="공공기관">공공기관 / 지방공기업</option>
                                        <option value="대학교">대학교 / 산학협력단</option>
                                        <option value="연구소">연구소 / 연구기관</option>
                                        <option value="협회/재단">협회 / 재단 / 단체</option>
                                        <option value="병원/의료">병원 / 의료기관</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">관할 지역 *</Label>
                                    <select
                                        value={regionId}
                                        onChange={e => setRegionId(Number(e.target.value))}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {regions.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.name} ({r.slug})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">대표자 성명</Label>
                                    <Input
                                        value={ceoName}
                                        onChange={e => setCeoName(e.target.value)}
                                        placeholder="홍길동"
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">설립 연도</Label>
                                    <Input
                                        value={foundedYear}
                                        onChange={e => setFoundedYear(e.target.value)}
                                        placeholder="예: 2018"
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">본사 소재지</Label>
                                    <Input
                                        value={hqLocation}
                                        onChange={e => setHqLocation(e.target.value)}
                                        placeholder="경기도 안양시 동안구..."
                                        className="h-9"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-dashed">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        인사이트 레이더 주요 추천 조직 등록
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        활성화 시 레이더 홈 메인 스포트라이트 영역에 우선 노출됩니다.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={e => setIsFeatured(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 백링크 설정 카드 */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-emerald-600" />
                                        웹사이트 및 외부 백링크 (최대 3개)
                                    </CardTitle>
                                    <CardDescription>
                                        공개 프로필 헤더에 버튼으로 노출될 링크와 표시 텍스트를 입력합니다. (첫 번째 링크는 대표 홈페이지로 지정됨)
                                    </CardDescription>
                                </div>
                                {backlinks.length < 3 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addBacklink}
                                        className="h-8 text-xs gap-1"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> 링크 추가
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {backlinks.map((link, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
                                    <div className="w-1/3 space-y-1">
                                        <span className="text-[10px] text-muted-foreground font-semibold">버튼 문구 {idx + 1}</span>
                                        <Input
                                            value={link.title}
                                            onChange={e => updateBacklink(idx, 'title', e.target.value)}
                                            placeholder={idx === 0 ? "홈페이지 바로가기" : "블로그 / IR 자료"}
                                            className="h-8 text-xs bg-background"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[10px] text-muted-foreground font-semibold">연결 주소 (URL)</span>
                                        <Input
                                            value={link.url}
                                            onChange={e => updateBacklink(idx, 'url', e.target.value)}
                                            placeholder="https://example.com"
                                            className="h-8 text-xs bg-background font-mono"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeBacklink(idx)}
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 mt-5"
                                        title="링크 삭제"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* 사업 요약 및 키워드 카드 */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600" />
                                사업 소개 및 키워드
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">사업 요약 (Business Summary)</Label>
                                <Textarea
                                    value={businessSummary}
                                    onChange={e => setBusinessSummary(e.target.value)}
                                    placeholder="조직의 설립 목적, 주요 사업 내용, 제공 가치를 상세히 서술하세요."
                                    rows={4}
                                    className="text-sm leading-relaxed"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">핵심 제품/서비스</Label>
                                    <Input
                                        value={kwProducts}
                                        onChange={e => setKwProducts(e.target.value)}
                                        placeholder="LED, 조명 솔루션 (쉼표 구분)"
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">핵심 기술</Label>
                                    <Input
                                        value={kwTechnology}
                                        onChange={e => setKwTechnology(e.target.value)}
                                        placeholder="AI, IoT (쉼표 구분)"
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">타겟 시장</Label>
                                    <Input
                                        value={kwTargetMarket}
                                        onChange={e => setKwTargetMarket(e.target.value)}
                                        placeholder="스마트시티, B2B (쉼표 구분)"
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">검색용 별칭 (Aliases)</Label>
                                    <Input
                                        value={aliases}
                                        onChange={e => setAliases(e.target.value)}
                                        placeholder="안양진흥원, APA (쉼표 구분)"
                                        className="h-8 text-xs"
                                    />
                                    <p className="text-[10px] text-muted-foreground">뉴스 크롤링 시 일치 검사에 활용됩니다.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">주요 실적 / 레퍼런스</Label>
                                    <Input
                                        value={keyReferences}
                                        onChange={e => setKeyReferences(e.target.value)}
                                        placeholder="2024 유망중소기업 선정 (쉼표 구분)"
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 우측: 기사 연결 및 수집 관리 (5컬럼) */}
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
                                            {company.magazinePosts.map(mpo => {
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
                                                {company.company_articles.map(ca => {
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
                                                수집된 기사가 없습니다.<br />상단의 "기사 수집" 버튼을 눌러보세요.
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
            </div>
        </div>
    );
}
