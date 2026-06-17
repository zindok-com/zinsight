'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ShieldCheck, ShieldAlert, Key, Copy, Check, RefreshCw } from 'lucide-react';

export function SecuritySettings() {
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // 2FA 설정 세션 상태
    const [showSetup, setShowSetup] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [otpCode, setOtpCode] = useState('');

    // 2FA 해제 세션 상태
    const [showDisable, setShowDisable] = useState(false);
    const [disableOtpCode, setDisableOtpCode] = useState('');

    // 신규 관리자 추가 상태
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newAdminOtpCode, setNewAdminOtpCode] = useState('');

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/status-2fa');
            const data = await res.json();
            if (res.ok) {
                setEnabled(data.enabled);
            } else {
                toast.error("2FA 상태를 가져오는데 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
            toast.error("통신 에러가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleStartSetup = async () => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/auth/setup-2fa', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setQrCodeUrl(data.qrCodeUrl);
                setSecret(data.secret);
                setShowSetup(true);
                setShowDisable(false);
                setOtpCode('');
                toast.success("2FA 발급 성공. 비밀키와 QR 코드를 스캔하세요.");
            } else {
                toast.error(data.error || "2FA 설정 초기화에 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
            toast.error("통신 에러가 발생했습니다.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode || otpCode.length !== 6) {
            toast.error("6자리 인증 코드를 입력하세요.");
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch('/api/auth/confirm-setup-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: otpCode }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("2차 인증(2FA)이 성공적으로 활성화되었습니다.");
                setShowSetup(false);
                setEnabled(true);
                setSecret('');
                setQrCodeUrl('');
                setOtpCode('');
                fetchStatus();
            } else {
                toast.error(data.error || "인증 코드가 올바르지 않습니다.");
            }
        } catch (error) {
            console.error(error);
            toast.error("통신 에러가 발생했습니다.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisable2fa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!disableOtpCode || disableOtpCode.length !== 6) {
            toast.error("본인 확인을 위해 6자리 OTP 코드를 입력하세요.");
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch('/api/auth/disable-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: disableOtpCode }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("2차 인증(2FA)이 정상적으로 해제되었습니다.");
                setShowDisable(false);
                setEnabled(false);
                setDisableOtpCode('');
                fetchStatus();
            } else {
                toast.error(data.error || "OTP 코드가 올바르지 않습니다.");
            }
        } catch (error) {
            console.error(error);
            toast.error("통신 에러가 발생했습니다.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !newPassword) {
            toast.error("ID와 비밀번호를 모두 입력해주세요.");
            return;
        }
        if (!newAdminOtpCode || newAdminOtpCode.length !== 6) {
            toast.error("본인의 6자리 2FA 인증 코드를 입력해주세요.");
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch('/api/auth/create-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newUsername,
                    newPassword,
                    otpCode: newAdminOtpCode
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`관리자 계정 "${newUsername}"이(가) 정상적으로 추가되었습니다.`);
                setNewUsername('');
                setNewPassword('');
                setNewAdminOtpCode('');
            } else {
                toast.error(data.error || "관리자 계정 추가에 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
            toast.error("통신 에러가 발생했습니다.");
        } finally {
            setActionLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        toast.success("텍스트 비밀키가 클립보드에 복사되었습니다.");
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex h-[300px] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">보안 설정</h1>
                    <p className="text-sm text-slate-500 mt-1">관리자 대시보드의 인증 및 보안 설정을 관리합니다.</p>
                </div>
            </div>

            {/* 1. 2FA 상태 정보 카드 */}
            <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        {enabled ? (
                            <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                        ) : (
                            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                        )}
                        <div>
                            <CardTitle className="text-xl font-bold">2차 인증 (Google OTP / TOTP)</CardTitle>
                            <CardDescription>로그인 시 OTP 생성기의 추가 인증 과정을 통해 계정을 더욱 안전하게 보호합니다.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-700">현재 상태:</span>
                        {enabled ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                활성화됨
                            </span>
                        ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                비활성화됨
                            </span>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50 px-6 py-4 flex gap-3 rounded-b-lg">
                    {!enabled ? (
                        <Button 
                            onClick={handleStartSetup} 
                            disabled={actionLoading}
                            className="bg-blue-600 hover:bg-blue-700 font-semibold"
                        >
                            2차 인증 설정하기
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => {
                                setShowDisable(!showDisable);
                                setShowSetup(false);
                                setDisableOtpCode('');
                            }}
                            variant="destructive"
                            disabled={actionLoading}
                            className="font-semibold"
                        >
                            {showDisable ? '취소' : '2차 인증 해제하기'}
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* 2. 2FA 비활성화 폼 */}
            {showDisable && (
                <Card className="border-red-200 shadow-md">
                    <CardHeader className="bg-red-50/50">
                        <CardTitle className="text-red-800 text-lg">2차 인증 해제</CardTitle>
                        <CardDescription>안전을 위해 현재 Google Authenticator 앱에 표시된 6자리 번호를 입력해야 해제할 수 있습니다.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleDisable2fa}>
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-3 max-w-sm">
                                <label className="text-sm font-semibold text-slate-700">OTP 인증 코드</label>
                                <Input
                                    type="text"
                                    maxLength={6}
                                    placeholder="6자리 숫자"
                                    value={disableOtpCode}
                                    onChange={(e) => setDisableOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="text-lg font-bold tracking-widest text-center max-w-[200px]"
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 py-3">
                            <Button type="submit" variant="destructive" disabled={actionLoading}>
                                {actionLoading ? '처리 중...' : '확인 및 해제'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {/* 3. 2FA 신규 설정 폼 (QR 및 텍스트 비밀키 노출) */}
            {showSetup && (
                <Card className="border-blue-200 shadow-lg animate-in fade-in duration-300">
                    <CardHeader className="bg-blue-50/30">
                        <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
                            <Key className="h-5 w-5 text-blue-600" />
                            Google Authenticator 등록 설정
                        </CardTitle>
                        <CardDescription>Google Authenticator 또는 호환 OTP 앱에 아래 정보를 추가해 주세요.</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6 pt-6">
                        {/* ⚠️ 개별 어드민 계정 보안 주의사항 명시 */}
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-2.5">
                            <h4 className="text-sm font-bold flex items-center gap-1.5 text-amber-800">
                                ⚠️ 2차 인증(2FA) 등록 안내
                            </h4>
                            <p className="text-xs leading-relaxed font-medium">
                                Zinsight 관리자 기능은 개별 ID/PW를 사용하는 독립적인 관리자 계정 체계로 운영됩니다. 본인의 보안을 강화하고 다른 관리자를 추가하기 위해 2차 인증을 필수로 설정하는 것을 권장합니다.
                            </p>
                            <p className="text-xs leading-relaxed text-slate-500 italic">
                                * 비밀키는 한 번만 조회되므로, OTP 앱(Google Authenticator 등)에 등록을 완료한 후 아래 코드를 넣어 검증해주세요.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                            {/* QR Code */}
                            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white border rounded-lg shadow-sm">
                                {qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-[180px] h-[180px]" />
                                ) : (
                                    <div className="w-[180px] h-[180px] bg-slate-100 flex items-center justify-center text-xs text-slate-400">QR Generating...</div>
                                )}
                                <span className="text-[11px] font-bold text-slate-400 mt-2">QR 코드 스캔</span>
                            </div>

                            {/* Text Secret Key & OTP Validation */}
                            <div className="md:col-span-8 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">텍스트 비밀키 (Secret Key)</label>
                                    <div className="flex gap-2 max-w-md">
                                        <code className="flex-1 block p-3 bg-slate-100 border rounded font-mono text-sm font-bold tracking-wider select-all break-all leading-tight">
                                            {secret}
                                        </code>
                                        <Button 
                                            onClick={copyToClipboard}
                                            variant="outline"
                                            size="icon"
                                            className="h-11 w-11 shrink-0"
                                            type="button"
                                        >
                                            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        모바일 기기에서 QR 스캔이 어렵거나 공동 관리자가 등록 시 위 비밀키를 직접 추가 등록하시면 됩니다.
                                    </p>
                                </div>

                                <form onSubmit={handleConfirmSetup} className="space-y-3 pt-3 border-t border-dashed">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700">인증 코드 입력</label>
                                        <p className="text-xs text-slate-500">Google Authenticator에 표시되는 6자리 숫자를 입력하여 연동을 확인합니다.</p>
                                        <div className="flex gap-3 max-w-sm mt-1">
                                            <Input
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="text-lg font-bold tracking-widest text-center max-w-[150px] h-11"
                                                required
                                            />
                                            <Button 
                                                type="submit" 
                                                disabled={actionLoading}
                                                className="h-11 bg-blue-600 hover:bg-blue-700 font-semibold"
                                            >
                                                {actionLoading ? '확인 중...' : '등록 완료 및 활성화'}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 4. 관리자 계정 추가 카드 */}
            <Card className="shadow-md border-slate-200">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-full text-slate-600">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">신규 관리자 계정 추가</CardTitle>
                            <CardDescription>새로운 관리자 계정을 추가합니다. 본인 확인을 위해 2차 인증(2FA) 코드가 필요합니다.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!enabled ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                            ⚠️ <strong>알림:</strong> 신규 관리자 계정을 추가하려면 먼저 본인 계정의 <strong>2차 인증(2FA)을 활성화</strong>해야 합니다.
                        </div>
                    ) : (
                        <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-md">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">새 관리자 ID (Username)</label>
                                <Input
                                    type="text"
                                    placeholder="Username"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    required
                                    disabled={actionLoading}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">새 비밀번호 (Password)</label>
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={actionLoading}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">본인 OTP 인증 코드</label>
                                <Input
                                    type="text"
                                    maxLength={6}
                                    placeholder="6자리 숫자"
                                    value={newAdminOtpCode}
                                    onChange={(e) => setNewAdminOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="font-bold tracking-widest max-w-[150px]"
                                    required
                                    disabled={actionLoading}
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={actionLoading}
                                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold mt-2"
                            >
                                {actionLoading ? '추가 중...' : '관리자 추가'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
