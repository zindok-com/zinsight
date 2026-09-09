'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ImageDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (markdown: string) => void;
    initialUrl?: string;
    initialAlt?: string;
    initialCaption?: string;
}

export function ImageDetailsModal({ isOpen, onClose, onConfirm, initialUrl = '', initialAlt = '', initialCaption = '' }: ImageDetailsModalProps) {
    const [url, setUrl] = useState(initialUrl);
    const [alt, setAlt] = useState(initialAlt);
    const [caption, setCaption] = useState(initialCaption);
    const [isDecorative, setIsDecorative] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setUrl(initialUrl);
            setAlt(initialAlt);
            setCaption(initialCaption);
            setIsDecorative(initialAlt === '');
        }
    }, [isOpen, initialUrl, initialAlt, initialCaption]);

    const handleConfirm = () => {
        const finalAlt = isDecorative ? '' : alt.trim();
        const finalCaption = caption.trim();
        
        let markdown = '';
        if (finalCaption) {
            markdown = `\n![${finalAlt}](${url} "${finalCaption}")\n`;
        } else {
            markdown = `\n![${finalAlt}](${url})\n`;
        }
        
        onConfirm(markdown);
        onClose();
    };

    const isAltTooLong = alt.length > 125;
    const isAltSameAsCaption = alt.trim() === caption.trim() && alt.trim() !== '';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>이미지 속성 입력</DialogTitle>
                    <DialogDescription>
                        이미지에 대한 대체 텍스트(alt)와 캡션을 입력해주세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="alt-text" className="font-bold">
                                대체 텍스트 (alt) <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    id="decorative" 
                                    checked={isDecorative} 
                                    onCheckedChange={(checked) => setIsDecorative(checked === true)}
                                />
                                <Label htmlFor="decorative" className="text-xs text-slate-500 font-normal cursor-pointer">
                                    장식용 이미지 (대체 텍스트 생략)
                                </Label>
                            </div>
                        </div>
                        <Input 
                            id="alt-text"
                            value={alt}
                            onChange={(e) => setAlt(e.target.value)}
                            placeholder="시각 장애인을 위한 이미지 설명을 입력하세요."
                            disabled={isDecorative}
                            className={isAltTooLong ? 'border-red-300 focus-visible:ring-red-500' : ''}
                        />
                        {isAltTooLong && (
                            <p className="text-xs text-red-500">대체 텍스트가 너무 깁니다. 핵심 위주로 125자 이내로 요약해주세요.</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="caption-text" className="font-bold">
                            캡션 (선택)
                        </Label>
                        <Input 
                            id="caption-text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="이미지 하단에 표시될 캡션을 입력하세요."
                        />
                        {isAltSameAsCaption && (
                            <p className="text-xs text-amber-500">대체 텍스트와 캡션이 동일합니다. 대체 텍스트는 시각적인 설명 위주로 작성하는 것이 좋습니다.</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>취소</Button>
                    <Button 
                        type="button" 
                        onClick={handleConfirm}
                        disabled={(!isDecorative && alt.trim() === '') || !url}
                    >
                        적용하기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
