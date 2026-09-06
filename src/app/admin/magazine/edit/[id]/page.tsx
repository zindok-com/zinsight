import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MagazineForm } from "@/components/admin/magazine/MagazineForm";
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditMagazinePage({ params }: PageProps) {
    const { id } = await params;

    const post = await prisma.magazinePost.findUnique({
        where: { id: Number(id) },
        include: {
            organizations: {
                include: {
                    organization: true
                }
            }
        }
    });

    if (!post || post.deletedAt) {
        notFound();
    }

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

    const linkedOrgs = (post.organizations ?? []).map((po) => po.organization).filter(Boolean);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight line-clamp-2">{post.title}</h1>
                    <p className="text-muted-foreground text-sm mt-1">매거진 포스트 편집</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Link
                        href="/admin/magazine"
                        className="text-sm text-muted-foreground hover:text-foreground border rounded-md px-3 py-1.5 transition-colors bg-background"
                    >
                        ← 목록으로
                    </Link>
                    <Link
                        href={`/admin/magazine/edit/${id}/analytics`}
                        className="text-sm text-muted-foreground hover:text-foreground border rounded-md px-3 py-1.5 transition-colors bg-background flex items-center gap-1.5"
                    >
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                        애널리틱스
                    </Link>
                    {linkedOrgs.map((org) => (
                        <Link
                            key={org.id}
                            href={`/admin/companies/${org.id}/analytics`}
                            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md px-3 py-1.5 transition-colors flex items-center gap-1.5"
                        >
                            🏢 {org.company_name} 애널리틱스 →
                        </Link>
                    ))}
                </div>
            </div>


            <div className="flex gap-2 border-b">
                <span className="pb-2 px-1 text-sm font-semibold border-b-2 border-foreground">
                    편집
                </span>
                <Link
                    href={`/admin/magazine/edit/${id}/analytics`}
                    className="pb-2 px-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    애널리틱스
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Article Details</CardTitle>
                    <CardDescription>
                        Modify the basic information and content structure of the article.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MagazineForm 
                        authors={authors} 
                        regions={regions} 
                        categories={categories}
                        post={post} 
                    />
                </CardContent>
            </Card>
        </div>
    );
}
