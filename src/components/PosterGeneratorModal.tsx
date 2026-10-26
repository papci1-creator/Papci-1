import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Film,
  Sliders,
  Layers,
  Palette,
  Maximize2,
  Calendar,
  Users,
  Award,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { MoviePosterData, CharacterProfile } from '../types';

interface PosterGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  projectTheme: string; // visual style from StoryStylePanel
  characters?: CharacterProfile[];
  onSetProjectCover?: (posterUrl: string) => void;
}

const THEME_OPTIONS = [
  { id: 'Cyberpunk Neo-Noir', name: 'Cyberpunk Neo-Noir', accent: '#00f0ff', desc: 'Rain-slicked streets, glowing neon, holographic grids' },
  { id: 'Deep Space Sci-Fi', name: 'Deep Space Sci-Fi', accent: '#38bdf8', desc: 'Nebulae, celestial rings, alien monoliths & starships' },
  { id: 'Cinematic Neo-Noir', name: 'Cinematic Neo-Noir', accent: '#f59e0b', desc: 'Venetian blind shadows, trenchcoats, chiaroscuro lighting' },
  { id: 'Epic High Fantasy', name: 'Epic High Fantasy', accent: '#c084fc', desc: 'Towering citadels, auroras, mystical crests & dragons' },
  { id: 'Psychological Thriller', name: 'Psychological Thriller', accent: '#ef4444', desc: 'Blood moon, stark silhouettes, fractured psych-horror' },
  { id: 'Anime Cinema', name: 'Anime Cinema', accent: '#f43f5e', desc: 'Vibrant celestial skies, dynamic speed lines & silhouettes' },
  { id: 'Cinematic Drama', name: 'Cinematic Drama', accent: '#e2e8f0', desc: 'Prestigious festival lighting, sweeping landscape arches' },
];

const LIGHTING_OPTIONS = [
  'Anamorphic Teal & Orange',
  'Neon Noir & Volumetric Rain',
  'Golden Hour Chiaroscuro',
  'Deep Space Monochromatic Blue',
  'Crimson Volumetric Smoke',
  'Moody High-Contrast Studio Spotlight',
];

export const PosterGeneratorModal: React.FC<PosterGeneratorModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  projectTheme,
  characters = [],
  onSetProjectCover,
}) => {
  const [title, setTitle] = useState(projectTitle || 'Untitled Movie');
  const [theme, setTheme] = useState(projectTheme || 'Cyberpunk Neo-Noir');
  const [tagline, setTagline] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'2:3' | '3:4' | '16:9'>('2:3');
  const [lightingStyle, setLightingStyle] = useState('Anamorphic Teal & Orange');
  const [directorCredit, setDirectorCredit] = useState('Directed by Austin Vance');
  const [releaseDate, setReleaseDate] = useState('IN THEATERS & IMAX THIS FALL');
  const [customPrompt, setCustomPrompt] = useState('');

  // Cast names formatted for billing block
  const defaultCast = characters.length > 0
    ? characters.map((c) => c.name).slice(0, 3).join(' • ')
    : 'Elena Vance • Kaelen Cross';
  const [billingCast, setBillingCast] = useState(defaultCast);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingTagline, setIsSuggestingTagline] = useState(false);
  const [suggestedTaglines, setSuggestedTaglines] = useState<string[]>([]);
  const [currentPoster, setCurrentPoster] = useState<MoviePosterData | null>(null);
  const [posterHistory, setPosterHistory] = useState<MoviePosterData[]>([]);
  const [copied, setCopied] = useState(false);
  const [coverSaved, setCoverSaved] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);

  // Sync title & theme when opened or project props change
  useEffect(() => {
    if (isOpen) {
      if (projectTitle && (!title || title === 'Untitled Movie')) {
        setTitle(projectTitle);
      }
      if (projectTheme) {
        // match closest theme option or set directly
        const matched = THEME_OPTIONS.find((t) =>
          projectTheme.toLowerCase().includes(t.id.toLowerCase().split(' ')[0])
        );
        if (matched) setTheme(matched.id);
        else setTheme(projectTheme);
      }
      if (characters.length > 0 && !billingCast) {
        setBillingCast(characters.map((c) => c.name).slice(0, 3).join(' • '));
      }
      // If no poster yet, automatically generate an initial poster
      if (!currentPoster) {
        handleGeneratePoster();
      }
    }
  }, [isOpen, projectTitle, projectTheme]);

  if (!isOpen) return null;

  const handleGeneratePoster = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyTitle: title,
          theme,
          tagline,
          aspectRatio,
          billingCast,
          directorCredit,
          releaseDate,
          lightingStyle,
          prompt: customPrompt || undefined,
        }),
      });

      const data = await response.json();
      if (data.success && data.poster) {
        setCurrentPoster(data.poster);
        if (!tagline && data.poster.tagline) {
          setTagline(data.poster.tagline);
        }
        setPosterHistory((prev) => [data.poster, ...prev.filter((p) => p.id !== data.poster.id)].slice(0, 8));
      }
    } catch (err) {
      console.error('Failed to generate poster:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestTaglines = async () => {
    setIsSuggestingTagline(true);
    try {
      const res = await fetch('/api/poster/suggest-tagline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, theme }),
      });
      const data = await res.json();
      if (data.success && data.taglines) {
        setSuggestedTaglines(data.taglines);
      }
    } catch (e) {
      console.error('Failed to suggest taglines:', e);
    } finally {
      setIsSuggestingTagline(false);
    }
  };

  const handleDownload = () => {
    if (!currentPoster?.imageUrl) return;
    const a = document.createElement('a');
    a.href = currentPoster.imageUrl;
    const cleanFilename = `${(title || 'movie-poster').toLowerCase().replace(/\s+/g, '_')}_poster.svg`;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = () => {
    if (!currentPoster?.imageUrl) return;
    navigator.clipboard.writeText(currentPoster.imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetCover = () => {
    if (!currentPoster?.imageUrl) return;
    if (onSetProjectCover) {
      onSetProjectCover(currentPoster.imageUrl);
    }
    setCoverSaved(true);
    setTimeout(() => setCoverSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0e17] border border-cyan-500/30 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-[#080b12] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-amber-500 p-[1px] shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <div className="w-full h-full bg-[#090d16] rounded-[11px] flex items-center justify-center">
                <Film className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-sans tracking-wide">
                  Cinematic Movie Poster Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  AI One-Sheet Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Conditioned on <span className="text-cyan-300 font-mono">storyTitle</span> and project theme with theatrical billing typography
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split 2-Column Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Poster Live Preview Stage */}
          <div className="lg:w-[50%] p-4 sm:p-6 bg-[#06080e] flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-zinc-850 overflow-y-auto">
            <div className="w-full max-w-md flex flex-col items-center">
              {/* Poster Container */}
              <div className="relative group w-full flex items-center justify-center">
                <div
                  className={`relative rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.9)] border border-cyan-500/30 transition-all duration-300 bg-[#030408] ${
                    aspectRatio === '2:3'
                      ? 'w-[280px] sm:w-[320px] aspect-[2/3]'
                      : aspectRatio === '3:4'
                      ? 'w-[280px] sm:w-[330px] aspect-[3/4]'
                      : 'w-full max-w-[440px] aspect-[16/9]'
                  }`}
                >
                  {currentPoster?.imageUrl ? (
                    <img
                      src={currentPoster.imageUrl}
                      alt={currentPoster.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain select-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                      <Film className="w-12 h-12 text-zinc-600 mb-3 animate-pulse" />
                      <p className="text-xs font-mono">Ready to render cinematic key art</p>
                    </div>
                  )}

                  {/* Loading Scanner Overlay */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20">
                      <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mb-4" />
                      <p className="text-xs font-mono text-cyan-300 font-bold tracking-wider animate-pulse">
                        SYNTHESIZING THEATRICAL KEY ART...
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1 text-center font-mono">
                        Imagen 3 composition // Typography layout // Festival slate
                      </p>
                    </div>
                  )}

                  {/* Corner Watermark Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-zinc-300 pointer-events-none">
                    {aspectRatio} • {currentPoster?.model || 'Imagen 3'}
                  </div>
                </div>
              </div>

              {/* Action Toolbar Below Preview */}
              <div className="w-full mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDownload}
                    disabled={!currentPoster}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 disabled:opacity-50 text-xs font-mono text-zinc-200 hover:text-white flex items-center gap-1.5 border border-zinc-700/80 transition-colors cursor-pointer"
                    title="Download Poster SVG"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    disabled={!currentPoster}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 disabled:opacity-50 text-xs font-mono text-zinc-200 hover:text-white flex items-center gap-1.5 border border-zinc-700/80 transition-colors cursor-pointer"
                    title="Copy Image URL / Data"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleSetCover}
                    disabled={!currentPoster}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 disabled:opacity-50 text-xs font-mono text-amber-300 hover:text-amber-200 flex items-center gap-1.5 border border-zinc-700/80 transition-colors cursor-pointer"
                    title="Set as Project Cover"
                  >
                    {coverSaved ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Award className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{coverSaved ? 'Cover Set!' : 'Set Cover'}</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-zinc-400">
                  {currentPoster ? '8K Vector Ready' : ''}
                </div>
              </div>

              {/* History Thumbnails Strip */}
              {posterHistory.length > 1 && (
                <div className="w-full mt-4 pt-3 border-t border-zinc-800/80">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-2">
                    Recent Poster Iterations ({posterHistory.length})
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {posterHistory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCurrentPoster(item)}
                        className={`relative rounded-md overflow-hidden border transition-all cursor-pointer flex-shrink-0 ${
                          currentPoster?.id === item.id
                            ? 'border-cyan-400 ring-2 ring-cyan-500/40'
                            : 'border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                        }`}
                        style={{ width: '48px', height: '64px' }}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Studio Controls Panel */}
          <div className="lg:w-[50%] p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#090d16]">
            {/* 1. Story Title & Theme Conditioning */}
            <div className="space-y-3">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                1. Project Title & Visual Theme
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Movie / Story Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e1322] border border-zinc-800 focus:border-cyan-500 text-xs text-white focus:outline-none"
                    placeholder="Enter movie title..."
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Project Genre & Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e1322] border border-zinc-800 focus:border-cyan-500 text-xs text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    {THEME_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Theme Quick Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                      theme === opt.id
                        ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                        : 'bg-[#0f1422] text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
                    }`}
                  >
                    {opt.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tagline with AI Suggester */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  2. Theatrical Tagline
                </label>
                <button
                  onClick={handleSuggestTaglines}
                  disabled={isSuggestingTagline}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSuggestingTagline ? 'animate-spin' : ''}`} />
                  <span>AI Suggestions</span>
                </button>
              </div>

              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. In a city of neon ghosts, truth is the rarest currency."
                className="w-full px-3 py-2 rounded-lg bg-[#0e1322] border border-zinc-800 focus:border-cyan-500 text-xs text-white focus:outline-none"
              />

              {/* Suggested Tagline Chips */}
              {suggestedTaglines.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-zinc-400 font-mono">Click to apply suggested tagline:</span>
                  <div className="space-y-1">
                    {suggestedTaglines.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTagline(t)}
                        className="w-full text-left p-1.5 rounded bg-[#101626] hover:bg-cyan-950/40 text-[11px] text-zinc-300 hover:text-cyan-200 border border-zinc-800 hover:border-cyan-500/40 transition-colors cursor-pointer truncate"
                      >
                        "{t}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Aspect Ratio & Lighting Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
              <div>
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                  Poster Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '2:3', label: '2:3', sub: 'One-Sheet' },
                    { id: '3:4', label: '3:4', sub: 'Teaser' },
                    { id: '16:9', label: '16:9', sub: 'Billboard' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setAspectRatio(r.id as any)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        aspectRatio === r.id
                          ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'bg-[#0e1322] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{r.label}</div>
                      <div className="text-[9px] text-zinc-400">{r.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                  Lighting & Aura
                </label>
                <select
                  value={lightingStyle}
                  onChange={(e) => setLightingStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0e1322] border border-zinc-800 focus:border-cyan-500 text-xs text-zinc-200 focus:outline-none cursor-pointer"
                >
                  {LIGHTING_OPTIONS.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Billing Block Credits */}
            <div className="space-y-3 pt-2 border-t border-zinc-800/80">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                4. Theatrical Billing Block Credits
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Starring Cast</label>
                  <input
                    type="text"
                    value={billingCast}
                    onChange={(e) => setBillingCast(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0e1322] border border-zinc-800 focus:border-cyan-500 text-xs text-white focus:outline-none font-mono"
                    placeholder="Actor names..."
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Director Credit</label>
                  <input
                    type="text"
                    value={directorCredit}
                    onChange={(e) => setDirectorCredit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0e1322] border border-zinc-800 focus:border-cyan-500 text-xs text-white focus:outline-none font-mono"
                    placeholder="Director..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Release Footer Slate</label>
                <input
                  type="text"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0e1322] border border-zinc-800 focus:border-cyan-500 text-xs text-white focus:outline-none font-mono"
                  placeholder="IN THEATERS THIS FALL..."
                />
              </div>
            </div>

            {/* 5. Custom AI Art Direction Prompt */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>Custom Key Art Direction (Optional)</span>
                <span className="text-[10px] text-zinc-400 font-normal">Overlays & Lighting</span>
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={2}
                placeholder="Custom scene notes (e.g. Glowing neon monolith hovering over obsidian skyscrapers with rain reflections and volumetric fog)..."
                className="w-full px-3 py-2 rounded-lg bg-[#0e1322] border border-zinc-800 focus:border-cyan-500 text-xs text-white focus:outline-none resize-none font-mono"
              />
            </div>

            {/* Master CTA Button */}
            <div className="pt-3">
              <button
                onClick={handleGeneratePoster}
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Rendering Theatrical Poster...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Generate Cinematic Movie Poster</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
