'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ExternalLink, FolderOpen, Link2, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StorageImageSelectorModal } from '@/components/admin/storage/StorageImageSelectorModal';
import {
    getOrganizationLinks,
    saveOrganizationLinks,
    type AdminLinkClickSummary,
    type AdminOrgLinkRow,
} from '@/actions/admin/org-link-actions';
import {
    ORG_LINK_DISPLAYS,
    ORG_LINK_DISPLAY_LABEL,
    ORG_LINK_KINDS,
    ORG_LINK_KIND_LABEL,
    ORG_LINK_MAX,
    detectSocialPlatform,
    type OrgLinkDisplay,
    type OrgLinkKind,
} from '@/lib/org-links';

const SELECT_CLASS =
    'flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

// 자동 노출 항목(프로필·기사·문의 등)의 클릭 집계 키 표시명
function autoKeyLabel(item: AdminLinkClickSummary): string {
    if (item.key === 'profile') return '프로필 전체 보기 (자동)';
    if (item.key === 'inquiry') return '문의하기 (자동)';
    if (item.key === 'home') return '하단 진사이트 표기';
    if (item.key.startsWith('article:')) return `기사: ${item.label}`;
    return item.label;
}

type Row = AdminOrgLinkRow & { uid: string };

let uidSeq = 0;
const withUid = (row: AdminOrgLinkRow): Row => ({ ...row, uid: `r${++uidSeq}` });

/**
 * 링크 페이지(/insight-radar/[slug]/links) 링크 관리.
 * 조직 기본 정보 저장과 별개로 이 카드의 [링크 저장]으로 저장한다.
 */
export function OrgLinksManager({ organizationId, slug }: { organizationId: number; slug: string }) {
    const [rows, setRows] = useState<Row[]>([]);
    const [isDefault, setIsDefault] = useState(false);
    const [clickSummary, setClickSummary] = useState<AdminLinkClickSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [thumbTarget, setThumbTarget] = useState<string | null>(null);
    const [isSaving, startSaving] = useTransition();

    const load = async () => {
        const res = await getOrganizationLinks(organizationId);
        if (res.success) {
            setRows(res.data.rows.map(withUid));
            setIsDefault(res.data.isDefault);
            setClickSummary(res.data.clickSummary);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId]);

    const update = (uid: string, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));

    const move = (index: number, delta: number) =>
        setRows((prev) => {
            const target = index + delta;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });

    const add = () => {
        if (rows.length >= ORG_LINK_MAX) return;
        setRows((prev) => [
            ...prev,
            withUid({ id: null, label: '', url: '', kind: 'custom', display: 'button', subtitle: null, thumbnail_url: null, is_visible: true, clicks30d: 0 }),
        ]);
    };

    // 주소 입력 시 SNS면 종류·형태를 자동 제안 (라벨이 비어 있을 때만 형태 변경)
    const changeUrl = (row: Row, url: string) => {
        const platform = detectSocialPlatform(url);
        update(row.uid, platform && row.kind === 'custom' && !row.label ? { url, kind: 'sns', display: 'icon' } : { url });
    };

    const save = () => {
        const invalid = rows.find((r) => !r.label.trim() || !/^https?:\/\/\S+$/i.test(r.url.trim()));
        if (invalid) {
            toast.error('라벨과 http(s) 주소를 모두 입력해 주세요.');
            return;
        }
        startSaving(async () => {
            const res = await saveOrganizationLinks(
                organizationId,
                rows.map(({ uid: _uid, clicks30d: _c, ...rest }) => rest)
            );
            if (res.success) {
                toast.success(`링크 ${res.count}개를 저장했습니다.`);
                await load();
            } else {
                toast.error(res.error);
            }
        });
    };

    const autoClicks = clickSummary.filter((c) => !c.key.startsWith('link:') && !c.key.startsWith('auto:'));
    const previewHref = slug ? `/insight-radar/${slug}/links` : `/insight-radar/${organizationId}/links`;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-blue-600" />
                            링크 페이지 관리
                        </CardTitle>
                        <CardDescription>
                            명함 QR(링크 페이지 모드)·SNS 프로필 링크용 화면입니다. 프로필 카드와 최근 매거진 기사 2개는 자동으로 들어갑니다.
                        </CardDescription>
                    </div>
                    <a
                        href={previewHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium hover:bg-muted"
                    >
                        미리보기 <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…
                    </p>
                ) : (
                    <>
                        {isDefault && (
                            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                아직 저장된 링크가 없어 홈페이지·외부 링크·소개자료로 만든 기본 목록을 보여 주고 있습니다. 수정 후 [링크 저장]을 누르면 이 목록으로 고정됩니다.
                            </p>
                        )}

                        {rows.length === 0 && <p className="text-sm text-muted-foreground">등록된 링크가 없습니다.</p>}

                        <ol className="space-y-2">
                            {rows.map((row, index) => (
                                <li key={row.uid} className={`rounded-lg border p-3 space-y-2 ${row.is_visible ? 'bg-white' : 'bg-slate-50 opacity-70'}`}>
                                    <div className="flex items-center gap-1.5">
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
                                        <Input
                                            value={row.label}
                                            onChange={(e) => update(row.uid, { label: e.target.value })}
                                            placeholder="라벨 (예: 홈페이지 바로가기)"
                                            maxLength={100}
                                            className="h-9 flex-1"
                                            aria-label="라벨"
                                        />
                                        <select
                                            value={row.display}
                                            onChange={(e) => update(row.uid, { display: e.target.value as OrgLinkDisplay })}
                                            className={`${SELECT_CLASS} w-20 shrink-0`}
                                            aria-label="표시 형태"
                                        >
                                            {ORG_LINK_DISPLAYS.map((d) => (
                                                <option key={d} value={d}>
                                                    {ORG_LINK_DISPLAY_LABEL[d]}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setRows((prev) => prev.filter((r) => r.uid !== row.uid))}
                                            className="h-9 w-9 shrink-0 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                            aria-label="링크 삭제"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-1.5 pl-6">
                                        <Input
                                            value={row.url}
                                            onChange={(e) => changeUrl(row, e.target.value)}
                                            placeholder="https://..."
                                            className="h-9 flex-1"
                                            aria-label="주소"
                                        />
                                        <select
                                            value={row.kind}
                                            onChange={(e) => update(row.uid, { kind: e.target.value as OrgLinkKind })}
                                            className={`${SELECT_CLASS} w-24 shrink-0`}
                                            aria-label="링크 종류"
                                        >
                                            {ORG_LINK_KINDS.map((k) => (
                                                <option key={k} value={k}>
                                                    {ORG_LINK_KIND_LABEL[k]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {row.display === 'card' && (
                                        <div className="flex items-center gap-1.5 pl-6">
                                            <Input
                                                value={row.subtitle ?? ''}
                                                onChange={(e) => update(row.uid, { subtitle: e.target.value })}
                                                placeholder="보조 문구 (예: 이벤트)"
                                                maxLength={100}
                                                className="h-9 w-36 shrink-0"
                                                aria-label="보조 문구"
                                            />
                                            <Input
                                                value={row.thumbnail_url ?? ''}
                                                onChange={(e) => update(row.uid, { thumbnail_url: e.target.value })}
                                                placeholder="썸네일 이미지 URL"
                                                className="h-9 flex-1"
                                                aria-label="썸네일 이미지 URL"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setThumbTarget(row.uid)}
                                                className="h-9 shrink-0 gap-1 px-2.5 text-xs"
                                                aria-label="썸네일 보관함에서 선택"
                                            >
                                                <FolderOpen className="h-3.5 w-3.5" />
                                                보관함
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pl-6 text-xs text-muted-foreground">
                                        <label className="inline-flex items-center gap-1.5">
                                            <input
                                                type="checkbox"
                                                checked={row.is_visible}
                                                onChange={(e) => update(row.uid, { is_visible: e.target.checked })}
                                                className="h-3.5 w-3.5"
                                            />
                                            노출
                                        </label>
                                        <span className="tabular-nums">최근 30일 클릭 {row.clicks30d.toLocaleString()}회</span>
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <div className="flex items-center justify-between gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={add} disabled={rows.length >= ORG_LINK_MAX} className="gap-1">
                                <Plus className="h-3.5 w-3.5" /> 링크 추가
                            </Button>
                            <Button type="button" size="sm" onClick={save} disabled={isSaving} className="gap-1">
                                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                링크 저장
                            </Button>
                        </div>

                        {autoClicks.length > 0 && (
                            <div className="border-t pt-3">
                                <p className="mb-1.5 text-xs font-semibold text-slate-600">자동 항목 클릭 (최근 30일)</p>
                                <ul className="space-y-1 text-xs">
                                    {autoClicks.map((c) => (
                                        <li key={c.key} className="flex items-center justify-between gap-2">
                                            <span className="truncate text-slate-700">{autoKeyLabel(c)}</span>
                                            <span className="shrink-0 tabular-nums text-slate-500">
                                                {c.total.toLocaleString()}회
                                                {c.qr > 0 && (
                                                    <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                                                        QR {c.qr}
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
                    if (thumbTarget) update(thumbTarget, { thumbnail_url: url });
                }}
            />
        </Card>
    );
}
