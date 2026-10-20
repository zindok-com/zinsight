import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from 'sonner';

export const metadata = {
    // 루트 template('%s | 진사이트')이 겹치지 않도록 absolute로 고정하고 하위 페이지용 template을 별도 지정
    title: {
        absolute: '진사이트 관리자',
        template: '%s | 진사이트 관리자',
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 p-6 min-w-0">
                {children}
            </main>
        </div>
    );
}
