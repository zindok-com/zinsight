import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getLocalPosts } from '@/actions/public/magazine-actions';
import RegionHubClient from './RegionHubClient';
import { Building2 } from 'lucide-react';

export const revalidate = 1800; // 30분마다 ISR 재생성
export const dynamicParams = true;

interface PageProps {
    params: Promise<{ region: string }>;
}

export async function generateStaticParams() {
    try {
        const regions = await prisma.region.findMany({
            where: { isActive: true },
            select: { slug: true }
        });

        return regions.map((reg) => ({
            region: reg.slug,
        }));
    } catch (error) {
        console.error('[generateStaticParams] Failed to load regions:', error);
        return [];
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { region: regionSlug } = await params;
    const domain = process.env.DOMAIN || 'zinsight.co.kr';
    const baseUrl = `https://${domain}`;

    let region = null;
    try {
        region = await prisma.region.findUnique({
            where: { slug: regionSlug }
        });
    } catch (error) {
        console.error('[generateMetadata] Failed to load region:', error);
    }

    if (!region || !region.isActive) {
        return {
            title: 'Region Not Found',
            robots: { index: false, follow: false }
        };
    }

    return {
        title: `${region.name} 비즈니스 허브 | Zinsight Magazine`,
        description: `${region.name} 관내 혁신 스타트업 성공 사례 및 소상공인 그로스 스토리, 진흥원 자금 혜택을 한데 모은 지자체 전용 지면입니다.`,
        alternates: {
            canonical: `${baseUrl}/magazine/local/${regionSlug}`,
        },
    };
}

export default async function LocalRegionPage({ params }: PageProps) {
    const { region: regionSlug } = await params;

    let region = null;
    try {
        region = await prisma.region.findUnique({
            where: { slug: regionSlug }
        });
    } catch (error) {
        console.error('[LocalRegionPage] Failed to load region:', error);
    }

    if (!region || !region.isActive) {
        notFound();
    }

    const posts = await getLocalPosts(regionSlug);
    const localHeadline = posts.find(p => p.isLocalFeatured) || null;
    const regularPosts = localHeadline ? posts.filter(p => p.id !== localHeadline.id) : posts;

    return (
        <div className="min-h-screen bg-zi-surface text-zi-on-surface">
            <main className="mx-auto max-w-zi-container px-4 sm:px-6 py-8 sm:py-12">
                {/* 브레드크럼 */}
                <div className="mb-4 text-xs text-zi-outline font-ui-label flex items-center gap-1.5">
                    <Link href="/magazine" className="hover:text-zi-secondary transition-colors">Magazine</Link>
                    <span>&gt;</span>
                    <Link href="/magazine/local" className="hover:text-zi-secondary transition-colors">Local Hub</Link>
                    <span>&gt;</span>
                    <span className="text-zi-on-surface-variant">{region.name}</span>
                </div>

                <div className="mb-12 flex flex-col md:flex-row items-start sm:items-end justify-between border-b border-zi-divider pb-5 gap-3">
                    <div>
                        <span className="mb-2 block text-ui-label font-ui-label font-semibold text-zi-secondary uppercase tracking-widest flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" /> {region.name} 관내 기업 소식 & 지원 정보
                        </span>
                        <h1 className="font-h1 text-[26px] sm:text-[34px] lg:text-h1 text-zi-primary uppercase tracking-tighter">
                            {region.name} 비즈니스 허브
                        </h1>
                    </div>
                    <div className="max-w-md text-right hidden md:block">
                        <p className="text-xs text-zi-on-surface-variant leading-relaxed break-keep">
                            {region.name} 관내 기업·스타트업 소식과 지자체 지원 정보를 진사이트가 기획·제작하는 파트너 미디어 코너입니다. 수록 기업 정보는 제휴 계약 또는 공개 자료를 기반으로 합니다.
                        </p>
                    </div>
                </div>

                {/* 클라이언트 컴포넌트 호출 */}
                <RegionHubClient 
                    regionName={region.name} 
                    regionSlug={region.slug} 
                    posts={regularPosts} 
                    localHeadline={localHeadline}
                />
            </main>
        </div>
    );
}
