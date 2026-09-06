import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getArticleAnalyticsSummary } from '@/actions/admin/analytics-actions';
import { ArticleAnalyticsClient } from './ArticleAnalyticsClient';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ period?: string }>;
}

export default async function ArticleAnalyticsPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { period } = await searchParams;

    const periodDays = period === 'all' ? 'all' : period === '7' ? 7 : period === '90' ? 90 : 30;

    const post = await prisma.magazinePost.findUnique({
        where: { id: Number(id) },
        select: {
            id: true,
            title: true,
            slug: true,
            deletedAt: true,
            organizations: {
                include: {
                    organization: {
                        select: { id: true, company_name: true },
                    },
                },
            },
        },
    });
    if (!post || post.deletedAt) notFound();

    const data = await getArticleAnalyticsSummary(Number(id), periodDays);
    const linkedOrgs = (post.organizations ?? []).map((po) => po.organization).filter(Boolean);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight line-clamp-2">{post.title}</h1>
                    <p className="text-muted-foreground text-sm mt-1">기사 성과 애널리틱스</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Link
                        href="/admin/magazine"
                        className="text-sm text-muted-foreground hover:text-foreground border rounded-md px-3 py-1.5 transition-colors bg-background"
                    >
                        ← 목록으로
                    </Link>
                    <Link
                        href={`/admin/magazine/edit/${id}`}
                        className="text-sm text-muted-foreground hover:text-foreground border rounded-md px-3 py-1.5 transition-colors bg-background"
                    >
                        기사 편집
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
                <Link
                    href={`/admin/magazine/edit/${id}`}
                    className="pb-2 px-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    편집
                </Link>
                <span className="pb-2 px-1 text-sm font-semibold border-b-2 border-foreground">
                    애널리틱스
                </span>
            </div>
            <ArticleAnalyticsClient data={data} postId={Number(id)} currentPeriod={String(period ?? '30')} />
        </div>
    );
}