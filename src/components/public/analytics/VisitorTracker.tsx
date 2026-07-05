'use client';

import { useEffect } from 'react';

function generateUUID() { // fallback if crypto.randomUUID is not available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
}

function setCookie(name: string, value: string, days: number) {
    if (typeof document === 'undefined') return;
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax";
}

export function VisitorTracker() {
    useEffect(() => {
        const trackVisitor = async () => {
            try {
                let visitorId = getCookie('visitor_id');
                
                if (!visitorId) {
                    visitorId = generateUUID();
                    setCookie('visitor_id', visitorId, 365); // 1 year expiry
                }

                // Log the visit for today
                // We use sessionStorage to avoid sending the ping repeatedly during a single session if they navigate away and back
                if (!sessionStorage.getItem('visitor_logged_today')) {
                    const res = await fetch('/api/analytics/visitor', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ visitorId }),
                    });
                    
                    if (res.ok) {
                        sessionStorage.setItem('visitor_logged_today', 'true');
                    }
                }
            } catch (err) {
                console.error('Failed to log visitor:', err);
            }
        };

        // Delay slightly to not block initial render or other critical requests
        setTimeout(trackVisitor, 1000);
    }, []);

    return null;
}
