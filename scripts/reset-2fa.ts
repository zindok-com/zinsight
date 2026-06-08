import { prisma } from '../src/lib/db';

async function main() {
    console.log('--------------------------------------------------');
    console.log('🚨 Zinsight Admin 2FA Reset Tool');
    console.log('--------------------------------------------------');
    console.log('Starting 2FA reset process in database...');

    try {
        const result = await prisma.adminSetting.deleteMany({
            where: {
                key: {
                    in: ['2fa_enabled', '2fa_secret', '2fa_temp_secret']
                }
            }
        });

        console.log(`✅ 2FA has been successfully reset!`);
        console.log(`Deleted ${result.count} configurations.`);
        console.log('Now you can log in using only your PASSCODE.');
    } catch (error) {
        console.error('❌ Failed to reset 2FA settings in database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
