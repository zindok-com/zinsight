'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  
  if (!text) return <span>정보 없음</span>;

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

export function CompanyListTable({ companies }: { companies: any[] }) {
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  const parseKeywords = (keywordsStr: any) => {
    if (!keywordsStr) return null;
    try {
      if (typeof keywordsStr === 'string') {
        return JSON.parse(keywordsStr);
      }
      return keywordsStr;
    } catch {
      return null;
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>회사명</TableHead>
              <TableHead>산업군</TableHead>
              <TableHead>홈페이지 URL</TableHead>
              <TableHead>연관 기사수</TableHead>
              <TableHead>간략 요약</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow
                key={company.id}
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setSelectedCompany(company)}
              >
                <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                  {company.company_name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{company.industry?.name || '알 수 없음'}</Badge>
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
                <TableCell className="max-w-xs truncate" title={company.business_summary || ''}>
                  {company.business_summary || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedCompany && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-2xl">{selectedCompany.company_name}</SheetTitle>
                  <Badge variant="secondary">{selectedCompany.industry?.name}</Badge>
                </div>
                {selectedCompany.company_url && (
                  <SheetDescription>
                    <a
                      href={selectedCompany.company_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline inline-flex items-center gap-1"
                    >
                      {selectedCompany.company_url}
                    </a>
                  </SheetDescription>
                )}
              </SheetHeader>

              <div className="space-y-8">
                {/* 1. 비즈니스 요약 */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    비즈니스 요약
                  </h3>
                  <div className="text-sm leading-relaxed p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <ExpandableText text={selectedCompany.business_summary} />
                  </div>
                </section>

                {/* 2. 핵심 키워드 */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    핵심 키워드
                  </h3>
                  <div className="space-y-4">
                    {(() => {
                      const kw = parseKeywords(selectedCompany.core_keywords);
                      if (!kw) return <div className="text-sm text-muted-foreground">정보 없음</div>;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {kw.products && kw.products.length > 0 && (
                            <div className="p-4 border rounded-lg">
                              <h4 className="text-xs font-semibold mb-2">주요 제품</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {kw.products.map((p: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {kw.technology && kw.technology.length > 0 && (
                            <div className="p-4 border rounded-lg">
                              <h4 className="text-xs font-semibold mb-2">핵심 기술</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {kw.technology.map((t: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs font-normal bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {kw.target_market && kw.target_market.length > 0 && (
                            <div className="p-4 border rounded-lg md:col-span-2">
                              <h4 className="text-xs font-semibold mb-2">타겟 시장</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {kw.target_market.map((m: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs font-normal bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                                    {m}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </section>

                {/* 3. 최근 동향 */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    최근 동향
                  </h3>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <ExpandableText text={selectedCompany.recent_status} />
                  </div>
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
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
