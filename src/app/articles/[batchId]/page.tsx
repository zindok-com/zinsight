import { DataService } from '@/services/data-service';
import { ArticlesClient } from "@/components/articles/articles-client";
import { getArticlesByBatchId, getBatchById } from "@/lib/batch-utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface BatchPageProps {
    params: Promise<{
        batchId: string;
    }>;
}

export default async function BatchPage({ params }: BatchPageProps) {
    // Next.js 15+ params는 Promise로 제공됨
    const { batchId } = await params;

    const service = DataService.getInstance();
    const allNews = await service.getNews();

    // 배치 ID로 아티클 필터링
    const batchArticles = getArticlesByBatchId(allNews, batchId);

    if (batchArticles.length === 0) {
        notFound();
    }

    // 배치 정보 가져오기
    const batch = getBatchById(allNews, batchId);

    if (!batch) {
        notFound();
    }

    // 수집 시각 포맷팅
    const collectedTime = new Date(batch.collectedAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="space-y-4">
                <Link href="/articles">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        배치 목록으로
                    </Button>
                </Link>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{batch.sourceQuery}</h1>
                    <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                        <span>{collectedTime} 수집</span>
                        <span>·</span>
                        <Badge variant="secondary" className="font-semibold">
                            {batch.articleCount}개 아티클
                        </Badge>
                        <span>·</span>
                        <Badge variant="outline">{batch.sourceType}</Badge>
                    </div>
                </div>
            </div>

            {/* 아티클 목록 */}
            <ArticlesClient news={batchArticles} />
        </div>
    );
}
