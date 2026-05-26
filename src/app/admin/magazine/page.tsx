import { getMagazinePosts } from "@/actions/admin/magazine-actions";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { MagazineListTable } from "@/components/admin/magazine/MagazineListTable";

export const dynamic = 'force-dynamic';

export default async function MagazinePage() {
    const [posts, industries] = await Promise.all([
        getMagazinePosts(),
        prisma.industry.findMany({ where: { deleted_at: null, is_active: true }, orderBy: { name: 'asc' } })
    ]);

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
                        <MagazineListTable posts={posts} industries={industries} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
