'use client';

import { useState, useTransition, useMemo, useRef } from 'react';
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
    Edit,
    List,
    MoveVertical,
    ChevronDown,
    FolderOpen,
} from 'lucide-react';
import { StorageImageSelectorModal, type SelectableMedia } from '@/components/admin/storage/StorageImageSelectorModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    updateCompany,
    linkArticleToCompany,
    unlinkArticleFromCompany,
} from '@/actions/company-actions';
import { ingestByOrganization } from '@/actions/ingest-actions';
import { searchArticlesByTitle } from '@/actions/article-actions';
import { CompanyLogoUpload } from '@/components/admin/companies/CompanyLogoUpload';
import { CompanyArticlesPanel } from './CompanyArticlesPanel';
import { useConfirm } from '@/components/ui/confirm-dialog';

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
    logo_url?: string | null;
    logo_source_url?: string | null;
    video_url?: string | null;
    video_poster_url?: string | null;
    brochure_url?: string | null;
    inquiry_url?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    tagline?: string | null;
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
        return val.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean).join(', ');
    }
    return '';
}

function parseLinesArray(val: any): string {
    if (!val) return '';
    if (Array.isArray(val)) return val.join('\n');
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed.join('\n');
        } catch { }
        return val;
    }
    return '';
}

export function CompanyEditClient({ company: initialCompany, regions, matchedArticles = [] }: Props) {
    const router = useRouter();
    const confirm = useConfirm();
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
    const [keyReferences, setKeyReferences] = useState(parseLinesArray(initialCompany.key_references));
    const [kwProducts, setKwProducts] = useState(kw.products);
    const [kwTechnology, setKwTechnology] = useState(kw.technology);
    const [kwTargetMarket, setKwTargetMarket] = useState(kw.target_market);
    const [backlinks, setBacklinks] = useState<Array<{ title: string; url: string }>>(
        parseBacklinks(initialCompany.backlinks, initialCompany.company_url)
    );
    const [isFeatured, setIsFeatured] = useState(initialCompany.is_featured);
    const [logoUrl, setLogoUrl] = useState(initialCompany.logo_url || '');
    const [logoSourceUrl, setLogoSourceUrl] = useState(initialCompany.logo_source_url || '');
    const [videoUrl, setVideoUrl] = useState(initialCompany.video_url || '');
    const [videoPosterUrl, setVideoPosterUrl] = useState(initialCompany.video_poster_url || '');
    const [brochureUrl, setBrochureUrl] = useState(initialCompany.brochure_url || '');
    // 보관함 선택 모달: 어느 칸에 넣을지
    const [libraryTarget, setLibraryTarget] = useState<'video' | 'poster' | 'brochure' | null>(null);
    const [inquiryUrl, setInquiryUrl] = useState(initialCompany.inquiry_url || '');
    const [contactEmail, setContactEmail] = useState(initialCompany.contact_email || '');
    const [contactPhone, setContactPhone] = useState(initialCompany.contact_phone || '');
    const [tagline, setTagline] = useState(initialCompany.tagline || '');

    // 탭 상태
    const [activeTab, setActiveTab] = useState<'linked' | 'ingested'>('linked');

    // 기사 검색 & 연결 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Article[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [ingesting, setIngesting] = useState(false);

    // 에디터 Ref
    const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);
    const referencesTextareaRef = useRef<HTMLTextAreaElement>(null);

    // 글머리 기호(•) 삽입 핸들러 (회사소개 및 최근현황)
    const handleInsertBulletToSummary = () => {
        const textarea = summaryTextareaRef.current;
        if (!textarea) {
            setBusinessSummary(prev => (prev ? `${prev}\n• ` : '• '));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = businessSummary;

        if (start !== end) {
            // 텍스트 블록 선택 시: 선택된 각 줄 앞에 글머리 기호 부착
            const before = text.substring(0, start);
            const selection = text.substring(start, end);
            const after = text.substring(end);

            const bulletedSelection = selection
                .split('\n')
                .map(line => (/^[•\-\*▪]\s*/.test(line.trim()) ? line : `• ${line}`))
                .join('\n');

            const newText = before + bulletedSelection + after;
            setBusinessSummary(newText);

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start, start + bulletedSelection.length);
            }, 0);
            return;
        }

        // 단일 커서 위치에 삽입
        const isStartOfLine = start === 0 || text[start - 1] === '\n';
        const insertStr = isStartOfLine ? '• ' : '\n• ';

        const newText = text.substring(0, start) + insertStr + text.substring(end);
        setBusinessSummary(newText);

        const newCursorPos = start + insertStr.length;
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Enter 키 스마트 글머리 기호 자동 연속 핸들러
    const handleSummaryKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            const textarea = e.currentTarget;
            const cursorPos = textarea.selectionStart;
            const text = businessSummary;

            // 현재 커서가 속한 줄 탐색
            const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
            const nextNewline = text.indexOf('\n', cursorPos);
            const lineEnd = nextNewline === -1 ? text.length : nextNewline;
            const currentLine = text.substring(lineStart, lineEnd);

            const bulletMatch = currentLine.match(/^[•\-\*▪]\s*/);
            if (bulletMatch) {
                e.preventDefault();
                const contentAfterBullet = currentLine.substring(bulletMatch[0].length).trim();

                if (contentAfterBullet === '') {
                    // 빈 글머리 기호에서 Enter -> 기호 삭제 후 리스트 종료
                    const newText = text.substring(0, lineStart) + text.substring(cursorPos);
                    setBusinessSummary(newText);
                    setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(lineStart, lineStart);
                    }, 0);
                } else {
                    // 항목 작성 후 Enter -> 다음 줄에 자동으로 글머리 기호(• ) 삽입
                    const insertStr = '\n• ';
                    const newText = text.substring(0, cursorPos) + insertStr + text.substring(cursorPos);
                    setBusinessSummary(newText);
                    const nextCursor = cursorPos + insertStr.length;
                    setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(nextCursor, nextCursor);
                    }, 0);
                }
            }
        }
    };

    // 단락 간격 및 구분선 삽입 핸들러 (회사소개 및 최근현황)
    const handleInsertSpacingToSummary = (type: 'narrow' | 'medium' | 'large' | 'divider') => {
        const textarea = summaryTextareaRef.current;
        let insertStr = '';
        if (type === 'narrow') insertStr = '\n[여백:좁게]\n';
        else if (type === 'medium') insertStr = '\n\n';
        else if (type === 'large') insertStr = '\n\n\n';
        else if (type === 'divider') insertStr = '\n\n---\n\n';

        if (!textarea) {
            setBusinessSummary(prev => (prev ? `${prev}${insertStr}` : insertStr));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = businessSummary;

        const newText = text.substring(0, start) + insertStr + text.substring(end);
        setBusinessSummary(newText);

        const newCursorPos = start + insertStr.length;
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // 주요 실적/레퍼런스 글머리 기호 삽입 핸들러
    const handleInsertBulletToReferences = () => {
        const textarea = referencesTextareaRef.current;
        if (!textarea) {
            setKeyReferences(prev => (prev ? `${prev}\n• ` : '• '));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = keyReferences;

        const isStartOfLine = start === 0 || text[start - 1] === '\n';
        const insertStr = isStartOfLine ? '• ' : '\n• ';

        const newText = text.substring(0, start) + insertStr + text.substring(end);
        setKeyReferences(newText);

        const newCursorPos = start + insertStr.length;
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

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

            const parsedAliases = aliases
                .split(/[\n,]/)
                .map((s: string) => s.trim())
                .filter(Boolean);
            const parsedReferences = keyReferences
                .split('\n')
                .map((s: string) => s.replace(/^[•\-\*▪]\s*/, '').trim())
                .filter(Boolean);

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
                logo_url: logoUrl.trim() || null,
                logo_source_url: logoSourceUrl.trim() || null,
                video_url: videoUrl.trim() || null,
                video_poster_url: videoPosterUrl.trim() || null,
                brochure_url: brochureUrl.trim() || null,
                inquiry_url: inquiryUrl.trim() || null,
                contact_email: contactEmail.trim() || null,
                contact_phone: contactPhone.trim() || null,
                tagline: tagline.trim() || null,
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
        const ok = await confirm({
            title: '기사 연결 해제',
            description: `"${title.slice(0, 35)}..." 기사의 연관 연결을 해제하시겠습니까?`,
            confirmText: '연결 해제',
            variant: 'destructive',
        });
        if (!ok) return;

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

            {/* 탭 네비게이션 */}
            <div className="flex gap-2 border-b">
                <span className="pb-2 px-1 text-sm font-semibold border-b-2 border-foreground flex items-center gap-1.5">
                    <Edit className="w-3.5 h-3.5" />
                    편집
                </span>
                <Link
                    href={`/admin/companies/${company.id}/analytics`}
                    className="pb-2 px-1 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    애널리틱스
                </Link>
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

                            <div className="pt-2 border-t border-slate-100 space-y-2">
                                <Label className="text-xs font-semibold">조직 로고 및 제작용 원본 파일 (SVG, PNG, JPG, WebP / .AI, .EPS, .PDF)</Label>
                                <CompanyLogoUpload
                                    logoUrl={logoUrl}
                                    logoSourceUrl={logoSourceUrl}
                                    onLogoUrlChange={setLogoUrl}
                                    onLogoSourceUrlChange={setLogoSourceUrl}
                                />
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

                    {/* 프로필 영상·소개자료·문의 연결 카드 (값이 없으면 공개 프로필에서 해당 블록·버튼 숨김) */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">프로필 영상 · 소개자료 · 문의</CardTitle>
                            <CardDescription>비워 두면 공개 프로필에서 해당 영상 블록과 버튼이 표시되지 않습니다.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="org-video-url" className="text-xs font-semibold">소개 영상 URL</Label>
                                    <div className="flex gap-1.5">
                                        <Input
                                            id="org-video-url"
                                            value={videoUrl}
                                            onChange={e => setVideoUrl(e.target.value)}
                                            placeholder="https://...mp4 또는 유튜브 주소"
                                            className="h-9"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLibraryTarget('video')}
                                            className="h-9 shrink-0 gap-1 px-2.5 text-xs"
                                            aria-label="소개 영상 보관함에서 선택"
                                        >
                                            <FolderOpen className="h-3.5 w-3.5" />
                                            보관함
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="org-video-poster" className="text-xs font-semibold">영상 포스터 이미지 URL</Label>
                                    <div className="flex gap-1.5">
                                        <Input
                                            id="org-video-poster"
                                            value={videoPosterUrl}
                                            onChange={e => setVideoPosterUrl(e.target.value)}
                                            placeholder="https://... (유튜브는 비워 두면 자동 썸네일)"
                                            className="h-9"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLibraryTarget('poster')}
                                            className="h-9 shrink-0 gap-1 px-2.5 text-xs"
                                            aria-label="영상 포스터 보관함에서 선택"
                                        >
                                            <FolderOpen className="h-3.5 w-3.5" />
                                            보관함
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="org-brochure" className="text-xs font-semibold">소개자료 다운로드 URL</Label>
                                    <div className="flex gap-1.5">
                                        <Input
                                            id="org-brochure"
                                            value={brochureUrl}
                                            onChange={e => setBrochureUrl(e.target.value)}
                                            placeholder="https://...pdf"
                                            className="h-9"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLibraryTarget('brochure')}
                                            className="h-9 shrink-0 gap-1 px-2.5 text-xs"
                                            aria-label="소개자료 보관함에서 선택"
                                        >
                                            <FolderOpen className="h-3.5 w-3.5" />
                                            보관함
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="org-inquiry" className="text-xs font-semibold">문의하기 연결처</Label>
                                    <Input
                                        id="org-inquiry"
                                        value={inquiryUrl}
                                        onChange={e => setInquiryUrl(e.target.value)}
                                        placeholder="https://문의 폼 주소 (mailto:·tel:도 가능)"
                                        className="h-9"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="org-contact-email" className="text-xs font-semibold">문의 이메일</Label>
                                        <Input
                                            id="org-contact-email"
                                            type="email"
                                            value={contactEmail}
                                            onChange={e => setContactEmail(e.target.value)}
                                            placeholder="contact@example.com"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="org-contact-phone" className="text-xs font-semibold">문의 전화</Label>
                                        <Input
                                            id="org-contact-phone"
                                            type="tel"
                                            value={contactPhone}
                                            onChange={e => setContactPhone(e.target.value)}
                                            placeholder="031-000-0000"
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    공개 프로필의 [문의하기]는 연결처 → 이메일 → 전화 순으로 먼저 입력된 하나로 연결됩니다. 모두 비우면 버튼이 숨겨집니다.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <StorageImageSelectorModal
                        isOpen={libraryTarget !== null}
                        accept={({ video: 'video', poster: 'image', brochure: 'document' } as const satisfies Record<string, SelectableMedia>)[libraryTarget ?? 'video']}
                        onClose={() => setLibraryTarget(null)}
                        onSelect={(url) => {
                            if (libraryTarget === 'video') setVideoUrl(url);
                            else if (libraryTarget === 'poster') setVideoPosterUrl(url);
                            else if (libraryTarget === 'brochure') setBrochureUrl(url);
                        }}
                    />

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
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="org-tagline" className="text-xs font-semibold">한 줄 소개 (목록 표시용)</Label>
                                    <span className={`text-[11px] tabular-nums ${tagline.length > 40 ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                                        {tagline.length}/40
                                    </span>
                                </div>
                                <Input
                                    id="org-tagline"
                                    value={tagline}
                                    maxLength={60}
                                    onChange={e => setTagline(e.target.value)}
                                    placeholder="비우면 회사소개 첫 문장에서 조직명을 뺀 문구를 사용합니다"
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <Label className="text-xs font-semibold">회사소개 및 최근현황 (Business Summary & Status)</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleInsertBulletToSummary}
                                            className="h-6 px-2 text-[11px] font-medium text-slate-700 hover:text-purple-700 hover:border-purple-300 border-slate-300 flex items-center gap-1 shadow-2xs"
                                            title="글머리 기호(•)를 삽입합니다"
                                        >
                                            <List className="h-3 w-3 text-purple-600" />
                                            <span>글머리 기호</span>
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 text-[11px] font-medium text-slate-700 hover:text-purple-700 hover:border-purple-300 border-slate-300 flex items-center gap-1 shadow-2xs"
                                                >
                                                    <MoveVertical className="h-3 w-3 text-slate-500" />
                                                    <span>단락 간격 조절</span>
                                                    <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg">
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacingToSummary('narrow')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-purple-600">·</span>
                                                    <span>미세 간격 (5px)</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacingToSummary('medium')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-purple-600">↕</span>
                                                    <span>중간 간격 (Enter 2회)</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacingToSummary('large')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-purple-600">⇕</span>
                                                    <span>넓은 간격 (Enter 3회)</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacingToSummary('divider')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-slate-400">―</span>
                                                    <span>구분선 삽입 (---)</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <span className="text-[10px] text-muted-foreground hidden sm:inline">기본 10px | 미세 간격 및 Enter 횟수로 조율</span>
                                    </div>
                                </div>
                                <Textarea
                                    ref={summaryTextareaRef}
                                    value={businessSummary}
                                    onChange={e => setBusinessSummary(e.target.value)}
                                    onKeyDown={handleSummaryKeyDown}
                                    placeholder="조직의 설립 목적, 주요 사업 내용, 최근 현황 및 제공 가치를 상세히 서술하세요.&#10;• '글머리 기호' 버튼으로 불릿 목록을 작성할 수 있습니다.&#10;• 기본 단락 간격: 10px (줄바꿈 1회)&#10;• '단락 간격 조절' 메뉴(미세 5px, 중간, 넓음) 또는 Enter 줄바꿈 횟수로 단락 사이 길이를 세부적으로 조율할 수 있습니다."
                                    rows={9}
                                    className="text-sm leading-relaxed min-h-[170px] whitespace-pre-wrap font-sans"
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
                                        placeholder="안양진흥원, APA, 진흥원 (쉼표로 구분)"
                                        className="h-8 text-xs"
                                    />
                                    <p className="text-[10px] text-muted-foreground">쉼표(,)로 구분. 뉴스 크롤링 시 일치 검사에 활용됩니다.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold">주요 실적 / 레퍼런스</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleInsertBulletToReferences}
                                            className="h-5 px-1.5 text-[10px] text-slate-500 hover:text-purple-600 flex items-center gap-1"
                                        >
                                            <List className="h-2.5 w-2.5 text-purple-600" />
                                            <span>기호 삽입</span>
                                        </Button>
                                    </div>
                                    <Textarea
                                        ref={referencesTextareaRef}
                                        value={keyReferences}
                                        onChange={e => setKeyReferences(e.target.value)}
                                        placeholder="2024 유망중소기업 선정&#10;2023 글로벌 강소기업 지정&#10;(한 줄에 한 항목씩 입력)"
                                        rows={3}
                                        className="text-xs min-h-[68px]"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 우측: 기사 연결 및 수집 관리 (5컬럼) */}
                <CompanyArticlesPanel
                    company={company}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    totalRelatedCount={totalRelatedCount}
                    combinedIngestedArticles={combinedIngestedArticles}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSearchArticles={handleSearchArticles}
                    isSearching={isSearching}
                    searchResults={searchResults}
                    isArticleLinked={isArticleLinked}
                    isPending={isPending}
                    handleLinkArticle={handleLinkArticle}
                    handleUnlinkArticle={handleUnlinkArticle}
                    handleIngestNews={handleIngestNews}
                    ingesting={ingesting}
                />
            </div>
        </div>
    );
}
