import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { hashPassword } from '../src/lib/password';

async function main() {
    const args = process.argv.slice(2);
    const username = args[0];
    const password = args[1];

    if (!username || !password) {
        console.error('❌ Usage: npx ts-node scripts/create-admin.ts <username> <password>');
        process.exit(1);
    }

    console.log('--------------------------------------------------');
    console.log('🚨 Zinsight Create Admin Account Tool');
    console.log('--------------------------------------------------');
    console.log(`Creating/updating admin user: "${username}"...`);

    try {
        const passwordHash = hashPassword(password);

        const admin = await prisma.admin.upsert({
            where: { username },
            update: {
                password_hash: passwordHash,
            },
            create: {
                username,
                password_hash: passwordHash,
            },
        });

        console.log(`\n✅ Admin account successfully saved!`);
        console.log(`ID: ${admin.id}`);
        console.log(`Username: ${admin.username}`);
    } catch (error) {
        console.error('❌ Failed to create/update admin account:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
