import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 p-6 overflow-auto">
                {children}
            </main>
        </div>
    );
}
