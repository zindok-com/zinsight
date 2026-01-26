'use client';

import { ColumnDef } from "@tanstack/react-table";
import { CompanyNews } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const articleColumns: ColumnDef<CompanyNews>[] = [
    {
        accessorKey: "title",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    제목
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const title = row.getValue("title") as string;
            return (
                <div className="flex items-center gap-2">
                    <span className="font-medium line-clamp-2 max-w-md">{title}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "publication_date",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    발행일
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = row.getValue("publication_date") as string;
            // Format date to be more readable
            try {
                const d = new Date(date);
                return <span className="text-sm">{d.toLocaleDateString('ko-KR')}</span>;
            } catch {
                return <span className="text-sm">{date}</span>;
            }
        },
    },
    {
        accessorKey: "source_type",
        header: "출처",
        cell: ({ row }) => {
            const source = row.getValue("source_type") as string;
            return <Badge variant="outline">{source}</Badge>;
        },
    },
    {
        accessorKey: "source_query",
        header: "검색어",
        cell: ({ row }) => {
            const query = row.getValue("source_query") as string;
            return <span className="text-sm text-muted-foreground">{query}</span>;
        },
    },
    {
        id: "actions",
        header: "링크",
        cell: ({ row }) => {
            const article = row.original;
            return (
                <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink className="h-4 w-4" />
                </a>
            );
        },
    },
];
