import React from 'react';
import {
  X,
  Sparkles,
  Layers,
  Zap,
  EyeOff,
  MoveHorizontal,
  Square,
  Check,
  Play,
  Film,
  Sliders,
} from 'lucide-react';
import { TransitionEffect } from '../types';
import { TRANSITION_EFFECTS } from '../data/presets';
import {
  renderTransitionIcon,
  getTransitionVisualDetails,
} from './Timeline';

interface TransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEffect: TransitionEffect;
  onSelectEffect: (effect: TransitionEffect) => void;
  onApplyToAllScenes?: (effect: TransitionEffect) => void;
  sceneCount?: number;
}

export const TransitionModal: React.FC<TransitionModalProps> = ({
  isOpen,
  onClose,
  selectedEffect,
  onSelectEffect,
  onApplyToAllScenes,
  sceneCount = 3,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-amber-500/40 rounded-2xl w-full max-w-2xl shadow-[0_0_60px_rgba(251,191,36,0.18)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e1424]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Cinematic Transition FX Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-semibold">
                  Shader Blends
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Choose smooth visual transitions between cuts: Dissolve, Fade, Glitch, Wipe, or Hard Cut
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transition Presets Grid */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="text-xs font-mono text-zinc-400 flex items-center justify-between">
            <span>Available Transition Effects:</span>
            <span className="text-amber-400 font-semibold">Active: {selectedEffect}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TRANSITION_EFFECTS.map((tr) => {
              const isSelected = selectedEffect === tr.id;
              const details = getTransitionVisualDetails(tr.id);

              return (
                <div
                  key={tr.id}
                  onClick={() => onSelectEffect(tr.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#12182b] border-amber-400/80 shadow-[0_0_18px_rgba(251,191,36,0.22)] ring-1 ring-amber-400/40'
                      : 'bg-[#070a14] hover:bg-[#0a0e1c] border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[#0e1424] border border-zinc-700/80 text-white shrink-0">
                        {renderTransitionIcon(tr.id, 'w-4 h-4')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold font-mono ${
                              isSelected ? 'text-amber-300' : 'text-white'
                            }`}
                          >
                            {tr.label}
                          </h4>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            · {tr.subtitle}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                          {tr.desc}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Gradient Preview Line */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-850 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500">Visual Gradient:</span>
                    <div
                      className={`w-32 h-2.5 rounded bg-gradient-to-r ${details.previewGradient} border border-white/10 shadow-inner`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-[#070a14] flex items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-zinc-400">
            Rendered natively in both browser canvas & MoviePy exports
          </div>

          <div className="flex items-center gap-2">
            {onApplyToAllScenes && (
              <button
                onClick={() => {
                  onApplyToAllScenes(selectedEffect);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Apply to All {sceneCount} Scenes</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono transition-all cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.3)]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
