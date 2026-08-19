'use client';

import { useState, useMemo, useTransition } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit2, Save, X, Loader2, ExternalLink, TrendingUp, Building2, Calendar, LayoutDashboard, Star, ArrowUpDown, ArrowUp, ArrowDown, Info, Newspaper } from 'lucide-react';
import { toast } from 'sonner';
import { updateCompany, toggleCompanyFeatured } from '@/actions/company-actions';
import { ingestByOrganization } from '@/actions/ingest-actions';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

function ExpandableText({ text }: { text: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return <span>기록된 데이터가 없습니다.</span>;

  // 100자를 기준으로 긴 텍스트인지 판단
  const isLong = text.length > 100;

  return (
    <div>
      <div className={isExpanded || !isLong ? "text-sm leading-relaxed" : "text-sm leading-relaxed line-clamp-3"}>
        {text}
      </div>
      {isLong && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-blue-500 hover:text-blue-700 text-xs font-semibold mt-2 focus:outline-none flex items-center justify-center w-full py-1 border-t border-slate-200 dark:border-slate-800"
        >
          {isExpanded ? '접기 ▲' : '자세히 보기 ▼'}
        </button>
      )}
    </div>
  );
}

function parseKeywords(keywordsStr: any) {
  if (!keywordsStr) return null;
  try {
    if (typeof keywordsStr === 'string') {
      return JSON.parse(keywordsStr);
    }
    return keywordsStr;
  } catch {
    return null;
  }
}

function safeGetHostname(url: string | null) {
  if (!url) return '';
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
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
    } catch {}
  }
  if (companyUrl) {
    return [{ title: '홈페이지 바로가기', url: companyUrl }];
  }
  return [];
}

export function CompanyListTable({ companies }: { companies: any[] }) {
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'articleCount'; direction: 'asc' | 'desc' } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isPending, startTransition] = useTransition();
  const [isIngesting, setIsIngesting] = useState(false);

  const handleIngest = async () => {
    if (!selectedCompany) return;
    setIsIngesting(true);
    toast.info(`"${selectedCompany.company_name}" 연관 기사 수집 중...`);
    try {
      const result = await ingestByOrganization(selectedCompany.id);
      if (result.success) {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('수집 중 오류가 발생했습니다.');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleEditClick = () => {
    const kw = parseKeywords(selectedCompany.core_keywords) || {};
    const parsedLinks = parseBacklinks(selectedCompany.backlinks, selectedCompany.company_url);

    setEditForm({
      company_name: selectedCompany.company_name || '',
      slug: selectedCompany.slug || '',
      entity_type: selectedCompany.entity_type || '기업',
      company_url: selectedCompany.company_url || '',
      backlinks: parsedLinks.length > 0 ? parsedLinks : [{ title: '홈페이지 바로가기', url: '' }],
      business_summary: selectedCompany.business_summary || '',
      founded_year: selectedCompany.founded_year || '',
      hq_location: selectedCompany.hq_location || '',
      ceo_name: selectedCompany.ceo_name || '',
      key_references: selectedCompany.key_references?.join(', ') || '',
      kw_products: kw.products?.join(', ') || '',
      kw_technology: kw.technology?.join(', ') || '',
      kw_target_market: kw.target_market?.join(', ') || '',
      aliases: selectedCompany.aliases?.join(', ') || '',
      active_region_id: selectedCompany.region_id,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const core_keywords = {
        products: editForm.kw_products.split(',').map((s: string) => s.trim()).filter(Boolean),
        technology: editForm.kw_technology.split(',').map((s: string) => s.trim()).filter(Boolean),
        target_market: editForm.kw_target_market.split(',').map((s: string) => s.trim()).filter(Boolean),
      };

      const cleanBacklinks = Array.isArray(editForm.backlinks)
        ? editForm.backlinks
            .filter((item: any) => item.title?.trim() !== '' && item.url?.trim() !== '')
            .slice(0, 3)
        : [];
      const primaryUrl = cleanBacklinks[0]?.url || editForm.company_url || null;

      const res = await updateCompany(selectedCompany.id, editForm.active_region_id, {
        company_name: editForm.company_name,
        slug: editForm.slug,
        entity_type: editForm.entity_type,
        company_url: primaryUrl,
        backlinks: cleanBacklinks,
        business_summary: editForm.business_summary,
        founded_year: editForm.founded_year,
        hq_location: editForm.hq_location,
        ceo_name: editForm.ceo_name,
        key_references: editForm.key_references.split(',').map((s: string) => s.trim()).filter(Boolean),
        core_keywords,
        aliases: editForm.aliases.split(',').map((s: string) => s.trim()).filter(Boolean),
      });

      if (res.success) {
        toast.success('기업 정보가 수정되었습니다.');
        setSelectedCompany({ ...selectedCompany, ...res.company });
        setIsEditing(false);
      } else {
        toast.error('수정에 실패했습니다.');
      }
    });
  };

  // 고유한 지역 목록 추출
  const regions = useMemo(() => {
    const map = new Map();
    companies.forEach(company => {
      if (company.region) {
        map.set(company.region.id, company.region);
      }
    });
    return Array.from(map.values());
  }, [companies]);

  // 필터링 및 정렬이 적용된 기업 목록
  const filteredAndSortedCompanies = useMemo(() => {
    let result = companies.filter(company => {
      // 지역 필터
      const matchRegion = selectedRegion === 'all' ||
        String(company.region_id) === selectedRegion;

      // 검색어 필터
      const term = searchTerm.trim().toLowerCase();
      const matchSearch = term === '' ||
        company.company_name?.toLowerCase().includes(term) ||
        company.business_summary?.toLowerCase().includes(term) ||
        company.aliases?.some((alias: string) => alias.toLowerCase().includes(term));

      return matchRegion && matchSearch;
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        if (sortConfig.key === 'name') {
          return sortConfig.direction === 'asc'
            ? a.company_name.localeCompare(b.company_name)
            : b.company_name.localeCompare(a.company_name);
        } else if (sortConfig.key === 'articleCount') {
          const aCount = a.company_articles?.length || 0;
          const bCount = b.company_articles?.length || 0;
          return sortConfig.direction === 'asc' ? aCount - bCount : bCount - aCount;
        }
        return 0;
      });
    }

    return result;
  }, [companies, selectedRegion, searchTerm, sortConfig]);

  const handleSort = (key: 'name' | 'articleCount') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleToggleFeatured = (company: any, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleCompanyFeatured(company.id, !company.is_featured);
      if (res.success && res.company) {
        toast.success(res.company.is_featured ? '피처드 기관으로 등록되었습니다.' : '피처드 등록이 해제되었습니다.');
      } else {
        toast.error('상태 변경에 실패했습니다.');
      }
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="기관/기업명 또는 요약 키워드 검색..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder="지역 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">지역 전체</SelectItem>
              {regions.map((reg: any) => (
                <SelectItem key={reg.id} value={String(reg.id)}>
                  {reg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-500 font-medium">
          전체 <span className="text-slate-900 font-bold">{filteredAndSortedCompanies.length}</span>개의 기관/기업이 검색되었습니다.
        </div>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center"></TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50 transition-colors group"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center font-bold text-slate-700">
                  기관/기업명
                  {sortConfig?.key === 'name' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" /> : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                  )}
                </div>
              </TableHead>
              <TableHead>구분</TableHead>
              <TableHead>지역</TableHead>
              <TableHead>홈페이지 URL</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50 transition-colors group"
                onClick={() => handleSort('articleCount')}
              >
                <div className="flex items-center font-bold text-slate-700">
                  연관 기사수
                  {sortConfig?.key === 'articleCount' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" /> : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedCompanies.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => {
                    setSelectedCompany(company);
                    setEditForm({
                      active_region_id: company.region_id,
                    });
                  }}
                >
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleToggleFeatured(company, e)}
                      className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 ${company.is_featured ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                    {company.company_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{company.entity_type || '기업'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                        {company.region?.name || '로컬'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.company_url ? (
                      <span className="text-muted-foreground underline decoration-dotted">
                        {safeGetHostname(company.company_url)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge>{company.company_articles?.length || 0}건</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedCompany} onOpenChange={(open) => {
        if (!open) {
          setSelectedCompany(null);
          setIsEditing(false);
        }
      }}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 p-0 border-l-0 sm:border-l">
          {selectedCompany && (
            <div className="flex flex-col min-h-full bg-white dark:bg-slate-900 shadow-xl">
              {/* Header Section */}
              <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b px-6 py-6 sm:px-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-4 flex-1">
                    <div className="flex flex-col gap-2">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <Input
                            value={editForm.company_name}
                            onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                            className="text-2xl font-bold h-12 flex-1 min-w-[200px]"
                            title="조직의 정식 명칭을 입력하세요. (예: 삼성전자)"
                          />
                          <Input
                            value={editForm.entity_type}
                            onChange={(e) => setEditForm({ ...editForm, entity_type: e.target.value })}
                            className="w-[120px] h-12"
                            title="조직의 형태를 입력하세요. (예: 기업, 스타트업, 기관)"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          <SheetTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                            {selectedCompany.company_name}
                          </SheetTitle>
                          <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                            {selectedCompany.entity_type || '기업'}
                          </Badge>
                        </div>
                      )}

                      {!isEditing ? (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>프로필 URL: <a href={`/insight-radar/${selectedCompany.slug || selectedCompany.id}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-mono">/insight-radar/{selectedCompany.slug || selectedCompany.id}</a></span>
                          {parseBacklinks(selectedCompany.backlinks, selectedCompany.company_url).map((bl: any, i: number) => (
                            <span key={i} className="flex items-center gap-1">
                              <span>•</span>
                              <a href={bl.url.startsWith('http') ? bl.url : `https://${bl.url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> {bl.title || '링크'}
                              </a>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4 max-w-2xl w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <Label className="w-20 shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">URL 슬러그</Label>
                            <Input
                              value={editForm.slug}
                              onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                              placeholder="영문, 숫자, 한글, 하이픈 (비우면 자동생성)"
                              title="인사이트 레이더 URL 슬러그 (예: kakao-corp)"
                              className="flex-1 font-mono text-xs bg-white dark:bg-slate-800"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">외부 백링크 (최대 3개)</Label>
                              {(editForm.backlinks || []).length < 3 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-indigo-600 hover:text-indigo-700 p-0"
                                  onClick={() => setEditForm({ ...editForm, backlinks: [...(editForm.backlinks || []), { title: '', url: '' }] })}
                                >
                                  + 백링크 추가
                                </Button>
                              )}
                            </div>
                            {(editForm.backlinks || []).map((link: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  placeholder="표시 텍스트 (예: 홈페이지 바로가기)"
                                  value={link.title}
                                  onChange={(e) => {
                                    const next = [...(editForm.backlinks || [])];
                                    next[idx] = { ...next[idx], title: e.target.value };
                                    setEditForm({ ...editForm, backlinks: next });
                                  }}
                                  className="w-2/5 text-xs bg-white dark:bg-slate-800"
                                />
                                <Input
                                  placeholder="연결 URL (예: https://...)"
                                  value={link.url}
                                  onChange={(e) => {
                                    const next = [...(editForm.backlinks || [])];
                                    next[idx] = { ...next[idx], url: e.target.value };
                                    setEditForm({ ...editForm, backlinks: next });
                                  }}
                                  className="flex-1 text-xs bg-white dark:bg-slate-800"
                                />
                                {(editForm.backlinks || []).length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500"
                                    onClick={() => {
                                      const next = (editForm.backlinks || []).filter((_: any, i: number) => i !== idx);
                                      setEditForm({ ...editForm, backlinks: next });
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>


                  </div>

                  <div className="flex shrink-0 gap-2">
                    {!isEditing ? (
                      <>
                        <Button 
                          variant="secondary" 
                          size="lg" 
                          className="h-11 px-6 shadow-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50" 
                          onClick={handleIngest}
                          disabled={isIngesting}
                        >
                          {isIngesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Newspaper className="w-4 h-4 mr-2" />} 
                          기사 수집
                        </Button>
                        <Button variant="outline" size="lg" className="h-11 px-6 shadow-sm" onClick={handleEditClick}>
                          <Edit2 className="w-4 h-4 mr-2" /> 수정하기
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="lg" className="h-11" onClick={() => setIsEditing(false)} disabled={isPending}>
                          취소
                        </Button>
                        <Button size="lg" className="h-11 px-8 shadow-md bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={isPending}>
                          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 저장
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 px-6 py-8 sm:px-10 space-y-12">
                {/* 1. Business Outline */}
                <section>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    비즈니스 개요
                  </h3>
                  {isEditing ? (
                    <Textarea
                      value={editForm.business_summary}
                      onChange={(e) => setEditForm({ ...editForm, business_summary: e.target.value })}
                      rows={6}
                      className="text-base leading-relaxed bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      title="조직의 비즈니스 모델 및 핵심 가치에 대해 자세히 설명하세요."
                    />
                  ) : (
                    <div className="text-base leading-relaxed p-8 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-slate-700 dark:text-slate-300">
                      <ExpandableText text={selectedCompany.business_summary} />
                    </div>
                  )}
                </section>

                {/* 2. Company Profile */}
                <section>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    상세 정보
                  </h3>
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">설립연도</Label>
                          <span title="조직이 설립된 연도를 4자리 숫자로 기입하세요. (예: 2010)" className="cursor-help inline-flex items-center">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </div>
                        <Input
                          value={editForm.founded_year}
                          onChange={(e) => setEditForm({ ...editForm, founded_year: e.target.value })}
                          className="h-11 bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">대표자명</Label>
                          <span title="조직을 대표하는 인물의 이름을 입력하세요. (예: 홍길동)" className="cursor-help inline-flex items-center">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </div>
                        <Input
                          value={editForm.ceo_name}
                          onChange={(e) => setEditForm({ ...editForm, ceo_name: e.target.value })}
                          className="h-11 bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">본사 소재지</Label>
                          <span title="조직의 본사나 주요 위치를 간략히 입력하세요. (예: 서울특별시 강남구)" className="cursor-help inline-flex items-center">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </div>
                        <Input
                          value={editForm.hq_location}
                          onChange={(e) => setEditForm({ ...editForm, hq_location: e.target.value })}
                          className="h-11 bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">주요 레퍼런스 (쉼표로 구분)</Label>
                          <span title="조직의 주요 고객사, 파트너사, 투자사 등을 쉼표로 구분하여 입력하세요." className="cursor-help inline-flex items-center">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </div>
                        <Input
                          value={editForm.key_references}
                          onChange={(e) => setEditForm({ ...editForm, key_references: e.target.value })}
                          className="h-11 bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">별칭 (쉼표로 구분)</Label>
                          <span title="조직을 지칭하는 약어, 이전 이름, 영문명 등을 쉼표로 구분하여 입력하세요. 기사 수집 시 키워드로 활용됩니다. (예: 현대, 현대차)" className="cursor-help inline-flex items-center">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </div>
                        <Input
                          value={editForm.aliases}
                          onChange={(e) => setEditForm({ ...editForm, aliases: e.target.value })}
                          className="h-11 bg-white dark:bg-slate-950"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 p-8 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">설립연도</span>
                        <span className="text-base font-semibold text-slate-800 dark:text-slate-200">{selectedCompany.founded_year || '-'}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">대표자</span>
                        <span className="text-base font-semibold text-slate-800 dark:text-slate-200">{selectedCompany.ceo_name || '-'}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">본사 소재지</span>
                        <span className="text-base font-semibold text-slate-800 dark:text-slate-200">{selectedCompany.hq_location || '-'}</span>
                      </div>
                      <div className="flex flex-col gap-3 sm:col-span-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">주요 레퍼런스</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedCompany.key_references && selectedCompany.key_references.length > 0 ? (
                            selectedCompany.key_references.map((ref: string, i: number) => (
                              <Badge key={i} variant="secondary" className="px-3 py-1 text-xs font-medium">
                                {ref}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400 font-medium italic">정보가 없습니다.</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:col-span-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">별칭 (Aliases)</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedCompany.aliases && selectedCompany.aliases.length > 0 ? (
                            selectedCompany.aliases.map((alias: string, i: number) => (
                              <Badge key={i} variant="outline" className="px-3 py-1 text-xs font-medium border-slate-200 dark:border-slate-700">
                                {alias}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400 font-medium italic">별칭이 설정되지 않았습니다.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* 3. Strategic Positioning */}
                <section>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    전략적 포지셔닝
                  </h3>
                  {isEditing ? (
                    <div className="grid grid-cols-1 gap-6 p-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">핵심 제품 및 서비스</Label>
                          <span title="조직이 제공하는 주요 제품이나 서비스를 쉼표로 구분하여 입력하세요. (예: LED 조명, 산업용 조명)" className="cursor-help inline-flex items-center">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </div>
                        <Input
                          value={editForm.kw_products}
                          onChange={(e) => setEditForm({ ...editForm, kw_products: e.target.value })}
                          className="bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">핵심 기술 (Tech)</Label>
                          <span title="조직이 보유한 핵심 기술을 쉼표로 구분하여 입력하세요. (예: 인공지능, 자율주행)" className="cursor-help inline-flex items-center">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </div>
                        <Input
                          value={editForm.kw_technology}
                          onChange={(e) => setEditForm({ ...editForm, kw_technology: e.target.value })}
                          className="bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">타겟 시장 (Market)</Label>
                          <span title="조직이 목표로 하는 주요 시장을 쉼표로 구분하여 입력하세요. (예: B2B, 스마트시티)" className="cursor-help inline-flex items-center">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </div>
                        <Input
                          value={editForm.kw_target_market}
                          onChange={(e) => setEditForm({ ...editForm, kw_target_market: e.target.value })}
                          className="bg-white dark:bg-slate-950"
                        />
                      </div>

                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(() => {
                        const kw = parseKeywords(selectedCompany.core_keywords);
                        if (!kw) return <div className="text-sm text-slate-400 italic col-span-2">설정된 키워드가 없습니다.</div>;

                        return (
                          <>
                            {kw.products && kw.products.length > 0 && (
                              <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950/30">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">핵심 제품 및 서비스</h4>
                                <div className="flex flex-wrap gap-2">
                                  {kw.products.map((p: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs font-bold bg-blue-50/50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 px-3 py-1">
                                      {p}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {kw.technology && kw.technology.length > 0 && (
                              <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950/30">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">핵심 기술 (Tech)</h4>
                                <div className="flex flex-wrap gap-2">
                                  {kw.technology.map((t: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs font-bold bg-indigo-50/50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800 px-3 py-1">
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {kw.target_market && kw.target_market.length > 0 && (
                              <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950/30">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">타겟 시장 (Market)</h4>
                                <div className="flex flex-wrap gap-2">
                                  {kw.target_market.map((m: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs font-bold bg-emerald-50/50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 px-3 py-1">
                                      {m}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                          </>
                        );
                      })()}
                    </div>
                  )}
                </section>


                {/* 4. 연관 기사 */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      연관 기사
                    </h3>
                    <Badge variant="secondary">{selectedCompany.company_articles?.length || 0}건</Badge>
                  </div>

                  {selectedCompany.company_articles?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCompany.company_articles.map((ca: any) => {
                        const article = ca.article;
                        if (!article) return null;

                        return (
                          <div key={ca.id} className="p-4 border rounded-lg hover:border-blue-400 transition-colors">
                            <a href={article.canonical_link} target="_blank" rel="noreferrer" className="block space-y-2">
                              <h4 className="font-medium text-sm leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
                                {article.title?.replace(/<[^>]*>?/gm, '')}
                              </h4>
                              {article.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {article.description?.replace(/<[^>]*>?/gm, '')}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
                                <span>{article.source}</span>
                                <span>{article.pub_date ? new Date(article.pub_date).toLocaleDateString() : '날짜 미상'}</span>
                              </div>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-center py-6 border border-dashed rounded-lg text-muted-foreground">
                      연결된 기사가 없습니다.
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
