'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getIndustries } from '@/actions/industry-actions';
import { Newspaper, AlertTriangle } from 'lucide-react';

type Industry = Awaited<ReturnType<typeof getIndustries>>[number];

export default function ArticlesIndexPage() {
    const router = useRouter();
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getIndustries(false)
            .then(data => setIndustries(data))
            .catch(() => setError('산업 목록을 불러오는 중 오류가 발생했습니다.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
            <div className="h-6 w-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            <span>불러오는 중...</span>
        </div>
    );

    if (error) return (
        <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <span>{error}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Newspaper className="h-8 w-8" /> Articles
                </h1>
                <p className="text-muted-foreground mt-1">산업를 선택하여 기사를 수집하고 조회하세요.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {industries.map(ex => (
                    <button
                        key={ex.id}
                        onClick={() => router.push(`/admin/articles/${ex.id}`)}
                        className="text-left p-5 border rounded-lg hover:shadow-md hover:border-slate-400 transition-all"
                    >
                        <h2 className="font-semibold text-base">{ex.name}</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-mono">ID: {ex.id}</span>
                            <span className="mx-1">·</span>
                            <span className="font-mono text-slate-400">{ex.slug}</span>
                        </p>
                        {ex.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ex.description}</p>}
                        <p className="text-xs text-slate-400 mt-2">
                            키워드 {ex._count.keywords}개 · 수집 {ex._count.ingestions}건
                        </p>
                    </button>
                ))}
                {industries.length === 0 && (
                    <p className="col-span-full text-center py-12 text-muted-foreground">
                        등록된 산업가 없습니다. 먼저 <strong>Industries</strong>에서 산업를 등록하세요.
                    </p>
                )}
            </div>
        </div>
    );
}
