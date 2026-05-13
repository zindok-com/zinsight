import { prisma } from './src/lib/db';

async function migrate() {
    console.log('Starting migration...');
    const posts = await prisma.magazinePost.findMany();
    
    for (const post of posts) {
        // Only migrate if it doesn't look like JSON already
        if (!post.content.trim().startsWith('{')) {
            console.log(`Migrating post: ${post.title}`);
            const { summary, cleanedContent } = processMagazineContent(post.content, post.summary || undefined);
            
            await prisma.magazinePost.update({
                where: { id: post.id },
                data: {
                    content: cleanedContent,
                    summary: summary
                }
            });
        }
    }
    console.log('Migration finished!');
}

function processMagazineContent(content: string, providedSummary?: string) {
    const sections: any = {
        lead: '',
        bodies: [],
        closing: ''
    };

    const leadMatch = content.match(/\*\*\(리드\)\*\*\s*([\s\S]*?)(?=\*\*\(|$)/);
    if (leadMatch) sections.lead = leadMatch[1].trim();

    const bodyMatches = content.matchAll(/\*\*\(본문\s*\d+\s*[—|-]\s*(.*?)\)\*\*\s*([\s\S]*?)(?=\*\*\(|$)/g);
    for (const match of bodyMatches) {
        sections.bodies.push({
            title: match[1].trim(),
            content: match[2].trim()
        });
    }

    const closingMatch = content.match(/\*\*\(클로징\)\*\*\s*([\s\S]*?)(?=\*\*\(|$)/);
    if (closingMatch) sections.closing = closingMatch[1].trim();

    // Fallback if no markers found (just treat whole content as lead)
    if (!sections.lead && !sections.bodies.length && !sections.closing) {
        sections.lead = content.trim();
    }

    const summary = providedSummary || sections.lead;
    const structuredContent = JSON.stringify(sections);

    return { summary, cleanedContent: structuredContent };
}

migrate()
    .catch(err => console.error(err))
    .finally(() => prisma.$disconnect());
