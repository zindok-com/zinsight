'use client';

import { getMediaUploadUrl, type UploadFolder } from '@/actions/upload';
import { UPLOAD_SIZE_LIMIT, formatBytes, getFileExtension } from '@/lib/storage-media';

const EXT_CONTENT_TYPE: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    m4v: 'video/x-m4v',
    webm: 'video/webm',
    mov: 'video/quicktime',
    ogg: 'video/ogg',
    pdf: 'application/pdf',
    ai: 'application/postscript',
    eps: 'application/postscript',
};

/** 보관함 업로드 대상 폴더: 영상은 videos/, PDF·AI 등은 attachments/, 나머지 이미지는 images/ */
export function folderForFile(file: File): UploadFolder | null {
    const ext = getFileExtension(file.name);
    if (file.type.startsWith('video/') || ['mp4', 'm4v', 'webm', 'mov', 'ogg'].includes(ext)) return 'videos';
    if (file.type.startsWith('image/')) return 'images';
    if (['pdf', 'ai', 'eps'].includes(ext)) return 'attachments';
    return null;
}

/**
 * Presigned URL로 NCP 버킷에 직접 업로드. 진행률 콜백(0~100) 지원.
 * 용량 상한은 서버(getMediaUploadUrl)에서도 다시 확인한다.
 */
export async function uploadToStorage(
    file: File,
    folder: UploadFolder,
    onProgress?: (percent: number) => void
): Promise<string> {
    if (file.size > UPLOAD_SIZE_LIMIT[folder]) {
        throw new Error(`${file.name}: 최대 ${formatBytes(UPLOAD_SIZE_LIMIT[folder])}까지 올릴 수 있습니다.`);
    }
    const contentType = file.type || EXT_CONTENT_TYPE[getFileExtension(file.name)] || 'application/octet-stream';
    const { uploadUrl, fileUrl } = await getMediaUploadUrl(file.name, contentType, folder, undefined, file.size);

    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.setRequestHeader('x-amz-acl', 'public-read');
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
                ? resolve()
                : reject(new Error(`스토리지 업로드 실패 (HTTP ${xhr.status})`));
        xhr.onerror = () => reject(new Error('네트워크 오류로 업로드에 실패했습니다.'));
        xhr.send(file);
    });

    return fileUrl;
}
