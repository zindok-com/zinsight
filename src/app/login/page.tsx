'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
    const [passcode, setPasscode] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Server Action would be better, but for now simple cookie set via API Route or Action
        // Let's use a server action to set the cookie
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode }),
        });

        if (res.ok) {
            toast.success("Login successful");
            router.push('/');
            router.refresh();
        } else {
            toast.error("Invalid passcode");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>zinsight Admin</CardTitle>
                    <CardDescription>Enter passcode to access.</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent>
                        <Input
                            type="password"
                            placeholder="Passcode"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Enter</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
