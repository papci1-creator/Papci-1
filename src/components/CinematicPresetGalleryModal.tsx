import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Film,
  Sparkles,
  Check,
  Copy,
  RotateCcw,
  Sliders,
  Eye,
  Layers,
  Aperture,
} from 'lucide-react';
import { Scene, CinematicGradePreset, CinematicGradePresetId } from '../types';
import { CINEMATIC_GRADE_PRESETS } from '../data/presets';

interface CinematicPresetGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  currentSceneIndex: number;
  initialSceneId?: string;
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onBulkUpdateScenes?: (ids: string[], updates: Partial<Scene>) => void;
  onSelectScene?: (sceneId: string) => void;
}

type CategoryFilter = 'All' | 'Classic Film' | 'Modern Cinema' | 'Stylized & Retro';

export const CinematicPresetGalleryModal: React.FC<CinematicPresetGalleryModalProps> = ({
  isOpen,
  onClose,
  scenes,
  currentSceneIndex,
  initialSceneId,
  onUpdateScene,
  onBulkUpdateScenes,
  onSelectScene,
}) => {
  const defaultScene =
    scenes.find((s) => s.id === initialSceneId) || scenes[currentSceneIndex] || scenes[0];

  const [selectedSceneId, setSelectedSceneId] = useState<string>(defaultScene?.id || '');
  const activeScene = scenes.find((s) => s.id === selectedSceneId) || defaultScene;

  const [selectedPresetId, setSelectedPresetId] = useState<CinematicGradePresetId>(
    activeScene?.colorGradePreset || 'Noir'
  );
  const [gradeIntensity, setGradeIntensity] = useState<number>(
    activeScene?.colorGradeIntensity ?? 100
  );
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [splitPosition, setSplitPosition] = useState<number>(72); // % split for Before/After comparison
  const [syncMetadataVfx, setSyncMetadataVfx] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSceneId) {
      setSelectedSceneId(initialSceneId);
    } else if (scenes[currentSceneIndex]?.id) {
      setSelectedSceneId(scenes[currentSceneIndex].id);
    }
  }, [initialSceneId, currentSceneIndex, isOpen]);

  useEffect(() => {
    if (activeScene) {
      setSelectedPresetId(activeScene.colorGradePreset || 'None');
      setGradeIntensity(activeScene.colorGradeIntensity ?? 100);
    }
  }, [activeScene?.id]);

  if (!isOpen || !activeScene) return null;

  const activePreset =
    CINEMATIC_GRADE_PRESETS.find((p) => p.id === selectedPresetId) || CINEMATIC_GRADE_PRESETS[0];

  const filteredPresets =
    categoryFilter === 'All'
      ? CINEMATIC_GRADE_PRESETS
      : CINEMATIC_GRADE_PRESETS.filter((p) => p.category === categoryFilter);

  const buildFilterCss = (preset: CinematicGradePreset, intensityPct: number) => {
    const t = intensityPct / 100;
    const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
    const c = lerp(105, preset.contrast);
    const s = lerp(110, preset.saturation);
    const sep = lerp(0, preset.sepia);
    const hue = lerp(0, preset.hueRotate);
    const bright = Math.round(100 + ((lerp(35, preset.bloomIntensity) - 35) * 0.16));
    return `contrast(${c}%) saturate(${s}%) sepia(${sep}%) hue-rotate(${hue}deg) brightness(${bright}%)`;
  };

  const buildSceneGradeUpdates = (
    sceneTarget: Scene,
    preset: CinematicGradePreset,
    intensity: number
  ): Partial<Scene> => {
    const t = intensity / 100;
    const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);

    const existingMeta = sceneTarget.metadata || {
      shootingDate: new Date().toISOString().split('T')[0],
      lensFocalLength: '35mm Anamorphic',
      cameraAperture: 'T1.5',
      showOverlay: true,
    };

    return {
      colorGradePreset: preset.id,
      colorGradeIntensity: intensity,
      ...(syncMetadataVfx
        ? {
            metadata: {
              ...existingMeta,
              filter: preset.id === 'None' ? 'ND 0.9 Standard' : `${preset.name} LUT (${intensity}%)`,
              contrast: lerp(105, preset.contrast),
              saturation: lerp(110, preset.saturation),
              sepia: lerp(0, preset.sepia),
              hueRotate: lerp(0, preset.hueRotate),
              bloomIntensity: lerp(35, preset.bloomIntensity),
              filmGrain: lerp(20, preset.filmGrain),
              chromaticAberration: lerp(15, preset.chromaticAberration),
              vignetteIntensity: lerp(45, preset.vignetteIntensity),
              colorTint: preset.tintOverlay,
            },
          }
        : {}),
    };
  };

  const handleSelectAndApplyPreset = (preset: CinematicGradePreset, customIntensity?: number) => {
    const nextIntensity = customIntensity !== undefined ? customIntensity : gradeIntensity;
    setSelectedPresetId(preset.id);
    const updates = buildSceneGradeUpdates(activeScene, preset, nextIntensity);
    onUpdateScene(activeScene.id, updates);
    setStatusMessage(
      preset.id === 'None'
        ? `Reset Scene #${activeScene.sceneNumber} to Neutral Rec.709`
        : `Applied "${preset.name}" (${nextIntensity}%) to Scene #${activeScene.sceneNumber}`
    );
    setTimeout(() => setStatusMessage(null), 2400);
  };

  const handleIntensityChange = (val: number) => {
    setGradeIntensity(val);
    const updates = buildSceneGradeUpdates(activeScene, activePreset, val);
    onUpdateScene(activeScene.id, updates);
  };

  const handleApplyToAllScenes = () => {
    scenes.forEach((s) => {
      const updates = buildSceneGradeUpdates(s, activePreset, gradeIntensity);
      onUpdateScene(s.id, updates);
    });
    setStatusMessage(
      `Applied "${activePreset.name}" (${gradeIntensity}%) across all ${scenes.length} scenes`
    );
    setTimeout(() => setStatusMessage(null), 2600);
  };

  const handleResetAllScenes = () => {
    const neutral = CINEMATIC_GRADE_PRESETS[0];
    setSelectedPresetId('None');
    setGradeIntensity(100);
    if (onBulkUpdateScenes) {
      onBulkUpdateScenes(
        scenes.map((s) => s.id),
        { colorGradePreset: 'None', colorGradeIntensity: 100 }
      );
    } else {
      scenes.forEach((s) => {
        onUpdateScene(s.id, { colorGradePreset: 'None', colorGradeIntensity: 100 });
      });
    }
    setStatusMessage('Reset color grading across all scenes to Neutral Rec.709');
    setTimeout(() => setStatusMessage(null), 2400);
  };

  const previewBgStyle = activeScene.backgroundImage
    ? { backgroundImage: `url(${activeScene.backgroundImage})` }
    : {
        backgroundImage:
          'radial-gradient(circle at 30% 35%, rgba(0, 240, 255, 0.55), rgba(255, 0, 128, 0.32) 45%, rgba(8, 10, 22, 0.98) 85%)',
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#080b14] border border-fuchsia-500/35 rounded-2xl w-full max-w-6xl max-h-[93vh] flex flex-col shadow-[0_0_60px_rgba(217,70,239,0.18)] overflow-hidden font-sans">
        {/* Top Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/90 bg-[#0c101d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 via-amber-500 to-cyan-500 p-[1px] shadow-[0_0_18px_rgba(217,70,239,0.35)]">
              <div className="w-full h-full bg-[#090c16] rounded-[11px] flex items-center justify-center">
                <Palette className="w-5 h-5 text-fuchsia-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wide">
                  Cinematic Preset Gallery
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/35 font-bold">
                  3D LUT & Photochemical Color Grading
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Apply theatrical color grading filters (Silver Halide Noir, Three-Strip Technicolor, Retro 80s, Bleach Bypass Desaturated) to any scene or the entire master reel.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Close Gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Scene Switcher Strip */}
        <div className="px-6 py-2.5 bg-[#060810] border-b border-zinc-800/80 flex items-center justify-between gap-3 overflow-x-auto scrollbar-thin shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
              <Film className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Target Clip:</span>
            </span>
            {scenes.map((s, idx) => {
              const isSelected = s.id === activeScene.id;
              const scenePreset =
                s.colorGradePreset && s.colorGradePreset !== 'None'
                  ? CINEMATIC_GRADE_PRESETS.find((p) => p.id === s.colorGradePreset)
                  : null;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSceneId(s.id);
                    if (onSelectScene) onSelectScene(s.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/60 shadow-[0_0_12px_rgba(217,70,239,0.25)]'
                      : 'bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="font-bold">Scene #{idx + 1}</span>
                  <span className="text-[10px] opacity-75 truncate max-w-[95px]">{s.title}</span>
                  {scenePreset && (
                    <span
                      className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border"
                      style={{
                        backgroundColor: `${scenePreset.accentColor}20`,
                        color: scenePreset.accentColor,
                        borderColor: `${scenePreset.accentColor}50`,
                      }}
                    >
                      {scenePreset.id}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-mono shrink-0 cursor-pointer bg-cyan-950/30 px-2.5 py-1 rounded-lg border border-cyan-500/30">
            <input
              type="checkbox"
              checked={syncMetadataVfx}
              onChange={(e) => setSyncMetadataVfx(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-cyan-400 focus:ring-0 cursor-pointer"
            />
            <span>Sync LUT to Optical VFX Sliders</span>
          </label>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {/* Top Section: Interactive Before / After Split-Screen Color Grading Monitor + Intensity Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-[#0b0f1c] p-4 rounded-2xl border border-zinc-800/90 shadow-inner">
            {/* Left 7 Cols: Interactive Before/After Split Monitor */}
            <div className="lg:col-span-7 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono uppercase text-[11px] text-fuchsia-300 font-bold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>
                    Interactive Split-Wipe Monitor — Scene #{activeScene.sceneNumber}: {activeScene.title}
                  </span>
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Drag Split Wipe: <strong className="text-white">{splitPosition}%</strong>
                </span>
              </div>

              <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden border border-zinc-700/80 bg-[#05070e] select-none shadow-2xl">
                {/* Base Layer: RAW Ungraded Rec.709 (Right side visible beyond split) */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={previewBgStyle}
                />

                {/* Graded Layer: Clipped to left `splitPosition%` */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-100"
                    style={{
                      ...previewBgStyle,
                      filter: buildFilterCss(activePreset, gradeIntensity),
                    }}
                  />
                  {/* Tint & Split-Tone Wash */}
                  {activePreset.id !== 'None' && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(to bottom, ${
                          activePreset.highlightTint || 'transparent'
                        }, ${activePreset.tintOverlay || 'transparent'} 50%, ${
                          activePreset.shadowTint || 'transparent'
                        })`,
                        opacity: gradeIntensity / 100,
                      }}
                    />
                  )}
                  {/* Bloom Halation Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.42), rgba(0,240,255,0.18) 45%, transparent 75%)',
                      mixBlendMode: 'screen',
                      opacity:
                        ((activePreset.bloomIntensity / 100) * (gradeIntensity / 100)) * 0.8,
                    }}
                  />
                  {/* Film Grain Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage:
                        'repeating-radial-gradient(circle at 22% 38%, rgba(255,255,255,0.24) 0, rgba(0,0,0,0.3) 1px, transparent 2px)',
                      opacity: ((activePreset.filmGrain / 100) * (gradeIntensity / 100)) * 0.75,
                    }}
                  />
                  {/* Vignette Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, transparent ${Math.max(
                        18,
                        58 - activePreset.vignetteIntensity * 0.35
                      )}%, rgba(0,0,0,${Math.min(
                        0.95,
                        (activePreset.vignetteIntensity / 100) * (gradeIntensity / 100) * 1.15
                      )}) 100%)`,
                    }}
                  />
                </div>

                {/* Vertical Split Wipe Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] z-20 pointer-events-none"
                  style={{ left: `${splitPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-extrabold shadow-lg">
                    ⇄
                  </div>
                </div>

                {/* Overlay Interactive Range Input for dragging split line */}
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={splitPosition}
                  onChange={(e) => setSplitPosition(parseInt(e.target.value, 10))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                  title="Drag left or right to compare Graded LUT vs Original Rec.709"
                />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-fuchsia-500/50 text-[10px] font-mono font-bold text-fuchsia-300">
                  GRADED: {activePreset.name.toUpperCase()} ({gradeIntensity}%)
                </div>
                <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-zinc-700 text-[10px] font-mono text-zinc-300">
                  ORIGINAL REC.709
                </div>

                {/* Bottom Film Stock & Telemetry Bar */}
                <div className="absolute bottom-3 left-3 right-3 z-10 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-800/90 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-300">
                  <span className="text-amber-300 font-semibold">
                    STOCK: {activePreset.filmStockRef}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>CONT: {activePreset.contrast}%</span>
                    <span>SAT: {activePreset.saturation}%</span>
                    <span>GRAIN: {activePreset.filmGrain}%</span>
                    <span>BLOOM: {activePreset.bloomIntensity}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Active LUT Inspector & Blend Intensity Controls */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#080b14] p-4 rounded-xl border border-zinc-800/90 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 font-bold">
                    {activePreset.category}
                  </span>
                  <div className="flex items-center gap-1">
                    {activePreset.swatchColors.map((hex, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: hex }}
                        title={`LUT Palette Tone ${i + 1}: ${hex}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    {activePreset.name}
                  </h3>
                  <p className="text-xs font-mono text-amber-300/90">{activePreset.subtitle}</p>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    {activePreset.description}
                  </p>
                </div>

                {/* Color Grade Intensity Slider */}
                <div className="pt-2 space-y-1.5 bg-[#0d1221] p-3 rounded-xl border border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>LUT Filter Blend Intensity</span>
                    </span>
                    <span className="font-mono text-fuchsia-300 font-extrabold text-xs">
                      {gradeIntensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={gradeIntensity}
                    onChange={(e) => handleIntensityChange(parseInt(e.target.value, 10))}
                    className="w-full accent-fuchsia-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>0% Bypassed</span>
                    <span>50% Subtle Wash</span>
                    <span>100% Full Theatrical LUT</span>
                  </div>
                </div>

                {/* Telemetry Pills */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[10px]">
                  <div className="bg-[#0c101d] p-2 rounded-lg border border-zinc-800/80">
                    <div className="text-zinc-500">CONTRAST</div>
                    <div className="text-cyan-300 font-bold text-xs mt-0.5">
                      {activePreset.contrast}%
                    </div>
                  </div>
                  <div className="bg-[#0c101d] p-2 rounded-lg border border-zinc-800/80">
                    <div className="text-zinc-500">SATURATION</div>
                    <div className="text-fuchsia-300 font-bold text-xs mt-0.5">
                      {activePreset.saturation}%
                    </div>
                  </div>
                  <div className="bg-[#0c101d] p-2 rounded-lg border border-zinc-800/80">
                    <div className="text-zinc-500">35MM GRAIN</div>
                    <div className="text-amber-300 font-bold text-xs mt-0.5">
                      {activePreset.filmGrain}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons inside Inspector */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectAndApplyPreset(activePreset)}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-400 hover:to-cyan-400 text-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-fuchsia-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply to Scene #{activeScene.sceneNumber}</span>
                </button>
                <button
                  type="button"
                  onClick={handleApplyToAllScenes}
                  className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl text-xs font-bold bg-[#14192b] hover:bg-[#1b223a] text-zinc-200 border border-zinc-700 hover:border-fuchsia-500/50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Apply this color grade filter across all scenes in the storyboard"
                >
                  <Copy className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>All {scenes.length} Scenes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Color Grade Catalog:</span>
              </span>
              {(['All', 'Classic Film', 'Modern Cinema', 'Stylized & Retro'] as CategoryFilter[]).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      categoryFilter === cat
                        ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/50 shadow-sm'
                        : 'bg-[#0d111e] text-zinc-400 hover:text-zinc-200 border-zinc-800'
                    }`}
                  >
                    {cat === 'All' ? `All Looks (${CINEMATIC_GRADE_PRESETS.length})` : cat}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={handleResetAllScenes}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset All Scenes to Rec.709</span>
            </button>
          </div>

          {/* Preset Gallery Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {filteredPresets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              const isAppliedOnCurrent = (activeScene.colorGradePreset || 'None') === preset.id;

              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectAndApplyPreset(preset)}
                  className={`group rounded-xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between bg-[#0b0e19] ${
                    isSelected
                      ? 'border-fuchsia-400 ring-2 ring-fuchsia-500/30 shadow-[0_0_25px_rgba(217,70,239,0.25)]'
                      : 'border-zinc-800/90 hover:border-zinc-600'
                  }`}
                >
                  {/* Visual Swatch Thumbnail with Live CSS Filter */}
                  <div className="relative h-28 w-full overflow-hidden bg-[#05070d]">
                    <div
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{
                        ...previewBgStyle,
                        filter: buildFilterCss(preset, 100),
                      }}
                    />
                    {preset.id !== 'None' && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `linear-gradient(to bottom, ${
                            preset.highlightTint || 'transparent'
                          }, ${preset.tintOverlay || 'transparent'} 50%, ${
                            preset.shadowTint || 'transparent'
                          })`,
                        }}
                      />
                    )}
                    {/* Vignette on card */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle at center, transparent 45%, rgba(0,0,0,0.75) 100%)',
                      }}
                    />

                    {/* Top Card Badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-black/80 backdrop-blur-sm border"
                        style={{
                          color: preset.accentColor,
                          borderColor: `${preset.accentColor}55`,
                        }}
                      >
                        {preset.id === 'None' ? 'REC.709' : preset.id}
                      </span>

                      {isAppliedOnCurrent && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-mono font-extrabold flex items-center gap-0.5 shadow">
                          <Check className="w-2.5 h-2.5" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>

                    {/* Swatch Palette Dots */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10 bg-black/65 px-1.5 py-1 rounded-full">
                      {preset.swatchColors.map((hex, idx) => (
                        <span
                          key={idx}
                          className="w-2.5 h-2.5 rounded-full border border-white/30"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Card Info Body */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="text-xs font-extrabold text-white group-hover:text-fuchsia-300 transition-colors">
                        {preset.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 truncate">
                        {preset.subtitle}
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-snug">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                      <span>CONT {preset.contrast}%</span>
                      <span>SAT {preset.saturation}%</span>
                      <span>GRAIN {preset.filmGrain}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0c101d] border-t border-zinc-800/90 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {statusMessage ? (
              <span className="text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-500/40 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{statusMessage}</span>
              </span>
            ) : (
              <span className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>
                  Click any preset card to immediately grade Scene #{activeScene.sceneNumber} on the live canvas.
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleApplyToAllScenes}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#14192b] hover:bg-[#1c233c] text-zinc-200 border border-zinc-700 hover:border-fuchsia-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Apply "{activePreset.name}" to All {scenes.length} Scenes</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-fuchsia-500 hover:bg-fuchsia-400 text-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-fuchsia-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
