import { getEntities } from "@/actions/entity-actions";
import { EntitiesClient } from "@/components/entities/entities-client";

export const dynamic = 'force-dynamic';

export default async function EntitiesPage() {
    const data = await getEntities();

    return <EntitiesClient initialData={data} />;
}
