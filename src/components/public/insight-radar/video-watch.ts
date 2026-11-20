'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * 소개 영상 '시청' 판정 (자동재생과 구분).
 * - 자동재생 시작은 노출일 뿐 시청이 아님 → 호출하는 쪽에서 따로 기록
 * - 시청: 직접 재생(click) · 소리 켬(unmute) · 전체화면(fullscreen) · 화면에 보인 채 10초 재생(time) · 유튜브 영상 안을 누름(tap)
 * 한 번 판정되면 다시 부르지 않음
 */
export type VideoWatchTrigger = 'click' | 'unmute' | 'fullscreen' | 'time' | 'tap';

/** 화면에 보인 채로 이만큼 재생되면 시청으로 봄 (영상이 이보다 짧으면 끝까지 본 경우) */
export const VIDEO_WATCH_SECONDS = 10;
/** 영상 영역이 이 비율 이상 보여야 '보인 채'로 봄 */
const VISIBLE_RATIO = 0.5;

interface Options {
    containerRef: RefObject<HTMLElement | null>;
    /** 자체 영상 파일 (유튜브면 null) */
    videoRef?: RefObject<HTMLVideoElement | null>;
    /** 유튜브 iframe이 자동재생 중인지 (iframe 안은 볼 수 없어 보인 시간·누름으로만 판정) */
    youtubeAutoplaying?: boolean;
    onWatch: (trigger: VideoWatchTrigger) => void;
}

export function useVideoWatch({ containerRef, videoRef, youtubeAutoplaying = false, onWatch }: Options) {
    const doneRef = useRef(false);
    const visibleRef = useRef(false);
    const onWatchRef = useRef(onWatch);
    onWatchRef.current = onWatch;

    const markWatched = (trigger: VideoWatchTrigger) => {
        if (doneRef.current) return;
        doneRef.current = true;
        onWatchRef.current(trigger);
    };
    const markRef = useRef(markWatched);
    markRef.current = markWatched;

    // 화면에 보이는지
    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            visibleRef.current = true;
            return;
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                visibleRef.current = entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO;
            },
            { threshold: [0, VISIBLE_RATIO, 1] },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [containerRef]);

    // 자체 영상: 소리 켬 · 전체화면 · 보인 채 재생 시간
    useEffect(() => {
        const video = videoRef?.current;
        if (!video) return;
        let watchedSeconds = 0;
        let lastTime: number | null = null;
        const threshold = () =>
            Number.isFinite(video.duration) && video.duration > 0 ? Math.min(VIDEO_WATCH_SECONDS, Math.max(video.duration - 0.5, 1)) : VIDEO_WATCH_SECONDS;

        const onVolume = () => {
            if (!video.muted && video.volume > 0 && !video.paused) markRef.current('unmute');
        };
        const onTime = () => {
            const now = video.currentTime;
            if (lastTime !== null && !video.paused && visibleRef.current && document.visibilityState === 'visible') {
                const delta = now - lastTime;
                // 건너뛰기(seek)는 시청 시간에 넣지 않음
                if (delta > 0 && delta < 1.5) watchedSeconds += delta;
            }
            lastTime = now;
            if (watchedSeconds >= threshold()) markRef.current('time');
        };
        const onSeeking = () => {
            lastTime = null;
        };
        const onFullscreen = () => {
            const fs = document.fullscreenElement;
            if (fs && (fs === video || fs.contains(video))) markRef.current('fullscreen');
        };
        const onIosFullscreen = () => markRef.current('fullscreen');

        video.addEventListener('volumechange', onVolume);
        video.addEventListener('timeupdate', onTime);
        video.addEventListener('seeking', onSeeking);
        video.addEventListener('webkitbeginfullscreen', onIosFullscreen);
        document.addEventListener('fullscreenchange', onFullscreen);
        return () => {
            video.removeEventListener('volumechange', onVolume);
            video.removeEventListener('timeupdate', onTime);
            video.removeEventListener('seeking', onSeeking);
            video.removeEventListener('webkitbeginfullscreen', onIosFullscreen);
            document.removeEventListener('fullscreenchange', onFullscreen);
        };
    }, [videoRef]);

    // 유튜브 자동재생: iframe 안을 누름(창 포커스가 iframe으로 감) · 보인 채 10초 (재생 여부는 확인 불가, 근사치)
    useEffect(() => {
        if (!youtubeAutoplaying) return;
        let seconds = 0;
        const timer = window.setInterval(() => {
            if (visibleRef.current && document.visibilityState === 'visible') seconds += 1;
            if (seconds >= VIDEO_WATCH_SECONDS) markRef.current('time');
        }, 1000);
        const onBlur = () => {
            const active = document.activeElement;
            if (active instanceof HTMLIFrameElement && containerRef.current?.contains(active)) markRef.current('tap');
        };
        window.addEventListener('blur', onBlur);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener('blur', onBlur);
        };
    }, [youtubeAutoplaying, containerRef]);

    return markWatched;
}
