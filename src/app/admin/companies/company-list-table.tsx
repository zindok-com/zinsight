'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { toggleCompanyFeatured } from '@/actions/company-actions';

function safeGetHostname(url: string | null) {
  if (!url) return '';
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function CompanyListTable({ companies }: { companies: any[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'articleCount'; direction: 'asc' | 'desc' } | null>(null);
  const [isPending, startTransition] = useTransition();

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
        company.aliases?.some((alias: string) => typeof alias === 'string' && alias.toLowerCase().includes(term));

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
        toast.success(res.company.is_featured ? '피처드 조직으로 등록되었습니다.' : '피처드 등록이 해제되었습니다.');
        router.refresh();
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
            placeholder="조직명 또는 요약 키워드 검색..."
            className="pl-9 h-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="h-9 text-sm">
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

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted-foreground font-medium">
          전체 <span className="text-foreground font-bold">{filteredAndSortedCompanies.length}</span>개의 조직이 등록되어 있습니다. (행 클릭 시 상세 관리 페이지로 이동)
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[45px] text-center"></TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors group"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center font-bold text-slate-800 dark:text-slate-200">
                  조직(기업/기관)명
                  {sortConfig?.key === 'name' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[100px]">구분</TableHead>
              <TableHead className="w-[120px]">지역</TableHead>
              <TableHead>홈페이지 URL</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors group w-[120px]"
                onClick={() => handleSort('articleCount')}
              >
                <div className="flex items-center font-bold text-slate-800 dark:text-slate-200">
                  연관 기사수
                  {sortConfig?.key === 'articleCount' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-sm">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedCompanies.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                  onClick={() => router.push(`/admin/companies/${company.id}`)}
                >
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFeatured(company, e)}
                      disabled={isPending}
                      className="p-1 rounded-full hover:bg-muted transition-colors focus:outline-none"
                      title={company.is_featured ? "추천 조직 해제" : "추천 조직으로 지정"}
                    >
                      <Star
                        className={`h-4 w-4 ${company.is_featured ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40 hover:text-amber-400'}`}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 flex items-center gap-1.5">
                      <span>{company.company_name}</span>
                      {company.slug && (
                        <span className="text-[11px] text-muted-foreground font-mono font-normal">
                          (/{company.slug})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {company.entity_type || '기업'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-muted text-muted-foreground border-0 text-xs font-medium">
                      {company.region?.name || '지역 미지정'}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {company.company_url ? (
                      <a
                        href={company.company_url.startsWith('http') ? company.company_url : `https://${company.company_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {safeGetHostname(company.company_url)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {company.company_articles?.length || 0}건
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60 inline-block" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
