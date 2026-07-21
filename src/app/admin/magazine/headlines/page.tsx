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
                <h1 className="text-3xl font-bold tracking-tight">지면 대표 기사 설정</h1>
                <p className="text-muted-foreground">홈 화면 캐러셀, 포털 메인/사이드바 및 각 지면별 대표 피처드 기사를 노출 위치에 맞춰 편리하게 설정합니다.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>지면 노출 관리</CardTitle>
                    <CardDescription>
                        각 탭을 이동하며 홈 화면, 포털 홈, 테크, 로컬 지면의 레이아웃 목적에 맞게 기사 노출 상태를 직접 지정할 수 있습니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HeadlineManager initialPosts={publishedPosts} />
                </CardContent>
            </Card>
        </div>
    );
}
