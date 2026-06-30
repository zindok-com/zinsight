'use server';

import { put, list, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Helper to calculate file content hash and return a hashed pathname
async function getHashedPathname(file: File, folder: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const extension = file.name.split('.').pop() || 'png';
    return `${folder}/${hash}.${extension}`;
}

export async function uploadThumbnail(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided');
    }

    try {
        const pathname = await getHashedPathname(file, 'magazine/thumbnails');
        const blob = await put(pathname, file, {
            access: 'public',
        });

        return { url: blob.url };
    } catch (error: any) {
        console.error('Upload failed:', error);
        throw new Error('Failed to upload image');
    }
}

// List all blobs from the storage
export async function listAllBlobs() {
    try {
        const { blobs } = await list();
        return { success: true, blobs };
    } catch (error: any) {
        console.error('Failed to list blobs:', error);
        return { success: false, error: error.message || 'Failed to list storage files' };
    }
}

// Delete a blob by URL
export async function deleteBlob(url: string) {
    try {
        await del(url);
        revalidatePath('/admin/storage');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete blob:', error);
        return { success: false, error: error.message || 'Failed to delete file' };
    }
}

// Direct image upload for storage management
export async function uploadImageDirect(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    try {
        const pathname = await getHashedPathname(file, 'magazine/uploads');
        const blob = await put(pathname, file, {
            access: 'public',
        });
        revalidatePath('/admin/storage');
        return { success: true, url: blob.url };
    } catch (error: any) {
        console.error('Upload failed:', error);
        return { success: false, error: error.message || 'Failed to upload image' };
    }
}

// Get all image URLs currently used in magazine posts
export async function getUsedImageUrls() {
    try {
        const posts = await prisma.magazinePost.findMany({
            where: { deletedAt: null },
            select: {
                thumbnailUrl: true,
                content: true,
            },
        });

        const usedUrls = new Set<string>();

        for (const post of posts) {
            if (post.thumbnailUrl) {
                usedUrls.add(post.thumbnailUrl);
            }
            if (post.content) {
                // Find Vercel Blob URLs in text content
                const urls = post.content.match(
                    /https?:\/\/[^\s"'`<>)]+\.public\.blob\.vercel-storage\.com[^\s"'`<>)]*/g
                );
                if (urls) {
                    for (const url of urls) {
                        // Clean up trailing characters
                        const cleaned = url.replace(/[).,]*$/, '');
                        usedUrls.add(cleaned);
                    }
                }
            }
        }

        return { success: true, urls: Array.from(usedUrls) };
    } catch (error: any) {
        console.error('Failed to find used image URLs:', error);
        return { success: false, urls: [] };
    }
}

// Delete multiple blobs by URLs
export async function deleteMultipleBlobs(urls: string[]) {
    try {
        if (urls.length === 0) {
            return { success: true };
        }
        await del(urls);
        revalidatePath('/admin/storage');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete multiple blobs:', error);
        return { success: false, error: error.message || 'Failed to delete files' };
    }
}


