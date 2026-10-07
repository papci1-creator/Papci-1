/**
 * Text-to-Speech Audio File Synthesizer & WAV Encoder
 * Generates playable 16-bit PCM RIFF WAVE audio files with formant synthesis,
 * prosody intonation, and voice persona models.
 */

export interface TTSOptions {
  voiceActor?: string;
  pitch?: number; // 0.6 to 1.4
  rate?: number; // 0.7 to 1.4
  volume?: number;
}

export interface TTSResult {
  audioUrl: string;
  duration: number; // in seconds
  words: number;
  sampleRate: number;
}

// Voice Persona Acoustic Profiles
interface VoiceProfile {
  baseF0: number; // Fundamental frequency in Hz
  formants: [number, number, number]; // F1, F2, F3 resonance in Hz
  vibratoRate: number;
  vibratoDepth: number;
  breathiness: number;
  nasality: number;
}

const VOICE_PROFILES: Record<string, VoiceProfile> = {
  'Marcus Vance': {
    baseF0: 115, // Deep resonant male
    formants: [480, 1150, 2400],
    vibratoRate: 5.2,
    vibratoDepth: 2.5,
    breathiness: 0.12,
    nasality: 0.08,
  },
  'Elena Rostova': {
    baseF0: 215, // Warm expressive female
    formants: [600, 1650, 2800],
    vibratoRate: 5.8,
    vibratoDepth: 3.5,
    breathiness: 0.16,
    nasality: 0.05,
  },
  'Orion Prime': {
    baseF0: 95, // Cybernetic robotic synthesized AI
    formants: [400, 950, 2100],
    vibratoRate: 8.0,
    vibratoDepth: 1.0,
    breathiness: 0.05,
    nasality: 0.25,
  },
  'Zara Thorne': {
    baseF0: 235, // Energetic articulate female
    formants: [650, 1800, 2950],
    vibratoRate: 6.0,
    vibratoDepth: 4.0,
    breathiness: 0.14,
    nasality: 0.06,
  },
  'Kaelen Vox': {
    baseF0: 160, // Clear androgynous neutral tone
    formants: [540, 1400, 2600],
    vibratoRate: 5.5,
    vibratoDepth: 2.8,
    breathiness: 0.13,
    nasality: 0.1,
  },
};

/**
 * Generates an actual audio file (WAV Data URL) from spoken text.
 */
export function generateSpeechWav(text: string, options: TTSOptions = {}): TTSResult {
  const cleanText = text.trim();
  const words = cleanText ? cleanText.split(/\s+/) : ['...'];
  const wordsCount = words.length;

  const rate = Math.max(0.6, Math.min(1.5, options.rate ?? 1.0));
  const pitchMult = Math.max(0.6, Math.min(1.5, options.pitch ?? 1.0));
  const voiceName = options.voiceActor || 'Marcus Vance';
  const profile =
    VOICE_PROFILES[voiceName] ||
    (voiceName.toLowerCase().includes('female')
      ? VOICE_PROFILES['Elena Rostova']
      : VOICE_PROFILES['Marcus Vance']);

  const sampleRate = 22050; // Standard broadcast audio rate

  // Calculate duration: ~135 wpm standard speech cadence
  // Add pauses for punctuation (commas, periods, colons, ellipses)
  const punctuationPauses =
    (cleanText.match(/[,;:]/g)?.length || 0) * 0.25 +
    (cleanText.match(/[.!?]/g)?.length || 0) * 0.45;
  const rawDuration = (wordsCount / (135 * rate)) * 60 + punctuationPauses + 0.4;
  const duration = Math.max(1.8, Math.min(30, rawDuration));
  const numSamples = Math.floor(sampleRate * duration);

  const samples = new Float32Array(numSamples);

  const f0 = profile.baseF0 * pitchMult;
  const [f1, f2, f3] = profile.formants;

  let currentPhase = 0;
  const syllableDuration = 0.22 / rate;
  const totalSyllables = Math.max(2, Math.round(wordsCount * 1.45));

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Determine current syllable index and envelope
    const syllableIndex = Math.floor(t / syllableDuration);
    const syllableProgress = (t % syllableDuration) / syllableDuration;

    // Sentence intonation curve (rises slightly then declinations towards period)
    const sentenceProgress = t / duration;
    const intonation = 1.0 + Math.sin(sentenceProgress * Math.PI) * 0.08 - sentenceProgress * 0.06;

    // Micro-vibrato
    const vibrato = Math.sin(2 * Math.PI * profile.vibratoRate * t) * (profile.vibratoDepth / 100);
    const currentF0 = f0 * intonation * (1 + vibrato);

    // Increment phase
    currentPhase += (2 * Math.PI * currentF0) / sampleRate;
    if (currentPhase > 2 * Math.PI) currentPhase -= 2 * Math.PI;

    // Syllable amplitude envelope (attack, sustain, decay)
    let syllableAmp = 0;
    if (syllableIndex < totalSyllables) {
      if (syllableProgress < 0.15) {
        syllableAmp = syllableProgress / 0.15; // Smooth attack
      } else if (syllableProgress < 0.75) {
        syllableAmp = 1.0; // Sustain
      } else {
        syllableAmp = (1.0 - syllableProgress) / 0.25; // Decay
      }
    }

    // Master fade in / fade out at sentence bounds
    const masterEnvelope =
      Math.min(1.0, t / 0.08) * Math.min(1.0, (duration - t) / 0.15);

    // Voice Glottal Source (Band-limited impulse / pulse with harmonics)
    const glottal =
      Math.sin(currentPhase) +
      0.5 * Math.sin(2 * currentPhase) +
      0.25 * Math.sin(3 * currentPhase) +
      0.12 * Math.sin(4 * currentPhase);

    // Formant Acoustic Resonators (F1, F2, F3)
    const resonance1 = Math.sin(2 * Math.PI * f1 * t) * 0.45;
    const resonance2 = Math.sin(2 * Math.PI * f2 * t) * 0.28;
    const resonance3 = Math.sin(2 * Math.PI * f3 * t) * 0.15;

    // Fricative consonant noise bursts between syllable transitions
    const isConsonantPhase = syllableProgress < 0.2 || syllableProgress > 0.85;
    const noise = (Math.random() * 2 - 1) * (isConsonantPhase ? 0.18 : 0.04);

    // Robotic ring-modulation if Orion Prime
    const metallicRing =
      voiceName === 'Orion Prime' ? Math.cos(2 * Math.PI * 80 * t) * 0.2 : 0;

    const sample =
      (glottal * 0.35 + (resonance1 + resonance2 + resonance3) * 0.45 + noise + metallicRing) *
      syllableAmp *
      masterEnvelope *
      (options.volume ?? 0.95);

    samples[i] = Math.max(-1, Math.min(1, sample));
  }

  // Encode to 16-bit PCM WAV Data URL
  const wavBuffer = encodeWav(samples, sampleRate);
  const base64Wav = bufferToBase64(wavBuffer);
  const audioUrl = `data:audio/wav;base64,${base64Wav}`;

  return {
    audioUrl,
    duration: parseFloat(duration.toFixed(2)),
    words: wordsCount,
    sampleRate,
  };
}

/**
 * Encodes Float32 samples into a standard 16-bit PCM RIFF/WAVE file ArrayBuffer.
 */
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1; // Mono
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF Chunk Descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  writeString(view, 8, 'WAVE');

  // fmt Sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data Sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM Samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, intSample, true);
  }

  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Checks if a narration string is an unconfigured placeholder.
 */
export function isPlaceholderNarration(text?: string): boolean {
  if (!text) return true;
  const lower = text.trim().toLowerCase();
  return (
    lower.length < 5 ||
    lower.includes('enter your new spoken narration') ||
    lower.includes('enter spoken narration') ||
    lower.includes('click to enter spoken') ||
    lower.includes('decomposing narrative') ||
    lower.includes('constructing camera') ||
    lower.includes('parsing story arc') ||
    lower.includes('synthesizing shot')
  );
}

/**
 * Generates an evocative replacement narrative line for a scene when a placeholder is present.
 */
export function generateReplacementNarration(params: {
  sceneNumber: number;
  title?: string;
  characterName?: string;
  sceneLocation?: string;
  visualStyle?: string;
}): string {
  const { sceneNumber, title, characterName, sceneLocation } = params;
  const name = characterName || 'Our hero';
  const loc = sceneLocation || 'the outer quadrant';

  const presets = [
    `Across ${loc}, ${name} felt the pulse of the city shift as the signal illuminated the skyline.`,
    `Every second in ${loc} brought new danger, but ${name} pressed forward into the neon mist.`,
    `The silence shattered as autonomous systems synchronized across ${loc}.`,
    `A single encrypted transmission held the key to survival, echoing through ${loc}.`,
    `Standing at the edge of ${loc}, ${name} knew there was no turning back from the storm.`,
  ];

  if (title && !title.toLowerCase().includes('shot') && !title.toLowerCase().includes('scene')) {
    return `${title}. Across ${loc}, ${name} deciphered the anomaly as shadows gathered.`;
  }

  return presets[(sceneNumber - 1) % presets.length];
}
