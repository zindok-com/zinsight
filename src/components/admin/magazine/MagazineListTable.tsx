'use client';

import { useState, useTransition } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Trash2, Edit, Save, X, Loader2, FileText, Globe, Image as ImageIcon, Info, Plus, HelpCircle, BarChart3 } from 'lucide-react';
import { deleteMagazinePost, updateMagazinePost, updateMultipleMagazinePostsStatus } from '@/actions/admin/magazine-actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function MagazineListTable({ 
    posts, 
    authors = [], 
    categories = [] 
}: { 
    posts: any[], 
    authors?: any[], 
    categories?: any[] 
}) {
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [editForm, setEditForm] = useState<any>({});

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const router = useRouter();

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(posts.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (checked: boolean, id: number) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleBulkStatusUpdate = (status: string) => {
        if (selectedIds.length === 0) return;

        startTransition(async () => {
            const res = await updateMultipleMagazinePostsStatus(selectedIds, status);
            if (res.success) {
                toast.success(`선택된 ${selectedIds.length}개 포스트의 상태가 변경되었습니다.`);
                setSelectedIds([]);
                router.refresh();
            } else {
                toast.error('일괄 변경 실패: ' + res.error);
            }
        });
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('정말 이 포스트를 삭제하시겠습니까?')) return;

        const res = await deleteMagazinePost(id);
        if (res.success) {
            toast.success('포스트가 삭제되었습니다.');
        } else {
            toast.error('삭제 실패: ' + res.error);
        }
    };

    const handleRowClick = (post: any) => {
        setSelectedPost(post);

        let parsedData = { lead: '', bodies: [{ title: '', content: '' }], closing: '' };
        try {
            const parsed = JSON.parse(post.content);
            if (parsed.lead || parsed.bodies || parsed.closing) {
                parsedData.lead = parsed.lead || '';
                parsedData.bodies = parsed.bodies?.length ? parsed.bodies : [{ title: '', content: '' }];
                parsedData.closing = parsed.closing || '';
            } else {
                parsedData.bodies = [{ title: '기존 내용', content: post.content }];
            }
        } catch (e) {
            // JSON이 아니라면 기존 텍스트(마크다운 등)를 첫 번째 본문에 할당
            parsedData.bodies = [{ title: '기존 내용', content: post.content }];
        }

        setEditForm({
            title: post.title,
            slug: post.slug,
            categoryId: post.categoryId,
            lead: parsedData.lead,
            bodies: parsedData.bodies,
            closing: parsedData.closing,
            thumbnailUrl: post.thumbnailUrl || '',
            status: post.status,
            authorId: post.authorId || null,
            authorName: post.authorName || '진사이트 편집부'
        });
    };

    const handleSave = () => {
        startTransition(async () => {
            if (!editForm.lead || editForm.lead.trim() === '') {
                toast.error('리드(Lead) 내용을 입력해주세요.');
                return;
            }

            if (!editForm.closing || editForm.closing.trim() === '') {
                toast.error('클로징(Closing) 내용을 입력해주세요.');
                return;
            }

            const validBodies = editForm.bodies.filter((b: any) => b.title.trim() !== '' || b.content.trim() !== '');
            if (validBodies.length === 0) {
                toast.error('최소 하나의 본문 섹션을 입력해주세요.');
                return;
            }

            const structuredContent = JSON.stringify({
                lead: editForm.lead,
                bodies: validBodies,
                closing: editForm.closing
            });

            const payload = {
                ...editForm,
                categoryId: Number(editForm.categoryId),
                content: structuredContent
            };

            const res = await updateMagazinePost(selectedPost.id, payload);
            if (res.success) {
                toast.success('포스트가 수정되었습니다.');
                setSelectedPost({
                    ...selectedPost, ...editForm
                });
                setIsEditing(false);
            } else {
                toast.error('수정 실패: ' + res.error);
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* 일괄 작업 툴바 */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-sm text-indigo-900 font-medium">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold animate-pulse">
                            {selectedIds.length}
                        </span>
                        개의 포스트가 선택되었습니다.
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-indigo-700 font-semibold mr-1">상태 일괄 변경:</span>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            onClick={() => handleBulkStatusUpdate('DRAFT')}
                            disabled={isPending}
                        >
                            초안으로 변경
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleBulkStatusUpdate('PUBLISHED')}
                            disabled={isPending}
                        >
                            발행됨으로 변경
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 bg-red-600 hover:bg-red-700 text-white border-none"
                            onClick={() => handleBulkStatusUpdate('HIDDEN')}
                            disabled={isPending}
                        >
                            숨김으로 변경
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-slate-500 hover:text-slate-700 ml-2"
                            onClick={() => setSelectedIds([])}
                            disabled={isPending}
                        >
                            선택 해제
                        </Button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto border rounded-md">
                <TooltipProvider delayDuration={150}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px] pl-4">
                                    <Checkbox
                                        checked={selectedIds.length === posts.length && posts.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>썸네일</TableHead>
                                <TableHead>카테고리</TableHead>
                                <TableHead>제목</TableHead>
                                <TableHead>상태</TableHead>
                                <TableHead>발행자</TableHead>
                                <TableHead>등록일</TableHead>
                                <TableHead className="text-right">관리</TableHead>
                            </TableRow>
                        </TableHeader>
                    <TableBody>
                        {posts.map((post) => (
                            <TableRow
                                key={post.id}
                                className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedIds.includes(post.id) ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : ''}`}
                                onClick={() => handleRowClick(post)}
                            >
                                <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedIds.includes(post.id)}
                                        onCheckedChange={(checked) => handleSelectRow(checked as boolean, post.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    {post.thumbnailUrl ? (
                                        <img
                                            src={post.thumbnailUrl}
                                            alt={post.title}
                                            className="w-12 h-12 object-cover rounded shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">
                                            이미지 없음
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant="outline" 
                                        className={
                                            post.category?.slug === 'tech-marketing' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            post.category?.isLocal ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'
                                        }
                                    >
                                        {post.region?.name ? `${post.region.name} ` : ''}{post.category?.name || '뉴스레터'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium max-w-xs">
                                    <div className="truncate">{post.title}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={post.status === 'PUBLISHED' ? 'default' : post.status === 'HIDDEN' ? 'destructive' : 'secondary'}
                                        className={
                                             post.status === 'PUBLISHED'
                                                 ? 'bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200'
                                                 : post.status === 'HIDDEN'
                                                     ? 'bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200'
                                                     : 'bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200'
                                         }
                                     >
                                         {post.status === 'PUBLISHED' ? '발행됨' : post.status === 'HIDDEN' ? '숨김' : '초안'}
                                     </Badge>
                                 </TableCell>
                                 <TableCell>
                                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] font-medium">
                                          {post.authorName || '진사이트 편집부'}
                                      </Badge>
                                  </TableCell>
                                 <TableCell className="text-slate-500 text-xs font-medium whitespace-nowrap">
                                     {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                                         year: '2-digit',
                                         month: '2-digit',
                                         day: '2-digit'
                                     })}
                                 </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                            title="애널리틱스 리포트"
                                            onClick={() => router.push(`/admin/magazine/edit/${post.id}/analytics`)}
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                            title="포스트 수정"
                                            onClick={() => router.push(`/admin/magazine/edit/${post.id}`)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            title="포스트 삭제"
                                            onClick={(e) => handleDelete(e, post.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </TooltipProvider>
            </div>

            <Sheet open={!!selectedPost} onOpenChange={(open) => {
                if (!open) {
                    setSelectedPost(null);
                    setIsEditing(false);
                }
            }}>
                <SheetContent className="w-full sm:max-w-3xl overflow-hidden p-0 border-l flex flex-col">
                    {selectedPost && (
                        <>
                            <div className="p-6 border-b bg-white flex items-center justify-between">
                                <div className="space-y-1">
                                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                        포스트 상세 정보
                                    </SheetTitle>
                                    <SheetDescription>
                                        매거진 포스트의 내용을 확인하고 수정합니다.
                                    </SheetDescription>
                                </div>
                                <div className="flex gap-2 pr-8">
                                    <Button onClick={() => router.push(`/admin/magazine/edit/${selectedPost.id}`)}>
                                        <Edit className="w-4 h-4 mr-2" /> 수정하기
                                    </Button>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                                <div className="space-y-8 max-w-2xl mx-auto">
                                    {/* Category, Status, Author & Title */}
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">카테고리</Label>
                                            {isEditing ? (
                                                <Select
                                                    value={editForm.categoryId ? String(editForm.categoryId) : ''}
                                                    onValueChange={(val) => setEditForm({ ...editForm, categoryId: Number(val) })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((cat: any) => (
                                                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="p-3 bg-white border rounded-md font-medium text-slate-900">
                                                    {selectedPost.category?.name || '뉴스레터'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">발행 상태</Label>
                                            {isEditing ? (
                                                <Select
                                                    value={editForm.status}
                                                    onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="DRAFT">초안</SelectItem>
                                                        <SelectItem value="PUBLISHED">발행됨</SelectItem>
                                                        <SelectItem value="HIDDEN">숨김</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="p-3 bg-white border rounded-md font-medium text-slate-900">
                                                    {selectedPost.status === 'PUBLISHED' ? '발행됨' : selectedPost.status === 'HIDDEN' ? '숨김' : '초안'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">작성자(발행자)</Label>
                                            {isEditing ? (
                                                <Select
                                                    value={editForm.authorId ? String(editForm.authorId) : 'default'}
                                                    onValueChange={(val) => {
                                                        if (val === 'default') {
                                                            setEditForm({ ...editForm, authorId: null, authorName: '진사이트 편집부' });
                                                        } else {
                                                            const selectedAuthor = authors.find(a => String(a.id) === val);
                                                            if (selectedAuthor) {
                                                                setEditForm({ ...editForm, authorId: selectedAuthor.id, authorName: selectedAuthor.name });
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="default">진사이트 편집부 (기본)</SelectItem>
                                                        {authors.map((author: any) => (
                                                            <SelectItem key={author.id} value={String(author.id)}>
                                                                {author.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="p-3 bg-white border rounded-md font-medium text-slate-900">
                                                    {selectedPost.authorName || '진사이트 편집부'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2 md:col-span-6">
                                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">제목</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={editForm.title}
                                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                />
                                            ) : (
                                                <div className="p-3 bg-white border rounded-md font-medium text-slate-900">{selectedPost.title}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 카테고리 안내 가이드 (수정 모드일 때만 노출) */}
                                    {isEditing && (
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-[11px] text-slate-600 shadow-sm">
                                            <p className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                                                <Info className="w-3.5 h-3.5 text-indigo-500" />
                                                카테고리 안내 가이드
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                <div>
                                                    <span className="font-bold text-blue-600">뉴스레터</span>: 주간 기술 및 트렌드 분석
                                                </div>
                                                <div>
                                                    <span className="font-bold text-purple-600">디지털 마케팅</span>: SEO, GEO를 활용한 디지털 마케팅 분석
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <span className="font-bold text-emerald-600">로컬 3종 (밸리 나우 / SME 그로스 / 마켓 플래시)</span>: 지자체 소식 및 스타트업 인터뷰 (지역 선택 필수)
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Slug */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> 슬러그 (URL)
                                        </Label>
                                        {isEditing ? (
                                            <Input
                                                value={editForm.slug}
                                                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                            />
                                        ) : (
                                            <div className="p-3 bg-white border rounded-md font-mono text-xs text-indigo-600">{selectedPost.slug}</div>
                                        )}
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> 썸네일 이미지
                                        </Label>
                                        {isEditing ? (
                                            <ImageUpload
                                                value={editForm.thumbnailUrl}
                                                onChange={(url) => setEditForm({ ...editForm, thumbnailUrl: url })}
                                                onRemove={() => setEditForm({ ...editForm, thumbnailUrl: '' })}
                                            />
                                        ) : (
                                            <div className="relative group">
                                                {selectedPost.thumbnailUrl ? (
                                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border shadow-sm">
                                                        <img
                                                            src={selectedPost.thumbnailUrl}
                                                            alt="Thumbnail"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-48 bg-slate-100 rounded-lg border border-dashed flex items-center justify-center text-slate-400 italic">
                                                        등록된 이미지가 없습니다.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>



                                    {/* Content */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">본문 내용</Label>
                                        {isEditing ? (
                                            <div className="space-y-6">
                                                <div className="space-y-2 p-4 bg-indigo-50/30 border border-indigo-100 rounded-lg">
                                                    <Label className="font-bold text-indigo-800 text-xs">리드 (Lead) <span className="text-red-500">*</span></Label>
                                                    <Textarea
                                                        className="min-h-[80px] bg-white text-sm"
                                                        value={editForm.lead}
                                                        onChange={(e) => setEditForm({ ...editForm, lead: e.target.value })}
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <Label className="font-bold text-slate-800 text-xs">본문 섹션</Label>
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => setEditForm({ ...editForm, bodies: [...editForm.bodies, { title: '', content: '' }] })}
                                                            className="h-7 text-xs bg-white border-dashed text-indigo-600 hover:text-indigo-700"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" /> 추가
                                                        </Button>
                                                    </div>
                                                    
                                                    {editForm.bodies.map((body: any, index: number) => (
                                                        <div key={index} className="p-4 border rounded-lg bg-white relative">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <h5 className="text-xs font-bold text-slate-600">섹션 {index + 1}</h5>
                                                                {editForm.bodies.length > 1 && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => setEditForm({
                                                                            ...editForm,
                                                                            bodies: editForm.bodies.filter((_: any, i: number) => i !== index)
                                                                        })}
                                                                        className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-1"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <div className="space-y-3">
                                                                <Input
                                                                    placeholder="소제목"
                                                                    value={body.title}
                                                                    onChange={(e) => {
                                                                        const newBodies = [...editForm.bodies];
                                                                        newBodies[index].title = e.target.value;
                                                                        setEditForm({ ...editForm, bodies: newBodies });
                                                                    }}
                                                                    className="h-8 text-sm"
                                                                />
                                                                <Textarea
                                                                    placeholder="본문 내용"
                                                                    value={body.content}
                                                                    onChange={(e) => {
                                                                        const newBodies = [...editForm.bodies];
                                                                        newBodies[index].content = e.target.value;
                                                                        setEditForm({ ...editForm, bodies: newBodies });
                                                                    }}
                                                                    className="min-h-[120px] text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                                    <Label className="font-bold text-slate-800 text-xs">클로징 (Closing) <span className="text-red-500">*</span></Label>
                                                    <Textarea
                                                        className="min-h-[80px] bg-white text-sm"
                                                        value={editForm.closing}
                                                        onChange={(e) => setEditForm({ ...editForm, closing: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-white border rounded-md prose prose-sm max-w-none text-slate-700">
                                                {(() => {
                                                    try {
                                                        const parsed = JSON.parse(selectedPost.content);
                                                        if (!parsed.lead && !parsed.bodies?.length && !parsed.closing) {
                                                            throw new Error('Not structured');
                                                        }
                                                        return (
                                                            <div className="space-y-6">
                                                                {parsed.lead && (
                                                                    <div className="italic text-slate-500 border-l-4 border-indigo-200 pl-4 py-2 bg-indigo-50/30 rounded-r-md">
                                                                        {parsed.lead}
                                                                    </div>
                                                                )}
                                                                {parsed.bodies?.map((b: any, i: number) => (
                                                                    <div key={i} className="space-y-3">
                                                                        <h5 className="font-bold text-base text-indigo-900 flex items-center gap-2">
                                                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px]">{i + 1}</span>
                                                                            {b.title}
                                                                        </h5>
                                                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{b.content}</div>
                                                                    </div>
                                                                ))}
                                                                {parsed.closing && (
                                                                    <div className="pt-6 border-t font-medium text-indigo-600/80 text-sm italic">
                                                                        {parsed.closing}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    } catch (e) {
                                                        return <div className="whitespace-pre-wrap">{selectedPost.content}</div>;
                                                    }
                                                })()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    {!isEditing && (
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-3.5 h-3.5" />
                                                총 조회수: <span className="font-bold text-slate-900">{selectedPost.viewCount}회</span>
                                            </div>
                                            <div>
                                                생성 일시: <span className="font-bold text-slate-900">{new Date(selectedPost.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
