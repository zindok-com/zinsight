'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

export function LoginForm() {
    const [step, setStep] = useState<'passcode' | '2fa'>('passcode');
    const [passcode, setPasscode] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/admin';

    const handlePasscodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passcode) {
            toast.error("Passcode is required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.require2fa) {
                    setStep('2fa');
                    toast.info("Google Authenticator OTP 코드를 입력해주세요.");
                } else {
                    toast.success("로그인 성공");
                    router.push(callbackUrl);
                    router.refresh();
                }
            } else {
                toast.error(data.error || "올바르지 않은 패스코드입니다.");
            }
        } catch (error) {
            toast.error("로그인 중 에러가 발생했습니다.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handle2faSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length !== 6) {
            toast.error("6자리 OTP 코드를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("로그인 성공");
                router.push(callbackUrl);
                router.refresh();
            } else {
                toast.error(data.error || "OTP 코드가 유효하지 않습니다.");
            }
        } catch (error) {
            toast.error("인증 중 에러가 발생했습니다.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <Card className="w-[380px] shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center text-slate-800">
                        Zinsight Admin
                    </CardTitle>
                    <CardDescription className="text-center">
                        {step === 'passcode' 
                            ? '관리자 패스코드를 입력하세요.' 
                            : '2차 인증(2FA) 코드를 입력하세요.'
                        }
                    </CardDescription>
                </CardHeader>
                
                {step === 'passcode' ? (
                    <form onSubmit={handlePasscodeSubmit}>
                        <CardContent className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Passcode"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                className="text-center text-lg tracking-widest"
                                disabled={loading}
                                autoFocus
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                                {loading ? 'Checking...' : 'Enter'}
                            </Button>
                        </CardFooter>
                    </form>
                ) : (
                    <form onSubmit={handle2faSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    placeholder="6-digit Code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="text-center text-2xl font-bold tracking-[0.3em] h-12"
                                    disabled={loading}
                                    autoFocus
                                    required
                                />
                                <p className="text-xs text-slate-400 text-center">
                                    Google Authenticator 앱의 번호를 입력해 주세요.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button type="submit" className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </Button>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className="w-full text-slate-500 hover:text-slate-700"
                                onClick={() => {
                                    setStep('passcode');
                                    setCode('');
                                }}
                                disabled={loading}
                            >
                                뒤로 가기
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
