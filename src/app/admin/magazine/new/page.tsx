import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MagazineForm } from "@/components/admin/magazine/MagazineForm";

export default async function NewMagazinePage() {
    // Fetch active authors, regions, and categories for selection
    const [authors, regions, categories] = await Promise.all([
        prisma.author.findMany({
            orderBy: { name: 'asc' }
        }).catch((err) => {
            console.error('Failed to fetch authors:', err);
            return [];
        }),
        prisma.region.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        }).catch((err) => {
            console.error('Failed to fetch regions:', err);
            return [];
        }),
        prisma.magazineCategory.findMany({
            orderBy: { id: 'asc' }
        }).catch((err) => {
            console.error('Failed to fetch categories:', err);
            return [];
        })
    ]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">새 매거진 포스트 작성</h1>
                <p className="text-muted-foreground mt-1">진사이트 매거진에 새로운 기사를 등록합니다.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Article Details</CardTitle>
                    <CardDescription>
                        Fill in the basic information. You can add more details later.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MagazineForm 
                        authors={authors} 
                        regions={regions} 
                        categories={categories} 
                    />
                </CardContent>
            </Card>
        </div>
    );
}
