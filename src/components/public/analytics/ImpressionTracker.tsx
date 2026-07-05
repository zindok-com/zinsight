'use client';

import { useEffect, useRef } from 'react';

// Global queue to batch impressions and send them together
let impressionQueue: number[] = [];
let queueTimeout: NodeJS.Timeout | null = null;

const sendBatchImpressions = async () => {
    if (impressionQueue.length === 0) return;
    const batch = [...new Set(impressionQueue)]; // Deduplicate batch
    impressionQueue = [];
    
    try {
        await fetch('/api/analytics/impression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postIds: batch }),
            // Use keepalive to ensure request goes through even if user navigates away
            keepalive: true,
        });
    } catch (err) {
        console.error('Failed to send impression batch:', err);
    }
};

const queueImpression = (postId: number) => {
    impressionQueue.push(postId);
    if (queueTimeout) clearTimeout(queueTimeout);
    queueTimeout = setTimeout(sendBatchImpressions, 3000); // 3s debounce
};

interface ImpressionTrackerProps {
    postId: number;
    children: React.ReactNode;
}

export function ImpressionTracker({ postId, children }: ImpressionTrackerProps) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        let timerId: NodeJS.Timeout | null = null;
        let hasLogged = false;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (hasLogged) return;

                    if (entry.isIntersecting) {
                        // Start tracking duration
                        timerId = setTimeout(() => {
                            queueImpression(postId);
                            hasLogged = true;
                            observer.disconnect(); // Stop tracking once logged
                        }, 1500); // 1.5 seconds visibility threshold
                    } else {
                        // Reset if scrolled away before threshold
                        if (timerId) {
                            clearTimeout(timerId);
                            timerId = null;
                        }
                    }
                });
            },
            { threshold: 0.5 } // 50% visibility threshold
        );

        observer.observe(element);

        return () => {
            if (timerId) clearTimeout(timerId);
            observer.disconnect();
        };
    }, [postId]);

    return <div ref={elementRef} className="h-full w-full">{children}</div>;
}
