import { prisma } from '../lib/db';

const categoriesToSeed = [
    { name: '뉴스레터', slug: 'newsletter', isLocal: false, description: '비즈니스 테크 & 디지털 마케팅 뉴스레터 피드' },
    { name: '디지털 마케팅', slug: 'tech-marketing', isLocal: false, description: 'AEO/GEO 최적화 디지털 마케팅 리포트 및 지면' },
    { name: '기업 스포트라이트', slug: 'spotlight', isLocal: true, description: '관내 스타트업, 소상공인, 전통기업 심층 인터뷰 및 성장 성공사례' },
    { name: '지원사업 · 정책 브리핑', slug: 'briefing', isLocal: true, description: '관내 및 경기도 산하 진흥원의 지원사업, 정책자금 공고 요약 브리핑' }
];

async function main() {
    console.log('Starting category migration...');

    // 1. Seed categories
    const seededCategories: Record<string, number> = {};
    for (const cat of categoriesToSeed) {
        const record = await prisma.magazineCategory.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                isLocal: cat.isLocal,
                description: cat.description
            },
            create: cat
        });
        console.log(`Seeded category: ${record.name} (ID: ${record.id}, Slug: ${record.slug})`);
        seededCategories[cat.slug] = record.id;
    }

    // 2. Fetch all posts
    const posts = await (prisma.magazinePost.findMany as any)({
        select: {
            id: true,
            title: true,
            categoryOld: true,
            categoryId: true
        }
    });

    console.log(`Found ${posts.length} posts to process.`);

    let updatedCount = 0;
    for (const post of posts) {
        // Map old category to new slug
        let targetSlug = 'newsletter'; // Default fallback
        const oldCat = (post as any).categoryOld;

        if (oldCat === 'NEWSLETTER') {
            targetSlug = 'newsletter';
        } else if (oldCat === 'INTELLIGENCE_REPORT') {
            targetSlug = 'tech-marketing';
        } else if (oldCat === 'VALLEY_NOW') {
            targetSlug = 'spotlight';
        } else if (oldCat === 'LOCAL_SME') {
            targetSlug = 'briefing';
        } else if (oldCat === 'MARKET_FLASH') {
            targetSlug = 'spotlight';
        }

        const targetCategoryId = seededCategories[targetSlug];
        if (targetCategoryId) {
            await prisma.magazinePost.update({
                where: { id: post.id },
                data: {
                    categoryId: targetCategoryId
                }
            });
            console.log(`Updated post "${post.title}" (ID: ${post.id}): ${oldCat} -> category_id: ${targetCategoryId} (${targetSlug})`);
            updatedCount++;
        }
    }

    console.log(`Migration finished. Successfully updated ${updatedCount} posts.`);
}

main()
    .catch((e) => {
        console.error('Error during migration:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
