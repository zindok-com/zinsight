import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
    const args = process.argv.slice(2);
    const username = args[0];

    console.log('--------------------------------------------------');
    console.log('🚨 Zinsight Admin 2FA Reset & Settings Cleanup Tool');
    console.log('--------------------------------------------------');

    try {

        // 2. 특정 어드민 계정의 2FA 재설정
        if (username) {
            console.log(`Resetting 2FA for admin user: "${username}"...`);
            const admin = await prisma.admin.findUnique({
                where: { username }
            });

            if (!admin) {
                console.error(`❌ Admin user "${username}" not found.`);
                process.exit(1);
            }

            await prisma.admin.update({
                where: { id: admin.id },
                data: {
                    two_factor_enabled: false,
                    two_factor_secret: null,
                    two_factor_temp: null
                }
            });

            console.log(`✅ 2FA for admin user "${username}" has been successfully reset!`);
        } else {
            console.log('\n💡 Tip: To reset a specific admin\'s 2FA, pass the username:');
            console.log('  npx ts-node scripts/reset-2fa.ts <username>');
        }
    } catch (error) {
        console.error('❌ Error during 2FA reset & cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
