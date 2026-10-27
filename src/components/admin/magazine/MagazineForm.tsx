'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createMagazinePost, updateMagazinePost } from '@/actions/admin/magazine-actions';
import { Loader2, Info, Plus, Trash2, Edit3, Eye, Image as ImageIcon, Link as LinkIcon, Video, ChevronDown, ChevronUp, FileText, List, MoveVertical, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { StorageImageSelectorModal } from '@/components/admin/storage/StorageImageSelectorModal';
import { LinkInsertModal } from '@/components/admin/magazine/LinkInsertModal';
import { VideoInsertModal } from '@/components/admin/magazine/VideoInsertModal';
import { ImageDetailsModal } from '@/components/admin/magazine/ImageDetailsModal';
import OrganizationSelector from '@/components/admin/magazine/OrganizationSelector';
import { MagazineSectionNav, MagazineRoutingGuide } from '@/components/admin/magazine/MagazineSectionNav';
import { MagazineSidePreview } from '@/components/admin/magazine/MagazineSidePreview';
import { MagazineFullPreview } from '@/components/admin/magazine/MagazineFullPreview';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function MagazineForm({ 
    authors = [], 
    regions = [],
    categories = [],
    post 
}: { 
    authors?: any[], 
    regions?: any[],
    categories?: any[],
    post?: any 
}) {
    const router = useRouter();
    const confirm = useConfirm();
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [guideOpen, setGuideOpen] = useState(false);
    const [expandedBodyIndex, setExpandedBodyIndex] = useState<number>(0);
    const [activeTextareaId, setActiveTextareaId] = useState<string | null>(null);
    const [activeLinkTextareaId, setActiveLinkTextareaId] = useState<string | null>(null);
    const [activeVideoTextareaId, setActiveVideoTextareaId] = useState<string | null>(null);

    // 우측 미리보기 패널용 디바운스 상태
    const [preview, setPreview] = useState({ title: '', summary: '', thumbnailUrl: '', slug: '', authorName: '진사이트 편집부', categoryLabel: '' });

    // Image Details Modal State
    const [isImageDetailsOpen, setIsImageDetailsOpen] = useState(false);
    const [imageDetailsData, setImageDetailsData] = useState<{ url: string; alt: string; caption: string; targetTextareaId: string; startIndex: number; endIndex: number } | null>(null);

    const replaceTextRange = (id: string, textToInsert: string, start: number, end: number) => {
        const textarea = document.getElementById(id) as HTMLTextAreaElement;
        if (!textarea) return;

        const value = textarea.value;
        const newValue = value.substring(0, start) + textToInsert + value.substring(end);
        
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

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
        }, 0);
    };

    const insertTextAtCursor = (id: string, textToInsert: string) => {
        const textarea = document.getElementById(id) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        replaceTextRange(id, textToInsert, start, end);
    };

    const handleImageButtonClick = (textareaId: string) => {
        const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            if (start !== end) {
                const selectedText = textarea.value.substring(start, end).trim();
                const imgMatch = selectedText.match(/^!\[(.*?)\]\((.*?)(?:\s+(?:"(.*?)"|'(.*?)'|\((.*?)\)))?\)$/);
                if (imgMatch) {
                    setIsImageDetailsOpen(true);
                    setImageDetailsData({
                        url: imgMatch[2].trim(),
                        alt: imgMatch[1] || '',
                        caption: imgMatch[3] || imgMatch[4] || imgMatch[5] || '',
                        targetTextareaId: textareaId,
                        startIndex: start,
                        endIndex: end,
                    });
                    return;
                }
            }
        }
        setActiveTextareaId(textareaId);
    };

    const handleImageDetailsConfirm = (markdown: string) => {
        if (!imageDetailsData) return;
        const { targetTextareaId, startIndex, endIndex } = imageDetailsData;
        
        if (startIndex !== -1 && endIndex !== -1) {
            replaceTextRange(targetTextareaId, markdown, startIndex, endIndex);
        } else {
            insertTextAtCursor(targetTextareaId, markdown);
        }
        setImageDetailsData(null);
    };

    const handleImageSelect = (url: string) => {
        if (!activeTextareaId) return;
        setIsImageDetailsOpen(true);
        setImageDetailsData({
            url,
            alt: '',
            caption: '',
            targetTextareaId: activeTextareaId,
            startIndex: -1,
            endIndex: -1,
        });
        setActiveTextareaId(null);
    };

    const handleInsertLink = (textareaId: string) => {
        setActiveLinkTextareaId(textareaId);
    };

    const handleInsertVideo = (textareaId: string) => {
        setActiveVideoTextareaId(textareaId);
    };

    const handleVideoInsertConfirm = (markdown: string) => {
        if (!activeVideoTextareaId) return;
        insertTextAtCursor(activeVideoTextareaId, markdown);
        setActiveVideoTextareaId(null);
    };

    const handleLinkInsertConfirm = (text: string, url: string, linkType: 'normal' | 'sponsored') => {
        if (!activeLinkTextareaId) return;
        let markdownLink = `[${text}](${url})`;
        if (linkType === 'sponsored') {
            markdownLink = `[${text}](${url} "sponsored")`;
        }
        insertTextAtCursor(activeLinkTextareaId, markdownLink);
        setActiveLinkTextareaId(null);
    };

    // 글머리 기호(•) 삽입 핸들러
    const handleInsertBullet = (id: string) => {
        const textarea = document.getElementById(id) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        let newValue = '';
        let newCursorPos = 0;

        if (start !== end) {
            const before = value.substring(0, start);
            const selection = value.substring(start, end);
            const after = value.substring(end);

            const bulleted = selection
                .split('\n')
                .map(line => (/^[•\-\*▪]\s*/.test(line.trim()) ? line : `• ${line}`))
                .join('\n');

            newValue = before + bulleted + after;
            newCursorPos = start + bulleted.length;
        } else {
            const isStartOfLine = start === 0 || value[start - 1] === '\n';
            const insertStr = isStartOfLine ? '• ' : '\n• ';
            newValue = value.substring(0, start) + insertStr + value.substring(end);
            newCursorPos = start + insertStr.length;
        }

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

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Enter 키 스마트 글머리 기호 연속 입력 핸들러
    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, id: string) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            const textarea = e.currentTarget;
            const cursorPos = textarea.selectionStart;
            const value = textarea.value;

            const lineStart = value.lastIndexOf('\n', cursorPos - 1) + 1;
            const nextNewline = value.indexOf('\n', cursorPos);
            const lineEnd = nextNewline === -1 ? value.length : nextNewline;
            const currentLine = value.substring(lineStart, lineEnd);

            const bulletMatch = currentLine.match(/^[•\-\*▪]\s*/);
            if (bulletMatch) {
                e.preventDefault();
                const contentAfterBullet = currentLine.substring(bulletMatch[0].length).trim();

                let newValue = '';
                let nextCursor = 0;

                if (contentAfterBullet === '') {
                    newValue = value.substring(0, lineStart) + value.substring(cursorPos);
                    nextCursor = lineStart;
                } else {
                    const insertStr = '\n• ';
                    newValue = value.substring(0, cursorPos) + insertStr + value.substring(cursorPos);
                    nextCursor = cursorPos + insertStr.length;
                }

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

                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(nextCursor, nextCursor);
                }, 0);
            }
        }
    };

    // 단락 간격 및 구분선 삽입 핸들러
    const handleInsertSpacing = (id: string, type: 'narrow' | 'medium' | 'large' | 'divider') => {
        const textarea = document.getElementById(id) as HTMLTextAreaElement;
        let insertStr = '';
        if (type === 'narrow') insertStr = '\n[여백:좁게]\n';
        else if (type === 'medium') insertStr = '\n\n';
        else if (type === 'large') insertStr = '\n\n\n';
        else if (type === 'divider') insertStr = '\n\n---\n\n';

        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        const newValue = value.substring(0, start) + insertStr + value.substring(end);
        const newCursor = start + insertStr.length;

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

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
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
                        closing: parsed.closing || '',
                        thumbnailAlt: parsed.thumbnailAlt || '',
                        thumbnailCaption: parsed.thumbnailCaption || ''
                    };
                } else {
                    return {
                        lead: '',
                        bodies: [{ title: '', content: post.content }],
                        closing: '',
                        thumbnailAlt: '',
                        thumbnailCaption: ''
                    };
                }
            } catch (e) {
                console.error('Failed to parse post content:', e);
            }
        }
        return {
            lead: '',
            bodies: [{ title: '', content: '' }],
            closing: '',
            thumbnailAlt: '',
            thumbnailCaption: ''
        };
    })();



    const [selectedOrganizations, setSelectedOrganizations] = useState<any[]>(() => {
        if (post && post.organizations) {
            return post.organizations.map((po: any) => ({
                id: po.organization.id,
                company_name: po.organization.company_name
            }));
        }
        return [];
    });

    const initialDate = post ? new Date(post.createdAt) : new Date();
    const [year, setYear] = useState(String(initialDate.getFullYear()));
    const [month, setMonth] = useState(String(initialDate.getMonth() + 1).padStart(2, '0'));

    const [formData, setFormData] = useState<any>({
        title: post?.title || '',
        slug: post?.slug || '',
        summary: post?.summary || '',
        lead: parsedContent.lead,
        bodies: parsedContent.bodies,
        closing: parsedContent.closing,
        thumbnailUrl: post?.thumbnailUrl || '',
        thumbnailAlt: parsedContent.thumbnailAlt || '',
        thumbnailCaption: parsedContent.thumbnailCaption || '',
        categoryId: post?.categoryId ? String(post.categoryId) : (categories.find(c => c.slug === 'newsletter')?.id ? String(categories.find(c => c.slug === 'newsletter').id) : ''),
        status: post?.status || 'PUBLISHED',
        authorId: post?.authorId || null,
        authorName: post?.authorName || '진사이트 편집부',
        regionId: post?.regionId || null,
        targetKeywords: post?.targetKeywords || '',
        isPaid: post?.isPaid || false
    });

    // Real-time slug generation (Only when creating a new post)
    useEffect(() => {
        if (post) return; // Skip automatic slug generation during edit mode to prevent breaking existing URLs
        const selectedCategory = categories.find(c => String(c.id) === String(formData.categoryId));
        if (selectedCategory?.slug === 'newsletter') {
            const autoSlug = `${year}-${month}-newsletter`;
            setFormData((prev: any) => ({ ...prev, slug: autoSlug }));
        }
    }, [formData.categoryId, year, month, post, categories]);

    // ── 이탈 방지(뒤로가기 방지) 및 로컬스토리지 자동 임시저장(Auto-draft) 시스템 ──
    const [isDirty, setIsDirty] = useState(false);
    const isInitialMount = useRef(true);
    const draftKey = post ? `zinsight_draft_edit_${post.id}` : 'zinsight_draft_new';
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
    const [hasRestorableDraft, setHasRestorableDraft] = useState(false);
    const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);

    // 폼 내용 수정 감지 (isDirty)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        setIsDirty(true);
    }, [formData, selectedOrganizations]);

    // 1. 브라우저 탭 닫기 / 새로고침 방지
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // 2. 브라우저 뒤로가기(popstate) 방지
    useEffect(() => {
        if (!isDirty) return;

        window.history.pushState({ page: 'magazine-editor' }, '', window.location.href);

        const handlePopState = () => {
            if (isDirty) {
                const confirmLeave = window.confirm('작성 중인 내용이 저장되지 않았습니다.\n정말 페이지를 벗어나시겠습니까?');
                if (!confirmLeave) {
                    window.history.pushState({ page: 'magazine-editor' }, '', window.location.href);
                } else {
                    setIsDirty(false);
                    window.history.back();
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isDirty]);

    // 3. 로컬스토리지 임시저장본 확인 (마운트 시)
    useEffect(() => {
        try {
            const saved = localStorage.getItem(draftKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.savedAt && (parsed.formData?.title || parsed.formData?.lead || parsed.formData?.bodies?.[0]?.content)) {
                    setHasRestorableDraft(true);
                    const d = new Date(parsed.savedAt);
                    setDraftTimestamp(`${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
                }
            }
        } catch { }
    }, [draftKey]);

    // 4. 10초 주기 로컬스토리지 자동 백업
    useEffect(() => {
        if (!isDirty) return;
        const timer = setInterval(() => {
            try {
                if (formData.title || formData.lead || formData.bodies?.[0]?.content) {
                    const draftData = {
                        formData,
                        selectedOrganizations,
                        savedAt: new Date().toISOString()
                    };
                    localStorage.setItem(draftKey, JSON.stringify(draftData));
                    const now = new Date();
                    setLastSavedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
                }
            } catch { }
        }, 10000);

        return () => clearInterval(timer);
    }, [isDirty, formData, selectedOrganizations, draftKey]);

    const restoreDraft = () => {
        try {
            const saved = localStorage.getItem(draftKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.formData) {
                    setFormData(parsed.formData);
                }
                if (parsed.selectedOrganizations) {
                    setSelectedOrganizations(parsed.selectedOrganizations);
                }
                setIsDirty(true);
                setHasRestorableDraft(false);
                toast.success('임시 저장된 본문을 성공적으로 복원했습니다.');
            }
        } catch {
            toast.error('임시 저장본 복원에 실패했습니다.');
        }
    };

    const discardDraft = () => {
        try {
            localStorage.removeItem(draftKey);
        } catch { }
        setHasRestorableDraft(false);
        toast.info('임시 저장본을 삭제했습니다.');
    };

    const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
        const target = e.target as HTMLElement;
        // Textarea가 아닌 일반 input 등에서 Enter 입력 시 폼 자동 제출(수정/발행 완료) 방지
        if (e.key === 'Enter' && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    };

    const handleSubmit = (e?: React.FormEvent | React.MouseEvent, overrideStatus?: string) => {
        if (e) {
            e.preventDefault();
        }

        const targetStatus = overrideStatus || formData.status || 'PUBLISHED';
        const isDraft = targetStatus === 'DRAFT';

        if (!formData.title || formData.title.trim() === '') {
            toast.error('제목을 입력해주세요.');
            return;
        }

        if (!isDraft) {
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
        }

        const validBodies = formData.bodies.filter((b: any) => b.title.trim() !== '' || b.content.trim() !== '');

        startTransition(async () => {
            const structuredContent = JSON.stringify({
                lead: formData.lead || '',
                bodies: validBodies.length > 0 ? validBodies : [{ title: '', content: '' }],
                closing: formData.closing || '',
                thumbnailAlt: formData.thumbnailAlt || '',
                thumbnailCaption: formData.thumbnailCaption || '',
            });

            const { lead, bodies, closing, thumbnailAlt, thumbnailCaption, ...cleanFormData } = formData;

            const submitPayload = {
                ...cleanFormData,
                status: targetStatus,
                categoryId: Number(formData.categoryId),
                content: structuredContent,
                organizationIds: selectedOrganizations.map(o => o.id)
            };

            if (post) {
                // Edit Mode
                const res = await updateMagazinePost(post.id, submitPayload);

                const wasDraft = post.status === 'DRAFT';
                if (res.success) {
                    setIsDirty(false);
                    try { localStorage.removeItem(draftKey); } catch { }
                    if (isDraft) {
                        toast.success('임시 저장이 완료되었습니다.');
                    } else if (wasDraft) {
                        toast.success('초안이 성공적으로 발행되었습니다! 🎉');
                    } else {
                        toast.success('포스트가 성공적으로 수정되었습니다!');
                    }
                    router.push('/admin/magazine');
                } else {
                    toast.error('수정 실패: ' + res.error);
                }
            } else {
                // Create Mode
                const res = await createMagazinePost({
                    ...submitPayload,
                    slug: formData.slug || undefined,
                });

                if (res.success) {
                    setIsDirty(false);
                    try { localStorage.removeItem(draftKey); } catch { }
                    toast.success(isDraft ? '임시 저장이 완료되었습니다.' : '포스트가 성공적으로 등록되었습니다!');
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
            case 'edu-collab': return '산학협력 · 교육';
            case 'newsletter':
            default:
                return 'Newsletter';
        }
    })();

    // 발행 필수 조건 검사
    const hasTitle = formData.title.trim().length > 0;
    const hasLead = formData.lead.trim().length > 0;
    const hasClosing = formData.closing.trim().length > 0;
    const hasValidBody = formData.bodies.some((b: any) => b.title.trim() !== '' || b.content.trim() !== '');
    const canPublish = hasTitle && hasLead && hasClosing && hasValidBody;

    const handlePublishClick = (e: React.MouseEvent) => {
        if (!canPublish) {
            const missing: string[] = [];
            if (!hasTitle) missing.push('제목');
            if (!hasLead) missing.push('리드(Lead)');
            if (!hasValidBody) missing.push('본문 섹션');
            if (!hasClosing) missing.push('클로징(Closing)');
            toast.error(`다음 항목을 입력해주세요: ${missing.join(', ')}`);
            return;
        }
        handleSubmit(e, 'PUBLISHED');
    };

    // 우측 미리보기 패널 — 300ms 디바운스로 업데이트
    useEffect(() => {
        const timer = setTimeout(() => {
            setPreview({
                title: formData.title,
                summary: formData.summary || '',
                thumbnailUrl: formData.thumbnailUrl || '',
                slug: formData.slug || '',
                authorName: formData.authorName || '진사이트 편집부',
                categoryLabel,
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [formData.title, formData.summary, formData.thumbnailUrl, formData.slug, formData.authorName, categoryLabel]);

    // 활성 섹션 스크롤 스파이(Scroll Spy) 상태
    const [activeSectionId, setActiveSectionId] = useState<string>('section-meta');

    // lg 이상에서 실제로 스크롤되는 중앙 본문 컬럼 (미리보기 탭에서는 미리보기 래퍼)
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);

    // 중앙 컬럼이 현재 독립 스크롤 컨테이너인지 (lg 이상에서만 true, 모바일은 페이지 스크롤)
    const getScrollContainer = (): HTMLDivElement | null => {
        const el = scrollAreaRef.current;
        if (!el) return null;
        const oy = window.getComputedStyle(el).overflowY;
        return (oy === 'auto' || oy === 'scroll') ? el : null;
    };

    // 섹션 요소로 스크롤 — lg: 중앙 컬럼 내부 스크롤 / 모바일: 페이지 스크롤
    const scrollElementIntoView = (el: HTMLElement, behavior: ScrollBehavior) => {
        const container = getScrollContainer();
        if (container) {
            const top = container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top - 8;
            container.scrollTo({ top: Math.max(0, top), behavior });
        } else {
            el.scrollIntoView({ behavior, block: 'start' });
        }
    };

    // 앵커 이동 및 스크롤 처리 헬퍼
    const scrollToSection = (e: React.MouseEvent, id: string, bodyIndex?: number) => {
        e.preventDefault();
        if (bodyIndex !== undefined) {
            setExpandedBodyIndex(bodyIndex);
        }
        setActiveSectionId(id);
        // 아코디언 펼침 반영 후 위치 계산
        requestAnimationFrame(() => {
            const el = document.getElementById(id);
            if (el) scrollElementIntoView(el, 'smooth');
        });
    };

    // 스크롤 스파이: 중앙 컬럼(lg) 또는 window(모바일) 스크롤 기준
    useEffect(() => {
        if (activeTab !== 'edit') return;
        const sectionIds = [
            'section-meta',
            'section-guide',
            'section-org-slug',
            'section-lead',
            ...formData.bodies.map((_: any, i: number) => `section-body-${i}`),
            'section-closing'
        ];

        let raf = 0;
        const checkActiveSection = () => {
            const container = getScrollContainer();
            const atBottom = container
                ? container.scrollTop + container.clientHeight >= container.scrollHeight - 40
                : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
            if (atBottom) {
                setActiveSectionId('section-closing');
                return;
            }
            // 기준선: 컨테이너 상단 + 여유(lg) / sticky 탭바 아래(모바일)
            const threshold = container ? container.getBoundingClientRect().top + 120 : 200;
            let current = sectionIds[0];
            for (const id of sectionIds) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= threshold) {
                    current = id;
                }
            }
            setActiveSectionId(current);
        };

        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(checkActiveSection);
        };

        const areaEl = scrollAreaRef.current;
        areaEl?.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        // 초기 위치 갱신
        checkActiveSection();

        return () => {
            cancelAnimationFrame(raf);
            areaEl?.removeEventListener('scroll', onScroll);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.bodies.length, activeTab]);

    // URL ?scroll= 파라미터 감지하여 해당 섹션으로 스크롤 (딥링크 및 검증 지원)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const scrollTarget = params.get('scroll');
        if (scrollTarget) {
            const timer = setTimeout(() => {
                const targetId = scrollTarget === 'lead' ? 'section-lead'
                    : scrollTarget === 'body' ? 'section-body-0'
                    : scrollTarget === 'closing' ? 'section-closing'
                    : `section-${scrollTarget}`;
                const el = document.getElementById(targetId);
                if (el) scrollElementIntoView(el, 'instant');
            }, 600);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-6 lg:space-y-0 lg:gap-5 lg:flex lg:flex-col lg:flex-1 lg:min-h-0 lg:h-full">
            {/* Tab Switched Header & Quick Actions — 모바일: sticky / lg: 카드 상단 고정(flex-shrink-0) */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-4 bg-white/95 backdrop-blur-sm -mx-6 px-6 pt-2 lg:static lg:shrink-0 lg:pt-0 lg:bg-white lg:backdrop-blur-none">
                <div className="flex">
                    <button
                        type="button"
                        className={`flex items-center gap-1.5 pb-3 text-sm font-semibold px-5 border-b-2 transition-all -mb-3 ${
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
                        className={`flex items-center gap-1.5 pb-3 text-sm font-semibold px-5 border-b-2 transition-all -mb-3 ${
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

                <div className="flex items-center gap-3">
                    {post && (
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-xs text-slate-400">상태:</span>
                            {post.status === 'PUBLISHED' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ● 발행됨
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    ◐ 초안 (미발행)
                                </span>
                            )}
                        </div>
                    )}
                    {lastSavedTime && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 font-medium">
                            <Save className="w-3 h-3 text-emerald-600" />
                            {lastSavedTime} 자동 보관
                        </span>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 font-semibold text-xs"
                        onClick={(e) => handleSubmit(e, 'DRAFT')}
                        disabled={isPending}
                    >
                        임시저장
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        className={`h-9 px-5 font-semibold text-xs shadow-xs transition-all ${
                            canPublish
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                        onClick={handlePublishClick}
                        disabled={isPending}
                        title={!canPublish ? '제목, 리드, 본문, 클로징을 모두 입력해야 발행할 수 있습니다' : undefined}
                    >
                        {isPending ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : null}
                        {post?.status === 'PUBLISHED' ? '수정 완료' : '발행하기'}
                    </Button>
                </div>
            </div>

            {hasRestorableDraft && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-amber-950 shadow-sm shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">💾</span>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold truncate">작성 중이던 자동 임시 보관본이 있습니다 ({draftTimestamp})</p>
                            <p className="text-[11px] text-amber-700 truncate">페이지 이탈 전 작성했던 내용을 복구하시겠습니까?</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button type="button" size="sm" onClick={restoreDraft} className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-7 px-3 text-xs">
                            복구하기
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={discardDraft} className="text-amber-700 hover:bg-amber-100 h-7 px-2 text-xs">
                            닫기
                        </Button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-8 lg:space-y-0 lg:gap-4 lg:flex lg:flex-col lg:flex-1 lg:min-h-0 lg:h-full">
                {activeTab === 'edit' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] xl:grid-cols-[15rem_1fr_20rem] lg:grid-rows-[minmax(0,1fr)] gap-6 items-stretch lg:flex-1 lg:min-h-0 lg:h-full lg:overflow-hidden">
                        {/* 컬럼 1: Desktop side navigation — 고정 컬럼 (항목이 많을 때만 자체 스크롤) */}
                        <MagazineSectionNav
                            activeSectionId={activeSectionId}
                            hasTitle={hasTitle}
                            hasLead={hasLead}
                            hasClosing={hasClosing}
                            canPublish={canPublish}
                            formData={formData}
                            scrollToSection={scrollToSection}
                        />
                        {/* 컬럼 2: Main edit area — lg: 이 컬럼만 내부 스크롤 */}
                        <div ref={scrollAreaRef} className="min-w-0 space-y-8 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:pb-6">
                        {/* 기본 정보 및 메타데이터 카드 */}
                        <div id="section-meta" className="p-6 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-6 scroll-mt-24">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-200/60">
                                <FileText className="w-4.5 h-4.5 text-slate-500" />
                                기본 정보 및 메타데이터
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-xs font-semibold text-slate-600">카테고리</Label>
                                    <Select
                                        value={formData.categoryId ? String(formData.categoryId) : ''}
                                        onValueChange={(val) => {
                                            setFormData({ 
                                                ...formData, 
                                                categoryId: val,
                                            });
                                        }}
                                    >
                                        <SelectTrigger id="category" className="bg-white border-slate-200">
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
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="regionSelect" className="text-xs font-semibold text-slate-600">연계 지역</Label>
                                        {isLocal ? (
                                            <span className="text-[10px] text-emerald-600 font-bold">로컬 필수 권장</span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400">선택 사항</span>
                                        )}
                                    </div>
                                    <Select
                                        value={formData.regionId ? String(formData.regionId) : 'none'}
                                        onValueChange={(val) => {
                                            setFormData({ ...formData, regionId: val === 'none' ? null : Number(val) });
                                        }}
                                    >
                                        <SelectTrigger id="regionSelect" className="bg-white border-slate-200">
                                            <SelectValue placeholder="지역 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">선택 없음 (전국/공통)</SelectItem>
                                            {regions.map((reg: any) => (
                                                <SelectItem key={reg.id} value={String(reg.id)}>
                                                    {reg.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {isLocal ? (
                                        <p className="text-[10px] text-emerald-600 font-semibold mt-1">※ 로컬 기사는 반드시 &apos;연계 지역&apos;을 지정해야 합니다.</p>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 mt-1">※ 특정 지자체/지역 관련 뉴스인 경우 연계 지역을 지정할 수 있습니다.</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="authorSelect" className="text-xs font-semibold text-slate-600">작성자(발행자)</Label>
                                    <Select
                                        value={formData.authorId ? String(formData.authorId) : 'default'}
                                        onValueChange={(val) => {
                                            if (val === 'default') {
                                                setFormData({ ...formData, authorId: null, authorName: '진사이트 편집부' });
                                            } else {
                                                const selectedAuthor = authors.find(a => String(a.id) === val);
                                                if (selectedAuthor) {
                                                    setFormData({ ...formData, authorId: selectedAuthor.id, authorName: selectedAuthor.name });
                                                }
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="authorSelect" className="bg-white border-slate-200">
                                            <SelectValue placeholder="작성자 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">진사이트 편집부 (기본)</SelectItem>
                                            {authors.map((author: any) => (
                                                <SelectItem key={author.id} value={String(author.id)}>
                                                    {author.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>

                            {/* 제목 - 단독 행 전체 너비 */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Label htmlFor="title" className="text-xs font-semibold text-slate-600">제목</Label>
                                    <span title="기사 제목을 입력하세요" className="cursor-help inline-flex items-center">
                                        <Info className="w-3.5 h-3.5 text-slate-400" />
                                    </span>
                                </div>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-white border-slate-200 text-base py-5 font-semibold focus-visible:ring-indigo-500"
                                    required
                                />
                            </div>

                            {/* 요약 (meta description) */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="summary" className="text-xs font-semibold text-slate-600">요약 (Meta Description)</Label>
                                        <span title="검색 엔진 결과에 표시될 요약문입니다. 비워두면 기사 도입부에서 자동 생성됩니다." className="cursor-help inline-flex items-center">
                                            <Info className="w-3.5 h-3.5 text-slate-400" />
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold ${(formData.summary?.length || 0) > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {formData.summary?.length || 0} / 160자
                                    </span>
                                </div>
                                <Textarea
                                    id="summary"
                                    value={formData.summary || ''}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    className="bg-white border-slate-200 text-sm py-3 min-h-[80px] focus-visible:ring-indigo-500"
                                    placeholder="검색 결과에 노출될 기사 요약을 입력하세요 (155~160자 권장)"
                                />
                            </div>
                        </div>

                        {/* 카테고리 안내 가이드 */}
                        <MagazineRoutingGuide guideOpen={guideOpen} setGuideOpen={setGuideOpen} />

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

                        <div id="section-org-slug" className="grid grid-cols-1 md:grid-cols-2 gap-8 scroll-mt-24">
                            {/* Left Column: Industry & Slug */}
                            <div className="space-y-6">


                                <div className="space-y-3">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        연결된 조직 (인사이트 레이더) <span className="text-xs text-slate-400 font-normal">(선택)</span>
                                    </Label>
                                    <OrganizationSelector
                                        selected={selectedOrganizations}
                                        onChange={setSelectedOrganizations}
                                        currentRegionId={formData.regionId ?? undefined}
                                    />
                                </div>

                                <div className="space-y-2">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Label htmlFor="slug" className="font-bold">슬러그 (URL)</Label>
                                    <span title="URL에 사용될 고유 식별자입니다. 영문 소문자와 하이픈(-)만 사용 가능합니다. (예: my-article-slug)" className="cursor-help inline-flex items-center">
                                        <Info className="w-3.5 h-3.5 text-slate-400" />
                                    </span>
                                </div>
                                    <div className="relative">
                                        <Input
                                            id="slug"
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
                                        onRemove={() => setFormData({ ...formData, thumbnailUrl: '', thumbnailAlt: '', thumbnailCaption: '' })}
                                    />
                                    {formData.thumbnailUrl && (
                                        <div className="space-y-3 pt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <div className="space-y-1">
                                                <Label htmlFor="thumbnailAlt" className="text-xs font-semibold text-slate-700">대표이미지 대체 텍스트 (Alt)</Label>
                                                <Input
                                                    id="thumbnailAlt"
                                                    placeholder="이미지를 설명하는 텍스트 (SEO/스크린리더용, 미입력 시 기사 제목 적용)"
                                                    value={formData.thumbnailAlt}
                                                    onChange={(e) => setFormData({ ...formData, thumbnailAlt: e.target.value })}
                                                    className="h-8 text-xs bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="thumbnailCaption" className="text-xs font-semibold text-slate-700">대표이미지 캡션 / 출처</Label>
                                                <Input
                                                    id="thumbnailCaption"
                                                    placeholder="예: 사진 제공=○○기업 / 안양시청 전경"
                                                    value={formData.thumbnailCaption}
                                                    onChange={(e) => setFormData({ ...formData, thumbnailCaption: e.target.value })}
                                                    className="h-8 text-xs bg-white"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Label htmlFor="targetKeywords" className="font-bold">핵심 키워드 태그 (쉼표로 구분)</Label>
                                    <span title="기사 상세 페이지 하단에 검색 가능한 태그로 출력됩니다. (예: 인공지능, GEO 마케팅, SEO 최적화)" className="cursor-help inline-flex items-center">
                                        <Info className="w-3.5 h-3.5 text-slate-400" />
                                    </span>
                                </div>
                                    <Input
                                        id="targetKeywords"
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
                                                활성화 시 기사 상단·카드에 배지 표시.
                                                ‘산학협력·교육’ 카테고리는 ‘협력 기관’, 나머지 카테고리는 ‘파트너’ 배지로 자동 적용됩니다.
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
                                            ✓ {activeCategorySlug === 'edu-collab' ? '협력 기관' : '파트너'} 배지 활성화 — 기사 헤더 및 카드 목록에 표시됩니다.
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
                            <div id="section-lead" className="space-y-2 p-5 bg-indigo-50/40 border border-indigo-100 rounded-xl scroll-mt-24">
                                <div className="flex flex-wrap justify-between items-center gap-2 pb-1">
                                    <Label htmlFor="lead" className="font-bold text-indigo-800 text-sm">리드 (Lead) <span className="text-red-500">*</span></Label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleInsertBullet('lead')}
                                            className="h-7 px-2.5 text-xs bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold gap-1"
                                            title="글머리 기호(•)를 삽입합니다"
                                        >
                                            <List className="w-3.5 h-3.5 text-indigo-600" />
                                            글머리 기호
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2.5 text-xs bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold gap-1"
                                                >
                                                    <MoveVertical className="w-3.5 h-3.5 text-indigo-600" />
                                                    단락 간격
                                                    <ChevronDown className="w-3 h-3 text-indigo-400 opacity-60" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg">
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacing('lead', 'narrow')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-indigo-600">·</span>
                                                    <span>미세 간격 (5px)</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacing('lead', 'medium')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-indigo-600">↕</span>
                                                    <span>중간 간격 (Enter 2회)</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacing('lead', 'large')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-indigo-600">⇕</span>
                                                    <span>넓은 간격 (Enter 3회)</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacing('lead', 'divider')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-slate-400">―</span>
                                                    <span>구분선 삽입 (---)</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                                            onClick={() => handleImageButtonClick('lead')}
                                            className="h-7 px-2.5 text-xs bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold gap-1"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                                            보관함 이미지 삽입
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleInsertVideo('lead')}
                                            className="h-7 px-2.5 text-xs bg-white border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold gap-1"
                                        >
                                            <Video className="w-3.5 h-3.5 text-rose-600" />
                                            동영상 삽입
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 pb-1">
                                    <p className="text-[11px] text-indigo-600/80">기사의 도입부나 요약을 작성해주세요. 줄바꿈 시 단락 간격이 넓게 적용되며, 글머리 기호(•) 작성 중 Enter를 누르면 자동으로 기호가 이어집니다.</p>
                                    <span title="기사의 도입부(리드) 내용을 작성하세요." className="cursor-help inline-flex items-center">
                                        <Info className="w-3.5 h-3.5 text-slate-400" />
                                    </span>
                                </div>
                                <Textarea
                                    id="lead"
                                    className="min-h-[130px] bg-white border-indigo-200 focus-visible:ring-indigo-500 text-sm leading-relaxed"
                                    value={formData.lead}
                                    onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                                    onKeyDown={(e) => handleTextareaKeyDown(e, 'lead')}
                                    required
                                />
                            </div>

                            {/* 본문 섹션 (Bodies) */}
                            <div className="space-y-4 p-6 bg-slate-50/50 border border-slate-200 rounded-2xl">
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
                                        <div key={index} id={`section-body-${index}`} className="relative bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:border-slate-300 scroll-mt-24">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-l-xl"></div>
                                            {/* Accordion header */}
                                            <div
                                                className="flex justify-between items-center p-4 cursor-pointer select-none"
                                                onClick={() => setExpandedBodyIndex(expandedBodyIndex === index ? -1 : index)}
                                            >
                                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs">
                                                        {index + 1}
                                                    </span>
                                                    섹션 {index + 1}
                                                    {formData.bodies[index]?.title && (
                                                        <span className="text-slate-400 font-normal text-xs ml-1">— {formData.bodies[index].title.slice(0, 20)}{formData.bodies[index].title.length > 20 ? '…' : ''}</span>
                                                    )}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    {formData.bodies.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => { e.stopPropagation(); setFormData({
                                                                ...formData,
                                                                bodies: formData.bodies.filter((_: any, i: number) => i !== index)
                                                            }); }}
                                                            className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {expandedBodyIndex === index ? (
                                                        <ChevronUp className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </div>
                                            </div>
                                            {/* Accordion content */}
                                            {expandedBodyIndex === index && (
                                            <div className="px-5 pb-5">
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-semibold text-slate-600">소제목</Label>
                                                        <span title="섹션의 소제목을 입력하세요" className="cursor-help inline-flex items-center">
                                                            <Info className="w-3.5 h-3.5 text-slate-400" />
                                                        </span>
                                                    </div>
                                                    <Input
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
                                                    <div className="flex flex-wrap justify-between items-center gap-2 pb-1">
                                                        <Label className="text-xs font-semibold text-slate-600">내용</Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleInsertBullet(`body-${index}`)}
                                                                className="h-7 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                                                                title="글머리 기호(•)를 삽입합니다"
                                                            >
                                                                <List className="w-3.5 h-3.5 text-slate-500" />
                                                                글머리 기호
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                                                                    >
                                                                        <MoveVertical className="w-3.5 h-3.5 text-slate-500" />
                                                                        단락 간격
                                                                        <ChevronDown className="w-3 h-3 text-slate-400 opacity-60" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg">
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleInsertSpacing(`body-${index}`, 'narrow')}
                                                                        className="text-xs cursor-pointer gap-2"
                                                                    >
                                                                        <span className="font-bold text-slate-600">·</span>
                                                                        <span>미세 간격 (5px)</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleInsertSpacing(`body-${index}`, 'medium')}
                                                                        className="text-xs cursor-pointer gap-2"
                                                                    >
                                                                        <span className="font-bold text-slate-600">↕</span>
                                                                        <span>중간 간격 (Enter 2회)</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleInsertSpacing(`body-${index}`, 'large')}
                                                                        className="text-xs cursor-pointer gap-2"
                                                                    >
                                                                        <span className="font-bold text-slate-600">⇕</span>
                                                                        <span>넓은 간격 (Enter 3회)</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleInsertSpacing(`body-${index}`, 'divider')}
                                                                        className="text-xs cursor-pointer gap-2"
                                                                    >
                                                                        <span className="font-bold text-slate-400">―</span>
                                                                        <span>구분선 삽입 (---)</span>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
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
                                                                onClick={() => handleImageButtonClick(`body-${index}`)}
                                                                className="h-7 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                                                            >
                                                                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                                                                보관함 이미지 삽입
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleInsertVideo(`body-${index}`)}
                                                                className="h-7 px-2.5 text-xs bg-white border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold gap-1"
                                                            >
                                                                <Video className="w-3.5 h-3.5 text-rose-500" />
                                                                동영상 삽입
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <Textarea
                                                        id={`body-${index}`}
                                                        className="min-h-[260px] bg-slate-50/50 text-sm leading-relaxed"
                                                        value={body.content}
                                                        onChange={(e) => {
                                                            const newBodies = [...formData.bodies];
                                                            newBodies[index].content = e.target.value;
                                                            setFormData({ ...formData, bodies: newBodies });
                                                        }}
                                                        onKeyDown={(e) => handleTextareaKeyDown(e, `body-${index}`)}
                                                        required={index === 0}
                                                        title="본문 내용을 작성하세요..."
                                                    />
                                                </div>
                                            </div>
                                            </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 클로징 (Closing) */}
                            <div id="section-closing" className="space-y-2 p-5 bg-slate-50 border border-slate-200 rounded-xl scroll-mt-24">
                                <div className="flex flex-wrap justify-between items-center gap-2 pb-1">
                                    <Label htmlFor="closing" className="font-bold text-slate-800 text-sm">클로징 (Closing) <span className="text-red-500">*</span></Label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleInsertBullet('closing')}
                                            className="h-7 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                                            title="글머리 기호(•)를 삽입합니다"
                                        >
                                            <List className="w-3.5 h-3.5 text-slate-500" />
                                            글머리 기호
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                                                >
                                                    <MoveVertical className="w-3.5 h-3.5 text-slate-500" />
                                                    단락 간격
                                                    <ChevronDown className="w-3 h-3 text-slate-400 opacity-60" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg">
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacing('closing', 'narrow')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-slate-600">·</span>
                                                    <span>미세 간격 (5px)</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacing('closing', 'medium')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-slate-600">↕</span>
                                                    <span>중간 간격 (Enter 2회)</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacing('closing', 'large')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-slate-600">⇕</span>
                                                    <span>넓은 간격 (Enter 3회)</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleInsertSpacing('closing', 'divider')}
                                                    className="text-xs cursor-pointer gap-2"
                                                >
                                                    <span className="font-bold text-slate-400">―</span>
                                                    <span>구분선 삽입 (---)</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                                            onClick={() => handleImageButtonClick('closing')}
                                            className="h-7 px-2.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                                            보관함 이미지 삽입
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleInsertVideo('closing')}
                                            className="h-7 px-2.5 text-xs bg-white border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold gap-1"
                                        >
                                            <Video className="w-3.5 h-3.5 text-rose-500" />
                                            동영상 삽입
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 pb-1">
                                    <p className="text-[11px] text-slate-500">기사의 맺음말이나 결론을 작성해주세요. 줄바꿈 시 단락 간격이 넓게 적용됩니다.</p>
                                    <span title="클로징 내용을 작성하세요..." className="cursor-help inline-flex items-center">
                                        <Info className="w-3.5 h-3.5 text-slate-400" />
                                    </span>
                                </div>
                                <Textarea
                                    id="closing"
                                    className="min-h-[130px] bg-white text-sm leading-relaxed"
                                    value={formData.closing}
                                    onChange={(e) => setFormData({ ...formData, closing: e.target.value })}
                                    onKeyDown={(e) => handleTextareaKeyDown(e, 'closing')}
                                    required
                                />
                            </div>
                        </div>
                        </div>

                        {/* ─── 컬럼 3: 우측 실시간 미리보기 (고정 컬럼, 중앙 스크롤과 독립) ─── */}
                        <MagazineSidePreview preview={preview} />
                    </div>
                ) : (
                    /* High-fidelity Live Preview Mode — lg: 카드 내부 스크롤 영역 */
                    <MagazineFullPreview
                        formData={formData}
                        categoryLabel={categoryLabel}
                        scrollAreaRef={scrollAreaRef}
                    />
                )}

                {/* Form Buttons — 모바일: sticky 하단 고정 / lg: 카드 하단 고정(flex-shrink-0) */}
                <div className="sticky bottom-0 z-30 flex justify-between items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 mt-6 bg-white/90 backdrop-blur-sm border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] -mx-4 sm:-mx-6 lg:static lg:shrink-0 lg:!mt-0 lg:-mb-6 lg:py-3 lg:bg-white lg:backdrop-blur-none">
                    <p className="text-xs text-slate-400 hidden sm:block">
                        {post ? '기존 포스트를 수정합니다.' : '새 매거진 포스트를 발행합니다.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 ml-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-11 px-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-1.5"
                            onClick={() => {
                                setActiveTab(activeTab === 'edit' ? 'preview' : 'edit');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                scrollAreaRef.current?.scrollTo({ top: 0 });
                            }}
                        >
                            {activeTab === 'edit' ? (
                                <>
                                    <Eye className="w-4 h-4 text-slate-500" />
                                    미리보기로 전환
                                </>
                            ) : (
                                <>
                                    <Edit3 className="w-4 h-4 text-slate-500" />
                                    에디터로 전환
                                </>
                            )}
                        </Button>
                        <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 px-4 sm:px-8 bg-white"
                            onClick={async () => {
                                if (isDirty) {
                                    const confirmLeave = await confirm({
                                        title: '작성 취소 확인',
                                        description: '작성 중인 내용이 저장되지 않았습니다. 정말 취소하고 나가시겠습니까?',
                                        confirmText: '나가기',
                                        variant: 'destructive',
                                    });
                                    if (!confirmLeave) return;
                                }
                                setIsDirty(false);
                                router.back();
                            }}
                            disabled={isPending}
                        >
                            취소
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 px-4 sm:px-6 bg-amber-50 hover:bg-amber-100/80 text-amber-800 border-amber-300 font-semibold"
                            onClick={(e) => handleSubmit(e, 'DRAFT')}
                            disabled={isPending}
                        >
                            임시저장
                        </Button>
                        <Button
                            type="button"
                            onClick={handlePublishClick}
                            className={`h-11 px-5 sm:px-10 shadow-md transition-all active:scale-95 font-semibold ${
                                canPublish
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                            disabled={isPending}
                            title={!canPublish ? '제목, 리드, 본문, 클로징을 모두 입력해야 발행할 수 있습니다' : undefined}
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : post?.status === 'PUBLISHED' ? (
                                '수정 완료'
                            ) : (
                                '발행하기'
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            <StorageImageSelectorModal
                isOpen={activeTextareaId !== null && !isImageDetailsOpen}
                onClose={() => setActiveTextareaId(null)}
                onSelect={handleImageSelect}
            />

            <ImageDetailsModal
                isOpen={isImageDetailsOpen}
                onClose={() => setIsImageDetailsOpen(false)}
                onConfirm={handleImageDetailsConfirm}
                initialUrl={imageDetailsData?.url}
                initialAlt={imageDetailsData?.alt}
                initialCaption={imageDetailsData?.caption}
            />

            <LinkInsertModal
                isOpen={activeLinkTextareaId !== null}
                onClose={() => setActiveLinkTextareaId(null)}
                onInsert={handleLinkInsertConfirm}
            />

            <VideoInsertModal
                isOpen={activeVideoTextareaId !== null}
                onClose={() => setActiveVideoTextareaId(null)}
                onInsert={handleVideoInsertConfirm}
            />
        </div>
    );
}
