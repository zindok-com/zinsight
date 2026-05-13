'use server';

import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

export async function uploadThumbnail(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided');
    }

    try {
        const blob = await put(`magazine/thumbnails/${Date.now()}-${file.name}`, file, {
            access: 'public',
        });

        return { url: blob.url };
    } catch (error: any) {
        console.error('Upload failed:', error);
        throw new Error('Failed to upload image');
    }
}
