'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, FolderOpen, Globe, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StorageImageSelectorModal } from '@/components/admin/storage/StorageImageSelectorModal';
import { BrandIcon } from '@/components/public/insight-radar/links/BrandIcon';
import {
    CHANNELS_MAX,
    CHANNEL_LABEL_MAX,
    CHANNEL_TYPES,
    CHANNEL_TYPE_OPTIONS,
    channelText,
    guessChannelType,
    normalizeChannelUrl,
    profileHeaderChannels,
    sameChannelUrl,
    smartstoreRootOf,
    type ChannelInput,
    type ChannelType,
    type OrgChannel,
} from '@/lib/org-channels';

export interface ChannelEditorRow {
    uid: string;
    id: number | null;
    type: ChannelType;
    url: string;
    label: string;
    is_primary: boolean;
    /** 사람이 종류를 직접 고른 행은 주소가 바뀌어도 자동 판별하지 않음 */
    typeTouched: boolean;
    notes: string[];
}

let uidSeq = 0;
const nextUid = () => `c${++uidSeq}`;

export function channelRowsFrom(channels: Array<Pick<OrgChannel, 'id' | 'type' | 'url' | 'label' | 'isPrimary'>>): ChannelEditorRow[] {
    return channels.map((c) => ({
        uid: nextUid(),
        id: c.id,
        type: c.type,
        url: c.url,
        label: c.label ?? '',
        is_primary: c.isPrimary,
        typeTouched: true,
        notes: [],
    }));
}

export function channelInputsOf(rows: ChannelEditorRow[]): ChannelInput[] {
    return rows.map((r) => ({ id: r.id, type: r.type, url: r.url, label: r.label, is_primary: r.is_primary }));
}

const SELECT_CLASS =
    'flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

/**
 * 프로필 편집 '공식 채널' 섹션. 프로필 헤더·진사이트 카드·JSON-LD sameAs가 이 목록을 함께 쓴다.
 * 주소를 붙여 넣으면 종류를 자동 선택하고, 칸을 벗어나면 추적 파라미터 등을 정리한 주소로 바꾼다. 저장은 프로필 [저장]과 함께
 */
export function OfficialChannelsEditor({
    rows,
    onChange,
    headerCount,
}: {
    rows: ChannelEditorRow[];
    onChange: (rows: ChannelEditorRow[]) => void;
    headerCount: number;
}) {
    const [libraryTarget, setLibraryTarget] = useState<string | null>(null);

    const update = (uid: string, patch: Partial<ChannelEditorRow>) => onChange(rows.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
    const hasPrimaryOther = (uid: string) => rows.some((r) => r.uid !== uid && r.type === 'homepage');

    const changeUrl = (row: ChannelEditorRow, url: string) => {
        const patch: Partial<ChannelEditorRow> = { url, notes: [] };
        if (!row.typeTouched && url.trim()) {
            const n = normalizeChannelUrl(url);
            const type = guessChannelType(n.ok ? n.url : url, hasPrimaryOther(row.uid));
            patch.type = type;
            patch.is_primary = type === 'homepage' && !rows.some((r) => r.uid !== row.uid && r.is_primary);
        }
        update(row.uid, patch);
    };

    // 칸을 벗어날 때 정리된 주소로 바꾸고 무엇이 바뀌었는지 알려 줌
    const tidyUrl = (row: ChannelEditorRow) => {
        if (!row.url.trim()) return;
        const n = normalizeChannelUrl(row.url);
        if (n.ok && n.url !== row.url) update(row.uid, { url: n.url, notes: n.notes });
    };

    const changeType = (row: ChannelEditorRow, type: ChannelType) => {
        const becomesPrimary = type === 'homepage' && !rows.some((r) => r.uid !== row.uid && r.is_primary);
        update(row.uid, { type, typeTouched: true, is_primary: type === 'homepage' ? row.is_primary || becomesPrimary : false });
    };

    const setPrimary = (uid: string) => onChange(rows.map((r) => ({ ...r, is_primary: r.uid === uid })));

    const remove = (uid: string) => {
        const removed = rows.find((r) => r.uid === uid);
        let next = rows.filter((r) => r.uid !== uid);
        // 대표를 지우면 남은 첫 홈페이지를 대표로
        if (removed?.is_primary) {
            const firstHome = next.find((r) => r.type === 'homepage');
            next = next.map((r) => ({ ...r, is_primary: r === firstHome }));
        }
        onChange(next);
    };

    const move = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= rows.length) return;
        const next = [...rows];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    const add = () => {
        if (rows.length >= CHANNELS_MAX) return;
        const hasHome = rows.some((r) => r.type === 'homepage');
        onChange([
            ...rows,
            { uid: nextUid(), id: null, type: hasHome ? 'other' : 'homepage', url: '', label: '', is_primary: !hasHome, typeTouched: false, notes: [] },
        ]);
    };

    // 화면에서 바로 보이는 안내: 주소 오류, 중복, 기타 문구 누락
    const problemOf = (row: ChannelEditorRow, index: number): string | null => {
        if (!row.url.trim()) return null;
        const n = normalizeChannelUrl(row.url);
        if (!n.ok) return n.error;
        const dup = rows.findIndex((r, i) => i < index && r.url.trim() && sameChannelUrl(r.url, n.url));
        if (dup !== -1) return `${dup + 1}번째 채널과 주소가 같습니다.`;
        if (row.type === 'other' && !row.label.trim()) return "'기타'는 표시 문구를 입력해 주세요.";
        return null;
    };

    const headerSet = new Set(
        profileHeaderChannels(
            rows
                .filter((r) => r.url.trim())
                .map((r) => ({ id: null, type: r.type, url: r.uid, label: r.label || null, text: '', isPrimary: r.is_primary })),
            headerCount
        ).map((c) => c.url)
    );

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-600" />
                            공식 채널
                        </CardTitle>
                        <CardDescription>
                            홈페이지·SNS·지도·소개자료를 한곳에서 관리합니다. 프로필 헤더(대표 홈페이지 포함 위에서 {headerCount}개), 진사이트 카드, 검색엔진용 공식 채널 정보(sameAs)가 이 목록을 씁니다.
                        </CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={add} disabled={rows.length >= CHANNELS_MAX} className="gap-1">
                        <Plus className="h-3.5 w-3.5" /> 채널 추가
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {rows.length === 0 && <p className="text-sm text-muted-foreground">등록된 채널이 없습니다. [채널 추가]로 홈페이지 주소부터 넣어 주세요.</p>}
                <ol className="space-y-2">
                    {rows.map((row, index) => {
                        const problem = problemOf(row, index);
                        const storeRoot = row.type === 'smartstore' ? smartstoreRootOf(row.url) : null;
                        const def = CHANNEL_TYPES[row.type];
                        return (
                            <li key={row.uid} className={`rounded-lg border p-3 space-y-2 ${problem ? 'border-red-300 bg-red-50/40' : 'bg-white'}`}>
                                <div className="flex flex-wrap items-center gap-1.5">
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
                                    <BrandIcon type={row.type} className="h-5 w-5 shrink-0" />
                                    <select
                                        value={row.type}
                                        onChange={(e) => changeType(row, e.target.value as ChannelType)}
                                        className={`${SELECT_CLASS} w-[8.5rem] shrink-0 sm:w-40`}
                                        aria-label="채널 종류"
                                    >
                                        {CHANNEL_TYPE_OPTIONS.map((o) => (
                                            <option key={o.key} value={o.key}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                    {row.type === 'homepage' && (
                                        <label className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-700">
                                            <input
                                                type="radio"
                                                name="primary-homepage"
                                                checked={row.is_primary}
                                                onChange={() => setPrimary(row.uid)}
                                                className="h-3.5 w-3.5"
                                            />
                                            대표
                                        </label>
                                    )}
                                    {headerSet.has(row.uid) && (
                                        <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700" title="프로필 헤더에 보이는 채널">
                                            헤더
                                        </span>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => remove(row.uid)}
                                        className="ml-auto h-9 w-9 shrink-0 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                        aria-label="채널 삭제"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:pl-6">
                                    <div className="flex min-w-0 flex-1 gap-1.5">
                                        <Input
                                            value={row.url}
                                            onChange={(e) => changeUrl(row, e.target.value)}
                                            onBlur={() => tidyUrl(row)}
                                            placeholder="https://… (붙여 넣으면 종류를 자동으로 고릅니다)"
                                            className="h-9 min-w-0 flex-1"
                                            aria-label="주소"
                                            aria-invalid={!!problem}
                                            inputMode="url"
                                        />
                                        {row.type === 'brochure' && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setLibraryTarget(row.uid)}
                                                className="h-9 shrink-0 gap-1 px-2.5 text-xs"
                                                aria-label="파일 보관함에서 선택"
                                            >
                                                <FolderOpen className="h-3.5 w-3.5" />
                                                보관함
                                            </Button>
                                        )}
                                    </div>
                                    <Input
                                        value={row.label}
                                        onChange={(e) => update(row.uid, { label: e.target.value })}
                                        placeholder={row.type === 'other' ? '표시 문구 (필수)' : `기본: ${def.defaultText}`}
                                        maxLength={CHANNEL_LABEL_MAX}
                                        className="h-9 sm:w-56"
                                        aria-label="표시 문구"
                                    />
                                </div>
                                {(problem || row.notes.length > 0 || storeRoot) && (
                                    <div className="space-y-0.5 text-xs sm:pl-6">
                                        {problem && <p className="text-red-600">{problem}</p>}
                                        {!problem && row.notes.length > 0 && <p className="text-slate-500">주소를 정리했습니다: {row.notes.join(', ')}</p>}
                                        {storeRoot && (
                                            <p className="text-amber-700">
                                                상품 주소입니다. 공식 채널은 스토어 주소를 권장합니다.{' '}
                                                <button type="button" className="font-semibold underline" onClick={() => update(row.uid, { url: storeRoot, notes: ['스토어 주소로 변경'] })}>
                                                    스토어 주소로 바꾸기
                                                </button>
                                            </p>
                                        )}
                                    </div>
                                )}
                                {!problem && row.url.trim() && (
                                    <p className="text-[11px] text-slate-400 sm:pl-6">
                                        표시: {channelText(row.type, row.label)}
                                        {def.sameAs ? ' · 공식 채널 정보(sameAs) 포함' : ''}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </CardContent>

            <StorageImageSelectorModal
                isOpen={libraryTarget !== null}
                accept="document"
                onClose={() => setLibraryTarget(null)}
                onSelect={(url) => {
                    if (libraryTarget) update(libraryTarget, { url, type: 'brochure', typeTouched: true, notes: [] });
                }}
            />
        </Card>
    );
}
