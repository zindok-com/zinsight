'use client';

import { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSize?: number; // bytes
}

export function FileUpload({ onFileSelect, accept, maxSize = 10 * 1024 * 1024 }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            validateAndSelect(files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            validateAndSelect(files[0]);
        }
    };

    const validateAndSelect = (file: File) => {
        if (maxSize && file.size > maxSize) {
            toast.error(`File size exceeds limit (${(maxSize / 1024 / 1024).toFixed(0)}MB)`);
            return;
        }
        // Simple extension check if needed, but 'accept' on input handles most
        setSelectedFile(file);
        onFileSelect(file);
    };

    const clearFile = () => {
        setSelectedFile(null);
    };

    if (selectedFile) {
        return (
            <div className="border rounded-lg p-4 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-200 p-2 rounded">
                        <File className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                        <div className="font-medium text-sm">{selectedFile.name}</div>
                        <div className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFile}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-slate-300 hover:border-slate-400"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
        >
            <input
                id="file-input"
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleFileInput}
            />
            <div className="bg-slate-100 p-3 rounded-full mb-4">
                <Upload className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="font-medium mb-1">Click to upload or drag and drop</h3>
            <p className="text-xs text-muted-foreground">
                Supported formats: CSV, XLSX, JSON (Max 10MB)
            </p>
        </div>
    );
}
