import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/actions/dashboard-actions";
import { Building2, Tags, Newspaper, CalendarDays } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function Home() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">기사 수집 현황 개요</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">산업</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.industryCount}</div>
                        <p className="text-xs text-muted-foreground">활성 산업 수</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">검색 키워드</CardTitle>
                        <Tags className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.keywordCount}</div>
                        <p className="text-xs text-muted-foreground">활성 키워드 수</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 수집 기사</CardTitle>
                        <Newspaper className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.articleCount}</div>
                        <p className="text-xs text-muted-foreground">전체 기간 누적</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">이번 달 수집</CardTitle>
                        <CalendarDays className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.thisMonthCount}</div>
                        <p className="text-xs text-muted-foreground">이번 달 신규 기사</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>시작하기</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <span className="bg-slate-200 text-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                            <span><strong>Industries</strong>에서 산업를 등록하세요.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="bg-slate-200 text-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                            <span><strong>Keywords</strong>에서 산업별 검색 키워드를 추가하세요.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="bg-slate-200 text-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                            <span><strong>Articles</strong>에서 산업를 선택하고 기사를 수집하세요.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="bg-slate-200 text-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                            <span><strong>Export</strong>에서 월간 Snapshot을 생성하고 다운로드하세요.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
