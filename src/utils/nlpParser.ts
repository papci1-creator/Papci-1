import { CharacterProfile, CharacterOutfit, Scene, TimeOfDay } from '../types';

export interface ParsedSceneSection {
  index: number;
  text: string;
  detectedCharacters: CharacterProfile[];
  primaryCharacter?: CharacterProfile;
  selectedOutfit?: CharacterOutfit;
  isDialogue: boolean;
  speakerName?: string;
  suggestedVoiceActor: string;
  sceneLocation?: string;
  timeOfDay?: TimeOfDay;
}

/**
 * Helper to detect time of day lighting from narrative text
 */
function detectTimeOfDay(textLower: string, index: number): TimeOfDay {
  if (/\b(midnight|dead of night|witching hour)\b/.test(textLower)) return 'Midnight';
  if (/\b(night|darkness|moonlight|starlit|nocturnal|dark)\b/.test(textLower)) return 'Night';
  if (/\b(golden hour|late afternoon|amber glow|sunset warmth)\b/.test(textLower)) return 'Golden Hour';
  if (/\b(sunset|dusk|twilight|sundown|evening|crepuscular)\b/.test(textLower)) return 'Dusk';
  if (/\b(dawn|sunrise|daybreak|first light|early morning)\b/.test(textLower)) return 'Dawn';
  if (/\b(day|daylight|noon|midday|bright sun|sunlit|morning)\b/.test(textLower)) return 'Day';
  const defaults: TimeOfDay[] = ['Night', 'Midnight', 'Golden Hour', 'Dusk', 'Dawn', 'Day'];
  return defaults[index % defaults.length];
}

/**
 * Helper to detect location/setting from narrative text
 */
function detectSceneLocation(text: string, index: number): string {
  const textLower = text.toLowerCase();
  
  if (/\b(temple|ancient temple|ruins|altar|sanctuary)\b/.test(textLower)) return 'Ancient Martian Temple';
  if (/\b(mars|red sands|martian|canyon|crater)\b/.test(textLower)) return 'Red Sands of Mars';
  if (/\b(sublevel|underground|bunker|catacomb)\b/.test(textLower)) return 'Neo-Tokyo Sublevel 4';
  if (/\b(vault|archive|quantum chamber|server room)\b/.test(textLower)) return 'High-Tech Archive Vault';
  if (/\b(catwalk|bridge|rooftop|skyscrapers|tower)\b/.test(textLower)) return 'Megastructure Catwalks';
  if (/\b(orbit|space station|observation deck|airlock)\b/.test(textLower)) return 'Orbital Observation Deck';
  if (/\b(laboratory|clean room|research facility)\b/.test(textLower)) return 'Cybernetic Research Lab';
  if (/\b(alley|neon street|market|district)\b/.test(textLower)) return 'Neon District Alleyway';
  
  // Regex match for phrases like "in the <Location>", "inside the <Location>", "at the <Location>"
  const match = text.match(/\b(?:in|inside|under|at|across|entering|exploring)\s+(?:the\s+)?([a-z0-9\s]{3,24}?)(?:[.,;]|\s+as\s+|\s+where\s+)/i);
  if (match && match[1] && match[1].trim().length > 3) {
    const raw = match[1].trim();
    // Capitalize words
    return raw.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const fallbackLocations = [
    'Neo-Tokyo Sublevel 4',
    'High-Tech Archive Vault',
    'Megastructure Catwalks',
    'Orbital Observation Deck',
    'Ancient Martian Temple',
  ];
  return fallbackLocations[index % fallbackLocations.length];
}

/**
 * Automatically parses story text into scenes, detects characters via NLP name & tag scanning,
 * outfits, setting locations, and lighting times of day.
 */
export function parseStoryNLP(
  storyText: string,
  characters: CharacterProfile[],
  defaultVoice: string
): ParsedSceneSection[] {
  if (!storyText.trim()) return [];

  // Split story by double linebreaks or distinct narrative sentences
  const rawParagraphs = storyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sections: string[] = [];

  rawParagraphs.forEach((para) => {
    // If paragraph is long, split by sentences (period followed by space/capital letter)
    if (para.length > 200) {
      const sentences = para.split(/(?<=[.!?])\s+(?=[A-Z@])/);
      sentences.forEach((s) => {
        const trimmed = s.trim();
        if (trimmed.length > 0) sections.push(trimmed);
      });
    } else {
      sections.push(para);
    }
  });

  const parsedResults: ParsedSceneSection[] = sections.map((text, idx) => {
    const textLower = text.toLowerCase();

    // 1. Scan for character tags (@Leo) and names (Leo)
    const detected: CharacterProfile[] = [];

    characters.forEach((char) => {
      const namePattern = new RegExp(`\\b${char.name}\\b`, 'i');
      const tagPattern = new RegExp(`${char.tag}\\b`, 'i');

      if (tagPattern.test(text) || namePattern.test(text)) {
        detected.push(char);
      }
    });

    const primaryChar = detected[0] || undefined;

    // 2. Scan for Outfit keywords if a character is detected
    let chosenOutfit: CharacterOutfit | undefined = undefined;

    if (primaryChar && primaryChar.outfits && primaryChar.outfits.length > 0) {
      // Check if text mentions words in any outfit name or description
      for (const outfit of primaryChar.outfits) {
        const outfitKeywords = outfit.name
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3);
        const match = outfitKeywords.some((kw) => textLower.includes(kw));
        if (match) {
          chosenOutfit = outfit;
          break;
        }
      }

      // If no specific keyword match, use character's active outfit or default outfit
      if (!chosenOutfit) {
        chosenOutfit =
          primaryChar.outfits.find((o) => o.id === primaryChar.activeOutfitId) ||
          primaryChar.outfits.find((o) => o.isDefault) ||
          primaryChar.outfits[0];
      }
    }

    // 3. Dialogue check (quotes or colon dialog)
    const isDialogue = /["'“][^"'“”]+["'”]/.test(text) || /^[A-Z][a-z]+:\s*".+"/.test(text);

    // 4. Voice actor determination
    const voice = primaryChar?.assignedVoice || defaultVoice;

    // 5. Detect Scene Location & Time of Day
    const sceneLocation = detectSceneLocation(text, idx);
    const timeOfDay = detectTimeOfDay(textLower, idx);

    return {
      index: idx,
      text,
      detectedCharacters: detected,
      primaryCharacter: primaryChar,
      selectedOutfit: chosenOutfit,
      isDialogue,
      speakerName: primaryChar?.name,
      suggestedVoiceActor: voice,
      sceneLocation,
      timeOfDay,
    };
  });

  return parsedResults;
}

/**
 * Compiles a unified prompt combining character facial consistency,
 * dynamic outfit wardrobe specifications, setting location, time of day, and cinematic camera trajectory.
 */
export function compileUnifiedVideoPrompt(params: {
  storySentence: string;
  visualStyle: string;
  videoGenerator: string;
  cameraMotion: string;
  character?: CharacterProfile;
  outfit?: CharacterOutfit;
  sceneLocation?: string;
  timeOfDay?: string;
  costumeLock?: string;
}): string {
  const {
    storySentence,
    visualStyle,
    videoGenerator,
    cameraMotion,
    character,
    outfit,
    sceneLocation,
    timeOfDay,
    costumeLock,
  } = params;

  let prompt = '';

  // 1. Character & Face Consistency tokens
  if (character) {
    const faceSpecs = character.faceDescription || character.description;
    prompt += `[SUBJECT: ${character.name}, Role: ${character.role}] `;
    prompt += `[FACE/PHYSICAL CONSISTENCY: ${faceSpecs}] `;

    if (character.imageUrl) {
      prompt += `[REFERENCE FACE LOCK: Active ID ${character.id}] `;
    }
  }

  // 2. Costume Lock & Dynamic Outfit Wardrobe tokens
  const activeCostume = costumeLock || character?.costumeLock;
  if (activeCostume) {
    prompt += `[COSTUME LOCK: ${activeCostume}] `;
  } else if (outfit) {
    prompt += `[WARDROBE OUTFIT: ${outfit.name} - ${outfit.description}] `;
  }

  // 3. Environment & Lighting Tags
  if (sceneLocation || timeOfDay) {
    prompt += `[SETTING: ${sceneLocation || 'Atmospheric Environment'} | LIGHTING: ${timeOfDay || 'Cinematic Lighting'}] `;
  }

  // 4. Narrative Action & Visual Style
  prompt += `Cinematic ${visualStyle} shot: ${storySentence}. `;

  // 5. Lighting, Camera trajectory & AI engine tokens
  prompt += `Camera motion: ${cameraMotion}. Volumetric lighting, 35mm anamorphic glass, 8k hyper-detailed cinematic render via ${videoGenerator}.`;

  return prompt;
}
