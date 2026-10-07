export interface VisualTheme {
  mood: string;
  primaryColor: string;
  accentColor: string;
  particleType: 'rain' | 'embers' | 'sparks' | 'dust' | 'stars' | 'matrix';
}

export type TransitionEffect = 'Dissolve' | 'Fade' | 'Glitch' | 'Wipe' | 'Cinematic Wipe' | 'None';

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

export interface CharacterOutfit {
  id: string;
  name: string; // e.g. "Outfit 1: Astronaut Spacesuit"
  description: string; // e.g. "Matte white pressurized EVA spacesuit with gold-tinted reflective visor and blue neon life-support conduits"
  imageUrl?: string; // optional thumbnail reference
  colorAccent?: string;
  isDefault?: boolean;
}

export interface CharacterProfile {
  id: string;
  name: string;
  tag: string; // e.g. '@Leo'
  role: CharacterRole;
  description: string;
  faceDescription?: string; // Baseline face/physical features description
  imageUrl?: string;
  avatarSvg?: string;
  assignedVoice: string; // category of VoiceActorProfile
  colorAccent: string; // glowing hex accent color
  outfits: CharacterOutfit[]; // Dynamic Outfit Wardrobe sub-list
  activeOutfitId?: string;
  costumeLock?: string; // Dense, repeatable description of exact garments, colors, textures, and accessories
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
  audioUrl?: string; // Generated narration audio file (Data URL, Blob URL, or WAV)
  audioDuration?: number; // Exact synthesized audio duration in seconds
  isAudioGenerated?: boolean; // Flag indicating high-fidelity TTS audio file is generated
  audioFormat?: 'wav' | 'mp3' | 'aac';
  transitionEffect?: TransitionEffect;
  videoUrl?: string; // Live preview placeholder video clip URL or open-source loop
  characterId?: string; // ID of linked CharacterProfile
  characterName?: string;
  characterRole?: CharacterRole;
  characterDescription?: string;
  characterAvatar?: string;
  characterAccent?: string;
  costumeLock?: string; // Dense, repeatable description of exact garments, colors, textures, and accessories
  outfitId?: string; // ID of chosen outfit for this scene
  outfitName?: string; // Name of chosen outfit
  outfitDescription?: string; // Detailed outfit specs
  outfitImage?: string; // Thumbnail reference for outfit
  detectedCharacters?: string[]; // Character tags/names auto-detected in this scene
  sceneLocation?: string; // Location or environment (e.g. 'Neo-Tokyo Sublevel 4', 'Orbital Deck')
  timeOfDay?: TimeOfDay | string; // Lighting & temporal setting (e.g. 'Night', 'Golden Hour', 'Dawn')
  status: 'queued' | 'rendering' | 'ready' | 'error';
  progress: number;
  generationPhase: string;
  visualTheme: VisualTheme;
  seed: number;
}

export type TimeOfDay = 'Dawn' | 'Day' | 'Golden Hour' | 'Dusk' | 'Night' | 'Midnight';

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

export interface ProjectConfiguration {
  projectTitle: string;
  storyText: string;
  visualStyle: string;
  videoGenerator: string;
  voiceActor: string;
  musicStyle: string;
  musicVolume: number;
  defaultCameraMovement: string;
  aspectRatio: AspectRatio;
  characters: CharacterProfile[];
  activeCharacterId: string | null;
}

export interface MediaEngineState {
  scenes: Scene[];
  currentSceneIndex: number;
  currentTime: number;
  isPlaying: boolean;
  isGenerating: boolean;
  totalDuration: number;
}

export interface MasterExportConfig {
  format: 'mp4' | 'webm';
  resolution: '1080p' | '4k';
  includeAudio: boolean;
  includeSubtitles: boolean;
  aspectRatio: AspectRatio;
}

