'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Building2, Mail, Briefcase, Calendar } from 'lucide-react';

export function RequestListTable({ requests }: { requests: any[] }) {
    if (requests.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground border rounded-lg bg-slate-50/50">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>아직 신청된 리포트가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="border rounded-md bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">신청 일시</TableHead>
                        <TableHead>이메일</TableHead>
                        <TableHead>기업명</TableHead>
                        <TableHead>산업군</TableHead>
                        <TableHead>상태</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((request) => (
                        <TableRow key={request.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {format(new Date(request.created_at), 'yyyy-MM-dd HH:mm')}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    {request.email}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    <span className="font-semibold">{request.company_name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {request.industry || '-'}
                            </TableCell>
                            <TableCell>
                                <Badge 
                                    variant={request.status === 'COMPLETED' ? 'default' : 'secondary'}
                                    className={request.status === 'PENDING' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}
                                >
                                    {request.status === 'PENDING' ? '대기 중' : '완료'}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
