'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getRedirects, createRedirect, deleteRedirect } from '@/actions/admin/redirect-actions';
import { toast } from 'sonner';
import { Trash2, Plus, RefreshCw, ArrowRight, ExternalLink } from 'lucide-react';

export default function RedirectsPage() {
    const [redirects, setRedirects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [sourcePath, setSourcePath] = useState('');
    const [targetPath, setTargetPath] = useState('');
    const [permanent, setPermanent] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadRedirects();
    }, []);

    const loadRedirects = async () => {
        setLoading(true);
        const res = await getRedirects();
        if (res.success) {
            setRedirects(res.data || []);
        } else {
            toast.error(res.error || '리다이렉트 목록을 가져오지 못했습니다.');
        }
        setLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourcePath || !targetPath) {
            toast.error('이전 경로와 이동할 경로를 모두 입력하세요.');
            return;
        }

        setSubmitting(true);
        const res = await createRedirect(sourcePath, targetPath, permanent);
        if (res.success) {
            toast.success('리다이렉트 규칙이 추가되었습니다.');
            setSourcePath('');
            setTargetPath('');
            loadRedirects();
        } else {
            toast.error(res.error || '등록 중 오류가 발생했습니다.');
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('정말 이 리다이렉트 규칙을 삭제하시겠습니까?')) return;
        
        const res = await deleteRedirect(id);
        if (res.success) {
            toast.success('규칙이 삭제되었습니다.');
            loadRedirects();
        } else {
            toast.error(res.error || '삭제 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">URL 리다이렉트 관리</h1>
                <p className="text-muted-foreground mt-1">포스트 주소 변경이나 카테고리 구조 개편 시, 구글 SEO 유실을 방지하기 위한 308/307 리다이렉트를 관리합니다.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 등록 폼 */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">새 리다이렉트 등록</CardTitle>
                            <CardDescription>지자체 확장이나 카테고리 개편 등으로 유실될 주소의 대체 경로를 지정합니다.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">이전 주소 (Source Path)</label>
                                    <Input
                                        placeholder="/magazine/old-post-url"
                                        value={sourcePath}
                                        onChange={(e) => setSourcePath(e.target.value)}
                                        disabled={submitting}
                                    />
                                    <p className="text-[11px] text-muted-foreground">도메인을 제외한 "/"로 시작하는 경로를 입력하세요.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">이동할 주소 (Target Path / URL)</label>
                                    <Input
                                        placeholder="/magazine/tech-marketing/new-post-url"
                                        value={targetPath}
                                        onChange={(e) => setTargetPath(e.target.value)}
                                        disabled={submitting}
                                    />
                                    <p className="text-[11px] text-muted-foreground">내부 경로는 "/"로 시작하며, 외부 링크의 경우 전체 URL을 입력합니다.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">리다이렉트 방식</label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={permanent ? 'true' : 'false'}
                                        onChange={(e) => setPermanent(e.target.value === 'true')}
                                        disabled={submitting}
                                    >
                                        <option value="true">308 영구 리다이렉트 (SEO 점수 보존 추천)</option>
                                        <option value="false">307 임시 리다이렉트</option>
                                    </select>
                                </div>

                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting}>
                                    <Plus className="w-4 h-4 mr-2" /> 규칙 추가
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* 목록 테이블 */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg">등록된 리다이렉트 규칙 목록</CardTitle>
                                <CardDescription>현재 시스템에 생성된 총 {redirects.length}개의 리다이렉트 규칙입니다.</CardDescription>
                            </div>
                            <Button variant="outline" size="icon" onClick={loadRedirects} disabled={loading}>
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-10 text-muted-foreground">로딩 중...</div>
                            ) : redirects.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">등록된 리다이렉트 규칙이 없습니다.</div>
                            ) : (
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>이전 주소</TableHead>
                                                <TableHead className="w-[30px]"></TableHead>
                                                <TableHead>이동할 주소</TableHead>
                                                <TableHead className="w-[80px]">구분</TableHead>
                                                <TableHead className="w-[50px] text-right"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {redirects.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell className="font-mono text-xs break-all max-w-[200px]">
                                                        {row.sourcePath}
                                                    </TableCell>
                                                    <TableCell>
                                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs break-all max-w-[200px]">
                                                        <span className="flex items-center gap-1">
                                                            {row.targetPath}
                                                            {row.targetPath.startsWith('http') && (
                                                                <a href={row.targetPath} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600">
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${row.permanent ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                            {row.permanent ? '308 (영구)' : '307 (임시)'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(row.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
