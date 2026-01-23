'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { collectNews } from '@/actions/news-actions';

export function CollectNewsButton() {
    const [loading, setLoading] = useState(false);

    const handleCollect = async () => {
        try {
            setLoading(true);
            toast.info("Starting news collection...");

            const result = await collectNews();

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to collect news.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleCollect} disabled={loading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Collecting...' : 'Collect News'}
        </Button>
    );
}
