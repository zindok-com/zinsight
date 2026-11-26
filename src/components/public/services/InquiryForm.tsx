'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import {
    INQUIRY_COMPANY_MAX,
    INQUIRY_EMAIL_MAX,
    INQUIRY_HONEYPOT_FIELD,
    INQUIRY_MESSAGE_MAX,
    INQUIRY_NAME_MAX,
    INQUIRY_PHONE_MAX,
    normalizeInquiryInput,
    validateInquiryInput,
    type InquiryField,
} from '@/lib/inquiry';
import { getInquiryFromPath, getInquiryUtm, sendZinsightEvent } from '@/components/public/analytics/ZinsightCtaTracker';
import { cn } from '@/lib/utils';

interface Props {
    products: Array<{ id: string; name: string }>;
    retentionNote: string;
    contactEmail: string;
}

const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-zi-blue focus:outline-none focus:ring-2 focus:ring-zi-blue/20';

/**
 * 진사이트 기업 등록·제휴 문의 폼 (/services#inquiry). 고객사 링크 페이지 '연락처 남기기'와 별개.
 * 카드의 '문의하기'(data-zi-product)를 누르면 해당 관심 항목이 미리 체크됨
 */
export function InquiryForm({ products, retentionNote, contactEmail }: Props) {
    const [values, setValues] = useState({ companyName: '', contactName: '', phone: '', email: '', message: '' });
    const [selected, setSelected] = useState<string[]>([]);
    const [consent, setConsent] = useState(false);
    const [honeypot, setHoneypot] = useState('');
    const [errors, setErrors] = useState<Partial<Record<InquiryField, string>>>({});
    const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
    const [serverError, setServerError] = useState('');
    const openedAt = useRef(0);
    const started = useRef(false);

    useEffect(() => {
        openedAt.current = Date.now();
        const onClick = (e: MouseEvent) => {
            const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-zi-product]');
            const id = el?.dataset.ziProduct;
            if (id) setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    const markStarted = () => {
        if (started.current) return;
        started.current = true;
        sendZinsightEvent('zinsight_inquiry_form_start');
    };

    const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        markStarted();
        setValues((v) => ({ ...v, [key]: e.target.value }));
    };

    const toggle = (id: string) => {
        markStarted();
        setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    };

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError('');
        const input = normalizeInquiryInput({ ...values, products: selected, consent });
        const found = validateInquiryInput(input);
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setStatus('sending');
        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...input,
                    [INQUIRY_HONEYPOT_FIELD]: honeypot,
                    elapsedMs: Date.now() - openedAt.current,
                    pagePath: getInquiryFromPath(),
                    utm: getInquiryUtm(),
                }),
            });
            const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: Partial<Record<InquiryField, string>> };
            if (res.ok && data.ok) {
                sendZinsightEvent('zinsight_inquiry_submit', { products: input.products.join(',') || 'none' });
                setStatus('done');
                return;
            }
            if (data.errors) setErrors(data.errors);
            setServerError(data.error ?? '접수하지 못했습니다. 입력 내용을 확인해 주세요.');
        } catch {
            setServerError('네트워크 오류로 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
        setStatus('idle');
    }

    if (status === 'done') {
        return (
            <div role="status" className="rounded-zi-card border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" aria-hidden="true" />
                <p className="mb-2 text-[18px] font-bold text-slate-900">문의가 접수됐습니다</p>
                <p className="text-[14px] leading-relaxed text-slate-600 break-keep">
                    영업일 기준 1~2일 안에 연락드립니다. 무료 진단 결과와 함께 맞춤 제안을 드립니다.
                    <br />
                    급하신 경우 <a href={`mailto:${contactEmail}`} className="font-semibold text-zi-blue underline-offset-2 hover:underline">{contactEmail}</a>로 메일을 보내 주세요.
                </p>
            </div>
        );
    }

    const fieldError = (key: InquiryField) =>
        errors[key] ? (
            <p id={`inq-${key}-error`} className="mt-1.5 text-[13px] text-red-600">
                {errors[key]}
            </p>
        ) : null;

    return (
        <form onSubmit={onSubmit} noValidate className="relative rounded-zi-card border border-zi-divider bg-white p-5 sm:p-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="inq-company" className="mb-1.5 block text-[14px] font-semibold text-slate-800">
                        회사명 <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input id="inq-company" name="companyName" autoComplete="organization" maxLength={INQUIRY_COMPANY_MAX} value={values.companyName} onChange={set('companyName')} aria-invalid={!!errors.companyName} aria-describedby={errors.companyName ? 'inq-companyName-error' : undefined} className={inputClass} />
                    {fieldError('companyName')}
                </div>
                <div>
                    <label htmlFor="inq-name" className="mb-1.5 block text-[14px] font-semibold text-slate-800">
                        담당자명 <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input id="inq-name" name="contactName" autoComplete="name" maxLength={INQUIRY_NAME_MAX} value={values.contactName} onChange={set('contactName')} aria-invalid={!!errors.contactName} aria-describedby={errors.contactName ? 'inq-contactName-error' : undefined} className={inputClass} />
                    {fieldError('contactName')}
                </div>
                <div>
                    <label htmlFor="inq-phone" className="mb-1.5 block text-[14px] font-semibold text-slate-800">
                        전화번호
                    </label>
                    <input id="inq-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={INQUIRY_PHONE_MAX} placeholder="010-0000-0000" value={values.phone} onChange={set('phone')} aria-invalid={!!(errors.phone || errors.contact)} aria-describedby="inq-contact-hint" className={inputClass} />
                    {fieldError('phone')}
                </div>
                <div>
                    <label htmlFor="inq-email" className="mb-1.5 block text-[14px] font-semibold text-slate-800">
                        이메일
                    </label>
                    <input id="inq-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={INQUIRY_EMAIL_MAX} placeholder="name@company.com" value={values.email} onChange={set('email')} aria-invalid={!!(errors.email || errors.contact)} aria-describedby="inq-contact-hint" className={inputClass} />
                    {fieldError('email')}
                </div>
            </div>
            <p id="inq-contact-hint" className={cn('mt-2 text-[13px]', errors.contact ? 'text-red-600' : 'text-slate-500')}>
                {errors.contact ?? '전화번호와 이메일 중 하나는 꼭 적어 주세요.'}
            </p>

            <fieldset className="mt-6">
                <legend className="mb-2.5 text-[14px] font-semibold text-slate-800">관심 항목 (여러 개 선택 가능)</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((p) => {
                        const checked = selected.includes(p.id);
                        return (
                            <label
                                key={p.id}
                                className={cn(
                                    'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[14px] transition-colors break-keep',
                                    checked ? 'border-zi-blue bg-zi-blue/5 text-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                )}
                            >
                                <input type="checkbox" name="products" value={p.id} checked={checked} onChange={() => toggle(p.id)} className="h-4 w-4 shrink-0 accent-zi-blue" />
                                {p.name}
                            </label>
                        );
                    })}
                </div>
            </fieldset>

            <div className="mt-6">
                <label htmlFor="inq-message" className="mb-1.5 block text-[14px] font-semibold text-slate-800">
                    메시지 <span className="font-normal text-slate-400">(선택)</span>
                </label>
                <textarea id="inq-message" name="message" rows={4} maxLength={INQUIRY_MESSAGE_MAX} placeholder="궁금한 점, 원하는 일정, 연락 가능한 시간 등" value={values.message} onChange={set('message')} aria-invalid={!!errors.message} className={cn(inputClass, 'resize-y')} />
                {fieldError('message')}
            </div>

            {/* 사람에게는 보이지 않는 함정 필드 (자동 입력 봇 차단). 화면·스크린리더·탭 이동·자동 완성 모두 제외, 라벨 없음 */}
            <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0">
                <input
                    id="inq-hp"
                    type="text"
                    name={INQUIRY_HONEYPOT_FIELD}
                    tabIndex={-1}
                    autoComplete="off"
                    data-1p-ignore=""
                    data-lpignore="true"
                    aria-hidden="true"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                />
            </div>

            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-[13px] leading-relaxed text-slate-600">
                <p className="mb-1.5 font-semibold text-slate-700">개인정보 수집·이용 안내</p>
                <ul className="list-disc space-y-0.5 pl-4">
                    <li>수집 항목: 회사명, 담당자명, 전화번호·이메일, 관심 항목, 메시지</li>
                    <li>이용 목적: 기업 등록·제휴 문의 응대, 진단 결과·제안 안내</li>
                    <li>보유 기간: {retentionNote}</li>
                </ul>
                <p className="mt-1.5">동의하지 않으실 수 있으며, 이 경우 문의를 접수할 수 없습니다.</p>
                <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[14px] text-slate-800">
                    <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => {
                            markStarted();
                            setConsent(e.target.checked);
                        }}
                        aria-invalid={!!errors.consent}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-zi-blue"
                    />
                    <span>
                        개인정보 수집·이용에 동의합니다 <span className="text-red-600">(필수)</span> ·{' '}
                        <Link href="/privacy" target="_blank" className="text-zi-blue underline underline-offset-2">
                            개인정보처리방침
                        </Link>
                    </span>
                </label>
                {fieldError('consent')}
            </div>

            {serverError && (
                <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-[14px] text-red-700">
                    {serverError}
                </p>
            )}

            <button
                type="submit"
                disabled={status === 'sending'}
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-zi-btn bg-zi-primary px-8 text-[15px] font-bold text-white transition-all hover:bg-zi-primary/90 active:scale-[0.99] disabled:opacity-60 sm:w-auto"
            >
                {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                문의 보내기
            </button>
        </form>
    );
}
