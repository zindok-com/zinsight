'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Info, X } from 'lucide-react';
import { createOrganizationInline } from '@/actions/company-actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CreateOrganizationButton({ regions = [] }: { regions?: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    const [newOrg, setNewOrg] = useState<{
        company_name: string;
        slug: string;
        ceo_name: string;
        founded_year: string;
        hq_location: string;
        entity_type: string;
        region_id: number;
        backlinks: Array<{ title: string; url: string }>;
    }>({
        company_name: '',
        slug: '',
        ceo_name: '',
        founded_year: '',
        hq_location: '',
        entity_type: '기업',
        region_id: 1, // Default
        backlinks: [{ title: '홈페이지 바로가기', url: '' }],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrg.company_name.trim()) {
            toast.error('회사명을 입력해주세요.');
            return;
        }

        setIsCreating(true);
        try {
            const cleanBacklinks = newOrg.backlinks
                .filter((item) => item.title.trim() !== '' && item.url.trim() !== '')
                .slice(0, 3);

            const res = await createOrganizationInline({
                ...newOrg,
                backlinks: cleanBacklinks,
            });
            if (res.success && res.organization) {
                toast.success('새 조직이 등록되었습니다.');
                setIsOpen(false);
                setNewOrg({
                    company_name: '',
                    slug: '',
                    ceo_name: '',
                    founded_year: '',
                    hq_location: '',
                    entity_type: '기업',
                    region_id: 1,
                    backlinks: [{ title: '홈페이지 바로가기', url: '' }],
                });
                router.refresh();
            } else {
                toast.error(res.error || '등록에 실패했습니다.');
            }
        } catch (err) {
            console.error('Error creating organization:', err);
            toast.error('오류가 발생했습니다.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2">
                    <Plus className="w-4 h-4" />
                    새 조직 등록
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-800">새 조직 등록</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-1">
                            데이터베이스에 새로운 기업/기관 정보를 생성합니다.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Label htmlFor="company_name" className="text-xs font-bold text-slate-700">회사명/기관명 <span className="text-red-500">*</span></Label>
                                <span title="조직의 정식 명칭을 입력하세요. (예: 삼성전자, 한국과학기술연구원)" className="cursor-help inline-flex items-center">
                                    <Info className="w-3.5 h-3.5 text-slate-400" />
                                </span>
                            </div>
                            <Input
                                id="company_name"
                                value={newOrg.company_name}
                                onChange={(e) => setNewOrg({ ...newOrg, company_name: e.target.value })}
                                required
                                className="bg-white border-slate-200"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Label htmlFor="slug" className="text-xs font-bold text-slate-700">URL 슬러그</Label>
                                <span title="인사이트 레이더 고유 주소에 사용됩니다. (입력하지 않으면 자동 생성)" className="cursor-help inline-flex items-center">
                                    <Info className="w-3.5 h-3.5 text-slate-400" />
                                </span>
                            </div>
                            <Input
                                id="slug"
                                value={newOrg.slug}
                                onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                                placeholder="비워둘 경우 회사명 기반으로 자동 생성됩니다."
                                className="bg-white border-slate-200 font-mono text-xs"
                            />
                        </div>

                        {/* 외부 백링크 입력 (최대 3개) */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-700">외부 백링크 (최대 3개)</Label>
                                {newOrg.backlinks.length < 3 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[11px] text-indigo-600 hover:text-indigo-700 p-0"
                                        onClick={() => setNewOrg({ ...newOrg, backlinks: [...newOrg.backlinks, { title: '', url: '' }] })}
                                    >
                                        + 추가
                                    </Button>
                                )}
                            </div>
                            {newOrg.backlinks.map((link, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        placeholder="표시 텍스트 (예: 홈페이지)"
                                        value={link.title}
                                        onChange={(e) => {
                                            const next = [...newOrg.backlinks];
                                            next[idx] = { ...next[idx], title: e.target.value };
                                            setNewOrg({ ...newOrg, backlinks: next });
                                        }}
                                        className="w-2/5 text-xs bg-white border-slate-200"
                                    />
                                    <Input
                                        placeholder="URL (https://...)"
                                        value={link.url}
                                        onChange={(e) => {
                                            const next = [...newOrg.backlinks];
                                            next[idx] = { ...next[idx], url: e.target.value };
                                            setNewOrg({ ...newOrg, backlinks: next });
                                        }}
                                        className="flex-1 text-xs bg-white border-slate-200"
                                    />
                                    {newOrg.backlinks.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500"
                                            onClick={() => {
                                                const next = newOrg.backlinks.filter((_, i) => i !== idx);
                                                setNewOrg({ ...newOrg, backlinks: next });
                                            }}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                    <Label htmlFor="ceo_name" className="text-xs font-bold text-slate-700">대표자</Label>
                                    <span title="조직을 대표하는 인물의 이름을 입력하세요. (예: 홍길동)" className="cursor-help inline-flex items-center">
                                        <Info className="w-3.5 h-3.5 text-slate-400" />
                                    </span>
                                </div>
                                <Input
                                    id="ceo_name"
                                    value={newOrg.ceo_name}
                                    onChange={(e) => setNewOrg({ ...newOrg, ceo_name: e.target.value })}
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                    <Label htmlFor="founded_year" className="text-xs font-bold text-slate-700">설립연도</Label>
                                    <span title="조직이 설립된 연도를 4자리 숫자로 기입하세요. (예: 2024)" className="cursor-help inline-flex items-center">
                                        <Info className="w-3.5 h-3.5 text-slate-400" />
                                    </span>
                                </div>
                                <Input
                                    id="founded_year"
                                    value={newOrg.founded_year}
                                    onChange={(e) => setNewOrg({ ...newOrg, founded_year: e.target.value })}
                                    className="bg-white border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Label htmlFor="hq_location" className="text-xs font-bold text-slate-700">본사 위치</Label>
                                <span title="조직의 본사나 주요 위치를 간략히 입력하세요. (예: 서울시 강남구)" className="cursor-help inline-flex items-center">
                                    <Info className="w-3.5 h-3.5 text-slate-400" />
                                </span>
                            </div>
                            <Input
                                id="hq_location"
                                value={newOrg.hq_location}
                                onChange={(e) => setNewOrg({ ...newOrg, hq_location: e.target.value })}
                                className="bg-white border-slate-200"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">구분</Label>
                                <Select
                                    value={newOrg.entity_type}
                                    onValueChange={(val) => setNewOrg({ ...newOrg, entity_type: val })}
                                >
                                    <SelectTrigger className="bg-white border-slate-200 text-sm h-10">
                                        <SelectValue placeholder="구분 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="기업">기업</SelectItem>
                                        <SelectItem value="스타트업">스타트업</SelectItem>
                                        <SelectItem value="기관">기관</SelectItem>
                                        <SelectItem value="연구소">연구소</SelectItem>
                                        <SelectItem value="학교">학교</SelectItem>
                                        <SelectItem value="비영리">비영리</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {regions && regions.length > 0 && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">지역 소속</Label>
                                    <Select
                                        value={newOrg.region_id.toString()}
                                        onValueChange={(val) => setNewOrg({ ...newOrg, region_id: parseInt(val) })}
                                    >
                                        <SelectTrigger className="bg-white border-slate-200 text-sm h-10">
                                            <SelectValue placeholder="지역 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {regions.map((region) => (
                                                <SelectItem key={region.id} value={region.id.toString()}>
                                                    {region.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isCreating} className="h-9 px-4 text-xs">
                            취소
                        </Button>
                        <Button type="submit" disabled={isCreating} className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-xs">
                            {isCreating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                            등록 완료
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
