import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRequest } from '@/lib/admin-auth';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    if (!(await isAdminRequest())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { filename } = await params;

    // Security: ensure no path traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    try {
        const dbSnapshot = await prisma.snapshot.findUnique({
            where: { filename }
        });

        if (!dbSnapshot) {
            return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
        }

        const content = JSON.stringify(dbSnapshot.content, null, 2);
        return new NextResponse(content, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Failed to retrieve snapshot:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

