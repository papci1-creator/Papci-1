import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  X,
  Sparkles,
  Square,
  MoveHorizontal,
  ZoomIn,
  RotateCw,
  Gauge,
  Check,
  ChevronRight,
  Eye,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Scene, CameraIntensity } from '../types';
import { CAMERA_MOVEMENTS } from '../data/presets';

interface CameraMotionPanelProps {
  scene: Scene;
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onApplyToAllScenes?: (cameraMotion: string, cameraSpeed: number, cameraIntensity: CameraIntensity) => void;
}

// Helper to determine the motion category
export function getMotionType(cameraMotion: string = ''): 'static' | 'pan' | 'zoom' | 'orbit' | 'dynamic' {
  const lower = cameraMotion.toLowerCase();
  if (lower.includes('static')) return 'static';
  if (lower.includes('pan')) return 'pan';
  if (lower.includes('zoom') || lower.includes('dolly')) return 'zoom';
  if (lower.includes('orbit') || lower.includes('arc') || lower.includes('circular')) return 'orbit';
  return 'dynamic';
}

// Helper to get intensity label from numerical speed
export function getIntensityLabel(speed: number): CameraIntensity {
  if (speed <= 0.75) return 'Slow';
  if (speed <= 1.2) return 'Moderate';
  if (speed <= 1.6) return 'Dynamic';
  return 'Fast';
}

// Compact SVG Path Icon for each motion type
export const CameraMotionPathIcon: React.FC<{
  type: 'static' | 'pan' | 'zoom' | 'orbit' | 'dynamic';
  className?: string;
  intensity?: number;
}> = ({ type, className = 'w-6 h-6', intensity = 1.0 }) => {
  switch (type) {
    case 'static':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          {/* Locked-off Tripod & Reticle */}
          <rect x="5" y="5" width="22" height="16" rx="2" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.4" />
          <circle cx="16" cy="13" r="3" stroke="#00f0ff" strokeWidth="1.5" />
          <path d="M16 7v3M16 16v3M10 13h3M19 13h3" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 26l4-5 4 5M16 21v5" stroke="#ffaa00" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'pan':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          {/* Horizontal Linear Tracking Rail with Directional Arrows */}
          <line x1="3" y1="16" x2="29" y2="16" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M7 12l-4 4 4 4M25 12l4 4-4 4" stroke="#ffaa00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Sliding Camera Lens Node */}
          <rect x="12" y="11" width="8" height="10" rx="2" fill="#0c1322" stroke="#00f0ff" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="2" fill="#00f0ff" />
        </svg>
      );
    case 'zoom':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          {/* Depth Perspective Cones converging forward */}
          <path d="M4 6l12 10L4 26" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
          <path d="M28 6L16 16l12 10" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
          {/* Central Convergent Focal Crosshairs */}
          <circle cx="16" cy="16" r="3.5" stroke="#ffaa00" strokeWidth="1.5" fill="#120e05" />
          <path d="M16 9v3M16 20v3M9 16h3M20 16h3" stroke="#ffaa00" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M13 16l3-3 3 3" stroke="#00f0ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'orbit':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          {/* Elliptical Arc Vector */}
          <ellipse cx="16" cy="16" rx="12" ry="7" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="4 2" />
          {/* Center Target Object */}
          <polygon points="16,12 19,16 16,20 13,16" fill="#ffaa00" />
          {/* Orbiting Camera Satellite */}
          <circle cx="26" cy="14" r="3" fill="#0a1020" stroke="#00f0ff" strokeWidth="1.5" />
          <path d="M24 10l3-1 1 3" stroke="#ffaa00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'dynamic':
    default:
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          {/* Flowing Curvilinear S-Spline Trajectory */}
          <path d="M4 22C10 22 10 10 16 10C22 10 22 22 28 10" stroke="#00f0ff" strokeWidth="1.75" strokeLinecap="round" />
          {/* Keyframe Waypoints */}
          <circle cx="4" cy="22" r="2.5" fill="#ffaa00" />
          <circle cx="16" cy="10" r="2" fill="#00f0ff" />
          <circle cx="28" cy="10" r="2.5" fill="#ffaa00" />
        </svg>
      );
  }
};

export const CameraMotionPanel: React.FC<CameraMotionPanelProps> = ({
  scene,
  onUpdateScene,
  onApplyToAllScenes,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const motionType = getMotionType(scene.cameraMotion);
  const speed = typeof scene.cameraSpeed === 'number' ? scene.cameraSpeed : 1.0;
  const intensityLabel = scene.cameraIntensity || getIntensityLabel(speed);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSpeedChange = (newSpeed: number) => {
    const newLabel = getIntensityLabel(newSpeed);
    onUpdateScene(scene.id, {
      cameraSpeed: newSpeed,
      cameraIntensity: newLabel,
    });
  };

  const handleMotionChange = (newMotionId: string) => {
    const preset = CAMERA_MOVEMENTS.find((m) => m.id === newMotionId);
    if (!preset) return;

    let motionDescription = preset.label;
    if (newMotionId === 'Pan') motionDescription = 'Cinematic Pan Right, Smooth Lateral Track';
    else if (newMotionId === 'Zoom') motionDescription = 'Slow Push-in Dolly Zoom';
    else if (newMotionId === 'Orbit') motionDescription = '360° Circular Orbital Arc Framing Subject';
    else if (newMotionId === 'Static') motionDescription = 'Static Locked-off Tripod Shot';
    else motionDescription = 'Dynamic AI Variety (Directorial Motion Blend)';

    onUpdateScene(scene.id, {
      cameraMotion: motionDescription,
    });
  };

  const handleApplyAll = () => {
    if (onApplyToAllScenes) {
      onApplyToAllScenes(scene.cameraMotion, speed, intensityLabel);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Small Inline Visualization Panel Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`group p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
          isOpen
            ? 'bg-[#10192e] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
            : 'bg-[#080b13] border-zinc-800/90 hover:border-cyan-500/50 hover:bg-[#0c111e]'
        }`}
        title="Click to tune Camera Motion trajectory & intensity"
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Path Vector Icon */}
          <div className="w-7 h-7 rounded-lg bg-[#0e1424] border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:border-cyan-400 transition-colors">
            <CameraMotionPathIcon type={motionType} className="w-5 h-5" intensity={speed} />
          </div>

          {/* Text Description */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-zinc-200 truncate">
                {scene.cameraMotion.split(',')[0]}
              </span>
            </div>
            <div className="text-[9px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
              <span className="text-cyan-400 font-semibold">{speed.toFixed(1)}x</span>
              <span className="text-zinc-600">•</span>
              <span
                className={`font-semibold ${
                  intensityLabel === 'Slow'
                    ? 'text-blue-400'
                    : intensityLabel === 'Fast'
                    ? 'text-rose-400'
                    : intensityLabel === 'Dynamic'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {intensityLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Tune Trigger Button */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-850 text-cyan-300 border border-zinc-700/60 group-hover:border-cyan-500/40 flex items-center gap-1">
            <Sliders className="w-2.5 h-2.5 text-cyan-400" />
            <span className="hidden sm:inline">Tune</span>
          </span>
        </div>
      </div>

      {/* Camera Motion & Intensity Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 bottom-full mb-2 w-[320px] bg-[#0c101c] border border-cyan-500/40 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.9)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3.5 backdrop-blur-md"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <CameraMotionPathIcon type={motionType} className="w-4 h-4" intensity={speed} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Camera Motion Trajectory
                </h4>
                <div className="text-[10px] font-mono text-zinc-400">Scene #{scene.sceneNumber} Motion Path</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Large Motion Path Animated Preview Canvas */}
          <div className="relative w-full h-24 bg-[#070911] rounded-xl border border-zinc-800/90 overflow-hidden flex items-center justify-center p-2">
            {/* Grid Coordinates Background */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #00f0ff 1px, transparent 0)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Motion Trajectory Vectors */}
            <div className="relative w-full h-full flex items-center justify-center">
              {motionType === 'static' && (
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="w-10 h-10 rounded-lg border border-cyan-400/50 flex items-center justify-center bg-cyan-950/20 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    <Square className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Zero Drift • Locked-off Tripod</span>
                </div>
              )}

              {motionType === 'pan' && (
                <div className="w-full px-4 flex flex-col items-center gap-2">
                  <div className="relative w-full h-8 flex items-center">
                    <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500 via-amber-400 to-cyan-500 border-dashed" />
                    <div
                      className="absolute w-5 h-5 rounded bg-cyan-400 text-black font-bold text-[9px] flex items-center justify-center shadow-[0_0_12px_#00f0ff] animate-pulse"
                      style={{
                        animation: `movePan ${2 / speed}s ease-in-out infinite alternate`,
                        left: '40%',
                      }}
                    >
                      CAM
                    </div>
                  </div>
                  <div className="flex justify-between w-full text-[9px] font-mono text-zinc-500">
                    <span>Frame Left [A]</span>
                    <span className="text-amber-400 font-bold">Lateral Sweep</span>
                    <span>Frame Right [B]</span>
                  </div>
                </div>
              )}

              {motionType === 'zoom' && (
                <div className="w-full px-4 flex flex-col items-center gap-1.5">
                  <div className="relative w-full h-10 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border border-cyan-400/30 flex items-center justify-center animate-ping" />
                    <div className="absolute w-8 h-8 rounded-full border border-amber-400 flex items-center justify-center bg-amber-950/20">
                      <ZoomIn className="w-4 h-4 text-amber-300" />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Push-in Dolly Depth Cone</span>
                </div>
              )}

              {motionType === 'orbit' && (
                <div className="w-full px-4 flex flex-col items-center gap-1">
                  <div className="relative w-28 h-12 flex items-center justify-center">
                    <div className="w-full h-full rounded-[50%] border border-cyan-400/50 border-dashed" />
                    <div className="absolute w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#ffaa00]" />
                    <div className="absolute top-0 right-2 w-3.5 h-3.5 rounded bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">360° Rotational Arc Framing</span>
                </div>
              )}

              {motionType === 'dynamic' && (
                <div className="w-full px-4 flex flex-col items-center gap-1">
                  <svg viewBox="0 0 200 40" className="w-full h-10">
                    <path
                      d="M10 30 Q 55 5, 100 20 T 190 10"
                      fill="none"
                      stroke="#00f0ff"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <circle cx="10" cy="30" r="4" fill="#ffaa00" />
                    <circle cx="100" cy="20" r="3.5" fill="#00f0ff" />
                    <circle cx="190" cy="10" r="4" fill="#ffaa00" />
                  </svg>
                  <span className="text-[10px] font-mono text-zinc-400">Multi-axis Director Spline Arc</span>
                </div>
              )}
            </div>

            {/* Velocity Multiplier Tag */}
            <div className="absolute bottom-1.5 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
              Velocity: {speed.toFixed(2)}x
            </div>
          </div>

          {/* Camera Move Type Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              Movement Type
            </label>
            <div className="grid grid-cols-5 gap-1">
              {CAMERA_MOVEMENTS.map((m) => {
                const isCurrent = getMotionType(scene.cameraMotion) === getMotionType(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => handleMotionChange(m.id)}
                    className={`py-1.5 px-1 rounded-lg text-[9px] font-mono border transition-all cursor-pointer text-center truncate ${
                      isCurrent
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                        : 'border-zinc-800 bg-[#070911] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {m.id === 'Dynamic AI' ? 'Dynamic' : m.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity (Slow to Fast) Fine-Tuning Slider */}
          <div className="space-y-2 pt-1 border-t border-zinc-850">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300 flex items-center gap-1.5 font-bold">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>Camera Intensity</span>
              </span>
              <span className="text-cyan-300 font-bold text-xs bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">
                {speed.toFixed(2)}x ({intensityLabel})
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0.4"
                max="2.2"
                step="0.05"
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                <span>0.4x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>1.4x (Dynamic)</span>
                <span>2.2x (Fast)</span>
              </div>
            </div>

            {/* Quick Intensity Preset Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: 'Slow', val: 0.6, desc: 'Subtle' },
                { label: 'Moderate', val: 1.0, desc: 'Balanced' },
                { label: 'Dynamic', val: 1.4, desc: 'Energetic' },
                { label: 'Fast', val: 1.85, desc: 'Whip / Push' },
              ].map((preset) => {
                const isActive = Math.abs(speed - preset.val) < 0.15;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handleSpeedChange(preset.val)}
                    className={`py-1 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold shadow-[0_0_8px_rgba(255,170,0,0.3)]'
                        : 'bg-[#080b12] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold">{preset.label}</div>
                    <div className="text-[8px] text-zinc-500">{preset.val}x</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions: Apply to All & Done */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
            {onApplyToAllScenes && (
              <button
                onClick={handleApplyAll}
                className="px-2.5 py-1 rounded-lg bg-[#121828] hover:bg-[#1a233b] text-cyan-300 text-[10px] font-mono border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="Apply this camera motion and intensity to all scenes"
              >
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Apply to All Shots</span>
              </button>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all cursor-pointer ml-auto"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
