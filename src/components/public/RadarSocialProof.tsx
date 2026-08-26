import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { prisma } from "@/lib/db";

interface RecentOrg {
    id: number;
    company_name: string;
    slug: string | null;
    entity_type: string | null;
    region: { name: string } | null;
}

async function getRecentOrgs(limit: number): Promise<RecentOrg[]> {
    return prisma.organization.findMany({
        select: {
            id: true,
            company_name: true,
            slug: true,
            entity_type: true,
            region: { select: { name: true } },
        },
        orderBy: { created_at: "desc" },
        take: limit,
    });
}

function EntityBadge({ entityType }: { entityType: string | null }) {
    if (entityType !== "대학/교육기관") return null;
    return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-300 bg-indigo-900/50 border border-indigo-500/30 rounded-full px-1.5 py-0.5 ml-0.5 flex-shrink-0">
            <GraduationCap className="w-2.5 h-2.5" />
            학교
        </span>
    );
}

export default async function RadarSocialProof({ limit = 8 }: { limit?: number }) {
    const orgs = await getRecentOrgs(limit);

    if (orgs.length < 3) return null;

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-zi-primary to-[#002a5a] p-6 sm:p-8 rounded-zi-card border border-white/10 shadow-2xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-zi-secondary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-zi-secondary animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                        Insight Radar
                    </span>
                </div>
                <h3 className="font-h2 text-[20px] sm:text-[22px] text-white mb-1 leading-tight tracking-tight">
                    최근 인사이트 레이더에 등록된 기업
                </h3>
                <p className="text-[13px] text-white/50 mb-6">
                    총 {orgs.length}개 · 최신 등록순
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                    {orgs.map((org) => {
                        const href = org.slug
                            ? `/insight-radar/${org.slug}`
                            : `/insight-radar/${org.id}`;
                        return (
                            <Link
                                key={org.id}
                                href={href}
                                className="group inline-flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] hover:border-white/30 rounded-full px-3.5 py-2 transition-all duration-200 text-white/90 hover:text-white"
                            >
                                <span className="text-[14px] font-medium leading-none">
                                    {org.company_name}
                                </span>
                                {org.region && (
                                    <span className="text-[11px] text-white/45 leading-none">
                                        {org.region.name}
                                    </span>
                                )}
                                <EntityBadge entityType={org.entity_type} />
                            </Link>
                        );
                    })}
                </div>

                <Link
                    href="/insight-radar"
                    className="inline-flex items-center gap-2 text-[14px] font-semibold text-white/70 hover:text-white transition-colors group"
                >
                    인사이트 레이더 전체 보기
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
