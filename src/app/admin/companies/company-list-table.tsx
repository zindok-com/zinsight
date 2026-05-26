'use client';

import { useState, useMemo, useTransition } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit2, Save, X, Loader2, ExternalLink, TrendingUp, Building2, Calendar, LayoutDashboard, Star, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { updateCompany, toggleCompanyFeatured } from '@/actions/company-actions';
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

export function CompanyListTable({ companies }: { companies: any[] }) {
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'articleCount'; direction: 'asc' | 'desc' } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isPending, startTransition] = useTransition();

  const handleEditClick = () => {
    const kw = parseKeywords(selectedCompany.core_keywords) || {};

    // 선택된 산업군 또는 기본 산업군의 컨텍스트 로드
    const currentIndustryId = editForm.active_industry_id || (selectedIndustry !== 'all'
      ? parseInt(selectedIndustry)
      : selectedCompany.industries[0]?.industry_id);

    const industrySpecific = selectedCompany.industries.find(
      (i: any) => i.industry_id === currentIndustryId
    ) || {};

    setEditForm({
      company_name: selectedCompany.company_name || '',
      entity_type: selectedCompany.entity_type || '기업',
      company_url: selectedCompany.company_url || '',
      business_summary: selectedCompany.business_summary || '',
      recent_status: industrySpecific.recent_status || '',
      founded_year: selectedCompany.founded_year || '',
      hq_location: selectedCompany.hq_location || '',
      ceo_name: selectedCompany.ceo_name || '',
      key_references: selectedCompany.key_references?.join(', ') || '',
      kw_products: kw.products?.join(', ') || '',
      kw_technology: kw.technology?.join(', ') || '',
      kw_target_market: kw.target_market?.join(', ') || '',
      aliases: selectedCompany.aliases?.join(', ') || '',
      recent_keywords: industrySpecific.recent_keywords?.join(', ') || '',
      active_industry_id: currentIndustryId,
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

      const res = await updateCompany(selectedCompany.id, editForm.active_industry_id, {
        company_name: editForm.company_name,
        entity_type: editForm.entity_type,
        company_url: editForm.company_url,
        business_summary: editForm.business_summary,
        recent_status: editForm.recent_status,
        founded_year: editForm.founded_year,
        hq_location: editForm.hq_location,
        ceo_name: editForm.ceo_name,
        key_references: editForm.key_references.split(',').map((s: string) => s.trim()).filter(Boolean),
        core_keywords,
        aliases: editForm.aliases.split(',').map((s: string) => s.trim()).filter(Boolean),
        recent_keywords: editForm.recent_keywords.split(',').map((s: string) => s.trim()).filter(Boolean),
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

  // 고유한 산업군 목록 추출
  const industries = useMemo(() => {
    const map = new Map();
    companies.forEach(company => {
      company.industries?.forEach((ci: any) => {
        if (ci.industry) {
          map.set(ci.industry.id, ci.industry);
        }
      });
    });
    return Array.from(map.values());
  }, [companies]);

  // 필터링 및 정렬이 적용된 기업 목록
  const filteredAndSortedCompanies = useMemo(() => {
    let result = companies.filter(company => {
      // 산업군 필터
      const matchIndustry = selectedIndustry === 'all' ||
        company.industries?.some((ci: any) => String(ci.industry_id) === selectedIndustry);

      // 검색어 필터
      const term = searchTerm.trim().toLowerCase();
      const matchSearch = term === '' ||
        company.company_name?.toLowerCase().includes(term) ||
        company.business_summary?.toLowerCase().includes(term) ||
        company.aliases?.some((alias: string) => alias.toLowerCase().includes(term)) ||
        company.industries?.some((ci: any) => ci.recent_status?.toLowerCase().includes(term));

      return matchIndustry && matchSearch;
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
  }, [companies, selectedIndustry, searchTerm, sortConfig]);

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
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="산업군 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">산업군 전체</SelectItem>
              {industries.map((ind: any) => (
                <SelectItem key={ind.id} value={String(ind.id)}>
                  {ind.name}
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
              <TableHead>산업군</TableHead>
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
                    // 상세 뷰 진입 시 초기 활성 산업군 컨텍스트 설정
                    const defaultIndustryId = selectedIndustry !== 'all'
                      ? parseInt(selectedIndustry)
                      : company.industries[0]?.industry_id;

                    const industrySpecific = company.industries.find(
                      (i: any) => i.industry_id === defaultIndustryId
                    ) || {};

                    setEditForm({
                      active_industry_id: defaultIndustryId,
                      recent_status: industrySpecific.recent_status || '',
                      recent_keywords: industrySpecific.recent_keywords?.join(', ') || '',
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
                      {company.industries?.map((ci: any) => (
                        <Badge key={ci.industry_id} variant="outline" className="text-[10px] whitespace-nowrap">
                          {ci.industry?.name}
                        </Badge>
                      )) || '알 수 없음'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.company_url ? (
                      <span className="text-muted-foreground underline decoration-dotted">
                        {new URL(company.company_url).hostname || company.company_url}
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
                          />
                          <Input
                            value={editForm.entity_type}
                            onChange={(e) => setEditForm({ ...editForm, entity_type: e.target.value })}
                            className="w-[120px] h-12"
                            placeholder="구분"
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

                      {!isEditing && selectedCompany.company_url && (
                        <div className="flex items-center gap-2 text-sm text-blue-500">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <a href={selectedCompany.company_url} target="_blank" rel="noreferrer" className="hover:underline">
                            {selectedCompany.company_url}
                          </a>
                        </div>
                      ) || isEditing && (
                        <Input
                          placeholder="https://example.com"
                          value={editForm.company_url}
                          onChange={(e) => setEditForm({ ...editForm, company_url: e.target.value })}
                          className="max-w-md"
                        />
                      )}
                    </div>

                    {/* Industry Selector Tabs */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedCompany.industries?.map((ci: any) => (
                        <button
                          key={ci.industry_id}
                          onClick={() => {
                            const industrySpecific = selectedCompany.industries.find(
                              (i: any) => i.industry_id === ci.industry_id
                            ) || {};
                            setEditForm({
                              ...editForm,
                              active_industry_id: ci.industry_id,
                              recent_status: industrySpecific.recent_status || '',
                              recent_keywords: industrySpecific.recent_keywords?.join(', ') || '',
                            });
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${editForm.active_industry_id === ci.industry_id
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-600/20"
                              : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                            }`}
                        >
                          {ci.industry?.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {!isEditing ? (
                      <Button variant="outline" size="lg" className="h-11 px-6 shadow-sm" onClick={handleEditClick}>
                        <Edit2 className="w-4 h-4 mr-2" /> 수정하기
                      </Button>
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
                    Business Outline
                  </h3>
                  {isEditing ? (
                    <Textarea
                      value={editForm.business_summary}
                      onChange={(e) => setEditForm({ ...editForm, business_summary: e.target.value })}
                      rows={6}
                      className="text-base leading-relaxed bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border-slate-200 dark:border-slate-800"
                      placeholder="조직의 비즈니스 모델 및 핵심 가치에 대해 설명하세요."
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
                    Company Profile
                  </h3>
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">설립연도</Label>
                        <Input
                          value={editForm.founded_year}
                          onChange={(e) => setEditForm({ ...editForm, founded_year: e.target.value })}
                          placeholder="예: 2010"
                          className="h-11 bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">대표자명</Label>
                        <Input
                          value={editForm.ceo_name}
                          onChange={(e) => setEditForm({ ...editForm, ceo_name: e.target.value })}
                          className="h-11 bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">본사 소재지</Label>
                        <Input
                          value={editForm.hq_location}
                          onChange={(e) => setEditForm({ ...editForm, hq_location: e.target.value })}
                          placeholder="예: 서울특별시 강남구"
                          className="h-11 bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">주요 레퍼런스 (쉼표로 구분)</Label>
                        <Input
                          value={editForm.key_references}
                          onChange={(e) => setEditForm({ ...editForm, key_references: e.target.value })}
                          className="h-11 bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">별칭 (쉼표로 구분)</Label>
                        <Input
                          value={editForm.aliases}
                          onChange={(e) => setEditForm({ ...editForm, aliases: e.target.value })}
                          placeholder="예: 현대, 현대차"
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
                    Strategic Positioning
                  </h3>
                  {isEditing ? (
                    <div className="grid grid-cols-1 gap-6 p-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">핵심 제품 및 서비스</Label>
                        <Input
                          value={editForm.kw_products}
                          onChange={(e) => setEditForm({ ...editForm, kw_products: e.target.value })}
                          placeholder="예: LED 조명, 산업용 조명"
                          className="bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">핵심 기술 (Tech)</Label>
                        <Input
                          value={editForm.kw_technology}
                          onChange={(e) => setEditForm({ ...editForm, kw_technology: e.target.value })}
                          className="bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">타겟 시장 (Market)</Label>
                        <Input
                          value={editForm.kw_target_market}
                          onChange={(e) => setEditForm({ ...editForm, kw_target_market: e.target.value })}
                          className="bg-white dark:bg-slate-950"
                        />
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <Label className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          [{selectedCompany.industries.find((ci: any) => ci.industry_id === editForm.active_industry_id)?.industry?.name}] 특화 키워드
                        </Label>
                        <Input
                          value={editForm.recent_keywords}
                          onChange={(e) => setEditForm({ ...editForm, recent_keywords: e.target.value })}
                          className="bg-blue-50/30 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/40"
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
                            {(() => {
                              const currentInd = selectedCompany.industries.find(
                                (ci: any) => ci.industry_id === editForm.active_industry_id
                              );
                              if (!currentInd?.recent_keywords?.length) return null;

                              return (
                                <div className="p-6 border border-blue-100 dark:border-blue-900/30 rounded-2xl bg-blue-50/30 dark:bg-blue-900/10">
                                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    분야별 전략 키워드 ({currentInd.industry?.name})
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {currentInd.recent_keywords.map((rk: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs font-bold bg-white text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 px-3 py-1 shadow-sm">
                                        {rk}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </section>

                {/* 4. Industry Insights */}
                <section>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    Industry Insights
                  </h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1 text-blue-600 dark:text-blue-400 font-bold text-sm uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4" />
                        [{selectedCompany.industries.find((ci: any) => ci.industry_id === editForm.active_industry_id)?.industry?.name}] 컨텍스트 편집
                      </div>
                      <Textarea
                        value={editForm.recent_status}
                        onChange={(e) => setEditForm({ ...editForm, recent_status: e.target.value })}
                        rows={5}
                        className="text-base leading-relaxed bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border-slate-200 dark:border-slate-800"
                        placeholder="해당 산업군 내 조직의 전략적 위치나 최근 동향을 입력하세요."
                      />
                    </div>
                  ) : (
                    <div className="relative p-8 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/5 border border-blue-100 dark:border-blue-900/30 rounded-2xl overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                      <div className="flex items-center gap-2 text-xs font-bold mb-4 text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">
                        <TrendingUp className="w-4 h-4" />
                        [{selectedCompany.industries.find((ci: any) => ci.industry_id === editForm.active_industry_id)?.industry?.name}] 전략 및 동향
                      </div>
                      <div className="text-base leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                        <ExpandableText text={
                          selectedCompany.industries.find((ci: any) => ci.industry_id === editForm.active_industry_id)?.recent_status
                        } />
                      </div>
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
