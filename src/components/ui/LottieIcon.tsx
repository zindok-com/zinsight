'use client';

import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

// 아이콘 파일명 매핑 (짧은 이름으로 관리)
const ICON_MAP = {
  rules: 'wired-outline-1020-rules-book-guideline-hover-flutter.json',
  marketing: 'wired-outline-1027-marketing-campaign-hover-pinch.json',
  mail: 'wired-outline-145-envelope-mail-hover-pinch.json',
  chart: 'wired-outline-153-bar-chart-hover-pinch.json',
  work: 'wired-outline-1846-employee-working-hover-working (1).json',
  magazine: 'wired-outline-2293-magazine-catalog-hover-flutter.json',
  search: 'wired-outline-288-avatar-man-search-hover-pinch.json',
  document: 'wired-outline-3090-document-letter-hover-pinch.json',
  bulb: 'wired-outline-36-bulb-hover-blink.json',
  news: 'wired-outline-411-news-newspaper-hover-pinch.json',
  clock: 'wired-outline-45-clock-time-hover-pinch.json',
  target: 'wired-outline-458-goal-target-hover-hit.json',
  network: 'wired-outline-952-business-network-hover-pinch.json',
  team: 'wired-outline-957-team-work-hover-pinch (1).json',
  analytics: 'wired-outline-976-web-analytics-hover-pinch.json',
  management: 'wired-outline-978-project-management-hover-pinch.json',
} as const;

export type LottieIconName = keyof typeof ICON_MAP;

interface LottieIconProps {
  name: LottieIconName;
  size?: number | string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  hover?: boolean; // 마우스 오버 시 재생 여부
  speed?: number; // 속도 조절 추가
}

/**
 * Zinsight 공통 Lottie 아이콘 컴포넌트
 * public/assets/lottie/json 폴더의 아이콘을 렌더링합니다.
 */
export function LottieIcon({
  name,
  size = 24,
  loop = true,
  autoplay = true,
  className = '',
  hover = false,
  speed,
}: LottieIconProps) {
  const [animationData, setAnimationData] = useState<any>(null);
  const lottieRef = React.useRef<any>(null);

  useEffect(() => {
    const fileName = ICON_MAP[name];
    if (!fileName) return;

    fetch(`/assets/lottie/json/${fileName}`)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Lottie load error:', err));
  }, [name]);

  useEffect(() => {
    if (lottieRef.current && speed !== undefined) {
      lottieRef.current.setSpeed(speed);
    }
  }, [animationData, speed]);

  const handleMouseEnter = () => {
    if (hover && lottieRef.current) {
      lottieRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (hover && lottieRef.current) {
      lottieRef.current.stop();
    }
  };

  if (!animationData) {
    return <div style={{ width: size, height: size }} className={className} />;
  }

  return (
    <div 
      style={{ width: size, height: size }} 
      className={`inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={hover ? false : loop}
        autoplay={hover ? false : autoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
