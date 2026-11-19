'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Copy, ExternalLink, FileText, Link2Off, RefreshCw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
    issueShareLink,
    revokeShareLink,
    updateShareLink,
    type ShareLinkInfo,
} from '@/actions/admin/stats-share-actions';

const kstDateTime = (iso: string) =>
    new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
// 만료 시각은 만료일 다음 날 0시(KST)로 저장 → 화면에는 만료일(그날까지 열림)로 표시
const expiresOnOf = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(new Date(iso).getTime() - 1)) : '';

const dateInputClass = 'h-10 sm:h-8 rounded-md border bg-card px-2 text-xs';

/** 링크 페이지 통계 외부 공유 링크: 참가사가 로그인 없이 보는 읽기 전용 통계 */
export function StatsSharePanel({ orgId, initial }: { orgId: number; initial: ShareLinkInfo | null }) {
    const confirm = useConfirm();
    const [link, setLink] = useState(initial);
    const [pending, startTransition] = useTransition();
    const [editing, setEditing] = useState(false);
    const [from, setFrom] = useState(initial?.defaultFrom ?? '');
    const [to, setTo] = useState(initial?.defaultTo ?? '');
    const [expiresOn, setExpiresOn] = useState(expiresOnOf(initial?.expiresAt ?? null));

    const fullUrl = (path: string) => `${window.location.origin}${path}`;
    const input = () => ({ defaultFrom: from || null, defaultTo: to || null, expiresOn: expiresOn || null });

    const copy = async (path: string) => {
        try {
            await navigator.clipboard.writeText(fullUrl(path));
            toast.success('공유 링크를 복사했습니다.');
        } catch {
            toast.error('복사하지 못했습니다. 링크를 직접 선택해 복사해 주세요.');
        }
    };

    const apply = (next: ShareLinkInfo) => {
        setLink(next);
        setFrom(next.defaultFrom ?? '');
        setTo(next.defaultTo ?? '');
        setExpiresOn(expiresOnOf(next.expiresAt));
        setEditing(false);
    };

    const issue = async (reissue: boolean) => {
        if (reissue) {
            const ok = await confirm({
                title: '공유 링크 새로 발급',
                description: '새 주소를 만들고, 지금 주소는 즉시 열리지 않게 합니다.\n참가사에게 새 링크를 다시 보내야 합니다.',
                confirmText: '새로 발급',
                variant: 'destructive',
            });
            if (!ok) return;
        }
        startTransition(async () => {
            const result = await issueShareLink(orgId, input());
            if (!result.ok) return void toast.error(result.error);
            apply(result.data);
            if (result.data.path) await copy(result.data.path);
        });
    };

    const save = () =>
        startTransition(async () => {
            const result = await updateShareLink(orgId, input());
            if (!result.ok) return void toast.error(result.error);
            apply(result.data);
            toast.success('공유 링크 설정을 저장했습니다.');
        });

    const revoke = async () => {
        const ok = await confirm({
            title: '공유 링크 끊기',
            description: '이 링크는 즉시 열리지 않습니다. 다시 공유하려면 새로 발급해야 합니다.',
            confirmText: '끊기',
            variant: 'destructive',
        });
        if (!ok) return;
        startTransition(async () => {
            const result = await revokeShareLink(orgId);
            if (!result.ok) return void toast.error(result.error);
            setLink(null);
            setEditing(false);
            toast.success('공유 링크를 끊었습니다.');
        });
    };

    const settings = (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground">기본 기간 (전시 기간, 선택)</p>
                <div className="flex items-center gap-1.5">
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="기본 기간 시작일" className={dateInputClass} />
                    <span className="text-xs text-muted-foreground">~</span>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="기본 기간 종료일" className={dateInputClass} />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground">만료일 (선택, 그날까지 열림)</p>
                <input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} aria-label="만료일" className={dateInputClass} />
            </div>
        </div>
    );

    return (
        <Card>
            <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold">
                            <Share2 className="h-4 w-4 text-indigo-600" /> 통계 공유 링크
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            참가사가 로그인 없이 볼 수 있는 읽기 전용 통계입니다. 익명 숫자만 보이며 받은 연락처는 포함하지 않습니다.
                        </p>
                    </div>
                </div>

                {!link ? (
                    <div className="space-y-3">
                        {settings}
                        <Button type="button" size="sm" className="h-10 gap-1.5 text-xs sm:h-8" disabled={pending} onClick={() => issue(false)}>
                            <Share2 className="h-3.5 w-3.5" /> 공유 링크 만들기
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {link.path ? (
                            <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                                <code className="min-w-0 flex-1 truncate text-xs" title="토큰이 포함된 주소입니다. 참가사에게만 전달하세요.">
                                    {link.path.slice(0, '/share/stats/'.length + 6)}…
                                </code>
                                <Button type="button" size="sm" variant="outline" className="h-9 shrink-0 gap-1 text-xs sm:h-8" onClick={() => copy(link.path!)}>
                                    <Copy className="h-3.5 w-3.5" /> 복사
                                </Button>
                            </div>
                        ) : (
                            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                서버 비밀값이 바뀌어 주소를 다시 표시할 수 없습니다. 링크는 계속 열리며, 복사하려면 새로 발급해 주세요.
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground tabular-nums">
                            만든 날 {kstDateTime(link.createdAt)} · 조회 {link.viewCount.toLocaleString()}회
                            {link.lastViewedAt ? ` · 마지막 조회 ${kstDateTime(link.lastViewedAt)}` : ' · 아직 조회 없음'}
                            {' · '}
                            {link.defaultFrom ? `기본 기간 ${link.defaultFrom} ~ ${link.defaultTo}` : '기본 기간 전체'}
                            {link.expiresAt ? ` · ${expiresOnOf(link.expiresAt)}까지 열림` : ' · 만료 없음'}
                        </p>
                        {editing && settings}
                        <div className="flex flex-wrap gap-2">
                            {link.path && (
                                <>
                                    <a href={link.path} target="_blank" rel="noreferrer">
                                        <Button type="button" size="sm" variant="outline" className="h-10 gap-1 text-xs sm:h-8">
                                            <ExternalLink className="h-3.5 w-3.5" /> 공유 페이지
                                        </Button>
                                    </a>
                                    <a href={`${link.path}/report`} target="_blank" rel="noreferrer">
                                        <Button type="button" size="sm" variant="outline" className="h-10 gap-1 text-xs sm:h-8">
                                            <FileText className="h-3.5 w-3.5" /> 요약 리포트
                                        </Button>
                                    </a>
                                </>
                            )}
                            {editing ? (
                                <Button type="button" size="sm" className="h-10 text-xs sm:h-8" disabled={pending} onClick={save}>
                                    설정 저장
                                </Button>
                            ) : (
                                <Button type="button" size="sm" variant="outline" className="h-10 text-xs sm:h-8" onClick={() => setEditing(true)}>
                                    기간·만료 변경
                                </Button>
                            )}
                            <Button type="button" size="sm" variant="outline" className="h-10 gap-1 text-xs sm:h-8" disabled={pending} onClick={() => issue(true)}>
                                <RefreshCw className="h-3.5 w-3.5" /> 새로 발급
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="h-10 gap-1 text-xs text-rose-600 hover:text-rose-700 sm:h-8" disabled={pending} onClick={revoke}>
                                <Link2Off className="h-3.5 w-3.5" /> 끊기
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
