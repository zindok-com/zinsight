'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "@/components/import/file-upload";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { parseAndImportFile } from '@/actions/import-process';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<'UPLOAD' | 'PREVIEW' | 'MAPPING'>('UPLOAD');

    // Placeholder for preview data
    const [previewData, setPreviewData] = useState<any[]>([]);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        toast.success(`File selected: ${selectedFile.name}`);
        // Here we would typically trigger parsing immediately or wait for button
    };

    const handleParse = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const promise = parseAndImportFile(formData).then((res) => {
            if (!res.success) throw new Error(res.error);
            return res;
        });

        toast.promise(promise, {
            loading: 'Processing file...',
            success: (data: any) => `Successfully imported ${data.count} entities!`,
            error: (err) => `Import failed: ${err.message}`
        });

        try {
            await promise;
            // Optionally redirect to entities page
            setStep('PREVIEW'); // Or reset
        } catch (e) {
            // Already handled by toast
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>

            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Upload File</CardTitle>
                        <CardDescription>Upload a CSV, XLSX, or JSON file to import entities or review data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FileUpload
                            onFileSelect={handleFileSelect}
                            accept=".csv, .xlsx, .json"
                        />

                        {file && step === 'UPLOAD' && (
                            <div className="mt-4 flex justify-end">
                                <Button onClick={handleParse}>
                                    Run Import
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {step === 'PREVIEW' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Import Complete</CardTitle>
                            <CardDescription>File processed successfully.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 text-center text-muted-foreground border rounded bg-slate-50">
                                <p>Entities have been added to the database.</p>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => { setStep('UPLOAD'); setFile(null); }}>
                                    Import Another
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
