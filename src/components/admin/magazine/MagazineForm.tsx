'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createMagazinePost, updateMagazinePost } from '@/actions/admin/magazine-actions';
import { Loader2, Info, Plus, Trash2, Edit3, Eye, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { StorageImageSelectorModal } from '@/components/admin/storage/StorageImageSelectorModal';
import { LinkInsertModal } from '@/components/admin/magazine/LinkInsertModal';

export function MagazineForm({ 
    industries, 
    authors = [], 
    regions = [],
    categories = [],
    post 
}: { 
    industries: any[], 
    authors?: any[], 
    regions?: any[],
    categories?: any[],
    post?: any 
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [activeTextareaId, setActiveTextareaId] = useState<string | null>(null);
    const [activeLinkTextareaId, setActiveLinkTextareaId] = useState<string | null>(null);

    const insertTextAtCursor = (id: string, textToInsert: string) => {
        const textarea = document.getElementById(id) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        const newValue = value.substring(0, start) + textToInsert + value.substring(end);
        
        // Trigger React state update!
        if (id === 'lead') {
            setFormData((prev: any) => ({ ...prev, lead: newValue }));
        } else if (id === 'closing') {
            setFormData((prev: any) => ({ ...prev, closing: newValue }));
        } else if (id.startsWith('body-')) {
            const index = parseInt(id.split('-')[1]);
            const newBodies = [...formData.bodies];
            newBodies[index].content = newValue;
            setFormData((prev: any) => ({ ...prev, bodies: newBodies }));
        }

        // Put focus back and set cursor position after inserted text
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
        }, 0);
    };

    const handleImageSelect = (url: string) => {
        if (!activeTextareaId) return;
        const markdownImage = `\n![이미지 설명](${url})\n`;
        insertTextAtCursor(activeTextareaId, markdownImage);
        setActiveTextareaId(null);
    };

    const handleInsertLink = (textareaId: string) => {
        setActiveLinkTextareaId(textareaId);
    };

    const handleLinkInsertConfirm = (text: string, url: string) => {
        if (!activeLinkTextareaId) return;
        const markdownLink = `[${text}](${url})`;
        insertTextAtCursor(activeLinkTextareaId, markdownLink);
        setActiveLinkTextareaId(null);
    };

    // Parse content from post if available (handles both structured JSON and legacy text)
    const parsedContent = (() => {
        if (post && post.content) {
            try {
                if (post.content.trim().startsWith('{')) {
                    const parsed = JSON.parse(post.content);
                    return {
                        lead: parsed.lead || '',
                        bodies: parsed.bodies && parsed.bodies.length > 0 
                            ? parsed.bodies 
                            : [{ title: '', content: '' }],
                        closing: parsed.closing || ''
                    };
                } else {
                    return {
                        lead: '',
                        bodies: [{ title: '', content: post.content }],
                        closing: ''
                    };
                }
            } catch (e) {
                console.error('Failed to parse post content:', e);
            }
        }
        return {
            lead: '',
            bodies: [{ title: '', content: '' }],
            closing: ''
        };
    })();

    const [selectedIndustries, setSelectedIndustries] = useState<number[]>(() => {
        if (post && post.industries) {
            return post.industries.map((pi: any) => pi.industryId);
        }
        return [];
    });

    const initialDate = post ? new Date(post.createdAt) : new Date();
    const [year, setYear] = useState(String(initialDate.getFullYear()));
    const [month, setMonth] = useState(String(initialDate.getMonth() + 1).padStart(2, '0'));

    const [formData, setFormData] = useState<any>({
        title: post?.title || '',
        slug: post?.slug || '',
        lead: parsedContent.lead,
        bodies: parsedContent.bodies,
        closing: parsedContent.closing,
        thumbnailUrl: post?.thumbnailUrl || '',
        categoryId: post?.categoryId ? String(post.categoryId) : (categories.find(c => c.slug === 'newsletter')?.id ? String(categories.find(c => c.slug === 'newsletter').id) : ''),
        status: post?.status || 'PUBLISHED',
        authorId: post?.authorId || null,
        authorName: post?.authorName || 'Zinsight 편집부',
        regionId: post?.regionId || null,
        targetKeywords: post?.targetKeywords || '',
        isPaid: post?.isPaid || false
    });

    // Real-time slug generation (Only when creating a new post)
    useEffect(() => {
        if (post) return; // Skip automatic slug generation during edit mode to prevent breaking existing URLs
        const selectedCategory = categories.find(c => String(c.id) === String(formData.categoryId));
        if (selectedCategory?.slug === 'newsletter' && selectedIndustries.length > 0) {
            const industry = industries.find(i => i.id === selectedIndustries[0]);
            if (industry) {
                const autoSlug = `${year}-${month}-${industry.slug}`;
                setFormData((prev: any) => ({ ...prev, slug: autoSlug }));
            }
        }
    }, [formData.categoryId, year, month, selectedIndustries, industries, post, categories]);

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

        startTransition(async () => {
            const structuredContent = JSON.stringify({
                lead: formData.lead,
                bodies: validBodies,
                closing: formData.closing
            });

            if (post) {
                // Edit Mode
                const res = await updateMagazinePost(post.id, {
                    ...formData,
                    categoryId: Number(formData.categoryId),
                    content: structuredContent,
                    industryIds: selectedIndustries
                });

                if (res.success) {
                    toast.success('포스트가 성공적으로 수정되었습니다!');
                    router.push('/admin/magazine');
                } else {
                    toast.error('수정 실패: ' + res.error);
                }
            } else {
                // Create Mode
                const res = await createMagazinePost({
                    ...formData,
                    categoryId: Number(formData.categoryId),
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
            }
        });
    };

    const years = Array.from({ length: 5 }, (_, i) => String((post ? new Date(post.createdAt) : new Date()).getFullYear() - 2 + i));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

    const selectedCategory = categories.find(c => String(c.id) === String(formData.categoryId));
    const isLocal = selectedCategory?.isLocal || false;
    const activeCategorySlug = selectedCategory?.slug;

    // Preview Meta Information Helper
    const categoryLabel = (() => {
        if (!selectedCategory) return 'Newsletter';
        switch (selectedCategory.slug) {
            case 'tech-marketing': return 'Digital Marketing';
            case 'spotlight': return 'Spotlight';
            case 'briefing': return 'Briefing';
            case 'newsletter':
            default:
                return 'Newsletter';
        }
    })();

    const selectedIndustryNames = selectedIndustries
        .map(id => industries.find(i => i.id === id)?.name)
        .filter(Boolean)
        .join(', ');

    return (
        <div className="space-y-6">
            {/* Tab Switched Header */}
            <div className="flex border-b border-slate-200">
                <button
                    type="button"
                    className={`flex items-center gap-1.5 pb-3 text-sm font-semibold px-5 border-b-2 transition-all ${
                        activeTab === 'edit'
                            ? 'border-indigo-600 text-indigo-600 font-bold'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                    onClick={() => setActiveTab('edit')}
                >
                    <Edit3 className="w-4 h-4" />
                    에디터 (Edit)
                </button>
                <button
                    type="button"
                    className={`flex items-center gap-1.5 pb-3 text-sm font-semibold px-5 border-b-2 transition-all ${
                        activeTab === 'preview'
                            ? 'border-indigo-600 text-indigo-600 font-bold'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                    onClick={() => setActiveTab('preview')}
                >
                    <Eye className="w-4 h-4" />
                    미리보기 (Preview)
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {activeTab === 'edit' ? (
                    <div className="space-y-8">
                        {/* Category & Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="category">카테고리</Label>
                                <Select
                                    value={formData.categoryId ? String(formData.categoryId) : ''}
                                    onValueChange={(val) => {
                                        const selectedId = Number(val);
                                        const selectedCat = categories.find(c => c.id === selectedId);
                                        setFormData({ 
                                            ...formData, 
                                            categoryId: val,
                                            regionId: selectedCat?.isLocal ? formData.regionId : null
                                        });
                                        if (selectedCat?.slug === 'newsletter' && selectedIndustries.length > 1) {
                                            setSelectedIndustries([selectedIndustries[0]]);
                                        }
                                    }}
                                >
                                    <SelectTrigger id="category" className="bg-white">
                                        <SelectValue placeholder="카테고리 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat: any) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                {cat.name} ({cat.isLocal ? '로컬' : 'Tech/Mkt'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {isLocal && (
                                <div className="space-y-2">
                                    <Label htmlFor="regionSelect">연계 지역</Label>
                                    <Select
                                        value={formData.regionId ? String(formData.regionId) : 'none'}
                                        onValueChange={(val) => {
                                            setFormData({ ...formData, regionId: val === 'none' ? null : Number(val) });
                                        }}
                                    >
                                        <SelectTrigger id="regionSelect" className="bg-white">
                                            <SelectValue placeholder="지역 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">선택 없음</SelectItem>
                                            {regions.map((reg: any) => (
                                                <SelectItem key={reg.id} value={String(reg.id)}>
                                                    {reg.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
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
                        <div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/10 border border-slate-200 rounded-xl space-y-4 text-xs text-slate-600 shadow-xs">
                            <p className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                                <Info className="w-4 h-4 text-indigo-600" />
                                매거진 카테고리 & URL 라우팅 가이드
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 테크 & 마케팅 지면 그룹 */}
                                <div className="p-4 bg-white border border-slate-100 rounded-lg space-y-3 shadow-2xs">
                                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                                        Core 테크 지면 (URL: <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[11px]">/magazine/tech-marketing/*</code>)
                                    </h4>
                                    <div className="space-y-3 pl-3 border-l border-slate-100">
                                        <div className="space-y-1">
                                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px]">뉴스레터 (NEWSLETTER)</span>
                                            <p className="text-slate-500">주 단위 기술 트렌드 및 요약 분석 지면</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[10px]">디지털 마케팅 (INTELLIGENCE_REPORT)</span>
                                            <p className="text-slate-500">SEO, GEO를 활용한 디지털 마케팅 분석 리포트</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 로컬 비즈니스 지면 그룹 */}
                                <div className="p-4 bg-white border border-slate-100 rounded-lg space-y-3 shadow-2xs">
                                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                        로컬 비즈니스 지면 (URL: <code className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded text-[11px]">/magazine/local/[지자체]/*</code>)
                                    </h4>
                                    <div className="space-y-3 pl-3 border-l border-slate-100">
                                        <div className="space-y-1">
                                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">기업 스포트라이트 (VALLEY_NOW)</span>
                                            <p className="text-slate-500">관내 스타트업, 소상공인, 전통기업 심층 인터뷰 및 성장 성공사례 (기존 '밸리 나우' + 'SME 그로스' 통합)</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded text-[10px]">지원사업 · 정책 브리핑 (LOCAL_SME)</span>
                                            <p className="text-slate-500">관내 및 도 산하 진흥원의 지원사업, 정책자금, 공모전 공고 요약 브리핑 (민간 정보 피드)</p>
                                        </div>
                                        <p className="text-[10px] text-emerald-600 font-semibold mt-1">※ 로컬 기사는 반드시 '연계 지역'을 지정해야 합니다.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Newsletter Specific: Year/Month */}
                        {activeCategorySlug === 'newsletter' && (
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
                                        연결 산업군 <span className="text-xs text-slate-400 font-normal">(선택)</span>
                                        {activeCategorySlug === 'newsletter' && (
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
                                        {activeCategorySlug === 'newsletter' && (
                                            <div className="absolute right-3 top-2.5">
                                                <Info className="w-4 h-4 text-indigo-400" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 italic">
                                        {activeCategorySlug === 'newsletter'
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

                                <div className="space-y-2">
                                    <Label htmlFor="targetKeywords" className="font-bold">핵심 키워드 태그 (쉼표로 구분)</Label>
                                    <Input
                                        id="targetKeywords"
                                        placeholder="예: 인공지능, GEO 마케팅, SEO 최적화"
                                        value={formData.targetKeywords || ''}
                                        onChange={(e) => setFormData({ ...formData, targetKeywords: e.target.value })}
                                        className="bg-white pr-4 font-normal text-sm border-2 focus-visible:ring-indigo-500"
                                    />
                                    <p className="text-[11px] text-slate-500 italic">
                                        기사 상세 페이지 하단에 검색 가능한 태그로 출력됩니다.
                                    </p>
                                </div>

                                {/* 파트너 콘텐츠 토글 */}
                                <div className="space-y-2 p-4 rounded-xl border-2 transition-colors duration-200"
                                    style={{
                                        borderColor: formData.isPaid ? '#fbbf24' : '#e2e8f0',
                                        backgroundColor: formData.isPaid ? '#fffbeb' : '#f8fafc'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="font-bold text-sm flex items-center gap-2">
                                                <span style={{ color: formData.isPaid ? '#b45309' : '#64748b' }}>✦</span>
                                                파트너 콘텐츠 (유료 기사)
                                            </Label>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                활성화 시 기사 상단·카드에 &apos;파트너&apos; 배지가 표시됩니다.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={formData.isPaid}
                                            onClick={() => setFormData({ ...formData, isPaid: !formData.isPaid })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                                                formData.isPaid ? 'bg-amber-400' : 'bg-slate-200'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                                    formData.isPaid ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    {formData.isPaid && (
                                        <p className="text-[11px] text-amber-700 font-medium pt-1 border-t border-amber-200">
                                            ✓ 파트너 배지 활성화 — 기사 헤더 및 카드 목록에 표시됩니다.
                                        </p>
                                    )}
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
                                <div className="flex justify-between items-center pb-1">
                                    <Label htmlFor="lead" className="font-bold text-indigo-800 text-sm">리드 (Lead) <span className="text-red-500">*</span></Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleInsertLink('lead')}
                                            className="h-7 px-2.5 text-xs bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold gap-1"
                                        >
                                            <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                                            링크 삽입
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setActiveTextareaId('lead')}
                                            className="h-7 px-2.5 text-xs bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold gap-1"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                                            보관함 이미지 삽입
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[11px] text-indigo-600/80 pb-1">기사의 도입부나 요약을 작성해주세요. **텍스트** 또는 **{`{텍스트}`}**로 강조할 수 있습니다. 이미지는 단독 줄에 URL을 입력하거나 `![설명](주소)` 형식으로 삽입됩니다.</p>
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
                                                    <div className="flex justify-between items-center pb-1">
                                                        <Label className="text-xs font-semibold text-slate-600">내용</Label>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleInsertLink(`body-${index}`)}
                                                                className="h-7 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                                                            >
                                                                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                                                                링크 삽입
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setActiveTextareaId(`body-${index}`)}
                                                                className="h-7 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                                                            >
                                                                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                                                                보관함 이미지 삽입
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <Textarea
                                                        id={`body-${index}`}
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
                                <div className="flex justify-between items-center pb-1">
                                    <Label htmlFor="closing" className="font-bold text-slate-800 text-sm">클로징 (Closing) <span className="text-red-500">*</span></Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleInsertLink('closing')}
                                            className="h-7 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                                        >
                                            <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                                            링크 삽입
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setActiveTextareaId('closing')}
                                            className="h-7 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                                            보관함 이미지 삽입
                                        </Button>
                                    </div>
                                </div>
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
                    </div>
                ) : (
                    /* High-fidelity Live Preview Mode */
                    <div className="bg-zi-surface text-zi-on-surface p-6 md:p-10 rounded-xl border border-slate-200 shadow-inner max-w-3xl mx-auto space-y-12 min-h-[500px]">
                        {/* Meta Tags & Category */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="font-ui-label text-[11px] uppercase tracking-widest bg-zi-surface-container-highest px-3 py-1.5 rounded-full text-zi-blue font-bold">
                                    {categoryLabel}
                                </span>
                                {selectedIndustryNames && (
                                    <span className="text-zi-outline font-ui-label text-xs font-semibold uppercase tracking-widest">
                                        {selectedIndustryNames}
                                    </span>
                                )}
                            </div>

                            <h1 className="font-h1 text-[32px] md:text-[38px] leading-[1.2] text-zi-primary tracking-tight font-serif font-bold">
                                {formData.title || '제목이 여기에 표시됩니다'}
                            </h1>

                            <div className="flex items-center justify-between border-y border-zi-surface-container py-4 mt-8">
                                <div className="flex items-center gap-4 text-zi-outline text-[13px]">
                                    <span className="text-zi-on-surface font-semibold">
                                        By {formData.authorName}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {new Date().toLocaleDateString('ko-KR', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Thumbnail */}
                        {formData.thumbnailUrl ? (
                            <div className="w-full aspect-[16/9] bg-zi-surface-container-low rounded-zi-card overflow-hidden relative shadow-sm">
                                <img
                                    src={formData.thumbnailUrl}
                                    alt={formData.title}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        ) : (
                            <div className="w-full aspect-[16/9] bg-slate-100 rounded-zi-card flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400 text-sm">
                                <span>썸네일 이미지가 설정되지 않았습니다</span>
                                <span className="text-xs text-slate-300 mt-1">이미지를 올리면 미리보기에 자동으로 렌더링됩니다</span>
                            </div>
                        )}

                        {/* Body Content */}
                        <article className="max-w-none space-y-12">
                            {/* Lead */}
                            {formData.lead ? (
                                <div className="text-[17px] leading-[1.7] text-zi-on-surface border-l-4 border-zi-blue pl-6 py-2 bg-gradient-to-r from-zi-blue/5 to-transparent rounded-r-lg">
                                    <HighlightedText text={formData.lead} />
                                </div>
                            ) : (
                                <div className="text-slate-400 italic text-sm">리드문구가 작성되지 않았습니다.</div>
                            )}

                            {/* Bodies */}
                            {formData.bodies && formData.bodies.map((body: any, idx: number) => {
                                if (!body.title && !body.content) return null;
                                return (
                                    <section key={idx} className="flex flex-col gap-4">
                                        {body.title && (
                                            <h2 className="font-h2 text-[22px] md:text-[24px] text-zi-primary border-b border-zi-surface-container-highest pb-3 flex items-center gap-2 font-semibold">
                                                <span className="text-zi-blue text-[20px] opacity-50 font-serif italic">{(idx + 1).toString().padStart(2, '0')}.</span>
                                                {body.title}
                                            </h2>
                                        )}
                                        {body.content ? (
                                            <div className="text-[15px] leading-relaxed text-zi-on-surface-variant">
                                                <HighlightedText text={body.content} />
                                            </div>
                                        ) : (
                                            <div className="text-slate-300 italic text-xs">내용이 비어 있습니다.</div>
                                        )}
                                    </section>
                                );
                            })}

                            {/* Closing */}
                            {formData.closing ? (
                                <div className="mt-8 p-6 bg-zi-surface-container-low rounded-zi-card border border-zi-surface-container-highest text-[15px]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-zi-blue" />
                                        <span className="font-ui-label text-xs font-bold text-zi-secondary uppercase tracking-widest">
                                            Closing Thoughts
                                        </span>
                                    </div>
                                    <div className="text-zi-on-surface-variant">
                                        <HighlightedText text={formData.closing} />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-400 italic text-sm">클로징 문구가 작성되지 않았습니다.</div>
                            )}
                        </article>
                    </div>
                )}

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 px-8 bg-white"
                        onClick={() => router.back()}
                        disabled={isPending}
                    >
                        취소
                    </Button>
                    <Button
                        type="submit"
                        className="h-11 px-10 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95 text-white font-semibold"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : post ? (
                            '수정 완료'
                        ) : (
                            '매거진 포스트 발행'
                        )}
                    </Button>
                </div>
            </form>

            <StorageImageSelectorModal
                isOpen={activeTextareaId !== null}
                onClose={() => setActiveTextareaId(null)}
                onSelect={handleImageSelect}
            />

            <LinkInsertModal
                isOpen={activeLinkTextareaId !== null}
                onClose={() => setActiveLinkTextareaId(null)}
                onInsert={handleLinkInsertConfirm}
            />
        </div>
    );
}

// Inline custom parser for **text** -> zi-blue and **{text}** -> zi-blue + underline
function HighlightedText({ text }: { text: string }) {
    if (!text) return null;
    
    // Split by newline to preserve paragraph layout
    const lines = text.split('\n');
    
    return (
        <>
            {lines.map((line, lineIdx) => {
                // 1. Markdown 이미지 형식 매칭 (![alt](url))
                const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
                if (imgMatch) {
                    const alt = imgMatch[1];
                    const url = imgMatch[2];
                    return (
                        <span key={lineIdx} className="block my-6 text-center">
                            <img 
                                src={url} 
                                alt={alt} 
                                className="mx-auto rounded-zi-card max-h-[300px] object-contain shadow-sm border border-zi-surface-container" 
                            />
                            {alt && <span className="block text-xs text-slate-400 mt-2 italic">{alt}</span>}
                        </span>
                    );
                }

                // 2. Raw 이미지 URL 형식 매칭 (Vercel Blob 등 이미지 링크 단독 행)
                const rawUrlMatch = line.trim().match(/^https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S+)?$/i);
                if (rawUrlMatch) {
                    const url = rawUrlMatch[0];
                    return (
                        <span key={lineIdx} className="block my-6 text-center">
                            <img 
                                src={url} 
                                alt="Image" 
                                className="mx-auto rounded-zi-card max-h-[300px] object-contain shadow-sm border border-zi-surface-container" 
                            />
                        </span>
                    );
                }

                // 기존의 강조 및 링크 처리
                const parts = line.split(/(\*\*\{.*?\}\*\*|\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
                return (
                    <span key={lineIdx} className="block mb-4 last:mb-0">
                        {parts.map((part, i) => {
                            if (part.startsWith('**{') && part.endsWith('}**')) {
                                const content = part.slice(3, -3);
                                return (
                                    <span key={i} className="font-bold text-zi-blue underline decoration-zi-blue/30 underline-offset-4">
                                        {content}
                                    </span>
                                );
                            }
                            if (part.startsWith('**') && part.endsWith('**')) {
                                const content = part.slice(2, -2);
                                return (
                                    <span key={i} className="font-bold text-zi-blue">
                                        {content}
                                    </span>
                                );
                            }
                            if (part.startsWith('[') && part.endsWith(')')) {
                                const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
                                if (match) {
                                    const linkText = match[1];
                                    const url = match[2];
                                    return (
                                        <a 
                                            key={i} 
                                            href={url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-800 underline underline-offset-4 decoration-indigo-300 font-semibold transition-colors"
                                        >
                                            {linkText}
                                        </a>
                                    );
                                }
                            }
                            return part;
                        })}
                    </span>
                );
            })}
        </>
    );
}

// Simple Badge component
function Badge({ 
    children, 
    variant = 'default', 
    className = '' 
}: { 
    children: React.ReactNode, 
    variant?: 'default' | 'outline', 
    className?: string 
}) {
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
