'use client';

import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, FileCode2, X, Loader2, Download, CheckCircle2, Info } from 'lucide-react';
import { getMediaUploadUrl } from '@/actions/upload';

import { safeHttpUrl } from '@/lib/utils';

interface CompanyLogoUploadProps {
    logoUrl: string;
    logoSourceUrl: string;
    onLogoUrlChange: (url: string) => void;
    onLogoSourceUrlChange: (url: string) => void;
    compact?: boolean;
    /** 공개 기관 등록 폼에서 사용할 때 초대 토큰 (업로드 권한 확인용) */
    inviteToken?: string;
}

const WEB_LOGO_EXTS = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
const SOURCE_FILE_EXTS = ['ai', 'eps', 'pdf', 'svg'];

export function CompanyLogoUpload({
    logoUrl,
    logoSourceUrl,
    onLogoUrlChange,
    onLogoSourceUrlChange,
    compact = false,
    inviteToken,
}: CompanyLogoUploadProps) {
    const logoInputRef = useRef<HTMLInputElement>(null);
    const sourceInputRef = useRef<HTMLInputElement>(null);

    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingSource, setUploadingSource] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleWebLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setErrorMsg(null);

        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (ext === 'ai' || ext === 'eps') {
            setErrorMsg(
                '.ai / .eps 일러스트레이터 원본 파일은 웹 브라우저에서 화면에 직접 출력할 수 없습니다. 우측(하단)의 [인쇄/제작용 원본 파일(.ai, .eps, .pdf)] 칸에 업로드해 주시고, 화면 표시용 로고는 PNG, SVG, JPG, WebP 파일을 선택해 주세요.'
            );
            if (logoInputRef.current) logoInputRef.current.value = '';
            return;
        }

        if (!WEB_LOGO_EXTS.includes(ext)) {
            setErrorMsg('웹 화면 표시용 로고는 PNG, JPG, SVG, WebP 포맷만 업로드할 수 있습니다.');
            if (logoInputRef.current) logoInputRef.current.value = '';
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            setErrorMsg('로고 이미지 크기는 15MB 이하여야 합니다.');
            if (logoInputRef.current) logoInputRef.current.value = '';
            return;
        }

        setUploadingLogo(true);
        try {
            const contentType =
                file.type ||
                (ext === 'svg'
                    ? 'image/svg+xml'
                    : ext === 'png'
                    ? 'image/png'
                    : ext === 'webp'
                    ? 'image/webp'
                    : 'image/jpeg');

            const { uploadUrl, fileUrl } = await getMediaUploadUrl(file.name, contentType, 'logos', inviteToken, file.size);
            const res = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': contentType,
                    'x-amz-acl': 'public-read',
                },
                body: file,
            });

            if (!res.ok) {
                throw new Error(`스토리지 업로드 실패 (HTTP ${res.status})`);
            }

            onLogoUrlChange(fileUrl);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : '로고 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const handleSourceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setErrorMsg(null);

        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!SOURCE_FILE_EXTS.includes(ext)) {
            setErrorMsg('원본 첨부파일은 .ai, .eps, .pdf, .svg 포맷만 지원합니다.');
            if (sourceInputRef.current) sourceInputRef.current.value = '';
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setErrorMsg('원본 파일 크기는 50MB 이하여야 합니다.');
            if (sourceInputRef.current) sourceInputRef.current.value = '';
            return;
        }

        setUploadingSource(true);
        try {
            const contentType =
                file.type ||
                (ext === 'svg'
                    ? 'image/svg+xml'
                    : ext === 'pdf'
                    ? 'application/pdf'
                    : 'application/postscript');

            const { uploadUrl, fileUrl } = await getMediaUploadUrl(file.name, contentType, 'attachments', inviteToken, file.size);
            const res = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': contentType,
                    'x-amz-acl': 'public-read',
                },
                body: file,
            });

            if (!res.ok) {
                throw new Error(`원본 파일 업로드 실패 (HTTP ${res.status})`);
            }

            onLogoSourceUrlChange(fileUrl);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : '원본 파일 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploadingSource(false);
            if (sourceInputRef.current) sourceInputRef.current.value = '';
        }
    };

    const extractFileName = (url: string) => {
        try {
            const parts = url.split('/');
            return decodeURIComponent(parts[parts.length - 1] || '원본파일');
        } catch {
            return '원본파일';
        }
    };

    return (
        <div className="space-y-3">
            <div className={`grid grid-cols-1 ${compact ? 'gap-3' : 'md:grid-cols-2 gap-4'}`}>
                {/* 1. 웹 표시용 로고 (PNG, JPG, SVG, WebP) */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                                웹 화면 표시용 로고 (권장)
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                PNG · SVG · JPG · WebP
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            인사이트 레이더 카드 및 상세 페이지 헤더에 즉시 렌더링되는 웹 표준 이미지입니다.
                        </p>
                    </div>

                    {logoUrl ? (
                        <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={logoUrl}
                                        alt="조직 로고 미리보기"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        로고 등록 완료
                                    </div>
                                    <a
                                        href={logoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-slate-400 hover:text-indigo-600 truncate block max-w-[180px]"
                                    >
                                        {extractFileName(logoUrl)}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => logoInputRef.current?.click()}
                                    disabled={uploadingLogo}
                                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    변경
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onLogoUrlChange('')}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="로고 제거"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-all disabled:opacity-50"
                        >
                            {uploadingLogo ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                    NCP 스토리지 업로드 중...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 text-indigo-500" />
                                    로고 이미지 업로드 (PNG, SVG, JPG, WebP)
                                </>
                            )}
                        </button>
                    )}

                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.svg,.webp"
                        onChange={handleWebLogoSelect}
                        className="hidden"
                    />
                </div>

                {/* 2. 인쇄/디자인 제작용 원본 파일 (.ai, .eps, .pdf, .svg) */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <FileCode2 className="w-3.5 h-3.5 text-amber-600" />
                                인쇄/제작용 원본 첨부 (선택)
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                .AI · .EPS · .PDF · .SVG
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            <code className="font-mono text-amber-700 bg-amber-50 px-1 rounded">.ai</code> (Adobe Illustrator) 파일은 브라우저 직접 렌더링이 불가하므로 제작·보관용 다운로드 원본으로 분리 저장됩니다.
                        </p>
                    </div>

                    {logoSourceUrl ? (
                        <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-[11px] font-extrabold text-amber-700 uppercase">
                                    {(logoSourceUrl.split('.').pop() || 'AI').slice(0, 4)}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-800 truncate max-w-[170px]">
                                        {extractFileName(logoSourceUrl)}
                                    </div>
                                    <a
                                        href={safeHttpUrl(logoSourceUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-medium text-indigo-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                                    >
                                        <Download className="w-3 h-3" />
                                        원본 파일 다운로드
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => sourceInputRef.current?.click()}
                                    disabled={uploadingSource}
                                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    변경
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onLogoSourceUrlChange('')}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="원본 첨부 제거"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => sourceInputRef.current?.click()}
                            disabled={uploadingSource}
                            className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-amber-400 bg-white hover:bg-amber-50/30 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-amber-700 transition-all disabled:opacity-50"
                        >
                            {uploadingSource ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                    원본 파일 업로드 중...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 text-amber-600" />
                                    원본 벡터 파일 첨부 (.AI, .EPS, .PDF)
                                </>
                            )}
                        </button>
                    )}

                    <input
                        ref={sourceInputRef}
                        type="file"
                        accept=".ai,.eps,.pdf,.svg,application/postscript,application/pdf,image/svg+xml"
                        onChange={handleSourceFileSelect}
                        className="hidden"
                    />
                </div>
            </div>

            {errorMsg && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{errorMsg}</span>
                </div>
            )}
        </div>
    );
}
