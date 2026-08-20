'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitOrganizationForm } from '@/actions/company-actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const ENTITY_TYPES = ['기업', '기관', '대학', '센터', '협회', '재단', '조합', '기타'];

interface Backlink { title: string; url: string }

interface Props { token: string }

export function OrgRegisterForm({ token }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        company_name: '',
        entity_type: '기업',
        ceo_name: '',
        founded_year: '',
        hq_location: '',
        company_url: '',
        business_summary: '',
        core_keywords: ['', '', ''],
        backlinks: [{ title: '홈페이지 바로가기', url: '' }] as Backlink[],
    });

    const update = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const updateKeyword = (i: number, val: string) => {
        const kw = [...form.core_keywords];
        kw[i] = val;
        setForm((prev) => ({ ...prev, core_keywords: kw }));
    };

    const updateBacklink = (i: number, field: keyof Backlink, val: string) => {
        const bl = [...form.backlinks];
        bl[i] = { ...bl[i], [field]: val };
        setForm((prev) => ({ ...prev, backlinks: bl }));
    };

    const addBacklink = () => {
        if (form.backlinks.length >= 3) return;
        setForm((prev) => ({ ...prev, backlinks: [...prev.backlinks, { title: '', url: '' }] }));
    };

    const removeBacklink = (i: number) => {
        setForm((prev) => ({ ...prev, backlinks: prev.backlinks.filter((_, idx) => idx !== i) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.company_name.trim()) {
            toast.error('기업명은 필수입니다.');
            return;
        }

        setLoading(true);
        try {
            const cleanKeywords = form.core_keywords.filter((k) => k.trim() !== '');
            const cleanBacklinks = form.backlinks.filter((bl) => bl.url.trim() !== '');

            const res = await submitOrganizationForm(token, {
                ...form,
                core_keywords: cleanKeywords,
                backlinks: cleanBacklinks,
            });

            if (res.success) {
                router.push(`/register/org/${token}/complete`);
            } else {
                const reasonMap: Record<string, string> = {
                    NOT_FOUND: '유효하지 않은 링크입니다.',
                    USED: '이미 제출된 링크입니다.',
                    EXPIRED: '링크가 만료되었습니다.',
                };
                toast.error(reasonMap[res.reason ?? ''] ?? '제출에 실패했습니다.');
            }
        } catch {
            toast.error('오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardContent className="pt-6 space-y-5">
                    <SectionTitle>기본 정보</SectionTitle>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="company_name">
                                기업(기관)명 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="company_name"
                                placeholder="예: 안양시청소년재단"
                                value={form.company_name}
                                onChange={(e) => update('company_name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>기관 유형</Label>
                            <Select value={form.entity_type} onValueChange={(v) => update('entity_type', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ENTITY_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ceo_name">대표자명</Label>
                            <Input
                                id="ceo_name"
                                placeholder="예: 홍길동"
                                value={form.ceo_name}
                                onChange={(e) => update('ceo_name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="founded_year">설립연도</Label>
                            <Input
                                id="founded_year"
                                placeholder="예: 2010"
                                value={form.founded_year}
                                onChange={(e) => update('founded_year', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="hq_location">본사 소재지</Label>
                            <Input
                                id="hq_location"
                                placeholder="예: 경기도 안양시 만안구"
                                value={form.hq_location}
                                onChange={(e) => update('hq_location', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="company_url">공식 홈페이지 URL</Label>
                            <Input
                                id="company_url"
                                type="url"
                                placeholder="https://example.com"
                                value={form.company_url}
                                onChange={(e) => update('company_url', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="business_summary">사업 요약</Label>
                        <Textarea
                            id="business_summary"
                            placeholder="기관의 주요 사업 내용이나 특징을 간략하게 소개해 주세요."
                            rows={4}
                            value={form.business_summary}
                            onChange={(e) => update('business_summary', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <SectionTitle>핵심 키워드 (최대 3개)</SectionTitle>
                    <p className="text-xs text-muted-foreground -mt-2">
                        기관을 대표하는 키워드를 입력해 주세요. 뉴스 수집 및 검색에 활용됩니다.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {form.core_keywords.map((kw, i) => (
                            <div key={i} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">키워드 {i + 1}</Label>
                                <Input
                                    placeholder={`예: ${['스타트업', '기술혁신', '청년'][i]}`}
                                    value={kw}
                                    onChange={(e) => updateKeyword(i, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <SectionTitle>관련 링크 (최대 3개)</SectionTitle>
                    <div className="space-y-3">
                        {form.backlinks.map((bl, i) => (
                            <div key={i} className="flex gap-2 items-start">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                    <Input
                                        placeholder="링크 제목 (예: 홈페이지)"
                                        value={bl.title}
                                        onChange={(e) => updateBacklink(i, 'title', e.target.value)}
                                    />
                                    <Input
                                        type="url"
                                        placeholder="https://"
                                        value={bl.url}
                                        onChange={(e) => updateBacklink(i, 'url', e.target.value)}
                                    />
                                </div>
                                {form.backlinks.length > 1 && (
                                    <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => removeBacklink(i)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {form.backlinks.length < 3 && (
                            <Button type="button" variant="outline" size="sm" onClick={addBacklink} className="gap-1.5">
                                <Plus className="w-3.5 h-3.5" />
                                링크 추가
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="pb-6">
                <Button type="submit" disabled={loading} className="w-full h-12 text-base gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {loading ? '제출 중...' : '조직 정보 제출하기'}
                </Button>
                <p className="text-xs text-center text-gray-400 mt-3">
                    제출된 정보는 담당자가 검토 후 서비스에 등록됩니다.
                </p>
            </div>
        </form>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-sm font-semibold text-gray-900">{children}</h2>;
}