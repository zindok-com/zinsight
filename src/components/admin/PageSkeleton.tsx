/** 관리자 화면 불러오는 동안 보여 줄 뼈대 (loading.tsx 공용) */
export function PageSkeleton({ variant = 'page' }: { variant?: 'page' | 'analytics' }) {
    return (
        <div className="animate-pulse space-y-5" aria-busy="true" aria-label="불러오는 중">
            <div className="space-y-2">
                <div className="h-7 w-48 rounded-lg bg-slate-200" />
                <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
            </div>
            {variant === 'analytics' ? (
                <>
                    <div className="flex gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-9 w-16 rounded-lg bg-slate-100" />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-xl border border-slate-100 bg-white p-4">
                                <div className="h-3 w-16 rounded bg-slate-100" />
                                <div className="mt-3 h-7 w-20 rounded bg-slate-200" />
                            </div>
                        ))}
                    </div>
                    <div className="h-64 rounded-xl border border-slate-100 bg-white" />
                    <div className="h-48 rounded-xl border border-slate-100 bg-white" />
                </>
            ) : (
                <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-slate-100" />
                    ))}
                </div>
            )}
        </div>
    );
}
