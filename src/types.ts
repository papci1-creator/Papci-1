export interface VisualTheme {
  mood: string;
  primaryColor: string;
  accentColor: string;
  particleType: 'rain' | 'embers' | 'sparks' | 'dust' | 'stars' | 'matrix';
}

export type TransitionEffect = 'Dissolve' | 'Fade' | 'Glitch' | 'Cinematic Wipe' | 'None';

export type CameraIntensity = 'Slow' | 'Moderate' | 'Dynamic' | 'Fast';

export type CharacterRole = 'Protagonist' | 'Antagonist' | 'Sidekick' | 'Mentor' | 'Supporting';

export interface CharacterReferenceSheet {
  frontAngleDescription: string;
  sideProfileDescription: string;
  actionAngleDescription: string;
  costumeColorPalette: string[];
  keyAnatomyFeatures: string[];
  generatedAt: string;
  canvasSheetDataUrl?: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  tag: string; // e.g. '@Leo'
  role: CharacterRole;
  description: string;
  imageUrl?: string;
  avatarSvg?: string;
  assignedVoice: string; // category of VoiceActorProfile
  colorAccent: string; // glowing hex accent color
  referenceSheet?: CharacterReferenceSheet;
}

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  duration: number; // in seconds
  startTime: number;
  endTime: number;
  voiceoverText: string;
  videoPrompt: string;
  cameraMotion: string;
  cameraSpeed?: number; // 0.4 to 2.2 (default 1.0)
  cameraIntensity?: CameraIntensity;
  soundFx: string;
  visualStyle: string;
  videoGenerator: string;
  voiceActor: string;
  audioVolume?: number; // 0.0 to 1.0 (or 100%)
  voicePitch?: number; // 0.5 to 1.5 (default 1.0)
  voiceRate?: number; // 0.6 to 1.5 (default 1.0)
  transitionEffect?: TransitionEffect;
  videoUrl?: string; // Live preview placeholder video clip URL or open-source loop
  characterId?: string; // ID of linked CharacterProfile
  characterName?: string;
  characterRole?: CharacterRole;
  characterDescription?: string;
  characterAvatar?: string;
  characterAccent?: string;
  status: 'queued' | 'rendering' | 'ready' | 'error';
  progress: number;
  generationPhase: string;
  visualTheme: VisualTheme;
  seed: number;
}

export type AspectRatio = '16:9' | '9:16' | '2.39:1';

export interface VoiceActorProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  gender: 'male' | 'female' | 'non-binary';
  pitch: number;
  rate: number;
  voiceStyle: string;
}

export interface PresetStory {
  id: string;
  title: string;
  genre: string;
  visualStyle: string;
  videoGenerator: string;
  voiceActor: string;
  musicStyle: string;
  text: string;
}
