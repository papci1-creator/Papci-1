import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Calendar,
  Aperture,
  Sliders,
  Film,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Info,
  Layers,
  ChevronRight,
  Clock,
  Compass,
} from 'lucide-react';
import { Scene, SceneMetadata } from '../types';

interface SceneMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  scenes: Scene[];
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onBulkUpdateScenes?: (ids: string[], updates: Partial<Scene>) => void;
  onSelectScene?: (sceneId: string) => void;
}

const DEFAULT_METADATA: SceneMetadata = {
  shootingDate: new Date().toISOString().split('T')[0],
  lensFocalLength: '35mm Anamorphic',
  cameraAperture: 'T1.5',
  shutterSpeed: '1/48s (180°)',
  iso: 'ISO 800',
  cameraModel: 'ARRI Alexa 35',
  whiteBalance: '5600K',
  filter: 'ND 0.9 + 1/4 Black Pro-Mist',
  location: 'Stage B - Neo-Tokyo Catwalks',
  takeNumber: 1,
  rollNumber: 'A001',
  notes: 'Volumetric cyan/amber backlight, shallow depth of field',
  showOverlay: true,
  bloomIntensity: 35,
  filmGrain: 20,
  contrast: 105,
  saturation: 110,
  chromaticAberration: 15,
  vignetteIntensity: 45,
};

const VFX_PRESETS = [
  {
    name: '35mm Kodak 5219',
    bloomIntensity: 30,
    filmGrain: 42,
    contrast: 112,
    saturation: 108,
    chromaticAberration: 10,
    vignetteIntensity: 48,
  },
  {
    name: 'Heavy Neon Halation',
    bloomIntensity: 82,
    filmGrain: 18,
    contrast: 118,
    saturation: 138,
    chromaticAberration: 38,
    vignetteIntensity: 55,
  },
  {
    name: 'Bleach Bypass Grit',
    bloomIntensity: 15,
    filmGrain: 68,
    contrast: 136,
    saturation: 45,
    chromaticAberration: 22,
    vignetteIntensity: 72,
  },
  {
    name: 'Clean IMAX Digital',
    bloomIntensity: 20,
    filmGrain: 4,
    contrast: 104,
    saturation: 105,
    chromaticAberration: 0,
    vignetteIntensity: 20,
  },
  {
    name: 'Cyber VHS Glitch',
    bloomIntensity: 64,
    filmGrain: 55,
    contrast: 122,
    saturation: 145,
    chromaticAberration: 85,
    vignetteIntensity: 60,
  },
];

const LENS_PRESETS = [
  '18mm Ultra-Wide',
  '24mm Wide Anamorphic',
  '35mm Anamorphic',
  '50mm High-Speed Prime',
  '85mm Portrait Prime',
  '105mm Macro Close-Up',
  '135mm Telephoto',
];

const APERTURE_PRESETS = [
  'T1.3',
  'T1.5',
  'T2.0',
  'f/1.8',
  'f/2.8',
  'f/4.0',
  'f/5.6',
  'f/8.0',
];

const CAMERA_PRESETS = [
  'ARRI Alexa 35',
  'ARRI Alexa Mini LF',
  'RED V-Raptor 8K',
  'Sony Venice 2',
  'Blackmagic URSA 12K',
  'IMAX 65mm Cine',
];

const ISO_PRESETS = ['ISO 200', 'ISO 400', 'ISO 800', 'ISO 1600', 'ISO 3200', 'ISO 6400'];

const SHUTTER_PRESETS = ['1/48s (180°)', '1/96s (90°)', '1/120s', '1/24s (360°)'];

const QUICK_LOOK_PACKS = [
  {
    name: 'Cyberpunk Neon Anamorphic',
    lens: '35mm Anamorphic',
    aperture: 'T1.5',
    iso: 'ISO 1600',
    camera: 'ARRI Alexa 35',
    shutter: '1/48s (180°)',
    filter: '1/4 Black Pro-Mist',
    wb: '5600K',
  },
  {
    name: 'Intimate Character Portrait',
    lens: '85mm Portrait Prime',
    aperture: 'T1.3',
    iso: 'ISO 800',
    camera: 'Sony Venice 2',
    shutter: '1/48s (180°)',
    filter: 'Warm Bronze 1/8',
    wb: '4300K',
  },
  {
    name: 'High-Speed Action Drone',
    lens: '18mm Ultra-Wide',
    aperture: 'f/2.8',
    iso: 'ISO 400',
    camera: 'RED V-Raptor 8K',
    shutter: '1/96s (90°)',
    filter: 'ND 1.2 Polarizer',
    wb: '5600K',
  },
  {
    name: 'Noir Low-Key Drama',
    lens: '50mm High-Speed Prime',
    aperture: 'T2.0',
    iso: 'ISO 800',
    camera: 'Blackmagic URSA 12K',
    shutter: '1/48s (180°)',
    filter: 'Circular Polarizer',
    wb: '3200K',
  },
];

export const SceneMetadataModal: React.FC<SceneMetadataModalProps> = ({
  isOpen,
  onClose,
  scene,
  scenes,
  onUpdateScene,
  onBulkUpdateScenes,
  onSelectScene,
}) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(scene?.id || scenes[0]?.id || '');
  const activeScene = scenes.find((s) => s.id === selectedSceneId) || scene || scenes[0];

  const [formData, setFormData] = useState<SceneMetadata>(() => {
    return activeScene?.metadata || {
      ...DEFAULT_METADATA,
      location: activeScene?.sceneLocation || DEFAULT_METADATA.location,
    };
  });

  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);
  const [liveSyncToPlayer, setLiveSyncToPlayer] = useState<boolean>(true);

  // Sync form when active scene changes
  useEffect(() => {
    if (activeScene) {
      setFormData({
        ...DEFAULT_METADATA,
        location: activeScene.sceneLocation || DEFAULT_METADATA.location,
        ...(activeScene.metadata || {}),
      });
    }
  }, [activeScene?.id]);

  useEffect(() => {
    if (scene && scene.id !== selectedSceneId) {
      setSelectedSceneId(scene.id);
    }
  }, [scene?.id]);

  if (!isOpen || !activeScene) return null;

  const handleChange = (field: keyof SceneMetadata, value: any) => {
    const nextMeta = { ...formData, [field]: value };
    setFormData(nextMeta);
    if (liveSyncToPlayer) {
      onUpdateScene(activeScene.id, { metadata: nextMeta });
    }
  };

  const handleApplyVfxPreset = (preset: (typeof VFX_PRESETS)[0]) => {
    const nextMeta: SceneMetadata = {
      ...formData,
      bloomIntensity: preset.bloomIntensity,
      filmGrain: preset.filmGrain,
      contrast: preset.contrast,
      saturation: preset.saturation,
      chromaticAberration: preset.chromaticAberration,
      vignetteIntensity: preset.vignetteIntensity,
    };
    setFormData(nextMeta);
    if (liveSyncToPlayer) {
      onUpdateScene(activeScene.id, { metadata: nextMeta });
    }
    setAppliedNotification(`Applied "${preset.name}" VFX profile to Scene #${activeScene.sceneNumber}`);
    setTimeout(() => setAppliedNotification(null), 2200);
  };

  const handleResetVfxSliders = () => {
    const nextMeta: SceneMetadata = {
      ...formData,
      bloomIntensity: 35,
      filmGrain: 20,
      contrast: 105,
      saturation: 110,
      chromaticAberration: 15,
      vignetteIntensity: 45,
    };
    setFormData(nextMeta);
    if (liveSyncToPlayer) {
      onUpdateScene(activeScene.id, { metadata: nextMeta });
    }
  };

  const handleSaveCurrent = () => {
    onUpdateScene(activeScene.id, {
      metadata: formData,
    });
    setAppliedNotification(`Saved metadata & VFX intensities to Scene #${activeScene.sceneNumber}`);
    setTimeout(() => setAppliedNotification(null), 2500);
  };

  const handleApplyToAllScenes = () => {
    if (onBulkUpdateScenes) {
      onBulkUpdateScenes(scenes.map((s) => s.id), { metadata: { ...formData } });
    } else {
      scenes.forEach((s) => {
        onUpdateScene(s.id, { metadata: { ...formData } });
      });
    }
    setAppliedNotification(`Applied metadata & VFX sliders across all ${scenes.length} scenes`);
    setTimeout(() => setAppliedNotification(null), 2500);
  };

  const handleApplyQuickPack = (pack: typeof QUICK_LOOK_PACKS[0]) => {
    const nextMeta: SceneMetadata = {
      ...formData,
      lensFocalLength: pack.lens,
      cameraAperture: pack.aperture,
      iso: pack.iso,
      cameraModel: pack.camera,
      shutterSpeed: pack.shutter,
      filter: pack.filter,
      whiteBalance: pack.wb,
    };
    setFormData(nextMeta);
    if (liveSyncToPlayer) {
      onUpdateScene(activeScene.id, { metadata: nextMeta });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#090b14] border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Top Header Bar */}
        <div className="px-5 py-4 border-b border-zinc-800/80 bg-[#0d101d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <span>Scene Production Metadata Slate</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                    Camera & Optical Rig
                  </span>
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Attach professional camera lens, focal length, aperture, and shooting date specs to display as a cinematic HUD overlay on the video player.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scene Switcher Selector Tabs */}
        <div className="px-5 py-2.5 bg-[#070910] border-b border-zinc-800/70 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Scene:</span>
          </span>
          {scenes.map((s, idx) => {
            const isSelected = s.id === activeScene.id;
            const hasMeta = !!s.metadata?.lensFocalLength;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSceneId(s.id);
                  if (onSelectScene) onSelectScene(s.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="font-bold">Scene #{idx + 1}</span>
                <span className="text-[10px] opacity-70 truncate max-w-[90px]">{s.title}</span>
                {hasMeta && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Has attached metadata" />}
              </button>
            );
          })}
        </div>

        {/* Quick Style / Rig Preset Profiles */}
        <div className="px-5 py-2 bg-[#0c0f1c] border-b border-zinc-800/60 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Optical Presets:</span>
          </span>
          {QUICK_LOOK_PACKS.map((pack) => (
            <button
              key={pack.name}
              onClick={() => handleApplyQuickPack(pack)}
              className="px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <span>{pack.name}</span>
              <span className="text-[10px] text-cyan-400/80 font-mono">({pack.lens} • {pack.aperture})</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">

          {/* Top Live Video HUD Slate Preview Box */}
          <div className="bg-[#06080e] rounded-xl border border-cyan-500/30 p-3.5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5 tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                <span>Live Slate Overlay Preview (As rendered on video)</span>
              </span>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showOverlay !== false}
                  onChange={(e) => handleChange('showOverlay', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-400 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px]">Show Overlay on Player</span>
              </label>
            </div>

            {/* Preview HUD Slate Card */}
            <div className="bg-[#0b0e18]/90 backdrop-blur-md rounded-lg p-3 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-inner">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>SLATE #{activeScene.sceneNumber}</span>
                </div>
                <span className="text-zinc-600">|</span>
                <div className="flex items-center gap-1 text-zinc-200">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-white">{formData.shootingDate || '2026-10-12'}</span>
                </div>
                <span className="text-zinc-600">|</span>
                <div className="flex items-center gap-1 text-cyan-300">
                  <Aperture className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-cyan-200">{formData.lensFocalLength || '35mm Anamorphic'}</span>
                  <span className="px-1.5 py-0.2 text-[10px] bg-cyan-950/80 border border-cyan-500/40 rounded text-cyan-300 font-bold">
                    {formData.cameraAperture || 'T1.5'}
                  </span>
                </div>
                {formData.iso && (
                  <>
                    <span className="text-zinc-600">|</span>
                    <span className="text-amber-300 text-[11px]">{formData.iso}</span>
                  </>
                )}
                {formData.shutterSpeed && (
                  <>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-300 text-[11px]">{formData.shutterSpeed}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  BLOOM {formData.bloomIntensity ?? 35}% • GRAIN {formData.filmGrain ?? 20}% • CONT {formData.contrast ?? 105}%
                </span>
                <span className="text-zinc-500 font-semibold">{formData.cameraModel || 'ARRI Alexa 35'}</span>
                {formData.rollNumber && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px]">
                    ROLL: {formData.rollNumber} • TK: {formData.takeNumber || 1}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visual Effect Intensity & Color Grading Rack (Per-Clip Fine-Tuning) */}
          <div className="bg-[#0b0e19] p-4 rounded-xl border border-amber-500/30 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <span>Visual Effect Intensity & Color Grading Rack</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Per-Clip Fine-Tuning
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Dial in optical bloom halation, 35mm film grain, tonal contrast, saturation, and lens chromatic aberration for Scene #{activeScene.sceneNumber}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium cursor-pointer bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <input
                    type="checkbox"
                    checked={liveSyncToPlayer}
                    onChange={(e) => setLiveSyncToPlayer(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-emerald-400 focus:ring-0 cursor-pointer"
                  />
                  <span>Live Sync to Canvas</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetVfxSliders}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Reset all visual effect sliders to default calibration"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset FX</span>
                </button>
              </div>
            </div>

            {/* Quick VFX Look Presets Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase text-zinc-400 mr-1">FX Grade Presets:</span>
              {VFX_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyVfxPreset(preset)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#121626] hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 transition-colors cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Interactive Live Optical Swatch + 6 Intensity Sliders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              {/* Left 1/3: Live Optical & VFX Frame Monitor Swatch */}
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-[#05070d] min-h-[175px] flex flex-col justify-between p-3 select-none">
                {/* Background image or procedural gradient with live CSS filter */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-75"
                  style={{
                    backgroundImage: activeScene.backgroundImage
                      ? `url(${activeScene.backgroundImage})`
                      : 'radial-gradient(circle at 35% 35%, rgba(0,240,255,0.45), rgba(15,12,36,0.95) 70%)',
                    filter: `contrast(${formData.contrast ?? 105}%) saturate(${formData.saturation ?? 110}%) brightness(${Math.round(
                      100 + ((formData.bloomIntensity ?? 35) - 35) * 0.2
                    )}%)`,
                  }}
                />
                {/* Optical Bloom Halation Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 42%, rgba(0, 240, 255, 0.55), rgba(255, 170, 0, 0.25) 45%, transparent 75%)',
                    mixBlendMode: 'screen',
                    opacity: ((formData.bloomIntensity ?? 35) / 100) * 0.85,
                  }}
                />
                {/* Chromatic Aberration Edge Fringing */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: `inset ${Math.round(((formData.chromaticAberration ?? 15) / 100) * 18)}px 0 ${Math.round(
                      ((formData.chromaticAberration ?? 15) / 100) * 24
                    )}px rgba(0, 240, 255, ${((formData.chromaticAberration ?? 15) / 100) * 0.55}), inset -${Math.round(
                      ((formData.chromaticAberration ?? 15) / 100) * 18
                    )}px 0 ${Math.round(((formData.chromaticAberration ?? 15) / 100) * 24)}px rgba(255, 0, 128, ${
                      ((formData.chromaticAberration ?? 15) / 100) * 0.55
                    })`,
                  }}
                />
                {/* Film Grain Noise Pattern Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-radial-gradient(circle at 17% 32%, rgba(255,255,255,0.22) 0, rgba(0,0,0,0.28) 1px, transparent 2px)',
                    opacity: ((formData.filmGrain ?? 20) / 100) * 0.75,
                  }}
                />
                {/* Vignette Falloff Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, transparent ${Math.max(
                      18,
                      58 - (formData.vignetteIntensity ?? 45) * 0.35
                    )}%, rgba(0,0,0,${Math.min(0.95, ((formData.vignetteIntensity ?? 45) / 100) * 1.15)}) 100%)`,
                  }}
                />

                {/* Top Swatch Badge */}
                <div className="relative z-10 flex items-center justify-between text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-black/75 text-cyan-300 border border-cyan-500/30 font-bold">
                    SCENE #{activeScene.sceneNumber} GRADE MONITOR
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/75 text-amber-300 border border-amber-500/30">
                    {formData.lensFocalLength || '35mm'}
                  </span>
                </div>

                {/* Bottom Swatch Telemetry */}
                <div className="relative z-10 bg-black/75 backdrop-blur-sm rounded-lg p-2 border border-zinc-800/90 text-[10px] font-mono text-zinc-300 flex items-center justify-between">
                  <span>BLOOM: {formData.bloomIntensity ?? 35}%</span>
                  <span>GRAIN: {formData.filmGrain ?? 20}%</span>
                  <span>CONT: {formData.contrast ?? 105}%</span>
                </div>
              </div>

              {/* Right 2/3: 6 Precision Sliders Grid */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#080a12] p-3.5 rounded-xl border border-zinc-800/80">
                {/* 1. Optical Bloom & Halation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Optical Bloom & Glow</span>
                    </span>
                    <span className="font-mono text-cyan-300 font-bold text-[11px]">
                      {formData.bloomIntensity ?? 35}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.bloomIntensity ?? 35}
                    onChange={(e) => handleChange('bloomIntensity', parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>0% Crisp</span>
                    <span>50% Pro-Mist</span>
                    <span>100% Dreamy Halation</span>
                  </div>
                </div>

                {/* 2. 35mm Film Grain */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>35mm Film Grain</span>
                    </span>
                    <span className="font-mono text-amber-300 font-bold text-[11px]">
                      {formData.filmGrain ?? 20}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.filmGrain ?? 20}
                    onChange={(e) => handleChange('filmGrain', parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>0% Clean Sensor</span>
                    <span>35% Kodak 5219</span>
                    <span>100% 16mm Grit</span>
                  </div>
                </div>

                {/* 3. Tonal Contrast */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Tonal Contrast</span>
                    </span>
                    <span className="font-mono text-emerald-300 font-bold text-[11px]">
                      {formData.contrast ?? 105}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={formData.contrast ?? 105}
                    onChange={(e) => handleChange('contrast', parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>50% Log Flat</span>
                    <span>100% Neutral</span>
                    <span>150% Crushed Noir</span>
                  </div>
                </div>

                {/* 4. Color Saturation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
                      <span>Chroma Saturation</span>
                    </span>
                    <span className="font-mono text-fuchsia-300 font-bold text-[11px]">
                      {formData.saturation ?? 110}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={formData.saturation ?? 110}
                    onChange={(e) => handleChange('saturation', parseInt(e.target.value, 10))}
                    className="w-full accent-fuchsia-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>0% Monochrome</span>
                    <span>100% Rec.709</span>
                    <span>200% Neon Vivid</span>
                  </div>
                </div>

                {/* 5. Chromatic Aberration */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>Chromatic Aberration</span>
                    </span>
                    <span className="font-mono text-rose-300 font-bold text-[11px]">
                      {formData.chromaticAberration ?? 15}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.chromaticAberration ?? 15}
                    onChange={(e) => handleChange('chromaticAberration', parseInt(e.target.value, 10))}
                    className="w-full accent-rose-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>0% Apochromatic</span>
                    <span>35% Vintage Anamorphic</span>
                    <span>100% RGB Split</span>
                  </div>
                </div>

                {/* 6. Anamorphic Vignette Falloff */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span>Optical Vignette</span>
                    </span>
                    <span className="font-mono text-indigo-300 font-bold text-[11px]">
                      {formData.vignetteIntensity ?? 45}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.vignetteIntensity ?? 45}
                    onChange={(e) => handleChange('vignetteIntensity', parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>0% Open Gate</span>
                    <span>45% Standard</span>
                    <span>100% Pinhole Barrel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Grid Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Column 1: Core Optical Specs (Focal Length, Aperture, Date) */}
            <div className="bg-[#0b0e19] p-4 rounded-xl border border-zinc-800/80 space-y-4">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Primary Optics & Shooting Date</span>
              </h4>

              {/* Shooting Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Shooting Date</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleChange('shootingDate', new Date().toISOString().split('T')[0])}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Set Today
                  </button>
                </div>
                <input
                  type="date"
                  value={formData.shootingDate}
                  onChange={(e) => handleChange('shootingDate', e.target.value)}
                  className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Lens Focal Length */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                  <Aperture className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Lens Focal Length</span>
                </label>
                <input
                  type="text"
                  value={formData.lensFocalLength}
                  onChange={(e) => handleChange('lensFocalLength', e.target.value)}
                  placeholder="e.g. 35mm Anamorphic, 50mm Prime, 85mm T1.3"
                  className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
                {/* Quick preset chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {LENS_PRESETS.map((lens) => (
                    <button
                      key={lens}
                      type="button"
                      onClick={() => handleChange('lensFocalLength', lens)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        formData.lensFocalLength === lens
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {lens}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Aperture */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Camera Aperture (f-stop / T-stop)</span>
                </label>
                <input
                  type="text"
                  value={formData.cameraAperture}
                  onChange={(e) => handleChange('cameraAperture', e.target.value)}
                  placeholder="e.g. T1.5, f/1.8, f/2.8"
                  className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
                {/* Quick aperture chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {APERTURE_PRESETS.map((ap) => (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => handleChange('cameraAperture', ap)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer font-mono ${
                        formData.cameraAperture === ap
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {ap}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Model */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Camera Body / Sensor</span>
                </label>
                <select
                  value={formData.cameraModel || CAMERA_PRESETS[0]}
                  onChange={(e) => handleChange('cameraModel', e.target.value)}
                  className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {CAMERA_PRESETS.map((cam) => (
                    <option key={cam} value={cam}>
                      {cam}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 2: Cinematography Exposure & Production Slate */}
            <div className="bg-[#0b0e19] p-4 rounded-xl border border-zinc-800/80 space-y-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Exposure, Slate & Production Environment</span>
              </h4>

              {/* Shutter Speed & ISO row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">Shutter Speed / Angle</label>
                  <select
                    value={formData.shutterSpeed || SHUTTER_PRESETS[0]}
                    onChange={(e) => handleChange('shutterSpeed', e.target.value)}
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
                  >
                    {SHUTTER_PRESETS.map((sh) => (
                      <option key={sh} value={sh}>
                        {sh}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">ISO Sensitivity</label>
                  <select
                    value={formData.iso || ISO_PRESETS[2]}
                    onChange={(e) => handleChange('iso', e.target.value)}
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
                  >
                    {ISO_PRESETS.map((iso) => (
                      <option key={iso} value={iso}>
                        {iso}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* White Balance & Filter */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">White Balance</label>
                  <input
                    type="text"
                    value={formData.whiteBalance || '5600K'}
                    onChange={(e) => handleChange('whiteBalance', e.target.value)}
                    placeholder="e.g. 5600K Daylight, 3200K Tungsten"
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">Matte Filter / Diffusion</label>
                  <input
                    type="text"
                    value={formData.filter || 'ND 0.9'}
                    onChange={(e) => handleChange('filter', e.target.value)}
                    placeholder="e.g. 1/4 Black Pro-Mist, ND 0.9"
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Location & Take Number */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">Stage / Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g. Stage B - Catwalks"
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">Take #</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={formData.takeNumber || 1}
                    onChange={(e) => handleChange('takeNumber', parseInt(e.target.value) || 1)}
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Director & Cinematographer Notes */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs">Director & DP Optical Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="e.g. Keep highlights rolling off smoothly into shadow, sharp focus on actor eyes..."
                  className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-[#0d101d] border-t border-zinc-800/80 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {appliedNotification && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                <span>{appliedNotification}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleApplyToAllScenes}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#14192b] hover:bg-[#1c233c] text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Batch copy this optical lens and shooting metadata to every scene in the timeline"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Apply to All {scenes.length} Scenes</span>
            </button>

            <button
              type="button"
              onClick={handleSaveCurrent}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Save Scene #{activeScene.sceneNumber}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
