'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, X, Building2, Loader2, Info } from 'lucide-react';
import { searchOrganizations, createOrganizationInline } from '@/actions/company-actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Organization {
    id: number;
    company_name: string;
}

interface OrganizationSelectorProps {
    selected: Organization[];
    onChange: (selected: Organization[]) => void;
    currentRegionId?: number;
}

export default function OrganizationSelector({ selected, onChange, currentRegionId }: OrganizationSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Organization[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // 인라인 등록 폼 상태
    const [newOrg, setNewOrg] = useState({
        company_name: '',
        ceo_name: '',
        founded_year: '',
        hq_location: '',
        entity_type: '기업',
        region_id: currentRegionId || 1
    });

    // 디바운스 검색 구현
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchOrganizations(searchQuery);
                // 이미 선택된 조직은 검색 결과에서 필터링
                const filtered = results.filter(
                    (r: any) => !selected.some((s) => s.id === r.id)
                );
                setSearchResults(filtered);
            } catch (err) {
                console.error('Error searching organizations:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, selected]);

    // 조직 선택 추가
    const handleSelect = (org: Organization) => {
        if (!selected.some((s) => s.id === org.id)) {
            const updated = [...selected, org];
            onChange(updated);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    // 조직 제거
    const handleRemove = (id: number) => {
        const updated = selected.filter((s) => s.id !== id);
        onChange(updated);
    };

    // 인라인 조직 생성 및 추가
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrg.company_name.trim()) {
            toast.error('회사명을 입력해주세요.');
            return;
        }

        setIsCreating(true);
        try {
            const res = await createOrganizationInline(newOrg);
            if (res.success && res.organization) {
                toast.success('새 조직이 등록되었습니다.');
                const createdOrg = {
                    id: res.organization.id,
                    company_name: res.organization.company_name
                };
                onChange([...selected, createdOrg]);
                setIsCreateOpen(false);
                setSearchQuery('');
                // 폼 리셋
                setNewOrg({
                    company_name: '',
                    ceo_name: '',
                    founded_year: '',
                    hq_location: '',
                    entity_type: '기업',
                    region_id: currentRegionId || 1
                });
            } else {
                toast.error(res.error || '조직 등록에 실패했습니다.');
            }
        } catch (err: any) {
            toast.error(err.message || '오류가 발생했습니다.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* 연결된 조직 칩 목록 */}
            <div className="flex flex-wrap gap-2">
                {selected.map((org) => (
                    <div
                        key={org.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg shadow-2xs"
                    >
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{org.company_name}</span>
                        <button
                            type="button"
                            onClick={() => handleRemove(org.id)}
                            className="text-indigo-400 hover:text-indigo-600 transition-colors focus:outline-none ml-0.5"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                {selected.length === 0 && (
                    <p className="text-xs text-slate-400 py-1">연결된 인사이트 레이더 조직이 없습니다.</p>
                )}
            </div>

            {/* 검색 및 제어창 */}
            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="인사이트 레이더 기업/기관 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white border-slate-200"
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setNewOrg((prev) => ({ ...prev, company_name: searchQuery }));
                            setIsCreateOpen(true);
                        }}
                        className="bg-white border-slate-200 gap-1 text-xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        직접 생성
                    </Button>
                </div>

                {/* 검색 결과 드롭다운 */}
                {searchResults.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {searchResults.map((org) => (
                            <button
                                key={org.id}
                                type="button"
                                onClick={() => handleSelect(org)}
                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors flex items-center gap-2"
                            >
                                <Building2 className="w-4 h-4 text-slate-400" />
                                {org.company_name}
                            </button>
                        ))}
                    </div>
                )}
                {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center text-xs text-slate-500">
                        검색 결과가 없습니다.
                        <button
                            type="button"
                            onClick={() => {
                                setNewOrg((prev) => ({ ...prev, company_name: searchQuery }));
                                setIsCreateOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold ml-1.5 underline"
                        >
                            &apos;{searchQuery}&apos; 새 조직으로 인라인 등록하기
                        </button>
                    </div>
                )}
            </div>

            {/* 신규 조직 인라인 등록 모달 */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-slate-800">새 조직 인라인 등록</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-1">
                                인사이트 레이더에 존재하지 않는 새로운 기업/기관 정보를 최소 사양으로 즉시 생성합니다.
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
                                    <Label htmlFor="hq_location" className="text-xs font-bold text-slate-700">소재지 (주소)</Label>
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

                            <div className="space-y-1.5">
                                <Label htmlFor="entity_type" className="text-xs font-bold text-slate-700">조직 유형</Label>
                                <Select
                                    value={newOrg.entity_type}
                                    onValueChange={(val) => setNewOrg({ ...newOrg, entity_type: val })}
                                >
                                    <SelectTrigger id="entity_type" className="bg-white border-slate-200">
                                        <SelectValue placeholder="유형 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="기업">일반 기업 (Enterprise)</SelectItem>
                                        <SelectItem value="대학/교육기관">대학/교육기관 (Educational)</SelectItem>
                                        <SelectItem value="진흥원/공공기관">진흥원/공공기관 (Public)</SelectItem>
                                        <SelectItem value="기타">기타 (Others)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                className="bg-white border-slate-200 text-xs"
                                disabled={isCreating}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
                                disabled={isCreating}
                            >
                                {isCreating && <Loader2 className="w-3 h-3 animate-spin" />}
                                등록 및 연결
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
