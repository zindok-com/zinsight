'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createMagazinePost } from '@/actions/magazine-actions';
import { Loader2, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';

export function MagazineForm({ industries }: { industries: any[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
    
    const now = new Date();
    const [year, setYear] = useState(String(now.getFullYear()));
    const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));

    const [formData, setFormData] = useState<any>({
        title: '',
        slug: '',
        content: '',
        thumbnailUrl: '',
        category: 'NEWSLETTER',
        status: 'PUBLISHED'
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
        
        if (!formData.title || !formData.content) {
            toast.error('제목과 본문을 모두 입력해주세요.');
            return;
        }

        if (selectedIndustries.length === 0) {
            toast.error('최소 하나 이상의 산업군을 선택해주세요.');
            return;
        }

        startTransition(async () => {
            const res = await createMagazinePost({
                ...formData,
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="category">카테고리</Label>
                    <Select 
                        value={formData.category} 
                        onValueChange={(val) => {
                            setFormData({...formData, category: val});
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
                            <SelectItem value="DEEP_DIVE">심층 분석</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">제목</Label>
                    <Input 
                        id="title"
                        placeholder="기사 제목을 입력하세요"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="bg-white"
                        required
                    />
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
                                    className={`flex items-center space-x-2 p-2 rounded transition-colors ${
                                        selectedIndustries.includes(ind.id) ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50'
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
                                onChange={(e) => setFormData({...formData, slug: e.target.value})}
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
                            onChange={(url) => setFormData({...formData, thumbnailUrl: url})}
                            onRemove={() => setFormData({...formData, thumbnailUrl: ''})}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="content" className="font-bold">본문 내용</Label>
                <Textarea 
                    id="content"
                    placeholder="기사 본문 내용을 작성하세요..."
                    className="min-h-[400px] bg-white border-2 text-base leading-relaxed"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    required
                />
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
