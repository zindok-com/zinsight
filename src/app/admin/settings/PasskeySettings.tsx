'use client';

import { useCallback, useEffect, useState } from 'react';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { Fingerprint, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface PasskeyRow {
    id: number;
    device_name: string;
    created_at: string;
    last_used_at: string | null;
}

/** 지금 쓰는 기기의 기본 이름 (사용자가 바꿀 수 있음) */
function guessDeviceName(): string {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return '내 iPhone';
    if (/iPad/.test(ua)) return '내 iPad';
    if (/Android/.test(ua)) return '내 Android 폰';
    if (/Macintosh/.test(ua)) return '내 Mac';
    if (/Windows/.test(ua)) return '내 Windows PC';
    return '내 기기';
}

function formatKst(value: string | null): string {
    if (!value) return '사용 기록 없음';
    return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

/** 보안 설정: 지정 기기(패스키) 등록·삭제 */
export function PasskeySettings() {
    const confirm = useConfirm();
    const [rows, setRows] = useState<PasskeyRow[] | null>(null);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [supported, setSupported] = useState(true);
    const [deviceName, setDeviceName] = useState('');
    const [otp, setOtp] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        const res = await fetch('/api/auth/passkey', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
            setRows(data.passkeys);
            setTwoFactorEnabled(Boolean(data.twoFactorEnabled));
        } else {
            setRows([]);
            toast.error(data?.error || '등록된 기기를 불러오지 못했습니다.');
        }
    }, []);

    useEffect(() => {
        setSupported(browserSupportsWebAuthn());
        setDeviceName(guessDeviceName());
        load();
    }, [load]);

    const register = async () => {
        if (twoFactorEnabled && otp.length !== 6) {
            toast.error('OTP 6자리를 입력해 주세요.');
            return;
        }
        setBusy(true);
        try {
            const optRes = await fetch('/api/auth/passkey/register/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: otp }),
            });
            const optData = await optRes.json();
            if (!optRes.ok) throw new Error(optData.error || '등록을 시작하지 못했습니다.');

            let response;
            try {
                response = await startRegistration({ optionsJSON: optData.options });
            } catch (error) {
                // 사용자가 생체인증 창을 닫은 경우 등
                const name = (error as Error)?.name;
                throw new Error(name === 'InvalidStateError' ? '이 기기는 이미 등록되어 있습니다.' : '기기 인증이 취소되었습니다.');
            }

            const verRes = await fetch('/api/auth/passkey/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response, deviceName }),
            });
            const verData = await verRes.json();
            if (!verRes.ok) throw new Error(verData.error || '등록하지 못했습니다.');

            toast.success(`'${verData.passkey.device_name}' 등록 완료. 다음부터 이 기기로 바로 로그인할 수 있습니다.`);
            setOtp('');
            await load();
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const remove = async (row: PasskeyRow) => {
        const ok = await confirm({
            title: '등록 기기 삭제',
            description: `'${row.device_name}'에서 패스키로 로그인할 수 없게 됩니다. 기기에 저장된 패스키는 기기 설정에서 따로 지워야 합니다.`,
            confirmText: '삭제',
            variant: 'destructive',
        });
        if (!ok) return;
        const res = await fetch(`/api/auth/passkey?id=${row.id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => null);
        if (res.ok) toast.success('삭제했습니다.');
        else toast.error(data?.error || '삭제하지 못했습니다.');
        await load();
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                        <Fingerprint className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">지정 기기 로그인 (패스키)</CardTitle>
                        <CardDescription>
                            등록한 휴대폰·PC에서는 Face ID·지문·기기 잠금으로 바로 로그인합니다. 비밀번호와 OTP 입력이 필요 없습니다.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* 등록 기기 목록 */}
                {rows === null ? (
                    <p className="text-sm text-slate-500">불러오는 중...</p>
                ) : rows.length === 0 ? (
                    <p className="text-sm text-slate-500">등록된 기기가 없습니다.</p>
                ) : (
                    <ul className="divide-y rounded-lg border">
                        {rows.map((row) => (
                            <li key={row.id} className="flex items-center gap-3 px-3 py-2.5">
                                <Smartphone className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-800">{row.device_name}</p>
                                    <p className="text-xs text-slate-500">
                                        등록 {formatKst(row.created_at)} · 최근 {formatKst(row.last_used_at)}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 shrink-0 text-slate-500 hover:text-rose-600"
                                    onClick={() => remove(row)}
                                    aria-label={`${row.device_name} 삭제`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}

                {/* 이 기기 등록 */}
                {supported ? (
                    <div className="space-y-3 rounded-lg bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-700">지금 쓰는 이 기기 등록</p>
                        <div className="space-y-1">
                            <label htmlFor="passkey-device-name" className="text-xs font-semibold text-slate-600">기기 이름</label>
                            <Input id="passkey-device-name" value={deviceName} maxLength={100} onChange={(e) => setDeviceName(e.target.value)} className="text-base" disabled={busy} />
                        </div>
                        {twoFactorEnabled && (
                            <div className="space-y-1">
                                <label htmlFor="passkey-otp" className="text-xs font-semibold text-slate-600">본인 확인 OTP</label>
                                <Input
                                    id="passkey-otp"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    placeholder="6자리 숫자"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="max-w-[160px] text-base font-bold tracking-widest"
                                    disabled={busy}
                                />
                            </div>
                        )}
                        <Button type="button" onClick={register} disabled={busy} className="h-11 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 font-semibold">
                            {busy ? '기기 인증 중...' : '이 기기 등록하기'}
                        </Button>
                        <p className="text-xs text-slate-500">기기를 잃어버리면 다른 기기에서 로그인해 위 목록에서 삭제하세요.</p>
                    </div>
                ) : (
                    <p className="text-sm text-amber-700">이 브라우저는 패스키를 지원하지 않습니다.</p>
                )}
            </CardContent>
        </Card>
    );
}
