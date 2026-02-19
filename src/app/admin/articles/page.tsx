'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getExhibitions } from '@/actions/exhibition-actions';
import { Newspaper } from 'lucide-react';

type Exhibition = Awaited<ReturnType<typeof getExhibitions>>[number];

export default function ArticlesIndexPage() {
    const router = useRouter();
    const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getExhibitions(false).then(data => {
            setExhibitions(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="py-12 text-center text-muted-foreground">불러오는 중...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Newspaper className="h-8 w-8" /> Articles
                </h1>
                <p className="text-muted-foreground mt-1">전시회를 선택하여 기사를 수집하고 조회하세요.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {exhibitions.map(ex => (
                    <button
                        key={ex.id}
                        onClick={() => router.push(`/admin/articles/${ex.slug}`)}
                        className="text-left p-5 border rounded-lg hover:shadow-md hover:border-slate-400 transition-all"
                    >
                        <h2 className="font-semibold text-base">{ex.name}</h2>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{ex.slug}</p>
                        {ex.description && <p className="text-sm text-muted-foreground mt-2">{ex.description}</p>}
                    </button>
                ))}
                {exhibitions.length === 0 && (
                    <p className="col-span-full text-center py-12 text-muted-foreground">
                        등록된 전시회가 없습니다. 먼저 Exhibitions에서 전시회를 등록하세요.
                    </p>
                )}
            </div>
        </div>
    );
}
