import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportButton } from './import-button';
import { CompanyListTable } from './company-list-table';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const companies = await prisma.organization.findMany({
    include: {
      industries: {
        include: {
          industry: true,
        },
      },
      company_articles: {
        include: {
          article: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage companies, institutions, and centers, and import radar reports.</p>
        </div>
        <ImportButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization List</CardTitle>
          <CardDescription>
            Showing {companies.length} organizations from the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No organizations found. Import a JSON file to get started.
            </div>
          ) : (
            <CompanyListTable companies={companies} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
