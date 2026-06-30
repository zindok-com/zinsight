'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Link2 } from 'lucide-react';

interface LinkInsertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (text: string, url: string) => void;
}

export function LinkInsertModal({ isOpen, onClose, onInsert }: LinkInsertModalProps) {
    const [linkText, setLinkText] = useState('');
    const [url, setUrl] = useState('');

    // Reset inputs on open
    useEffect(() => {
        if (isOpen) {
            setLinkText('');
            setUrl('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkText.trim() || !url.trim()) return;

        let cleanUrl = url.trim();
        // Auto prepending protocol if missing
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/')) {
            cleanUrl = 'https://' + cleanUrl;
        }

        onInsert(linkText.trim(), cleanUrl);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 p-6 flex flex-col gap-5 z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Link2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-base">텍스트 링크 삽입</h3>
                            <p className="text-xs text-slate-400">선택한 텍스트에 하이퍼링크 백링크를 설정합니다.</p>
                        </div>
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose} 
                        className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-50"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="modal-link-text" className="text-xs font-bold text-slate-600">표시할 텍스트</Label>
                        <Input
                            id="modal-link-text"
                            placeholder="예: 지인독 공식 홈페이지"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            required
                            autoFocus
                            className="bg-slate-50 border-slate-200 text-sm h-10 focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="modal-url" className="text-xs font-bold text-slate-600">연결할 URL 주소</Label>
                        <Input
                            id="modal-url"
                            placeholder="예: https://zindok.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            className="bg-slate-50 border-slate-200 text-sm h-10 focus-visible:ring-indigo-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-9 px-4 text-xs font-semibold bg-white text-slate-700 border-slate-200"
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={!linkText.trim() || !url.trim()}
                            className="h-9 px-5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        >
                            링크 삽입
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
