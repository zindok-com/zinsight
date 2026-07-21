'use server';

import { prisma } from '@/lib/db';

export async function getDashboardAnalytics(periodDays: number = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - periodDays + 1);

    // 1. DAU 추이
    const visitorLogs = await prisma.visitorLog.groupBy({
        by: ['date'],
        where: {
            date: {
                gte: startDate,
                lte: today
            }
        },
        _count: {
            visitorId: true
        }
    });

    const dauData = visitorLogs.map(log => ({
        date: log.date.toISOString().split('T')[0],
        dau: log._count.visitorId
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 2. 일별 노출수 및 조회수 추이
    const postAnalytics = await prisma.postDailyAnalytics.groupBy({
        by: ['date'],
        where: {
            date: {
                gte: startDate,
                lte: today
            }
        },
        _sum: {
            impressions: true,
            rawViews: true,
            uniqueViews: true
        }
    });

    const performanceData = postAnalytics.map(log => ({
        date: log.date.toISOString().split('T')[0],
        impressions: log._sum.impressions || 0,
        views: log._sum.rawViews || 0,
        uniqueViews: log._sum.uniqueViews || 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 3. 누적 합계 (Top level metrics)
    const totalDau = visitorLogs.reduce((sum, log) => sum + log._count.visitorId, 0);
    const totalImpressions = performanceData.reduce((sum, log) => sum + log.impressions, 0);
    const totalViews = performanceData.reduce((sum, log) => sum + log.views, 0);
    
    // CTR 계산 (조회수 / 노출수 * 100)
    const avgCtr = totalImpressions > 0 ? ((totalViews / totalImpressions) * 100).toFixed(2) : 0;

    return {
        dauData,
        performanceData,
        summary: {
            totalDau,
            totalImpressions,
            totalViews,
            avgCtr: Number(avgCtr)
        }
    };
}

export async function getPostsWithAnalytics() {
    const posts = await prisma.magazinePost.findMany({
        where: {
            deletedAt: null
        },
        include: {
            author: true,
            category: true,
            analytics: {
                select: {
                    impressions: true,
                    rawViews: true,
                    uniqueViews: true,
                }
            },
            industries: {
                include: { industry: true }
            },
            region: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return posts.map(post => {
        const totalImpressions = post.analytics.reduce((sum, a) => sum + a.impressions, 0);
        const totalRawViews = post.analytics.reduce((sum, a) => sum + a.rawViews, 0);
        const totalUniqueViews = post.analytics.reduce((sum, a) => sum + a.uniqueViews, 0);
        
        const views = Math.max(post.viewCount, totalRawViews);
        const ctr = totalImpressions > 0 ? ((views / totalImpressions) * 100).toFixed(2) : '0.00';

        return {
            ...post,
            authorName: post.author?.name || post.authorName,
            views,
            uniqueViews: totalUniqueViews,
            impressions: totalImpressions,
            ctr: Number(ctr)
        };
    });
}
