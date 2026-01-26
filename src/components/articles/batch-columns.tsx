'use client';

import { ColumnDef } from "@tanstack/react-table";
import { CollectionBatch } from "@/lib/batch-utils";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const batchColumns: ColumnDef<CollectionBatch>[] = [
    {
        accessorKey: "collectedAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    수집 시각
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const dateStr = row.getValue("collectedAt") as string;
            try {
                const date = new Date(dateStr);
                return (
                    <div className="font-medium">
                        {date.toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </div>
                );
            } catch {
                return <span>{dateStr}</span>;
            }
        },
    },
    {
        accessorKey: "sourceQuery",
        header: "검색어",
        cell: ({ row }) => {
            const query = row.getValue("sourceQuery") as string;
            return <span className="font-medium">{query}</span>;
        },
    },
    {
        accessorKey: "articleCount",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    아티클 수
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const count = row.getValue("articleCount") as number;
            return (
                <Badge variant="secondary" className="font-semibold">
                    {count}개
                </Badge>
            );
        },
    },
    {
        accessorKey: "sourceType",
        header: "출처",
        cell: ({ row }) => {
            const source = row.getValue("sourceType") as string;
            return <Badge variant="outline">{source}</Badge>;
        },
    },
    {
        id: "actions",
        header: "작업",
        cell: ({ row }) => {
            const batch = row.original;
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Row click will handle navigation
                    }}
                >
                    <Eye className="h-4 w-4 mr-1" />
                    보기
                </Button>
            );
        },
    },
];
