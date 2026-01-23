'use client';

import { useState, useEffect } from 'react';
import { listDataFiles, FileSystemItem } from '@/actions/explorer-actions';
import { Folder, File, Download, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function DataExplorerPage() {
    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState<FileSystemItem[]>([]);

    useEffect(() => {
        loadPath(currentPath);
    }, [currentPath]);

    const loadPath = async (pathStr: string) => {
        const data = await listDataFiles(pathStr);
        setItems(data);
    };

    const handleNavigate = (item: FileSystemItem) => {
        if (item.type === 'DIRECTORY') {
            setCurrentPath(item.path);
        } else {
            // Handle file view/download
            // For now just alert
            alert(`Selected file: ${item.name}`);
        }
    };

    const handleUp = () => {
        if (!currentPath) return;
        const parts = currentPath.split('/');
        parts.pop();
        setCurrentPath(parts.join('/'));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Data Explorer</h1>

            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded">
                <Button variant="ghost" size="sm" onClick={handleUp} disabled={!currentPath}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-mono text-sm">/data/{currentPath}</span>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Modified</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Empty directory or access denied.
                                </TableCell>
                            </TableRow>
                        )}
                        {items.map((item) => (
                            <TableRow key={item.path} className="cursor-pointer hover:bg-slate-50" onClick={() => handleNavigate(item)}>
                                <TableCell>
                                    {item.type === 'DIRECTORY' ? (
                                        <Folder className="h-4 w-4 text-blue-500" />
                                    ) : (
                                        <File className="h-4 w-4 text-slate-500" />
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.type === 'FILE' ? (item.size / 1024).toFixed(1) + ' KB' : '-'}</TableCell>
                                <TableCell>{new Date(item.modifiedAt).toLocaleString()}</TableCell>
                                <TableCell>
                                    {item.type === 'FILE' && (
                                        <Button variant="ghost" size="sm" onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `/api/download?path=${encodeURIComponent(item.path)}`;
                                        }}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
