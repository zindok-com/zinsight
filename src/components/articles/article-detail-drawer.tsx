'use client';

import { CompanyNews } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Code } from "lucide-react";
import { useState } from "react";

interface ArticleDetailDrawerProps {
    article: CompanyNews | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ArticleDetailDrawer({ article, open, onOpenChange }: ArticleDetailDrawerProps) {
    const [showRawJson, setShowRawJson] = useState(false);

    if (!article) return null;

    // Format date
    let formattedDate = article.publication_date;
    try {
        const d = new Date(article.publication_date);
        formattedDate = d.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        // Keep original if parsing fails
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-lg leading-tight pr-8">
                        {article.title}
                    </SheetTitle>
                    <SheetDescription>
                        아티클 상세 정보
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 py-4">
                    {/* 메타 정보 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{article.source_type}</Badge>
                            <span className="text-sm text-muted-foreground">{formattedDate}</span>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">검색어:</span>{' '}
                            <span className="text-muted-foreground">{article.source_query}</span>
                        </div>
                        {article.company_id && article.company_id !== 'UNKNOWN' && (
                            <div className="text-sm">
                                <span className="font-medium">연결된 기업:</span>{' '}
                                <span className="text-muted-foreground">{article.company_id}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t my-4" />

                    {/* 요약 내용 */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm">요약</h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {article.summary}
                        </p>
                    </div>

                    <div className="border-t my-4" />

                    {/* 외부 링크 */}
                    <div>
                        <Button
                            variant="outline"
                            className="w-full"
                            asChild
                        >
                            <a
                                href={article.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                원문 보기
                            </a>
                        </Button>
                    </div>

                    <div className="border-t my-4" />

                    {/* Raw JSON 토글 */}
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRawJson(!showRawJson)}
                            className="w-full justify-start"
                        >
                            <Code className="mr-2 h-4 w-4" />
                            {showRawJson ? 'Raw JSON 숨기기' : 'Raw JSON 보기'}
                        </Button>

                        {showRawJson && (
                            <div className="rounded-md border">
                                <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto text-xs whitespace-pre-wrap max-h-96">
                                    {JSON.stringify(article, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
