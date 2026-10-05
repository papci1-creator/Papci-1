import { CharacterProfile, CharacterOutfit, Scene } from '../types';

export interface ParsedSceneSection {
  index: number;
  text: string;
  detectedCharacters: CharacterProfile[];
  primaryCharacter?: CharacterProfile;
  selectedOutfit?: CharacterOutfit;
  isDialogue: boolean;
  speakerName?: string;
  suggestedVoiceActor: string;
}

/**
 * Automatically parses story text into scenes, detects characters via NLP name & tag scanning,
 * and matches appropriate outfits and voice actors.
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

    return {
      index: idx,
      text,
      detectedCharacters: detected,
      primaryCharacter: primaryChar,
      selectedOutfit: chosenOutfit,
      isDialogue,
      speakerName: primaryChar?.name,
      suggestedVoiceActor: voice,
    };
  });

  return parsedResults;
}

/**
 * Compiles a unified prompt combining character facial consistency,
 * dynamic outfit wardrobe specifications, and cinematic camera trajectory.
 */
export function compileUnifiedVideoPrompt(params: {
  storySentence: string;
  visualStyle: string;
  videoGenerator: string;
  cameraMotion: string;
  character?: CharacterProfile;
  outfit?: CharacterOutfit;
}): string {
  const { storySentence, visualStyle, videoGenerator, cameraMotion, character, outfit } = params;

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

  // 2. Dynamic Outfit Wardrobe tokens
  if (outfit) {
    prompt += `[WARDROBE OUTFIT: ${outfit.name} - ${outfit.description}] `;
  }

  // 3. Narrative Action & Visual Style
  prompt += `Cinematic ${visualStyle} shot: ${storySentence}. `;

  // 4. Lighting, Camera trajectory & AI engine tokens
  prompt += `Camera motion: ${cameraMotion}. Volumetric lighting, 35mm anamorphic glass, 8k hyper-detailed cinematic render via ${videoGenerator}.`;

  return prompt;
}
