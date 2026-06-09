import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-100">
                <p className="text-slate-500">Loading...</p>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
