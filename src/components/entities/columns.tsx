'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Company } from "@/types";
import { Badge } from "@/components/ui/badge"; // I need to create Badge too
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"; // Need Checkbox

export const columns: ColumnDef<Company>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "normalized_name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Company Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue("normalized_name")}</div>,
    },
    {
        accessorKey: "review_status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("review_status") as string;
            let color = "bg-slate-500";
            if (status === 'NEEDS_REVIEW') color = "bg-orange-500";
            if (status === 'HUMAN_CONFIRMED') color = "bg-green-600";
            if (status === 'AUTO_CONFIRMED') color = "bg-green-400";
            if (status === 'REJECTED') color = "bg-red-500";

            return <Badge className={color}>{status}</Badge>
        }
    },
    {
        accessorKey: "fit_score",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const score = parseFloat(row.getValue("fit_score"));
            return <div className="text-right font-medium">{score.toFixed(1)}</div>
        }
    },
    {
        accessorKey: "primary_category",
        header: "Category",
    },
    {
        accessorKey: "signals",
        header: "Signals",
        cell: ({ row }) => {
            const signals = row.original.signals;
            const activeSignals = [];
            if (signals.product_launch) activeSignals.push("Launch");
            if (signals.manufacturing) activeSignals.push("Mfg");
            if (signals.certification) activeSignals.push("Cert");

            return (
                <div className="flex gap-1 flex-wrap">
                    {activeSignals.map(s => <span key={s} className="text-xs bg-slate-100 px-1 rounded">{s}</span>)}
                </div>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const payment = row.original

            return (
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            )
        },
    },
]
