'use client';

import { useState, useTransition } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateHeadlinePriority } from '@/actions/admin/magazine-actions';
import { toast } from 'sonner';
import { Star, Loader2 } from 'lucide-react';

export function HeadlineManager({ initialPosts }: { initialPosts: any[] }) {
    const [posts, setPosts] = useState(initialPosts);
    const [isPending, startTransition] = useTransition();
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handlePriorityChange = (postId: number, priority: string) => {
        const priorityNum = parseInt(priority);
        setLoadingId(postId);
        
        startTransition(async () => {
            const res = await updateHeadlinePriority(postId, priorityNum);
            if (res.success) {
                toast.success('우선순위가 변경되었습니다.');
                setPosts(prev => prev.map(p => {
                    // 선택한 포스트의 우선순위 업데이트
                    if (p.id === postId) return { ...p, headlinePriority: priorityNum };
                    // 동일한 우선순위를 가졌던 다른 포스트는 0으로 초기화 (단, priority가 0이 아닐 때만)
                    if (priorityNum > 0 && p.headlinePriority === priorityNum) return { ...p, headlinePriority: 0 };
                    return p;
                }));
            } else {
                toast.error('변경 실패: ' + res.error);
            }
            setLoadingId(null);
        });
    };

    // Sort: Priorities 1-5 first, then 0
    const sortedPosts = [...posts].sort((a, b) => {
        if (a.headlinePriority > 0 && b.headlinePriority === 0) return -1;
        if (a.headlinePriority === 0 && b.headlinePriority > 0) return 1;
        if (a.headlinePriority > 0 && b.headlinePriority > 0) return a.headlinePriority - b.headlinePriority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {[1, 2, 3, 4, 5].map((p) => {
                    const post = posts.find(item => item.headlinePriority === p);
                    return (
                        <Card key={p} className={`border-2 ${post ? 'border-indigo-200 bg-indigo-50/30' : 'border-dashed border-slate-200 bg-slate-50/50'}`}>
                            <div className="p-4 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="bg-white">헤드라인 {p}</Badge>
                                    <Star className={`w-4 h-4 ${post ? 'fill-yellow-400 text-yellow-500' : 'text-slate-300'}`} />
                                </div>
                                {post ? (
                                    <div className="flex-1">
                                        <p className="text-sm font-bold line-clamp-2 mb-2">{post.title}</p>
                                        <p className="text-[10px] text-slate-500">
                                            {post.category === 'INTELLIGENCE_REPORT' ? '디지털 마케팅' :
                                             ['VALLEY_NOW', 'LOCAL_SME', 'MARKET_FLASH'].includes(post.category) ? '로컬 지자체 기사' : '뉴스레터'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
                                        설정된 기사 없음
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>카테고리</TableHead>
                            <TableHead className="w-[400px]">제목</TableHead>
                            <TableHead>현재 우선순위</TableHead>
                            <TableHead className="text-right">우선순위 변경</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedPosts.map((post) => (
                            <TableRow key={post.id} className={post.headlinePriority > 0 ? 'bg-indigo-50/20' : ''}>
                                <TableCell>
                                    <Badge 
                                        variant="outline" 
                                        className={
                                            post.category === 'INTELLIGENCE_REPORT' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            ['VALLEY_NOW', 'LOCAL_SME', 'MARKET_FLASH'].includes(post.category) ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'
                                        }
                                    >
                                        {post.category === 'INTELLIGENCE_REPORT' ? '디지털 마케팅' :
                                         ['VALLEY_NOW', 'LOCAL_SME', 'MARKET_FLASH'].includes(post.category) ? '로컬 지자체 기사' : '뉴스레터'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium truncate max-w-[400px]">
                                    {post.title}
                                </TableCell>
                                <TableCell>
                                    {post.headlinePriority > 0 ? (
                                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1 w-fit">
                                            <Star className="w-3 h-3 fill-yellow-500" />
                                            Priority {post.headlinePriority}
                                        </Badge>
                                    ) : (
                                        <span className="text-slate-400 text-sm">일반</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end">
                                        <Select 
                                            value={String(post.headlinePriority)} 
                                            onValueChange={(val) => handlePriorityChange(post.id, val)}
                                            disabled={isPending && loadingId === post.id}
                                        >
                                            <SelectTrigger className="w-[120px] bg-white h-9">
                                                {isPending && loadingId === post.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <SelectValue />}
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">일반 (0)</SelectItem>
                                                <SelectItem value="1">헤드라인 1</SelectItem>
                                                <SelectItem value="2">헤드라인 2</SelectItem>
                                                <SelectItem value="3">헤드라인 3</SelectItem>
                                                <SelectItem value="4">헤드라인 4</SelectItem>
                                                <SelectItem value="5">헤드라인 5</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// Internal Card fallback if not imported from UI
function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>;
}
