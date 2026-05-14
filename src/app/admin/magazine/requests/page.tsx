import { getConsultingRequests } from "@/actions/consulting-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestListTable } from "./request-list-table";
import { FileBarChart } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ReportRequestsPage() {
    const requests = await getConsultingRequests();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">리포트 신청 관리</h1>
                <p className="text-muted-foreground">사용자들이 신청한 AEO 노출 지수 진단 리포트 목록을 확인합니다.</p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <FileBarChart className="w-6 h-6 text-indigo-500" />
                            신청 목록
                        </CardTitle>
                        <CardDescription>
                            현재 총 {requests.length}건의 신청이 접수되었습니다.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <RequestListTable requests={requests} />
                </CardContent>
            </Card>
        </div>
    );
}
