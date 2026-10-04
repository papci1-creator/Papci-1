// Web Audio API ambient music synthesizer & speech coordinator

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlayingMusic = false;
  private currentStyle = 'Cinematic Ambient';
  private oscNodes: OscillatorNode[] = [];
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private duckingTimeout: any = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.3;
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
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.05);
    }
  }

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
  }

  // Voice ducking: temporarily attenuates music when narrator speaks
  public duckMusic(duck: boolean) {
    if (!this.musicGain || !this.ctx) return;
    const target = duck ? 0.08 : 0.28;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.25);
  }

  // Synthesize and speak narration text using Web Speech API with specific voice persona, volume, pitch and speed
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

    // Pick best matched browser voice based on persona
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
      this.duckMusic(true);
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.duckMusic(false);
      this.activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.duckMusic(false);
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
    this.duckMusic(false);
  }
}

export const audioEngine = new AudioEngine();
