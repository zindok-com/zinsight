import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MagazineForm } from "@/components/admin/magazine/MagazineForm";
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditMagazinePage({ params }: PageProps) {
    const { id } = await params;

    const post = await prisma.magazinePost.findUnique({
        where: { id: Number(id) },
        include: {
            industries: true
        }
    });

    if (!post || post.deletedAt) {
        notFound();
    }

    // Fetch active industries, authors, and regions for selection
    const [industries, authors, regions] = await Promise.all([
        prisma.industry.findMany({
            where: { deleted_at: null, is_active: true },
            orderBy: { name: 'asc' }
        }).catch((err) => {
            console.error('Failed to fetch industries:', err);
            return [];
        }),
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
        })
    ]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
                <p className="text-muted-foreground mt-1">Modify marketing content for the Zinsight Magazine.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Article Details</CardTitle>
                    <CardDescription>
                        Modify the basic information and content structure of the article.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MagazineForm industries={industries} authors={authors} regions={regions} post={post} />
                </CardContent>
            </Card>
        </div>
    );
}
