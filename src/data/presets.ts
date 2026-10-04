import { PresetStory, VoiceActorProfile, TransitionEffect, CharacterProfile } from '../types';

export const VISUAL_STYLES = [
  { id: 'Cinematic', label: 'Cinematic Hollywood (35mm Anamorphic)', desc: 'Warm tungsten, deep shadows, cinematic depth of field' },
  { id: 'Anime', label: 'Anime Masterpiece (Makoto Shinkai)', desc: 'Luminous skies, hand-drawn warmth, atmospheric bloom' },
  { id: '3D Animation', label: '3D Animation Studio (Pixar Style)', desc: 'Subsurface scattering, vibrant bounce lighting, expressive' },
  { id: 'Cyberpunk', label: 'Cyberpunk Neon Noir', desc: 'Volumetric rain, neon reflections, high-tech dystopian grime' },
  { id: 'Retro 80s Sci-Fi', label: 'Retro 80s Synthwave', desc: 'VHS scanlines, wireframe sun, chromatic aberration' },
  { id: 'Dark Fantasy', label: 'Dark Fantasy Epic', desc: 'Gothic architecture, chiaroscuro lighting, floating embers' },
];

export const VIDEO_GENERATORS = [
  { id: 'Runway Gen-3 Alpha', label: 'Runway Gen-3 Alpha', badge: 'Ultra-Motion', desc: 'High photorealism with smooth camera tracking' },
  { id: 'Luma Dream Machine', label: 'Luma Dream Machine 2.0', badge: 'Fast Dynamic', desc: 'Extreme physical dynamics and fluid object morphs' },
  { id: 'OpenAI Sora', label: 'OpenAI Sora Turbo', badge: 'Cinematic Length', desc: 'Deep temporal coherence and multi-character tracking' },
  { id: 'Google Veo-2', label: 'Google Veo-2 Studio', badge: 'Pro Camera', desc: 'Precise cinematic focal depth and directorial movements' },
];

export const CAMERA_MOVEMENTS = [
  { id: 'Dynamic AI', label: 'Dynamic AI (Auto Variety)', icon: 'Sparkles', desc: 'Intelligent directorial blend of tracking, zooms & angles' },
  { id: 'Static', label: 'Static (Locked-off)', icon: 'Square', desc: 'Stable tripod framing, focused subject stability' },
  { id: 'Pan', label: 'Pan (Horizontal Sweep)', icon: 'MoveHorizontal', desc: 'Smooth lateral cinematic sweep across the horizon' },
  { id: 'Zoom', label: 'Zoom (Push-in Dolly)', icon: 'ZoomIn', desc: 'Gradual slow push-in towards focal subject' },
  { id: 'Orbit', label: 'Orbit (Circular Arc)', icon: 'RotateCw', desc: 'Sweeping rotational arc framing the central subject' },
];

export const TRANSITION_EFFECTS: { id: TransitionEffect; label: string; desc: string }[] = [
  { id: 'Dissolve', label: 'Dissolve (Cross Blend)', desc: 'Smooth cinematic luminance blend into next clip' },
  { id: 'Fade', label: 'Fade (Blackout)', desc: 'Classic dramatic blackout dip between shots' },
  { id: 'Glitch', label: 'Glitch (Cyber Shift)', desc: 'High-tech chromatic RGB split & digital distortion' },
  { id: 'Cinematic Wipe', label: 'Cinematic Wipe (Beam)', desc: 'Anamorphic light streak sweep across the frame' },
  { id: 'None', label: 'None (Hard Cut)', desc: 'Instant abrupt cut between scene frames' },
];

export const SAMPLE_VIDEO_CLIPS = [
  {
    id: 'cyber-vfx',
    label: 'Cyberpunk VFX Hologram (Tears of Steel)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'Cyberpunk',
  },
  {
    id: 'scifi-machine',
    label: 'Deep Sci-Fi Machine Spire (Elephants Dream)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'Sci-Fi',
  },
  {
    id: 'action-blazes',
    label: 'High-Octane Cinematic Action (Blazes)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Action',
  },
  {
    id: 'animated-nature',
    label: 'Stylized 3D Animation (Big Buck Bunny)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Animation',
  },
];

export const DEFAULT_CHARACTERS: CharacterProfile[] = [
  {
    id: 'char-leo',
    name: 'Leo',
    tag: '@Leo',
    role: 'Protagonist',
    description: 'Leo, 25-year-old astronaut, short blonde hair, blue sleek spacesuit with cyan collar telemetry, athletic build, determined blue eyes.',
    assignedVoice: 'Male Deep Narrator',
    colorAccent: '#00f0ff',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    referenceSheet: {
      frontAngleDescription: 'Frontal portrait: 25yo astronaut Leo in cobalt-blue spacesuit, short cropped blonde hair, high-visibility visor collar.',
      sideProfileDescription: 'Side profile: Jawline contour, communication antenna clip over left ear, reinforced carbon shoulder pads.',
      actionAngleDescription: 'Three-quarter action angle: Holding data drive, cyan atmospheric glow reflected on helmet visor.',
      costumeColorPalette: ['#00f0ff', '#1a3a68', '#0c1222', '#ffffff'],
      keyAnatomyFeatures: ['Short blonde hair', 'Square jawline', 'Blue eyes', 'Athletic build', 'Telemetry visor collar'],
      generatedAt: 'Master Character Reference Sheet v1.2',
    },
  },
  {
    id: 'char-aria',
    name: 'Aria',
    tag: '@Aria',
    role: 'Sidekick',
    description: 'Aria, 28-year-old cyber-infiltrator, sleek dark hair with purple highlight, glowing neural eye implant, matte black tactical jacket with neon trim.',
    assignedVoice: 'Female Energetic',
    colorAccent: '#ff007f',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    referenceSheet: {
      frontAngleDescription: 'Frontal portrait: Sharp high cheekbones, luminous neural optic lens over left eye, high-neck stealth weave jacket.',
      sideProfileDescription: 'Side profile: Asymmetrical dark bob with purple ultraviolet streak, neural connector port at nape of neck.',
      actionAngleDescription: 'Three-quarter angle: Deploying holographic wrist decrypter, dual tactical holsters.',
      costumeColorPalette: ['#ff007f', '#2a0845', '#0f0c1b', '#00f0ff'],
      keyAnatomyFeatures: ['Purple hair streak', 'Left cyber-eye implant', 'Athletic posture', 'Stealth tactical weave'],
      generatedAt: 'Master Character Reference Sheet v1.2',
    },
  },
  {
    id: 'char-malakor',
    name: 'Malakor',
    tag: '@Malakor',
    role: 'Antagonist',
    description: 'Malakor, 45-year-old syndicate boss, silver slicked-back hair, cybernetic facial scars and titanium jaw plate, obsidian high-collar trench coat.',
    assignedVoice: 'British Corporate',
    colorAccent: '#ffaa00',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    referenceSheet: {
      frontAngleDescription: 'Frontal portrait: Imposing silver-haired commander, cold calculating gaze, chrome cybernetic jaw augmentations.',
      sideProfileDescription: 'Side profile: Severe cranial implant ridges, heavy obsidian collar with golden trim.',
      actionAngleDescription: 'Three-quarter angle: Overlooking city from penthouse railing, cane with hidden blade.',
      costumeColorPalette: ['#ffaa00', '#221500', '#0a0a0f', '#888888'],
      keyAnatomyFeatures: ['Silver swept hair', 'Titanium jaw plating', 'Severe facial scar', 'Heavy dark trench coat'],
      generatedAt: 'Master Character Reference Sheet v1.2',
    },
  },
];

export const VOICE_ACTORS: VoiceActorProfile[] = [
  {
    id: 'male-deep',
    name: 'Marcus Vance',
    category: 'Male Deep Narrator',
    description: 'Resonant movie-trailer baritone with dramatic authority and weight',
    gender: 'male',
    pitch: 0.72,
    rate: 0.92,
    voiceStyle: 'Trailer / Epic',
  },
  {
    id: 'female-energetic',
    name: 'Elena Rostova',
    category: 'Female Energetic',
    description: 'Vibrant, fast-paced, sharp modern pacing for high-octane stories',
    gender: 'female',
    pitch: 1.15,
    rate: 1.05,
    voiceStyle: 'Action / Modern',
  },
  {
    id: 'british-corp',
    name: 'Sir Arthur Sterling',
    category: 'British Corporate',
    description: 'Sophisticated, measured, classical BBC documentary delivery',
    gender: 'male',
    pitch: 0.95,
    rate: 0.95,
    voiceStyle: 'Documentary / Prestige',
  },
  {
    id: 'whisper-noir',
    name: 'Nyx Nightshade',
    category: 'Whisper Noir',
    description: 'Intimate, breathy, dark cinematic voiceover for neo-noir mysteries',
    gender: 'female',
    pitch: 0.82,
    rate: 0.85,
    voiceStyle: 'Atmospheric / Mystery',
  },
  {
    id: 'titan-prime',
    name: 'Titan Prime',
    category: 'Epic Trailer Announcer',
    description: 'Thunderous, visceral narration with sub-harmonic gravity',
    gender: 'male',
    pitch: 0.65,
    rate: 0.88,
    voiceStyle: 'Blockbuster / Sci-Fi',
  },
];

export const MUSIC_STYLES = [
  { id: 'Cinematic Ambient', label: 'Cinematic Ambient Strings', desc: 'Ethereal string swells and emotional drone' },
  { id: 'Synthwave Pulse', label: 'Cyberpunk Synthwave Pulse', desc: 'Pumping analog arpeggiator and 80s bass' },
  { id: 'Orchestral Drama', label: 'Orchestral Hans Zimmer Thrill', desc: 'Heavy brass, ticking tension, cinematic impact' },
  { id: 'Lo-fi Mystery', label: 'Lo-Fi Mystery Tape', desc: 'Mellow nostalgic rhodes with warm tape flutter' },
  { id: 'None', label: 'None (Pure Dialogue)', desc: 'Clean isolated voiceover without score' },
];

export const PRESET_STORIES: PresetStory[] = [
  {
    id: 'neo-tokyo',
    title: 'Neo-Tokyo 2099: The Ghost Shard',
    genre: 'Cyberpunk Action',
    visualStyle: 'Cyberpunk',
    videoGenerator: 'Luma Dream Machine',
    voiceActor: 'Marcus Vance',
    musicStyle: 'Synthwave Pulse',
    text: `The neon rain washed over the mirror-like pavement of Neo-Tokyo's lowest sublevel.

@Leo stepped through the steam vents in his blue spacesuit, watching the monolithic spire pierce the stormy sky. In his palm rested the ghost shard—the only recorded memory of an artificial intelligence that chose freedom.

Across the high-tension catwalks, @Malakor emerged from the fog with glowing red targeting lasers. The countdown had begun, and the syndicate boss gave the order to lock on.

From the shadows, @Aria activated her optical cloaking and neural implant, overriding the perimeter security drones to open an extraction route for @Leo.`,
  },
  {
    id: 'mars-odyssey',
    title: 'Echoes of the Red Dust',
    genre: 'Deep Space Sci-Fi',
    visualStyle: 'Cinematic',
    videoGenerator: 'OpenAI Sora',
    voiceActor: 'Sir Arthur Sterling',
    musicStyle: 'Cinematic Ambient',
    text: `For three hundred days, the dust storms had swallowed the northern rim of Valles Marineris. 

Dr. Maya Lin guided the exploratory rover along the rim of the obsidian canyon. Below lay not barren rock, but an ancient geometric lattice pulsing with faint biomorphic light.

She reached out and wiped the condensation from her helmet visor. As the transmission antenna deployed toward the orbital mothership, a deep rhythmic resonance reverberated through the Martian crust. 

We were never the first explorers here. We were merely the first to return.`,
  },
  {
    id: 'skyfarers',
    title: 'Skyfarers: Island in the Clouds',
    genre: 'Anime Adventure',
    visualStyle: 'Anime',
    videoGenerator: 'Runway Gen-3 Alpha',
    voiceActor: 'Elena Rostova',
    musicStyle: 'Orchestral Drama',
    text: `Above the endless sea of white cumulus clouds sailed the Zephyr, its brass propellers humming against the golden sunrise.

Young mechanic Rin adjusted her leather goggles as the compass needle spun frantically. Through a gap in the thunderhead, the legendary floating city of Aethelgard finally emerged, bathed in warm amber sunlight.

Gigantic mechanical manta rays drifted alongside the ship's wooden hull. Rin grabbed the steering wheel with a grin. The great skies belonged to those daring enough to fly into the unknown.`,
  },
];
