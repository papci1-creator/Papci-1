import { CharacterProfile } from '../types';

export interface StorySuggestion {
  id: string;
  type: 'dialogue' | 'scene_action' | 'continuation';
  characterTag: string;
  characterName: string;
  characterRole: string;
  label: string;
  content: string;
  rationale?: string;
}

export interface AutocompleteRequest {
  currentText: string;
  characters: CharacterProfile[];
  visualStyle: string;
  mode?: 'all' | 'dialogue' | 'scene_action' | 'continuation';
  selectedCharacterId?: string | null;
}

/**
 * Calls the backend Gemini 3.8 Flash auto-complete endpoint to suggest
 * dramatic dialogue or descriptive scene action prompts based on character profiles.
 */
export async function fetchStoryCompletions(
  params: AutocompleteRequest
): Promise<StorySuggestion[]> {
  try {
    const res = await fetch('/api/story/autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Auto-complete failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data.suggestions) ? data.suggestions : [];
  } catch (err) {
    console.warn('Failed to fetch AI story completions, using local fallback:', err);
    // Client-side fallback if server unreachable
    const char = params.characters[0] || { name: 'Elena', tag: '@Elena', role: 'Rebel Pilot' };
    return [
      {
        id: `local-${Date.now()}-1`,
        type: 'dialogue',
        characterTag: char.tag || `@${char.name}`,
        characterName: char.name,
        characterRole: char.role,
        label: 'Dramatic Dialogue',
        content: `${char.tag || `@${char.name}`}: "The security encryption is collapsing. We need to initiate the manual override before they seal the sector."`,
        rationale: `Character voice beat for ${char.name}.`,
      },
      {
        id: `local-${Date.now()}-2`,
        type: 'scene_action',
        characterTag: char.tag || `@${char.name}`,
        characterName: char.name,
        characterRole: char.role,
        label: 'Descriptive Scene Prompt',
        content: `${char.tag || `@${char.name}`} stands before the towering quantum core, volumetric amber light illuminating the raindrops beaded across their jacket as sirens pulse in the distance.`,
        rationale: `Vivid cinematic framing matching ${params.visualStyle}.`,
      },
    ];
  }
}
