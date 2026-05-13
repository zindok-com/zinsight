'use client';

import { useState, useTransition } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Trash2, Edit, Save, X, Loader2, FileText, Globe, Image as ImageIcon } from 'lucide-react';
import { deleteMagazinePost, updateMagazinePost } from '@/actions/magazine-actions';
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

export function MagazineListTable({ posts, industries }: { posts: any[], industries: any[] }) {
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [editForm, setEditForm] = useState<any>({});

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
        
        let rawContent = post.content;
        try {
            // JSON 형태라면 마커 기반의 텍스트로 복원하여 편집 가능하게 함
            const parsed = JSON.parse(post.content);
            if (parsed.lead || parsed.bodies || parsed.closing) {
                rawContent = `**(리드)**\n${parsed.lead || ''}\n\n`;
                parsed.bodies?.forEach((b: any, i: number) => {
                    rawContent += `**(본문 ${i + 1} — ${b.title})**\n${b.content}\n\n`;
                });
                if (parsed.closing) {
                    rawContent += `**(클로징)**\n${parsed.closing}`;
                }
            }
        } catch (e) {
            // JSON이 아니라면 기존 텍스트 그대로 사용
        }

        setEditForm({
            title: post.title,
            slug: post.slug,
            category: post.category,
            content: rawContent,
            thumbnailUrl: post.thumbnailUrl || '',
            status: post.status,
            industryIds: post.industries.map((mi: any) => mi.industryId)
        });
    };

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateMagazinePost(selectedPost.id, editForm);
            if (res.success) {
                toast.success('포스트가 수정되었습니다.');
                setSelectedPost({ ...selectedPost, ...editForm, industries: editForm.industryIds.map((id: number) => ({
                    industryId: id,
                    industry: industries.find(ind => ind.id === id)
                })) });
                setIsEditing(false);
            } else {
                toast.error('수정 실패: ' + res.error);
            }
        });
    };

    const toggleIndustry = (id: number) => {
        setEditForm((prev: any) => ({
            ...prev,
            industryIds: prev.industryIds.includes(id) 
                ? prev.industryIds.filter((i: number) => i !== id) 
                : [...prev.industryIds, id]
        }));
    };

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>썸네일</TableHead>
                            <TableHead>카테고리</TableHead>
                            <TableHead>제목</TableHead>
                            <TableHead>연결 산업군</TableHead>
                            <TableHead>상태</TableHead>
                            <TableHead>조회수</TableHead>
                            <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {posts.map((post) => (
                            <TableRow 
                                key={post.id} 
                                className="cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => handleRowClick(post)}
                            >
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
                                    <Badge variant="outline" className={post.category === 'DEEP_DIVE' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                                        {post.category === 'DEEP_DIVE' ? '심층 분석' : '뉴스레터'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium max-w-xs truncate">
                                    {post.title}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {post.industries.map((mi: any) => (
                                            <Badge key={mi.industryId} variant="outline" className="text-[10px]">
                                                {mi.industry.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}
                                        className={post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : ''}
                                    >
                                        {post.status === 'PUBLISHED' ? '발행됨' : '초안'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Eye className="w-3 h-3" />
                                        {post.viewCount}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                                    {!isEditing ? (
                                        <Button onClick={() => setIsEditing(true)}>
                                            <Edit className="w-4 h-4 mr-2" /> 수정하기
                                        </Button>
                                    ) : (
                                        <>
                                            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>
                                                <X className="w-4 h-4 mr-2" /> 취소
                                            </Button>
                                            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={isPending}>
                                                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 저장하기
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                                <div className="space-y-8 max-w-2xl mx-auto">
                                    {/* Category & Title */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">카테고리</Label>
                                            {isEditing ? (
                                                <Select 
                                                    value={editForm.category} 
                                                    onValueChange={(val) => setEditForm({...editForm, category: val})}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NEWSLETTER">뉴스레터</SelectItem>
                                                        <SelectItem value="DEEP_DIVE">심층 분석</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="p-3 bg-white border rounded-md font-medium text-slate-900">
                                                    {selectedPost.category === 'DEEP_DIVE' ? '심층 분석' : '뉴스레터'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">제목</Label>
                                            {isEditing ? (
                                                <Input 
                                                    value={editForm.title}
                                                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                                />
                                            ) : (
                                                <div className="p-3 bg-white border rounded-md font-medium text-slate-900">{selectedPost.title}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Slug */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> 슬러그 (URL)
                                        </Label>
                                        {isEditing ? (
                                            <Input 
                                                value={editForm.slug}
                                                onChange={(e) => setEditForm({...editForm, slug: e.target.value})}
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
                                                onChange={(url) => setEditForm({...editForm, thumbnailUrl: url})}
                                                onRemove={() => setEditForm({...editForm, thumbnailUrl: ''})}
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

                                    {/* Industries */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">연결 산업군</Label>
                                        {isEditing ? (
                                            <div className="grid grid-cols-2 gap-2 p-4 border rounded-md bg-white">
                                                {industries.map((ind) => (
                                                    <div key={ind.id} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`edit-ind-${ind.id}`}
                                                            checked={editForm.industryIds.includes(ind.id)}
                                                            onCheckedChange={() => toggleIndustry(ind.id)}
                                                        />
                                                        <label htmlFor={`edit-ind-${ind.id}`} className="text-xs font-medium cursor-pointer">
                                                            {ind.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedPost.industries.map((mi: any) => (
                                                    <Badge key={mi.industryId} variant="secondary" className="px-3 py-1">
                                                        {mi.industry.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">본문 내용</Label>
                                        {isEditing ? (
                                            <Textarea 
                                                value={editForm.content}
                                                onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                                                className="min-h-[400px] bg-white"
                                            />
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
                                                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px]">{i+1}</span>
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
