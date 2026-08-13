import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboardStats } from "@/actions/dashboard-actions";
import { getDashboardAnalytics } from "@/actions/admin/analytics-actions";
import { Building2, Tags, Newspaper, CalendarDays, Eye, FileText, Users, TrendingUp, MousePointerClick, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function Home() {
    const [stats, analytics] = await Promise.all([
        getDashboardStats(),
        getDashboardAnalytics(7)
    ]);

    const { summary } = analytics;

    return (
        <div className="space-y-10 pb-8">
            {/* Header Area */}
            <div className="relative rounded-2xl bg-gradient-to-tr from-indigo-900 via-indigo-800 to-slate-900 p-8 shadow-lg overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Building2 className="w-64 h-64 text-white transform rotate-12 translate-x-16 -translate-y-8" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Zinsight Admin</h1>
                    <p className="text-indigo-100 max-w-xl text-sm leading-relaxed">
                        환영합니다. 인사이트 레이더 데이터 수집 현황 및 매거진 성과 지표를 한눈에 파악하고 
                        비즈니스 인사이트를 도출해 보세요.
                    </p>
                </div>
            </div>

            {/* Magazine Analytics */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 tracking-tight">
                        <FileText className="h-5 w-5 text-indigo-600" /> Magazine Performance
                    </h2>
                    <Link href="/admin/magazine">
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            매거진 관리 이동 <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">최근 7일 방문자 (DAU)</CardTitle>
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <Users className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalDau.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">유니크 활성 유저수</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-l-4 border-l-indigo-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">총 노출수</CardTitle>
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-indigo-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalImpressions.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">리스트 노출 합산</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                                <MousePointerClick className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalViews.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">상세페이지 실제 조회</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">평균 CTR</CardTitle>
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{summary.avgCtr}%</div>
                            <p className="text-xs text-muted-foreground mt-1">조회수 대비 클릭률</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Insight Radar Stats */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 tracking-tight">
                        <Building2 className="h-5 w-5 text-slate-600" /> Insight Radar Status
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">등록 지역</CardTitle>
                            <Building2 className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-800">{stats.regionCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">활성 지역 카테고리 수</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">모니터링 키워드</CardTitle>
                            <Tags className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-800">{stats.keywordCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">활성 검색 키워드 수</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">총 수집 기사</CardTitle>
                            <Newspaper className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-800">{stats.articleCount.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">전체 기간 누적 데이터</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:-translate-y-1 hover:shadow-md transition-all duration-200 border-indigo-100 bg-indigo-50/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-700">이번 달 신규 수집</CardTitle>
                            <CalendarDays className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-indigo-700">{stats.thisMonthCount.toLocaleString()}</div>
                            <p className="text-xs text-indigo-500/80 mt-1">이 달에 새로 수집된 기사</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Guidelines */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">🚀 Insight Radar 가이드</h3>
                    <div className="space-y-3">
                        <div className="flex p-4 rounded-xl border bg-slate-50/50 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">산업 등록</h4>
                                <p className="text-xs text-muted-foreground mt-1">Industries 메뉴에서 모니터링할 산업 카테고리를 생성합니다.</p>
                            </div>
                        </div>
                        <div className="flex p-4 rounded-xl border bg-slate-50/50 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">키워드 설정</h4>
                                <p className="text-xs text-muted-foreground mt-1">Keywords 메뉴에서 산업별로 핵심 검색 키워드를 추가하세요.</p>
                            </div>
                        </div>
                        <div className="flex p-4 rounded-xl border bg-slate-50/50 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">기사 수집 및 분석</h4>
                                <p className="text-xs text-muted-foreground mt-1">Articles에서 수집된 기사를 확인하고 인사이트를 확보하세요.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">📝 Magazine 가이드</h3>
                    <div className="space-y-3">
                        <div className="flex p-4 rounded-xl border bg-indigo-50/50 border-indigo-100 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">새 포스트 작성</h4>
                                <p className="text-xs text-muted-foreground mt-1">Magazine Posts 메뉴 우측 상단의 New Post를 클릭합니다.</p>
                            </div>
                        </div>
                        <div className="flex p-4 rounded-xl border bg-indigo-50/50 border-indigo-100 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">내용 및 산업 매핑</h4>
                                <p className="text-xs text-muted-foreground mt-1">고품질 기사를 작성하고 관련 산업군 태그를 매핑하여 등록하세요.</p>
                            </div>
                        </div>
                        <div className="flex p-4 rounded-xl border bg-indigo-50/50 border-indigo-100 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">성과 측정</h4>
                                <p className="text-xs text-muted-foreground mt-1">포스트 발행 후 노출수, 조회수, CTR을 모니터링하여 독자 반응을 확인하세요.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
