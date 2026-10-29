import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Check,
  Layers,
  Film,
  Zap,
  Flame,
  Sun,
  EyeOff,
  MoveHorizontal,
  Aperture,
  Tv,
  Droplets,
  Square,
  Sliders,
  ArrowRight,
} from 'lucide-react';
import { Scene, TransitionEffect } from '../types';
import { TRANSITION_EFFECTS } from '../data/presets';
import { renderCinematicFrame } from '../utils/canvasRenderer';
import { getTransitionVisualDetails, renderTransitionIcon } from './Timeline';

export interface SceneTransitionLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  scenes: Scene[];
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onApplyToAllScenes?: (effect: TransitionEffect) => void;
  onSelectScene?: (sceneId: string) => void;
}

const CATEGORIES = [
  'All Styles',
  'Analog & Film',
  'Glitch & Cyber',
  'Optical & Light',
  'Editorial Cuts',
] as const;

export const SceneTransitionLibrary: React.FC<SceneTransitionLibraryProps> = ({
  isOpen,
  onClose,
  scene,
  scenes,
  onUpdateScene,
  onApplyToAllScenes,
  onSelectScene,
}) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    scene?.id || scenes[0]?.id || ''
  );
  const activeSceneIndex = Math.max(
    0,
    scenes.findIndex((s) => s.id === selectedSceneId)
  );
  const activeScene = scenes[activeSceneIndex] || scene || scenes[0];
  const nextScene =
    scenes[(activeSceneIndex + 1) % Math.max(1, scenes.length)] || activeScene;

  const [previewEffect, setPreviewEffect] = useState<TransitionEffect>(
    activeScene?.transitionEffect || 'VHS Glitch'
  );
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof CATEGORIES)[number]>('All Styles');
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(true);
  const [transitionProgress, setTransitionProgress] = useState<number>(0);
  const [previewSpeed, setPreviewSpeed] = useState<number>(1.0);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef<number>(0);

  // Sync when modal opens or target scene changes
  useEffect(() => {
    if (scene && scene.id !== selectedSceneId) {
      setSelectedSceneId(scene.id);
      if (scene.transitionEffect) {
        setPreviewEffect(scene.transitionEffect);
      }
    }
  }, [scene?.id]);

  useEffect(() => {
    if (activeScene?.transitionEffect) {
      setPreviewEffect(activeScene.transitionEffect);
    }
  }, [activeScene?.id]);

  // Real-time Dual-Scene Transition Shader Live Preview Loop
  useEffect(() => {
    if (!isOpen || !activeScene) return;

    let animId: number;
    let lastTimestamp = performance.now();

    const renderLoop = (now: number) => {
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlayingPreview) {
        progressRef.current += dt * 0.72 * previewSpeed;
        if (progressRef.current > 1.0) {
          progressRef.current = 0;
        }
        setTransitionProgress(progressRef.current);
      }

      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const p = progressRef.current;
          // First half of transition shows outgoing Scene A morphing with shader;
          // second half resolves into incoming Scene B with shader tail
          const baseScene = p < 0.52 ? activeScene : nextScene;
          const simulatedScene: Scene = {
            ...baseScene,
            transitionEffect: previewEffect,
          };

          renderCinematicFrame(ctx, canvas.width, canvas.height, {
            scene: simulatedScene,
            timeInScene: (now / 1000) % Math.max(2, baseScene.duration),
            aspectRatio: '16:9',
            showSubtitles: false,
            transitionProgress: p,
          });

          // Draw Top-Left A -> B Cut Status Telemetry Pill
          ctx.save();
          ctx.fillStyle = 'rgba(7, 10, 20, 0.82)';
          ctx.beginPath();
          ctx.roundRect(14, 14, 295, 28, 6);
          ctx.fill();
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          const shotLabel =
            p < 0.5
              ? `OUTGOING: SCENE #${activeScene.sceneNumber} →`
              : `→ INCOMING: SCENE #${nextScene.sceneNumber}`;
          ctx.fillText(
            `${shotLabel} [${previewEffect.toUpperCase()}]`,
            24,
            32
          );
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeScene, nextScene, previewEffect, isPlayingPreview, previewSpeed]);

  if (!isOpen || !activeScene) return null;

  const filteredTransitions = TRANSITION_EFFECTS.filter((tr) =>
    selectedCategory === 'All Styles' ? true : tr.category === selectedCategory
  );

  const handleTriggerLivePreview = (effect: TransitionEffect) => {
    setPreviewEffect(effect);
    progressRef.current = 0.02;
    setTransitionProgress(0.02);
    setIsPlayingPreview(true);
  };

  const handleApplyTransitionToScene = (effect: TransitionEffect) => {
    setPreviewEffect(effect);
    onUpdateScene(activeScene.id, { transitionEffect: effect });
    setStatusToast(
      `Updated Scene #${activeScene.sceneNumber} transitionEffect to "${effect}"`
    );
    setTimeout(() => setStatusToast(null), 2400);
  };

  const handleApplyToAll = () => {
    if (onApplyToAllScenes) {
      onApplyToAllScenes(previewEffect);
    } else {
      scenes.forEach((s) => {
        onUpdateScene(s.id, { transitionEffect: previewEffect });
      });
    }
    setStatusToast(
      `Applied "${previewEffect}" transition across all ${scenes.length} scenes`
    );
    setTimeout(() => setStatusToast(null), 2500);
  };

  const activePresetMeta =
    TRANSITION_EFFECTS.find((t) => t.id === previewEffect) ||
    TRANSITION_EFFECTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#090c16] border border-amber-500/35 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_0_70px_rgba(251,191,36,0.18)] overflow-hidden font-sans">
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800/90 bg-[#0d1120] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/25 to-rose-500/25 border border-amber-500/45 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-wide">
                  SceneTransitionLibrary
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  {TRANSITION_EFFECTS.length} Artistic Optical &amp; Glitch Shaders
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Preview artistic cut transitions (VHS Glitch, Light Leak, Film Burn, Whip Pan, Prism Split) in real time and update each scene&apos;s <code className="text-amber-300 font-mono">transitionEffect</code>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Close SceneTransitionLibrary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Scene Switcher Bar */}
        <div className="px-5 py-2.5 bg-[#070912] border-b border-zinc-800/70 flex items-center gap-2 overflow-x-auto scrollbar-thin shrink-0">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>Target Scene Cut:</span>
          </span>
          {scenes.map((s, idx) => {
            const isSelected = s.id === activeScene.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSceneId(s.id);
                  if (onSelectScene) onSelectScene(s.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="font-bold">Scene #{idx + 1}</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] text-cyan-300 font-semibold">
                  {s.transitionEffect || 'Dissolve'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {/* Top Dual-Scene Live Preview Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#060811] border border-zinc-800/90 rounded-2xl p-4 shadow-xl">
            {/* Left 7 Cols: Live Canvas Shader Monitor */}
            <div className="lg:col-span-7 flex flex-col gap-2.5">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-amber-500/35 bg-black shadow-lg">
                <canvas
                  ref={previewCanvasRef}
                  width={640}
                  height={360}
                  className="w-full h-full object-cover"
                />

                {/* Bottom Scrubber & Live Preview Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlayingPreview((prev) => !prev)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      {isPlayingPreview ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause Preview</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Live Preview</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTriggerLivePreview(previewEffect)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono flex items-center gap-1 cursor-pointer"
                      title="Replay transition from 0%"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Replay Sweep</span>
                    </button>
                  </div>

                  {/* Manual Scrub Slider for Transition Phase */}
                  <div className="flex items-center gap-2 flex-1 max-w-[220px]">
                    <span className="text-[10px] font-mono text-amber-300 shrink-0">
                      {Math.round(transitionProgress * 100)}%
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={transitionProgress}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        progressRef.current = val;
                        setTransitionProgress(val);
                        setIsPlayingPreview(false);
                      }}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg accent-amber-400 cursor-pointer"
                      title="Scrub transition shader frame-by-frame"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Active Transition Inspector & Instant Apply */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#0b0f1e] border border-zinc-800/80 rounded-xl p-4 space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {activePresetMeta.shaderTag}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Duration: ~{activePresetMeta.durationMs}ms
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[#13192e] border border-amber-500/30 text-amber-300">
                    {renderTransitionIcon(previewEffect, 'w-5 h-5')}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">
                      {activePresetMeta.label}
                    </h3>
                    <p className="text-xs text-amber-300/90 font-medium">
                      {activePresetMeta.subtitle} • {activePresetMeta.category}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed bg-[#070a14] p-3 rounded-lg border border-zinc-800/80">
                  {activePresetMeta.desc}
                </p>

                {/* Cut Splice Context */}
                <div className="bg-[#070a14] p-2.5 rounded-lg border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="truncate">
                    <span className="text-zinc-500 block text-[10px]">OUTGOING SHOT</span>
                    <span className="text-cyan-300 font-bold">
                      Scene #{activeScene.sceneNumber}: {activeScene.title}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mx-2" />
                  <div className="truncate text-right">
                    <span className="text-zinc-500 block text-[10px]">INCOMING SHOT</span>
                    <span className="text-amber-300 font-bold">
                      Scene #{nextScene.sceneNumber}: {nextScene.title}
                    </span>
                  </div>
                </div>

                {/* Preview Speed Control */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Preview Sweep Speed:
                  </span>
                  <div className="flex items-center gap-1">
                    {[0.5, 1.0, 1.5].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setPreviewSpeed(spd)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                          previewSpeed === spd
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyTransitionToScene(previewEffect)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    Apply &ldquo;{previewEffect}&rdquo; to Scene #{activeScene.sceneNumber}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      active
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm'
                        : 'bg-[#0e1222] text-zinc-400 hover:text-zinc-200 border-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-mono text-zinc-400">
              Showing <strong className="text-amber-300">{filteredTransitions.length}</strong> artistic transitions
            </span>
          </div>

          {/* 12+ Artistic Transition Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTransitions.map((tr) => {
              const isAppliedToScene =
                (activeScene.transitionEffect || 'Dissolve') === tr.id;
              const isCurrentlyPreviewing = previewEffect === tr.id;
              const details = getTransitionVisualDetails(tr.id);

              return (
                <div
                  key={tr.id}
                  onClick={() => handleApplyTransitionToScene(tr.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group ${
                    isAppliedToScene
                      ? 'bg-[#13192e] border-amber-400/90 shadow-[0_0_20px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/40'
                      : isCurrentlyPreviewing
                      ? 'bg-[#101526] border-cyan-400/60 ring-1 ring-cyan-400/30'
                      : 'bg-[#0b0e1a] hover:bg-[#0f1424] border-zinc-800/90 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="p-2 rounded-lg bg-[#080b14] border border-zinc-700/80 shrink-0"
                          style={{ borderColor: `${tr.accent}55` }}
                        >
                          {renderTransitionIcon(tr.id, 'w-4 h-4')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-bold text-white font-mono">
                              {tr.label}
                            </h4>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-700 font-mono">
                              {tr.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-amber-300/90 font-mono">
                            {tr.subtitle} • {tr.durationMs}ms
                          </span>
                        </div>
                      </div>

                      {isAppliedToScene && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-mono font-bold text-[10px] flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      {tr.desc}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-800/80 space-y-2">
                    {/* Gradient Swatch Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {tr.shaderTag}
                      </span>
                      <div
                        className={`w-24 h-2 rounded bg-gradient-to-r ${details.previewGradient} border border-white/10`}
                      />
                    </div>

                    {/* Action Buttons Row: Live Preview + Apply */}
                    <div
                      className="grid grid-cols-2 gap-2 pt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleTriggerLivePreview(tr.id)}
                        className={`py-1.5 px-2.5 rounded-lg text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          isCurrentlyPreviewing
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60'
                            : 'bg-[#080b14] hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                        }`}
                        title={`Live preview ${tr.label} on the top canvas monitor`}
                      >
                        <Play className="w-3 h-3 text-cyan-400 fill-current" />
                        <span>Live Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyTransitionToScene(tr.id)}
                        className={`py-1.5 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isAppliedToScene
                            ? 'bg-amber-500 text-black'
                            : 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{isAppliedToScene ? 'Applied' : 'Use Style'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="px-5 py-3.5 bg-[#0d1120] border-t border-zinc-800/90 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {statusToast ? (
              <span className="text-xs text-emerald-400 font-medium bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{statusToast}</span>
              </span>
            ) : (
              <span className="text-xs font-mono text-zinc-400">
                Scene #{activeScene.sceneNumber} Active Transition:{' '}
                <strong className="text-amber-300">
                  {activeScene.transitionEffect || 'Dissolve'}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleApplyToAll}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Apply &ldquo;{previewEffect}&rdquo; to All {scenes.length} Scenes
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
