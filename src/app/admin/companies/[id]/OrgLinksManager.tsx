'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, FolderOpen, Link2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StorageImageSelectorModal } from '@/components/admin/storage/StorageImageSelectorModal';
import { BrandIcon } from '@/components/public/insight-radar/links/BrandIcon';
import {
    getOrganizationLinks,
    saveOrganizationCardItems,
    type AdminCardRow,
    type AdminLinkClickSummary,
} from '@/actions/admin/org-link-actions';
import { ORG_LINK_DISPLAYS, ORG_LINK_DISPLAY_LABEL, type OrgLinkDisplay } from '@/lib/org-links';
import { CHANNEL_TYPES } from '@/lib/org-channels';

// 자동 노출 항목(프로필·기사·문의 등)의 클릭 집계 키 표시명
function autoKeyLabel(item: AdminLinkClickSummary): string {
    if (item.key === 'profile') return '프로필 전체 보기 (자동)';
    if (item.key === 'inquiry') return '문의하기 (자동)';
    if (item.key === 'lead') return '연락처 남기기 (자동)';
    if (item.key === 'home') return '하단 진사이트 표기';
    if (item.key.startsWith('article:')) return `기사: ${item.label}`;
    return item.label;
}

function shortUrl(url: string): string {
    return url.replace(/^https:\/\/(www\.)?/, '');
}

/**
 * 진사이트 카드(/insight-radar/[slug]/links) 링크 관리.
 * 링크 주소·문구는 프로필 편집의 '공식 채널'에서만 바꾸고, 여기서는 순서·노출·형태만 정한다.
 * 새로 추가한 공식 채널은 기본 형태로 카드 맨 뒤에 자동으로 붙는다. reloadKey가 바뀌면(프로필 저장 후) 다시 불러온다
 */
export function OrgLinksManager({ organizationId, slug, reloadKey = 0 }: { organizationId: number; slug: string; reloadKey?: number }) {
    const [rows, setRows] = useState<AdminCardRow[]>([]);
    const [mode, setMode] = useState<'channels' | 'legacy'>('channels');
    const [clickSummary, setClickSummary] = useState<AdminLinkClickSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [thumbTarget, setThumbTarget] = useState<number | null>(null);
    const [isSaving, startSaving] = useTransition();

    const load = async () => {
        const res = await getOrganizationLinks(organizationId);
        if (res.success) {
            setRows(res.data.rows);
            setMode(res.data.mode);
            setClickSummary(res.data.clickSummary);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, reloadKey]);

    const update = (channelId: number | null, patch: Partial<AdminCardRow>) =>
        setRows((prev) => prev.map((r) => (r.channelId === channelId ? { ...r, ...patch } : r)));

    const move = (index: number, delta: number) =>
        setRows((prev) => {
            const target = index + delta;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });

    const save = () => {
        startSaving(async () => {
            const res = await saveOrganizationCardItems(
                organizationId,
                rows
                    .filter((r): r is AdminCardRow & { channelId: number } => r.channelId !== null)
                    .map((r) => ({ channelId: r.channelId, display: r.display, subtitle: r.subtitle, thumbnail_url: r.thumbnail_url, is_visible: r.is_visible }))
            );
            if (res.success) {
                toast.success('카드 링크 설정을 저장했습니다.');
                await load();
            } else {
                toast.error(res.error);
            }
        });
    };

    const autoClicks = clickSummary.filter((c) => !/^(link|auto|ch):/.test(c.key));
    const previewHref = slug ? `/insight-radar/${slug}/links` : `/insight-radar/${organizationId}/links`;
    const editable = mode === 'channels';

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-blue-600" />
                            진사이트 카드 링크
                        </CardTitle>
                        <CardDescription>
                            주소·문구는 위 &apos;공식 채널&apos;에서 바꿉니다. 여기서는 카드에 보일 순서·노출·형태만 정합니다. 프로필 카드와 최근 매거진 기사 2개는 자동으로 들어갑니다.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <a
                            href={`/admin/companies/${organizationId}/link-analytics`}
                            className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium hover:bg-muted"
                        >
                            통계 보기
                        </a>
                        <a
                            href={previewHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium hover:bg-muted"
                        >
                            미리보기 <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…
                    </p>
                ) : (
                    <>
                        {!editable && (
                            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                아직 공식 채널이 저장되지 않아 기존 홈페이지·외부 링크·소개자료로 카드를 보여 주고 있습니다. 위 공식 채널을 확인하고 [저장]을 누르면 여기서 순서·노출·형태를 정할 수 있습니다.
                            </p>
                        )}

                        {rows.length === 0 && <p className="text-sm text-muted-foreground">공식 채널이 없습니다. 위 &apos;공식 채널&apos;에서 추가해 주세요.</p>}

                        <ol className="space-y-2">
                            {rows.map((row, index) => (
                                <li
                                    key={row.channelId ?? `legacy-${index}`}
                                    className={`rounded-lg border p-3 space-y-2 ${row.is_visible ? 'bg-white' : 'bg-slate-50 opacity-70'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {editable && (
                                            <div className="flex shrink-0 flex-col">
                                                <button
                                                    type="button"
                                                    onClick={() => move(index, -1)}
                                                    disabled={index === 0}
                                                    className="rounded p-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                                    aria-label="위로 이동"
                                                >
                                                    <ArrowUp className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => move(index, 1)}
                                                    disabled={index === rows.length - 1}
                                                    className="rounded p-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                                    aria-label="아래로 이동"
                                                >
                                                    <ArrowDown className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}
                                        <BrandIcon type={row.type} className="h-5 w-5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {row.text}
                                                <span className="ml-1.5 text-[11px] font-normal text-slate-500">{CHANNEL_TYPES[row.type].label}</span>
                                            </p>
                                            <p className="truncate text-xs text-slate-500">{shortUrl(row.url)}</p>
                                        </div>
                                        {editable && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => update(row.channelId, { is_visible: !row.is_visible })}
                                                className="h-9 w-9 shrink-0 p-0 text-slate-600"
                                                aria-label={row.is_visible ? '카드에서 숨기기' : '카드에 보이기'}
                                                aria-pressed={!row.is_visible}
                                                title={row.is_visible ? '카드에 보임' : '숨김'}
                                            >
                                                {row.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 pl-0 sm:pl-6">
                                        <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="표시 형태">
                                            {ORG_LINK_DISPLAYS.map((d) => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    disabled={!editable}
                                                    onClick={() => update(row.channelId, { display: d as OrgLinkDisplay })}
                                                    aria-pressed={row.display === d}
                                                    className={`h-7 rounded px-2.5 text-xs font-medium ${row.display === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'} disabled:cursor-not-allowed`}
                                                >
                                                    {ORG_LINK_DISPLAY_LABEL[d]}
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {!row.is_visible ? '숨김 · ' : !row.hasSetting && editable ? '기본 설정 · ' : ''}최근 30일 클릭 {row.clicks30d.toLocaleString()}회
                                        </span>
                                    </div>
                                    {editable && row.display === 'card' && (
                                        <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-6">
                                            <Input
                                                value={row.subtitle ?? ''}
                                                onChange={(e) => update(row.channelId, { subtitle: e.target.value })}
                                                placeholder="보조 문구 (예: 이벤트)"
                                                maxLength={100}
                                                className="h-9 w-full sm:w-36"
                                                aria-label="보조 문구"
                                            />
                                            <Input
                                                value={row.thumbnail_url ?? ''}
                                                onChange={(e) => update(row.channelId, { thumbnail_url: e.target.value })}
                                                placeholder="썸네일 이미지 URL"
                                                className="h-9 min-w-0 flex-1"
                                                aria-label="썸네일 이미지 URL"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setThumbTarget(row.channelId)}
                                                className="h-9 shrink-0 gap-1 px-2.5 text-xs"
                                                aria-label="썸네일 보관함에서 선택"
                                            >
                                                <FolderOpen className="h-3.5 w-3.5" />
                                                보관함
                                            </Button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ol>

                        {editable && rows.length > 0 && (
                            <div className="flex justify-end">
                                <Button type="button" size="sm" onClick={save} disabled={isSaving} className="gap-1">
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    카드 설정 저장
                                </Button>
                            </div>
                        )}

                        {autoClicks.length > 0 && (
                            <div className="border-t pt-3">
                                <p className="mb-1.5 text-xs font-semibold text-slate-600">자동 항목 클릭 (최근 30일)</p>
                                <ul className="space-y-1 text-xs">
                                    {autoClicks.map((c) => (
                                        <li key={c.key} className="flex items-center justify-between gap-2">
                                            <span className="truncate text-slate-700">{autoKeyLabel(c)}</span>
                                            <span className="shrink-0 tabular-nums text-slate-500">
                                                {c.total.toLocaleString()}회
                                                {c.viaGo > 0 && (
                                                    <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                                                        /go {c.viaGo}
                                                    </Badge>
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            <StorageImageSelectorModal
                isOpen={thumbTarget !== null}
                accept="image"
                onClose={() => setThumbTarget(null)}
                onSelect={(url) => {
                    if (thumbTarget !== null) update(thumbTarget, { thumbnail_url: url });
                }}
            />
        </Card>
    );
}
