'use client';

import { useState } from "react";
import { Company } from "@/types";
import { DataTable } from "@/components/entities/data-table";
import { columns } from "@/components/entities/columns";
import { EntityDrawer } from "@/components/entities/entity-drawer";
import { useRouter } from "next/navigation";

interface EntitiesClientProps {
    initialData: Company[];
}

export function EntitiesClient({ initialData }: EntitiesClientProps) {
    const [selectedEntity, setSelectedEntity] = useState<Company | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const router = useRouter();

    const handleRowClick = (entity: Company) => {
        setSelectedEntity(entity);
        setDrawerOpen(true);
    };

    const handleSaved = () => {
        router.refresh(); // Refresh server data
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Entities</h1>
            </div>

            <DataTable
                columns={columns}
                data={initialData}
                // We need to modify DataTable to accept onRowClick
                // For now, let's assume valid implementation or modify DataTable next
                onRowClick={handleRowClick}
            />

            <EntityDrawer
                entity={selectedEntity}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onSaved={handleSaved}
            />
        </div>
    );
}
