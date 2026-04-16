import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    console.log("Loading env.. Host:", process.env.DB_HOST);
    
    // Dynamically import db after env is set
    const { prisma } = await import('../src/lib/db');

    console.log("Loading data...");
    const rawIndustry = fs.readFileSync(path.join(__dirname, '../industry_data.json'), 'utf-8');
    const rawKeyword = fs.readFileSync(path.join(__dirname, '../keyword_data.json'), 'utf-8');

    const industries = JSON.parse(rawIndustry);
    const keywords = JSON.parse(rawKeyword);

    // Filter out industry 1
    const industriesToInsert = industries.filter((ind: any) => ind.id !== 1);
    const keywordsToInsert = keywords.filter((kw: any) => kw.industry_id !== 1);

    console.log(`Inserting ${industriesToInsert.length} industries...`);
    
    for (const ind of industriesToInsert) {
        await prisma.industry.upsert({
            where: { slug: ind.slug },
            update: {
                name: ind.name,
                description: ind.description,
            },
            create: {
                id: ind.id,
                name: ind.name,
                slug: ind.slug,
                description: ind.description,
                is_active: ind.is_active
            }
        });
    }

    console.log(`Inserting ${keywordsToInsert.length} keywords...`);
    let kwCount = 0;
    for (const kw of keywordsToInsert) {
        const existing = await prisma.searchKeyword.findFirst({
            where: { industry_id: kw.industry_id, keyword_text: kw.keyword_text }
        });
        if (!existing) {
            await prisma.searchKeyword.create({
                data: {
                    id: kw.id,
                    industry_id: kw.industry_id,
                    keyword_text: kw.keyword_text,
                    keyword_type: kw.keyword_type,
                    is_active: kw.is_active
                }
            });
            kwCount++;
        }
    }
    console.log(`Inserted ${kwCount} new keywords. Seed complete.`);
    await prisma.$disconnect();
}

main().catch(console.error);
