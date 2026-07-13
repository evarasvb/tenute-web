'use client';

import { useEffect } from 'react';

/**
 * Facebook Pixel Component for Tenute.cl
 * Installs and configures Facebook Pixel for conversion tracking
 * Pixel ID: To be configured by user from Facebook Business Manager
 */
export function FacebookPixel() {
    const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '';

  useEffect(() => {
        if (!PIXEL_ID) {
                console.warn('Facebook Pixel ID not configured');
                return;
        }

                // Load Facebook Pixel Script
                (function (f, b, e, v, n, t, s) {
                        if (f.fbq) return;
                        n = f.fbq = function () {
                                  n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                        };
                        if (!f._fbq) f._fbq = n;
                        n.push = n;
                        n.loaded = !0;
                        n.version = '2.0';
                        n.queue = [];
                        t = b.createElement(e);
                        t.async = !0;
                        t.src = v;
                        s = b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t, s);
                } as any)(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

                // Initialize Pixel
                fbq('init', PIXEL_ID);
        fbq('track', 'PageView');
  }, [PIXEL_ID]);

  return null;
}

/**
 * Fire custom events to Facebook Pixel
 */
export function trackPixelEvent(eventName: string, data?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', eventName, data);
    }
}

declare global {
    interface Window {
          fbq?: (...args: any[]) => void;
    }
}
