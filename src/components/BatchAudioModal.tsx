import React, { useState } from 'react';
import {
  X,
  Mic,
  Play,
  Pause,
  Check,
  Sparkles,
  RefreshCw,
  Clock,
  Volume2,
  CheckCircle2,
  AlertCircle,
  FileAudio,
} from 'lucide-react';
import { Scene } from '../types';
import { VOICE_ACTORS } from '../data/presets';
import {
  generateSpeechWav,
  isPlaceholderNarration,
  generateReplacementNarration,
} from '../utils/ttsSynthesizer';
import { audioEngine } from '../utils/audioEngine';

interface BatchAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  onBatchUpdateScenes: (updatedScenes: Scene[]) => void;
}

export const BatchAudioModal: React.FC<BatchAudioModalProps> = ({
  isOpen,
  onClose,
  scenes,
  onBatchUpdateScenes,
}) => {
  const [selectedVoice, setSelectedVoice] = useState<string>(
    scenes[0]?.voiceActor || 'Marcus Vance'
  );
  const [replacePlaceholders, setReplacePlaceholders] = useState(true);
  const [syncDurations, setSyncDurations] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [completedResults, setCompletedResults] = useState<Scene[] | null>(null);

  if (!isOpen) return null;

  const handlePlayPreview = (audioUrl: string) => {
    if (audioElement) {
      audioElement.pause();
      if (previewAudioUrl === audioUrl && isPlayingAudio) {
        setIsPlayingAudio(false);
        return;
      }
    }

    const audio = new Audio(audioUrl);
    setAudioElement(audio);
    setPreviewAudioUrl(audioUrl);
    setIsPlayingAudio(true);

    audio.onended = () => {
      setIsPlayingAudio(false);
    };

    audio.play().catch(() => {
      setIsPlayingAudio(false);
    });
  };

  const handleStartBatchGeneration = async () => {
    setIsProcessing(true);
    setProgress(0);
    setCompletedResults(null);

    const updatedList: Scene[] = [];
    let runningTime = 0;

    for (let i = 0; i < scenes.length; i++) {
      setCurrentProcessingIndex(i);
      const scene = scenes[i];

      // Check placeholder status
      let textToSpeak = (scene.voiceoverText || '').trim();
      if (replacePlaceholders && isPlaceholderNarration(textToSpeak)) {
        textToSpeak = generateReplacementNarration({
          sceneNumber: scene.sceneNumber || i + 1,
          title: scene.title,
          characterName: scene.characterName,
          sceneLocation: scene.sceneLocation,
          visualStyle: scene.visualStyle,
        });
      }

      // Small delay for UI smoothness
      await new Promise((r) => setTimeout(r, 120));

      // Synthesize WAV audio file
      const voice = selectedVoice || scene.voiceActor || 'Marcus Vance';
      const pitch = scene.voicePitch ?? 1.0;
      const rate = scene.voiceRate ?? 1.0;

      const tts = generateSpeechWav(textToSpeak, {
        voiceActor: voice,
        pitch,
        rate,
      });

      const audioDuration = tts.duration;
      const newDuration = syncDurations
        ? Math.max(scene.duration, Math.ceil(audioDuration + 0.8))
        : scene.duration;

      const startTime = runningTime;
      const endTime = runningTime + newDuration;
      runningTime = endTime;

      const updatedScene: Scene = {
        ...scene,
        voiceoverText: textToSpeak,
        voiceActor: voice,
        audioUrl: tts.audioUrl,
        audioDuration,
        isAudioGenerated: true,
        audioFormat: 'wav',
        duration: newDuration,
        startTime,
        endTime,
      };

      updatedList.push(updatedScene);
      setProgress(Math.round(((i + 1) / scenes.length) * 100));
    }

    setCompletedResults(updatedList);
    setIsProcessing(false);
    setCurrentProcessingIndex(null);

    // Apply updates directly to timeline and resync ducking schedule
    onBatchUpdateScenes(updatedList);
    audioEngine.updateDuckingScheduleFromScenes(updatedList);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-2xl w-full max-w-2xl shadow-[0_0_60px_rgba(0,240,255,0.18)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e1424]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Batch Text-to-Speech Generator
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-semibold">
                  Timeline Audio Sync
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Synthesize high-fidelity WAV narration audio for all {scenes.length} scenes at once
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (audioElement) audioElement.pause();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options & Settings Bar */}
        <div className="p-4 bg-[#070a14] border-b border-zinc-850 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Global Voice Persona */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-400 block">
                Narrator Voice Persona:
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={isProcessing}
                className="w-full bg-[#101524] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {VOICE_ACTORS.map((va) => (
                  <option key={va.id} value={va.name}>
                    {va.name} ({va.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={replacePlaceholders}
                  onChange={(e) => setReplacePlaceholders(e.target.checked)}
                  disabled={isProcessing}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-400 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs">
                  Replace placeholder text with cinematic dialogue
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={syncDurations}
                  onChange={(e) => setSyncDurations(e.target.checked)}
                  disabled={isProcessing}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-400 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs">
                  Auto-sync scene durations to spoken audio lengths
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Processing Progress Bar */}
        {isProcessing && (
          <div className="px-4 py-3 bg-[#0d1326] border-b border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Synthesizing Scene #
                {currentProcessingIndex !== null ? scenes[currentProcessingIndex]?.sceneNumber : 1}{' '}
                of {scenes.length}...
              </span>
              <span className="text-cyan-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-200 shadow-[0_0_8px_#00f0ff]"
              />
            </div>
          </div>
        )}

        {/* Scene Queue List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {scenes.map((scene, idx) => {
            const isPlaceholder = isPlaceholderNarration(scene.voiceoverText);
            const isCompleted = completedResults !== null;
            const updatedScene = completedResults?.[idx];

            return (
              <div
                key={scene.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  currentProcessingIndex === idx
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : updatedScene?.audioUrl
                    ? 'border-emerald-500/40 bg-emerald-950/15'
                    : 'border-zinc-800 bg-[#070a14]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    #{scene.sceneNumber}
                  </span>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{scene.title}</span>
                      {scene.sceneLocation && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/20">
                          {scene.sceneLocation}
                        </span>
                      )}
                      {isPlaceholder && !updatedScene && (
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-500/20">
                          Placeholder
                        </span>
                      )}
                      {updatedScene?.audioUrl && (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> {updatedScene.audioDuration}s WAV
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-1 italic font-serif">
                      "{updatedScene?.voiceoverText || scene.voiceoverText}"
                    </p>
                  </div>
                </div>

                {/* Audio Audition Play Button */}
                {(updatedScene?.audioUrl || scene.audioUrl) && (
                  <button
                    onClick={() =>
                      handlePlayPreview(updatedScene?.audioUrl || scene.audioUrl || '')
                    }
                    className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors cursor-pointer shrink-0"
                    title="Audition generated WAV file"
                  >
                    {previewAudioUrl === (updatedScene?.audioUrl || scene.audioUrl) &&
                    isPlayingAudio ? (
                      <Pause className="w-3.5 h-3.5 text-cyan-300" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-cyan-300" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#0c101d] border-t border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {completedResults
                ? 'All audio files generated & synced to timeline!'
                : `${scenes.length} scenes queued for WAV synthesis`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (audioElement) audioElement.pause();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer text-xs"
            >
              Close
            </button>

            <button
              onClick={handleStartBatchGeneration}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Audio...</span>
                </>
              ) : completedResults ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Re-Generate All</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate All Scene Audios ({scenes.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
