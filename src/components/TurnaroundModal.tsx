import React, { useRef } from 'react';
import { X, Download, Shield, Sparkles, User, Camera, Layers, CheckCircle2 } from 'lucide-react';
import { CharacterProfile } from '../types';

interface TurnaroundModalProps {
  character: CharacterProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TurnaroundModal: React.FC<TurnaroundModalProps> = ({ character, isOpen, onClose }) => {
  const sheetContainerRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !character) return null;

  const sheet = character.referenceSheet || {
    frontAngleDescription: `Frontal view of ${character.name}: ${character.description}`,
    sideProfileDescription: `Profile silhouette of ${character.name} showing cranial contours, facial features, and shoulder alignment.`,
    actionAngleDescription: `Dynamic 3/4 action stance: ${character.name} with key equipment and signature posture.`,
    costumeColorPalette: [character.colorAccent || '#00f0ff', '#1a2236', '#090d18', '#ffffff'],
    keyAnatomyFeatures: ['Distinctive facial structure', 'Signature wardrobe details', 'High-contrast lighting accents'],
    generatedAt: 'Master Turnaround Sheet v1.0',
  };

  const handleDownloadSheet = () => {
    // Render dynamic SVG to canvas and trigger download
    const svgEl = document.getElementById('turnaround-svg-sheet');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `StoryCast_Turnaround_${character.name.toLowerCase()}_${Date.now()}.png`;
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#080b13] border border-cyan-500/40 rounded-2xl w-full max-w-4xl shadow-[0_0_60px_rgba(0,240,255,0.18)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#0c101d]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border font-mono text-sm font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              style={{
                backgroundColor: `${character.colorAccent}15`,
                borderColor: `${character.colorAccent}60`,
                color: character.colorAccent,
              }}
            >
              {character.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide font-sans">{character.name}</h2>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold uppercase"
                  style={{
                    backgroundColor: `${character.colorAccent}20`,
                    borderColor: `${character.colorAccent}50`,
                    color: character.colorAccent,
                  }}
                >
                  {character.role}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                  {character.tag}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                AI Character Consistency Turnaround Sheet · Multi-Angle Model Reference
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSheet}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.15)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sheet (PNG)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div ref={sheetContainerRef} className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Main Visual Turnaround Graphic (SVG Blueprint Sheet) */}
          <div className="w-full bg-[#05070d] border border-cyan-500/30 rounded-xl p-4 shadow-inner overflow-hidden relative">
            <svg
              id="turnaround-svg-sheet"
              viewBox="0 0 1200 640"
              className="w-full h-auto select-none rounded-lg"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Blueprint grid pattern */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 240, 255, 0.08)" strokeWidth="1" />
                </pattern>
                {/* Glow filter */}
                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background */}
              <rect width="1200" height="640" fill="#04060c" />
              <rect width="1200" height="640" fill="url(#grid)" />

              {/* Blueprint Frame Borders & Tech Markers */}
              <rect x="20" y="20" width="1160" height="600" fill="none" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1" />
              <rect x="26" y="26" width="1148" height="588" fill="none" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1" />

              {/* Corner brackets */}
              <path d="M 20 50 L 20 20 L 50 20" fill="none" stroke="#00f0ff" strokeWidth="2.5" />
              <path d="M 1180 50 L 1180 20 L 1150 20" fill="none" stroke="#00f0ff" strokeWidth="2.5" />
              <path d="M 20 590 L 20 620 L 50 620" fill="none" stroke="#00f0ff" strokeWidth="2.5" />
              <path d="M 1180 590 L 1180 620 L 1150 620" fill="none" stroke="#00f0ff" strokeWidth="2.5" />

              {/* Header Title in SVG */}
              <text x="50" y="55" fill="#00f0ff" fontFamily="sans-serif" fontSize="18" fontWeight="bold" letterSpacing="1">
                STORYCAST AI · CHARACTER TURNAROUND SPECIFICATION
              </text>
              <text x="50" y="78" fill="#8899aa" fontFamily="monospace" fontSize="12">
                MODEL: {character.name.toUpperCase()} [{character.role.toUpperCase()}] · SEED REF: #{character.id.slice(-6)}
              </text>

              {/* Height Ruler Guidelines */}
              <line x1="100" y1="130" x2="1100" y2="130" stroke="rgba(255, 170, 0, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="60" y="134" fill="#ffaa00" fontFamily="monospace" fontSize="10">HEAD</text>

              <line x1="100" y1="210" x2="1100" y2="210" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="50" y="214" fill="#00f0ff" fontFamily="monospace" fontSize="10">CHEST</text>

              <line x1="100" y1="330" x2="1100" y2="330" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="52" y="334" fill="#00f0ff" fontFamily="monospace" fontSize="10">WAIST</text>

              <line x1="100" y1="510" x2="1100" y2="510" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="56" y="514" fill="#00f0ff" fontFamily="monospace" fontSize="10">BASE</text>

              {/* ================= VIEW 1: FRONT ANGLE ================= */}
              <g transform="translate(140, 100)">
                <rect x="0" y="0" width="280" height="430" rx="8" fill="rgba(8, 14, 28, 0.6)" stroke="rgba(0, 240, 255, 0.3)" />
                <text x="140" y="30" fill="#00f0ff" fontFamily="monospace" fontSize="13" fontWeight="bold" textAnchor="middle">
                  VIEW A: FRONT ELEVATION
                </text>

                {/* Pedestal platform */}
                <ellipse cx="140" cy="410" rx="90" ry="12" fill="none" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1.5" />
                <ellipse cx="140" cy="410" rx="60" ry="7" fill="rgba(0, 240, 255, 0.1)" />

                {/* Silhouette / Character Visual: Front View */}
                {/* Head / Face */}
                <circle cx="140" cy="90" r="32" fill="#1b2a47" stroke={character.colorAccent} strokeWidth="2" filter="url(#cyanGlow)" />
                {/* Hair */}
                <path d="M 112 85 Q 140 50 168 85 Q 140 68 112 85 Z" fill={character.role === 'Antagonist' ? '#dddddd' : '#ffd700'} />
                {/* Visor / Eyes */}
                <rect x="124" y="86" width="32" height="8" rx="4" fill={character.colorAccent} opacity="0.9" />

                {/* Neck & Torso */}
                <rect x="133" y="122" width="14" height="15" fill="#141d33" />
                {/* Shoulders & Chest armor */}
                <path d="M 85 140 L 195 140 L 180 240 L 100 240 Z" fill="#10182b" stroke={character.colorAccent} strokeWidth="1.5" />
                {/* Chest Emblem */}
                <circle cx="140" cy="175" r="14" fill="#070b14" stroke="#ffaa00" strokeWidth="1.5" />
                <path d="M 135 175 L 145 175 M 140 170 L 140 180" stroke="#ffaa00" strokeWidth="1.5" />

                {/* Arms */}
                <rect x="70" y="142" width="18" height="110" rx="6" fill="#141d33" stroke="rgba(255,255,255,0.2)" />
                <rect x="192" y="142" width="18" height="110" rx="6" fill="#141d33" stroke="rgba(255,255,255,0.2)" />

                {/* Belt & Legs */}
                <rect x="98" y="240" width="84" height="12" fill="#ffaa00" opacity="0.7" />
                <rect x="104" y="252" width="32" height="150" rx="4" fill="#141d33" stroke={character.colorAccent} strokeWidth="1" />
                <rect x="144" y="252" width="32" height="150" rx="4" fill="#141d33" stroke={character.colorAccent} strokeWidth="1" />
              </g>

              {/* ================= VIEW 2: SIDE PROFILE ================= */}
              <g transform="translate(460, 100)">
                <rect x="0" y="0" width="280" height="430" rx="8" fill="rgba(8, 14, 28, 0.6)" stroke="rgba(0, 240, 255, 0.3)" />
                <text x="140" y="30" fill="#00f0ff" fontFamily="monospace" fontSize="13" fontWeight="bold" textAnchor="middle">
                  VIEW B: 90° PROFILE SILHOUETTE
                </text>

                {/* Pedestal platform */}
                <ellipse cx="140" cy="410" rx="90" ry="12" fill="none" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1.5" />
                <ellipse cx="140" cy="410" rx="60" ry="7" fill="rgba(0, 240, 255, 0.1)" />

                {/* Silhouette / Character Visual: Profile */}
                {/* Head profile */}
                <path d="M 125 60 Q 158 60 162 85 Q 165 100 155 110 L 140 120 L 125 118 Z" fill="#1b2a47" stroke={character.colorAccent} strokeWidth="2" filter="url(#cyanGlow)" />
                <path d="M 125 60 Q 145 52 155 70 Z" fill={character.role === 'Antagonist' ? '#dddddd' : '#ffd700'} />
                {/* Profile eye / antenna */}
                <circle cx="152" cy="88" r="4" fill={character.colorAccent} />
                <line x1="130" y1="90" x2="115" y2="70" stroke="#00f0ff" strokeWidth="2" />

                {/* Torso & Backpack */}
                <rect x="110" y="140" width="25" height="90" rx="4" fill="#0c1220" stroke="#ffaa00" strokeWidth="1.5" />
                <path d="M 130 140 L 165 142 L 158 240 L 128 240 Z" fill="#10182b" stroke={character.colorAccent} strokeWidth="1.5" />

                {/* Profile Arm */}
                <rect x="135" y="145" width="22" height="110" rx="6" fill="#141d33" stroke="rgba(255,255,255,0.2)" />

                {/* Profile Leg */}
                <rect x="130" y="252" width="34" height="150" rx="4" fill="#141d33" stroke={character.colorAccent} strokeWidth="1" />
              </g>

              {/* ================= VIEW 3: 3/4 ACTION ANGLE ================= */}
              <g transform="translate(780, 100)">
                <rect x="0" y="0" width="280" height="430" rx="8" fill="rgba(8, 14, 28, 0.6)" stroke="rgba(0, 240, 255, 0.3)" />
                <text x="140" y="30" fill="#00f0ff" fontFamily="monospace" fontSize="13" fontWeight="bold" textAnchor="middle">
                  VIEW C: 3/4 HERO ACTION
                </text>

                {/* Pedestal platform */}
                <ellipse cx="140" cy="410" rx="90" ry="12" fill="none" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1.5" />
                <ellipse cx="140" cy="410" rx="60" ry="7" fill="rgba(0, 240, 255, 0.1)" />

                {/* 3/4 Pose */}
                <circle cx="145" cy="90" r="32" fill="#1b2a47" stroke={character.colorAccent} strokeWidth="2" filter="url(#cyanGlow)" />
                <path d="M 120 78 Q 150 48 175 80 Z" fill={character.role === 'Antagonist' ? '#dddddd' : '#ffd700'} />
                <rect x="130" y="85" width="30" height="9" rx="4" fill={character.colorAccent} opacity="0.9" />

                {/* Dynamic Torso */}
                <path d="M 98 140 L 195 135 L 175 240 L 115 240 Z" fill="#10182b" stroke={character.colorAccent} strokeWidth="1.5" />

                {/* Holding item */}
                <rect x="80" y="150" width="18" height="90" rx="5" fill="#141d33" stroke="rgba(255,255,255,0.2)" />
                <circle cx="85" cy="245" r="8" fill="#00f0ff" opacity="0.8" />

                <rect x="180" y="145" width="22" height="100" rx="6" fill="#141d33" stroke="rgba(255,255,255,0.2)" />

                <rect x="115" y="252" width="30" height="150" rx="4" fill="#141d33" stroke={character.colorAccent} strokeWidth="1" />
                <rect x="155" y="252" width="30" height="150" rx="4" fill="#141d33" stroke={character.colorAccent} strokeWidth="1" />
              </g>

              {/* Bottom Metadata & Color Palette Bar */}
              <g transform="translate(140, 545)">
                <text x="0" y="16" fill="#8899aa" fontFamily="monospace" fontSize="11" fontWeight="bold">
                  COSTUME COLOR MATRIX:
                </text>
                {sheet.costumeColorPalette.map((color, idx) => (
                  <g key={idx} transform={`translate(${180 + idx * 45}, 0)`}>
                    <rect x="0" y="2" width="32" height="18" rx="3" fill={color} stroke="rgba(255,255,255,0.2)" />
                    <text x="16" y="32" fill="#667788" fontFamily="monospace" fontSize="8" textAnchor="middle">
                      {color}
                    </text>
                  </g>
                ))}

                <text x="450" y="16" fill="#8899aa" fontFamily="monospace" fontSize="11" fontWeight="bold">
                  VOICE LINK:
                </text>
                <text x="540" y="16" fill="#ffaa00" fontFamily="monospace" fontSize="11">
                  {character.assignedVoice}
                </text>

                <text x="760" y="16" fill="#00f0ff" fontFamily="monospace" fontSize="10">
                  STATUS: VERIFIED CONSISTENT REFERENCE
                </text>
              </g>
            </svg>
          </div>

          {/* Technical Specs & Prompting Guidelines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* View A Notes */}
            <div className="p-3 rounded-xl bg-[#0b0e18] border border-zinc-800 space-y-1">
              <div className="text-[11px] font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Frontal Camera Spec</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">{sheet.frontAngleDescription}</p>
            </div>

            {/* View B Notes */}
            <div className="p-3 rounded-xl bg-[#0b0e18] border border-zinc-800 space-y-1">
              <div className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Silhouette & Profile Spec</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">{sheet.sideProfileDescription}</p>
            </div>

            {/* View C Notes */}
            <div className="p-3 rounded-xl bg-[#0b0e18] border border-zinc-800 space-y-1">
              <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3/4 Action Angle Spec</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">{sheet.actionAngleDescription}</p>
            </div>
          </div>

          {/* Prompt Consistency Anchor */}
          <div className="p-3.5 rounded-xl bg-[#0e1322] border border-cyan-500/20 space-y-1.5 font-mono text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Directorial Prompt Injection Token</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              When scenes are parsed, this exact physical description is automatically injected into Runway, Luma,
              and Sora prompts to maintain temporal facial identity:
            </p>
            <div className="p-2.5 rounded-lg bg-black/60 border border-zinc-800 text-zinc-200 text-[11px] select-all font-mono">
              &quot;Character: {character.name} ({character.description}), maintaining exact turnaround sheet features,
              costume palette [{sheet.costumeColorPalette.join(', ')}], photorealistic cinematic facial coherence.&quot;
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#0c101d] flex items-center justify-between">
          <div className="text-xs font-mono text-zinc-500">
            {character.name} Reference Blueprint · Generated {sheet.generatedAt}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
