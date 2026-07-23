import { prisma } from '@/lib/db';
import { MagazineSubNavbar } from '@/components/public/layout/MagazineSubNavbar';

export default async function MagazineLayout({ children }: { children: React.ReactNode }) {
    let regions: any[] = [];
    
    try {
        regions = await prisma.region.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error('[MagazineLayout] Failed to fetch active regions:', error);
        regions = [];
    }

    return (
        <>
            <MagazineSubNavbar regions={regions} />
            {children}
        </>
    );
}
