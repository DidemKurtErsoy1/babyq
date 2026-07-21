'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '../../lib/useI18n';

const DISMISS_KEY = 'babyq_install_dismissed_v1';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const STR = {
  en: {
    title: 'Install BabyQ',
    body: 'Add it to your home screen for quick, app-like access.',
    install: 'Install',
    iosBody: 'Tap the Share button, then “Add to Home Screen”.',
    dismiss: 'Dismiss',
  },
  tr: {
    title: "BabyQ'yu yükle",
    body: 'Ana ekranına ekle, uygulama gibi tek dokunuşla aç.',
    install: 'Yükle',
    iosBody: 'Paylaş butonuna dokun, sonra “Ana Ekrana Ekle”yi seç.',
    dismiss: 'Kapat',
  },
} as const;

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const { lang } = useI18n();
  const s = STR[lang];

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {}

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 2500);
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    // iOS Safari never fires beforeinstallprompt — show manual instructions.
    if (isIos() && /safari/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent)) {
      setShowIos(true);
      setTimeout(() => setVisible(true), 2500);
    }

    const onInstalled = () => setVisible(false);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setDeferred(null);
    dismiss();
  }

  if (!visible || (!deferred && !showIos)) return null;

  return (
    <div
      role="dialog"
      aria-label={s.title}
      style={{
        position: 'fixed',
        left: 16, right: 16, bottom: 16,
        zIndex: 60,
        maxWidth: 460, margin: '0 auto',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-float)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
        background: 'linear-gradient(155deg, var(--brand-soft), var(--brand))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>👶</div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 750, fontSize: 14.5, color: 'var(--ink)' }}>{s.title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
          {showIos && !deferred ? s.iosBody : s.body}
        </div>
      </div>

      {deferred ? (
        <button onClick={install} className="btn" style={{ padding: '9px 16px', fontSize: 13.5, flexShrink: 0 }}>
          {s.install}
        </button>
      ) : null}

      <button
        onClick={dismiss}
        aria-label={s.dismiss}
        style={{
          flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: 'none',
          background: 'transparent', color: 'var(--ink-tertiary)', cursor: 'pointer',
          fontSize: 18, lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}
