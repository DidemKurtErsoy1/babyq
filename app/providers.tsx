'use client';

import { useEffect } from 'react';
import { getPostHog } from '../lib/posthog';

export default function Providers() {
  useEffect(() => {
    getPostHog();
  }, []);

  return null;
}
