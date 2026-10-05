import React, { useState } from 'react';
import {
  Wand2,
  Sliders,
  Palette,
  Cpu,
  Mic,
  Music,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  Video,
  MoveHorizontal,
  ZoomIn,
  RotateCw,
  Square,
  Users,
  User,
  Tag,
  CheckCircle2,
  Shirt,
  Check,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  VISUAL_STYLES,
  VIDEO_GENERATORS,
  VOICE_ACTORS,
  MUSIC_STYLES,
  PRESET_STORIES,
  CAMERA_MOVEMENTS,
} from '../data/presets';
import { CharacterProfile, Scene } from '../types';
import { CharacterManager } from './CharacterManager';
import { audioEngine } from '../utils/audioEngine';
import { parseStoryNLP, compileUnifiedVideoPrompt } from '../utils/nlpParser';

interface StoryStylePanelProps {
  storyText: string;
  setStoryText: (text: string) => void;
  visualStyle: string;
  setVisualStyle: (val: string) => void;
  videoGenerator: string;
  setVideoGenerator: (val: string) => void;
  voiceActor: string;
  setVoiceActor: (val: string) => void;
  musicStyle: string;
  setMusicStyle: (val: string) => void;
  musicVolume: number;
  setMusicVolume: (val: number) => void;
  defaultCameraMovement: string;
  setDefaultCameraMovement: (val: string) => void;
  onApplyCameraToAllScenes?: () => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onAddManualScene: () => void;
  onUpdateScene?: (id: string, updates: Partial<Scene>) => void;
  // Characters Props
  characters: CharacterProfile[];
  setCharacters: React.Dispatch<React.SetStateAction<CharacterProfile[]>>;
  activeCharacterId: string | null;
  setActiveCharacterId: (id: string | null) => void;
  activeSceneCharacterId?: string;
  onOpenTurnaround: (character: CharacterProfile) => void;
  scenes: Scene[];
}

export const StoryStylePanel: React.FC<StoryStylePanelProps> = ({
  storyText,
  setStoryText,
  visualStyle,
  setVisualStyle,
  videoGenerator,
  setVideoGenerator,
  voiceActor,
  setVoiceActor,
  musicStyle,
  setMusicStyle,
  musicVolume,
  setMusicVolume,
  defaultCameraMovement,
  setDefaultCameraMovement,
  onApplyCameraToAllScenes,
  isGenerating,
  onGenerate,
  onAddManualScene,
  onUpdateScene,
  characters,
  setCharacters,
  activeCharacterId,
  setActiveCharacterId,
  activeSceneCharacterId,
  onOpenTurnaround,
  scenes,
}) => {
  const [isPlayingSampleVoice, setIsPlayingSampleVoice] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'characters' | 'audio'>('script');
  const [expandedOverrideIndex, setExpandedOverrideIndex] = useState<number | null>(null);
  const [sceneOverrides, setSceneOverrides] = useState<{
    [idx: number]: { characterId?: string; outfitId?: string };
  }>({});

  // NLP Auto-Detection of scenes, characters, dialogue and outfits
  const parsedSections = parseStoryNLP(storyText, characters, voiceActor);

  // Word & estimated duration calculation (~130 words per minute speaking rate)
  const words = storyText.trim() ? storyText.trim().split(/\s+/).length : 0;
  const chars = storyText.length;
  const estimatedSecs = Math.max(12, Math.round((words / 130) * 60));

  const handleOverrideScene = (sceneIndex: number, charId: string, outfitId?: string) => {
    const chosenChar = characters.find((c) => c.id === charId);
    const chosenOutfit =
      chosenChar?.outfits?.find((o) => o.id === outfitId) ||
      chosenChar?.outfits?.find((o) => o.id === chosenChar.activeOutfitId) ||
      chosenChar?.outfits?.[0];

    setSceneOverrides((prev) => ({
      ...prev,
      [sceneIndex]: { characterId: charId, outfitId: chosenOutfit?.id },
    }));

    // If scene exists in live timeline, update it immediately with unified prompt!
    const targetScene = scenes[sceneIndex];
    if (targetScene && onUpdateScene) {
      const newPrompt = compileUnifiedVideoPrompt({
        storySentence: targetScene.voiceoverText,
        visualStyle,
        videoGenerator,
        cameraMotion: targetScene.cameraMotion,
        character: chosenChar,
        outfit: chosenOutfit,
      });

      onUpdateScene(targetScene.id, {
        characterId: chosenChar?.id,
        characterName: chosenChar?.name,
        characterRole: chosenChar?.role,
        characterDescription: chosenChar?.description,
        characterAvatar: chosenChar?.imageUrl,
        characterAccent: chosenChar?.colorAccent,
        outfitId: chosenOutfit?.id,
        outfitName: chosenOutfit?.name,
        outfitDescription: chosenOutfit?.description,
        outfitImage: chosenOutfit?.imageUrl,
        voiceActor: chosenChar?.assignedVoice || targetScene.voiceActor,
        videoPrompt: newPrompt,
      });
    }
  };

  const handleTestVoiceSample = () => {
    if (isPlayingSampleVoice) {
      audioEngine.stopNarration();
      setIsPlayingSampleVoice(false);
      return;
    }
    const sampleLine = `Welcome to StoryCast AI Pro. Rendering next-generation cinematic media with ${videoGenerator}.`;
    setIsPlayingSampleVoice(true);
    audioEngine.speakNarration(
      sampleLine,
      voiceActor,
      () => setIsPlayingSampleVoice(true),
      () => setIsPlayingSampleVoice(false)
    );
  };

  const handleMusicChange = (style: string) => {
    setMusicStyle(style);
    if (style !== 'None') {
      audioEngine.startMusic(style);
    } else {
      audioEngine.stopMusic();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVolume(val);
    audioEngine.setMusicVolume(val);
  };

  const handleInsertTag = (tag: string) => {
    setStoryText(storyText.trim() ? `${storyText}\n\n${tag} ` : `${tag} `);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0e17] border-r border-zinc-800/80 text-zinc-100 select-none overflow-hidden">
      {/* Top Banner & Tab Navigation */}
      <div className="p-3 border-b border-zinc-800/60 bg-[#0d111d] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Production Studio
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>~{estimatedSecs}s est</span>
          </div>
        </div>

        {/* 3 Main Workflow Tabs */}
        <div className="flex items-center gap-1 bg-[#131929] p-1 rounded-lg border border-zinc-800/80">
          <button
            onClick={() => setActiveTab('script')}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'script'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Script</span>
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'characters'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Cast & Characters</span>
            <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold flex items-center justify-center">
              {characters.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(255,170,0,0.2)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice & Audio</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Script & Visual Settings */}
      {activeTab === 'script' && (
        <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* 1. Large Story / Script Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Script / Screenplay
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400">
                  {words} words | {chars} chars
                </span>
                <button
                  onClick={() => setStoryText('')}
                  title="Clear script"
                  className="text-[10px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Quick Character Tagging Bar */}
            <div className="p-2 rounded-xl bg-[#0e1322] border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  Tag Character to Scene:
                </span>
                <span className="text-zinc-500">Click to insert tag at end</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {characters.map((c) => {
                  const isPresent =
                    storyText.includes(c.tag) || storyText.toLowerCase().includes(c.name.toLowerCase());
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleInsertTag(c.tag)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isPresent
                          ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                          : 'border-zinc-750 bg-zinc-850/80 text-zinc-300 hover:text-white hover:border-zinc-600'
                      }`}
                      title={`Insert ${c.tag} into script (${c.role})`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.colorAccent }} />
                      <span>{c.tag}</span>
                      <span className="text-[9px] text-zinc-500 uppercase">({c.role.slice(0, 4)})</span>
                      {isPresent && <span className="text-[9px] text-cyan-400">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative rounded-xl border border-zinc-800 bg-[#090b12] focus-within:border-cyan-500/60 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all">
              <textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Write your story, screenplay, or creative scenes here. Tag characters using @Name (e.g. @Leo, @Aria, @Malakor) so the AI locks their reference turnaround sheet into every video prompt..."
                rows={7}
                className="w-full bg-transparent p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed font-sans"
              />

              {/* Footer bar inside textarea */}
              <div className="px-3 py-1.5 border-t border-zinc-850 flex items-center justify-between bg-[#0e121d]/60 rounded-b-xl text-[10px] font-mono">
                <div className="text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Character prompt blending ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setStoryText(PRESET_STORIES[0].text)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Cyber Preset
                  </button>
                  <button
                    onClick={() => setStoryText(PRESET_STORIES[1].text)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Mars Preset
                  </button>
                </div>
              </div>
            </div>

            {/* NLP Auto-Detection & Scene Override Controls */}
            {parsedSections.length > 0 && (
              <div className="p-3 bg-[#0d1220] border border-cyan-500/25 rounded-2xl space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>NLP Auto-Detection & Scene Overrides</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                    {parsedSections.length} Scenes Parsed
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400">
                  Script scanned for character tags, dialogue, and outfit cues. Click any badge to override character or select a wardrobe outfit for that scene.
                </p>

                {/* List of Detected Scenes */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {parsedSections.map((section, idx) => {
                    const override = sceneOverrides[idx];
                    const activeCharId = override?.characterId || section.primaryCharacter?.id;
                    const activeChar = characters.find((c) => c.id === activeCharId);
                    const activeOutfitId = override?.outfitId || section.selectedOutfit?.id || activeChar?.activeOutfitId;
                    const activeOutfit = activeChar?.outfits?.find((o) => o.id === activeOutfitId) || activeChar?.outfits?.[0];
                    const isExpanded = expandedOverrideIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border transition-all text-xs ${
                          isExpanded
                            ? 'bg-[#101729] border-cyan-500/60 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                            : 'bg-[#080b13] border-zinc-800/90 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </span>
                              <span className="text-[11px] font-bold text-zinc-300 truncate">
                                {section.text.slice(0, 40)}...
                              </span>
                            </div>

                            {/* Badges / Pills: Character & Outfit */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Character Pill */}
                              <button
                                type="button"
                                onClick={() => setExpandedOverrideIndex(isExpanded ? null : idx)}
                                className="px-2 py-0.5 rounded-md border text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                                style={{
                                  borderColor: activeChar ? `${activeChar.colorAccent}80` : '#3f3f46',
                                  backgroundColor: activeChar ? `${activeChar.colorAccent}15` : '#18181b',
                                  color: activeChar ? activeChar.colorAccent : '#a1a1aa',
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: activeChar?.colorAccent || '#71717a' }}
                                />
                                <span className="font-semibold">{activeChar?.name || 'No Character'}</span>
                              </button>

                              {/* Outfit Pill */}
                              {activeChar && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedOverrideIndex(isExpanded ? null : idx)}
                                  className="px-2 py-0.5 rounded-md border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Shirt className="w-2.5 h-2.5 text-cyan-400" />
                                  <span className="truncate max-w-[120px]">{activeOutfit?.name || 'Default Outfit'}</span>
                                </button>
                              )}

                              {section.isDialogue && (
                                <span className="text-[9px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Dialogue
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedOverrideIndex(isExpanded ? null : idx)}
                            className="p-1 rounded text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer shrink-0"
                            title="Tune scene character & wardrobe"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Expanded Override Popover / Form */}
                        {isExpanded && (
                          <div className="mt-2.5 pt-2.5 border-t border-zinc-800 space-y-2 animate-in fade-in duration-150">
                            {/* 1. Character Dropdown */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-zinc-400 block">
                                Assigned Character:
                              </label>
                              <select
                                value={activeCharId || ''}
                                onChange={(e) => handleOverrideScene(idx, e.target.value)}
                                className="w-full bg-[#05070e] border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                              >
                                <option value="">-- No Character (Environmental Shot) --</option>
                                {characters.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.role}) - {c.tag}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* 2. Dynamic Outfit Dropdown */}
                            {activeChar && activeChar.outfits && activeChar.outfits.length > 0 && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                                  <span className="flex items-center gap-1 text-amber-300 font-semibold">
                                    <Shirt className="w-3 h-3 text-amber-400" />
                                    Scene Outfit Wardrobe:
                                  </span>
                                  <span className="text-zinc-500 font-mono text-[9px]">
                                    {activeChar.outfits.length} Outfits available
                                  </span>
                                </label>
                                <select
                                  value={activeOutfitId || activeChar.outfits[0]?.id}
                                  onChange={(e) => handleOverrideScene(idx, activeChar.id, e.target.value)}
                                  className="w-full bg-[#05070e] border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer"
                                >
                                  {activeChar.outfits.map((outfit) => (
                                    <option key={outfit.id} value={outfit.id}>
                                      {outfit.name}
                                    </option>
                                  ))}
                                </select>

                                {activeOutfit && (
                                  <div className="p-1.5 rounded-lg bg-[#050812] border border-zinc-800 text-[10px] text-zinc-400">
                                    <strong className="text-zinc-300">Outfit Specs:</strong> {activeOutfit.description}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Voiceover actor indicator */}
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1">
                              <span className="flex items-center gap-1">
                                <Mic className="w-2.5 h-2.5 text-cyan-400" />
                                <span>Voice: {activeChar?.assignedVoice || voiceActor}</span>
                              </span>
                              <button
                                onClick={() => setExpandedOverrideIndex(null)}
                                className="text-cyan-400 hover:underline cursor-pointer"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Visual Style Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              Visual Style
            </label>
            <div className="relative">
              <select
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                className="w-full appearance-none bg-[#090b12] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-medium focus:outline-none focus:border-cyan-500/60 cursor-pointer pr-10"
              >
                {VISUAL_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Video Generator Engine (Runway, Luma, Sora) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Video Generator Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VIDEO_GENERATORS.map((gen) => {
                const isSelected = videoGenerator === gen.id;
                return (
                  <div
                    key={gen.id}
                    onClick={() => setVideoGenerator(gen.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/20 shadow-[0_0_12px_rgba(255,170,0,0.15)]'
                        : 'border-zinc-800/80 bg-[#090b12] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-100">{gen.label}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-amber-400 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {gen.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">{gen.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Default Directorial Camera Movement */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                Default Camera Movement
              </label>
              {onApplyCameraToAllScenes && (
                <button
                  onClick={onApplyCameraToAllScenes}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Apply to All
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1">
              {CAMERA_MOVEMENTS.map((cam) => {
                const isSelected = defaultCameraMovement === cam.id;
                return (
                  <button
                    key={cam.id}
                    onClick={() => setDefaultCameraMovement(cam.id)}
                    className={`py-1.5 px-1 rounded-lg text-center text-[10px] border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'border-zinc-800/80 bg-[#0e121d] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                    title={cam.desc}
                  >
                    <span className="truncate w-full font-medium">{cam.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cast & Characters Panel */}
      {activeTab === 'characters' && (
        <div className="flex-1 overflow-hidden">
          <CharacterManager
            characters={characters}
            setCharacters={setCharacters}
            activeCharacterId={activeCharacterId}
            setActiveCharacterId={setActiveCharacterId}
            activeSceneCharacterId={activeSceneCharacterId}
            onOpenTurnaround={onOpenTurnaround}
            scenes={scenes}
          />
        </div>
      )}

      {/* Tab 3: Voice & Audio Settings */}
      {activeTab === 'audio' && (
        <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* Character Voice Matrix */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Character Voice Mapping
            </label>
            <div className="space-y-1.5">
              {characters.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-[#090c14] border border-zinc-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: c.colorAccent, boxShadow: `0 0 6px ${c.colorAccent}` }}
                    />
                    <div>
                      <div className="text-xs font-bold text-zinc-200">{c.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{c.role}</div>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                    {c.assignedVoice}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Voice Actor */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                Default Narrator Voice
              </label>
              <button
                onClick={handleTestVoiceSample}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 border transition-all cursor-pointer ${
                  isPlayingSampleVoice
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}
              >
                <Play className="w-2.5 h-2.5" />
                <span>{isPlayingSampleVoice ? 'Playing...' : 'Test Voice'}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {VOICE_ACTORS.map((actor) => (
                <div
                  key={actor.id}
                  onClick={() => setVoiceActor(actor.category)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    voiceActor === actor.category
                      ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                      : 'border-zinc-800/80 bg-[#090b12] hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-100">{actor.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-cyan-400 rounded">
                        {actor.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{actor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Background Music Engine */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                Soundtrack Score
              </label>
              <span className="text-[10px] font-mono text-emerald-400">Auto-Ducking On</span>
            </div>

            <div className="relative">
              <select
                value={musicStyle}
                onChange={(e) => handleMusicChange(e.target.value)}
                className="w-full appearance-none bg-[#090b12] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-medium focus:outline-none focus:border-amber-500/60 cursor-pointer pr-10"
              >
                {MUSIC_STYLES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Volume Slider */}
            <div className="bg-[#090b12] p-2.5 rounded-xl border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Score Volume
                </span>
                <span className="font-mono text-zinc-300 text-xs">{Math.round(musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-zinc-800 rounded accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Primary Action Button: GENERATE VIDEO ENGINE */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#0d111d] space-y-2">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !storyText.trim()}
          className="w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest text-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-amber-400 hover:from-cyan-300 hover:to-amber-300 shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          {isGenerating ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin text-black" />
              <span>Analyzing Cast & Generating Video Engine...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 text-black" />
              <span>Generate Video Engine</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono">
          <button
            onClick={onAddManualScene}
            className="text-zinc-400 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Layers className="w-3 h-3" />
            <span>+ Add Blank Scene Shot</span>
          </button>
          <span className="text-zinc-500">Character References Synchronized</span>
        </div>
      </div>
    </div>
  );
};
