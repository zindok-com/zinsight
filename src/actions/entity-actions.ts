'use server';

import { DataService } from '@/services/data-service';
import { Company } from '@/types';

export async function getEntities() {
    const service = DataService.getInstance();
    return await service.getEntities();
}

export async function updateEntity(entity: Company) {
    const service = DataService.getInstance();
    const entities = await service.getEntities();

    // Find and update
    const index = entities.findIndex(e => e.id === entity.id);
    if (index >= 0) {
        entities[index] = entity;
        await service.saveEntities(entities);
        return { success: true };
    }
    return { success: false, error: 'Entity not found' };
}
