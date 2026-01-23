'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateExport } from '@/actions/export-actions';
import { toast } from 'sonner';

export default function ExportPage() {
    const [loading, setLoading] = useState(false);
    const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
    const [filters, setFilters] = useState({
        confirmed: true,
        needsReview: false,
        rejected: false
    });

    const handleExport = async () => {
        setLoading(true);
        try {
            const statusFilter = [];
            if (filters.confirmed) {
                statusFilter.push('HUMAN_CONFIRMED');
                statusFilter.push('AUTO_CONFIRMED');
            }
            if (filters.needsReview) statusFilter.push('NEEDS_REVIEW');
            if (filters.rejected) statusFilter.push('REJECTED');

            const result = await generateExport({
                format,
                statusFilter
            });

            if (result.success) {
                toast.success(`Export created: ${result.filename}`);
            } else {
                toast.error("Export failed");
            }
        } catch (error) {
            toast.error("Error generating export");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Export</h1>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>Select filters and format to generate a file.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Format</Label>
                        <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                                <SelectItem value="csv">CSV (.csv)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Status Filter</Label>
                        <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="confirmed"
                                    checked={filters.confirmed}
                                    onCheckedChange={(c) => setFilters({ ...filters, confirmed: !!c })}
                                />
                                <label htmlFor="confirmed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Confirmed
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="needs_review"
                                    checked={filters.needsReview}
                                    onCheckedChange={(c) => setFilters({ ...filters, needsReview: !!c })}
                                />
                                <label htmlFor="needs_review" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Needs Review
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button onClick={handleExport} disabled={loading} className="w-full">
                            {loading ? "Generating..." : "Generate File"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
