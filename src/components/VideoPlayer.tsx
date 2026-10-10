import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Subtitles,
  Repeat,
  Tv,
  Film,
  Sparkles,
  Info,
  Eye,
  Sliders,
  Video,
  Wand2,
  ChevronDown,
  Link,
  Check,
  Mic,
} from 'lucide-react';
import { Scene, AspectRatio, TransitionEffect } from '../types';
import { renderCinematicFrame } from '../utils/canvasRenderer';
import { audioEngine, VoiceoverSegment } from '../utils/audioEngine';
import { TRANSITION_EFFECTS, SAMPLE_VIDEO_CLIPS } from '../data/presets';

interface VideoPlayerProps {
  scenes: Scene[];
  currentSceneIndex: number;
  setCurrentSceneIndex: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  totalDuration: number;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  musicStyle: string;
  useLiveVideoPreview?: boolean;
  setUseLiveVideoPreview?: (val: boolean) => void;
  onUpdateSceneVideoUrl?: (sceneId: string, videoUrl: string) => void;
  onUpdateAllVideoUrls?: (videoUrl: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  scenes,
  currentSceneIndex,
  setCurrentSceneIndex,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  totalDuration,
  aspectRatio,
  setAspectRatio,
  musicStyle,
  useLiveVideoPreview = true,
  setUseLiveVideoPreview,
  onUpdateSceneVideoUrl,
  onUpdateAllVideoUrls,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [showInfoHud, setShowInfoHud] = useState(true);

  // Transition live test state
  const [testingTransitionEffect, setTestingTransitionEffect] = useState<TransitionEffect | null>(null);
  const [testingProgress, setTestingProgress] = useState<number>(0);
  const [isLoopMenuOpen, setIsLoopMenuOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showCustomUrlDialog, setShowCustomUrlDialog] = useState(false);

  // Automated Audio Ducking UI & Scheduling State
  const [isDucking, setIsDucking] = useState(audioEngine.getIsDuckingActive());
  const [activeVoiceSegment, setActiveVoiceSegment] = useState<VoiceoverSegment | null>(
    audioEngine.getActiveVoiceoverSegment()
  );
  const [showDuckingPopover, setShowDuckingPopover] = useState(false);
  const [duckingConfig, setDuckingConfigState] = useState(audioEngine.getDuckingConfig());

  // Automatically recalculate voiceover ducking schedule whenever scenes change
  useEffect(() => {
    const segments = audioEngine.calculateVoiceoverSegments(scenes);
    audioEngine.setDuckingSchedule(segments);
  }, [scenes]);

  // Subscribe to real-time audio ducking state changes
  useEffect(() => {
    const unsubscribe = audioEngine.onDuckingStateChange((ducking, _gain, seg) => {
      setIsDucking(ducking);
      setActiveVoiceSegment(seg);
    });
    return unsubscribe;
  }, []);

  const activeScene = scenes[currentSceneIndex] || scenes[0];

  // Control background video playback
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying || testingTransitionEffect !== null) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, testingTransitionEffect]);

  useEffect(() => {
    if (videoRef.current && activeScene) {
      const src =
        activeScene.videoUrl ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
      if (videoRef.current.src !== src) {
        videoRef.current.src = src;
        videoRef.current.load();
        if (isPlaying || testingTransitionEffect !== null) {
          videoRef.current.play().catch(() => {});
        }
      }
    }
  }, [activeScene, isPlaying, testingTransitionEffect]);

  // Aspect ratio dimensions for canvas container
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[560px] mx-auto';
      case '2.39:1':
        return 'aspect-[2.39/1] w-full';
      case '16:9':
      default:
        return 'aspect-video w-full';
    }
  };

  // Trigger interactive transition effect test
  const handleTestTransition = (effect: TransitionEffect) => {
    setTestingTransitionEffect(effect);
    setTestingProgress(0);

    const startTime = performance.now();
    const duration = 1600; // 1.6s transition preview

    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }

    const stepAnim = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      setTestingProgress(progress);

      if (elapsed < duration) {
        requestAnimationFrame(stepAnim);
      } else {
        setTestingTransitionEffect(null);
        setTestingProgress(0);
        if (!isPlaying && videoRef.current) {
          videoRef.current.pause();
        }
      }
    };

    requestAnimationFrame(stepAnim);
  };

  // Render loop using requestAnimationFrame
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas && activeScene) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Time offset inside active scene
          const sceneStart = activeScene.startTime || 0;
          const timeInScene = Math.max(0, currentTime - sceneStart);
          const timeRemaining = (activeScene.duration || 6) - timeInScene;
          const transitionDuration = 0.75;
          let transitionProgress = 0;

          if (currentSceneIndex < scenes.length - 1 && timeRemaining <= transitionDuration) {
            transitionProgress = 1 - timeRemaining / transitionDuration;
          } else if (timeInScene < 0.25 && currentSceneIndex > 0) {
            transitionProgress = 1 - timeInScene / 0.25;
          }

          // If currently running an explicit interactive transition test:
          let effectiveTransitionProgress = transitionProgress;
          let effectiveScene = activeScene;

          if (testingTransitionEffect !== null) {
            effectiveTransitionProgress = testingProgress;
            effectiveScene = {
              ...activeScene,
              transitionEffect: testingTransitionEffect,
            };
          }

          renderCinematicFrame(ctx, canvas.width, canvas.height, {
            scene: effectiveScene,
            nextScene: scenes[currentSceneIndex + 1],
            timeInScene,
            transitionProgress: effectiveTransitionProgress,
            aspectRatio,
            showSubtitles,
            videoElement: videoRef.current,
            useLiveVideo: useLiveVideoPreview,
          });
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    activeScene,
    currentTime,
    aspectRatio,
    showSubtitles,
    useLiveVideoPreview,
    testingTransitionEffect,
    testingProgress,
    currentSceneIndex,
    scenes,
  ]);

  // Master Playback Timer Clock
  // Helper to play either custom user recorded voice (audioUrl) or synthetic narration (TTS)
  const playSceneAudio = (scene?: Scene) => {
    if (!scene) return;
    if (scene.audioUrl) {
      audioEngine.playAudioClip(scene.audioUrl, scene.audioVolume ?? 1.0);
    } else if (scene.voiceoverText) {
      audioEngine.speakNarration(
        scene.voiceoverText,
        scene.voiceActor,
        undefined,
        undefined,
        scene.audioVolume ?? 1.0,
        scene.voicePitch,
        scene.voiceRate
      );
    }
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      const step = 0.05; // 50ms interval for ultra-smooth scrub
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + step;
          if (next >= totalDuration) {
            if (isLooping) {
              setCurrentSceneIndex(0);
              playSceneAudio(scenes[0]);
              return 0;
            } else {
              setIsPlaying(false);
              return totalDuration;
            }
          }

          // Check if we advanced into the next scene
          const foundIdx = scenes.findIndex((s) => next >= s.startTime && next < s.endTime);
          if (foundIdx !== -1 && foundIdx !== currentSceneIndex) {
            setCurrentSceneIndex(foundIdx);
            // Trigger narration or recorded voice for the new scene
            const newScene = scenes[foundIdx];
            playSceneAudio(newScene);
          }

          // Evaluate automated audio ducking at the current timeline timestamp
          audioEngine.updateDuckingAtTime(next);

          return next;
        });
      }, 50);
    } else {
      audioEngine.stopNarration();
    }

    return () => clearInterval(interval);
  }, [
    isPlaying,
    totalDuration,
    isLooping,
    scenes,
    currentSceneIndex,
    setCurrentSceneIndex,
    setCurrentTime,
    setIsPlaying,
  ]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (scenes.length === 0) return;
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      setCurrentSceneIndex(0);
    }

    const nextState = !isPlaying;
    setIsPlaying(nextState);

    if (nextState) {
      if (musicStyle !== 'None') {
        audioEngine.startMusic(musicStyle);
      }
      playSceneAudio(activeScene);
    } else {
      audioEngine.stopNarration();
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      const prevIdx = currentSceneIndex - 1;
      setCurrentSceneIndex(prevIdx);
      setCurrentTime(scenes[prevIdx].startTime);
      if (isPlaying) {
        playSceneAudio(scenes[prevIdx]);
      }
    } else {
      setCurrentTime(0);
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      const nextIdx = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIdx);
      setCurrentTime(scenes[nextIdx].startTime);
      if (isPlaying) {
        playSceneAudio(scenes[nextIdx]);
      }
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    audioEngine.updateDuckingAtTime(val);
    const foundIdx = scenes.findIndex((s) => val >= s.startTime && val < s.endTime);
    if (foundIdx !== -1) {
      setCurrentSceneIndex(foundIdx);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMasterVolume(next ? 0 : volume);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => console.log(err));
      } else {
        document.exitFullscreen().catch((err) => console.log(err));
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleSelectLoop = (url: string) => {
    if (activeScene && onUpdateSceneVideoUrl) {
      onUpdateSceneVideoUrl(activeScene.id, url);
    } else if (onUpdateAllVideoUrls) {
      onUpdateAllVideoUrls(url);
    }
    setIsLoopMenuOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col bg-[#07090e] border-b border-zinc-800/80 group overflow-hidden h-full"
    >
      {/* Top Media Bar: Scene title, Aspect Ratio Switcher, Loop Picker & HUD Toggles */}
      <div className="px-4 py-2 bg-[#0a0d15]/90 backdrop-blur-md border-b border-zinc-800/60 flex items-center justify-between z-20 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-zinc-200">
              {activeScene ? activeScene.title : 'No Scenes Generated'}
            </span>
          </div>
          {activeScene && (
            <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400">
              {activeScene.videoGenerator}
            </span>
          )}
        </div>

        {/* Center / Right: Placeholder Loop Selector, Live Video Preview Toggle & Aspect Ratio */}
        <div className="flex items-center gap-2">
          {/* Placeholder Loop Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLoopMenuOpen(!isLoopMenuOpen)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer bg-[#101524] hover:bg-[#182035] text-amber-300 border border-amber-500/30"
              title="Select placeholder animation loop"
            >
              <Film className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">Loop:</span>
              <span className="truncate max-w-[100px] text-zinc-200">
                {SAMPLE_VIDEO_CLIPS.find((c) => c.url === activeScene?.videoUrl)?.label.split('(')[0] || 'Tears of Steel'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {isLoopMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-[#0a0d17] border border-cyan-500/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.9)] p-2 z-50 space-y-1">
                <div className="text-[10px] font-mono text-zinc-400 px-2 py-1 font-bold uppercase tracking-wider">
                  Select Video Loop
                </div>
                {SAMPLE_VIDEO_CLIPS.map((clip) => {
                  const isActive = activeScene?.videoUrl === clip.url;
                  return (
                    <button
                      key={clip.id}
                      onClick={() => handleSelectLoop(clip.url)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-1">{clip.label}</span>
                      {isActive && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}

                <div className="pt-1 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      setIsLoopMenuOpen(false);
                      setShowCustomUrlDialog(true);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono text-amber-400 hover:bg-amber-950/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Link className="w-3 h-3" />
                    <span>Custom Video URL...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Video Preview Toggle */}
          {setUseLiveVideoPreview && (
            <button
              onClick={() => setUseLiveVideoPreview(!useLiveVideoPreview)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                useLiveVideoPreview
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border-zinc-700/60'
              }`}
              title="Toggle between live open-source video loop and generative procedural canvas"
            >
              <Video className="w-3 h-3 text-cyan-400" />
              <span>{useLiveVideoPreview ? 'Live Loop (ON)' : 'Procedural'}</span>
            </button>
          )}

          {/* Automated Audio Ducking Monitor Badge & Tuning Popover */}
          <div className="relative">
            <button
              onClick={() => setShowDuckingPopover(!showDuckingPopover)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
                isDucking
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(255,170,0,0.3)]'
                  : 'bg-[#101420] text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
              title="Automated Audio Ducking: dynamically lowers background music during voiceover segments"
            >
              <Mic className={`w-3 h-3 ${isDucking ? 'text-amber-400 animate-bounce' : 'text-cyan-400'}`} />
              <span className="font-bold">{isDucking ? 'VO Ducked' : 'Auto-Duck'}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                  isDucking ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {isDucking ? '-13dB' : duckingConfig.enabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Ducking Tuning Popover */}
            {showDuckingPopover && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-72 bg-[#0c101d] border border-cyan-500/40 rounded-xl p-3 shadow-[0_12px_36px_rgba(0,0,0,0.95)] z-50 space-y-3 backdrop-blur-md text-xs font-mono"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Automated Audio Ducking</span>
                  </div>
                  <button
                    onClick={() => setShowDuckingPopover(false)}
                    className="text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Status Card */}
                <div className="p-2 rounded-lg bg-[#070912] border border-zinc-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-zinc-400">Current Status:</div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isDucking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                        }`}
                      />
                      <span className="text-white font-bold">
                        {isDucking
                          ? `Ducking Active (${activeVoiceSegment?.speaker || 'Voiceover'})`
                          : 'Monitoring Timestamps'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = !duckingConfig.enabled;
                      audioEngine.setDuckingConfig({ enabled: updated });
                      setDuckingConfigState(audioEngine.getDuckingConfig());
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      duckingConfig.enabled
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {duckingConfig.enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {/* Ducking Depth Presets */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 block">Ducking Attenuation Depth:</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: 'Mild (-8dB)', val: 0.38 },
                      { label: 'Standard (-13dB)', val: 0.22 },
                      { label: 'Deep (-18dB)', val: 0.12 },
                    ].map((preset) => {
                      const isSelected = Math.abs(duckingConfig.duckingGain - preset.val) < 0.05;
                      return (
                        <button
                          key={preset.label}
                          onClick={() => {
                            audioEngine.setDuckingConfig({ duckingGain: preset.val });
                            setDuckingConfigState(audioEngine.getDuckingConfig());
                          }}
                          className={`p-1.5 rounded text-[9px] text-center transition-colors cursor-pointer border ${
                            isSelected
                              ? 'border-amber-400/80 bg-amber-950/30 text-amber-300 font-bold'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Attack & Release Speeds */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                  <div>
                    <span className="block text-zinc-500">Attack Ramp:</span>
                    <span className="text-zinc-300 font-bold">250ms (Smooth)</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Release Decay:</span>
                    <span className="text-zinc-300 font-bold">600ms (Cinematic)</span>
                  </div>
                </div>

                {/* Active Scene Voiceover Timing info */}
                {activeScene?.voiceoverText && (
                  <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/20 text-[10px] text-zinc-300 space-y-1">
                    <div className="flex items-center justify-between text-cyan-400 font-bold">
                      <span>Scene #{activeScene.sceneNumber} Voiceover</span>
                      <span>{Math.round(activeScene.duration)}s Shot</span>
                    </div>
                    <p className="line-clamp-2 italic text-zinc-400 text-[9px]">
                      "{activeScene.voiceoverText}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Aspect Ratio Buttons */}
          <div className="flex items-center gap-0.5 bg-[#101420] p-0.5 rounded-lg border border-zinc-800 text-[11px] font-mono">
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                aspectRatio === '16:9'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              16:9
            </button>
            <button
              onClick={() => setAspectRatio('2.39:1')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                aspectRatio === '2.39:1'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              2.39:1
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                aspectRatio === '9:16'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              9:16
            </button>
          </div>

          <button
            onClick={() => setShowInfoHud(!showInfoHud)}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              showInfoHud ? 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500'
            }`}
            title="Toggle Director Info HUD"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hidden background video element for live video loop playback */}
      <video
        ref={videoRef}
        src={
          activeScene?.videoUrl ||
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
        }
        crossOrigin="anonymous"
        muted
        playsInline
        loop
        className="hidden"
      />

      {/* Main Canvas Viewport Container */}
      <div className="relative flex-1 flex items-center justify-center bg-black/90 p-2 sm:p-4 overflow-hidden min-h-[300px]">
        {scenes.length === 0 ? (
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-amber-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.15)]">
              <Film className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-zinc-200 mb-1">Canvas Engine Ready</h3>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Enter a story in the left panel and click &quot;Generate Video Engine&quot; to compile your
              cinematic storyboard shots with voiceover narration.
            </p>
          </div>
        ) : (
          <div
            className={`relative ${getAspectRatioClasses()} transition-all duration-300 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border border-zinc-800/80`}
          >
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className="w-full h-full object-contain bg-black cursor-pointer"
              onClick={togglePlay}
            />

            {/* Quick Play overlay button when paused and not testing transitions */}
            {!isPlaying && testingTransitionEffect === null && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center cursor-pointer transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-cyan-400/90 hover:bg-cyan-300 text-black flex items-center justify-center shadow-[0_0_30px_#00f0ff] transform hover:scale-105 transition-all">
                  <Play className="w-6 h-6 ml-1 fill-black" />
                </div>
              </div>
            )}

            {/* Active Transition Test Floating Banner */}
            {testingTransitionEffect !== null && (
              <div className="absolute top-4 left-4 bg-cyan-950/80 border border-cyan-400/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] pointer-events-none animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>
                  Testing Transition: <strong className="text-white">{testingTransitionEffect}</strong> (
                  {Math.round(testingProgress * 100)}%)
                </span>
              </div>
            )}

            {/* Top Left Live Character & Wardrobe HUD Badge */}
            {showInfoHud && activeScene?.characterName && testingTransitionEffect === null && (
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-[11px] font-mono text-zinc-200 flex items-center gap-2 pointer-events-none shadow-lg">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeScene.characterAccent || '#00f0ff' }}
                />
                <span className="font-bold text-white">{activeScene.characterName}</span>
                {activeScene.outfitName && (
                  <>
                    <span className="text-zinc-500">•</span>
                    <span className="text-cyan-300">{activeScene.outfitName}</span>
                  </>
                )}
              </div>
            )}

            {/* Top Right Live Camera Motion Badge */}
            {showInfoHud && activeScene && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-[11px] font-mono text-cyan-300 flex items-center gap-2 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>
                  CAMERA: {activeScene.cameraMotion.split(',')[0]} [
                  {activeScene.cameraIntensity || (activeScene.cameraSpeed ? `${activeScene.cameraSpeed.toFixed(1)}x` : '1.0x')}
                  ]
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Quick Transition Testing Dock */}
      <div className="px-4 py-2 bg-[#080b13] border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Test Transitions:</span>
          </span>
          <div className="flex items-center gap-1">
            {TRANSITION_EFFECTS.filter((t) => t.id !== 'None').map((tr) => (
              <button
                key={tr.id}
                onClick={() => handleTestTransition(tr.id)}
                disabled={testingTransitionEffect !== null}
                className="px-2.5 py-1 rounded-md bg-[#101422] hover:bg-[#182034] text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer disabled:opacity-50 text-[11px] flex items-center gap-1 shadow-sm"
                title={`Play 1.5s live preview of ${tr.label}`}
              >
                <span>⚡ {tr.id}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-zinc-400 hidden lg:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Real-time Shader Render Active</span>
        </div>
      </div>

      {/* Cinematic Media Player Controls Bar */}
      <div className="bg-[#0b0e17] px-4 py-3 border-t border-zinc-800/80 space-y-2 z-20">
        {/* Progress Bar / Scrubber with Scene Marker Notches */}
        <div className="relative flex items-center group/scrubber cursor-pointer">
          <input
            type="range"
            min="0"
            max={totalDuration || 1}
            step="0.05"
            value={currentTime}
            onChange={handleScrub}
            className="w-full h-2 bg-zinc-800/80 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />

          {/* Scene separator tick markers */}
          {scenes.map((s, idx) => {
            if (idx === 0) return null;
            const leftPct = (s.startTime / totalDuration) * 100;
            return (
              <div
                key={s.id}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 pointer-events-none"
                title={`Scene ${s.sceneNumber}: ${s.title}`}
              />
            );
          })}
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-zinc-300 pt-1">
          {/* Left: Playback buttons + Timecode */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevScene}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              title="Previous Scene"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-black" />
              )}
            </button>

            <button
              onClick={handleNextScene}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              title="Next Scene"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Time Display */}
            <div className="text-xs font-mono text-zinc-400 flex items-center gap-1 ml-2">
              <span className="text-cyan-300 font-semibold">{formatTime(currentTime)}</span>
              <span className="text-zinc-600">/</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Right: Subtitles, Loop, Volume, Fullscreen */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                showSubtitles
                  ? 'border-cyan-500/40 text-cyan-300 bg-cyan-950/20'
                  : 'border-zinc-800 text-zinc-500'
              }`}
              title="Toggle Subtitles"
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono hidden sm:inline">CC</span>
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                isLooping
                  ? 'border-amber-500/40 text-amber-300 bg-amber-950/20'
                  : 'border-zinc-800 text-zinc-500'
              }`}
              title="Toggle Loop Playback"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            {/* Volume slider */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button onClick={toggleMute} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  setIsMuted(false);
                  audioEngine.setMasterVolume(val);
                }}
                className="w-16 h-1 bg-zinc-800 rounded accent-cyan-400 cursor-pointer"
              />
            </div>

            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              title="Fullscreen View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom URL Dialog Modal */}
      {showCustomUrlDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b0e18] border border-cyan-500/30 rounded-xl p-4 w-full max-w-md shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Link className="w-4 h-4 text-cyan-400" />
              Custom Placeholder Video URL
            </h4>
            <p className="text-xs text-zinc-400">
              Paste any public direct MP4/WebM video URL to use as your live background preview loop:
            </p>
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://.../video.mp4"
              className="w-full bg-[#070911] border border-zinc-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomUrlDialog(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (customUrlInput.trim()) {
                    handleSelectLoop(customUrlInput.trim());
                    setShowCustomUrlDialog(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.3)]"
              >
                Apply Loop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
