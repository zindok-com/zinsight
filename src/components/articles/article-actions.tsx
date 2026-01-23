'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Code } from "lucide-react";
import { CompanyNews } from '@/types';

interface ArticleActionsProps {
    article: CompanyNews;
}

export function ArticleActions({ article }: ArticleActionsProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="View Raw JSON">
                    <Code className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Article Details</DialogTitle>
                    <DialogDescription>
                        Raw JSON data for this article from {article.source_type}.
                    </DialogDescription>
                </DialogHeader>
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto text-xs whitespace-pre-wrap">
                    {JSON.stringify(article, null, 2)}
                </pre>
            </DialogContent>
        </Dialog>
    )
}
