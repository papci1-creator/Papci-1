export interface VisualTheme {
  mood: string;
  primaryColor: string;
  accentColor: string;
  particleType: 'rain' | 'embers' | 'sparks' | 'dust' | 'stars' | 'matrix';
}

export type TransitionEffect =
  | 'Dissolve'
  | 'Fade'
  | 'Glitch'
  | 'VHS Glitch'
  | 'Light Leak'
  | 'Film Burn'
  | 'Whip Pan'
  | 'Iris Vignette'
  | 'Flash Cut'
  | 'Prism Split'
  | 'Luma Melt'
  | 'Wipe'
  | 'Cinematic Wipe'
  | 'None';

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
  audioFormat?: 'wav' | 'mp3' | 'aac' | 'webm' | 'ogg';
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
  backgroundImage?: string; // Custom background asset URL (Data URL, SVG, or generated image)
  backgroundAssetId?: string; // ID of chosen background asset from catalog
  backgroundPrompt?: string; // User prompt or descriptive specs for the background
  backgroundStyle?: string; // Visual style of background
  visualKeyframeLocked?: boolean; // Whether visual keyframe & outfit continuity is locked across cuts
  keyframeAnchorPrompt?: string; // Locked keyframe anchor prompt for scene-to-scene visual consistency
  colorGradePreset?: CinematicGradePresetId; // Selected LUT color grading preset (e.g. 'Noir', 'Technicolor', 'Retro', 'Desaturated')
  colorGradeIntensity?: number; // 0 to 100 blend strength of the color grade filter (default 100)
  directorNotebook?: DirectorNotebookData; // Persistent Production Director's Notebook (rich-text notes, lighting refs, camera focus cues)
  metadata?: SceneMetadata;
  status: 'queued' | 'rendering' | 'ready' | 'error';
  progress: number;
  generationPhase: string;
  visualTheme: VisualTheme;
  seed: number;
}

export interface LightingReferenceItem {
  id: string;
  label: string; // e.g. 'Key Light: Cyan Neon Tube (45° Camera Left)'
  setupType:
    | 'Key Light'
    | 'Fill Light'
    | 'Back / Rim'
    | 'Rim / Back Light'
    | 'Practical'
    | 'Volumetric Haze'
    | 'Volumetric / Haze';
  colorTemp: string; // e.g. '5600K Cyan Gel' or '3200K Tungsten'
  colorHex: string; // e.g. '#00f0ff'
  ratioOrIntensity: string; // e.g. '4:1 Chiaroscuro' or '85% Softbox'
  referenceImageUrl?: string; // optional uploaded lighting diagram or reference photo
  notes?: string;
}

export interface CameraFocusCue {
  id: string;
  timestampSec: number; // timestamp within scene duration
  targetSubject: string; // e.g. 'Leo Eyes -> Holographic Shard'
  focalDistance: string; // e.g. '0.85m -> 2.4m'
  cueType: 'Rack Focus' | 'Lock Focus' | 'Shallow DOF Tracking' | 'Split Diopter' | 'Deep Focus';
  apertureMark?: string; // e.g. 'T1.5'
  notes?: string;
}

export interface DirectorNotebookData {
  richTextNotes: string; // Rich-text HTML production notes, blocking, and subtext
  blockingAndSubtext?: string;
  audioFoleyCues?: string;
  lightingNotes?: string;
  plainTextSummary?: string;
  lightingSetupPreset?: string;
  lightingReferences: LightingReferenceItem[];
  cameraFocusCues: CameraFocusCue[];
  blockingAndFramingTags?: string[];
  lastUpdated?: string;
}

export type CinematicGradePresetId =
  | 'None'
  | 'Noir'
  | 'Technicolor'
  | 'Retro'
  | 'Desaturated'
  | 'TealAndOrange'
  | 'CyberNeon'
  | 'GoldenHour'
  | 'SepiaArchival'
  | 'MatrixGreen';

export interface CinematicGradePreset {
  id: CinematicGradePresetId;
  name: string;
  subtitle: string;
  category: 'Classic Film' | 'Modern Cinema' | 'Stylized & Retro';
  description: string;
  filmStockRef: string;
  accentColor: string;
  swatchColors: [string, string, string];
  // Optical & color parameters
  contrast: number; // 50 to 150
  saturation: number; // 0 to 200
  sepia: number; // 0 to 100
  hueRotate: number; // -180 to 180 deg
  bloomIntensity: number; // 0 to 100
  filmGrain: number; // 0 to 100
  chromaticAberration: number; // 0 to 100
  vignetteIntensity: number; // 0 to 100
  tintOverlay: string; // rgba color wash
  shadowTint?: string; // split-tone shadow color
  highlightTint?: string; // split-tone highlight color
}

export interface SceneMetadata {
  shootingDate: string;
  lensFocalLength: string;
  cameraAperture: string;
  shutterSpeed?: string;
  iso?: string;
  cameraModel?: string;
  whiteBalance?: string;
  filter?: string;
  location?: string;
  takeNumber?: number;
  rollNumber?: string;
  notes?: string;
  showOverlay?: boolean;
  // Visual Effect Intensity Sliders for per-clip fine-tuning
  bloomIntensity?: number; // 0 to 100 (default 35)
  filmGrain?: number; // 0 to 100 (default 20)
  contrast?: number; // 50 to 150 (default 105)
  saturation?: number; // 0 to 200 (default 110)
  chromaticAberration?: number; // 0 to 100 (default 15)
  vignetteIntensity?: number; // 0 to 100 (default 45)
  sepia?: number; // 0 to 100 (default 0)
  hueRotate?: number; // -180 to 180 (default 0)
  colorTint?: string; // optional rgba tint wash
  directorNotebook?: DirectorNotebookData; // Synced Production Director's Notebook
}

export interface BackgroundAsset {
  id: string;
  name: string;
  category: 'Cyberpunk' | 'Sci-Fi' | 'Fantasy' | 'Cinematic' | 'Anime' | 'Studio' | 'Action';
  description: string;
  imageUrl: string;
  prompt: string;
  colorPalette: string[];
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

export interface SoundtrackMixConfig {
  musicStyle: string;
  musicVolume: number;
  voiceoverVolume: number;
  ambientSfxStyle: string;
  ambientSfxVolume: number;
  afrobeatBpm: number;
  percussionIntensity: number;
  logDrumBassBoost: number;
  enableDucking: boolean;
  duckingDepth: number;
  customAudioUrl?: string | null;
  customAudioName?: string | null;
}

export interface MoviePosterData {
  id: string;
  title: string;
  tagline: string;
  theme: string;
  aspectRatio: '2:3' | '3:4' | '16:9';
  billingCast: string;
  directorCredit: string;
  releaseDate: string;
  lightingStyle: string;
  imageUrl: string;
  prompt: string;
  model: string;
  accentColor: string;
  createdDate: string;
}



