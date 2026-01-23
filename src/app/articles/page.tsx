import { DataService } from '@/services/data-service';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArticleActions } from "@/components/articles/article-actions";

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
    const service = DataService.getInstance();
    const news = await service.getNews();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Articles</h1>

            <div className="grid gap-4">
                {news.map((item, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-medium leading-none">
                                        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                                            {item.title}
                                        </a>
                                    </CardTitle>
                                    <Badge variant="outline">{item.source_type}</Badge>
                                </div>
                                <ArticleActions article={item} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">
                                {item.publication_date} | Query: {item.source_query}
                            </p>
                            <p className="text-sm line-clamp-3">
                                {item.summary}
                            </p>
                        </CardContent>
                    </Card>
                ))}
                {news.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        No articles found. Import some data to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
