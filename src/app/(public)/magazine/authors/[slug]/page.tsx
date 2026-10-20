import { permanentRedirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// 필진 프로필은 /author/[slug]로 통합. 기존 링크·색인은 301로 이전.
export default async function LegacyAuthorProfileRedirect({ params }: PageProps) {
    const { slug } = await params;
    permanentRedirect(`/author/${encodeURIComponent(slug)}`);
}
