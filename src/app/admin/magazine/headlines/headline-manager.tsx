'use client';

import { useState, useTransition } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    updateHomeSectionStatus, 
    updatePortalFeaturedStatus, 
    updatePortalSidePriority, 
    updateTechFeaturedStatus, 
    updateLocalFeaturedStatus 
} from '@/actions/admin/magazine-actions';
import { toast } from 'sonner';
import { Star, Loader2, Landmark, Newspaper, Building2, Home } from 'lucide-react';

export function HeadlineManager({ initialPosts }: { initialPosts: any[] }) {
    const [posts, setPosts] = useState(initialPosts);
    const [isPending, startTransition] = useTransition();
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'home' | 'portal' | 'tech' | 'local'>('home');

    // 1. 홈 화면 매거진 섹션 토글
    const handleHomeSectionToggle = (postId: number, active: boolean) => {
        setLoadingId(postId);
        startTransition(async () => {
            const res = await updateHomeSectionStatus(postId, active);
            if (res.success) {
                toast.success(active ? '홈 화면 노출이 지정되었습니다.' : '홈 화면 노출이 해제되었습니다.');
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, isInHomeSection: active } : p));
            } else {
                toast.error('변경 실패: ' + res.error);
            }
            setLoadingId(null);
        });
    };

    // 2. 포털 홈 메인 피처드 Hero 토글
    const handlePortalFeaturedToggle = (postId: number, active: boolean) => {
        setLoadingId(postId);
        startTransition(async () => {
            const res = await updatePortalFeaturedStatus(postId, active);
            if (res.success) {
                toast.success(active ? '포털 홈 메인 피처드로 지정되었습니다.' : '포털 홈 메인 피처드가 해제되었습니다.');
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) return { ...p, isPortalFeatured: active };
                    if (active && p.isPortalFeatured) return { ...p, isPortalFeatured: false };
                    return p;
                }));
            } else {
                toast.error('변경 실패: ' + res.error);
            }
            setLoadingId(null);
        });
    };

    // 3. 포털 홈 사이드 헤드라인 순위 변경
    const handlePortalSidePriorityChange = (postId: number, priority: string) => {
        const priorityNum = parseInt(priority);
        setLoadingId(postId);
        startTransition(async () => {
            const res = await updatePortalSidePriority(postId, priorityNum);
            if (res.success) {
                toast.success(priorityNum > 0 ? `포털 홈 사이드 ${priorityNum}순위로 지정되었습니다.` : '포털 홈 사이드 헤드라인이 해제되었습니다.');
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) return { ...p, portalSidePriority: priorityNum };
                    if (priorityNum > 0 && p.portalSidePriority === priorityNum) return { ...p, portalSidePriority: 0 };
                    return p;
                }));
            } else {
                toast.error('변경 실패: ' + res.error);
            }
            setLoadingId(null);
        });
    };

    // 4. 테크/마케팅 대표 기사 토글
    const handleTechFeaturedToggle = (postId: number, active: boolean) => {
        setLoadingId(postId);
        startTransition(async () => {
            const res = await updateTechFeaturedStatus(postId, active);
            if (res.success) {
                toast.success(active ? '테크/마케팅 대표 피처드로 지정되었습니다.' : '테크/마케팅 대표 피처드가 해제되었습니다.');
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) return { ...p, isTechFeatured: active };
                    if (active && p.isTechFeatured) return { ...p, isTechFeatured: false };
                    return p;
                }));
            } else {
                toast.error('변경 실패: ' + res.error);
            }
            setLoadingId(null);
        });
    };

    // 5. 로컬 지면 대표 기사 토글
    const handleLocalFeaturedToggle = (postId: number, active: boolean) => {
        setLoadingId(postId);
        startTransition(async () => {
            const res = await updateLocalFeaturedStatus(postId, active);
            if (res.success) {
                toast.success(active ? '로컬 대표 피처드로 지정되었습니다.' : '로컬 대표 피처드가 해제되었습니다.');
                const targetPost = posts.find(p => p.id === postId);
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) return { ...p, isLocalFeatured: active };
                    if (active && targetPost && p.regionId === targetPost.regionId && p.isLocalFeatured && p.id !== postId) {
                        return { ...p, isLocalFeatured: false };
                    }
                    return p;
                }));
            } else {
                toast.error('변경 실패: ' + res.error);
            }
            setLoadingId(null);
        });
    };

    // 지자체(Local) 기사 필터링
    const localPosts = posts.filter(p => p.category?.isLocal && p.regionId !== null);

    // 테크/마케팅 기사 필터링
    const techPosts = posts.filter(p => !p.category?.isLocal);

    // 카테고리 표시 라벨 매퍼
    const getCategoryDisplay = (cat: any) => {
        return cat?.name || '기타';
    };

    // 각 지면 정렬 정형화
    const sortedHomePosts = [...posts].sort((a, b) => {
        if (a.isInHomeSection && !b.isInHomeSection) return -1;
        if (!a.isInHomeSection && b.isInHomeSection) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const sortedPortalPosts = [...posts].sort((a, b) => {
        if (a.isPortalFeatured && !b.isPortalFeatured) return -1;
        if (!a.isPortalFeatured && b.isPortalFeatured) return 1;
        if (a.portalSidePriority > 0 && b.portalSidePriority === 0) return -1;
        if (a.portalSidePriority === 0 && b.portalSidePriority > 0) return 1;
        if (a.portalSidePriority > 0 && b.portalSidePriority > 0) return a.portalSidePriority - b.portalSidePriority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const sortedTechPosts = [...techPosts].sort((a, b) => {
        if (a.isTechFeatured && !b.isTechFeatured) return -1;
        if (!a.isTechFeatured && b.isTechFeatured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const sortedLocalPosts = [...localPosts].sort((a, b) => {
        if (a.isLocalFeatured && !b.isLocalFeatured) return -1;
        if (!a.isLocalFeatured && b.isLocalFeatured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const activeHomeSectionPosts = posts.filter(p => p.isInHomeSection);
    const activePortalFeatured = posts.find(p => p.isPortalFeatured);
    const uniqueRegions = Array.from(new Set(localPosts.map(p => p.region?.name).filter(Boolean))) as string[];

    return (
        <div className="space-y-6">
            {/* 탭 헤더 */}
            <div className="flex flex-wrap border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
                        activeTab === 'home' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    홈 화면 매거진 섹션
                </button>
                <button
                    onClick={() => setActiveTab('portal')}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
                        activeTab === 'portal' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    매거진 포털 홈 헤드라인
                </button>
                <button
                    onClick={() => setActiveTab('tech')}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
                        activeTab === 'tech' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    테크 · 마케팅 피처드
                </button>
                <button
                    onClick={() => setActiveTab('local')}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
                        activeTab === 'local' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    지자체 로컬 피처드
                </button>
            </div>

            {/* 1. 홈 화면 매거진 섹션 탭 */}
            {activeTab === 'home' && (
                <div className="space-y-6">
                    <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Home className="w-5 h-5 text-indigo-600" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">홈 화면 캐러셀 현황</h4>
                                <p className="text-xs text-slate-500">현재 홈 화면 매거진 미리보기 섹션에 노출되는 기사 수량입니다.</p>
                            </div>
                        </div>
                        <Badge className="bg-indigo-600 text-white text-sm py-1 px-3">
                            지정됨: {activeHomeSectionPosts.length}건
                        </Badge>
                    </div>

                    <div className="border rounded-md bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>카테고리</TableHead>
                                    <TableHead className="w-[450px]">제목</TableHead>
                                    <TableHead>홈 화면 노출</TableHead>
                                    <TableHead className="text-right">지정 변경</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedHomePosts.length > 0 ? (
                                    sortedHomePosts.map((post) => (
                                        <TableRow key={post.id} className={post.isInHomeSection ? 'bg-indigo-50/10' : ''}>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {getCategoryDisplay(post.category)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium truncate max-w-[450px]">
                                                {post.title}
                                            </TableCell>
                                            <TableCell>
                                                {post.isInHomeSection ? (
                                                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">노출 중</Badge>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">비노출</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant={post.isInHomeSection ? 'destructive' : 'default'}
                                                    disabled={isPending && loadingId === post.id}
                                                    onClick={() => handleHomeSectionToggle(post.id, !post.isInHomeSection)}
                                                >
                                                    {isPending && loadingId === post.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : post.isInHomeSection ? (
                                                        '노출 해제'
                                                    ) : (
                                                        '홈 화면 노출 지정'
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic text-sm">
                                            매거진 기사가 없습니다.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* 2. 매거진 포털 홈 헤드라인 탭 */}
            {activeTab === 'portal' && (
                <div className="space-y-6">
                    {/* 피처드 헤드라인 배치 요약 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Card className={`col-span-2 border-2 ${activePortalFeatured ? 'border-indigo-200 bg-indigo-50/30' : 'border-dashed border-slate-200 bg-slate-50/50'}`}>
                            <div className="p-4 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="bg-white">포털 홈 메인 피처드 (Hero)</Badge>
                                    <Star className={`w-4 h-4 ${activePortalFeatured ? 'fill-yellow-400 text-yellow-500' : 'text-slate-300'}`} />
                                </div>
                                {activePortalFeatured ? (
                                    <div className="flex-1">
                                        <p className="text-sm font-bold line-clamp-2 mb-2">{activePortalFeatured.title}</p>
                                        <p className="text-[10px] text-indigo-600 font-semibold">
                                            {getCategoryDisplay(activePortalFeatured.category)}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic py-4">
                                        지정된 메인 기사 없음
                                    </div>
                                )}
                            </div>
                        </Card>

                        {[1, 2, 3, 4].map((num) => {
                            const sidePost = posts.find(p => p.portalSidePriority === num);
                            return (
                                <Card key={num} className={`border-2 ${sidePost ? 'border-emerald-200 bg-emerald-50/20' : 'border-dashed border-slate-200 bg-slate-50/50'}`}>
                                    <div className="p-4 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className="bg-white">사이드바 {num}</Badge>
                                            <Star className={`w-4 h-4 ${sidePost ? 'fill-emerald-400 text-emerald-500' : 'text-slate-300'}`} />
                                        </div>
                                        {sidePost ? (
                                            <div className="flex-1">
                                                <p className="text-xs font-bold line-clamp-2 mb-1">{sidePost.title}</p>
                                                <p className="text-[9px] text-emerald-600 font-semibold">
                                                    {getCategoryDisplay(sidePost.category)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-[11px] text-slate-400 italic py-3">
                                                사이드바 미지정
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
                                    <TableHead className="w-[400px]">제목</TableHead>
                                    <TableHead>메인 피처드 (Hero)</TableHead>
                                    <TableHead>사이드 순서</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedPortalPosts.length > 0 ? (
                                    sortedPortalPosts.map((post) => (
                                        <TableRow key={post.id} className={post.isPortalFeatured || post.portalSidePriority > 0 ? 'bg-indigo-50/10' : ''}>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {getCategoryDisplay(post.category)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium truncate max-w-[400px]">
                                                {post.title}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant={post.isPortalFeatured ? 'destructive' : 'default'}
                                                    disabled={isPending && loadingId === post.id}
                                                    onClick={() => handlePortalFeaturedToggle(post.id, !post.isPortalFeatured)}
                                                >
                                                    {isPending && loadingId === post.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : post.isPortalFeatured ? (
                                                        '메인 해제'
                                                    ) : (
                                                        '메인 Hero 지정'
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <Select 
                                                    value={String(post.portalSidePriority)} 
                                                    onValueChange={(val) => handlePortalSidePriorityChange(post.id, val)}
                                                    disabled={isPending && loadingId === post.id}
                                                >
                                                    <SelectTrigger className="w-[130px] bg-white h-9">
                                                        {isPending && loadingId === post.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <SelectValue />}
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">미지정 (0)</SelectItem>
                                                        <SelectItem value="1">사이드바 1순위 (1)</SelectItem>
                                                        <SelectItem value="2">사이드바 2순위 (2)</SelectItem>
                                                        <SelectItem value="3">사이드바 3순위 (3)</SelectItem>
                                                        <SelectItem value="4">사이드바 4순위 (4)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic text-sm">
                                            매거진 기사가 없습니다.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* 3. 테크·마케팅 피처드 탭 */}
            {activeTab === 'tech' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[1].map((p) => {
                            const post = techPosts.find(item => item.isTechFeatured);
                            return (
                                <Card key={p} className={`border-2 ${post ? 'border-purple-200 bg-purple-50/30' : 'border-dashed border-slate-200 bg-slate-50/50'}`}>
                                    <div className="p-4 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className="bg-white">테크 피처드 (Hero)</Badge>
                                            <Star className={`w-4 h-4 ${post ? 'fill-purple-400 text-purple-500' : 'text-slate-300'}`} />
                                        </div>
                                        {post ? (
                                            <div className="flex-1">
                                                <p className="text-sm font-bold line-clamp-2 mb-2">{post.title}</p>
                                                <p className="text-[10px] text-purple-600 font-semibold">
                                                    {getCategoryDisplay(post.category)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center py-6 text-slate-400 text-xs italic">
                                                지정된 테크 메인 기사 없음
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
                                    <TableHead>테크 피처드 지정</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTechPosts.length > 0 ? (
                                    sortedTechPosts.map((post) => (
                                        <TableRow key={post.id} className={post.isTechFeatured ? 'bg-purple-50/10' : ''}>
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
                                                <Button
                                                    size="sm"
                                                    variant={post.isTechFeatured ? 'destructive' : 'default'}
                                                    disabled={isPending && loadingId === post.id}
                                                    onClick={() => handleTechFeaturedToggle(post.id, !post.isTechFeatured)}
                                                >
                                                    {isPending && loadingId === post.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : post.isTechFeatured ? (
                                                        '피처드 해제'
                                                    ) : (
                                                        '테크 피처드 지정'
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-slate-400 italic text-sm">
                                            테크/마케팅 카테고리에 속한 기사가 없습니다.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* 4. 지자체 로컬 피처드 탭 */}
            {activeTab === 'local' && (
                <div className="space-y-6">
                    {/* 지역별 헤드라인 요약 카드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {uniqueRegions.length > 0 ? (
                            uniqueRegions.map((regionName) => {
                                const activeLocalHeadline = localPosts.find(
                                    (p) => p.region?.name === regionName && p.isLocalFeatured
                                );
                                return (
                                    <Card key={regionName} className={`border-2 ${activeLocalHeadline ? 'border-emerald-200 bg-emerald-50/20' : 'border-dashed border-slate-200 bg-slate-50/50'}`}>
                                        <div className="p-4 flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className="bg-white flex items-center gap-1">
                                                    <Landmark className="w-3 h-3 text-emerald-600" />
                                                    {regionName} 피처드
                                                </Badge>
                                                <Star className={`w-4 h-4 ${activeLocalHeadline ? 'fill-emerald-400 text-emerald-500' : 'text-slate-300'}`} />
                                            </div>
                                            {activeLocalHeadline ? (
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold line-clamp-2 mb-1">{activeLocalHeadline.title}</p>
                                                    <p className="text-[9px] text-emerald-600 font-semibold">
                                                        {getCategoryDisplay(activeLocalHeadline.category)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center text-[11px] text-slate-400 italic py-3">
                                                    지정된 대표 기사 없음
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
                                    <TableHead>로컬 피처드 지정</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedLocalPosts.length > 0 ? (
                                    sortedLocalPosts.map((post) => (
                                        <TableRow key={post.id} className={post.isLocalFeatured ? 'bg-emerald-50/10' : ''}>
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
                                                <Button
                                                    size="sm"
                                                    variant={post.isLocalFeatured ? 'destructive' : 'default'}
                                                    disabled={isPending && loadingId === post.id}
                                                    onClick={() => handleLocalFeaturedToggle(post.id, !post.isLocalFeatured)}
                                                >
                                                    {isPending && loadingId === post.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : post.isLocalFeatured ? (
                                                        '피처드 해제'
                                                    ) : (
                                                        '로컬 피처드 지정'
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic text-sm">
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
