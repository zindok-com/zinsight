'use client';

import { useId, useRef, useState, useTransition } from 'react';
import { CheckCircle2, NotebookPen, X } from 'lucide-react';
import { submitLinkPageLead } from '@/actions/link-page-lead-actions';
import { LEAD_MEMO_MAX, LEAD_NAME_MAX, LEAD_PHONE_MAX, LEAD_EMAIL_MAX, normalizeLeadInput, validateLeadInput, type LeadField } from '@/lib/link-page-lead';
import { getLinkPageSource } from '@/components/public/insight-radar/links/LinkPageTracker';

interface LinkPageLeadFormProps {
    slug: string;
    orgName: string;
    /** 하단 바에서 단독 버튼인지(강조) 문의하기 옆 보조 버튼인지 */
    primary: boolean;
}

const inputClass =
    'mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-zi-blue focus:outline-none focus:ring-2 focus:ring-zi-blue/30 aria-[invalid=true]:border-red-500';

/**
 * 링크 페이지 '연락처 남기기': 하단 시트(dialog)로 이름·연락처·메모를 받아 접수.
 * 접수 내용은 진사이트 관리자 화면의 '받은 연락처'에서 확인하고 해당 기관에 전달.
 */
export function LinkPageLeadForm({ slug, orgName, primary }: LinkPageLeadFormProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const uid = useId();
    const [errors, setErrors] = useState<Partial<Record<LeadField, string>>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [memoLength, setMemoLength] = useState(0);
    const [pending, startTransition] = useTransition();

    const open = () => {
        setDone(false);
        setFormError(null);
        dialogRef.current?.showModal();
        window.gtag?.('event', 'lead_form_open', { page_type: 'link_page', org_slug: slug });
    };
    const close = () => dialogRef.current?.close();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const raw = {
            name: fd.get('name'),
            phone: fd.get('phone'),
            email: fd.get('email'),
            memo: fd.get('memo'),
            consent: fd.get('consent') === 'on',
        };
        const clientErrors = validateLeadInput(normalizeLeadInput(raw));
        setErrors(clientErrors);
        setFormError(null);
        if (Object.keys(clientErrors).length > 0) {
            // 첫 번째 잘못된 항목으로 이동 (오류 표시가 그려진 뒤)
            requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
            return;
        }

        startTransition(async () => {
            const result = await submitLinkPageLead({
                slug,
                src: getLinkPageSource(slug),
                name: String(raw.name ?? ''),
                phone: String(raw.phone ?? ''),
                email: String(raw.email ?? ''),
                memo: String(raw.memo ?? ''),
                consent: raw.consent,
                website: String(fd.get('website') ?? ''),
            }).catch(() => ({ ok: false as const, error: '접수하지 못했습니다. 잠시 후 다시 시도해 주세요.' }));

            if (result.ok) {
                formRef.current?.reset();
                setMemoLength(0);
                setErrors({});
                setDone(true);
                window.gtag?.('event', 'generate_lead', { page_type: 'link_page', org_slug: slug, source_code: getLinkPageSource(slug) });
            } else {
                setErrors(('fieldErrors' in result && result.fieldErrors) || {});
                setFormError(result.error);
            }
        });
    };

    const fieldId = (name: string) => `${uid}-${name}`;
    const errorText = (field: LeadField) =>
        errors[field] ? (
            <p id={fieldId(`${field}-error`)} className="mt-1 text-xs text-red-600">
                {errors[field]}
            </p>
        ) : null;

    return (
        <>
            <button
                type="button"
                onClick={open}
                data-link-key="lead"
                data-link-label="연락처 남기기"
                data-link-kind="cta"
                className={
                    primary
                        ? 'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zi-blue text-[15px] font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zi-blue'
                        : 'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-zi-blue bg-white text-[15px] font-bold text-zi-blue transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zi-blue'
                }
            >
                <NotebookPen className="h-4 w-4" aria-hidden="true" />
                연락처 남기기
            </button>

            <dialog
                ref={dialogRef}
                aria-labelledby={fieldId('title')}
                onClick={(e) => {
                    // 바깥(배경) 클릭 시 닫기
                    if (e.target === dialogRef.current) close();
                }}
                className="m-0 mx-auto mt-auto max-h-[92dvh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
            >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
                    <h2 id={fieldId('title')} className="text-lg font-bold">
                        연락처 남기기
                    </h2>
                    <button
                        type="button"
                        onClick={close}
                        aria-label="닫기"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zi-blue"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                {done ? (
                    <div className="px-5 pt-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center" role="status">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden="true" />
                        <p className="mt-3 text-base font-bold break-keep">연락처가 접수되었습니다.</p>
                        <p className="mt-1 text-sm text-slate-600 break-keep">{orgName}에서 확인 후 연락드립니다.</p>
                        <button
                            type="button"
                            onClick={close}
                            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-[15px] font-bold text-white hover:bg-slate-800"
                        >
                            닫기
                        </button>
                    </div>
                ) : (
                    <form
                        ref={formRef}
                        onSubmit={handleSubmit}
                        noValidate
                        className="space-y-4 px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
                    >
                        <p className="text-sm text-slate-600 break-keep">
                            <strong className="text-slate-900">{orgName}</strong>에 연락받을 정보와 남길 말씀을 적어 주세요.
                        </p>

                        {/* 봇 차단용 숨김 필드 (사람에게는 보이지 않음) */}
                        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                            <label>
                                웹사이트
                                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                            </label>
                        </div>

                        <div>
                            <label htmlFor={fieldId('name')} className="text-sm font-semibold">
                                이름 <span className="text-red-600" aria-hidden="true">*</span>
                            </label>
                            <input
                                id={fieldId('name')}
                                name="name"
                                type="text"
                                autoComplete="name"
                                maxLength={LEAD_NAME_MAX}
                                required
                                aria-invalid={!!errors.name}
                                aria-describedby={errors.name ? fieldId('name-error') : undefined}
                                className={inputClass}
                            />
                            {errorText('name')}
                        </div>

                        <fieldset aria-describedby={errors.contact ? fieldId('contact-error') : undefined}>
                            <legend className="text-sm font-semibold">
                                연락처 <span className="text-red-600" aria-hidden="true">*</span>
                                <span className="ml-1 text-xs font-normal text-slate-500">전화번호·이메일 중 하나 이상</span>
                            </legend>
                            <label htmlFor={fieldId('phone')} className="sr-only">
                                전화번호
                            </label>
                            <input
                                id={fieldId('phone')}
                                name="phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="전화번호 (예: 010-1234-5678)"
                                maxLength={LEAD_PHONE_MAX}
                                aria-invalid={!!errors.phone || !!errors.contact}
                                aria-describedby={errors.phone ? fieldId('phone-error') : undefined}
                                className={inputClass}
                            />
                            {errorText('phone')}
                            <label htmlFor={fieldId('email')} className="sr-only">
                                이메일
                            </label>
                            <input
                                id={fieldId('email')}
                                name="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="이메일 (예: name@example.com)"
                                maxLength={LEAD_EMAIL_MAX}
                                aria-invalid={!!errors.email || !!errors.contact}
                                aria-describedby={errors.email ? fieldId('email-error') : undefined}
                                className={inputClass}
                            />
                            {errorText('email')}
                            {errorText('contact')}
                        </fieldset>

                        <div>
                            <div className="flex items-baseline justify-between">
                                <label htmlFor={fieldId('memo')} className="text-sm font-semibold">
                                    메모 <span className="text-xs font-normal text-slate-500">(선택)</span>
                                </label>
                                <span className="text-xs tabular-nums text-slate-400" aria-live="polite">
                                    {memoLength}/{LEAD_MEMO_MAX}
                                </span>
                            </div>
                            <textarea
                                id={fieldId('memo')}
                                name="memo"
                                rows={4}
                                maxLength={LEAD_MEMO_MAX}
                                placeholder="문의 내용, 연락 가능한 시간 등"
                                onChange={(e) => setMemoLength(e.target.value.length)}
                                aria-invalid={!!errors.memo}
                                aria-describedby={errors.memo ? fieldId('memo-error') : undefined}
                                className={`${inputClass} resize-none`}
                            />
                            {errorText('memo')}
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                            <label className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                                <input
                                    type="checkbox"
                                    name="consent"
                                    aria-invalid={!!errors.consent}
                                    aria-describedby={`${fieldId('consent-detail')}${errors.consent ? ` ${fieldId('consent-error')}` : ''}`}
                                    className="mt-0.5 h-5 w-5 shrink-0 accent-zi-blue"
                                />
                                <span>
                                    개인정보 수집·이용 및 제공에 동의합니다. <span className="text-red-600" aria-hidden="true">*</span>
                                </span>
                            </label>
                            <ul id={fieldId('consent-detail')} className="mt-2 space-y-0.5 pl-7">
                                <li>수집 항목: 이름, 전화번호 또는 이메일, 메모</li>
                                <li>이용 목적: 문의 응대 및 연락</li>
                                <li>제공받는 곳: {orgName} (진사이트 운영사 진독이 접수해 전달)</li>
                                <li>보유 기간: 접수일로부터 1년, 삭제 요청 시 즉시 파기</li>
                                <li>동의하지 않을 수 있으며, 이 경우 연락처 남기기를 이용할 수 없습니다.</li>
                            </ul>
                            {errorText('consent') && <div className="pl-7">{errorText('consent')}</div>}
                        </div>

                        {formError && (
                            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                {formError}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={pending}
                            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-zi-blue text-[15px] font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zi-blue"
                        >
                            {pending ? '보내는 중…' : '보내기'}
                        </button>
                    </form>
                )}
            </dialog>
        </>
    );
}
