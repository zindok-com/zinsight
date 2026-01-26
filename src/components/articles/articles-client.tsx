'use client';

import { CompanyNews } from "@/types";
import { ArticlesTable } from "./articles-table";
import { articleColumns } from "./article-columns";
import { ArticleDetailDrawer } from "./article-detail-drawer";
import { useState } from "react";

interface ArticlesClientProps {
    news: CompanyNews[];
}

export function ArticlesClient({ news }: ArticlesClientProps) {
    const [selectedArticle, setSelectedArticle] = useState<CompanyNews | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleRowClick = (article: CompanyNews) => {
        setSelectedArticle(article);
        setDrawerOpen(true);
    };

    return (
        <>
            <ArticlesTable
                columns={articleColumns}
                data={news}
                onRowClick={handleRowClick}
            />
            <ArticleDetailDrawer
                article={selectedArticle}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
            />
        </>
    );
}
