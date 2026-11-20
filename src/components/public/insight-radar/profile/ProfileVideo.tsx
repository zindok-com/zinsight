'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { getYoutubeId } from '@/lib/radar';
import { useVideoWatch, type VideoWatchTrigger } from '@/components/public/insight-radar/video-watch';

interface ProfileVideoProps {
    videoUrl: string;
    posterUrl?: string | null;
    orgName: string;
    orgId: number;
    slug: string;
    className?: string;
}

// lg(1024px) 미만을 모바일로 간주 (레이아웃 분기와 동일 기준)
const MOBILE_QUERY = '(max-width: 1023px)';

function sendEvent(
    name: 'video_play' | 'video_autoplay' | 'video_complete',
    orgId: number,
    slug: string,
    provider: string,
    extra: Record<string, string | boolean> = {},
) {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('event', name, { organization_id: orgId, organization_slug: slug, video_provider: provider, ...extra });
}

/**
 * 조직 소개 영상. 서버 HTML은 해시와 무관하게 항상 동일(포스터 + 클릭 재생)하고,
 * URL 해시가 #play일 때만 클라이언트에서 모바일 자동재생(무음)을 시도한다.
 * GA: 자동재생 시작은 video_autoplay, 시청(video_play)은 직접 재생·소리 켬·전체화면·화면에 보인 채 10초일 때만.
 */
export function ProfileVideo({ videoUrl, posterUrl, orgName, orgId, slug, className = '' }: ProfileVideoProps) {
    const youtubeId = getYoutubeId(videoUrl);
    const sectionRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const playedRef = useRef(false);
    const autoStartingRef = useRef(false);
    const autoStartedRef = useRef(false);
    const [youtubeActive, setYoutubeActive] = useState(false);
    const [youtubeMuted, setYoutubeMuted] = useState(false);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);

    useEffect(() => {
        if (window.location.hash !== '#play') return;
        const isMobile = window.matchMedia(MOBILE_QUERY).matches;
        const block = document.getElementById('play');
        // 하이드레이션 이후에도 영상 위치가 보이도록 한 번 더 맞춤 (데스크톱은 스크롤만)
        block?.scrollIntoView({ block: 'start' });
        if (!isMobile) return;

        if (youtubeId) {
            setYoutubeMuted(true);
            setYoutubeActive(true);
            return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.muted = true;
        autoStartingRef.current = true;
        video.play().catch(() => {
            autoStartingRef.current = false;
            setAutoplayBlocked(true);
        });
    }, [youtubeId]);

    const markWatched = useVideoWatch({
        containerRef: sectionRef,
        videoRef: youtubeId ? undefined : videoRef,
        youtubeAutoplaying: !!youtubeId && youtubeActive && youtubeMuted,
        onWatch: (trigger: VideoWatchTrigger) => {
            if (playedRef.current) return;
            playedRef.current = true;
            sendEvent('video_play', orgId, slug, youtubeId ? 'youtube' : 'file', { watch_trigger: trigger, autoplay: autoStartedRef.current });
        },
    });

    const handleNativePlay = () => {
        setAutoplayBlocked(false);
        if (autoStartingRef.current) {
            autoStartingRef.current = false;
            autoStartedRef.current = true;
            sendEvent('video_autoplay', orgId, slug, 'file');
            return;
        }
        markWatched('click');
    };

    const startYoutube = () => {
        setYoutubeMuted(false);
        setYoutubeActive(true);
        markWatched('click');
    };

    // 유튜브 #play 무음 자동재생: 노출만 기록 (iframe API 없이 임베드라 완료 이벤트는 자체 파일 영상만)
    useEffect(() => {
        if (youtubeActive && youtubeMuted && !autoStartedRef.current) {
            autoStartedRef.current = true;
            sendEvent('video_autoplay', orgId, slug, 'youtube');
        }
    }, [youtubeActive, youtubeMuted, orgId, slug]);

    const youtubePoster = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null;
    const poster = posterUrl || youtubePoster || undefined;

    return (
        <section ref={sectionRef} id="play" aria-label={`${orgName} 소개 영상`} className={`scroll-mt-24 ${className}`}>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 shadow-sm">
                {youtubeId ? (
                    youtubeActive ? (
                        <iframe
                            className="absolute inset-0 h-full w-full"
                            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0${youtubeMuted ? '&mute=1' : ''}`}
                            title={`${orgName} 소개 영상`}
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                            allowFullScreen
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={startYoutube}
                            className="group absolute inset-0 h-full w-full"
                            aria-label={`${orgName} 소개 영상 재생`}
                        >
                            {poster && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
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
                            onPlay={handleNativePlay}
                            onEnded={() => sendEvent('video_complete', orgId, slug, 'file')}
                        >
                            <a href={videoUrl}>소개 영상 보기</a>
                        </video>
                        {autoplayBlocked && (
                            <button
                                type="button"
                                onClick={() => videoRef.current?.play().catch(() => {})}
                                className="absolute inset-0 flex h-full w-full items-center justify-center bg-black/30"
                                aria-label={`${orgName} 소개 영상 재생`}
                            >
                                <PlayBadge />
                            </button>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

function PlayBadge() {
    return (
        <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-zi-primary shadow-lg transition-transform group-hover:scale-105">
            <Play className="h-7 w-7 translate-x-0.5 fill-current" aria-hidden="true" />
        </span>
    );
}
