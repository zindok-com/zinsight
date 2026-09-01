import { getPostsWithAnalytics, getDashboardAnalytics } from "@/actions/admin/analytics-actions";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Eye, MousePointerClick, TrendingUp, FileText } from "lucide-react";
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
                        <CardTitle className="text-sm font-medium">총 포스트</CardTitle>
                        <FileText className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{posts.length.toLocaleString()}건</div>
                        <p className="text-xs text-muted-foreground">등록된 전체 매거진 기사</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">발행 완료 (Published)</CardTitle>
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700">{posts.filter((p: any) => p.status === 'PUBLISHED').length.toLocaleString()}건</div>
                        <p className="text-xs text-muted-foreground">실서비스 공개 중인 기사</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">최근 7일 방문자 (DAU)</CardTitle>
                        <Users className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{summary.totalDau.toLocaleString()}명</div>
                        <p className="text-xs text-muted-foreground">Google Analytics 4 실데이터</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">최근 7일 페이지뷰</CardTitle>
                        <Eye className="w-4 h-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-700">{summary.totalViews.toLocaleString()}회</div>
                        <p className="text-xs text-muted-foreground">Google Analytics 4 실데이터</p>
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
