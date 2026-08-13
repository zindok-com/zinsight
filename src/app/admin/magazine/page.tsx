import { getPostsWithAnalytics, getDashboardAnalytics } from "@/actions/admin/analytics-actions";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Eye, MousePointerClick, TrendingUp } from "lucide-react";
import Link from "next/link";
import { MagazineListTable } from "@/components/admin/magazine/MagazineListTable";

export const dynamic = 'force-dynamic';

export default async function MagazinePage() {
    const [posts, authors, categories, analytics] = await Promise.all([
        getPostsWithAnalytics(),
        prisma.author.findMany({ orderBy: { name: 'asc' } }),
        prisma.magazineCategory.findMany({ orderBy: { id: 'asc' } }),
        getDashboardAnalytics(7)
    ]);

    const { summary } = analytics;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">매거진 포스트 관리</h1>
                    <p className="text-muted-foreground">고도화된 마케팅 기사 데이터를 관리하고 발행합니다.</p>
                </div>
                <Link href="/admin/magazine/new">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" /> 새 포스트 등록
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">최근 7일 방문자 (DAU 합산)</CardTitle>
                        <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalDau.toLocaleString()}명</div>
                        <p className="text-xs text-muted-foreground">유니크 쿠키 기반</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">노출수 (Impressions)</CardTitle>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalImpressions.toLocaleString()}회</div>
                        <p className="text-xs text-muted-foreground">리스트 및 피드 노출 합산</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">조회수 (Views)</CardTitle>
                        <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalViews.toLocaleString()}회</div>
                        <p className="text-xs text-muted-foreground">상세페이지 실제 조회</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">평균 CTR</CardTitle>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.avgCtr}%</div>
                        <p className="text-xs text-muted-foreground">조회수 / 노출수</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>포스트 목록</CardTitle>
                    <CardDescription>
                        현재 데이터베이스에 총 {posts.length}개의 포스트가 등록되어 있습니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {posts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            등록된 포스트가 없습니다. 첫 번째 매거진 포스트를 등록해 보세요.
                        </div>
                    ) : (
                        <MagazineListTable 
                            posts={posts as any} 
                            authors={authors} 
                            categories={categories} 
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
