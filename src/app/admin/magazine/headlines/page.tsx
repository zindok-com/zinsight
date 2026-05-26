import { getMagazinePosts } from "@/actions/admin/magazine-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeadlineManager } from "./headline-manager";

export const dynamic = 'force-dynamic';

export default async function HeadlinesPage() {
    const posts = await getMagazinePosts();
    
    // Only show published posts for headline setting usually, but admin might want all
    const publishedPosts = posts.filter(p => p.status === 'PUBLISHED');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">헤드라인 설정</h1>
                <p className="text-muted-foreground">매거진 홈 화면에 노출될 헤드라인 기사의 우선순위를 설정합니다. (0: 일반, 1~5: 헤드라인)</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>헤드라인 관리</CardTitle>
                    <CardDescription>
                        우선순위가 높은 순서대로(1 &rarr; 5) 메인 영역에 강조되어 표시됩니다. 0은 일반 목록에만 표시됩니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HeadlineManager initialPosts={publishedPosts} />
                </CardContent>
            </Card>
        </div>
    );
}
