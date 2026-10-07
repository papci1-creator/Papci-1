import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share2, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptBannerProps {
  appName?: string;
}

export const InstallPromptBanner: React.FC<InstallPromptBannerProps> = ({
  appName = 'StoryCast AI Pro',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect mobile / Android environment
    const ua = navigator.userAgent || '';
    const android = /android/i.test(ua);
    setIsAndroid(android);

    // Detect if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // In case beforeinstallprompt didn't fire, provide friendly instruction
      alert(
        'To install StoryCast on Android or Chrome, tap the browser menu (⋮) and select "Add to Home screen" or "Install app".'
      );
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-[#0d1424] via-[#101b33] to-[#0d1424] border-b border-cyan-500/40 px-3 py-2 flex items-center justify-between text-xs animate-in slide-in-from-top duration-200 z-40 relative">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white tracking-wide">{appName}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-semibold">
              {isAndroid ? 'Android App Available' : 'Web & Mobile Ready'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 truncate hidden sm:block">
            Install to your device home screen for fullscreen offline studio workflow
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1 rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold text-[11px] font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.35)] transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Dismiss install banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
