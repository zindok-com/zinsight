import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import type { Metadata } from 'next';

export const revalidate = 0; // 동적 리다이렉트를 실시간으로 처리하기 위해 캐싱을 비활성화하거나 ISR 최소화
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// 메타데이터 요청 단계에서도 동일하게 리다이렉트를 가로채 처리합니다.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    // 1. 우선 기사가 데이터베이스에 존재하는지 확인
    const post = await prisma.magazinePost.findUnique({
        where: { slug },
        include: { region: true, category: true }
    });

    if (post && post.deletedAt === null && post.status === 'PUBLISHED') {
        if (post.category?.isLocal && post.region) {
            permanentRedirect(`/magazine/local/${post.region.slug}/${post.slug}`);
        } else {
            permanentRedirect(`/magazine/tech-marketing/${post.slug}`);
        }
    }

    // 2. 존재하지 않는다면 리다이렉트 맵핑 테이블 검사
    const currentPath = `/magazine/${slug}`;
    const redirectRecord = await prisma.redirect.findUnique({
        where: { sourcePath: currentPath }
    });

    if (redirectRecord) {
        if (redirectRecord.permanent) {
            permanentRedirect(redirectRecord.targetPath);
        } else {
            redirect(redirectRecord.targetPath);
        }
    }

    return {
        title: 'Not Found',
        robots: { index: false, follow: false },
    };
}

export default async function LegacyPostRedirectPage({ params }: PageProps) {
    const { slug } = await params;

    // 1. 기사 존재 여부 및 새 카테고리 경로 판별
    const post = await prisma.magazinePost.findUnique({
        where: { slug },
        include: { region: true, category: true }
    });

    if (post && post.deletedAt === null && post.status === 'PUBLISHED') {
        if (post.category?.isLocal && post.region) {
            permanentRedirect(`/magazine/local/${post.region.slug}/${post.slug}`);
        } else {
            permanentRedirect(`/magazine/tech-marketing/${post.slug}`);
        }
    }

    // 2. 관리자 직접 지정 리다이렉트 규칙 검사
    const currentPath = `/magazine/${slug}`;
    const redirectRecord = await prisma.redirect.findUnique({
        where: { sourcePath: currentPath }
    });

    if (redirectRecord) {
        if (redirectRecord.permanent) {
            permanentRedirect(redirectRecord.targetPath);
        } else {
            redirect(redirectRecord.targetPath);
        }
    }

    // 매칭되는 기사도 리다이렉트 룰도 없다면 404 응답
    notFound();
}
