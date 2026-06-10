'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createMagazinePost } from '@/actions/admin/magazine-actions';
import { Loader2, Info, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';

export function MagazineForm({ industries, authors = [] }: { industries: any[], authors?: any[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);

    const now = new Date();
    const [year, setYear] = useState(String(now.getFullYear()));
    const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));

    const [formData, setFormData] = useState<any>({
        title: '',
        slug: '',
        lead: '',
        bodies: [{ title: '', content: '' }],
        closing: '',
        thumbnailUrl: '',
        category: 'NEWSLETTER',
        status: 'PUBLISHED',
        authorId: null,
        authorName: 'Zinsight 편집부'
    });

    // Real-time slug generation
    useEffect(() => {
        if (formData.category === 'NEWSLETTER' && selectedIndustries.length > 0) {
            const industry = industries.find(i => i.id === selectedIndustries[0]);
            if (industry) {
                const autoSlug = `${year}-${month}-${industry.slug}`;
                setFormData((prev: any) => ({ ...prev, slug: autoSlug }));
            }
        }
    }, [formData.category, year, month, selectedIndustries, industries]);

    const toggleIndustry = (id: number) => {
        if (formData.category === 'NEWSLETTER') {
            setSelectedIndustries([id]);
        } else {
            setSelectedIndustries(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title) {
            toast.error('제목을 입력해주세요.');
            return;
        }

        if (!formData.lead || formData.lead.trim() === '') {
            toast.error('리드(Lead) 내용을 입력해주세요.');
            return;
        }

        if (!formData.closing || formData.closing.trim() === '') {
            toast.error('클로징(Closing) 내용을 입력해주세요.');
            return;
        }

        const validBodies = formData.bodies.filter((b: any) => b.title.trim() !== '' || b.content.trim() !== '');
        if (validBodies.length === 0) {
            toast.error('최소 하나의 본문 섹션을 입력해주세요.');
            return;
        }

        if (selectedIndustries.length === 0) {
            toast.error('최소 하나 이상의 산업군을 선택해주세요.');
            return;
        }

        startTransition(async () => {
            const structuredContent = JSON.stringify({
                lead: formData.lead,
                bodies: validBodies,
                closing: formData.closing
            });

            const res = await createMagazinePost({
                ...formData,
                content: structuredContent,
                slug: formData.slug || undefined,
                industryIds: selectedIndustries
            });

            if (res.success) {
                toast.success('포스트가 성공적으로 등록되었습니다!');
                router.push('/admin/magazine');
            } else {
                toast.error('등록 실패: ' + res.error);
            }
        });
    };

    const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Category & Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="category">카테고리</Label>
                    <Select
                        value={formData.category}
                        onValueChange={(val) => {
                            setFormData({ ...formData, category: val });
                            if (val === 'NEWSLETTER' && selectedIndustries.length > 1) {
                                setSelectedIndustries([selectedIndustries[0]]);
                            }
                        }}
                    >
                        <SelectTrigger id="category" className="bg-white">
                            <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NEWSLETTER">뉴스레터</SelectItem>
                            <SelectItem value="INTELLIGENCE_REPORT">Zinsight 오리지널</SelectItem>
                            <SelectItem value="TECH_AUDIT">무료 진단 사례</SelectItem>
                            <SelectItem value="SALES_SCENARIO">세일즈 가이드</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="authorSelect">작성자(발행자)</Label>
                    <Select
                        value={formData.authorId ? String(formData.authorId) : 'default'}
                        onValueChange={(val) => {
                            if (val === 'default') {
                                setFormData({ ...formData, authorId: null, authorName: 'Zinsight 편집부' });
                            } else {
                                const selectedAuthor = authors.find(a => String(a.id) === val);
                                if (selectedAuthor) {
                                    setFormData({ ...formData, authorId: selectedAuthor.id, authorName: selectedAuthor.name });
                                }
                            }
                        }}
                    >
                        <SelectTrigger id="authorSelect" className="bg-white">
                            <SelectValue placeholder="작성자 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Zinsight 편집부 (기본)</SelectItem>
                            {authors.map((author: any) => (
                                <SelectItem key={author.id} value={String(author.id)}>
                                    {author.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">제목</Label>
                    <Input
                        id="title"
                        placeholder="기사 제목을 입력하세요"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-white"
                        required
                    />
                </div>
            </div>

            {/* 카테고리 안내 가이드 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-xs text-slate-600 shadow-sm">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
                    <Info className="w-4 h-4 text-indigo-500" />
                    카테고리 안내 가이드
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">뉴스레터 (NEWSLETTER)</span>
                        <p className="text-slate-500 pl-1">뉴스레터</p>
                    </div>
                    <div className="space-y-1">
                        <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[11px]">Zinsight 오리지널 (INTELLIGENCE_REPORT)</span>
                        <p className="text-slate-500 pl-1">Zinsight 오리지널 (SEO/GEO 최적화 기업 분석)</p>
                    </div>
                    <div className="space-y-1">
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">무료 진단 사례 (TECH_AUDIT)</span>
                        <p className="text-slate-500 pl-1">AEO/SEO 무료 진단 사례 아카이빙</p>
                    </div>
                    <div className="space-y-1">
                        <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px]">세일즈 가이드 (SALES_SCENARIO)</span>
                        <p className="text-slate-500 pl-1">실전 섭외 명분 및 세일즈 가이드</p>
                    </div>
                </div>
            </div>

            {/* Newsletter Specific: Year/Month */}
            {formData.category === 'NEWSLETTER' && (
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-blue-700">뉴스레터 대상 기간:</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-slate-500">연도</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-24 bg-white h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => <SelectItem key={y} value={y}>{y}년</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-slate-500">월</Label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="w-20 bg-white h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(m => <SelectItem key={m} value={m}>{m}월</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Industry & Slug */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-sm font-bold flex items-center gap-2">
                            연결 산업군
                            {formData.category === 'NEWSLETTER' && (
                                <Badge variant="outline" className="text-[10px] font-normal border-blue-200 text-blue-600">단일 선택</Badge>
                            )}
                        </Label>
                        <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg bg-white shadow-sm min-h-[200px] content-start">
                            {industries.map((ind) => (
                                <div
                                    key={ind.id}
                                    className={`flex items-center space-x-2 p-2 rounded transition-colors ${selectedIndustries.includes(ind.id) ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <Checkbox
                                        id={`ind-${ind.id}`}
                                        checked={selectedIndustries.includes(ind.id)}
                                        onCheckedChange={() => toggleIndustry(ind.id)}
                                    />
                                    <label
                                        htmlFor={`ind-${ind.id}`}
                                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                                    >
                                        {ind.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug" className="font-bold">슬러그 (URL)</Label>
                        <div className="relative">
                            <Input
                                id="slug"
                                placeholder="my-article-slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="bg-white pr-10 font-mono text-sm border-2 focus-visible:ring-indigo-500"
                            />
                            {formData.category === 'NEWSLETTER' && (
                                <div className="absolute right-3 top-2.5">
                                    <Info className="w-4 h-4 text-indigo-400" />
                                </div>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-500 italic">
                            {formData.category === 'NEWSLETTER'
                                ? '대상 기간과 산업군에 따라 자동으로 생성됩니다. 직접 수정도 가능합니다.'
                                : 'URL에 사용될 고유 식별자입니다.'}
                        </p>
                    </div>
                </div>

                {/* Right Column: Thumbnail & Other Info */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="font-bold">썸네일 이미지</Label>
                        <ImageUpload
                            value={formData.thumbnailUrl}
                            onChange={(url) => setFormData({ ...formData, thumbnailUrl: url })}
                            onRemove={() => setFormData({ ...formData, thumbnailUrl: '' })}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold text-slate-800">본문 내용</Label>
                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">구조화된 텍스트 에디터</span>
                </div>
                
                {/* 리드 (Lead) */}
                <div className="space-y-2 p-5 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                    <Label htmlFor="lead" className="font-bold text-indigo-800 text-sm">리드 (Lead) <span className="text-red-500">*</span></Label>
                    <p className="text-[11px] text-indigo-600/80 pb-1">기사의 도입부나 요약을 작성해주세요.</p>
                    <Textarea
                        id="lead"
                        placeholder="리드 내용을 작성하세요..."
                        className="min-h-[100px] bg-white border-indigo-200 focus-visible:ring-indigo-500 text-sm leading-relaxed"
                        value={formData.lead}
                        onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                        required
                    />
                </div>

                {/* 본문 섹션 (Bodies) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2">
                        <div>
                            <Label className="font-bold text-slate-800 text-sm">본문 섹션</Label>
                            <p className="text-[11px] text-slate-500 mt-0.5">최소 1개의 본문 섹션이 필요합니다.</p>
                        </div>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setFormData({ ...formData, bodies: [...formData.bodies, { title: '', content: '' }] })}
                            className="bg-white border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            섹션 추가
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {formData.bodies.map((body: any, index: number) => (
                            <div key={index} className="relative p-5 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:border-slate-300">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-l-xl"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs">
                                            {index + 1}
                                        </span>
                                        섹션 {index + 1}
                                    </h4>
                                    {formData.bodies.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setFormData({
                                                ...formData,
                                                bodies: formData.bodies.filter((_: any, i: number) => i !== index)
                                            })}
                                            className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600">소제목</Label>
                                        <Input
                                            placeholder="섹션의 소제목을 입력하세요"
                                            value={body.title}
                                            onChange={(e) => {
                                                const newBodies = [...formData.bodies];
                                                newBodies[index].title = e.target.value;
                                                setFormData({ ...formData, bodies: newBodies });
                                            }}
                                            className="bg-slate-50/50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600">내용</Label>
                                        <Textarea
                                            placeholder="본문 내용을 작성하세요..."
                                            className="min-h-[150px] bg-slate-50/50 text-sm leading-relaxed"
                                            value={body.content}
                                            onChange={(e) => {
                                                const newBodies = [...formData.bodies];
                                                newBodies[index].content = e.target.value;
                                                setFormData({ ...formData, bodies: newBodies });
                                            }}
                                            required={index === 0}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 클로징 (Closing) */}
                <div className="space-y-2 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                    <Label htmlFor="closing" className="font-bold text-slate-800 text-sm">클로징 (Closing) <span className="text-red-500">*</span></Label>
                    <p className="text-[11px] text-slate-500 pb-1">기사의 맺음말이나 결론을 작성해주세요.</p>
                    <Textarea
                        id="closing"
                        placeholder="클로징 내용을 작성하세요..."
                        className="min-h-[100px] bg-white text-sm leading-relaxed"
                        value={formData.closing}
                        onChange={(e) => setFormData({ ...formData, closing: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-8"
                    onClick={() => router.back()}
                    disabled={isPending}
                >
                    취소
                </Button>
                <Button
                    type="submit"
                    className="h-11 px-10 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : '매거진 포스트 발행'}
                </Button>
            </div>
        </form>
    );
}

// Simple Badge component since it's used inside the form
function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'default' | 'outline', className?: string }) {
    const variants = {
        default: 'bg-slate-900 text-white',
        outline: 'border border-slate-200 text-slate-950'
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
