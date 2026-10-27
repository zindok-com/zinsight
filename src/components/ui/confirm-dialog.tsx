'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmOptions {
    title?: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

type ConfirmFn = (optionsOrMessage: string | ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: '작업 확인',
        description: '',
        confirmText: '확인',
        cancelText: '취소',
        variant: 'default',
    });

    const resolverRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmFn>((optionsOrMessage) => {
        const parsed: ConfirmOptions =
            typeof optionsOrMessage === 'string'
                ? {
                      title: '작업 확인',
                      description: optionsOrMessage,
                      confirmText: '확인',
                      cancelText: '취소',
                      variant: /삭제|무효화|반려|해제|초기화/.test(optionsOrMessage) ? 'destructive' : 'default',
                  }
                : {
                      title: optionsOrMessage.title || '작업 확인',
                      description: optionsOrMessage.description,
                      confirmText: optionsOrMessage.confirmText || '확인',
                      cancelText: optionsOrMessage.cancelText || '취소',
                      variant: optionsOrMessage.variant || 'default',
                  };

        setOptions(parsed);
        setOpen(true);

        return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
        });
    }, []);

    const handleChoice = (result: boolean) => {
        setOpen(false);
        if (resolverRef.current) {
            resolverRef.current(result);
            resolverRef.current = null;
        }
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) handleChoice(false);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                            {options.variant === 'destructive' && (
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                            )}
                            {options.title}
                        </DialogTitle>
                        <DialogDescription className="whitespace-pre-line text-sm text-slate-600 pt-1 leading-relaxed">
                            {options.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleChoice(false)}
                        >
                            {options.cancelText || '취소'}
                        </Button>
                        <Button
                            type="button"
                            variant={options.variant === 'destructive' ? 'destructive' : 'default'}
                            className={
                                options.variant === 'destructive'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }
                            onClick={() => handleChoice(true)}
                        >
                            {options.confirmText || '확인'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        return async (optionsOrMessage) => {
            const msg = typeof optionsOrMessage === 'string' ? optionsOrMessage : optionsOrMessage.description;
            return typeof window !== 'undefined' ? window.confirm(msg) : false;
        };
    }
    return ctx;
}
