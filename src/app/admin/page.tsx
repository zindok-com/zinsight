import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/actions/dashboard-actions";
import { getDashboardAnalytics } from "@/actions/admin/analytics-actions";
import {
    Building2,
    Tags,
    Newspaper,
    CalendarDays,
    Eye,
    FileText,
    Users,
    TrendingUp,
    MousePointerClick,
    ArrowRight,
    Globe2,
    SearchCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function Home() {
    const [stats, analytics] = await Promise.all([
        getDashboardStats(),
        getDashboardAnalytics(7),
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
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">진사이트 관리자</h1>
                    <p className="text-indigo-100 max-w-xl text-sm leading-relaxed">
                        환영합니다. 인사이트 레이더 데이터 수집 현황 및 매거진 성과 지표를 한눈에 파악하고
                        비즈니스 인사이트를 도출해 보세요.
                    </p>
                </div>
            </div>

            {/* Magazine Analytics */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
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
                            <CardTitle className="text-sm font-medium">총 세션수</CardTitle>
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-indigo-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalImpressions.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">최근 7일 전체 유입 세션</p>
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
                            <CardTitle className="text-sm font-medium">세션당 페이지뷰율</CardTitle>
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{summary.avgCtr}%</div>
                            <p className="text-xs text-muted-foreground mt-1">세션 대비 열람 비율</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 관제 센터 상세 유입·방문자·색인 바로가기 카드 */}
                <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Globe2 className="w-4 h-4 text-indigo-600" />
                            상세 유입 채널(네이버·구글·AI) 및 실시간·B2B 방문자 분석
                        </div>
                        <p className="text-xs text-slate-600">
                            플랫폼별 세부 유입 비중, GA4 실시간 접속 현황, 기업·공공기관 IP 역추적 로그는 관제 센터에서 통합 제공합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link href="/admin/seo-monitoring?tab=traffic">
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" />
                                유입·실시간 방문자 보기
                            </Button>
                        </Link>
                        <Link href="/admin/seo-monitoring?tab=indexing">
                            <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5">
                                <SearchCheck className="w-3.5 h-3.5" />
                                구글 색인 모니터링
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Insight Radar Stats */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
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
                                <h4 className="font-semibold text-sm text-slate-800">지역(지자체) 및 조직 등록</h4>
                                <p className="text-xs text-muted-foreground mt-1">지역(지자체) 관리 및 조직 관리 메뉴에서 모니터링할 지자체와 기업·기관 프로필을 등록합니다.</p>
                            </div>
                        </div>
                        <div className="flex p-4 rounded-xl border bg-slate-50/50 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">키워드 설정</h4>
                                <p className="text-xs text-muted-foreground mt-1">키워드 관리 메뉴에서 지역별로 핵심 검색 키워드를 추가하세요.</p>
                            </div>
                        </div>
                        <div className="flex p-4 rounded-xl border bg-slate-50/50 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">기사 수집 및 조직 연결</h4>
                                <p className="text-xs text-muted-foreground mt-1">기사 관리에서 수집된 기사를 확인하고 연관 조직과 연결해 인사이트를 확보하세요.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">✍️ Magazine 발행 가이드</h3>
                    <div className="space-y-3">
                        <div className="flex p-4 rounded-xl border bg-indigo-50/30 border-indigo-100 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">아티클 작성 및 로컬 매핑</h4>
                                <p className="text-xs text-muted-foreground mt-1">매거진 에디터에서 기사를 작성하고 연관된 지자체나 지역 기업을 연결하세요.</p>
                            </div>
                        </div>
                        <div className="flex p-4 rounded-xl border bg-indigo-50/30 border-indigo-100 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">헤드라인 배치</h4>
                                <p className="text-xs text-muted-foreground mt-1">발행된 주요 기사를 메인 페이지나 로컬 지면의 헤드라인으로 설정하여 주목도를 높이세요.</p>
                            </div>
                        </div>
                        <div className="flex p-4 rounded-xl border bg-indigo-50/30 border-indigo-100 items-start gap-4 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">실시간 유입 및 리드 확인</h4>
                                <p className="text-xs text-muted-foreground mt-1">관제 센터와 기사별 애널리틱스에서 검색 유입과 전환율을 추적하고 리드 문의를 관리하세요.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
