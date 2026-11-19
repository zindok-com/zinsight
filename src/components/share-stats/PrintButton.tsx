'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-zi-primary px-4 text-sm font-semibold text-white hover:opacity-90"
        >
            <Printer className="h-4 w-4" aria-hidden="true" />
            인쇄 / PDF로 저장
        </button>
    );
}
