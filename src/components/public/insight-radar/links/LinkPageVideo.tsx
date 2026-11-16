'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { getYoutubeId } from '@/lib/radar';
import { isInternalTraffic, trackLinkPageVideoPlay } from '@/components/public/insight-radar/links/LinkPageTracker';

interface LinkPageVideoProps {
    videoUrl: string;
    posterUrl: string | null;
    orgName: string;
    slug: string;
}

// lg(1024px) 미만을 모바일로 간주 (프로필 영상과 동일 기준)
const MOBILE_QUERY = '(max-width: 1023px)';

function sendPlayEvent(slug: string, provider: string, autoplay: boolean) {
    trackLinkPageVideoPlay(slug);
    if (isInternalTraffic()) return;
    window.gtag?.('event', 'video_play', { organization_slug: slug, video_provider: provider, page_type: 'links', autoplay });
}

/**
 * 링크 페이지 소개 영상. 처음에는 높이 0으로 접어 두어 아래 링크·버튼이 먼저 보이게 하고,
 * 영상이 재생 가능해지면 펼치며 나타남. 모바일은 무음 자동재생, 데스크톱은 클릭 재생.
 * 불러오지 못한 영상은 끝까지 접힌 상태로 둠.
 * 박스 비율은 영상 실제 크기(videoWidth·videoHeight)를 따르고, 세로 영상은 폭을 280px로 제한해 가운데 정렬.
 * 포스터가 없으면 첫 장면이 그려진 뒤에 펼쳐 빈 검은 화면이 보이지 않게 함.
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
    // 가로÷세로. 자체 영상은 메타데이터(없으면 포스터 크기)로, 유튜브는 Shorts면 9:16, 아니면 16:9
    const [ratio, setRatio] = useState<number | null>(() => (youtubeId ? (/\/shorts\//i.test(videoUrl) ? 9 / 16 : 16 / 9) : null));
    const ratioFromVideoRef = useRef(false);

    const applyVideoRatio = (video: HTMLVideoElement) => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            ratioFromVideoRef.current = true;
            setRatio(video.videoWidth / video.videoHeight);
        }
    };

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
        if (video.readyState >= 1) applyVideoRatio(video);
        // 포스터가 없으면 데스크톱도 첫 장면(loadeddata)까지 기다렸다 펼침
        if (!posterUrl) waitFirstFrameRef.current = true;
        if (mobile) {
            waitFirstFrameRef.current = true;
            video.muted = true;
            video.play().catch(() => {
                // 저전력 모드 등으로 자동재생이 막히면 포스터와 재생 버튼으로 표시
                waitFirstFrameRef.current = !posterUrl;
                setAutoplayBlocked(true);
                if (video.readyState >= (posterUrl ? 1 : 2)) setRevealed(true);
            });
        }
        // 하이드레이션 전에 이미 불러온 경우
        if (video.readyState >= (waitFirstFrameRef.current ? 2 : 1)) setRevealed(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [youtubeId]);

    // 영상 메타데이터보다 포스터가 먼저 오면 포스터 크기로 박스 비율을 먼저 잡음
    useEffect(() => {
        if (youtubeId || !posterUrl) return;
        const img = new Image();
        img.onload = () => {
            if (!ratioFromVideoRef.current && img.naturalWidth > 0 && img.naturalHeight > 0) setRatio(img.naturalWidth / img.naturalHeight);
        };
        img.src = posterUrl;
    }, [youtubeId, posterUrl]);

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
    const isPortrait = ratio !== null && ratio < 1;
    // 포스터가 없는 자체 영상: iOS 사파리는 preload만으로 첫 장면을 그리지 않아 미디어 조각(#t)으로 첫 장면을 불러옴
    const fileSrc = !posterUrl && !videoUrl.includes('#') ? `${videoUrl}#t=0.001` : videoUrl;

    return (
        <section
            aria-label={`${orgName} 소개 영상`}
            aria-hidden={!revealed}
            className={`grid transition-[grid-template-rows,opacity,margin] duration-700 ease-out motion-reduce:transition-none ${
                revealed ? 'mb-5 grid-rows-[1fr] opacity-100' : 'mb-0 grid-rows-[0fr] opacity-0'
            }`}
        >
            <div className="min-h-0 overflow-hidden">
                <div
                    className={`relative overflow-hidden rounded-2xl bg-slate-900 shadow-sm ring-1 ring-slate-200/70 ${
                        isPortrait ? 'mx-auto w-full max-w-[280px]' : 'w-full'
                    }`}
                    style={{ aspectRatio: String(ratio ?? 16 / 9) }}
                >
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
                                src={fileSrc}
                                poster={poster}
                                preload={posterUrl ? 'metadata' : 'auto'}
                                controls
                                playsInline
                                tabIndex={revealed ? 0 : -1}
                                onLoadedMetadata={(e) => {
                                    applyVideoRatio(e.currentTarget);
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
