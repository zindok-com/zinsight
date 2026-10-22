'use server';

import { requireAdmin } from '@/lib/admin-auth';
import {
    PutObjectCommand,
    ListObjectsV2Command,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import {
    s3Client,
    NCP_STORAGE_BUCKET,
    getPublicFileUrl,
    extractKeyFromUrl,
} from '@/lib/storage';

export interface StorageBlobItem {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
}

// 공개 스토리지에 올라가므로 이미지 형식만 허용 (HTML 등 임의 파일 업로드 방지)
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function validateImageFile(file: unknown): string | null {
    if (!(file instanceof File) || file.size === 0) return '파일이 없습니다.';
    const dot = file.name.lastIndexOf('.');
    const ext = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.has(ext) || !file.type.startsWith('image/')) {
        return '이미지 파일(png, jpg, gif, webp, avif, svg)만 업로드할 수 있습니다.';
    }
    if (file.size > MAX_IMAGE_BYTES) return '이미지는 10MB 이하만 업로드할 수 있습니다.';
    return null;
}

async function listObjectsByPrefix(prefix?: string): Promise<StorageBlobItem[]> {
    const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
    const items: StorageBlobItem[] = [];
    let continuationToken: string | undefined = undefined;

    do {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
        });
        const response = await s3Client.send(command);
        for (const obj of response.Contents ?? []) {
            if (!obj.Key || obj.Key.endsWith('/')) continue;
            items.push({
                url: getPublicFileUrl(obj.Key),
                pathname: obj.Key,
                size: obj.Size ?? 0,
                uploadedAt: obj.LastModified ?? new Date(),
            });
        }
        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return items;
}

// B-1: Helper to calculate slugified pathname and prevent duplication
async function getSlugifiedPathname(file: File, folder: string): Promise<string> {
    const originalName = file.name;
    const lastDotIdx = originalName.lastIndexOf('.');
    const baseName = lastDotIdx === -1 ? originalName : originalName.slice(0, lastDotIdx);
    const extension = lastDotIdx === -1 ? '' : originalName.slice(lastDotIdx).toLowerCase();

    // Convert to English slug
    let slug = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) slug = 'image';

    let pathname = `${folder}/${slug}${extension}`;

    // Check duplicates by fetching existing objects in the folder
    try {
        const blobs = await listObjectsByPrefix(`${folder}/`);
        const existingPaths = new Set(blobs.map((b) => b.pathname));

        let counter = 2;
        while (existingPaths.has(pathname)) {
            pathname = `${folder}/${slug}-${counter}${extension}`;
            counter++;
        }
    } catch (e) {
        console.error('Failed to list storage objects for deduplication:', e);
    }

    return pathname;
}

export async function uploadThumbnail(formData: FormData) {
    await requireAdmin();
    const file = formData.get('file') as File;
    const invalid = validateImageFile(file);
    if (invalid) {
        throw new Error(invalid);
    }

    try {
        const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
        const pathname = await getSlugifiedPathname(file, 'thumbnails');
        const buffer = Buffer.from(await file.arrayBuffer());

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: pathname,
                Body: buffer,
                ContentType: file.type || 'application/octet-stream',
                ACL: 'public-read',
            })
        );

        return { url: getPublicFileUrl(pathname) };
    } catch (error: any) {
        console.error('Upload failed:', error);
        throw new Error('Failed to upload image');
    }
}

// List all blobs from NCP Object Storage
export async function listAllBlobs() {
    await requireAdmin();
    try {
        const blobs = await listObjectsByPrefix();
        return { success: true, blobs };
    } catch (error: any) {
        console.error('Failed to list blobs:', error);
        return { success: false, error: error.message || 'Failed to list storage files' };
    }
}

// Delete a blob by URL
export async function deleteBlob(url: string) {
    await requireAdmin();
    try {
        const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
        const key = extractKeyFromUrl(url);
        if (!key) {
            return { success: false, error: '유효하지 않은 스토리지 URL입니다.' };
        }
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );
        revalidatePath('/admin/storage');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete blob:', error);
        return { success: false, error: error.message || 'Failed to delete file' };
    }
}

// Direct image upload for storage management (Server Action fallback)
export async function uploadImageDirect(formData: FormData) {
    await requireAdmin();
    const file = formData.get('file') as File;
    const invalid = validateImageFile(file);
    if (invalid) {
        return { success: false, error: invalid };
    }

    try {
        const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
        const pathname = await getSlugifiedPathname(file, 'images');
        const buffer = Buffer.from(await file.arrayBuffer());

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: pathname,
                Body: buffer,
                ContentType: file.type || 'application/octet-stream',
                ACL: 'public-read',
            })
        );
        revalidatePath('/admin/storage');
        return { success: true, url: getPublicFileUrl(pathname) };
    } catch (error: any) {
        console.error('Upload failed:', error);
        return { success: false, error: error.message || 'Failed to upload image' };
    }
}

// Get all image URLs currently used in magazine posts
export async function getUsedImageUrls() {
    await requireAdmin();
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
                // Find NCP Object Storage or Vercel Blob URLs in text content
                const urls = post.content.match(
                    /https?:\/\/[^\s"'`<>)]+(?:ncloudstorage\.com|\.public\.blob\.vercel-storage\.com)[^\s"'`<>)]*/g
                );
                if (urls) {
                    for (const url of urls) {
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
    await requireAdmin();
    try {
        if (urls.length === 0) {
            return { success: true };
        }
        const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
        const keys = urls
            .map((u) => extractKeyFromUrl(u))
            .filter((k): k is string => Boolean(k));

        if (keys.length > 0) {
            await s3Client.send(
                new DeleteObjectsCommand({
                    Bucket: bucket,
                    Delete: {
                        Objects: keys.map((Key) => ({ Key })),
                        Quiet: true,
                    },
                })
            );
        }
        revalidatePath('/admin/storage');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete multiple blobs:', error);
        return { success: false, error: error.message || 'Failed to delete files' };
    }
}

// B-3: Rename a blob and replace all its references in the database
export async function renameBlobTransaction(oldUrl: string, oldPathname: string, newFileName: string) {
    await requireAdmin();
    if (!oldUrl || !oldPathname || !newFileName) {
        return { success: false, error: '잘못된 요청입니다.' };
    }

    try {
        const bucket = process.env.NCP_STORAGE_BUCKET || NCP_STORAGE_BUCKET;
        // 1. Slugify new file name and check duplication
        const folder = oldPathname.includes('/')
            ? oldPathname.substring(0, oldPathname.lastIndexOf('/'))
            : 'images';
        const lastDotIdx = newFileName.lastIndexOf('.');
        const baseName = lastDotIdx === -1 ? newFileName : newFileName.slice(0, lastDotIdx);
        const oldExtension = oldPathname.includes('.')
            ? oldPathname.substring(oldPathname.lastIndexOf('.'))
            : '.png';
        const extension = lastDotIdx === -1 ? oldExtension : newFileName.slice(lastDotIdx);

        let slug = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!slug) slug = 'image';

        let newPathname = `${folder}/${slug}${extension}`;

        if (newPathname === oldPathname) {
            return { success: false, error: '새 파일명이 기존 파일명과 같습니다.' };
        }

        const blobs = await listObjectsByPrefix(`${folder}/`);
        const existingPaths = new Set(blobs.map((b) => b.pathname));

        let counter = 2;
        while (existingPaths.has(newPathname)) {
            newPathname = `${folder}/${slug}-${counter}${extension}`;
            counter++;
        }

        // 2. Copy object to new key in NCP S3
        const copySource = `${bucket}/${encodeURI(oldPathname)}`;
        await s3Client.send(
            new CopyObjectCommand({
                Bucket: bucket,
                CopySource: copySource,
                Key: newPathname,
                ACL: 'public-read',
            })
        );
        const newUrl = getPublicFileUrl(newPathname);

        // 3. Delete old object
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: oldPathname,
            })
        );

        // 4. Prisma replacement
        const postsToUpdate = await prisma.magazinePost.findMany({
            where: {
                OR: [
                    { thumbnailUrl: { contains: oldUrl } },
                    { content: { contains: oldUrl } },
                ],
            },
            select: { id: true, thumbnailUrl: true, content: true },
        });

        if (postsToUpdate.length > 0) {
            await prisma.$transaction(
                postsToUpdate.map((post) => {
                    const newThumbnailUrl = post.thumbnailUrl?.replace(oldUrl, newUrl) || post.thumbnailUrl;
                    const newContent = post.content?.split(oldUrl).join(newUrl) || post.content;
                    return prisma.magazinePost.update({
                        where: { id: post.id },
                        data: {
                            thumbnailUrl: newThumbnailUrl,
                            content: newContent,
                        },
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
