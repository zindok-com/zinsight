import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MagazineForm } from "@/components/admin/magazine/MagazineForm";

export default async function NewMagazinePage() {
    // Fetch active industries for selection
    const industries = await prisma.industry.findMany({
        where: { deleted_at: null, is_active: true },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
                <p className="text-muted-foreground mt-1">AI-ready marketing content for the Zinsight Magazine.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Article Details</CardTitle>
                    <CardDescription>
                        Fill in the basic information. You can add more details later.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MagazineForm industries={industries} />
                </CardContent>
            </Card>
        </div>
    );
}
