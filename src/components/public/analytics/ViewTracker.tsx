'use client';

import { useEffect } from 'react';

export function ViewTracker({ postId }: { postId: number }) {
    useEffect(() => {
        const logView = async () => {
            try {
                const viewedSessionKey = `viewed_post_${postId}`;
                const isUnique = !sessionStorage.getItem(viewedSessionKey);
                
                await fetch('/api/analytics/view', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postId, isUnique }),
                });

                if (isUnique) {
                    sessionStorage.setItem(viewedSessionKey, 'true');
                }
            } catch (err) {
                console.error('Failed to log view:', err);
            }
        };

        // Delay slightly so it doesn't block critical page rendering
        const timeoutId = setTimeout(logView, 800);
        return () => clearTimeout(timeoutId);
    }, [postId]);

    return null;
}
