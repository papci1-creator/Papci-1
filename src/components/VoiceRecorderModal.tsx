import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Volume2,
  Download,
  Sparkles,
  Radio,
  FileAudio,
  Trash2,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Scene } from '../types';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  initialSceneId?: string;
  onSaveRecording: (
    sceneId: string,
    audioUrl: string,
    audioDuration: number,
    transcriptionText?: string,
    syncSceneDuration?: boolean
  ) => void;
  onClearRecording?: (sceneId: string) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  scenes,
  initialSceneId,
  onSaveRecording,
  onClearRecording,
}) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    initialSceneId || scenes[0]?.id || ''
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [syncSceneDuration, setSyncSceneDuration] = useState(true);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [audioInputLevel, setAudioInputLevel] = useState<number>(0);

  // Live Speech-to-Text Transcription State
  const [enableTranscription, setEnableTranscription] = useState(true);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Success Feedback
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Sync initial scene ID when modal opens or prop changes
  useEffect(() => {
    if (initialSceneId && scenes.some((s) => s.id === initialSceneId)) {
      setSelectedSceneId(initialSceneId);
    } else if (scenes.length > 0 && !scenes.some((s) => s.id === selectedSceneId)) {
      setSelectedSceneId(scenes[0]?.id || '');
    }
  }, [initialSceneId, scenes]);

  const activeScene = scenes.find((s) => s.id === selectedSceneId);

  // Clean up resources on unmount or modal close
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    setMicPermissionError(null);
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordedDuration(0);
    setRecordingSeconds(0);
    setTranscribedText('');
    setSavedSuccessMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Setup Web Audio API Analyzer for Visualizer Canvas
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;

      // Start Visualizer Loop
      startVisualizerAnimation(analyser);

      // Determine supported mime type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      const startTime = Date.now();

      recorder.onstop = () => {
        const totalDurationSecs = Math.max(0.5, (Date.now() - startTime) / 1000);
        const finalBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        const url = URL.createObjectURL(finalBlob);
        setRecordedBlob(finalBlob);
        setRecordedAudioUrl(url);
        setRecordedDuration(Number(totalDurationSecs.toFixed(2)));

        // Stop all tracks to turn off hardware mic LED
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      setIsPaused(false);

      // Elapsed Timer Interval
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 0.1);
      }, 100);

      // Initialize Speech-to-Text Transcription if enabled
      if (enableTranscription) {
        initSpeechRecognition();
      }
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setMicPermissionError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings to record voice.'
          : `Failed to access microphone: ${err.message || 'Unknown device error'}`
      );
    }
  };

  // Speech-to-Text Recognition Initializer
  const initSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.info('Web Speech Recognition API not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsTranscribing(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTranscribedText(transcript);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition warning:', e.error);
      };

      recognition.onend = () => {
        setIsTranscribing(false);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition startup error:', err);
    }
  };

  // Pause / Resume Recording
  const handleTogglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 0.1);
      }, 100);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  // Render Real-time Visualizer Canvas Loop
  const startVisualizerAnimation = (analyser: AnalyserNode) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Compute RMS volume for live meter
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      setAudioInputLevel(Math.min(100, Math.round((avg / 128) * 100)));

      const canvas = visualizerCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, width, height);

      const barCount = 36;
      const barWidth = (width / barCount) * 0.75;
      const gap = (width / barCount) * 0.25;

      for (let i = 0; i < barCount; i++) {
        const binIndex = Math.floor((i / barCount) * bufferLength);
        const val = dataArray[binIndex] || 0;
        const percent = val / 255;
        const barHeight = Math.max(4, percent * (height - 8));

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        // Gradient from cyan to purple to rose
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#00f0ff');
        grad.addColorStop(0.5, '#a855f7');
        grad.addColorStop(1, '#f43f5e');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }
    };

    draw();
  };

  // Toggle Preview Playback of Recorded Clip
  const handleTogglePreview = () => {
    if (!recordedAudioUrl) return;

    if (!previewAudioRef.current) {
      const audio = new Audio(recordedAudioUrl);
      previewAudioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingPreview(false);
        setPreviewProgress(0);
      };

      audio.onpause = () => {
        if (audio.currentTime >= audio.duration) {
          setIsPlayingPreview(false);
          setPreviewProgress(0);
        }
      };
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current.play().catch(console.warn);
      setIsPlayingPreview(true);
    }
  };

  // Save Recording & Assign to Scene
  const handleSaveToScene = () => {
    if (!selectedSceneId || !recordedAudioUrl) return;

    onSaveRecording(
      selectedSceneId,
      recordedAudioUrl,
      recordedDuration,
      transcribedText.trim() || undefined,
      syncSceneDuration
    );

    const sceneNum = activeScene ? activeScene.sceneNumber : '';
    setSavedSuccessMessage(
      `Voice recording (${recordedDuration}s) successfully assigned to Scene #${sceneNum}!`
    );

    setTimeout(() => {
      setSavedSuccessMessage(null);
    }, 3500);
  };

  // Download Recording as local file
  const handleDownloadFile = () => {
    if (!recordedBlob) return;
    const a = document.createElement('a');
    a.href = recordedAudioUrl!;
    const sceneNum = activeScene ? activeScene.sceneNumber : 'custom';
    a.download = `voiceover_scene_${sceneNum}_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Re-record (reset state)
  const handleResetRecording = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordedDuration(0);
    setRecordingSeconds(0);
    setIsPlayingPreview(false);
    setPreviewProgress(0);
    setTranscribedText('');
    setSavedSuccessMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0e18] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-[#0d1222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.25)]">
              <Mic className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                  Voice Recorder Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-[10px] text-rose-300 font-mono flex items-center gap-1 font-semibold">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-rose-400" />
                  Live Mic Audio
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Record your voice, transcribe speech, and sync directly to scene storyboards
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

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar text-zinc-200">
          {/* Target Scene Selector */}
          <div className="bg-[#080b14] border border-zinc-800 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target Scene to Voice:</span>
              </label>
              {activeScene?.audioUrl && (
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Scene has recorded audio ({activeScene.audioDuration || 0}s)
                </span>
              )}
            </div>

            <select
              value={selectedSceneId}
              onChange={(e) => {
                setSelectedSceneId(e.target.value);
                handleResetRecording();
              }}
              disabled={isRecording}
              className="w-full bg-[#0d1222] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
            >
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  Scene #{scene.sceneNumber}: {scene.title} ({scene.duration}s) {scene.audioUrl ? '• [Voice Recorded]' : ''}
                </option>
              ))}
            </select>

            {/* Current Scene Context Script Pill */}
            {activeScene && (
              <div className="mt-2 p-2.5 rounded-lg bg-[#0c101d] border border-zinc-800/80 text-xs">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
                  <span className="text-cyan-300 font-bold">SCRIPT / DIALOGUE REFERENCE:</span>
                  <span>{activeScene.duration}s duration</span>
                </div>
                <p className="text-zinc-300 italic font-sans text-xs leading-relaxed">
                  {activeScene.voiceoverText?.trim() ? (
                    `"${activeScene.voiceoverText}"`
                  ) : (
                    <span className="text-zinc-500 not-italic">
                      No dialogue text entered yet. Read aloud freely, and live transcription will capture it!
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Microphone Permission Warning Banner */}
          {micPermissionError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <MicOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Microphone Access Notice</p>
                <p className="text-[11px] text-rose-300/90 mt-0.5 leading-relaxed">
                  {micPermissionError}
                </p>
              </div>
            </div>
          )}

          {/* Real-time Waveform Canvas & Recording Status Box */}
          <div className="bg-[#060913] border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Top Status & Timer Bar */}
            <div className="w-full flex items-center justify-between text-xs font-mono mb-3 px-2">
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>{isPaused ? 'PAUSED' : 'RECORDING...'}</span>
                  </span>
                ) : recordedAudioUrl ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>RECORDING READY ({recordedDuration}s)</span>
                  </span>
                ) : (
                  <span className="text-zinc-500">READY TO RECORD</span>
                )}
              </div>

              {/* Live Timer Readout */}
              <div className="text-lg font-bold font-mono text-cyan-300">
                {isRecording
                  ? `${Math.floor(recordingSeconds / 60)
                      .toString()
                      .padStart(2, '0')}:${(recordingSeconds % 60)
                      .toFixed(1)
                      .padStart(4, '0')}`
                  : recordedDuration > 0
                  ? `00:${recordedDuration.toFixed(1).padStart(4, '0')}`
                  : '00:00.0'}
              </div>

              {/* Mic Input Level Gauge */}
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3 h-3 text-zinc-500" />
                <div className="w-14 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                    style={{ width: `${isRecording && !isPaused ? audioInputLevel : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Visualizer Canvas Area */}
            <div className="w-full h-24 relative rounded-xl overflow-hidden bg-[#070b16] border border-zinc-850 flex items-center justify-center">
              <canvas
                ref={visualizerCanvasRef}
                width={560}
                height={96}
                className={`w-full h-full object-cover transition-opacity ${
                  isRecording && !isPaused ? 'opacity-100' : 'opacity-25'
                }`}
              />

              {!isRecording && !recordedAudioUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-xs">
                  <Mic className="w-6 h-6 mb-1 text-zinc-600" />
                  <span>Press Record to capture microphone audio</span>
                </div>
              )}

              {/* Recorded Audio Playback Overlay if finished recording */}
              {recordedAudioUrl && !isRecording && (
                <div className="absolute inset-0 bg-[#070b16]/90 flex items-center justify-center gap-4 px-6">
                  <button
                    onClick={handleTogglePreview}
                    className="w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-transform hover:scale-105 cursor-pointer"
                    title={isPlayingPreview ? 'Pause audio preview' : 'Play audio preview'}
                  >
                    {isPlayingPreview ? (
                      <Pause className="w-5 h-5 fill-black" />
                    ) : (
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>Preview Voice Clip</span>
                      <span className="text-cyan-300 font-bold">{recordedDuration}s</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full transition-all duration-100"
                        style={{ width: `${previewProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recording Action Buttons Toolbar */}
            <div className="mt-4 flex items-center gap-3">
              {!isRecording && !recordedAudioUrl && (
                <button
                  onClick={handleStartRecording}
                  className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all cursor-pointer hover:scale-105"
                >
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  <span>START RECORDING</span>
                </button>
              )}

              {isRecording && (
                <>
                  <button
                    onClick={handleTogglePause}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
                  </button>

                  <button
                    onClick={handleStopRecording}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>STOP & PREVIEW</span>
                  </button>
                </>
              )}

              {recordedAudioUrl && !isRecording && (
                <button
                  onClick={handleResetRecording}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-record</span>
                </button>
              )}
            </div>
          </div>

          {/* Speech-to-Text Transcription Panel */}
          <div className="bg-[#080b14] border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Speech-to-Text Transcription</span>
              </label>

              <label className="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTranscription}
                  onChange={(e) => setEnableTranscription(e.target.checked)}
                  disabled={isRecording}
                  className="rounded accent-cyan-400 cursor-pointer"
                />
                <span>Auto-transcribe as you speak</span>
              </label>
            </div>

            <textarea
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder={
                isRecording
                  ? 'Transcribing your voice in real time...'
                  : 'Spoken transcription will appear here. You can also edit this text to update scene narration.'
              }
              rows={2}
              className="w-full bg-[#0d1222] border border-zinc-700/80 rounded-lg p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 font-sans resize-none"
            />
            {isTranscribing && (
              <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Transcribing microphone input...
              </span>
            )}
          </div>

          {/* Options: Auto-sync Scene Duration */}
          <div className="bg-[#080b14] border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  Auto-sync Scene Duration to Voice Length
                </p>
                <p className="text-[10px] text-zinc-500">
                  Adjusts the scene duration so video pacing matches your spoken cadence (+0.5s padding)
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={syncSceneDuration}
              onChange={(e) => setSyncSceneDuration(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Success Notification Banner */}
          {savedSuccessMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{savedSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-[#0d1222] flex items-center justify-between">
          <div>
            {activeScene?.audioUrl && onClearRecording && (
              <button
                onClick={() => {
                  onClearRecording(selectedSceneId);
                  handleResetRecording();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Remove recorded audio and revert to synthetic voiceover"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Scene Audio</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {recordedBlob && (
              <button
                onClick={handleDownloadFile}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download raw recorded audio file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .webm</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>

            <button
              onClick={handleSaveToScene}
              disabled={!recordedAudioUrl || isRecording}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>SAVE & ASSIGN TO SCENE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
