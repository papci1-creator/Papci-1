import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, WifiOff, Share2, CheckCircle2 } from 'lucide-react';

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
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const ua = (navigator.userAgent || '').toLowerCase();
    setIsAndroid(/android/.test(ua));
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallGuideModal(false);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      setShowInstallGuideModal(true);
    }
  };

  return (
    <>
      {/* Offline Connectivity Indicator Toast */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 border border-amber-300 px-3.5 py-2 text-xs font-bold text-black shadow-xl backdrop-blur-md">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Mode — Local cached studio assets active</span>
        </div>
      )}

      {/* Top In-App PWA Install Banner */}
      {!isInstalled && !isDismissed && (
        <div className="bg-gradient-to-r from-[#0d1424] via-[#101b33] to-[#0d1424] border-b border-cyan-500/40 px-3 py-2 flex items-center justify-between text-xs animate-in slide-in-from-top duration-200 z-40 relative">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white tracking-wide">{appName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-semibold">
                  {isIOS
                    ? 'iOS Home Screen PWA'
                    : isAndroid
                    ? 'Android Standalone App'
                    : 'Installable Desktop & Mobile PWA'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 truncate hidden sm:block">
                Install to your device home screen for standalone fullscreen studio playback & offline caching
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1 rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold text-[11px] font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.35)] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
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
      )}

      {/* Guided Installation Modal for iOS Safari / Browser Menu */}
      {showInstallGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0b0f1c] border border-cyan-500/40 p-5 shadow-2xl text-zinc-100 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-192x192.png"
                  alt="StoryCast Icon"
                  className="w-9 h-9 rounded-xl border border-cyan-500/40"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-white">Install {appName}</h3>
                  <p className="text-[11px] text-cyan-400 font-mono">
                    Standalone PWA • 192px & 512px Icons Ready
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallGuideModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2.5 text-xs text-zinc-300">
                <p className="text-zinc-400">
                  To install <strong>{appName}</strong> on your iPhone or iPad:
                </p>
                <div className="p-3 rounded-xl bg-[#11172a] border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      1. Tap the <strong>Share</strong> button in your Safari toolbar.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      2. Scroll down and tap <strong>Add to Home Screen</strong>.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-zinc-300">
                <p className="text-zinc-400">
                  To install <strong>{appName}</strong> as a standalone desktop or mobile app:
                </p>
                <div className="p-3 rounded-xl bg-[#11172a] border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      1. Click the <strong>Install StoryCast</strong> icon in your browser address bar (or open the browser <strong>⋮</strong> menu).
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      2. Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstallGuideModal(false)}
              className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
