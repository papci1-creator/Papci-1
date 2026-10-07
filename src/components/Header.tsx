import React from 'react';
import { Film, Sparkles, Download, Volume2, Clapperboard, Layers, Music, Settings, FileText, Mail } from 'lucide-react';
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
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 border-b border-cyan-950/40 bg-[#080a0f]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 via-cyan-600 to-amber-500 p-[1px] shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <div className="w-full h-full bg-[#090b12] rounded-[7px] flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-white uppercase font-sans">
                StoryCast
              </span>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500/20 to-amber-500/20 text-cyan-300 border border-cyan-500/30">
                AI Pro
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Engine v3.4 Ready
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
      <div className="flex items-center gap-3">
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

        {/* Google Forms Integration Button */}
        {onOpenGoogleForms && (
          <button
            onClick={onOpenGoogleForms}
            title="Google Forms - Audience Screening & Feedback"
            className="px-3 py-1.5 rounded-lg bg-[#0e121d] hover:bg-purple-950/30 text-purple-300 hover:text-purple-200 border border-zinc-800 hover:border-purple-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.15)]"
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
            className="px-3 py-1.5 rounded-lg bg-[#0e121d] hover:bg-red-950/30 text-red-300 hover:text-red-200 border border-zinc-800 hover:border-red-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.15)]"
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
            className="p-2 rounded-lg bg-[#0e121d] hover:bg-[#151c2e] text-zinc-400 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Master Export Button */}
        <button
          onClick={onExportClick}
          disabled={sceneCount === 0 || isGenerating}
          className="relative group px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,170,0,0.35)] transition-all transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Download className="w-4 h-4 text-black group-hover:animate-bounce" />
          <span>Export Master MP4</span>
        </button>
      </div>
    </header>
  );
};
