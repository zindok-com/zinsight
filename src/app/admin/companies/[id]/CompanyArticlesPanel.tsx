'use client';

import Link from 'next/link';
import { ExternalLink, Edit3, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// 조직에 연결된 진사이트 매거진 기사 목록 (외부 수집 기사는 저작권 문제로 쓰지 않음)
export function CompanyArticlesPanel({ company }: { company: any }) {
    const posts = company.magazinePosts ?? [];
    return (
        <div className="lg:col-span-5 space-y-6">
            {posts.length > 0 ? (
            <Card className="border-amber-200/80 bg-amber-50/20 dark:bg-amber-950/20">
                <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                            <BookOpen className="h-4 w-4" />
                            진사이트 매거진 기사
                        </CardTitle>
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px]">
                            {posts.length}건
                        </Badge>
                    </div>
                    <CardDescription className="text-xs">
                        매거진 에디터에서 이 조직을 연결한 기사입니다. 발행된 기사가 공개 프로필에 나타납니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-2">
                    {posts.map((mpo: any) => {
                        const post = mpo.magazinePost;
                        const postPublicHref = post.category?.isLocal
                            ? `/magazine/local/${post.region?.slug || 'anyang'}/${post.slug}`
                            : `/magazine/tech-marketing/${post.slug}`;

                        return (
                            <div
                                key={post.id}
                                className="group p-2.5 border border-amber-200/70 dark:border-amber-900/50 rounded-lg bg-card text-xs flex items-start justify-between gap-2"
                            >
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="text-[10px] bg-amber-100/60 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300">
                                            {post.category?.name || '매거진'}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                    <a
                                        href={postPublicHref}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-medium text-slate-900 dark:text-slate-100 hover:text-amber-600 line-clamp-2 leading-snug flex items-center gap-1"
                                    >
                                        {post.title}
                                        <ExternalLink className="h-3 w-3 inline opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </a>
                                </div>

                                <Link href={`/admin/magazine/edit/${post.id}`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[11px] gap-1 text-slate-700 shrink-0"
                                        title="매거진 에디터에서 편집"
                                    >
                                        <Edit3 className="h-3 w-3" />
                                        편집
                                    </Button>
                                </Link>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
            ) : (
                <Card>
                    <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
                        <p>이 조직을 연결한 매거진 기사가 없습니다.</p>
                        <p>매거진 에디터의 &lsquo;조직·슬러그&rsquo; 항목에서 이 조직을 연결하면 여기와 공개 프로필에 나타납니다.</p>
                        <Link href="/admin/magazine/new" className="inline-block font-semibold text-blue-600 hover:underline">새 기사 쓰기</Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
