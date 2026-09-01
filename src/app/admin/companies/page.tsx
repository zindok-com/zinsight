import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportButton } from './import-button';
import { CompanyListTable } from './company-list-table';
import { CreateOrganizationButton } from './create-organization-button';
import { InviteLinkPanel } from './InviteLinkPanel';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const [companies, regions, invites] = await Promise.all([
    prisma.organization.findMany({
      include: {
        region: true,
        company_articles: { include: { article: true } },
        magazinePosts: {
          where: { magazinePost: { deletedAt: null } },
          include: { magazinePost: true },
        },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.region.findMany({ orderBy: { name: 'asc' }, where: { isActive: true } }),
    prisma.organizationInvite.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        region: { select: { id: true, name: true } },
        submissions: { select: { id: true, status: true } },
      },
    }),
  ]);

  const pendingCount = await prisma.organizationSubmission.count({ where: { status: 'PENDING' } });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">조직 관리</h1>
          <p className="text-muted-foreground">기업, 기관, 센터 정보를 관리하고, 레이더 리포트를 등록합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/companies/submissions" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              신청 목록
              {pendingCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {pendingCount}
                </span>
              )}
            </Link>
          </Button>
          <CreateOrganizationButton regions={regions} />
          <ImportButton />
        </div>
      </div>

      {/* 초대 링크 관리 패널 */}
      <InviteLinkPanel regions={regions} invites={invites} />

      <Card>
        <CardHeader>
          <CardTitle>등록된 조직 목록</CardTitle>
          <CardDescription>
            데이터베이스에 등록된 총 {companies.length}개의 조직을 보여줍니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              등록된 조직이 없습니다. 새 조직을 등록하거나 JSON 파일을 가져오세요.
            </div>
          ) : (
            <CompanyListTable companies={companies} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
