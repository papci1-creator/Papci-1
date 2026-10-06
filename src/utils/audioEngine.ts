// Web Audio API ambient music synthesizer & automated audio ducking coordinator
import { Scene } from '../types';

export interface VoiceoverSegment {
  id: string;
  sceneNumber: number;
  startTime: number; // in seconds from start of timeline
  endTime: number;   // in seconds from start of timeline
  duration: number;  // duration in seconds
  text: string;
  speaker?: string;
  duckingDepth?: number; // optional custom ducking depth (0.0 to 1.0, e.g. 0.20)
}

export interface DuckingConfig {
  enabled: boolean;
  duckingGain: number;      // Ratio of nominal volume during voiceover (e.g., 0.20 = 20% of volume / -14dB)
  attackDuration: number;   // Seconds to smoothly attenuate music when voiceover starts (e.g., 0.25s)
  releaseDuration: number;  // Seconds to smoothly restore music after voiceover ends (e.g., 0.60s)
  preRollPadding: number;   // Seconds before voiceover to start anticipating duck (e.g., 0.15s)
  postRollPadding: number;  // Seconds after voiceover to hold ducking before release (e.g., 0.35s)
}

type DuckingListener = (isDucking: boolean, currentGain: number, activeSegment: VoiceoverSegment | null) => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlayingMusic = false;
  private currentStyle = 'Cinematic Ambient';
  private oscNodes: OscillatorNode[] = [];
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  // Automated Audio Ducking Subsystem
  private duckingConfig: DuckingConfig = {
    enabled: true,
    duckingGain: 0.22,       // 22% of nominal volume (approx -13dB attenuation)
    attackDuration: 0.25,    // 250ms smooth fade down
    releaseDuration: 0.60,   // 600ms smooth cinematic swell back up
    preRollPadding: 0.15,    // 150ms pre-duck anticipation
    postRollPadding: 0.35,   // 350ms tail hold for natural speech cadence
  };

  private nominalMusicVolume: number = 0.35;
  private isDuckingActive: boolean = false;
  private isSpeechSpeaking: boolean = false;
  private voiceoverSegments: VoiceoverSegment[] = [];
  private activeSegment: VoiceoverSegment | null = null;
  private listeners: Set<DuckingListener> = new Set();

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.nominalMusicVolume;
      this.musicGain.connect(this.masterGain);

      this.destinationNode = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.destinationNode);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMediaStreamDestination(): MediaStreamAudioDestinationNode | null {
    this.initContext();
    return this.destinationNode;
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(val: number) {
    this.nominalMusicVolume = Math.max(0, Math.min(1, val));
    if (!this.isDuckingActive && this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.nominalMusicVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getMusicVolume(): number {
    return this.nominalMusicVolume;
  }

  // ==========================================
  // Automated Voiceover Timestamp Ducking Engine
  // ==========================================

  /**
   * Automatically calculates precise voiceover timestamps and duration windows
   * for each scene based on narrative word count and fine-tuned speech rate.
   */
  public calculateVoiceoverSegments(scenes: Scene[]): VoiceoverSegment[] {
    const segments: VoiceoverSegment[] = [];
    for (const scene of scenes) {
      const text = (scene.voiceoverText || '').trim();
      if (!text) continue;

      const words = text.split(/\s+/).length;
      const rate = scene.voiceRate ?? 1.0;
      // Standard voice actor delivery is ~135 words per minute
      // Adjusted by speech rate multiplier
      const estimatedDurationSecs = Math.max(
        1.8,
        Math.min(scene.duration - 0.25, (words / (135 * rate)) * 60)
      );

      // Pre-roll delay of 0.25s at scene start gives a natural cinematic breath
      const start = scene.startTime + 0.25;
      const end = Math.min(scene.endTime, start + estimatedDurationSecs);

      segments.push({
        id: scene.id,
        sceneNumber: scene.sceneNumber,
        startTime: start,
        endTime: end,
        duration: end - start,
        text,
        speaker: scene.characterName || scene.voiceActor,
      });
    }
    return segments;
  }

  /**
   * Registers a schedule of voiceover segments for automated timeline audio ducking.
   */
  public setDuckingSchedule(segments: VoiceoverSegment[]) {
    this.voiceoverSegments = [...segments].sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Evaluates the current timeline playback timestamp and automatically applies
   * dynamic audio ducking if the time falls within any voiceover segment.
   * Call this in your timeline playback loop or frame rendering loop.
   */
  public updateDuckingAtTime(currentTimelineTime: number) {
    if (!this.duckingConfig.enabled) {
      if (this.isDuckingActive) {
        this.restoreMusicGain(0.2);
      }
      return;
    }

    const { preRollPadding, postRollPadding } = this.duckingConfig;

    // Find any voiceover segment active at the current timestamp (including padding)
    const matchingSegment = this.voiceoverSegments.find((seg) => {
      const windowStart = seg.startTime - preRollPadding;
      const windowEnd = seg.endTime + postRollPadding;
      return currentTimelineTime >= windowStart && currentTimelineTime <= windowEnd;
    });

    const shouldDuck = !!matchingSegment || this.isSpeechSpeaking;

    if (shouldDuck && !this.isDuckingActive) {
      this.activeSegment = matchingSegment || null;
      this.applyDuckingGain(matchingSegment?.duckingDepth ?? this.duckingConfig.duckingGain);
    } else if (!shouldDuck && this.isDuckingActive) {
      this.activeSegment = null;
      this.restoreMusicGain();
    }
  }

  /**
   * Smoothly attenuates background music gain using an exponential/linear audio ramp.
   */
  private applyDuckingGain(duckRatio: number) {
    if (!this.musicGain || !this.ctx) return;
    this.isDuckingActive = true;

    const targetGain = this.nominalMusicVolume * duckRatio;
    const now = this.ctx.currentTime;
    const timeConstant = Math.max(0.04, this.duckingConfig.attackDuration / 2.5);

    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setTargetAtTime(targetGain, now, timeConstant);

    this.notifyListeners(true, targetGain);
  }

  /**
   * Smoothly restores background music gain back to nominal level.
   */
  private restoreMusicGain(customReleaseDuration?: number) {
    if (!this.musicGain || !this.ctx) return;
    this.isDuckingActive = false;

    const now = this.ctx.currentTime;
    const releaseTime = customReleaseDuration ?? this.duckingConfig.releaseDuration;
    const timeConstant = Math.max(0.05, releaseTime / 2.5);

    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setTargetAtTime(this.nominalMusicVolume, now, timeConstant);

    this.notifyListeners(false, this.nominalMusicVolume);
  }

  /**
   * Configure ducking parameters (e.g. gain depth, attack, release, enabled status).
   */
  public setDuckingConfig(updates: Partial<DuckingConfig>) {
    this.duckingConfig = { ...this.duckingConfig, ...updates };
  }

  public getDuckingConfig(): DuckingConfig {
    return { ...this.duckingConfig };
  }

  public getIsDuckingActive(): boolean {
    return this.isDuckingActive;
  }

  public getActiveVoiceoverSegment(): VoiceoverSegment | null {
    return this.activeSegment;
  }

  public onDuckingStateChange(listener: DuckingListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(isDucking: boolean, currentGain: number) {
    this.listeners.forEach((listener) => {
      try {
        listener(isDucking, currentGain, this.activeSegment);
      } catch (e) {
        console.error('Error in audio ducking listener:', e);
      }
    });
  }

  // ==========================================
  // Background Music Synthesizer
  // ==========================================

  public startMusic(style: string) {
    this.initContext();
    if (!this.ctx || !this.musicGain) return;

    this.stopMusic();
    this.currentStyle = style;
    if (style === 'None') return;

    this.isPlayingMusic = true;
    const now = this.ctx.currentTime;

    try {
      if (style === 'Synthwave Pulse') {
        // Deep pulsing 16th-note analog bass line
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);

        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(4, now); // 4Hz pulse
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(220, now);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        this.oscNodes.push(lfo);

        [55, 110, 164.81].forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(filter);
          osc.start();
          this.oscNodes.push(osc);
        });

        filter.connect(this.musicGain);
      } else if (style === 'Orchestral Drama') {
        // Heavy brass + dramatic string cluster
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);

        [65.41, 98.0, 130.81, 196.0].forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          // slight detune for cinematic orchestra thickness
          osc.detune.setValueAtTime((idx - 1.5) * 8, now);
          osc.connect(filter);
          osc.start();
          this.oscNodes.push(osc);
        });

        filter.connect(this.musicGain);
      } else if (style === 'Lo-fi Mystery') {
        // Nostalgic mellow chords with warble
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(420, now);
        filter.Q.setValueAtTime(1.5, now);

        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.35, now); // slow tape flutter
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(14, now);
        lfo.connect(lfoGain);

        [110, 138.59, 164.81, 220].forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          lfoGain.connect(osc.detune);
          osc.connect(filter);
          osc.start();
          this.oscNodes.push(osc);
        });
        lfo.start();
        this.oscNodes.push(lfo);

        filter.connect(this.musicGain);
      } else {
        // 'Cinematic Ambient' - default lush drone
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        [55, 82.41, 110, 164.81, 220].forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.detune.setValueAtTime((i - 2) * 5, now);
          osc.connect(filter);
          osc.start();
          this.oscNodes.push(osc);
        });

        filter.connect(this.musicGain);
      }
    } catch (e) {
      console.warn('Web Audio synthesis initialisation warning:', e);
    }
  }

  public stopMusic() {
    this.oscNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.oscNodes = [];
    this.isPlayingMusic = false;
    this.isDuckingActive = false;
  }

  // Legacy manual ducking hook
  public duckMusic(duck: boolean) {
    if (duck) {
      this.applyDuckingGain(this.duckingConfig.duckingGain);
    } else {
      this.restoreMusicGain();
    }
  }

  // ==========================================
  // Web Speech API Voiceover Narration
  // ==========================================

  public speakNarration(
    text: string,
    voiceProfile: string,
    onStart?: () => void,
    onEnd?: () => void,
    volume: number = 1.0,
    pitch?: number,
    rate?: number
  ) {
    this.stopNarration();
    if (!('speechSynthesis' in window)) {
      if (onStart) onStart();
      setTimeout(() => { if (onEnd) onEnd(); }, 3000);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = Math.max(0, Math.min(1, volume));

    // Base pitch and rate from persona profile
    let basePitch = 1.0;
    let baseRate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (voiceProfile.includes('British')) {
      selectedVoice = voices.find(v => v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('British')) || null;
      basePitch = 0.95;
      baseRate = 0.95;
    } else if (voiceProfile.includes('Female')) {
      selectedVoice = voices.find(v => (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Victoria')) && v.lang.startsWith('en')) || null;
      basePitch = 1.15;
      baseRate = 1.05;
    } else if (voiceProfile.includes('Whisper Noir')) {
      selectedVoice = voices.find(v => v.name.includes('Natural') || v.lang.startsWith('en')) || null;
      basePitch = 0.8;
      baseRate = 0.85;
    } else if (voiceProfile.includes('Epic Trailer') || voiceProfile.includes('Deep Narrator')) {
      selectedVoice = voices.find(v => (v.name.includes('David') || v.name.includes('Guy') || v.name.includes('Male')) && v.lang.startsWith('en')) || null;
      basePitch = 0.72;
      baseRate = 0.90;
    } else {
      selectedVoice = voices.find(v => v.lang.startsWith('en')) || null;
      basePitch = 1.0;
      baseRate = 1.0;
    }

    // Apply per-scene fine-tuned pitch and speed if provided, else use base persona
    utterance.pitch = pitch !== undefined ? Math.max(0.5, Math.min(2.0, pitch)) : basePitch;
    utterance.rate = rate !== undefined ? Math.max(0.5, Math.min(2.0, rate)) : baseRate;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      this.isSpeechSpeaking = true;
      this.applyDuckingGain(this.duckingConfig.duckingGain);
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeechSpeaking = false;
      this.restoreMusicGain();
      this.activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeechSpeaking = false;
      this.restoreMusicGain();
      this.activeUtterance = null;
      if (onEnd) onEnd();
    };

    this.activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stopNarration() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterance = null;
    this.isSpeechSpeaking = false;
    this.restoreMusicGain();
  }
}

export const audioEngine = new AudioEngine();
