'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { getYoutubeId } from '@/lib/radar';

interface LinkPageVideoProps {
    videoUrl: string;
    posterUrl: string | null;
    orgName: string;
    slug: string;
}

// lg(1024px) 미만을 모바일로 간주 (프로필 영상과 동일 기준)
const MOBILE_QUERY = '(max-width: 1023px)';

function sendPlayEvent(slug: string, provider: string, autoplay: boolean) {
    window.gtag?.('event', 'video_play', { organization_slug: slug, video_provider: provider, page_type: 'links', autoplay });
}

/**
 * 링크 페이지 소개 영상. 처음에는 높이 0으로 접어 두어 아래 링크·버튼이 먼저 보이게 하고,
 * 영상이 재생 가능해지면 펼치며 나타남. 모바일은 무음 자동재생, 데스크톱은 클릭 재생.
 * 불러오지 못한 영상은 끝까지 접힌 상태로 둠.
 */
export function LinkPageVideo({ videoUrl, posterUrl, orgName, slug }: LinkPageVideoProps) {
    const youtubeId = getYoutubeId(videoUrl);
    const videoRef = useRef<HTMLVideoElement>(null);
    const playedRef = useRef(false);
    // 자동재생 중이면 첫 장면(loadeddata)까지, 클릭 재생이면 포스터·메타데이터(loadedmetadata)만 준비되면 펼침
    const waitFirstFrameRef = useRef(false);
    const [isMobile, setIsMobile] = useState<boolean | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);
    const [youtubeActive, setYoutubeActive] = useState(false);

    useEffect(() => {
        const mobile = window.matchMedia(MOBILE_QUERY).matches;
        setIsMobile(mobile);

        if (youtubeId) {
            // 유튜브: 모바일은 무음 자동재생 iframe을 띄우고 로드되면 펼침, 데스크톱은 썸네일 로드 후 펼침
            if (mobile) setYoutubeActive(true);
            return;
        }
        const video = videoRef.current;
        if (!video) return;
        if (mobile) {
            waitFirstFrameRef.current = true;
            video.muted = true;
            video.play().catch(() => {
                // 저전력 모드 등으로 자동재생이 막히면 포스터와 재생 버튼으로 표시
                waitFirstFrameRef.current = false;
                setAutoplayBlocked(true);
                if (video.readyState >= 1) setRevealed(true);
            });
        }
        // 하이드레이션 전에 이미 불러온 경우
        if (video.readyState >= (waitFirstFrameRef.current ? 2 : 1)) setRevealed(true);
    }, [youtubeId]);

    const handleNativePlay = () => {
        setAutoplayBlocked(false);
        if (playedRef.current) return;
        playedRef.current = true;
        sendPlayEvent(slug, 'file', !!videoRef.current?.muted && !!isMobile);
    };

    const startYoutube = () => {
        setYoutubeActive(true);
        sendPlayEvent(slug, 'youtube', false);
    };

    const youtubePoster = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null;
    const poster = posterUrl || youtubePoster || undefined;
    const youtubeMuted = !!isMobile;

    return (
        <section
            aria-label={`${orgName} 소개 영상`}
            aria-hidden={!revealed}
            className={`grid transition-[grid-template-rows,opacity,margin] duration-700 ease-out motion-reduce:transition-none ${
                revealed ? 'mb-5 grid-rows-[1fr] opacity-100' : 'mb-0 grid-rows-[0fr] opacity-0'
            }`}
        >
            <div className="min-h-0 overflow-hidden">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 shadow-sm ring-1 ring-slate-200/70">
                    {youtubeId ? (
                        youtubeActive ? (
                            <iframe
                                className="absolute inset-0 h-full w-full"
                                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0${youtubeMuted ? '&mute=1' : ''}`}
                                title={`${orgName} 소개 영상`}
                                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                allowFullScreen
                                onLoad={() => {
                                    setRevealed(true);
                                    if (youtubeMuted && !playedRef.current) {
                                        playedRef.current = true;
                                        sendPlayEvent(slug, 'youtube', true);
                                    }
                                }}
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={startYoutube}
                                tabIndex={revealed ? 0 : -1}
                                className="group absolute inset-0 h-full w-full"
                                aria-label={`${orgName} 소개 영상 재생`}
                            >
                                {poster && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={poster}
                                        alt=""
                                        onLoad={() => setRevealed(true)}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                )}
                                <PlayBadge />
                            </button>
                        )
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                className="absolute inset-0 h-full w-full bg-black object-contain"
                                src={videoUrl}
                                poster={poster}
                                preload="metadata"
                                controls
                                playsInline
                                tabIndex={revealed ? 0 : -1}
                                onLoadedMetadata={() => {
                                    if (!waitFirstFrameRef.current) setRevealed(true);
                                }}
                                onLoadedData={() => setRevealed(true)}
                                onPlay={handleNativePlay}
                            >
                                <a href={videoUrl}>소개 영상 보기</a>
                            </video>
                            {autoplayBlocked && (
                                <button
                                    type="button"
                                    onClick={() => videoRef.current?.play().catch(() => {})}
                                    className="group absolute inset-0 flex h-full w-full items-center justify-center bg-black/30"
                                    aria-label={`${orgName} 소개 영상 재생`}
                                >
                                    <PlayBadge />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

function PlayBadge() {
    return (
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-zi-primary shadow-lg transition-transform group-hover:scale-105">
            <Play className="h-6 w-6 translate-x-0.5 fill-current" aria-hidden="true" />
        </span>
    );
}
