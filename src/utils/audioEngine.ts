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

type StepListener = (step: number, isPlaying: boolean) => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlayingMusic = false;
  private currentStyle = 'Cinematic Ambient';
  private currentSfxStyle = 'Neon Rain & Thunder';
  private oscNodes: OscillatorNode[] = [];
  private sfxNodes: AudioNode[] = [];
  private rhythmTimer: number | null = null;
  private currentStep: number = 0;
  private customMusicAudio: HTMLAudioElement | null = null;
  private customAudioUrl: string | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  // Afrobeat & Multi-Track Parameters
  private afrobeatBpm: number = 108;
  private percussionIntensity: number = 0.85;
  private logDrumBassBoost: number = 0.80;
  private nominalSfxVolume: number = 0.28;
  private voiceoverMasterVolume: number = 1.0;
  private stepListeners: Set<StepListener> = new Set();

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
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.nominalMusicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.nominalSfxVolume;
      this.sfxGain.connect(this.masterGain);

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
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.2, val)), this.ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(val: number) {
    this.nominalMusicVolume = Math.max(0, Math.min(1, val));
    if (!this.isDuckingActive && this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.nominalMusicVolume, this.ctx.currentTime, 0.05);
    }
    if (this.customMusicAudio) {
      this.customMusicAudio.volume = this.nominalMusicVolume;
    }
  }

  public getMusicVolume(): number {
    return this.nominalMusicVolume;
  }

  public setSfxVolume(val: number) {
    this.nominalSfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.nominalSfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getSfxVolume(): number {
    return this.nominalSfxVolume;
  }

  public setVoiceoverMasterVolume(val: number) {
    this.voiceoverMasterVolume = Math.max(0, Math.min(1.2, val));
  }

  public getVoiceoverMasterVolume(): number {
    return this.voiceoverMasterVolume;
  }

  public setAfrobeatParams(params: { bpm?: number; percussionIntensity?: number; logDrumBassBoost?: number }) {
    if (params.bpm !== undefined) this.afrobeatBpm = Math.max(80, Math.min(150, params.bpm));
    if (params.percussionIntensity !== undefined) this.percussionIntensity = Math.max(0, Math.min(1, params.percussionIntensity));
    if (params.logDrumBassBoost !== undefined) this.logDrumBassBoost = Math.max(0, Math.min(1, params.logDrumBassBoost));

    // If currently playing Afrobeat, restart loop with updated BPM
    if (this.isPlayingMusic && (this.currentStyle === 'Afrobeat Groove' || this.currentStyle === 'Afro-Cyberpunk Fusion')) {
      this.startMusic(this.currentStyle);
    }
  }

  public setCustomAudioUrl(url: string | null) {
    this.customAudioUrl = url;
  }

  public onStepChange(listener: StepListener): () => void {
    this.stepListeners.add(listener);
    return () => this.stepListeners.delete(listener);
  }

  private notifyStep(step: number, isPlaying: boolean) {
    this.stepListeners.forEach((l) => {
      try {
        l(step, isPlaying);
      } catch (_) {}
    });
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
   * Automatically calculates and registers ducking schedule based on updated scenes.
   */
  public updateDuckingScheduleFromScenes(scenes: Scene[]): VoiceoverSegment[] {
    const segments = this.calculateVoiceoverSegments(scenes);
    this.setDuckingSchedule(segments);
    return segments;
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
  // Afrobeat & Poly-Rhythmic Drum / Groove Primitives
  // ==========================================

  private triggerLogDrum(freq: number, isCyber: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isCyber ? 'sawtooth' : 'sine';
    // Classic Afrobeat / Amapiano log drum pitch knock envelope
    osc.frequency.setValueAtTime(freq * 2.4, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.045);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.75, now + 0.28);

    const boost = 0.35 + this.logDrumBassBoost * 0.45;
    gain.gain.setValueAtTime(boost, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isCyber ? 520 : 280, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.34);
  }

  private triggerClaveRimshot(accent: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // West African woodblock / rimshot tone
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(accent ? 880 : 740, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.035);

    const level = (accent ? 0.28 : 0.18) * this.percussionIntensity;
    gain.gain.setValueAtTime(Math.max(0.01, level), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  private triggerShaker(accent: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.045);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(6500, now);
    filter.Q.setValueAtTime(2.2, now);

    const gain = this.ctx.createGain();
    const level = (accent ? 0.22 : 0.10) * this.percussionIntensity;
    gain.gain.setValueAtTime(Math.max(0.005, level), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(now);
  }

  private triggerMelodicPluck(freq: number, isCyber: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = isCyber ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isCyber ? 1800 : 1100, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.22);

    gain.gain.setValueAtTime(0.20, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  // ==========================================
  // Ambient SFX Layer Synthesizer
  // ==========================================

  public startAmbientSfx(sfxStyle: string) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    this.stopAmbientSfx();
    this.currentSfxStyle = sfxStyle;
    if (!sfxStyle || sfxStyle === 'None') return;

    const now = this.ctx.currentTime;
    try {
      // Create 2-second looping pink/brown noise buffer for atmospheric texture
      const bufLen = this.ctx.sampleRate * 2;
      const noiseBuf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const output = noiseBuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufLen; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuf;
      noiseNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      if (sfxStyle === 'Neon Rain & Thunder') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.Q.setValueAtTime(0.7, now);
      } else if (sfxStyle === 'Lagos Night Pulse') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2400, now);
        filter.Q.setValueAtTime(1.8, now);
      } else if (sfxStyle === 'Deep Space Telemetry') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now);
      } else if (sfxStyle === 'Desert Wind') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(520, now);
        filter.Q.setValueAtTime(3.0, now);

        const windLfo = this.ctx.createOscillator();
        windLfo.frequency.setValueAtTime(0.2, now);
        const windLfoGain = this.ctx.createGain();
        windLfoGain.gain.setValueAtTime(280, now);
        windLfo.connect(windLfoGain);
        windLfoGain.connect(filter.frequency);
        windLfo.start();
        this.sfxNodes.push(windLfo);
      } else {
        // Vinyl Crackle
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1800, now);
      }

      noiseNode.connect(filter);
      filter.connect(this.sfxGain);
      noiseNode.start(now);
      this.sfxNodes.push(noiseNode, filter);
    } catch (e) {
      console.warn('Ambient SFX synthesis warning:', e);
    }
  }

  public stopAmbientSfx() {
    this.sfxNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
        node.disconnect();
      } catch (_) {}
    });
    this.sfxNodes = [];
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
      if (style === 'Custom Track' && this.customAudioUrl) {
        const audio = new Audio(this.customAudioUrl);
        audio.loop = true;
        audio.volume = this.nominalMusicVolume;
        this.customMusicAudio = audio;
        audio.play().catch((e) => console.warn('Custom track play error:', e));
        return;
      }

      if (style === 'Afrobeat Groove' || style === 'Afro-Cyberpunk Fusion') {
        const isCyber = style === 'Afro-Cyberpunk Fusion';

        // Warm underlying pad drone
        const padFilter = this.ctx.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(isCyber ? 420 : 320, now);

        const padGain = this.ctx.createGain();
        padGain.gain.setValueAtTime(0.16, now);

        [110, 164.81, 196.0].forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(padFilter);
          osc.start();
          this.oscNodes.push(osc);
        });
        padFilter.connect(padGain);
        padGain.connect(this.musicGain);

        // 16-step Afrobeat poly-rhythmic sequencer
        // Step duration in ms = (60 / BPM / 4) * 1000
        const stepMs = Math.round((60 / this.afrobeatBpm / 4) * 1000);
        // Classic West African 3-2 Afrobeat clave steps: 0, 3, 6, 10, 12
        const claveSteps = new Set([0, 3, 6, 10, 12]);
        // Syncopated Log-Drum bass steps: 0, 3, 7, 10, 14
        const bassSteps: Record<number, number> = {
          0: 55.0,    // A1
          3: 55.0,    // A1
          7: 65.41,   // C2
          10: 73.42,  // D2
          14: 82.41,  // E2
        };
        // Highlife / Afro-synth pentatonic pluck notes
        const melodySteps: Record<number, number> = {
          2: 220.0,   // A3
          5: 261.63,  // C4
          8: 293.66,  // D4
          11: 329.63, // E4
          15: 392.00, // G4
        };

        this.currentStep = 0;
        const tick = () => {
          if (!this.isPlayingMusic) return;
          const step = this.currentStep % 16;

          // 1. Log-drum sub bass
          if (bassSteps[step]) {
            this.triggerLogDrum(bassSteps[step], isCyber);
          }

          // 2. Syncopated Clave / Rimshot
          if (claveSteps.has(step)) {
            this.triggerClaveRimshot(step === 0 || step === 6);
          }

          // 3. Shekere / Shaker on every even step + syncopated 16ths
          if (step % 2 === 0 || step === 3 || step === 11 || step === 15) {
            this.triggerShaker(step % 4 === 2);
          }

          // 4. Highlife Guitar Pluck / Afro-Cyber Arpeggio
          if (melodySteps[step]) {
            this.triggerMelodicPluck(melodySteps[step], isCyber);
          }

          this.notifyStep(step, true);
          this.currentStep = (this.currentStep + 1) % 16;
        };

        tick();
        this.rhythmTimer = window.setInterval(tick, stepMs);
      } else if (style === 'Synthwave Pulse') {
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
    if (this.rhythmTimer !== null) {
      clearInterval(this.rhythmTimer);
      this.rhythmTimer = null;
    }
    if (this.customMusicAudio) {
      try {
        this.customMusicAudio.pause();
        this.customMusicAudio.currentTime = 0;
      } catch (_) {}
      this.customMusicAudio = null;
    }
    this.oscNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.oscNodes = [];
    this.isPlayingMusic = false;
    this.isDuckingActive = false;
    this.notifyStep(0, false);
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

  private activeAudioElement: HTMLAudioElement | null = null;

  public playAudioClip(
    url: string,
    volume: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    this.stopNarration();
    try {
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, volume));
      this.activeAudioElement = audio;

      audio.onplay = () => {
        this.isSpeechSpeaking = true;
        this.applyDuckingGain(this.duckingConfig.duckingGain);
        if (onStart) onStart();
      };

      const handleEnd = () => {
        this.isSpeechSpeaking = false;
        this.restoreMusicGain();
        this.activeAudioElement = null;
        if (onEnd) onEnd();
      };

      audio.onended = handleEnd;
      audio.onerror = handleEnd;
      audio.onpause = () => {
        if (this.activeAudioElement === audio && audio.currentTime >= audio.duration) {
          handleEnd();
        }
      };

      audio.play().catch((err) => {
        console.warn('Audio playback error:', err);
        handleEnd();
      });
    } catch (err) {
      console.warn('Failed to initialize audio element:', err);
      if (onEnd) onEnd();
    }
  }

  public stopAudioClip() {
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
        this.activeAudioElement.currentTime = 0;
      } catch (_) {}
      this.activeAudioElement = null;
    }
    this.isSpeechSpeaking = false;
    this.restoreMusicGain();
  }

  public stopNarration() {
    this.stopAudioClip();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterance = null;
    this.isSpeechSpeaking = false;
    this.restoreMusicGain();
  }
}

export const audioEngine = new AudioEngine();
