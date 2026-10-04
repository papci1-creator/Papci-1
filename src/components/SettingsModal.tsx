import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cpu,
  RefreshCw,
  Video,
  FileText,
  Lock,
  Terminal,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Film,
  Sparkles,
} from 'lucide-react';
import { SAMPLE_VIDEO_CLIPS } from '../data/presets';

interface SettingsStatus {
  geminiConfigured: boolean;
  runwayConfigured: boolean;
  lumaConfigured: boolean;
  openaiConfigured: boolean;
  geminiKeyMasked?: string | null;
  runwayKeyMasked?: string | null;
  lumaKeyMasked?: string | null;
  openaiKeyMasked?: string | null;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  useLiveVideoPreview: boolean;
  setUseLiveVideoPreview: (val: boolean) => void;
  currentPlaceholderVideo?: string;
  onSelectPlaceholderVideo?: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  useLiveVideoPreview,
  setUseLiveVideoPreview,
  currentPlaceholderVideo,
  onSelectPlaceholderVideo,
}) => {
  const [settingsStatus, setSettingsStatus] = useState<SettingsStatus | null>(null);

  // Form input states for API Keys
  const [runwayKeyInput, setRunwayKeyInput] = useState('');
  const [lumaKeyInput, setLumaKeyInput] = useState('');
  const [openaiKeyInput, setOpenaiKeyInput] = useState('');
  const [customVideoUrl, setCustomVideoUrl] = useState('');

  // Password visibility states
  const [showRunwayKey, setShowRunwayKey] = useState(false);
  const [showLumaKey, setShowLumaKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  // Status & loading states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [verifyingProvider, setVerifyingProvider] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<{ provider: string; msg: string; ok: boolean } | null>(null);

  const fetchSettings = () => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setSettingsStatus(data))
      .catch(() => {});
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      if (currentPlaceholderVideo) {
        setCustomVideoUrl(currentPlaceholderVideo);
      }
    }
  }, [isOpen, currentPlaceholderVideo]);

  const handleSaveKeys = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setVerifyMessage(null);

    const payload: Record<string, string> = {};
    if (runwayKeyInput.trim()) payload.runwayApiKey = runwayKeyInput.trim();
    if (lumaKeyInput.trim()) payload.lumaApiKey = lumaKeyInput.trim();
    if (openaiKeyInput.trim()) payload.openaiApiKey = openaiKeyInput.trim();

    try {
      const res = await fetch('/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.settings) {
        setSettingsStatus(data.settings);
      }
      setSaveSuccessMsg('API environment keys securely updated in server-side proxy runtime.');
      setRunwayKeyInput('');
      setLumaKeyInput('');
      setOpenaiKeyInput('');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch {
      setVerifyMessage({
        provider: 'System',
        msg: 'Failed to save environment keys to server proxy.',
        ok: false,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearKey = async (provider: 'runway' | 'luma' | 'openai') => {
    try {
      const res = await fetch('/api/settings/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.settings) {
        setSettingsStatus(data.settings);
      }
      setSaveSuccessMsg(`${provider.toUpperCase()} key removed from server environment.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch {
      // ignore
    }
  };

  const handleVerify = async (provider: string) => {
    setVerifyingProvider(provider);
    setVerifyMessage(null);
    try {
      const res = await fetch('/api/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setVerifyMessage({
        provider,
        msg: data.message,
        ok: data.status === 'connected',
      });
    } catch {
      setVerifyMessage({
        provider,
        msg: 'Failed to connect to proxy verification endpoint.',
        ok: false,
      });
    } finally {
      setVerifyingProvider(null);
    }
  };

  const handleApplyCustomVideo = (url: string) => {
    if (onSelectPlaceholderVideo && url.trim()) {
      onSelectPlaceholderVideo(url.trim());
      setSaveSuccessMsg(`Applied placeholder video loop: ${url.slice(0, 45)}...`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0e18] border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e1322]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                API & Live Preview Configuration
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Proxy Architecture
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Securely configure Runway & Luma API keys and manage placeholder animation loops
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-[#0a0f1c] border border-cyan-500/25 flex items-start gap-3">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-300 space-y-1">
              <div className="font-semibold text-cyan-300 flex items-center gap-2">
                <span>Server-Side Proxy Security Guarantee</span>
                <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-500/30">
                  Encrypted & Hidden
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Keys entered here are securely passed to backend server proxy routes (
                <code className="text-cyan-300 font-mono text-[10px]">/api/settings/keys</code>) and stored in
                memory. Raw secret tokens are never exposed in browser client code or console logs.
              </p>
            </div>
          </div>

          {/* Feedback Banners */}
          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {verifyMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-mono border flex items-start gap-2 ${
                verifyMessage.ok
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
              }`}
            >
              {verifyMessage.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold uppercase tracking-wider mb-0.5">{verifyMessage.provider} Status:</div>
                <div className="text-[11px] opacity-90">{verifyMessage.msg}</div>
              </div>
            </div>
          )}

          {/* SECTION 1: Connect Real APIs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Video Generation API Keys (Environment Variables)</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Persisted in Server Proxy</span>
            </div>

            <div className="space-y-3">
              {/* RUNWAY GEN-3 ALPHA FIELD */}
              <div className="p-3.5 rounded-xl bg-[#070911] border border-zinc-800/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">Runway Gen-3 Alpha</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      RUNWAY_API_KEY
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        settingsStatus?.runwayConfigured
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-850 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {settingsStatus?.runwayConfigured
                        ? settingsStatus.runwayKeyMasked || 'Configured (Active)'
                        : 'Not Set (Using Studio Fallback)'}
                    </span>
                    <button
                      onClick={() => handleVerify('runway')}
                      disabled={verifyingProvider === 'runway'}
                      className="px-2 py-1 rounded bg-[#141928] hover:bg-[#1d253b] text-cyan-300 border border-cyan-500/30 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw
                        className={`w-2.5 h-2.5 ${verifyingProvider === 'runway' ? 'animate-spin' : ''}`}
                      />
                      Test
                    </button>
                    {settingsStatus?.runwayConfigured && (
                      <button
                        onClick={() => handleClearKey('runway')}
                        title="Remove key from server"
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showRunwayKey ? 'text' : 'password'}
                      value={runwayKeyInput}
                      onChange={(e) => setRunwayKeyInput(e.target.value)}
                      placeholder={
                        settingsStatus?.runwayConfigured
                          ? 'Replace existing key: rw_live_...'
                          : 'Input actual Runway API Key (e.g. rw_live_...)'
                      }
                      className="w-full bg-[#0a0d16] border border-zinc-750 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRunwayKey(!showRunwayKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showRunwayKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* LUMA DREAM MACHINE FIELD */}
              <div className="p-3.5 rounded-xl bg-[#070911] border border-zinc-800/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">Luma Dream Machine 2.0</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      LUMA_API_KEY
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        settingsStatus?.lumaConfigured
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-850 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {settingsStatus?.lumaConfigured
                        ? settingsStatus.lumaKeyMasked || 'Configured (Active)'
                        : 'Not Set (Using Studio Fallback)'}
                    </span>
                    <button
                      onClick={() => handleVerify('luma')}
                      disabled={verifyingProvider === 'luma'}
                      className="px-2 py-1 rounded bg-[#141928] hover:bg-[#1d253b] text-cyan-300 border border-cyan-500/30 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${verifyingProvider === 'luma' ? 'animate-spin' : ''}`} />
                      Test
                    </button>
                    {settingsStatus?.lumaConfigured && (
                      <button
                        onClick={() => handleClearKey('luma')}
                        title="Remove key from server"
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showLumaKey ? 'text' : 'password'}
                      value={lumaKeyInput}
                      onChange={(e) => setLumaKeyInput(e.target.value)}
                      placeholder={
                        settingsStatus?.lumaConfigured
                          ? 'Replace existing key: luma-...'
                          : 'Input actual Luma API Key (e.g. luma_...)'
                      }
                      className="w-full bg-[#0a0d16] border border-zinc-750 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLumaKey(!showLumaKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showLumaKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* OPENAI SORA FIELD */}
              <div className="p-3.5 rounded-xl bg-[#070911] border border-zinc-800/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">OpenAI Sora</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      OPENAI_API_KEY
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        settingsStatus?.openaiConfigured
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-850 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {settingsStatus?.openaiConfigured
                        ? settingsStatus.openaiKeyMasked || 'Configured (Active)'
                        : 'Not Set (Optional)'}
                    </span>
                    {settingsStatus?.openaiConfigured && (
                      <button
                        onClick={() => handleClearKey('openai')}
                        title="Remove key from server"
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showOpenaiKey ? 'text' : 'password'}
                      value={openaiKeyInput}
                      onChange={(e) => setOpenaiKeyInput(e.target.value)}
                      placeholder={
                        settingsStatus?.openaiConfigured
                          ? 'Replace existing key: sk-...'
                          : 'Input actual OpenAI API Key (e.g. sk-proj-...)'
                      }
                      className="w-full bg-[#0a0d16] border border-zinc-750 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showOpenaiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SAVE KEYS BUTTON */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveKeys}
                  disabled={isSaving || (!runwayKeyInput && !lumaKeyInput && !openaiKeyInput)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Encrypting & Saving...' : 'Save API Keys to Server Proxy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: Placeholder Video Clip URL & Open-Source Animation Loops */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Previews: Open-Source Loops & Transitions</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">Immediate Browser Testing</span>
            </div>

            {/* Toggle Switch for Live Video Previews */}
            <div className="p-3.5 rounded-xl bg-[#070911] border border-zinc-800/90 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                  <span>Player Live Video Loop Stream</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    Recommended
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Play open-source video animation loops directly underneath your scene transitions (Fade, Dissolve,
                  Glitch, Wipe)
                </div>
              </div>

              <button
                onClick={() => setUseLiveVideoPreview(!useLiveVideoPreview)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  useLiveVideoPreview
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {useLiveVideoPreview ? 'Live Video (Active)' : 'Procedural Canvas Only'}
              </button>
            </div>

            {/* Presets Grid for Open-Source Animation Loops */}
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                <Film className="w-3 h-3 text-amber-400" />
                <span>Select Open-Source Animation Loop to Test Transitions:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_VIDEO_CLIPS.map((clip) => {
                  const isActive = currentPlaceholderVideo === clip.url;
                  return (
                    <button
                      key={clip.id}
                      onClick={() => handleApplyCustomVideo(clip.url)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-[#10192e] border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                          : 'bg-[#070911] border-zinc-800 hover:border-zinc-700 hover:bg-[#0c0f1d]'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="text-xs font-bold text-zinc-200 truncate">{clip.label}</div>
                        <div className="text-[10px] font-mono text-zinc-500">{clip.category} Animation Loop</div>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                          isActive
                            ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                            : 'bg-zinc-850 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {isActive ? 'Active' : 'Apply'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Placeholder Video URL Input */}
            <div className="p-3 rounded-xl bg-[#070911] border border-zinc-800/90 space-y-2">
              <label className="text-[11px] font-medium text-zinc-300 block">
                Custom Video Clip URL (Direct MP4 / WebM Link):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customVideoUrl}
                  onChange={(e) => setCustomVideoUrl(e.target.value)}
                  placeholder="https://.../your-placeholder-animation.mp4"
                  className="flex-1 bg-[#0a0d16] border border-zinc-750 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => handleApplyCustomVideo(customVideoUrl)}
                  className="px-3 py-1.5 rounded-lg bg-[#141928] hover:bg-[#1d253b] text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
                >
                  Apply URL
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
                You can use any open-source MP4 loop from Wikimedia Commons, Google Cloud Storage, or Mixkit.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#0e1322] flex items-center justify-between">
          <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>StoryCast AI Pro Security Shield v3.4</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
