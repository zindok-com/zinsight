import { getOrganizationSubmissions } from '@/actions/company-actions';
import { SubmissionsClient } from './SubmissionsClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
    const submissions = await getOrganizationSubmissions();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/companies" className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        조직 관리
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">조직 등록 신청 목록</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        고객이 제출한 조직 정보를 검토하고 승인 또는 반려합니다.
                    </p>
                </div>
            </div>
            <SubmissionsClient submissions={submissions} />
        </div>
    );
}
