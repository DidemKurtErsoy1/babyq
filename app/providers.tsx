'use client';

import { useEffect } from 'react';
import { getPostHog } from '../lib/posthog';

export default function Providers() {
  useEffect(() => {
    const ph = getPostHog();
    if (!ph) return;

    // Error monitoring — forward real client-side errors to PostHog as a
    // `client_error` event so issues surface (and can be alerted on) without
    // a separate service or waiting for a user to report them.
    const report = (err: unknown, source: string) => {
      const e = err instanceof Error ? err : new Error(String(err));
      try {
        ph.capture('client_error', {
          source,
          message: e.message?.slice(0, 300),
          stack: e.stack?.slice(0, 1000),
          path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        });
      } catch {}
    };
    const onError = (e: ErrorEvent) => report(e.error ?? e.message, 'window.onerror');
    const onRejection = (e: PromiseRejectionEvent) => report(e.reason, 'unhandledrejection');

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
