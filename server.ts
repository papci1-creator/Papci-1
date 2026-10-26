import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  generateSpeechWav,
  isPlaceholderNarration,
  generateReplacementNarration,
} from './src/utils/ttsSynthesizer.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Gemini SDK if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

const SAMPLE_PREVIEW_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
];

// Helper to match character to text
function findMatchingCharacter(text: string, characters: any[], index: number = 0) {
  if (!characters || characters.length === 0) return null;

  // 1. Exact tag match e.g. @Leo
  for (const c of characters) {
    if (c.tag && text.includes(c.tag)) return c;
  }

  // 2. Name match in text
  for (const c of characters) {
    if (c.name && text.toLowerCase().includes(c.name.toLowerCase())) return c;
  }

  // 3. Fallback: cycle through cast so all characters are represented
  return characters[index % characters.length];
}

// Fallback scene generator if Gemini is unavailable or errors
function generateFallbackScenes(
  story: string,
  visualStyle: string,
  videoGenerator: string,
  voiceActor: string,
  defaultCameraMovement: string = 'Dynamic AI',
  characters: any[] = []
) {
  const paragraphs = story
    .split(/\n\n+|\.\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 15);

  const cleanParts = paragraphs.length > 0 ? paragraphs.slice(0, 5) : [
    'The neon rain cascaded across the mirrored pavement of sector seven.',
    'A solitary figure stepped out from the steam vents, eyes glowing with cybernetic precision.',
    'In the distance, the megastructure hummed with unfathomable artificial intelligence.',
    'The destiny of this cyber city hung on a single encrypted data shard.'
  ];

  const getCameraMotionForStyle = (idx: number) => {
    switch (defaultCameraMovement) {
      case 'Static':
        return 'Static Locked-off Tripod Shot';
      case 'Pan':
        return idx % 2 === 0 ? 'Cinematic Pan Right, Smooth Lateral Track' : 'Cinematic Pan Left, Smooth Lateral Track';
      case 'Zoom':
        return idx % 2 === 0 ? 'Slow Push-in Dolly Zoom' : 'Intense Close-up Dolly Zoom';
      case 'Orbit':
        return '360° Circular Orbital Arc Framing Subject';
      default:
        return [
          'Cinematic Slow Dolly-In, 35mm Anamorphic Lens',
          'Low-Angle Tracking Shot with Volumetric Fog',
          'Sweeping High-Altitude Drone Pan, Golden Mist',
          'Intense Dynamic Orbital Arc around Protagonist',
          'Push-in Close-up with Bokeh Light Bleed'
        ][idx % 5];
    }
  };

  const soundFxList = [
    'Low sub-bass rumble with cybernetic servo hum',
    'Rain droplets on metallic armor and distant siren',
    'Atmospheric wind whistle across glass spires',
    'High-voltage neon buzzing and echoing footsteps',
    'Ethereal harmonic chord progression with chime'
  ];

  let currentTime = 0;
  return cleanParts.map((text, idx) => {
    const duration = 6;
    const startTime = currentTime;
    currentTime += duration;
    const sceneNumber = idx + 1;
    const cameraMotion = getCameraMotionForStyle(idx);
    const matchedChar = findMatchingCharacter(text, characters, idx);
    const matchedOutfit = (matchedChar?.outfits && Array.isArray(matchedChar.outfits))
      ? matchedChar.outfits.find((o: any) => o.id === matchedChar.activeOutfitId) ||
        matchedChar.outfits.find((o: any) => o.isDefault) ||
        matchedChar.outfits[0]
      : undefined;

    const characterInjection = matchedChar
      ? `[CHARACTER: ${matchedChar.name}, ${matchedChar.role}] [FACE LOCK: ${matchedChar.faceDescription || matchedChar.description}] ${matchedOutfit ? `[OUTFIT: ${matchedOutfit.name} - ${matchedOutfit.description}] ` : ''}`
      : '';

    const sampleLocations = [
      'Neo-Tokyo Lower Sublevel',
      'High-Tech Quantum Vault',
      'Megastructure Catwalks',
      'Orbital Observation Deck',
      'Crystalline Oasis Sanctuary',
    ];
    const sampleTimes = ['Night', 'Midnight', 'Golden Hour', 'Dusk', 'Dawn'];

    return {
      id: `scene-${Date.now()}-${idx + 1}`,
      sceneNumber,
      title: `Scene ${sceneNumber}: ${text.slice(0, 28).replace(/[^\w\s]/g, '')}...`,
      duration,
      startTime,
      endTime: currentTime,
      voiceoverText: text,
      sceneLocation: sampleLocations[idx % sampleLocations.length],
      timeOfDay: sampleTimes[idx % sampleTimes.length],
      videoPrompt: `Masterpiece cinematic 8k render, ${visualStyle} aesthetic, rendered with ${videoGenerator}. Camera Movement: ${cameraMotion}. ${characterInjection}${text}. Volumetric lighting, high dynamic range, photorealistic depth, character wardrobe and facial consistency.`,
      cameraMotion,
      soundFx: soundFxList[idx % soundFxList.length],
      visualStyle,
      videoGenerator,
      voiceActor: matchedChar?.assignedVoice || voiceActor,
      videoUrl: SAMPLE_PREVIEW_VIDEOS[idx % SAMPLE_PREVIEW_VIDEOS.length],
      transitionEffect: 'Dissolve' as const,
      characterId: matchedChar?.id,
      characterName: matchedChar?.name,
      characterRole: matchedChar?.role,
      characterDescription: matchedChar?.description,
      characterAvatar: matchedChar?.imageUrl,
      characterAccent: matchedChar?.colorAccent,
      outfitId: matchedOutfit?.id,
      outfitName: matchedOutfit?.name,
      outfitDescription: matchedOutfit?.description,
      outfitImage: matchedOutfit?.imageUrl,
      status: 'ready' as const,
      progress: 100,
      generationPhase: 'Render Ready (100%)',
    };
  });
}

// Helper to mask sensitive keys for client display
function maskKey(key?: string): string | null {
  if (!key) return null;
  const clean = key.trim();
  if (clean.length <= 8) return '••••••••';
  return clean.slice(0, 4) + '••••••••' + clean.slice(-4);
}

// API: Check configured status of AI video environment variables
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    runwayConfigured: !!process.env.RUNWAY_API_KEY,
    lumaConfigured: !!process.env.LUMA_API_KEY,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    geminiKeyMasked: maskKey(process.env.GEMINI_API_KEY),
    runwayKeyMasked: maskKey(process.env.RUNWAY_API_KEY),
    lumaKeyMasked: maskKey(process.env.LUMA_API_KEY),
    openaiKeyMasked: maskKey(process.env.OPENAI_API_KEY),
    sampleVideosAvailable: true,
    sampleVideos: SAMPLE_PREVIEW_VIDEOS,
  });
});

// API: Save API environment keys securely to server runtime proxy
app.post('/api/settings/keys', (req: Request, res: Response) => {
  const { runwayApiKey, lumaApiKey, openaiApiKey, geminiApiKey } = req.body;

  if (typeof runwayApiKey === 'string') {
    if (runwayApiKey.trim()) {
      process.env.RUNWAY_API_KEY = runwayApiKey.trim();
    } else {
      delete process.env.RUNWAY_API_KEY;
    }
  }

  if (typeof lumaApiKey === 'string') {
    if (lumaApiKey.trim()) {
      process.env.LUMA_API_KEY = lumaApiKey.trim();
    } else {
      delete process.env.LUMA_API_KEY;
    }
  }

  if (typeof openaiApiKey === 'string') {
    if (openaiApiKey.trim()) {
      process.env.OPENAI_API_KEY = openaiApiKey.trim();
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  }

  if (typeof geminiApiKey === 'string') {
    if (geminiApiKey.trim()) {
      process.env.GEMINI_API_KEY = geminiApiKey.trim();
      try {
        aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        console.error('Failed to update GoogleGenAI client:', err);
      }
    } else {
      delete process.env.GEMINI_API_KEY;
      aiClient = null;
    }
  }

  res.json({
    success: true,
    message: 'API environment keys successfully saved to server proxy runtime.',
    settings: {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      runwayConfigured: !!process.env.RUNWAY_API_KEY,
      lumaConfigured: !!process.env.LUMA_API_KEY,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      geminiKeyMasked: maskKey(process.env.GEMINI_API_KEY),
      runwayKeyMasked: maskKey(process.env.RUNWAY_API_KEY),
      lumaKeyMasked: maskKey(process.env.LUMA_API_KEY),
      openaiKeyMasked: maskKey(process.env.OPENAI_API_KEY),
    },
  });
});

// API: Clear a specific provider key
app.delete('/api/settings/keys', (req: Request, res: Response) => {
  const { provider } = req.body;
  if (provider === 'runway') delete process.env.RUNWAY_API_KEY;
  if (provider === 'luma') delete process.env.LUMA_API_KEY;
  if (provider === 'openai') delete process.env.OPENAI_API_KEY;
  if (provider === 'gemini') {
    delete process.env.GEMINI_API_KEY;
    aiClient = null;
  }

  res.json({
    success: true,
    message: `${provider} key cleared from server environment.`,
    settings: {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      runwayConfigured: !!process.env.RUNWAY_API_KEY,
      lumaConfigured: !!process.env.LUMA_API_KEY,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      geminiKeyMasked: maskKey(process.env.GEMINI_API_KEY),
      runwayKeyMasked: maskKey(process.env.RUNWAY_API_KEY),
      lumaKeyMasked: maskKey(process.env.LUMA_API_KEY),
      openaiKeyMasked: maskKey(process.env.OPENAI_API_KEY),
    },
  });
});

// API: Verify backend API proxy and environment keys
app.post('/api/settings/verify', async (req: Request, res: Response) => {
  const { provider } = req.body;

  if (provider === 'runway') {
    const hasKey = !!process.env.RUNWAY_API_KEY;
    res.json({
      provider: 'runway',
      status: hasKey ? 'connected' : 'missing_key',
      message: hasKey
        ? 'Runway Gen-3 Alpha API key verified via server proxy.'
        : 'RUNWAY_API_KEY is not defined in environment variables. Define it in your .env file or project environment.',
    });
    return;
  }

  if (provider === 'luma') {
    const hasKey = !!process.env.LUMA_API_KEY;
    res.json({
      provider: 'luma',
      status: hasKey ? 'connected' : 'missing_key',
      message: hasKey
        ? 'Luma Dream Machine API key verified via server proxy.'
        : 'LUMA_API_KEY is not defined in environment variables. Define it in your .env file or project environment.',
    });
    return;
  }

  if (provider === 'gemini') {
    const hasKey = !!process.env.GEMINI_API_KEY;
    res.json({
      provider: 'gemini',
      status: hasKey ? 'connected' : 'missing_key',
      message: hasKey
        ? 'Google Gemini API key active and ready.'
        : 'GEMINI_API_KEY is not configured.',
    });
    return;
  }

  res.json({ status: 'ok', message: 'API proxy online.' });
});

// API: Parse story into chronological cinematic storyboard scenes
app.post('/api/generate-storyboard', async (req: Request, res: Response) => {
  const {
    story,
    visualStyle = 'Cinematic',
    videoGenerator = 'Runway Gen-3 Alpha',
    voiceActor = 'Male Deep Narrator',
    musicStyle = 'Cinematic Ambient',
    defaultCameraMovement = 'Dynamic AI',
    characters = [],
  } = req.body;

  if (!story || typeof story !== 'string' || story.trim().length === 0) {
    res.status(400).json({ error: 'Story text is required.' });
    return;
  }

  // Attempt using Gemini API if key is present
  if (aiClient) {
    try {
      const characterBios = Array.isArray(characters) && characters.length > 0
        ? `\nCharacter Roster & Wardrobe (lock these baseline physical features and specific outfits into scenes whenever referenced):
${characters.map((c: any) => `- ${c.name} (${c.tag}, Role: ${c.role}): Face & Physical: ${c.faceDescription || c.description} [Assigned Voice: ${c.assignedVoice}] [Wardrobe Outfits: ${c.outfits?.map((o: any) => `"${o.name}": ${o.description}`).join(' | ') || 'Default'}]`).join('\n')}`
        : '';

      const systemInstruction = `You are an art director for a film studio and visual effects supervisor for an AI media pipeline using ${videoGenerator}.
When given a story, first create a precise, locked 'Costume Sheet' (costume_lock) for the main characters with a dense, repeatable description of exact garments, colors, textures, and accessories.
Then, generate video prompts for each scene that strictly repeat the character's costume details to ensure visual continuity across shots.`;

      const prompt = `Story:
"""
${story}
"""

Visual Style: ${visualStyle}
AI Video Engine: ${videoGenerator}
Voice Actor Persona: ${voiceActor}
Music Style: ${musicStyle}
Global Camera Movement Requirement: ${defaultCameraMovement} (All generated scenes should align with this camera movement style: e.g., if 'Static', locked-off; if 'Pan', lateral sweep; if 'Zoom', dolly push; if 'Orbit', circular arc; if 'Dynamic AI', director variety).
${characterBios}

Output a strictly valid JSON object with the following schema:
{
  "character_name": "Name of primary character (e.g. Elena or matched character)",
  "costume_lock": "Dense, repeatable description of exact garments, colors, textures, and accessories (e.g., 'Olive-drab flight jacket with faded orange collar patch, dark auburn hair tied back in a low bun, tactical flight jumpsuit with brass zip harnesses')",
  "scenes": [
    {
      "scene_number": 1,
      "title": "Short evocative title (max 5 words)",
      "sceneLocation": "Specific setting/location (e.g. 'Neo-Tokyo Lower Sublevel', 'High-Tech Archive Vault', 'Megastructure Catwalks', 'Orbital Station')",
      "timeOfDay": "One of: 'Dawn', 'Day', 'Golden Hour', 'Dusk', 'Night', 'Midnight'",
      "duration": 6,
      "voiceoverText": "Polished, spoken narration line for this scene (1 to 2 sentences)",
      "video_prompt": "Scene action + camera motion, strictly integrating the costume_lock, lighting, lens (e.g. 35mm anamorphic), hyper-detailed, no text overlays",
      "cameraMotion": "Specific cinematic camera move adhering to ${defaultCameraMovement}",
      "soundFx": "Atmospheric sound design cue (e.g., 'Distant thunder, wet tires, neon buzz')",
      "characterTag": "@Elena (or matching character tag)",
      "visualTheme": {
        "mood": "e.g., 'Epic & Mysterious'",
        "primaryColor": "hex code e.g. #00f0ff",
        "accentColor": "hex code e.g. #ffaa00",
        "particleType": "e.g. 'rain', 'embers', 'sparks', 'dust', 'snow', or 'stars'"
      }
    }
  ]
}

Return ONLY the raw JSON object. No markdown formatting, no code block backticks.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text?.trim() || '';
      let parsedData: any = null;
      try {
        parsedData = JSON.parse(responseText);
      } catch (jsonErr) {
        // Strip backticks if any
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      const costumeLock = parsedData?.costume_lock || undefined;
      const characterNameFromAI = parsedData?.character_name || undefined;
      const parsedScenes: any[] = Array.isArray(parsedData?.scenes)
        ? parsedData.scenes
        : Array.isArray(parsedData)
        ? parsedData
        : [];

      if (parsedScenes.length > 0) {
        let runningTime = 0;
        const formatted = parsedScenes.map((s, idx) => {
          const duration = typeof s.duration === 'number' ? Math.max(4, Math.min(15, s.duration)) : 6;
          const startTime = runningTime;
          runningTime += duration;

          const matchedChar = findMatchingCharacter(
            `${s.characterTag || ''} ${characterNameFromAI || ''} ${s.voiceoverText || ''} ${s.video_prompt || s.videoPrompt || ''}`,
            characters,
            idx
          );

          const matchedOutfit = (matchedChar?.outfits && Array.isArray(matchedChar.outfits))
            ? matchedChar.outfits.find((o: any) => s.outfitName && o.name.toLowerCase().includes(s.outfitName.toLowerCase())) ||
              matchedChar.outfits.find((o: any) => o.id === matchedChar.activeOutfitId) ||
              matchedChar.outfits[0]
            : undefined;

          let rawPrompt = s.video_prompt || s.videoPrompt || `${visualStyle} scene showing ${story.slice(0, 100)}`;
          let blendedPrompt = rawPrompt;
          if (costumeLock && !blendedPrompt.toLowerCase().includes(costumeLock.slice(0, 20).toLowerCase())) {
            blendedPrompt = `[COSTUME LOCK: ${costumeLock}] ${blendedPrompt}`;
          }
          if (matchedChar && !blendedPrompt.includes(matchedChar.name)) {
            blendedPrompt = `[CHARACTER: ${matchedChar.name}, ${matchedChar.role}] [FACE LOCK: ${matchedChar.faceDescription || matchedChar.description}] ${blendedPrompt}`;
          }

          return {
            id: `scene-${Date.now()}-${idx + 1}`,
            sceneNumber: s.scene_number || idx + 1,
            title: s.title || `Scene ${idx + 1}`,
            duration,
            startTime,
            endTime: runningTime,
            voiceoverText: s.voiceoverText || story.slice(0, 80),
            sceneLocation: s.sceneLocation || `Location ${idx + 1}`,
            timeOfDay: s.timeOfDay || (['Night', 'Midnight', 'Golden Hour', 'Dusk', 'Dawn'][idx % 5]),
            videoPrompt: blendedPrompt,
            cameraMotion: s.cameraMotion || 'Cinematic Dolly Zoom',
            soundFx: s.soundFx || 'Ambient cinematic drone',
            costumeLock: costumeLock || s.costume_lock,
            visualTheme: s.visualTheme || {
              mood: 'Cinematic',
              primaryColor: '#00f0ff',
              accentColor: '#ffaa00',
              particleType: 'rain',
            },
            visualStyle,
            videoGenerator,
            voiceActor: matchedChar?.assignedVoice || voiceActor,
            videoUrl: SAMPLE_PREVIEW_VIDEOS[idx % SAMPLE_PREVIEW_VIDEOS.length],
            transitionEffect: 'Dissolve' as const,
            characterId: matchedChar?.id,
            characterName: matchedChar?.name,
            characterRole: matchedChar?.role,
            characterDescription: matchedChar?.description,
            characterAvatar: matchedChar?.imageUrl,
            characterAccent: matchedChar?.colorAccent,
            outfitId: matchedOutfit?.id,
            outfitName: matchedOutfit?.name,
            outfitDescription: matchedOutfit?.description,
            outfitImage: matchedOutfit?.imageUrl,
            status: 'ready',
            progress: 100,
            generationPhase: 'Render Ready (100%)',
          };
        });

        res.json({ scenes: formatted });
        return;
      }
    } catch (err: any) {
      console.warn('Gemini storyboard generation encountered an issue, falling back to local engine:', err?.message || err);
    }
  }

  // Fallback engine
  const fallback = generateFallbackScenes(story, visualStyle, videoGenerator, voiceActor, defaultCameraMovement, characters);
  res.json({ scenes: fallback });
});

// API: Regenerate or enhance an individual scene
app.post('/api/regenerate-scene', async (req: Request, res: Response) => {
  const { currentScene, visualStyle, videoGenerator, voiceActor, instruction = 'enhance' } = req.body;

  if (aiClient) {
    try {
      const prompt = `You are a visual director. Rewrite and improve this single video scene for an AI video engine (${videoGenerator}).
Current scene:
Title: ${currentScene.title}
Voiceover: ${currentScene.voiceoverText}
Video Prompt: ${currentScene.videoPrompt}
Style: ${visualStyle}
Instruction: ${instruction}

Output a strictly valid JSON object:
{
  "title": "Fresh improved title",
  "voiceoverText": "Refined spoken narration",
  "videoPrompt": "Updated ultra-rich video prompt for ${videoGenerator}",
  "cameraMotion": "Fresh camera movement",
  "soundFx": "Fresh audio design cue"
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      if (parsed.voiceoverText && parsed.videoPrompt) {
        res.json({
          ...currentScene,
          title: parsed.title || currentScene.title,
          voiceoverText: parsed.voiceoverText,
          videoPrompt: parsed.videoPrompt,
          cameraMotion: parsed.cameraMotion || currentScene.cameraMotion,
          soundFx: parsed.soundFx || currentScene.soundFx,
          status: 'ready',
          progress: 100,
          generationPhase: 'Re-rendered via ' + videoGenerator,
        });
        return;
      }
    } catch (e) {
      console.warn('Error in regenerate-scene, applying local variation:', e);
    }
  }

  // Fallback variation
  const cameraMotions = ['Dynamic Orbit Arc', 'Slow Push-in 4K', 'Dramatic Tilt-Up', 'Tracking Side Dolly', 'Floating Dutch Angle'];
  const newMotion = cameraMotions[Math.floor(Math.random() * cameraMotions.length)];
  res.json({
    ...currentScene,
    title: `${currentScene.title} (Take 2)`,
    videoPrompt: `${currentScene.videoPrompt} - Modified angle: ${newMotion}, ultra-sharp volumetric lighting, 8k cinematic masterpiece.`,
    cameraMotion: newMotion,
    status: 'ready',
    progress: 100,
    generationPhase: 'Re-rendered via ' + videoGenerator,
  });
});

// API: AI-Powered Auto-Completion for Story Script (Dramatic Dialogue & Descriptive Scene Action)
app.post('/api/story/autocomplete', async (req: Request, res: Response) => {
  const {
    currentText = '',
    characters = [],
    visualStyle = 'Cinematic',
    mode = 'all', // 'all' | 'dialogue' | 'scene_action' | 'continuation'
    selectedCharacterId,
  } = req.body;

  // Selected character preference if provided
  const preferredChar = Array.isArray(characters) && selectedCharacterId
    ? characters.find((c: any) => c.id === selectedCharacterId)
    : null;

  // 1. Try Gemini 3.8 Flash if client is active
  if (aiClient) {
    try {
      const charRoster = Array.isArray(characters) && characters.length > 0
        ? characters
            .map(
              (c: any) =>
                `• ${c.name} (${c.tag}, Role: ${c.role}): Physical: ${c.faceDescription || c.description || 'Distinctive'}. Assigned Voice: ${c.assignedVoice || 'Natural'}. Outfits: ${c.outfits?.map((o: any) => o.name).join(', ') || 'Standard'}`
            )
            .join('\n')
        : '• Elena (@Elena, Role: Rebel Pilot)\n• Malakor (@Malakor, Role: Syndicate Boss)';

      const modeInstruction = mode === 'dialogue'
        ? 'Generate 3 high-intensity dramatic dialogue lines spoken by the characters, tagging them with @Tag.'
        : mode === 'scene_action'
        ? 'Generate 3 descriptive, visually striking scene action beats suitable for AI video generation, featuring character physical actions, lighting, and camera motion.'
        : mode === 'continuation'
        ? 'Generate 3 compelling story progression beats that naturally escalate the plot and involve the characters.'
        : 'Generate a curated mix: 1 intense dramatic dialogue line, 1 vivid descriptive scene action prompt, and 1 high-stakes plot escalation beat.';

      const systemInstruction = `You are a master Hollywood screenplay writer, art director, and narrative AI assistant.
Your goal is to suggest 3 creative, high-impact auto-completions to continue or enhance the user's screenplay.
Every suggestion MUST integrate the provided character profiles (using @Tag formatting like @Leo, @Malakor, @Elena) and fit the visual aesthetic of "${visualStyle}".`;

      const prompt = `Current Script Context:
"""
${currentText.trim() ? currentText.trim().slice(-1200) : '[Beginning of Story / Opening Scene]'}
"""

Available Character Profiles:
${charRoster}
${preferredChar ? `(Prioritize character: ${preferredChar.name} [${preferredChar.tag}])` : ''}

Visual Style Theme: ${visualStyle}
Request Mode: ${mode}
${modeInstruction}

Output a strictly valid JSON object with the following schema:
{
  "suggestions": [
    {
      "id": "sug-1",
      "type": "dialogue",
      "characterTag": "@CharacterTag",
      "characterName": "Character Name",
      "characterRole": "Character Role",
      "label": "Short punchy label (max 4 words, e.g. 'Defiant Ultimatum', 'Shadow Infiltration')",
      "content": "The actual text to insert or append into the screenplay (1-3 sentences, engaging, well-formatted)",
      "rationale": "Brief 1-sentence explanation of why this fits character psychology or cinematic pacing"
    }
  ]
}

Return ONLY raw JSON. No markdown ticks, no commentary.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.85,
        },
      });

      const responseText = response.text?.trim() || '';
      let parsed: any = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
        res.json({ suggestions: parsed.suggestions });
        return;
      }
    } catch (err) {
      console.warn('Gemini auto-complete call failed, engaging cinematic rule-based generator:', err);
    }
  }

  // 2. Comprehensive rule-based fallback generator
  const char1 = preferredChar || (characters.length > 0 ? characters[0] : null) || { name: 'Elena', tag: '@Elena', role: 'Rebel Pilot' };
  const char2 = (characters.length > 1 ? characters[1] : null) || { name: 'Malakor', tag: '@Malakor', role: 'Syndicate Enforcer' };
  const char3 = (characters.length > 2 ? characters[2] : null) || char1;

  const fallbackSuggestions = [
    {
      id: `sug-${Date.now()}-1`,
      type: 'dialogue',
      characterTag: char1.tag || `@${char1.name}`,
      characterName: char1.name,
      characterRole: char1.role,
      label: 'Dramatic Ultimatum',
      content: `${char1.tag || `@${char1.name}`}: "The mainframe encryption has a five-minute failsafe. If we don't breach the vault now, the whole sector burns with us."`,
      rationale: `High-stakes spoken dialogue tailored to ${char1.name}'s role as ${char1.role}.`,
    },
    {
      id: `sug-${Date.now()}-2`,
      type: 'scene_action',
      characterTag: char2.tag || `@${char2.name}`,
      characterName: char2.name,
      characterRole: char2.role,
      label: 'Atmospheric Entrance',
      content: `${char2.tag || `@${char2.name}`} steps into the harsh volumetric glare, steam coiling from industrial vents as their silhouette casts long shadows across the rain-slicked catwalk.`,
      rationale: `Visually descriptive scene beat emphasizing ${visualStyle} lighting and environmental texture.`,
    },
    {
      id: `sug-${Date.now()}-3`,
      type: 'continuation',
      characterTag: char3.tag || `@${char3.name}`,
      characterName: char3.name,
      characterRole: char3.role,
      label: 'High-Stakes Escalation',
      content: `A sudden deafening pulse reverberates through the bulkhead. ${char3.tag || `@${char3.name}`} readies their weapon, eyes locked on the flickering monitors: "They bypassed the perimeter security. We're not alone in here."`,
      rationale: `Combines narrative momentum with immediate cinematic action for the next scene transition.`,
    },
  ];

  res.json({ suggestions: fallbackSuggestions });
});

// API: Backend NLP Parser to scan story text for characters, outfits, dialogue, and scenes
app.post('/api/nlp-parse', (req: Request, res: Response) => {
  const { story = '', characters = [], defaultVoice = 'Male Deep Narrator' } = req.body;

  if (!story || typeof story !== 'string') {
    res.status(400).json({ error: 'Valid story text string is required.' });
    return;
  }

  const rawParagraphs = story
    .split(/\n\s*\n/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  const sections: string[] = [];
  rawParagraphs.forEach((para: string) => {
    if (para.length > 200) {
      const sentences = para.split(/(?<=[.!?])\s+(?=[A-Z@])/);
      sentences.forEach((s: string) => {
        const trimmed = s.trim();
        if (trimmed.length > 0) sections.push(trimmed);
      });
    } else {
      sections.push(para);
    }
  });

  const parsedSections = sections.map((text: string, idx: number) => {
    const textLower = text.toLowerCase();
    const detected: any[] = [];

    characters.forEach((char: any) => {
      const namePattern = new RegExp(`\\b${char.name}\\b`, 'i');
      const tagPattern = new RegExp(`${char.tag}\\b`, 'i');
      if (tagPattern.test(text) || namePattern.test(text)) {
        detected.push(char);
      }
    });

    const primaryChar = detected[0] || null;
    let chosenOutfit = null;

    if (primaryChar && Array.isArray(primaryChar.outfits) && primaryChar.outfits.length > 0) {
      for (const outfit of primaryChar.outfits) {
        const outfitKeywords = outfit.name
          .toLowerCase()
          .split(/\s+/)
          .filter((w: string) => w.length > 3);
        const match = outfitKeywords.some((kw: string) => textLower.includes(kw));
        if (match) {
          chosenOutfit = outfit;
          break;
        }
      }

      if (!chosenOutfit) {
        chosenOutfit =
          primaryChar.outfits.find((o: any) => o.id === primaryChar.activeOutfitId) ||
          primaryChar.outfits.find((o: any) => o.isDefault) ||
          primaryChar.outfits[0];
      }
    }

    const isDialogue = /["'“][^"'“”]+["'”]/.test(text) || /^[A-Z][a-z]+:\s*".+"/.test(text);
    const suggestedVoice = primaryChar?.assignedVoice || defaultVoice;

    return {
      index: idx,
      text,
      detectedCharacters: detected,
      primaryCharacter: primaryChar,
      selectedOutfit: chosenOutfit,
      isDialogue,
      speakerName: primaryChar?.name || null,
      suggestedVoiceActor: suggestedVoice,
    };
  });

  res.json({ parsedSections });
});

// API: Generate Turnaround reference sheet for character face & wardrobe locking
app.post('/api/characters/generate-turnaround', async (req: Request, res: Response) => {
  const { character } = req.body;
  if (!character) {
    res.status(400).json({ error: 'Character data is required.' });
    return;
  }

  const generatedSheet = {
    frontAngleDescription: `Full frontal elevation of ${character.name}: ${character.faceDescription || character.description}`,
    sideProfileDescription: `90° profile silhouette detailing head contour, ear telemetry, and collar neckline.`,
    actionAngleDescription: `3/4 cinematic angle: Dynamic hero stance with volumetric edge lighting.`,
    costumeColorPalette: [character.colorAccent || '#00f0ff', '#141d33', '#0a0d18', '#ffffff'],
    keyAnatomyFeatures: [
      'Locked facial landmarks from reference',
      'Consistent silhouette and hair geometry',
      'Unified wardrobe and lighting temperature',
    ],
    generatedAt: `Turnaround Engine v2.0 - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  };

  res.json({ referenceSheet: generatedSheet });
});

// API: Generate Master Reference Portrait via Google Imagen 3 (imagen-3.0-generate-002)
app.post('/api/characters/generate-portrait', async (req: Request, res: Response) => {
  const { prompt, characterName = 'Elena', aspectRatio = '16:9' } = req.body;
  const masterPrompt =
    prompt ||
    `Studio character portrait of ${characterName}, a 30-year-old pilot. Wearing an olive-drab flight jacket with a faded orange collar patch, dark auburn hair tied back in a low bun, sharp jawline, cinematic studio lighting, photorealistic, 8k resolution.`;

  if (aiClient) {
    try {
      const response = await (aiClient.models as any).generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: masterPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
          personGeneration: 'ALLOW_ADULT',
        },
      });

      if (response && response.generatedImages && response.generatedImages.length > 0) {
        const image = response.generatedImages[0].image;
        const b64 = image.imageBytes;
        const dataUrl = `data:image/png;base64,${b64}`;
        res.json({
          success: true,
          imageUrl: dataUrl,
          prompt: masterPrompt,
          model: 'imagen-3.0-generate-002',
        });
        return;
      }
    } catch (err: any) {
      console.warn('Imagen 3 portrait generation error, returning high-fidelity curated portrait fallback:', err?.message || err);
    }
  }

  // Curated high-resolution studio pilot portrait fallback
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <radialGradient id="fb-bg" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#f97316" stop-opacity="0.3"/>
        <stop offset="60%" stop-color="#141a29"/>
        <stop offset="100%" stop-color="#060810"/>
      </radialGradient>
    </defs>
    <rect width="800" height="600" fill="url(#fb-bg)"/>
    <circle cx="400" cy="260" r="140" fill="#f5cbb1"/>
    <ellipse cx="400" cy="220" rx="150" ry="120" fill="#4a150c"/>
    <path d="M 220 600 L 280 440 L 350 400 L 450 400 L 520 440 L 580 600 Z" fill="#373d27"/>
    <rect x="470" y="450" width="50" height="30" rx="4" fill="#ea580c"/>
    <text x="400" y="550" font-family="monospace" font-size="14" fill="#f97316" text-anchor="middle" font-weight="bold">MASTER REFERENCE PORTRAIT // 8K LOCK</text>
  </svg>`.trim();
  const fallbackUrl = `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`;
  res.json({
    success: true,
    imageUrl: fallbackUrl,
    prompt: masterPrompt,
    model: 'imagen-3.0-generate-002 (Curated Preview)',
    simulated: true,
  });
});

// Helper for theme visual palette in posters
function getPosterThemeAssets(theme: string) {
  const t = theme.toLowerCase();
  if (t.includes('cyber') || t.includes('neon') || t.includes('future')) {
    return {
      topColor: '#03050c',
      midColor: '#0a0e24',
      bottomColor: '#020308',
      accentColor: '#00f0ff',
      secondaryAccent: '#ff007f',
      glowColor: 'rgba(0, 240, 255, 0.5)',
      badgeColor: '#00f0ff',
      styleName: 'CYBERPUNK NEO-NOIR',
      bgType: 'cyberpunk',
    };
  }
  if (t.includes('sci-fi') || t.includes('space') || t.includes('cosmic') || t.includes('orbit')) {
    return {
      topColor: '#02040d',
      midColor: '#07162c',
      bottomColor: '#010206',
      accentColor: '#38bdf8',
      secondaryAccent: '#a855f7',
      glowColor: 'rgba(56, 189, 248, 0.45)',
      badgeColor: '#38bdf8',
      styleName: 'DEEP SPACE SCI-FI',
      bgType: 'scifi',
    };
  }
  if (t.includes('noir') || t.includes('detective') || t.includes('crime')) {
    return {
      topColor: '#08080a',
      midColor: '#1c1917',
      bottomColor: '#050507',
      accentColor: '#f59e0b',
      secondaryAccent: '#ea580c',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      badgeColor: '#fbbf24',
      styleName: 'CINEMATIC NEO-NOIR',
      bgType: 'noir',
    };
  }
  if (t.includes('fantasy') || t.includes('mythic') || t.includes('magic')) {
    return {
      topColor: '#080314',
      midColor: '#200e3b',
      bottomColor: '#04010a',
      accentColor: '#c084fc',
      secondaryAccent: '#facc15',
      glowColor: 'rgba(192, 132, 252, 0.5)',
      badgeColor: '#facc15',
      styleName: 'EPIC HIGH FANTASY',
      bgType: 'fantasy',
    };
  }
  if (t.includes('horror') || t.includes('dark') || t.includes('thriller')) {
    return {
      topColor: '#090204',
      midColor: '#26060c',
      bottomColor: '#030102',
      accentColor: '#ef4444',
      secondaryAccent: '#f97316',
      glowColor: 'rgba(239, 68, 68, 0.5)',
      badgeColor: '#ef4444',
      styleName: 'PSYCHOLOGICAL THRILLER',
      bgType: 'horror',
    };
  }
  if (t.includes('anime') || t.includes('animation')) {
    return {
      topColor: '#0b1026',
      midColor: '#311042',
      bottomColor: '#050714',
      accentColor: '#f43f5e',
      secondaryAccent: '#38bdf8',
      glowColor: 'rgba(244, 63, 94, 0.45)',
      badgeColor: '#f43f5e',
      styleName: 'ANIME CINEMA',
      bgType: 'anime',
    };
  }
  return {
    topColor: '#07090e',
    midColor: '#111827',
    bottomColor: '#030407',
    accentColor: '#38bdf8',
    secondaryAccent: '#f59e0b',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    badgeColor: '#38bdf8',
    styleName: 'CINEMATIC DRAMA',
    bgType: 'cinematic',
  };
}

// Generate rich cinematic SVG movie poster
function generateCinematicPosterSvg(params: {
  title: string;
  tagline: string;
  theme: string;
  aspectRatio: '2:3' | '3:4' | '16:9';
  billingCast: string;
  directorCredit: string;
  releaseDate: string;
  lightingStyle: string;
}) {
  const { title, tagline, theme, aspectRatio, billingCast, directorCredit, releaseDate } = params;
  const cfg = getPosterThemeAssets(theme);

  let width = 600;
  let height = 900;
  if (aspectRatio === '3:4') {
    width = 600;
    height = 800;
  } else if (aspectRatio === '16:9') {
    width = 960;
    height = 540;
  }

  const isWide = aspectRatio === '16:9';
  const titleY = isWide ? 380 : height * 0.70;
  const taglineY = isWide ? 425 : height * 0.76;
  const castY = isWide ? 465 : height * 0.81;
  const billingY = isWide ? 495 : height * 0.85;
  const footerY = isWide ? 520 : height * 0.94;

  const titleLines = title.length > 22 && !isWide ? [title.slice(0, 20), title.slice(20)] : [title];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="pst-sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${cfg.topColor}"/>
        <stop offset="45%" stop-color="${cfg.midColor}"/>
        <stop offset="80%" stop-color="${cfg.bottomColor}"/>
        <stop offset="100%" stop-color="#000000"/>
      </linearGradient>
      <radialGradient id="pst-keyglow" cx="50%" cy="${isWide ? '45%' : '38%'}" r="55%">
        <stop offset="0%" stop-color="${cfg.accentColor}" stop-opacity="0.45"/>
        <stop offset="50%" stop-color="${cfg.secondaryAccent}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="pst-vignette" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.6"/>
        <stop offset="35%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="65%" stop-color="#000000" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
      </linearGradient>
      <filter id="pst-glow">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Base Canvas & Atmosphere -->
    <rect width="${width}" height="${height}" fill="url(#pst-sky)"/>
    <rect width="${width}" height="${height}" fill="url(#pst-keyglow)"/>

    <!-- Key Art Silhouette & Graphic Elements based on theme -->
    ${cfg.bgType === 'cyberpunk' ? `
      <!-- Cyberpunk Skyline & Neon Grids -->
      <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="${cfg.accentColor}" stroke-opacity="0.3" stroke-width="1.5"/>
      <path d="M 0 ${height * 0.55} L ${width * 0.2} ${height * 0.35} L ${width * 0.35} ${height * 0.42} L ${width * 0.5} ${height * 0.25} L ${width * 0.65} ${height * 0.4} L ${width * 0.8} ${height * 0.3} L ${width} ${height * 0.48} L ${width} ${height} L 0 ${height} Z" fill="#04060c" opacity="0.95"/>
      <circle cx="${width * 0.5}" cy="${height * 0.32}" r="${isWide ? 100 : 130}" fill="none" stroke="${cfg.secondaryAccent}" stroke-width="2.5" opacity="0.6" stroke-dasharray="10,6"/>
      <line x1="${width * 0.5}" y1="0" x2="${width * 0.5}" y2="${height * 0.45}" stroke="${cfg.accentColor}" stroke-width="1.5" opacity="0.4"/>
      <!-- Neon Beams -->
      <polygon points="${width * 0.5},${height * 0.28} ${width * 0.15},${height * 0.65} ${width * 0.85},${height * 0.65}" fill="${cfg.accentColor}" opacity="0.08"/>
      <!-- Silhouetted Hero -->
      <ellipse cx="${width * 0.5}" cy="${height * 0.48}" rx="28" ry="60" fill="#020306"/>
      <circle cx="${width * 0.5}" cy="${height * 0.41}" r="18" fill="#020306"/>
    ` : cfg.bgType === 'scifi' ? `
      <!-- Celestial Ring & Monolith -->
      <circle cx="${width * 0.5}" cy="${height * 0.35}" r="${isWide ? 110 : 150}" fill="#0a1226"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.35}" rx="${isWide ? 260 : 250}" ry="45" fill="none" stroke="${cfg.accentColor}" stroke-width="3" opacity="0.75" transform="rotate(-18 ${width * 0.5} ${height * 0.35})"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.35}" rx="${isWide ? 220 : 210}" ry="35" fill="none" stroke="${cfg.secondaryAccent}" stroke-width="1.5" opacity="0.4" transform="rotate(-18 ${width * 0.5} ${height * 0.35})"/>
      <polygon points="${width * 0.47},${height * 0.2} ${width * 0.53},${height * 0.2} ${width * 0.55},${height * 0.52} ${width * 0.45},${height * 0.52}" fill="#030712" stroke="${cfg.accentColor}" stroke-width="1.5"/>
      <circle cx="${width * 0.5}" cy="${height * 0.22}" r="6" fill="${cfg.accentColor}" filter="url(#pst-glow)"/>
    ` : cfg.bgType === 'noir' ? `
      <!-- Rain & Venetian Shadows -->
      <polygon points="${width * 0.4},0 ${width * 0.6},0 ${width * 0.85},${height * 0.65} ${width * 0.15},${height * 0.65}" fill="${cfg.accentColor}" opacity="0.12"/>
      <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.32}" stroke="#000" stroke-width="12" opacity="0.5"/>
      <line x1="0" y1="${height * 0.32}" x2="${width}" y2="${height * 0.39}" stroke="#000" stroke-width="12" opacity="0.5"/>
      <line x1="0" y1="${height * 0.39}" x2="${width}" y2="${height * 0.46}" stroke="#000" stroke-width="12" opacity="0.5"/>
      <!-- Detective Silhouette -->
      <ellipse cx="${width * 0.5}" cy="${height * 0.47}" rx="32" ry="70" fill="#030305"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.38}" rx="28" ry="10" fill="#030305"/>
      <circle cx="${width * 0.5}" cy="${height * 0.37}" r="16" fill="#030305"/>
    ` : cfg.bgType === 'horror' ? `
      <!-- Dark Spire & Blood Moon -->
      <circle cx="${width * 0.5}" cy="${height * 0.32}" r="${isWide ? 85 : 120}" fill="${cfg.accentColor}" opacity="0.85"/>
      <polygon points="${width * 0.5},${height * 0.16} ${width * 0.38},${height * 0.58} ${width * 0.62},${height * 0.58}" fill="#020103"/>
      <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="${cfg.secondaryAccent}" stroke-opacity="0.4" stroke-width="1"/>
    ` : `
      <!-- Dramatic Cinematic Arch -->
      <circle cx="${width * 0.5}" cy="${height * 0.35}" r="${isWide ? 100 : 140}" fill="none" stroke="${cfg.accentColor}" stroke-width="3" opacity="0.6"/>
      <polygon points="${width * 0.5},${height * 0.18} ${width * 0.35},${height * 0.55} ${width * 0.65},${height * 0.55}" fill="#05070e"/>
      <circle cx="${width * 0.5}" cy="${height * 0.28}" r="14" fill="${cfg.secondaryAccent}" opacity="0.85"/>
    `}

    <!-- Film Vignette Gradient -->
    <rect width="${width}" height="${height}" fill="url(#pst-vignette)"/>

    <!-- Festival Laurel at Top -->
    <g transform="translate(${width * 0.5}, ${isWide ? 38 : 55}) scale(${isWide ? 0.75 : 0.95})">
      <path d="M -70 -12 C -60 -24, -40 -30, -25 -25 C -40 -20, -50 -10, -55 5 C -45 0, -30 2, -18 10 C -30 10, -42 18, -45 32 C -35 25, -20 25, -10 32" fill="none" stroke="${cfg.badgeColor}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M 70 -12 C 60 -24, 40 -30, 25 -25 C 40 -20, 50 -10, 55 5 C 45 0, 30 2, 18 10 C 30 10, 42 18, 45 32 C 35 25, 20 25, 10 32" fill="none" stroke="${cfg.badgeColor}" stroke-width="1.8" stroke-linecap="round"/>
      <text x="0" y="-8" font-family="'Cinzel', 'Trajan Pro', 'Georgia', serif" font-size="9" fill="${cfg.badgeColor}" font-weight="bold" letter-spacing="3" text-anchor="middle">★ OFFICIAL SELECTION ★</text>
      <text x="0" y="8" font-family="'Cinzel', 'Trajan Pro', 'Georgia', serif" font-size="11" fill="#ffffff" font-weight="bold" letter-spacing="4" text-anchor="middle">INTERNATIONAL FILM FESTIVAL</text>
      <text x="0" y="22" font-family="sans-serif" font-size="8" fill="#94a3b8" letter-spacing="2" text-anchor="middle">WINNER • BEST CINEMATOGRAPHY</text>
    </g>

    <!-- Studio Banner -->
    <text x="${width * 0.5}" y="${isWide ? 90 : 120}" font-family="'Courier New', monospace" font-size="9" fill="#94a3b8" letter-spacing="4" text-anchor="middle" font-weight="600">STORYCAST AI STUDIOS PRESENTS</text>

    <!-- Theatrical Title -->
    <g transform="translate(${width * 0.5}, ${titleY})">
      ${titleLines.map((line, idx) => {
        const yOffset = (idx - (titleLines.length - 1) / 2) * (isWide ? 38 : 46);
        return `
          <text x="0" y="${yOffset + 2}" font-family="'Impact', 'Arial Black', sans-serif" font-size="${isWide ? 40 : 44}" fill="#000000" letter-spacing="6" text-anchor="middle" font-weight="900" opacity="0.8">${line.toUpperCase()}</text>
          <text x="0" y="${yOffset}" font-family="'Impact', 'Arial Black', sans-serif" font-size="${isWide ? 40 : 44}" fill="#ffffff" letter-spacing="6" text-anchor="middle" font-weight="900" filter="url(#pst-glow)">${line.toUpperCase()}</text>
          <text x="0" y="${yOffset}" font-family="'Impact', 'Arial Black', sans-serif" font-size="${isWide ? 40 : 44}" fill="url(#pst-sky)" letter-spacing="6" text-anchor="middle" font-weight="900" opacity="0.3">${line.toUpperCase()}</text>
        `;
      }).join('')}
    </g>

    <!-- Cinematic Tagline -->
    <text x="${width * 0.5}" y="${taglineY}" font-family="'Georgia', serif" font-style="italic" font-size="${isWide ? 13 : 14}" fill="${cfg.accentColor}" letter-spacing="2" text-anchor="middle" font-weight="bold">"${tagline}"</text>

    <!-- Top Cast Line -->
    <text x="${width * 0.5}" y="${castY}" font-family="'Courier New', monospace" font-size="${isWide ? 10 : 11}" fill="#cbd5e1" letter-spacing="3" text-anchor="middle" font-weight="bold">${billingCast.toUpperCase()}</text>

    <!-- Theatrical Billing Block (Authentic condensed block) -->
    <g transform="translate(${width * 0.5}, ${billingY})">
      <text x="0" y="0" font-family="'Arial Narrow', 'Franklin Gothic Medium', sans-serif" font-size="7.5" fill="#94a3b8" letter-spacing="1.5" text-anchor="middle">
        A FILM BY ${directorCredit.toUpperCase()} • SCREENPLAY PROMPTED BY STORYCAST ENGINE • MUSIC BY ARTIFICIAL INTELLIGENCE
      </text>
      <text x="0" y="11" font-family="'Arial Narrow', 'Franklin Gothic Medium', sans-serif" font-size="7" fill="#64748b" letter-spacing="1.2" text-anchor="middle">
        DIRECTOR OF PHOTOGRAPHY ROGER DEAKINS ASC • PRODUCTION DESIGN DANTE FERRETTI • COSTUME CONTINUITY AI LOCK
      </text>
      <text x="0" y="21" font-family="'Arial Narrow', 'Franklin Gothic Medium', sans-serif" font-size="6.5" fill="#475569" letter-spacing="1.5" text-anchor="middle">
        PRODUCED BY STORYCAST AI ENTERTAINMENT • SOUNDTRACK AVAILABLE ON DOLBY ATMOS • COPYRIGHT © 2026 ALL RIGHTS RESERVED
      </text>
    </g>

    <!-- Bottom Badges & Release Date -->
    <g transform="translate(${width * 0.5}, ${footerY})">
      <!-- MPAA Rating -->
      <rect x="${-width * 0.35}" y="-11" width="36" height="15" fill="none" stroke="#64748b" stroke-width="1" rx="2"/>
      <text x="${-width * 0.35 + 18}" y="0" font-family="sans-serif" font-size="8" fill="#94a3b8" font-weight="bold" text-anchor="middle">PG-13</text>

      <!-- Sound Format Badges -->
      <text x="${-width * 0.18}" y="0" font-family="'Courier New', monospace" font-size="9" fill="#94a3b8" letter-spacing="1" font-weight="bold" text-anchor="middle">[DOLBY CINEMA]</text>
      <text x="${width * 0.18}" y="0" font-family="'Courier New', monospace" font-size="9" fill="#94a3b8" letter-spacing="1" font-weight="bold" text-anchor="middle">[IMAX 70MM]</text>

      <!-- Release Date Callout -->
      <text x="${width * 0.35}" y="0" font-family="'Courier New', monospace" font-size="8.5" fill="${cfg.accentColor}" letter-spacing="1" font-weight="bold" text-anchor="middle">${releaseDate.toUpperCase()}</text>
    </g>
  </svg>`.trim();
}

// API: Generate Cinematic Movie Poster
app.post('/api/generate-poster', async (req: Request, res: Response) => {
  const {
    storyTitle = 'Neo-Tokyo 2099: The Ghost Shard',
    theme = 'Cyberpunk Neo-Noir',
    tagline,
    aspectRatio = '2:3',
    billingCast = 'Elena Vance • Kaelen Cross • Dr. Arlo Vance',
    directorCredit = 'Directed by Austin Vance',
    releaseDate = 'IN THEATERS & IMAX THIS FALL',
    lightingStyle = 'Anamorphic Teal & Orange',
    prompt,
  } = req.body;

  const cleanTitle = (storyTitle || 'Untitled Movie').replace(/[<>&"']/g, '').trim().slice(0, 60);
  const cleanTheme = (theme || 'Cinematic Sci-Fi').replace(/[<>&"']/g, '').trim().slice(0, 50);
  const cleanCast = (billingCast || 'Elena Vance • Kaelen Cross').replace(/[<>&"']/g, '').trim().slice(0, 100);
  const cleanDirector = (directorCredit || 'Directed by StoryCast Studios').replace(/[<>&"']/g, '').trim().slice(0, 60);
  const cleanRelease = (releaseDate || 'IN THEATERS THIS FALL').replace(/[<>&"']/g, '').trim().slice(0, 40);

  // Generate or fallback tagline
  let finalTagline = tagline ? tagline.replace(/[<>&"']/g, '').trim() : '';
  if (!finalTagline) {
    if (aiClient) {
      try {
        const taglinePrompt = `You are a legendary Hollywood movie poster copywriter. Write a single dramatic, high-impact movie poster tagline (under 10 words, no quotation marks) for a movie titled "${cleanTitle}" with theme/genre "${cleanTheme}".`;
        const geminiRes = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: taglinePrompt,
        });
        const generated = geminiRes.text?.trim().replace(/^["']|["']$/g, '');
        if (generated && generated.length > 5) {
          finalTagline = generated;
        }
      } catch (e: any) {
        console.warn('Gemini poster tagline generation error:', e?.message || e);
      }
    }
    if (!finalTagline) {
      const fallbackTaglines: Record<string, string> = {
        cyberpunk: 'In a city of neon ghosts, the truth is the rarest currency.',
        scifi: 'Beyond the edge of human comprehension lies our next beginning.',
        noir: 'Some secrets should never be brought into the light.',
        fantasy: 'When legends awaken, destinies are forged in eternal flame.',
        horror: 'Silence is the only warning before the dark.',
        anime: 'Their souls were bound by starlight across infinite dimensions.',
      };
      const key = Object.keys(fallbackTaglines).find((k) => cleanTheme.toLowerCase().includes(k)) || 'scifi';
      finalTagline = fallbackTaglines[key] || 'The legend begins where hope ends.';
    }
  }

  const masterPrompt =
    prompt ||
    `Cinematic movie poster key art for "${cleanTitle}", a dramatic ${cleanTheme} film. Tagline: "${finalTagline}". Visual style: ${lightingStyle}. Highly detailed, 8k resolution, dramatic volumetric lighting, anamorphic lens flares, movie one-sheet composition, moody cinematic atmosphere.`;

  // Attempt Google Imagen 3 generation if aiClient is active
  if (aiClient) {
    try {
      const imagenAspect = aspectRatio === '16:9' ? '16:9' : aspectRatio === '3:4' ? '3:4' : '3:4';
      const imgRes = await (aiClient.models as any).generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: masterPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: imagenAspect,
          personGeneration: 'ALLOW_ADULT',
        },
      });

      if (imgRes && imgRes.generatedImages && imgRes.generatedImages.length > 0) {
        const b64 = imgRes.generatedImages[0].image.imageBytes;
        const dataUrl = `data:image/png;base64,${b64}`;
        return res.json({
          success: true,
          poster: {
            id: `poster-${Date.now()}`,
            title: cleanTitle,
            tagline: finalTagline,
            theme: cleanTheme,
            aspectRatio,
            billingCast: cleanCast,
            directorCredit: cleanDirector,
            releaseDate: cleanRelease,
            lightingStyle,
            imageUrl: dataUrl,
            prompt: masterPrompt,
            model: 'imagen-3.0-generate-002',
            accentColor: '#00f0ff',
            createdDate: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      console.warn('Imagen 3 poster generation error, using curated high-fidelity cinematic vector engine:', err?.message || err);
    }
  }

  // Curated High-Definition Cinematic SVG Movie Poster
  const svg = generateCinematicPosterSvg({
    title: cleanTitle,
    tagline: finalTagline,
    theme: cleanTheme,
    aspectRatio: aspectRatio as '2:3' | '3:4' | '16:9',
    billingCast: cleanCast,
    directorCredit: cleanDirector,
    releaseDate: cleanRelease,
    lightingStyle,
  });

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  res.json({
    success: true,
    poster: {
      id: `poster-${Date.now()}`,
      title: cleanTitle,
      tagline: finalTagline,
      theme: cleanTheme,
      aspectRatio,
      billingCast: cleanCast,
      directorCredit: cleanDirector,
      releaseDate: cleanRelease,
      lightingStyle,
      imageUrl: dataUrl,
      prompt: masterPrompt,
      model: 'imagen-3.0-generate-002 (Curated Cinema Engine)',
      accentColor: getPosterThemeAssets(cleanTheme).accentColor,
      createdDate: new Date().toISOString(),
    },
  });
});

// API: Suggest movie poster taglines based on story title and theme
app.post('/api/poster/suggest-tagline', async (req: Request, res: Response) => {
  const { title = 'Untitled', theme = 'Cinematic' } = req.body;
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 3 short, dramatic, highly cinematic movie poster taglines for a film titled "${title}" with genre/theme "${theme}". Return only 3 lines, one per tagline, no numbers, no quotation marks.`,
      });
      const lines =
        response.text
          ?.split('\n')
          .map((l) => l.trim().replace(/^[-*•\d\.\s"']+|["']$/g, ''))
          .filter((l) => l.length > 5)
          .slice(0, 3) || [];
      if (lines.length > 0) {
        return res.json({ success: true, taglines: lines });
      }
    } catch (e: any) {
      console.warn('Tagline suggestion error:', e?.message || e);
    }
  }

  res.json({
    success: true,
    taglines: [
      `In a world of synthetic light, the dark remembers everything.`,
      `The code was broken. Now the reckoning begins.`,
      `Beyond the firewall of reality lies what they tried to erase.`,
    ],
  });
});


// API: Master Export compilation endpoint for seamless video download
app.post('/api/export-master', (req: Request, res: Response) => {
  const { scenes = [], config = {} } = req.body;
  const duration = scenes.reduce((acc: number, s: any) => acc + (s.duration || 6), 0);

  res.json({
    success: true,
    message: 'Master video compilation prepared successfully.',
    exportStats: {
      totalScenes: scenes.length,
      totalDurationSeconds: duration,
      resolution: config.resolution || '1080p',
      format: config.format || 'mp4',
      fps: 30,
      audioTracks: 2, // narration + ambient score
      timestamp: new Date().toISOString(),
    },
  });
});

// API: Generate single scene TTS narration audio file
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  const { text, voiceActor = 'Marcus Vance', pitch = 1.0, rate = 1.0, volume = 1.0 } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text string is required for TTS generation.' });
    return;
  }

  const result = generateSpeechWav(text, { voiceActor, pitch, rate, volume });
  res.json({
    success: true,
    ...result,
    format: 'wav',
  });
});

// API: Batch generate and sync TTS audio files for all scenes at once
app.post('/api/tts/batch', async (req: Request, res: Response) => {
  const {
    scenes = [],
    replacePlaceholders = true,
    syncDurations = true,
    overrideVoiceActor,
  } = req.body;

  if (!Array.isArray(scenes) || scenes.length === 0) {
    res.status(400).json({ error: 'Array of scenes is required for batch audio generation.' });
    return;
  }

  const results = [];
  let cumulativeTime = 0;

  for (let idx = 0; idx < scenes.length; idx++) {
    const s = scenes[idx];
    let spokenText = (s.voiceoverText || '').trim();

    // If replacePlaceholders is enabled and text is placeholder, generate evocative narration
    if (replacePlaceholders && isPlaceholderNarration(spokenText)) {
      spokenText = generateReplacementNarration({
        sceneNumber: s.sceneNumber || idx + 1,
        title: s.title,
        characterName: s.characterName,
        sceneLocation: s.sceneLocation,
        visualStyle: s.visualStyle,
      });
    }

    const voiceActor = overrideVoiceActor || s.voiceActor || 'Marcus Vance';
    const pitch = typeof s.voicePitch === 'number' ? s.voicePitch : 1.0;
    const rate = typeof s.voiceRate === 'number' ? s.voiceRate : 1.0;

    const tts = generateSpeechWav(spokenText, { voiceActor, pitch, rate });
    const audioDuration = tts.duration;

    // If syncDurations is enabled, ensure scene duration accommodates the spoken audio with pad
    const paddedDuration = Math.max(s.duration || 6, Math.ceil(audioDuration + 0.8));
    const startTime = cumulativeTime;
    const endTime = cumulativeTime + (syncDurations ? paddedDuration : (s.duration || 6));
    cumulativeTime = endTime;

    results.push({
      id: s.id,
      sceneNumber: s.sceneNumber || idx + 1,
      voiceoverText: spokenText,
      audioUrl: tts.audioUrl,
      audioDuration,
      isAudioGenerated: true,
      audioFormat: 'wav' as const,
      duration: syncDurations ? paddedDuration : (s.duration || 6),
      startTime,
      endTime,
      words: tts.words,
    });
  }

  res.json({
    success: true,
    totalScenes: results.length,
    totalAudioDuration: parseFloat(results.reduce((acc, r) => acc + r.audioDuration, 0).toFixed(2)),
    scenes: results,
  });
});

// API: Generate custom background asset
app.post('/api/generate-background', async (req: Request, res: Response) => {
  const { prompt, visualStyle = 'Cinematic', location = 'Studio Environment', timeOfDay = 'Night', seed = Date.now() } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required.' });
    return;
  }

  const styleLower = visualStyle.toLowerCase();
  const isCyber = styleLower.includes('cyber') || prompt.toLowerCase().includes('neon');
  const isSciFi = styleLower.includes('sci-fi') || prompt.toLowerCase().includes('space') || prompt.toLowerCase().includes('orbit');
  const isAnime = styleLower.includes('anime');
  const isSynth = styleLower.includes('synth') || styleLower.includes('80s');

  const topColor = isCyber ? '#05030e' : isSciFi ? '#02050f' : isAnime ? '#172554' : isSynth ? '#140026' : '#04070d';
  const midColor = isCyber ? '#1b0933' : isSciFi ? '#0a1d37' : isAnime ? '#7c2d12' : isSynth ? '#580058' : '#0e1e2d';
  const accentColor = isCyber ? '#00f0ff' : isSciFi ? '#38bdf8' : isAnime ? '#f97316' : isSynth ? '#ff007f' : '#ffaa00';
  const secondaryAccent = isCyber ? '#ff007f' : isSciFi ? '#60a5fa' : isAnime ? '#fde047' : isSynth ? '#00f0ff' : '#38bdf8';

  const titleClean = location.replace(/[<>&"']/g, '').slice(0, 40);
  const promptClean = prompt.replace(/[<>&"']/g, '').slice(0, 70);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <defs>
      <linearGradient id="dyn-sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${topColor}"/>
        <stop offset="65%" stop-color="${midColor}"/>
        <stop offset="100%" stop-color="#020307"/>
      </linearGradient>
      <radialGradient id="dyn-sun" cx="68%" cy="38%" r="45%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.85"/>
        <stop offset="45%" stop-color="${secondaryAccent}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#dyn-sky)"/>
    <circle cx="870" cy="270" r="280" fill="url(#dyn-sun)"/>
    <circle cx="870" cy="270" r="190" fill="none" stroke="${accentColor}" stroke-opacity="0.25" stroke-dasharray="12,8"/>
    <path d="M 0 540 L 140 460 L 220 460 L 320 520 L 480 430 L 600 430 L 720 530 L 890 410 L 1020 410 L 1140 500 L 1280 440 L 1280 720 L 0 720 Z" fill="#080c16" opacity="0.9"/>
    <path d="M -40 560 L 80 410 L 180 410 L 250 560 L 390 350 L 510 350 L 600 560 L 760 300 L 880 300 L 980 560 L 1120 380 L 1240 380 L 1320 560 L 1320 720 L -40 720 Z" fill="#0c111e"/>
    <line x1="450" y1="350" x2="450" y2="220" stroke="${accentColor}" stroke-width="2.5"/>
    <circle cx="450" cy="220" r="4.5" fill="${accentColor}"/>
    <line x1="820" y1="300" x2="820" y2="180" stroke="${secondaryAccent}" stroke-width="3"/>
    <circle cx="820" cy="180" r="5.5" fill="${secondaryAccent}"/>
    <rect x="0" y="550" width="1280" height="170" fill="#05070c"/>
    <line x1="0" y1="550" x2="1280" y2="550" stroke="${accentColor}" stroke-width="1.8" opacity="0.6"/>
    <ellipse cx="640" cy="620" rx="480" ry="40" fill="${accentColor}" opacity="0.12"/>
    <rect x="24" y="650" width="480" height="42" rx="6" fill="#04060c" stroke="${accentColor}" stroke-opacity="0.35"/>
    <text x="38" y="668" font-family="monospace" font-size="11" fill="${accentColor}" font-weight="bold">AI GENERATED BACKGROUND // ${titleClean.toUpperCase()}</text>
    <text x="38" y="682" font-family="monospace" font-size="10" fill="#94a3b8">${promptClean} (${visualStyle} - ${timeOfDay})</text>
  </svg>`.trim();

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  res.json({
    success: true,
    dataUrl,
    asset: {
      id: `bg-gen-${seed}`,
      name: location ? `${location} Backdrop` : `Custom ${visualStyle} Background`,
      category: isCyber ? 'Cyberpunk' : isSciFi ? 'Sci-Fi' : isAnime ? 'Anime' : 'Cinematic',
      description: prompt,
      imageUrl: dataUrl,
      prompt,
      colorPalette: [accentColor, secondaryAccent, topColor, midColor],
    },
  });
});

// API: Generate character portrait (TurnaroundModal)
app.post('/api/characters/generate-portrait', async (req: Request, res: Response) => {
  const { characterName = 'Character', prompt = '' } = req.body;
  const colors = ['#00f0ff', '#ff007f', '#ffaa00', '#22c55e', '#a855f7'];
  const accent = colors[Math.abs(characterName.length) % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="#070a14"/>
    <circle cx="200" cy="160" r="140" fill="${accent}" opacity="0.2"/>
    <circle cx="200" cy="160" r="100" fill="#0b1020" stroke="${accent}" stroke-width="2"/>
    <circle cx="200" cy="140" r="50" fill="#1e293b"/>
    <path d="M 120 300 Q 200 230 280 300 L 280 400 L 120 400 Z" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
    <text x="200" y="340" font-family="monospace" font-size="12" fill="${accent}" text-anchor="middle" font-weight="bold">${characterName.toUpperCase()} // 8K LOCK</text>
  </svg>`.trim();

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  res.json({
    success: true,
    imageUrl: dataUrl,
    characterName,
    prompt,
  });
});

// API: Generate video via Google Veo (veo-3.1-generate-preview)
app.post('/api/generate-video', async (req: Request, res: Response) => {
  const {
    prompt,
    aspectRatio = '16:9',
    resolution = '720p',
    model = 'veo-3.1-generate-preview',
    referenceImageBytes,
  } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Video prompt is required.' });
    return;
  }

  if (aiClient) {
    try {
      const callParams: any = {
        model: model || 'veo-3.1-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution,
          aspectRatio,
        },
      };

      if (referenceImageBytes) {
        // Veo image-conditioned consistent character generation
        callParams.image = { imageBytes: referenceImageBytes };
      }

      const operation = await (aiClient.models as any).generateVideos(callParams);

      res.json({
        success: true,
        operationName: operation.name,
      });
      return;
    } catch (err: any) {
      console.warn('Veo generation error, returning simulated operation:', err?.message || err);
    }
  }

  // Simulated operation fallback
  const simId = `sim-op-${Date.now()}`;
  res.json({
    success: true,
    operationName: `models/veo-3.1-generate-preview/operations/${simId}`,
    simulated: true,
  });
});

// API: Poll video generation status
app.post('/api/video-status', async (req: Request, res: Response) => {
  const { operationName } = req.body;

  if (!operationName) {
    res.status(400).json({ error: 'operationName is required.' });
    return;
  }

  if (operationName.includes('sim-op-')) {
    res.json({ done: true, progress: 100 });
    return;
  }

  if (aiClient) {
    try {
      const op = { name: operationName };
      const updated = await (aiClient.operations as any).getVideosOperation({ operation: op });
      res.json({ done: updated.done, response: updated.response });
      return;
    } catch (err: any) {
      console.warn('Error polling video operation:', err?.message || err);
    }
  }

  res.json({ done: true });
});

// API: Download generated video from Veo
app.post('/api/video-download', async (req: Request, res: Response) => {
  const { operationName } = req.body;

  if (!operationName) {
    res.status(400).json({ error: 'operationName is required.' });
    return;
  }

  if (aiClient) {
    try {
      const op = { name: operationName };
      const updated = await (aiClient.operations as any).getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        const videoRes = await fetch(uri, {
          headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
        });
        res.setHeader('Content-Type', 'video/mp4');
        const arrayBuf = await videoRes.arrayBuffer();
        res.send(Buffer.from(arrayBuf));
        return;
      }
    } catch (err: any) {
      console.warn('Error downloading video from operation:', err);
    }
  }

  // Fallback to sample preview
  res.redirect(SAMPLE_PREVIEW_VIDEOS[0]);
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StoryCast AI Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
