
import { DataService } from '@/services/data-service';
import { groupArticlesByBatch } from "@/lib/batch-utils";
import { CollectNewsButton } from "@/components/articles/collect-button";
import { CollectionBatchesTable } from "@/components/articles/collection-batches-table";
import { batchColumns } from "@/components/articles/batch-columns";

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
    const service = DataService.getInstance();
    const news = await service.getNews();

    // 아티클들을 배치별로 그룹화
    const batches = groupArticlesByBatch(news);



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">수집 배치 목록</h1>
                    <p className="text-muted-foreground mt-1">
                        검색어별로 수집된 뉴스 기사 묶음을 확인하세요
                    </p>
                </div>
                <div className="flex gap-2">
                    <CollectNewsButton />
                </div>
            </div>

            {batches.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 border rounded-lg">
                    <p className="text-lg font-medium mb-2">수집된 배치가 없습니다</p>
                    <p className="text-sm">뉴스 수집 버튼을 클릭하여 시작하세요.</p>
                </div>
            ) : (
                <CollectionBatchesTable columns={batchColumns} data={batches} />
            )}
        </div>
    );
}
