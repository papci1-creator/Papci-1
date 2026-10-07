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
  { id: 'Google Veo 3.1', label: 'Google Veo 3.1 (veo-3.1-generate-preview)', badge: 'Google Veo', desc: 'Photorealistic high-fidelity video generation with 16:9 / 720p / 1080p rendering' },
  { id: 'Runway Gen-3 Alpha', label: 'Runway Gen-3 Alpha', badge: 'Ultra-Motion', desc: 'High photorealism with smooth camera tracking' },
  { id: 'Luma Dream Machine', label: 'Luma Dream Machine 2.0', badge: 'Fast Dynamic', desc: 'Extreme physical dynamics and fluid object morphs' },
  { id: 'OpenAI Sora', label: 'OpenAI Sora Turbo', badge: 'Cinematic Length', desc: 'Deep temporal coherence and multi-character tracking' },
];

export const CAMERA_MOVEMENTS = [
  { id: 'Dynamic AI', label: 'Dynamic AI (Auto Variety)', icon: 'Sparkles', desc: 'Intelligent directorial blend of tracking, zooms & angles' },
  { id: 'Static', label: 'Static (Locked-off)', icon: 'Square', desc: 'Stable tripod framing, focused subject stability' },
  { id: 'Pan', label: 'Pan (Horizontal Sweep)', icon: 'MoveHorizontal', desc: 'Smooth lateral cinematic sweep across the horizon' },
  { id: 'Zoom', label: 'Zoom (Push-in Dolly)', icon: 'ZoomIn', desc: 'Gradual slow push-in towards focal subject' },
  { id: 'Orbit', label: 'Orbit (Circular Arc)', icon: 'RotateCw', desc: 'Sweeping rotational arc framing the central subject' },
];

export const TRANSITION_EFFECTS: {
  id: TransitionEffect;
  label: string;
  subtitle: string;
  desc: string;
  accent: string;
}[] = [
  {
    id: 'Dissolve',
    label: 'Dissolve',
    subtitle: 'Cross Blend',
    desc: 'Smooth cinematic luminance blend with soft atmospheric bloom into next clip',
    accent: '#00f0ff',
  },
  {
    id: 'Fade',
    label: 'Fade',
    subtitle: 'Blackout Dip',
    desc: 'Classic dramatic blackout dip transition between scene frames',
    accent: '#818cf8',
  },
  {
    id: 'Wipe',
    label: 'Wipe',
    subtitle: 'Light Beam Sweep',
    desc: 'Anamorphic light streak sweep and trailing wipe across the frame',
    accent: '#fbbf24',
  },
  {
    id: 'Glitch',
    label: 'Glitch',
    subtitle: 'Cyber RGB Split',
    desc: 'High-tech chromatic RGB split, horizontal scanlines & digital cyber distortion',
    accent: '#f43f5e',
  },
  {
    id: 'None',
    label: 'None',
    subtitle: 'Hard Cut',
    desc: 'Instant abrupt cut between scene frames with zero blend',
    accent: '#94a3b8',
  },
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
    id: 'char-elena',
    name: 'Elena',
    tag: '@Elena',
    role: 'Protagonist',
    description: 'Elena, a 30-year-old pilot. Wearing an olive-drab flight jacket with a faded orange collar patch, dark auburn hair tied back in a low bun, sharp jawline, cinematic studio lighting.',
    faceDescription: '30-year-old pilot, dark auburn hair tied back in a low bun, sharp jawline, cinematic studio lighting, photorealistic 8k resolution, poised aviator expression.',
    assignedVoice: 'Female Authoritative',
    colorAccent: '#f97316',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    activeOutfitId: 'outfit-elena-1',
    outfits: [
      {
        id: 'outfit-elena-1',
        name: 'Olive-Drab Flight Jacket',
        description: 'Olive-drab aviation flight jacket with faded orange collar patch, brass zippers, and flight squadron insignia.',
        imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#f97316',
        isDefault: true,
      },
      {
        id: 'outfit-elena-2',
        name: 'High-Altitude Pressure Suit',
        description: 'Pressurized stratospheric flight suit with tinted helmet and oxygen harness.',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#fbbf24',
        isDefault: false,
      },
    ],
    referenceSheet: {
      frontAngleDescription: 'Studio portrait of Elena: 30-year-old pilot, olive-drab flight jacket, faded orange collar patch, dark auburn hair in low bun, sharp jawline.',
      sideProfileDescription: 'Profile view showing cranial hair contour, defined jawline, and flight jacket collar patch detail.',
      actionAngleDescription: 'Dynamic 3/4 flight perspective with natural cockpit key lighting.',
      costumeColorPalette: ['#556b2f', '#f97316', '#1e293b', '#fbbf24'],
      keyAnatomyFeatures: ['Dark auburn hair in low bun', 'Sharp jawline', 'Olive-drab flight jacket', 'Faded orange collar patch'],
      generatedAt: 'Imagen 3 Master Character Reference v1.0',
    },
  },
  {
    id: 'char-leo',
    name: 'Leo',
    tag: '@Leo',
    role: 'Protagonist',
    description: 'Leo, 25-year-old astronaut, short blonde hair, blue sleek spacesuit with cyan collar telemetry, athletic build, determined blue eyes.',
    faceDescription: '25-year-old astronaut with short cropped sun-bleached blonde hair, sharp square jawline, piercing blue eyes, athletic build, clear skin with faint telemetry cyber-connector along neckline.',
    assignedVoice: 'Male Deep Narrator',
    colorAccent: '#00f0ff',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    activeOutfitId: 'outfit-leo-1',
    outfits: [
      {
        id: 'outfit-leo-1',
        name: 'Astronaut Spacesuit',
        description: 'Matte white pressurized EVA spacesuit with cobalt-blue accents, gold-tinted reflective visor, and cyan life-support conduits.',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#00f0ff',
        isDefault: true,
      },
      {
        id: 'outfit-leo-2',
        name: 'Casual Streetwear Hoodie',
        description: 'Oversized charcoal cotton streetwear hoodie with glowing cyan circuit embroidery, rolled sleeves, and reinforced combat cargo pants.',
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#38bdf8',
        isDefault: false,
      },
      {
        id: 'outfit-leo-3',
        name: 'Tactical Recon Armor',
        description: 'Obsidian lightweight ballistic composite armor plates, magnetic equipment harness, and active optical camouflage mesh.',
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#818cf8',
        isDefault: false,
      },
    ],
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
    faceDescription: '28-year-old cyber-infiltrator with asymmetrical dark raven bob and vibrant ultraviolet purple streak, luminous neural optic implant in left eye, high cheekbones, athletic slender build.',
    assignedVoice: 'Female Energetic',
    colorAccent: '#ff007f',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    activeOutfitId: 'outfit-aria-1',
    outfits: [
      {
        id: 'outfit-aria-1',
        name: 'Cyber Infiltrator Jacket',
        description: 'Matte black tactical stealth jacket with neon magenta edge piping, high mandarin collar, carbon fiber elbow guards, and utility holsters.',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#ff007f',
        isDefault: true,
      },
      {
        id: 'outfit-aria-2',
        name: 'Casual Flight Jumpsuit',
        description: 'Deep indigo utility flight jumpsuit with rolled sleeves, brass zip harnesses, and holographic communicator wrist gauntlet.',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#e879f9',
        isDefault: false,
      },
      {
        id: 'outfit-aria-3',
        name: 'High-Society Silk Disguise',
        description: 'Form-fitting obsidian silk evening gown woven with shimmering violet nano-threads, concealed ceramic blade holster, and geometric choker.',
        imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#c084fc',
        isDefault: false,
      },
    ],
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
    faceDescription: '45-year-old syndicate boss with slicked-back platinum silver hair, cold calculating steel-grey eyes, cybernetic chrome jaw plate and facial graft scars.',
    assignedVoice: 'British Corporate',
    colorAccent: '#ffaa00',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    activeOutfitId: 'outfit-malakor-1',
    outfits: [
      {
        id: 'outfit-malakor-1',
        name: 'Obsidian High-Collar Trench',
        description: 'Heavy armored obsidian trench coat with amber illuminated silk lining, gilded shoulder epaulets, and titanium double-breasted clasps.',
        imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#ffaa00',
        isDefault: true,
      },
      {
        id: 'outfit-malakor-2',
        name: 'Syndicate Battle Exoskeleton',
        description: 'Heavy matte black powered exoskeleton frame with amber hydraulic conduits, composite chest armor, and neural target lock cowl.',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#f59e0b',
        isDefault: false,
      },
      {
        id: 'outfit-malakor-3',
        name: 'Executive Tailored Suit',
        description: 'Bespoke three-piece midnight charcoal wool suit with golden pinstripes, engraved syndicate crest cufflinks, and silk pocket square.',
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=300&q=80',
        colorAccent: '#fbbf24',
        isDefault: false,
      },
    ],
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
  {
    id: 'martian-temple',
    title: 'Mars: The Buried Altar',
    genre: 'Sci-Fi Mystery',
    visualStyle: 'Cinematic',
    videoGenerator: 'Runway Gen-3 Alpha',
    voiceActor: 'Marcus Vance',
    musicStyle: 'Cinematic Ambient',
    text: `A lone astronaut discovers an ancient temple buried under the red sands of Mars.

Inside, glowing blue glyphs pulse to life as the astronaut touches the central altar.

A colossal subterranean star chamber awakens, casting alien constellations against the subterranean obsidian stone.`,
  },
];
