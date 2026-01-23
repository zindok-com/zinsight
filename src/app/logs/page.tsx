import { listDataFiles, FileSystemItem } from '@/actions/explorer-actions';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
    let logs: FileSystemItem[] = [];
    try {
        logs = await listDataFiles('logs');
    } catch (e) {
        console.error("Failed to fetch logs", e);
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
            <div className="grid gap-4">
                {logs.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground bg-slate-50 rounded border">
                        No logs found in /data/logs
                    </div>
                ) : (
                    logs.map((log) => (
                        <Card key={log.path}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-slate-500" />
                                        {log.name}
                                    </div>
                                </CardTitle>
                                <div className="text-xs text-muted-foreground">{new Date(log.modifiedAt).toLocaleString()}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground mb-2">Size: {(log.size / 1024).toFixed(2)} KB</div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/api/download?path=${encodeURIComponent(log.path)}`}>
                                            <Download className="mr-2 h-4 w-4" /> Download
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
