'use client';

import { useState, useTransition } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateHeadlinePriority, updateLocalHeadlinePriority } from '@/actions/admin/magazine-actions';
import { toast } from 'sonner';
import { Star, Loader2, Landmark } from 'lucide-react';

export function HeadlineManager({ initialPosts }: { initialPosts: any[] }) {
    const [posts, setPosts] = useState(initialPosts);
    const [isPending, startTransition] = useTransition();
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'main' | 'local'>('main');

    // 메인 헤드라인 우선순위 변경
    const handlePriorityChange = (postId: number, priority: string) => {
        const priorityNum = parseInt(priority);
        setLoadingId(postId);
        
        startTransition(async () => {
            const res = await updateHeadlinePriority(postId, priorityNum);
            if (res.success) {
                toast.success('메인 헤드라인 우선순위가 변경되었습니다.');
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) return { ...p, headlinePriority: priorityNum };
                    if (priorityNum > 0 && p.headlinePriority === priorityNum) return { ...p, headlinePriority: 0 };
                    return p;
                }));
            } else {
                toast.error('변경 실패: ' + res.error);
            }
            setLoadingId(null);
        });
    };

    // 로컬 전용 헤드라인 우선순위 변경
    const handleLocalPriorityChange = (postId: number, priority: string) => {
        const priorityNum = parseInt(priority);
        setLoadingId(postId);
        
        startTransition(async () => {
            const res = await updateLocalHeadlinePriority(postId, priorityNum);
            if (res.success) {
                toast.success('로컬 대표 헤드라인이 변경되었습니다.');
                const targetPost = posts.find(p => p.id === postId);
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) return { ...p, localHeadlinePriority: priorityNum };
                    // 동일한 지역 내 다른 기사의 대표 설정을 해제
                    if (priorityNum > 0 && targetPost && p.regionId === targetPost.regionId && p.localHeadlinePriority === priorityNum && p.id !== postId) {
                        return { ...p, localHeadlinePriority: 0 };
                    }
                    return p;
                }));
            } else {
                toast.error('변경 실패: ' + res.error);
            }
            setLoadingId(null);
        });
    };

    // 로컬 기사 필터링
    const localPosts = posts.filter(p => 
        p.category?.isLocal && p.regionId !== null
    );

    // 메인 기사 필터링 (메인 헤드라인 용)
    const mainPosts = posts.filter(p => !p.category?.isLocal);

    // 카테고리 표시 라벨 매퍼
    const getCategoryDisplay = (cat: any) => {
        return cat?.name || '기타';
    };

    // 정렬 규칙: 설정된 순서 우선 -> 최신순
    const sortedMainPosts = [...mainPosts].sort((a, b) => {
        if (a.headlinePriority > 0 && b.headlinePriority === 0) return -1;
        if (a.headlinePriority === 0 && b.headlinePriority > 0) return 1;
        if (a.headlinePriority > 0 && b.headlinePriority > 0) return a.headlinePriority - b.headlinePriority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const sortedLocalPosts = [...localPosts].sort((a, b) => {
        if (a.localHeadlinePriority > 0 && b.localHeadlinePriority === 0) return -1;
        if (a.localHeadlinePriority === 0 && b.localHeadlinePriority > 0) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 지자체(Region) 목록 및 대표 헤드라인 매핑
    const uniqueRegions = Array.from(new Set(localPosts.map(p => p.region?.name).filter(Boolean))) as string[];

    return (
        <div className="space-y-6">
            {/* 탭 헤더 */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('main')}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
                        activeTab === 'main' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    메인 매거진 헤드라인 (1~5순위)
                </button>
                <button
                    onClick={() => setActiveTab('local')}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
                        activeTab === 'local' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    지자체 / 로컬 대표 헤드라인
                </button>
            </div>

            {activeTab === 'main' ? (
                /* ────────────────────────────────────────────────────────── */
                /* 메인 지면 헤드라인 관리 */
                /* ────────────────────────────────────────────────────────── */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((p) => {
                            const post = mainPosts.find(item => item.headlinePriority === p);
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
                                                <p className="text-[10px] text-indigo-600 font-semibold">
                                                    {getCategoryDisplay(post.category)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic py-4">
                                                설정된 기사 없음
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="border rounded-md bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>카테고리</TableHead>
                                    <TableHead className="w-[450px]">제목</TableHead>
                                    <TableHead>우선순위</TableHead>
                                    <TableHead className="text-right">변경</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedMainPosts.map((post) => (
                                    <TableRow key={post.id} className={post.headlinePriority > 0 ? 'bg-indigo-50/10' : ''}>
                                        <TableCell>
                                            <Badge 
                                                variant="outline" 
                                                className={
                                                    post.category?.slug === 'tech-marketing' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                }
                                            >
                                                {getCategoryDisplay(post.category)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium truncate max-w-[450px]">
                                            {post.title}
                                        </TableCell>
                                        <TableCell>
                                            {post.headlinePriority > 0 ? (
                                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1 w-fit">
                                                    <Star className="w-3 h-3 fill-yellow-500" />
                                                    우선순위 {post.headlinePriority}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400 text-xs">일반</span>
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
            ) : (
                /* ────────────────────────────────────────────────────────── */
                /* 지자체/로컬 전용 대표 헤드라인 관리 */
                /* ────────────────────────────────────────────────────────── */
                <div className="space-y-6">
                    {/* 지역별 헤드라인 요약 카드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {uniqueRegions.length > 0 ? (
                            uniqueRegions.map((regionName) => {
                                const activeLocalHeadline = localPosts.find(p => p.region?.name === regionName && p.localHeadlinePriority === 1);
                                return (
                                    <Card key={regionName} className={`border-2 ${activeLocalHeadline ? 'border-emerald-200 bg-emerald-50/20' : 'border-dashed border-slate-200 bg-slate-50/50'}`}>
                                        <div className="p-4 flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200 flex items-center gap-1">
                                                    <Landmark className="w-3.5 h-3.5" />
                                                    {regionName} 대표
                                                </Badge>
                                                {activeLocalHeadline && <Star className="w-4 h-4 fill-emerald-500 text-emerald-600" />}
                                            </div>
                                            {activeLocalHeadline ? (
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold line-clamp-2 mb-2">{activeLocalHeadline.title}</p>
                                                    <p className="text-[10px] text-emerald-600 font-semibold">
                                                        {getCategoryDisplay(activeLocalHeadline.category)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic py-4">
                                                    대표 기사 미지정
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="col-span-full p-6 text-center border border-dashed rounded-xl bg-slate-50 text-slate-400 italic text-sm">
                                등록된 로컬 기사가 없습니다. 기사 작성 시 지자체 연계 지역을 지정해주세요.
                            </div>
                        )}
                    </div>

                    <div className="border rounded-md bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>연계 지역</TableHead>
                                    <TableHead>로컬 카테고리</TableHead>
                                    <TableHead className="w-[400px]">제목</TableHead>
                                    <TableHead>대표 지정</TableHead>
                                    <TableHead className="text-right">변경</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedLocalPosts.length > 0 ? (
                                    sortedLocalPosts.map((post) => (
                                        <TableRow key={post.id} className={post.localHeadlinePriority > 0 ? 'bg-emerald-50/10' : ''}>
                                            <TableCell className="font-semibold text-slate-700">
                                                {post.region?.name || '미지정'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="outline" 
                                                    className={
                                                        post.category?.slug === 'spotlight' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        post.category?.slug === 'briefing' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                                        'bg-orange-50 text-orange-700 border-orange-200'
                                                    }
                                                >
                                                    {getCategoryDisplay(post.category)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium truncate max-w-[400px]">
                                                {post.title}
                                            </TableCell>
                                            <TableCell>
                                                {post.localHeadlinePriority > 0 ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit">
                                                        <Star className="w-3 h-3 fill-emerald-500 text-emerald-600" />
                                                        로컬 대표 지정됨
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">일반 목록</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end">
                                                    <Select 
                                                        value={String(post.localHeadlinePriority)} 
                                                        onValueChange={(val) => handleLocalPriorityChange(post.id, val)}
                                                        disabled={isPending && loadingId === post.id}
                                                    >
                                                        <SelectTrigger className="w-[150px] bg-white h-9">
                                                            {isPending && loadingId === post.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <SelectValue />}
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="0">일반 목록 (0)</SelectItem>
                                                            <SelectItem value="1">대표 헤드라인 (1)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-400 italic text-sm">
                                            로컬 지자체 카테고리에 속한 기사가 없습니다.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}

// Internal Card fallback if not imported from UI
function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>;
}

