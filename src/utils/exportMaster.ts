import { Scene, AspectRatio } from '../types';
import { renderCinematicFrame } from './canvasRenderer';
import { audioEngine } from './audioEngine';
import { generateSpeechWav } from './ttsSynthesizer';

export interface MasterExportConfig {
  resolutionPreset?: '1080p' | '720p' | '4k' | 'vertical';
  containerFormat?: 'mp4' | 'webm';
  aspectRatio: AspectRatio;
  frameRate?: number; // 24, 30, 60
  bitrateMbps?: number; // 4, 8, 16
  musicStyle: string;
  musicVolume?: number;
  voiceoverVolume?: number;
  ambientSfxStyle?: string;
  ambientSfxVolume?: number;
  includeAmbientSfx?: boolean;
  afrobeatBpm?: number;
  percussionIntensity?: number;
  logDrumBassBoost?: number;
  customAudioUrl?: string | null;
  includeSpeech?: boolean;
  includeMusic?: boolean;
  enableAudioDucking?: boolean;
  audioMasterVolume?: number; // 0.0 to 1.5
  burnInTimecode?: boolean;
  burnInSubtitles?: boolean;
  burnInSceneTitle?: boolean;
}

export interface ExportProgress {
  progress: number; // 0 to 100
  phase: string;
  currentScene: number;
  totalScenes: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  elapsedSecs: number;
  estimatedRemainingSecs: number;
  previewCanvas?: HTMLCanvasElement;
}

export interface ExportResult {
  videoUrl: string;
  blob: Blob;
  sizeBytes: number;
  durationSecs: number;
  mimeType: string;
  fileName: string;
}

/**
 * Preloads and decodes an audio URL (Data URL, Blob URL, or remote file) into an AudioBuffer.
 */
async function decodeAudioBuffer(audioCtx: AudioContext, url: string): Promise<AudioBuffer | null> {
  try {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.warn('Failed to decode audio buffer:', err);
    return null;
  }
}

/**
 * Formats seconds into SMPTE Timecode (HH:MM:SS:FF)
 */
function formatSMPTETimecode(seconds: number, fps: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * fps);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
}

export async function exportMasterVideo(
  scenes: Scene[],
  config: MasterExportConfig,
  onProgress: (info: ExportProgress) => void
): Promise<ExportResult> {
  if (!scenes || scenes.length === 0) {
    throw new Error('No scenes available to export.');
  }

  const {
    aspectRatio,
    musicStyle,
    containerFormat = 'mp4',
    resolutionPreset = '1080p',
    frameRate = 24,
    bitrateMbps = 8,
    musicVolume = 0.35,
    voiceoverVolume = 1.0,
    ambientSfxStyle = 'Neon Rain & Thunder',
    ambientSfxVolume = 0.28,
    includeAmbientSfx = true,
    afrobeatBpm = 108,
    percussionIntensity = 0.85,
    logDrumBassBoost = 0.80,
    customAudioUrl = null,
    includeSpeech = true,
    includeMusic = true,
    enableAudioDucking = true,
    audioMasterVolume = 1.0,
    burnInTimecode = true,
    burnInSubtitles = true,
    burnInSceneTitle = false,
  } = config;

  // 1. Calculate resolution dimensions
  let width = 1920;
  let height = 1080;

  if (resolutionPreset === '4k') {
    width = 3840;
    height = aspectRatio === '2.39:1' ? Math.round(3840 / 2.39) : 2160;
  } else if (resolutionPreset === '720p') {
    width = 1280;
    height = aspectRatio === '2.39:1' ? Math.round(1280 / 2.39) : 720;
  } else if (resolutionPreset === 'vertical' || aspectRatio === '9:16') {
    width = 1080;
    height = 1920;
  } else {
    // 1080p
    width = 1920;
    height = aspectRatio === '2.39:1' ? Math.round(1920 / 2.39) : 1080;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) {
    throw new Error('Could not create off-screen canvas context for video export.');
  }

  onProgress({
    progress: 2,
    phase: 'Initializing 3-Track Audio Multiplexing Subsystem...',
    currentScene: 1,
    totalScenes: scenes.length,
    currentFrame: 0,
    totalFrames: 0,
    fps: frameRate,
    elapsedSecs: 0,
    estimatedRemainingSecs: 0,
    previewCanvas: canvas,
  });

  // 2. Audio Engine Setup & Buffer Preloading
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const audioDest = audioCtx.createMediaStreamDestination();

  // Master Gain Node for Video Audio Track
  const exportMasterGain = audioCtx.createGain();
  exportMasterGain.gain.setValueAtTime(audioMasterVolume, audioCtx.currentTime);
  exportMasterGain.connect(audioDest);

  // Pre-load / synthesize audio buffers for each scene
  const sceneAudioBuffers: (AudioBuffer | null)[] = [];
  const sceneAudioDurations: number[] = [];

  if (includeSpeech) {
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      let buf: AudioBuffer | null = null;
      let duration = s.audioDuration || 0;

      onProgress({
        progress: 3 + Math.round((i / scenes.length) * 12),
        phase: `Preparing Voiceover Stem for Scene ${i + 1}/${scenes.length}...`,
        currentScene: i + 1,
        totalScenes: scenes.length,
        currentFrame: 0,
        totalFrames: 0,
        fps: frameRate,
        elapsedSecs: 0,
        estimatedRemainingSecs: 0,
        previewCanvas: canvas,
      });

      if (s.audioUrl) {
        buf = await decodeAudioBuffer(audioCtx, s.audioUrl);
        if (buf) duration = buf.duration;
      } else if (s.voiceoverText?.trim()) {
        try {
          const ttsRes = generateSpeechWav(s.voiceoverText, {
            voiceActor: s.voiceActor,
            pitch: s.voicePitch,
            rate: s.voiceRate,
            volume: (s.audioVolume ?? 1.0) * voiceoverVolume,
          });
          buf = await decodeAudioBuffer(audioCtx, ttsRes.audioUrl);
          if (buf) duration = buf.duration;
        } catch (e) {
          console.warn('TTS on-the-fly synthesis failed:', e);
        }
      }

      sceneAudioBuffers.push(buf);
      sceneAudioDurations.push(duration);
    }
  } else {
    scenes.forEach(() => {
      sceneAudioBuffers.push(null);
      sceneAudioDurations.push(0);
    });
  }

  // Calculate synchronized scene durations (audio-first pacing)
  const syncedSceneDurations = scenes.map((s, idx) => {
    const speechDur = sceneAudioDurations[idx];
    if (speechDur > 0) {
      if (speechDur > s.duration) {
        return speechDur + 0.5; // +0.5s breathing padding
      } else {
        return Math.min(s.duration, speechDur + 0.5);
      }
    }
    return s.duration;
  });

  const totalDuration = syncedSceneDurations.reduce((acc, d) => acc + d, 0);
  const totalFrames = Math.max(1, Math.round(totalDuration * frameRate));
  const frameDuration = 1 / frameRate;

  // 3A. Stem 2: Rhythmic Afrobeat / Background Music Synthesizer in Audio Stream
  let musicGainNode: GainNode | null = null;
  let afrobeatExportTimer: number | null = null;
  if (includeMusic && musicStyle !== 'None') {
    const musicGain = audioCtx.createGain();
    musicGain.gain.setValueAtTime(musicVolume, audioCtx.currentTime);
    musicGain.connect(exportMasterGain);
    musicGainNode = musicGain;

    const now = audioCtx.currentTime;
    if (musicStyle === 'Custom Track' && customAudioUrl) {
      const customBuf = await decodeAudioBuffer(audioCtx, customAudioUrl);
      if (customBuf) {
        const src = audioCtx.createBufferSource();
        src.buffer = customBuf;
        src.loop = true;
        src.connect(musicGain);
        src.start(now);
      }
    } else if (musicStyle === 'Afrobeat Groove' || musicStyle === 'Afro-Cyberpunk Fusion') {
      const isCyber = musicStyle === 'Afro-Cyberpunk Fusion';
      // Underlying warm pad
      [110, 164.81, 196.0].forEach((freq) => {
        const osc = audioCtx.createOscillator();
        const padGain = audioCtx.createGain();
        padGain.gain.setValueAtTime(0.14, now);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(padGain);
        padGain.connect(musicGain);
        osc.start(now);
      });

      // Live poly-rhythmic Afrobeat step trigger during export
      const stepMs = Math.round((60 / afrobeatBpm / 4) * 1000);
      const claveSteps = new Set([0, 3, 6, 10, 12]);
      const bassSteps: Record<number, number> = { 0: 55, 3: 55, 7: 65.41, 10: 73.42, 14: 82.41 };
      const melodySteps: Record<number, number> = { 2: 220, 5: 261.63, 8: 293.66, 11: 329.63, 15: 392 };
      let stepIdx = 0;

      afrobeatExportTimer = window.setInterval(() => {
        if (audioCtx.state === 'closed') return;
        const t = audioCtx.currentTime;
        const s = stepIdx % 16;

        // Log-drum sub bass
        if (bassSteps[s]) {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = isCyber ? 'sawtooth' : 'sine';
          osc.frequency.setValueAtTime(bassSteps[s] * 2.2, t);
          osc.frequency.exponentialRampToValueAtTime(bassSteps[s], t + 0.045);
          g.gain.setValueAtTime(0.35 + logDrumBassBoost * 0.4, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          osc.connect(g);
          g.connect(musicGain);
          osc.start(t);
          osc.stop(t + 0.30);
        }

        // Clave rimshot
        if (claveSteps.has(s)) {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(s === 0 ? 880 : 740, t);
          osc.frequency.exponentialRampToValueAtTime(420, t + 0.035);
          g.gain.setValueAtTime(0.24 * percussionIntensity, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          osc.connect(g);
          g.connect(musicGain);
          osc.start(t);
          osc.stop(t + 0.055);
        }

        // Highlife pluck
        if (melodySteps[s]) {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = isCyber ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(melodySteps[s], t);
          g.gain.setValueAtTime(0.18, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          osc.connect(g);
          g.connect(musicGain);
          osc.start(t);
          osc.stop(t + 0.24);
        }

        stepIdx = (stepIdx + 1) % 16;
      }, stepMs);
    } else if (musicStyle === 'Synthwave Pulse') {
      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.connect(musicGain);
      osc.start(now);
    } else if (musicStyle === 'Orchestral Drama') {
      [65.41, 130.81, 196.0].forEach((freq) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(musicGain);
        osc.start(now);
      });
    } else {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(82.41, now);
      osc.connect(musicGain);
      osc.start(now);
    }
  }

  // 3B. Stem 3: Ambient Foley & Environmental SFX Stream
  if (includeAmbientSfx && ambientSfxStyle && ambientSfxStyle !== 'None') {
    const sfxGain = audioCtx.createGain();
    sfxGain.gain.setValueAtTime(ambientSfxVolume, audioCtx.currentTime);
    sfxGain.connect(exportMasterGain);

    const bufLen = audioCtx.sampleRate * 2;
    const noiseBuf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08;
    }
    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(ambientSfxStyle === 'Deep Space Telemetry' ? 220 : 1200, audioCtx.currentTime);
    noiseSrc.connect(filter);
    filter.connect(sfxGain);
    noiseSrc.start(audioCtx.currentTime);
  }

  // 4. Setup Combined MediaStream and MediaRecorder (supporting MP4 or WebM preference)
  const canvasStream = canvas.captureStream(frameRate);
  const combinedStream = new MediaStream();

  canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
  audioDest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));

  let mimeType = 'video/webm;codecs=vp9,opus';
  if (containerFormat === 'mp4') {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
      mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      mimeType = 'video/webm;codecs=vp9,opus';
    }
  } else {
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      mimeType = 'video/webm;codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      mimeType = 'video/webm;codecs=vp8,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: bitrateMbps * 1000000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start(100);

  // 5. Frame-by-Frame Rendering and Audio Synchronization Loop
  const startTimeMs = Date.now();
  let currentSceneIdx = 0;
  let timeInCurrentScene = 0;
  let hasTriggeredSceneAudio = false;

  for (let frame = 0; frame < totalFrames; frame++) {
    const currentScene = scenes[currentSceneIdx];
    const currentSyncedDuration = syncedSceneDurations[currentSceneIdx];
    const transitionDuration = 0.75;
    let transitionProgress = 0;
    const timeRemaining = currentSyncedDuration - timeInCurrentScene;

    // Trigger audio buffer playback on entering a new scene
    if (!hasTriggeredSceneAudio) {
      const audioBuf = sceneAudioBuffers[currentSceneIdx];
      if (audioBuf && includeSpeech) {
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuf;

        const sceneVoiceGain = audioCtx.createGain();
        sceneVoiceGain.gain.setValueAtTime((currentScene.audioVolume ?? 1.0) * voiceoverVolume, audioCtx.currentTime);
        source.connect(sceneVoiceGain);
        sceneVoiceGain.connect(exportMasterGain);

        source.start();

        // Apply audio ducking to music
        if (musicGainNode && enableAudioDucking) {
          musicGainNode.gain.setTargetAtTime(musicVolume * 0.22, audioCtx.currentTime, 0.15);
          setTimeout(() => {
            if (musicGainNode) {
              musicGainNode.gain.setTargetAtTime(musicVolume, audioCtx.currentTime, 0.4);
            }
          }, audioBuf.duration * 1000);
        }
      }
      hasTriggeredSceneAudio = true;
    }

    // Transition progress calculation
    if (currentSceneIdx < scenes.length - 1 && timeRemaining <= transitionDuration) {
      transitionProgress = 1 - timeRemaining / transitionDuration;
    } else if (timeInCurrentScene < 0.25 && currentSceneIdx > 0) {
      transitionProgress = 1 - timeInCurrentScene / 0.25;
    }

    // Video frame rendering via cinematic engine
    const effectiveTimeInScene =
      timeInCurrentScene > currentScene.duration
        ? Math.max(0, currentScene.duration - 0.05)
        : timeInCurrentScene;

    renderCinematicFrame(ctx, width, height, {
      scene: currentScene,
      nextScene: scenes[currentSceneIdx + 1],
      timeInScene: effectiveTimeInScene,
      transitionProgress,
      aspectRatio,
      showSubtitles: burnInSubtitles,
      isExporting: true,
    });

    // 6. Optional Burn-In Overlays (SMPTE Timecode & Scene Title)
    if (burnInTimecode) {
      const currentGlobalSecs = frame * frameDuration;
      const tcString = formatSMPTETimecode(currentGlobalSecs, frameRate);

      ctx.save();
      ctx.font = `bold ${Math.max(13, Math.round(height * 0.022))}px monospace`;
      const padX = width * 0.025;
      const padY = height * 0.045;

      // Dark translucent pill backing
      const textWidth = ctx.measureText(`TC ${tcString}`).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.roundRect(width - padX - textWidth - 16, padY - 18, textWidth + 24, 26, 6);
      ctx.fill();

      // Glowing timecode numerals
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`TC ${tcString}`, width - padX - textWidth - 4, padY);
      ctx.restore();
    }

    if (burnInSceneTitle) {
      ctx.save();
      ctx.font = `600 ${Math.max(12, Math.round(height * 0.02))}px sans-serif`;
      const padX = width * 0.025;
      const padY = height * 0.045;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      const sceneLabel = `SCENE ${String(currentScene.sceneNumber).padStart(2, '0')}: ${currentScene.title}`;
      const textWidth = ctx.measureText(sceneLabel).width;
      ctx.beginPath();
      ctx.roundRect(padX - 8, padY - 18, textWidth + 18, 26, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(sceneLabel, padX, padY);
      ctx.restore();
    }

    // Advance timeline time
    timeInCurrentScene += frameDuration;
    if (timeInCurrentScene >= currentSyncedDuration && currentSceneIdx < scenes.length - 1) {
      currentSceneIdx++;
      timeInCurrentScene = 0;
      hasTriggeredSceneAudio = false;
    }

    // Progress updates & UI loop yielding
    const pct = Math.min(99, Math.round(((frame + 1) / totalFrames) * 100));
    const elapsedSecs = (Date.now() - startTimeMs) / 1000;
    const estTotalSecs = elapsedSecs / (Math.max(1, frame) / totalFrames);
    const estRemainingSecs = Math.max(0, Math.round(estTotalSecs - elapsedSecs));

    if (frame % 8 === 0 || frame === totalFrames - 1) {
      onProgress({
        progress: pct,
        phase: `Rendering Frame ${frame + 1}/${totalFrames} (Scene #${currentSceneIdx + 1}: ${currentScene.title})`,
        currentScene: currentSceneIdx + 1,
        totalScenes: scenes.length,
        currentFrame: frame + 1,
        totalFrames,
        fps: frameRate,
        elapsedSecs: Number(elapsedSecs.toFixed(1)),
        estimatedRemainingSecs: estRemainingSecs,
        previewCanvas: canvas,
      });

      // Yield briefly to event loop to allow video recorder to process buffer chunks
      await new Promise((r) => setTimeout(r, 2));
    }
  }

  onProgress({
    progress: 99,
    phase: 'Finalizing Video Container & Multiplexing Audio...',
    currentScene: scenes.length,
    totalScenes: scenes.length,
    currentFrame: totalFrames,
    totalFrames,
    fps: frameRate,
    elapsedSecs: (Date.now() - startTimeMs) / 1000,
    estimatedRemainingSecs: 0,
    previewCanvas: canvas,
  });

  // Stop recorder and cleanup audio context
  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      if (afrobeatExportTimer !== null) {
        clearInterval(afrobeatExportTimer);
      }
      const extension = containerFormat === 'mp4' ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: mimeType });
      const videoUrl = URL.createObjectURL(blob);
      const fileName = `StoryCast_Master_${resolutionPreset}_${frameRate}fps_${Date.now()}.${extension}`;

      try {
        audioCtx.close().catch(() => {});
      } catch (_) {}

      onProgress({
        progress: 100,
        phase: 'Export Complete! Ready for Screening & Download.',
        currentScene: scenes.length,
        totalScenes: scenes.length,
        currentFrame: totalFrames,
        totalFrames,
        fps: frameRate,
        elapsedSecs: (Date.now() - startTimeMs) / 1000,
        estimatedRemainingSecs: 0,
        previewCanvas: canvas,
      });

      resolve({
        videoUrl,
        blob,
        sizeBytes: blob.size,
        durationSecs: totalDuration,
        mimeType,
        fileName,
      });
    };

    recorder.onerror = (err) => {
      if (afrobeatExportTimer !== null) {
        clearInterval(afrobeatExportTimer);
      }
      try {
        audioCtx.close().catch(() => {});
      } catch (_) {}
      reject(err);
    };

    setTimeout(() => {
      recorder.stop();
    }, 250);
  });
}
