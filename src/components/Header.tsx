import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Download,
  Volume2,
  Clapperboard,
  Layers,
  Music,
  Settings,
  FileText,
  Mail,
  Image as ImageIcon,
  Mic,
  LogOut,
  ChevronDown,
  ShieldCheck,
  RotateCcw,
  Palette,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { PRESET_STORIES } from '../data/presets';
import { PresetStory } from '../types';

interface HeaderProps {
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  sceneCount: number;
  totalDuration: number;
  isGenerating: boolean;
  onExportClick: () => void;
  onSelectPreset: (preset: PresetStory) => void;
  musicPlaying: boolean;
  onOpenSettings?: () => void;
  onOpenGoogleForms?: () => void;
  onOpenGmail?: () => void;
  onOpenBackgroundGenerator?: () => void;
  onOpenVoiceRecorder?: () => void;
  onOpenPosterGenerator?: () => void;
  onOpenSoundtrackStudio?: () => void;
  onOpenCostumeLock?: () => void;
  onOpenCinematicGallery?: () => void;
  onRelaunchCanvas?: () => void;
  currentUser?: User | null;
  onSignInGoogle?: () => void;
  onSignOutGoogle?: () => void;
  isAuthLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projectTitle,
  setProjectTitle,
  sceneCount,
  totalDuration,
  isGenerating,
  onExportClick,
  onSelectPreset,
  musicPlaying,
  onOpenSettings,
  onOpenGoogleForms,
  onOpenGmail,
  onOpenBackgroundGenerator,
  onOpenVoiceRecorder,
  onOpenPosterGenerator,
  onOpenSoundtrackStudio,
  onOpenCostumeLock,
  onOpenCinematicGallery,
  onRelaunchCanvas,
  currentUser,
  onSignInGoogle,
  onSignOutGoogle,
  isAuthLoading = false,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-14 sm:h-16 border-b border-cyan-950/40 bg-[#080a0f]/90 backdrop-blur-md px-2.5 sm:px-6 flex items-center justify-between gap-2 z-30 sticky top-0 max-w-full overflow-x-hidden">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-cyan-400 via-cyan-600 to-amber-500 p-[1px] shadow-[0_0_15px_rgba(0,240,255,0.4)] shrink-0">
            <div className="w-full h-full bg-[#090b12] rounded-[7px] flex items-center justify-center">
              <Clapperboard className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-xs sm:text-sm tracking-wider text-white uppercase font-sans whitespace-nowrap">
                StoryCast
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500/20 to-amber-500/20 text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                AI Pro
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden xs:inline">Engine v3.4</span>
              {onRelaunchCanvas && (
                <button
                  onClick={onRelaunchCanvas}
                  title="Re-launch & refresh interactive app canvas stage"
                  className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40 flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Relaunch</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block h-6 w-px bg-zinc-800" />

        {/* Project Name Editable Input */}
        <div className="hidden md:flex items-center gap-2 bg-[#0e121d] px-3 py-1.5 rounded-lg border border-zinc-800/80 focus-within:border-cyan-500/50 transition-colors">
          <Film className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="bg-transparent text-xs text-zinc-200 focus:outline-none w-48 lg:w-60 font-medium"
            placeholder="Project Title..."
          />
        </div>
      </div>

      {/* Middle: Quick Preset Loaders */}
      <div className="hidden xl:flex items-center gap-2">
        <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Presets:
        </span>
        {PRESET_STORIES.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPreset(p)}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#111522] hover:bg-[#1a2033] text-zinc-300 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 transition-all cursor-pointer"
          >
            {p.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Right Controls: Stats & Master Export Button */}
      <div className="flex items-center gap-1 sm:gap-2.5 min-w-0">
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-zinc-400 bg-[#0e121d] px-3 py-1.5 rounded-lg border border-zinc-800/60">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{sceneCount} Scenes</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400">⏱</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
          {musicPlaying && (
            <>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-1 text-cyan-400">
                <Music className="w-3 h-3 animate-pulse" />
                <span className="text-[10px]">BGM Live</span>
              </div>
            </>
          )}
        </div>

        {/* Afrobeat & Custom Soundtrack Multi-Track Studio Button */}
        {onOpenSoundtrackStudio && (
          <button
            onClick={onOpenSoundtrackStudio}
            title="Afrobeat & Custom Soundtrack Studio - Multi-track mixer (Voiceover, Afrobeat Score & Ambient SFX)"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[#0e121d] hover:bg-amber-950/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0"
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Afrobeat & Score</span>
          </button>
        )}

        {/* Storyboard Continuity & Costume Locks Button */}
        {onOpenCostumeLock && (
          <button
            onClick={onOpenCostumeLock}
            title="Storyboard Continuity & Costume Locks - Keep character outfits and keyframes consistent across scenes"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[#0e121d] hover:bg-emerald-950/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.18)] shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Costume Locks</span>
          </button>
        )}

        {/* Cinematic Preset Gallery - Color Grading Filters Button */}
        {onOpenCinematicGallery && (
          <button
            onClick={onOpenCinematicGallery}
            title="Cinematic Preset Gallery - Apply color grading LUT filters (Noir, Technicolor, Retro, Desaturated)"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[#0e121d] hover:bg-fuchsia-950/30 text-fuchsia-300 hover:text-fuchsia-200 border border-fuchsia-500/40 hover:border-fuchsia-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(217,70,239,0.2)] shrink-0"
          >
            <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="hidden md:inline">Color Presets</span>
          </button>
        )}

        {/* Generate Poster - Cinematic Movie Poster Studio Button */}
        {onOpenPosterGenerator && (
          <button
            onClick={onOpenPosterGenerator}
            title="Generate Cinematic Movie Poster based on Story Title & Theme"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_14px_rgba(245,158,11,0.25)] shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Generate Poster</span>
          </button>
        )}

        {/* AI Background Studio / Image Generation Button */}
        {onOpenBackgroundGenerator && (
          <button
            onClick={onOpenBackgroundGenerator}
            title="AI Background Studio - Generate Custom Scene Environments"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[#0e121d] hover:bg-cyan-950/30 text-cyan-300 hover:text-cyan-200 border border-zinc-800 hover:border-cyan-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.15)] shrink-0"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Backgrounds</span>
          </button>
        )}

        {/* Voice Studio / Voice Recorder Button */}
        {onOpenVoiceRecorder && (
          <button
            onClick={onOpenVoiceRecorder}
            title="Voice Recorder Studio - Record microphone audio for scenes"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[#0e121d] hover:bg-rose-950/30 text-rose-300 hover:text-rose-200 border border-zinc-800 hover:border-rose-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.15)] shrink-0"
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Voice Studio</span>
          </button>
        )}

        {/* Google Forms Integration Button */}
        {onOpenGoogleForms && (
          <button
            onClick={onOpenGoogleForms}
            title="Google Forms - Audience Screening & Feedback"
            className="hidden sm:flex p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[#0e121d] hover:bg-purple-950/30 text-purple-300 hover:text-purple-200 border border-zinc-800 hover:border-purple-500/40 text-xs font-mono font-medium items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.15)] shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Google Forms</span>
          </button>
        )}

        {/* Gmail Studio Button */}
        {onOpenGmail && (
          <button
            onClick={onOpenGmail}
            title="Gmail - Send Storyboard Pitches & Wardrobe Continuity"
            className="hidden sm:flex p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[#0e121d] hover:bg-red-950/30 text-red-300 hover:text-red-200 border border-zinc-800 hover:border-red-500/40 text-xs font-mono font-medium items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.15)] shrink-0"
          >
            <Mail className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden md:inline">Gmail</span>
          </button>
        )}

        {/* Settings Gear Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title="API Keys & Environment Settings"
            className="p-1.5 sm:p-2 rounded-lg bg-[#0e121d] hover:bg-[#151c2e] text-zinc-400 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 transition-all cursor-pointer shrink-0"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Google Sign-In & User Account */}
        {currentUser ? (
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1 pl-1.5 rounded-lg bg-[#0e121d] hover:bg-[#141b2c] border border-zinc-800 hover:border-cyan-500/40 text-xs transition-all cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              title={currentUser.email || 'Google Account'}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Google Profile'}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-cyan-500/40"
                />
              ) : (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-[10px] sm:text-[11px] font-bold text-cyan-300 flex items-center justify-center">
                  {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                </div>
              )}
              <span className="hidden xl:inline text-zinc-200 text-xs font-medium max-w-[100px] truncate">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0c101a] border border-cyan-500/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 p-3.5 space-y-3 backdrop-blur-md">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-zinc-850">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Profile'}
                      className="w-9 h-9 rounded-full object-cover border border-cyan-400/50"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-500 text-sm font-bold text-cyan-300 flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {currentUser.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate font-mono">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Google Sign-In Connected
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#060810] border border-zinc-850 text-[10px] text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      <span>Authorized Scopes:</span>
                    </p>
                    <ul className="text-zinc-500 list-disc list-inside">
                      <li>openid (Google ID verification)</li>
                      <li>userinfo.email (Account email)</li>
                      <li>userinfo.profile (Name & avatar)</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-850">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onSignOutGoogle) onSignOutGoogle();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : onSignInGoogle ? (
          <button
            onClick={onSignInGoogle}
            disabled={isAuthLoading}
            title="Sign in with your Google Account"
            className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 font-medium text-xs flex items-center gap-1.5 border border-zinc-300 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
          >
            {isAuthLoading ? (
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-zinc-600" />
            ) : (
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            )}
            <span className="hidden sm:inline font-sans text-xs font-semibold text-zinc-700">
              {isAuthLoading ? 'Connecting...' : 'Sign in'}
            </span>
          </button>
        ) : null}

        {/* Master Export Button */}
        <button
          onClick={onExportClick}
          disabled={sceneCount === 0 || isGenerating}
          className="relative group px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(255,170,0,0.35)] transition-all transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black group-hover:animate-bounce" />
          <span className="hidden sm:inline">Export Master MP4</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>
    </header>
  );
};
