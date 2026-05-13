import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboardStats } from "@/actions/dashboard-actions";
import { Building2, Tags, Newspaper, CalendarDays, Eye, FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function Home() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">인사이트 레이더 및 매거진 운영 현황</p>
            </div>

            {/* Insight Radar Stats */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                    <Building2 className="h-5 w-5" /> Insight Radar Status
                </h2>
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
            </div>

            {/* Magazine Stats */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                    <FileText className="h-5 w-5" /> Magazine Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">매거진 포스트</CardTitle>
                            <FileText className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.magazinePostCount}</div>
                            <p className="text-xs text-muted-foreground">등록된 총 포스트 수</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
                            <Eye className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalViewCount.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">전체 포스트 누적 조회수</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Insight Radar 가이드</CardTitle>
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
                            <span><strong>Articles</strong>에서 기사를 수집하세요.</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Magazine 가이드</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <span className="bg-indigo-100 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                            <span><strong>Magazine Posts</strong> 메뉴로 이동하세요.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="bg-indigo-100 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                            <span>우측 상단의 <strong>New Post</strong> 버튼을 클릭하세요.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="bg-indigo-100 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                            <span>제목, 본문, 썸네일을 입력하고 관련 산업을 선택하여 등록하세요.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
