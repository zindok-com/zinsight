'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Cpu } from "lucide-react";
import { toast } from "sonner";
import { processNewsAction } from '@/actions/processor-actions';

interface ProcessNewsButtonProps {
    unlinkedCount: number;
}

export function ProcessNewsButton({ unlinkedCount }: ProcessNewsButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleProcess = async () => {
        if (unlinkedCount === 0) {
            toast.info("새로 처리할 기사가 없습니다.");
            return;
        }

        try {
            setLoading(true);
            toast.info("기사 분석 및 기업 추출을 시작합니다...");

            const result = await processNewsAction();

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("데이터 처리 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleProcess}
            disabled={loading || unlinkedCount === 0}
            size="sm"
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
        >
            <Cpu className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Processing...' : `Process News (${unlinkedCount})`}
        </Button>
    );
}
