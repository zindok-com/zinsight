'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getRegionsAdmin, createRegionAdmin, updateRegionAdmin, deleteRegionAdmin } from '@/actions/admin/region-actions';
import { toast } from 'sonner';
import { Trash2, Plus, RefreshCw, Edit2, Check, X, ShieldAlert } from 'lucide-react';

export default function RegionsPage() {
    const [regions, setRegions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // 등록 폼 상태
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 수정 상태
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editActive, setEditActive] = useState(true);

    useEffect(() => {
        loadRegions();
    }, []);

    const loadRegions = async () => {
        setLoading(true);
        const res = await getRegionsAdmin();
        if (res.success) {
            setRegions(res.data || []);
            if (res.error) {
                toast.warning(res.error);
            }
        } else {
            toast.error('지자체 목록을 불러오지 못했습니다.');
        }
        setLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !slug) {
            toast.error('이름과 영문 슬러그를 모두 입력하세요.');
            return;
        }

        setSubmitting(true);
        const res = await createRegionAdmin(name, slug);
        if (res.success) {
            toast.success('신규 지자체가 등록되었습니다.');
            setName('');
            setSlug('');
            loadRegions();
        } else {
            toast.error(res.error || '등록 중 오류가 발생했습니다.');
        }
        setSubmitting(false);
    };

    const handleStartEdit = (reg: any) => {
        setEditingId(reg.id);
        setEditName(reg.name);
        setEditSlug(reg.slug);
        setEditActive(reg.isActive);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async (id: number) => {
        if (!editName || !editSlug) {
            toast.error('이름과 슬러그는 필수 입력 사항입니다.');
            return;
        }

        const res = await updateRegionAdmin(id, editName, editSlug, editActive);
        if (res.success) {
            toast.success('지자체 정보가 수정되었습니다.');
            setEditingId(null);
            loadRegions();
        } else {
            toast.error(res.error || '수정 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`정말 "${name}" 지면을 완전히 삭제하시겠습니까? 연결된 기사들은 지자체 정보가 '선택 없음'으로 초기화됩니다.`)) return;

        const res = await deleteRegionAdmin(id);
        if (res.success) {
            toast.success('지자체가 성공적으로 삭제되었습니다.');
            loadRegions();
        } else {
            toast.error(res.error || '삭제 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">지자체(지역) 지면 관리</h1>
                <p className="text-muted-foreground mt-1">로컬 비즈니스 허브에서 분기할 전국 지자체(B2G) 지역 목록을 개설하고 관리합니다.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 지자체 등록 폼 */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">신규 지자체 개설</CardTitle>
                            <CardDescription>새로운 특화 지자체 지면을 개설합니다. 슬러그는 URL 주소로 사용됩니다.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">지자체 명칭</label>
                                    <Input
                                        placeholder="예: 안양시, 성남시, 부산시"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={submitting}
                                    />
                                    <p className="text-[11px] text-muted-foreground">대외적으로 표시될 한국어 지자체명을 기입합니다.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">영문 슬러그 (Slug)</label>
                                    <Input
                                        placeholder="예: anyang, seongnam, busan"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        disabled={submitting}
                                    />
                                    <p className="text-[11px] text-muted-foreground">URL 주소로 쓰일 소문자 영문(특수문자 제외)을 입력합니다.</p>
                                </div>

                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting}>
                                    <Plus className="w-4 h-4 mr-2" /> 지면 개설
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* 지자체 목록 */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg">개설된 지자체 목록</CardTitle>
                                <CardDescription>현재 생성되어 서비스 중인 전국 지자체 정보 목록입니다.</CardDescription>
                            </div>
                            <Button variant="outline" size="icon" onClick={loadRegions} disabled={loading}>
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-10 text-muted-foreground">로딩 중...</div>
                            ) : regions.length === 0 ? (
                                <div className="text-center py-10 border border-dashed rounded-lg bg-slate-50 text-muted-foreground flex flex-col items-center justify-center p-6">
                                    <ShieldAlert className="w-8 h-8 text-amber-500 mb-2" />
                                    <p className="text-sm font-semibold text-slate-700">생성된 지자체가 없습니다.</p>
                                    <p className="text-xs text-slate-500 mt-1">왼쪽 개설 폼을 이용해 안양시, 성남시 등을 먼저 등록하세요.</p>
                                </div>
                            ) : (
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>지자체명</TableHead>
                                                <TableHead>영문 슬러그</TableHead>
                                                <TableHead className="w-[100px]">상태</TableHead>
                                                <TableHead className="w-[120px] text-right"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {regions.map((row) => {
                                                const isEditing = editingId === row.id;
                                                return (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="font-semibold">
                                                            {isEditing ? (
                                                                <Input 
                                                                    value={editName} 
                                                                    onChange={(e) => setEditName(e.target.value)}
                                                                    className="h-8 py-1"
                                                                />
                                                            ) : (
                                                                row.name
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-slate-500">
                                                            {isEditing ? (
                                                                <Input 
                                                                    value={editSlug} 
                                                                    onChange={(e) => setEditSlug(e.target.value)}
                                                                    className="h-8 py-1 font-mono text-xs"
                                                                />
                                                            ) : (
                                                                row.slug
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {isEditing ? (
                                                                <select
                                                                    className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none"
                                                                    value={editActive ? 'true' : 'false'}
                                                                    onChange={(e) => setEditActive(e.target.value === 'true')}
                                                                >
                                                                    <option value="true">활성화</option>
                                                                    <option value="false">비활성화</option>
                                                                </select>
                                                            ) : (
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${row.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                                    {row.isActive ? '활성화' : '비활성'}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {isEditing ? (
                                                                <div className="flex justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-50"
                                                                        onClick={() => handleSaveEdit(row.id)}
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                                                        onClick={handleCancelEdit}
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                                                        onClick={() => handleStartEdit(row)}
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() => handleDelete(row.id, row.name)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
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
