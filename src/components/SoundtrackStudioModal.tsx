import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Music,
  Mic,
  Volume2,
  Sliders,
  Play,
  Square,
  Upload,
  Sparkles,
  Check,
  Radio,
  Disc,
  Waves,
  Drum,
} from 'lucide-react';
import { SoundtrackMixConfig, Scene } from '../types';
import { MUSIC_STYLES, AMBIENT_SFX_STYLES } from '../data/presets';
import { audioEngine } from '../utils/audioEngine';

interface SoundtrackStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  mixConfig: SoundtrackMixConfig;
  onUpdateMixConfig: (updates: Partial<SoundtrackMixConfig>) => void;
  scenes: Scene[];
}

const CLAVE_STEPS = new Set([0, 3, 6, 10, 12]);
const BASS_STEPS = new Set([0, 3, 7, 10, 14]);
const SHAKER_STEPS = new Set([0, 2, 3, 4, 6, 8, 10, 11, 12, 14, 15]);
const MELODY_STEPS = new Set([2, 5, 8, 11, 15]);

export const SoundtrackStudioModal: React.FC<SoundtrackStudioModalProps> = ({
  isOpen,
  onClose,
  mixConfig,
  onUpdateMixConfig,
  scenes,
}) => {
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [isTestingVoiceDuck, setIsTestingVoiceDuck] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [savedBanner, setSavedBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = audioEngine.onStepChange((step, playing) => {
      setActiveStep(playing ? step : -1);
    });
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!isOpen && isAuditioning) {
      handleStopAudition();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartAudition = () => {
    setIsAuditioning(true);
    audioEngine.setMusicVolume(mixConfig.musicVolume);
    audioEngine.setSfxVolume(mixConfig.ambientSfxVolume);
    audioEngine.setVoiceoverMasterVolume(mixConfig.voiceoverVolume);
    audioEngine.setAfrobeatParams({
      bpm: mixConfig.afrobeatBpm,
      percussionIntensity: mixConfig.percussionIntensity,
      logDrumBassBoost: mixConfig.logDrumBassBoost,
    });
    if (mixConfig.customAudioUrl) {
      audioEngine.setCustomAudioUrl(mixConfig.customAudioUrl);
    }
    audioEngine.startMusic(mixConfig.musicStyle);
    audioEngine.startAmbientSfx(mixConfig.ambientSfxStyle);
  };

  const handleStopAudition = () => {
    setIsAuditioning(false);
    setIsTestingVoiceDuck(false);
    audioEngine.stopNarration();
    audioEngine.stopAmbientSfx();
    audioEngine.stopMusic();
  };

  const handleTestVoiceoverDucking = () => {
    if (!isAuditioning) {
      handleStartAudition();
    }
    const sampleText =
      scenes[0]?.voiceoverText ||
      'Testing multi-track audio ducking. Notice how the Afrobeat groove and ambient foley smoothly attenuate beneath the narrator voiceover.';
    setIsTestingVoiceDuck(true);
    audioEngine.speakNarration(
      sampleText,
      scenes[0]?.voiceActor || 'Marcus Vance',
      () => setIsTestingVoiceDuck(true),
      () => setIsTestingVoiceDuck(false),
      mixConfig.voiceoverVolume
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    audioEngine.setCustomAudioUrl(url);
    onUpdateMixConfig({
      customAudioUrl: url,
      customAudioName: file.name,
      musicStyle: 'Custom Track',
    });
    if (isAuditioning) {
      audioEngine.startMusic('Custom Track');
    }
  };

  const handleSaveAndApply = () => {
    audioEngine.setMusicVolume(mixConfig.musicVolume);
    audioEngine.setSfxVolume(mixConfig.ambientSfxVolume);
    audioEngine.setVoiceoverMasterVolume(mixConfig.voiceoverVolume);
    audioEngine.setAfrobeatParams({
      bpm: mixConfig.afrobeatBpm,
      percussionIntensity: mixConfig.percussionIntensity,
      logDrumBassBoost: mixConfig.logDrumBassBoost,
    });
    audioEngine.setDuckingConfig({
      enabled: mixConfig.enableDucking,
      duckingGain: mixConfig.duckingDepth,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const isAfrobeatSelected =
    mixConfig.musicStyle === 'Afrobeat Groove' ||
    mixConfig.musicStyle === 'Afro-Cyberpunk Fusion';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0a0d16] border border-amber-500/40 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_0_60px_rgba(245,158,11,0.18)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#0d1220] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-cyan-500 p-[1px] shadow-[0_0_15px_rgba(245,158,11,0.35)]">
              <div className="w-full h-full bg-[#090c15] rounded-[11px] flex items-center justify-center">
                <Drum className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wide">
                  Afrobeat & Custom Soundtrack Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  3-Stem Master Mixer
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Mix Voiceover Narration, Poly-Rhythmic Afrobeat / Custom Score, and Ambient Foley SFX for live playback & MP4/WebM export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuditioning ? (
              <button
                onClick={handleStopAudition}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                <span>Stop Audition</span>
              </button>
            ) : (
              <button
                onClick={handleStartAudition}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span>Audition 3-Track Mix</span>
              </button>
            )}

            <button
              onClick={() => {
                handleStopAudition();
                onClose();
              }}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* 3-Track Mixing Console Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* STEM 1: VOICEOVER & DIALOGUE */}
            <div className="bg-[#070a12] border border-cyan-500/30 rounded-xl p-4 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">STEM 1 · Voiceover</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Dialogue & Narration Bus</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    {Math.round(mixConfig.voiceoverVolume * 100)}%
                  </span>
                </div>

                {/* Volume Fader */}
                <div>
                  <label className="text-[11px] text-zinc-400 flex justify-between mb-1">
                    <span>Voiceover Gain</span>
                    <span className="font-mono text-zinc-300">
                      {mixConfig.voiceoverVolume >= 1 ? `+${((mixConfig.voiceoverVolume - 1) * 10).toFixed(1)} dB` : `${((mixConfig.voiceoverVolume - 1) * 20).toFixed(1)} dB`}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1.2"
                    step="0.05"
                    value={mixConfig.voiceoverVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateMixConfig({ voiceoverVolume: val });
                      audioEngine.setVoiceoverMasterVolume(val);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Auto-Ducking Control */}
                <div className="pt-2 border-t border-zinc-850 space-y-2">
                  <label className="flex items-center justify-between text-xs text-zinc-200 cursor-pointer">
                    <span className="font-medium">Smart Music Ducking</span>
                    <input
                      type="checkbox"
                      checked={mixConfig.enableDucking}
                      onChange={(e) => {
                        onUpdateMixConfig({ enableDucking: e.target.checked });
                        audioEngine.setDuckingConfig({ enabled: e.target.checked });
                      }}
                      className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Ducking Attenuation</span>
                      <span className="font-mono text-amber-300">
                        Keep {Math.round(mixConfig.duckingDepth * 100)}% music during speech
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.60"
                      step="0.05"
                      disabled={!mixConfig.enableDucking}
                      value={mixConfig.duckingDepth}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateMixConfig({ duckingDepth: val });
                        audioEngine.setDuckingConfig({ duckingGain: val });
                      }}
                      className="w-full accent-amber-400 cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleTestVoiceoverDucking}
                className="w-full py-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isTestingVoiceDuck ? 'animate-bounce text-amber-400' : ''}`} />
                <span>{isTestingVoiceDuck ? 'Speaking & Ducking Active...' : 'Test Voice + Ducking'}</span>
              </button>
            </div>

            {/* STEM 2: RHYTHMIC BACKGROUND MUSIC & AFROBEAT */}
            <div className="bg-[#070a12] border border-amber-500/40 rounded-xl p-4 space-y-3.5 flex flex-col justify-between shadow-[0_0_25px_rgba(245,158,11,0.08)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">STEM 2 · Rhythmic Score</span>
                      <span className="text-[10px] text-amber-400 font-mono">Afrobeat & Soundtrack Bus</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                    {Math.round(mixConfig.musicVolume * 100)}%
                  </span>
                </div>

                {/* Music Gain */}
                <div>
                  <label className="text-[11px] text-zinc-400 flex justify-between mb-1">
                    <span>Soundtrack Volume</span>
                    <span className="font-mono text-amber-300">{mixConfig.musicStyle}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={mixConfig.musicVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateMixConfig({ musicVolume: val });
                      audioEngine.setMusicVolume(val);
                    }}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Style Selector */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Select Soundtrack Genre</label>
                  <select
                    value={mixConfig.musicStyle}
                    onChange={(e) => {
                      const style = e.target.value;
                      onUpdateMixConfig({ musicStyle: style });
                      if (isAuditioning) {
                        audioEngine.startMusic(style);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-zinc-700 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {MUSIC_STYLES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Audio Upload */}
                <div className="pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-1.5 px-3 rounded-lg bg-[#101729] hover:bg-[#17213a] border border-zinc-700 hover:border-amber-500/50 text-[11px] font-mono text-zinc-300 hover:text-amber-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span className="truncate">
                      {mixConfig.customAudioName
                        ? `Loaded: ${mixConfig.customAudioName}`
                        : 'Upload Custom MP3 / WAV Track'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="text-[10px] font-mono text-zinc-400 bg-[#05070d] p-2 rounded border border-zinc-850">
                {MUSIC_STYLES.find((m) => m.id === mixConfig.musicStyle)?.desc ||
                  'Poly-rhythmic synthesized film score'}
              </div>
            </div>

            {/* STEM 3: AMBIENT FOLEY & SFX */}
            <div className="bg-[#070a12] border border-purple-500/30 rounded-xl p-4 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                      <Waves className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">STEM 3 · Ambient SFX</span>
                      <span className="text-[10px] text-purple-400 font-mono">Diegetic Atmosphere Bus</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                    {Math.round(mixConfig.ambientSfxVolume * 100)}%
                  </span>
                </div>

                {/* SFX Volume */}
                <div>
                  <label className="text-[11px] text-zinc-400 flex justify-between mb-1">
                    <span>Ambient Foley Level</span>
                    <span className="font-mono text-purple-300">{mixConfig.ambientSfxStyle}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={mixConfig.ambientSfxVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateMixConfig({ ambientSfxVolume: val });
                      audioEngine.setSfxVolume(val);
                    }}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>

                {/* Ambient SFX Selector */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Environmental Texture</label>
                  <select
                    value={mixConfig.ambientSfxStyle}
                    onChange={(e) => {
                      const sfx = e.target.value;
                      onUpdateMixConfig({ ambientSfxStyle: sfx });
                      if (isAuditioning) {
                        audioEngine.startAmbientSfx(sfx);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-zinc-700 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                  >
                    {AMBIENT_SFX_STYLES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-[10px] font-mono text-zinc-400 bg-[#05070d] p-2 rounded border border-zinc-850">
                {AMBIENT_SFX_STYLES.find((s) => s.id === mixConfig.ambientSfxStyle)?.desc ||
                  'Continuous environmental foley layer'}
              </div>
            </div>
          </div>

          {/* AFROBEAT POLY-RHYTHMIC GROOVE SEQUENCER & DRUM ENGINE */}
          <div className="bg-[#070a12] border border-amber-500/30 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
                  Afrobeat Poly-Rhythmic Groove Engine & 16-Step Pattern Matrix
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onUpdateMixConfig({ musicStyle: 'Afrobeat Groove' });
                    if (isAuditioning) audioEngine.startMusic('Afrobeat Groove');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold cursor-pointer transition-all ${
                    mixConfig.musicStyle === 'Afrobeat Groove'
                      ? 'bg-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Lagos Afrobeat Groove
                </button>
                <button
                  onClick={() => {
                    onUpdateMixConfig({ musicStyle: 'Afro-Cyberpunk Fusion' });
                    if (isAuditioning) audioEngine.startMusic('Afro-Cyberpunk Fusion');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold cursor-pointer transition-all ${
                    mixConfig.musicStyle === 'Afro-Cyberpunk Fusion'
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Afro-Cyberpunk Fusion
                </button>
              </div>
            </div>

            {/* 3 Afrobeat Synthesis Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="bg-[#0b101d] p-3 rounded-lg border border-zinc-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Tempo (BPM)</span>
                  <span className="font-mono font-bold text-amber-400">{mixConfig.afrobeatBpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="132"
                  step="2"
                  value={mixConfig.afrobeatBpm}
                  onChange={(e) => {
                    const bpm = parseInt(e.target.value, 10);
                    onUpdateMixConfig({ afrobeatBpm: bpm });
                    audioEngine.setAfrobeatParams({ bpm });
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="bg-[#0b101d] p-3 rounded-lg border border-zinc-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Log-Drum 808 Sub-Bass</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {Math.round(mixConfig.logDrumBassBoost * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={mixConfig.logDrumBassBoost}
                  onChange={(e) => {
                    const boost = parseFloat(e.target.value);
                    onUpdateMixConfig({ logDrumBassBoost: boost });
                    audioEngine.setAfrobeatParams({ logDrumBassBoost: boost });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="bg-[#0b101d] p-3 rounded-lg border border-zinc-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Shekere & Clave Percussion</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {Math.round(mixConfig.percussionIntensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={mixConfig.percussionIntensity}
                  onChange={(e) => {
                    const perc = parseFloat(e.target.value);
                    onUpdateMixConfig({ percussionIntensity: perc });
                    audioEngine.setAfrobeatParams({ percussionIntensity: perc });
                  }}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            {/* 16-Step Visual Pattern Grid */}
            <div className="space-y-1.5 pt-1">
              {[
                { label: 'Log-Drum Sub', steps: BASS_STEPS, color: 'bg-amber-400' },
                { label: '3-2 Clave Rim', steps: CLAVE_STEPS, color: 'bg-cyan-400' },
                { label: 'Shekere Shaker', steps: SHAKER_STEPS, color: 'bg-emerald-400' },
                { label: 'Highlife Pluck', steps: MELODY_STEPS, color: 'bg-purple-400' },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="w-28 text-[10px] font-mono text-zinc-400 shrink-0">{row.label}</span>
                  <div className="grid grid-cols-16 gap-1 flex-1">
                    {Array.from({ length: 16 }).map((_, idx) => {
                      const isHit = row.steps.has(idx);
                      const isCurrent = isAuditioning && isAfrobeatSelected && activeStep === idx;
                      return (
                        <div
                          key={idx}
                          className={`h-4 rounded-sm transition-all ${
                            isCurrent && isHit
                              ? `${row.color} scale-110 shadow-[0_0_8px_#fff]`
                              : isHit
                              ? `${row.color} opacity-65`
                              : isCurrent
                              ? 'bg-zinc-700'
                              : 'bg-zinc-900 border border-zinc-800/80'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-[#0d1220] flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-400 font-mono flex items-center gap-2">
            <span>Active Master Bus:</span>
            <span className="text-amber-300 font-bold">{mixConfig.musicStyle}</span>
            <span>+</span>
            <span className="text-purple-300 font-bold">{mixConfig.ambientSfxStyle}</span>
          </div>

          <div className="flex items-center gap-3">
            {savedBanner && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Synced to Master Export!</span>
              </span>
            )}
            <button
              onClick={() => {
                handleSaveAndApply();
                handleStopAudition();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply Multi-Track Mix</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
