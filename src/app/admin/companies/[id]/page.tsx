import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { CompanyEditClient } from './CompanyEditClient';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
    const { id: paramId } = await params;
    const id = Number(paramId);

    if (isNaN(id)) {
        notFound();
    }

    const [company, regions] = await Promise.all([
        prisma.organization.findUnique({
            where: { id },
            include: {
                region: true,
                company_articles: {
                    include: {
                        article: true,
                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                },
                magazinePosts: {
                    where: {
                        magazinePost: {
                            deletedAt: null,
                        },
                    },
                    include: {
                        magazinePost: {
                            include: {
                                category: true,
                                region: true,
                            },
                        },
                    },
                    orderBy: {
                        magazinePost: {
                            createdAt: 'desc',
                        },
                    },
                },
                ingestions: {
                    include: {
                        article: true,
                    },
                    orderBy: {
                        fetched_at: 'desc',
                    },
                    take: 50,
                },
                _count: {
                    select: {
                        company_articles: true,
                        magazinePosts: true,
                        ingestions: true,
                    },
                },
            },
        }),
        prisma.region.findMany({
            orderBy: { name: 'asc' },
        }),
    ]);

    if (!company) {
        notFound();
    }

    // 조직명 및 별칭(Aliases)으로 DB 전체 기사 중 매칭되는 기사 추가 검색
    const aliases: string[] = Array.isArray(company.aliases)
        ? (company.aliases as string[])
        : typeof company.aliases === 'string'
            ? (() => {
                try {
                    const parsed = JSON.parse(company.aliases);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return (company.aliases as string).split(',').map(s => s.trim()).filter(Boolean);
                }
            })()
            : [];

    const searchTerms = [company.company_name, ...aliases].filter(term => term && term.trim().length > 1);

    let matchedArticles: any[] = [];
    if (searchTerms.length > 0) {
        matchedArticles = await prisma.article.findMany({
            where: {
                OR: searchTerms.map(term => ({
                    title: { contains: term.trim() },
                })),
            },
            select: {
                id: true,
                title: true,
                pub_date: true,
                source: true,
                link: true,
                canonical_link: true,
                description: true,
                created_at: true,
            },
            orderBy: {
                pub_date: 'desc',
            },
            take: 50,
        });
    }

    return (
        <div className="space-y-6 pb-16">
            <CompanyEditClient
                company={company}
                regions={regions}
                matchedArticles={matchedArticles}
            />
        </div>
    );
}
