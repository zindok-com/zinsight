import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { DATA_DIR } from '@/lib/file-system';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const relativePath = searchParams.get('path');

    if (!relativePath) {
        return new NextResponse("Missing path parameter", { status: 400 });
    }

    // Security check
    const fullPath = path.join(DATA_DIR, relativePath);
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(DATA_DIR))) {
        return new NextResponse("Access denied", { status: 403 });
    }

    try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isFile()) {
            return new NextResponse("Not a file", { status: 400 });
        }

        const fileBuffer = await fs.readFile(resolvedPath);

        let contentType = 'application/octet-stream';
        if (resolvedPath.endsWith('.json')) contentType = 'application/json';
        if (resolvedPath.endsWith('.csv')) contentType = 'text/csv';
        if (resolvedPath.endsWith('.xlsx')) contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (resolvedPath.endsWith('.log') || resolvedPath.endsWith('.txt')) contentType = 'text/plain';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${path.basename(resolvedPath)}"`,
                'Content-Length': stats.size.toString(),
            },
        });
    } catch (error) {
        console.error("Download error:", error);
        return new NextResponse("File not found or error reading file", { status: 404 });
    }
}
