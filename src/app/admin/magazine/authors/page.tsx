'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import {
    getAuthors,
    createAuthor,
    updateAuthor,
    deleteAuthor
} from '@/actions/admin/author-actions'; // Wait, let's import it correctly from @/actions/admin/author-actions
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Pencil, Trash2, Globe, FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

type Author = {
    id: number;
    name: string;
    slug: string;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export default function AuthorsPage() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Author | null>(null);
    const [isPending, startTransition] = useTransition();

    // Form states
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bio, setBio] = useState('');

    useEffect(() => {
        reload();
    }, []);

    // Auto slug generation based on name
    useEffect(() => {
        if (!editTarget && name) {
            const autoSlug = name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9가-힣-_]/g, '-')
                .replace(/--+/g, '-');
            setSlug(autoSlug);
        }
    }, [name, editTarget]);

    async function reload() {
        setLoading(true);
        try {
            const data = await getAuthors();
            setAuthors(data as any);
        } catch (e) {
            toast.error('발행자 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }

    const openCreateDialog = () => {
        setEditTarget(null);
        setName('');
        setSlug('');
        setAvatarUrl('');
        setBio('');
        setDialogOpen(true);
    };

    const openEditDialog = (author: Author) => {
        setEditTarget(author);
        setName(author.name);
        setSlug(author.slug);
        setAvatarUrl(author.avatarUrl || '');
        setBio(author.bio || '');
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('이름을 입력해주세요.');
            return;
        }

        if (!slug.trim()) {
            toast.error('슬러그를 입력해주세요.');
            return;
        }

        startTransition(async () => {
            const payload = {
                name,
                slug,
                avatarUrl: avatarUrl || undefined,
                bio: bio || undefined
            };

            let res;
            if (editTarget) {
                res = await updateAuthor(editTarget.id, payload);
            } else {
                res = await createAuthor(payload);
            }

            if (res.success) {
                toast.success(editTarget ? '발행자 프로필이 수정되었습니다.' : '발행자가 성공적으로 등록되었습니다.');
                setDialogOpen(false);
                reload();
            } else {
                toast.error(res.error || '작업 실패');
            }
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('정말 이 발행자를 삭제하시겠습니까?\n해당 발행자가 작성한 기사의 작성자 명은 유지되지만, 클릭 가능한 프로필 페이지 연결은 해제됩니다.')) {
            return;
        }

        try {
            const res = await deleteAuthor(id);
            if (res.success) {
                toast.success('발행자 프로필이 삭제되었습니다.');
                reload();
            } else {
                toast.error(res.error || '삭제 실패');
            }
        } catch (e) {
            toast.error('삭제 처리 중 에러가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-8 w-8 text-indigo-600" /> 발행자(작성자) 관리
                    </h1>
                    <p className="text-muted-foreground mt-1">매거진 기사의 발행자 프로필을 관리합니다.</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                    <Plus className="w-4 h-4 mr-2" /> 새 발행자 등록
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>발행자 목록</CardTitle>
                    <CardDescription>
                        현재 총 {authors.length}명의 발행자가 등록되어 있습니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                            <span>발행자 목록을 불러오는 중...</span>
                        </div>
                    ) : authors.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 border border-dashed rounded-lg bg-slate-50/50">
                            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="font-semibold text-slate-700 mb-1">등록된 발행자가 없습니다.</h3>
                            <p className="text-sm text-slate-400 max-w-sm mx-auto">
                                새 발행자를 등록하여 매거진 글 작성 시 프로필 및 소개 카드를 제공하세요.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {authors.map((author) => (
                                <div
                                    key={author.id}
                                    className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500/10"></div>
                                    <div className="flex items-start gap-4 mb-4">
                                        {author.avatarUrl ? (
                                            <img
                                                src={author.avatarUrl}
                                                alt={author.name}
                                                className="w-14 h-14 rounded-full object-cover border border-slate-100 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-lg shadow-sm">
                                                {author.name.slice(0, 2)}
                                            </div>
                                        )}
                                        <div className="min-w-0 space-y-1">
                                            <h3 className="font-bold text-slate-900 truncate">{author.name}</h3>
                                            <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-mono">
                                                <Globe className="w-3.5 h-3.5" />
                                                <span>/{author.slug}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                                            {author.bio || '등록된 소개글이 없습니다.'}
                                        </p>
                                    </div>
                                    <div className="flex justify-end gap-2 border-t pt-3 mt-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openEditDialog(author)}
                                            className="h-8 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                        >
                                            <Pencil className="w-3.5 h-3.5 mr-1" /> 수정
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(author.id)}
                                            className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-1" /> 삭제
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? '발행자 프로필 수정' : '새 발행자 등록'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">이름 *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="예: 홍길동"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="slug">슬러그 (프로필 URL 식별자) *</Label>
                            <div className="relative">
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="예: gildong-hong"
                                    className="pr-16 font-mono text-sm"
                                    required
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">/author/..</span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                                영어 소문자, 숫자, 하이픈(-)만 가능하며 프로필 주소로 쓰입니다.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label>프로필 이미지</Label>
                            <ImageUpload
                                value={avatarUrl}
                                onChange={(url) => setAvatarUrl(url)}
                                onRemove={() => setAvatarUrl('')}
                                validateWidth={false}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="bio">발행자 소개글</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="발행자의 약력이나 전공 분야 등을 간단하게 요약해주세요."
                                className="min-h-[100px] text-sm leading-relaxed"
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                disabled={isPending}
                            >
                                취소
                            </Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isPending}>
                                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                저장
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
