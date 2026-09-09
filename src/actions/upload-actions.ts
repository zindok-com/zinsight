'use server';

import { put, list, del, copy } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Helper to calculate file content hash and return a hashed pathname (Legacy)
async function getHashedPathname(file: File, folder: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const extension = file.name.split('.').pop() || 'png';
    return `${folder}/${hash}.${extension}`;
}

// B-1: Helper to calculate slugified pathname and prevent duplication
async function getSlugifiedPathname(file: File, folder: string): Promise<string> {
    const originalName = file.name;
    const lastDotIdx = originalName.lastIndexOf('.');
    const baseName = lastDotIdx === -1 ? originalName : originalName.slice(0, lastDotIdx);
    const extension = lastDotIdx === -1 ? '' : originalName.slice(lastDotIdx);
    
    // Convert to English slug
    let slug = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) slug = 'image';

    let pathname = `${folder}/${slug}${extension}`;
    
    // Check duplicates by fetching existing blobs in the folder
    try {
        const { blobs } = await list({ prefix: `${folder}/` });
        const existingPaths = new Set(blobs.map(b => b.pathname));
        
        let counter = 2;
        while (existingPaths.has(pathname)) {
            pathname = `${folder}/${slug}-${counter}${extension}`;
            counter++;
        }
    } catch (e) {
        console.error('Failed to list blobs for deduplication:', e);
    }
    
    return pathname;
}

export async function uploadThumbnail(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided');
    }

    try {
        const pathname = await getSlugifiedPathname(file, 'magazine/thumbnails');
        const blob = await put(pathname, file, {
            access: 'public',
            addRandomSuffix: false, // B-1: Do not add random suffix
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
        const pathname = await getSlugifiedPathname(file, 'magazine/uploads');
        const blob = await put(pathname, file, {
            access: 'public',
            addRandomSuffix: false, // B-1: Do not add random suffix
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
        const [posts, authors] = await Promise.all([
            prisma.magazinePost.findMany({
                where: { deletedAt: null },
                select: {
                    thumbnailUrl: true,
                    content: true,
                },
            }),
            prisma.author.findMany({
                select: {
                    avatarUrl: true,
                },
            }),
        ]);

        const usedUrls = new Set<string>();

        // 1. Collect from posts (thumbnails & content)
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

        // 2. Collect from authors (profile avatar URLs)
        for (const author of authors) {
            if (author.avatarUrl) {
                usedUrls.add(author.avatarUrl);
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

// B-3: Rename a blob and replace all its references in the database
export async function renameBlobTransaction(oldUrl: string, oldPathname: string, newFileName: string) {
    if (!oldUrl || !oldPathname || !newFileName) {
        return { success: false, error: '잘못된 요청입니다.' };
    }

    try {
        // 1. Slugify new file name and check duplication
        const folder = oldPathname.substring(0, oldPathname.lastIndexOf('/')) || 'magazine/uploads';
        const lastDotIdx = newFileName.lastIndexOf('.');
        const baseName = lastDotIdx === -1 ? newFileName : newFileName.slice(0, lastDotIdx);
        const oldExtension = oldPathname.substring(oldPathname.lastIndexOf('.'));
        const extension = lastDotIdx === -1 ? oldExtension : newFileName.slice(lastDotIdx);
        
        let slug = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!slug) slug = 'image';

        let newPathname = `${folder}/${slug}${extension}`;

        if (newPathname === oldPathname) {
            return { success: false, error: '새 파일명이 기존 파일명과 같습니다.' };
        }
        
        const { blobs } = await list({ prefix: `${folder}/` });
        const existingPaths = new Set(blobs.map(b => b.pathname));
        
        let counter = 2;
        while (existingPaths.has(newPathname)) {
            newPathname = `${folder}/${slug}-${counter}${extension}`;
            counter++;
        }

        // 2. Copy blob to new pathname
        const newBlob = await copy(oldUrl, newPathname, { access: 'public', addRandomSuffix: false });
        const newUrl = newBlob.url;

        // 3. Delete old blob
        await del(oldUrl);

        // 4. Prisma replacement
        const postsToUpdate = await prisma.magazinePost.findMany({
            where: {
                OR: [
                    { thumbnailUrl: { contains: oldUrl } },
                    { content: { contains: oldUrl } }
                ]
            },
            select: { id: true, thumbnailUrl: true, content: true }
        });

        if (postsToUpdate.length > 0) {
            await prisma.$transaction(
                postsToUpdate.map(post => {
                    const newThumbnailUrl = post.thumbnailUrl?.replace(oldUrl, newUrl) || post.thumbnailUrl;
                    const newContent = post.content?.split(oldUrl).join(newUrl) || post.content;
                    return prisma.magazinePost.update({
                        where: { id: post.id },
                        data: {
                            thumbnailUrl: newThumbnailUrl,
                            content: newContent
                        }
                    });
                })
            );
        }
        
        revalidatePath('/admin/storage');
        revalidatePath('/admin/magazine');

        return { success: true, newUrl, affectedPosts: postsToUpdate.length };
    } catch (error: any) {
        console.error('Failed to rename blob:', error);
        return { success: false, error: error.message || '파일 이름 변경 중 오류가 발생했습니다.' };
    }
}


