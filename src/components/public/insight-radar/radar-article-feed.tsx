import { ExternalLink, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { RadarArticleItem } from '@/actions/insight-radar-actions';

interface RadarArticleFeedProps {
    articles: RadarArticleItem[];
}

export function RadarArticleFeed({ articles }: RadarArticleFeedProps) {
    if (articles.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                최근 기사가 없습니다.
            </p>
        );
    }

    return (
        <ul className="space-y-3">
            {articles.map((article) => (
                <li
                    key={article.id}
                    id={`article-item-${article.id}`}
                    className="rounded-lg border border-border/50 bg-card p-4 transition-shadow hover:shadow-sm"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">


                            {/* 제목 */}
                            {article.url ? (
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-start gap-1"
                                >
                                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                                        {article.title}
                                    </p>
                                </a>
                            ) : (
                                <p className="line-clamp-2 text-sm font-semibold leading-snug">
                                    {article.title}
                                </p>
                            )}

                            {/* 요약 */}
                            {article.summary && (
                                <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                    {article.summary}
                                </p>
                            )}

                            {/* 키워드 태그 */}
                            {article.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                    {article.keywords.slice(0, 3).map((kw) => (
                                        <span
                                            key={kw.id}
                                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                                        >
                                            #{kw.keyword_text}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* 날짜 & 출처 */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                                {article.pub_date && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(article.pub_date), 'yyyy.MM.dd', {
                                            locale: ko,
                                        })}
                                    </span>
                                )}
                                {article.source && <span>{article.source}</span>}
                            </div>
                        </div>

                        {/* 외부 링크 */}
                        {article.url && (
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 mt-1 rounded-md p-1 text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                                aria-label="원문 보기"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}
