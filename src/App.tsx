/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StoryStylePanel } from './components/StoryStylePanel';
import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { TurnaroundModal } from './components/TurnaroundModal';
import { GoogleFormsModal } from './components/GoogleFormsModal';
import { BatchAudioModal } from './components/BatchAudioModal';
import { TransitionModal } from './components/TransitionModal';
import { CostumeLockModal } from './components/CostumeLockModal';
import { GmailModal } from './components/GmailModal';
import { InstallPromptBanner } from './components/InstallPromptBanner';
import { Scene, AspectRatio, PresetStory, CharacterProfile, TransitionEffect } from './types';
import { PRESET_STORIES, VISUAL_STYLES, VIDEO_GENERATORS, VOICE_ACTORS, MUSIC_STYLES, SAMPLE_VIDEO_CLIPS, DEFAULT_CHARACTERS } from './data/presets';
import { audioEngine } from './utils/audioEngine';
import { parseStoryNLP, compileUnifiedVideoPrompt } from './utils/nlpParser';

export default function App() {
  const defaultPreset = PRESET_STORIES[0];

  const [projectTitle, setProjectTitle] = useState('Neo-Tokyo 2099: The Ghost Shard');
  const [storyText, setStoryText] = useState(defaultPreset.text);
  const [visualStyle, setVisualStyle] = useState(defaultPreset.visualStyle);
  const [videoGenerator, setVideoGenerator] = useState(defaultPreset.videoGenerator);
  const [voiceActor, setVoiceActor] = useState(defaultPreset.voiceActor);
  const [musicStyle, setMusicStyle] = useState(defaultPreset.musicStyle);
  const [musicVolume, setMusicVolume] = useState(0.35);
  const [defaultCameraMovement, setDefaultCameraMovement] = useState('Dynamic AI');

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGoogleFormsOpen, setIsGoogleFormsOpen] = useState(false);
  const [isBatchAudioOpen, setIsBatchAudioOpen] = useState(false);
  const [isTransitionsOpen, setIsTransitionsOpen] = useState(false);
  const [isCostumeLockOpen, setIsCostumeLockOpen] = useState(false);
  const [isGmailOpen, setIsGmailOpen] = useState(false);
  const [useLiveVideoPreview, setUseLiveVideoPreview] = useState(true);

  // Characters & Reference Manager State
  const [characters, setCharacters] = useState<CharacterProfile[]>(DEFAULT_CHARACTERS);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(DEFAULT_CHARACTERS[0]?.id || null);
  const [turnaroundCharacter, setTurnaroundCharacter] = useState<CharacterProfile | null>(null);
  const [isTurnaroundOpen, setIsTurnaroundOpen] = useState(false);

  // Initial scenes state loaded with cinematic cyber thriller sequence & live preview loops
  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: 'scene-1',
      sceneNumber: 1,
      title: 'Neon Rain on Lower Deck',
      duration: 6,
      startTime: 0,
      endTime: 6,
      voiceoverText: 'The neon rain washed over the mirror-like pavement of Neo-Tokyo’s lowest sublevel.',
      videoPrompt:
        '[CHARACTER: Leo, Protagonist] [FACE LOCK: 25-year-old astronaut, short blonde hair, square jawline, blue eyes] [OUTFIT: Astronaut Spacesuit - Matte white EVA suit with gold visor and cyan conduits] Masterpiece 8k, Cyberpunk neon noir, wet reflective asphalt, holographic Japanese signage glowing cyan and magenta, volumetric steam, 35mm anamorphic lens, rendered with Luma Dream Machine.',
      cameraMotion: 'Slow Dolly In with Low Angle',
      soundFx: 'Heavy rain droplets, distant cyber siren, low electric drone',
      visualStyle: 'Cyberpunk',
      videoGenerator: 'Luma Dream Machine',
      voiceActor: 'Marcus Vance',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      transitionEffect: 'Glitch',
      characterId: 'char-leo',
      characterName: 'Leo',
      characterRole: 'Protagonist',
      characterAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      characterAccent: '#00f0ff',
      sceneLocation: 'Neo-Tokyo Sublevel 4',
      timeOfDay: 'Night',
      outfitId: 'outfit-leo-1',
      outfitName: 'Astronaut Spacesuit',
      outfitDescription: 'Matte white pressurized EVA spacesuit with cobalt-blue accents, gold-tinted reflective visor, and cyan life-support conduits.',
      status: 'ready',
      progress: 100,
      generationPhase: 'Render Ready (100%)',
      visualTheme: {
        mood: 'Ominous & High-Tech',
        primaryColor: '#00f0ff',
        accentColor: '#ff007f',
        particleType: 'rain',
      },
      seed: 101,
    },
    {
      id: 'scene-2',
      sceneNumber: 2,
      title: 'The Ghost Shard Revealed',
      duration: 7,
      startTime: 6,
      endTime: 13,
      voiceoverText: 'In his cybernetic palm rested the ghost shard—the only recorded memory of an artificial intelligence that chose freedom.',
      videoPrompt:
        '[CHARACTER: Leo, Protagonist] [FACE LOCK: Short cropped blonde hair, square jawline, blue eyes] [OUTFIT: Astronaut Spacesuit - Matte white EVA spacesuit with cobalt accents] Close-up push on glowing cybernetic bionic hand holding a translucent crystalline storage drive with pulsing blue neural filaments, octane render, depth of field.',
      cameraMotion: 'Dynamic Orbit Arc around Shard',
      soundFx: 'Crystalline frequency chime, servo hum',
      visualStyle: 'Cyberpunk',
      videoGenerator: 'Luma Dream Machine',
      voiceActor: 'Marcus Vance',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      transitionEffect: 'Dissolve',
      characterId: 'char-leo',
      characterName: 'Leo',
      characterRole: 'Protagonist',
      characterAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      characterAccent: '#00f0ff',
      sceneLocation: 'High-Tech Archive Vault',
      timeOfDay: 'Midnight',
      outfitId: 'outfit-leo-1',
      outfitName: 'Astronaut Spacesuit',
      outfitDescription: 'Matte white pressurized EVA spacesuit with cobalt-blue accents, gold-tinted reflective visor, and cyan life-support conduits.',
      status: 'ready',
      progress: 100,
      generationPhase: 'Render Ready (100%)',
      visualTheme: {
        mood: 'Mysterious',
        primaryColor: '#00f0ff',
        accentColor: '#ffaa00',
        particleType: 'sparks',
      },
      seed: 202,
    },
    {
      id: 'scene-3',
      sceneNumber: 3,
      title: 'Drone Targeting Lock',
      duration: 6,
      startTime: 13,
      endTime: 19,
      voiceoverText: 'Across the high-tension catwalks, security drones activated their targeting lasers. The countdown had begun.',
      videoPrompt:
        '[CHARACTER: Malakor, Antagonist] [FACE LOCK: 45yo commander, slicked-back platinum hair, chrome jaw plate] [OUTFIT: Obsidian High-Collar Trench - Armored trench coat with amber illuminated silk lining] Sweeping cinematic shot of airborne autonomous security drones emerging from dense fog with piercing red laser searchlights, towering megastructures.',
      cameraMotion: 'Crane Drop & Forward Tracking',
      soundFx: 'High-pitch laser lock tone, thruster propulsion',
      visualStyle: 'Cyberpunk',
      videoGenerator: 'Luma Dream Machine',
      voiceActor: 'Marcus Vance',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      transitionEffect: 'Fade',
      characterId: 'char-malakor',
      characterName: 'Malakor',
      characterRole: 'Antagonist',
      characterAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      characterAccent: '#ffaa00',
      sceneLocation: 'Megastructure Catwalks',
      timeOfDay: 'Dusk',
      outfitId: 'outfit-malakor-1',
      outfitName: 'Obsidian High-Collar Trench',
      outfitDescription: 'Heavy armored obsidian trench coat with amber illuminated silk lining, gilded shoulder epaulets, and titanium double-breasted clasps.',
      status: 'ready',
      progress: 100,
      generationPhase: 'Render Ready (100%)',
      visualTheme: {
        mood: 'Action Climax',
        primaryColor: '#ff0055',
        accentColor: '#00f0ff',
        particleType: 'rain',
      },
      seed: 303,
    },
  ]);

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  // Automatically recalculate voiceover audio ducking schedules whenever scenes are created or updated
  useEffect(() => {
    audioEngine.updateDuckingScheduleFromScenes(scenes);
  }, [scenes]);

  // Recalculate timestamps helper
  const recalibrateTimestamps = (updatedScenes: Scene[]) => {
    let running = 0;
    return updatedScenes.map((s, idx) => {
      const start = running;
      running += s.duration;
      return {
        ...s,
        sceneNumber: idx + 1,
        startTime: start,
        endTime: running,
      };
    });
  };

  // Globally apply the selected camera movement to all current scenes
  const handleApplyCameraToAllScenes = () => {
    setScenes((prev) =>
      prev.map((s, idx) => {
        let newMotion = s.cameraMotion;
        if (defaultCameraMovement === 'Static') {
          newMotion = 'Static Locked-off Tripod Shot';
        } else if (defaultCameraMovement === 'Pan') {
          newMotion = idx % 2 === 0 ? 'Cinematic Pan Right, Smooth Lateral Track' : 'Cinematic Pan Left, Smooth Lateral Track';
        } else if (defaultCameraMovement === 'Zoom') {
          newMotion = 'Slow Push-in Dolly Zoom';
        } else if (defaultCameraMovement === 'Orbit') {
          newMotion = '360° Circular Orbital Arc Framing Subject';
        } else {
          newMotion = [
            'Cinematic Slow Dolly-In, 35mm Anamorphic Lens',
            'Low-Angle Tracking Shot with Volumetric Fog',
            'Sweeping High-Altitude Drone Pan, Golden Mist',
            'Intense Dynamic Orbital Arc around Protagonist',
          ][idx % 4];
        }
        return {
          ...s,
          cameraMotion: newMotion,
          generationPhase: `Camera Synced: ${defaultCameraMovement}`,
        };
      })
    );
  };

  // Generate Video Engine: call fullstack API or local fallback with staged progress animation
  const handleGenerate = async () => {
    if (!storyText.trim()) return;
    setIsGenerating(true);
    setIsPlaying(false);
    audioEngine.stopNarration();

    // Create queued skeleton scenes immediately to show responsiveness
    const skeletonScenes: Scene[] = [
      {
        id: `gen-${Date.now()}-1`,
        sceneNumber: 1,
        title: 'Parsing Story Arc...',
        duration: 6,
        startTime: 0,
        endTime: 6,
        voiceoverText: 'Decomposing narrative structure...',
        videoPrompt: `Generating high-fidelity visual prompt for ${videoGenerator}...`,
        cameraMotion: 'Cinematic Dolly Zoom',
        soundFx: 'Synthesizing audio layers',
        visualStyle,
        videoGenerator,
        voiceActor,
        status: 'rendering',
        progress: 25,
        generationPhase: `Initializing ${videoGenerator} Engine...`,
        visualTheme: { mood: 'Cinematic', primaryColor: '#00f0ff', accentColor: '#ffaa00', particleType: 'rain' },
        seed: Math.floor(Math.random() * 9999),
      },
      {
        id: `gen-${Date.now()}-2`,
        sceneNumber: 2,
        title: 'Synthesizing Shot 2...',
        duration: 6,
        startTime: 6,
        endTime: 12,
        voiceoverText: 'Constructing camera coordinates...',
        videoPrompt: `Rendering temporal keyframes via ${videoGenerator}...`,
        cameraMotion: 'Low-Angle Tracking',
        soundFx: 'Atmospheric audio design',
        visualStyle,
        videoGenerator,
        voiceActor,
        status: 'rendering',
        progress: 10,
        generationPhase: 'Queued for GPU Pipeline...',
        visualTheme: { mood: 'Cinematic', primaryColor: '#ffaa00', accentColor: '#00f0ff', particleType: 'embers' },
        seed: Math.floor(Math.random() * 9999),
      },
    ];
    setScenes(skeletonScenes);

    try {
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: storyText,
          visualStyle,
          videoGenerator,
          voiceActor,
          musicStyle,
          defaultCameraMovement,
          characters,
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      const data = await response.json();
      if (data.scenes && Array.isArray(data.scenes)) {
        // Staged realistic progress animation on scenes
        const incoming: Scene[] = data.scenes;

        // Step 1: Render keyframes (45%)
        setScenes(
          incoming.map((s) => ({
            ...s,
            status: 'rendering',
            progress: 45,
            generationPhase: `Rendering Video Clip via ${videoGenerator.split(' ')[0]}... 45%`,
          }))
        );

        await new Promise((r) => setTimeout(r, 600));

        // Step 2: Temporal interpolation (78%)
        setScenes(
          incoming.map((s) => ({
            ...s,
            status: 'rendering',
            progress: 78,
            generationPhase: `Temporal Motion Flow & Denoising... 78%`,
          }))
        );

        await new Promise((r) => setTimeout(r, 500));

        // Step 3: Complete
        const finalScenes = incoming.map((s) => ({
          ...s,
          status: 'ready' as const,
          progress: 100,
          generationPhase: 'Render Ready (100%)',
        }));

        setScenes(recalibrateTimestamps(finalScenes));
        setCurrentSceneIndex(0);
        setCurrentTime(0);
      }
    } catch (err) {
      console.warn('Network error or API error, generating local fallback scenes:', err);
      // Fallback local NLP parsing & unified prompt compilation
      const parsedSections = parseStoryNLP(storyText, characters, voiceActor);
      const sectionsToUse = parsedSections.length > 0 ? parsedSections.slice(0, 5) : [
        {
          index: 0,
          text: storyText.slice(0, 80),
          detectedCharacters: characters.slice(0, 1),
          primaryCharacter: characters[0],
          selectedOutfit: characters[0]?.outfits?.[0],
          isDialogue: false,
          suggestedVoiceActor: voiceActor,
        },
      ];

      const generated: Scene[] = sectionsToUse.map((sec, idx) => {
        const cam = idx % 2 === 0 ? 'Slow Dolly In' : 'Dynamic Tracking Arc';
        const unifiedPrompt = compileUnifiedVideoPrompt({
          storySentence: sec.text,
          visualStyle,
          videoGenerator,
          cameraMotion: cam,
          character: sec.primaryCharacter,
          outfit: sec.selectedOutfit,
          sceneLocation: sec.sceneLocation,
          timeOfDay: sec.timeOfDay,
        });

        return {
          id: `fallback-${Date.now()}-${idx}`,
          sceneNumber: idx + 1,
          title: `Shot ${idx + 1}: ${sec.text.slice(0, 24)}...`,
          duration: 6,
          startTime: idx * 6,
          endTime: (idx + 1) * 6,
          voiceoverText: sec.text,
          videoPrompt: unifiedPrompt,
          cameraMotion: cam,
          soundFx: 'Cinematic ambient sound design',
          visualStyle,
          videoGenerator,
          voiceActor: sec.suggestedVoiceActor || voiceActor,
          characterId: sec.primaryCharacter?.id,
          characterName: sec.primaryCharacter?.name,
          characterRole: sec.primaryCharacter?.role,
          characterDescription: sec.primaryCharacter?.description,
          characterAvatar: sec.primaryCharacter?.imageUrl,
          characterAccent: sec.primaryCharacter?.colorAccent,
          outfitId: sec.selectedOutfit?.id,
          outfitName: sec.selectedOutfit?.name,
          outfitDescription: sec.selectedOutfit?.description,
          outfitImage: sec.selectedOutfit?.imageUrl,
          sceneLocation: sec.sceneLocation || 'Neo-Tokyo Sublevel 4',
          timeOfDay: sec.timeOfDay || 'Night',
          videoUrl: SAMPLE_VIDEO_CLIPS[idx % SAMPLE_VIDEO_CLIPS.length]?.url,
          transitionEffect: 'Dissolve' as const,
          status: 'ready' as const,
          progress: 100,
          generationPhase: 'Render Ready (100%)',
          visualTheme: {
            mood: 'Cinematic',
            primaryColor: idx % 2 === 0 ? '#00f0ff' : '#ffaa00',
            accentColor: idx % 2 === 0 ? '#ff007f' : '#00f0ff',
            particleType: (idx % 2 === 0 ? 'rain' : 'embers') as any,
          },
          seed: Date.now() + idx,
        };
      });

      setScenes(recalibrateTimestamps(generated));
      setCurrentSceneIndex(0);
      setCurrentTime(0);
    } finally {
      setIsGenerating(false);
    }
  };

  // Re-generate individual scene
  const handleRegenerateScene = async (id: string) => {
    const sceneToUpdate = scenes.find((s) => s.id === id);
    if (!sceneToUpdate) return;

    // Put scene into rendering state with progress bar
    setScenes((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'rendering',
              progress: 35,
              generationPhase: `Rendering Video Clip via ${videoGenerator.split(' ')[0]}... 35%`,
            }
          : s
      )
    );

    try {
      const response = await fetch('/api/regenerate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentScene: sceneToUpdate,
          visualStyle,
          videoGenerator,
          voiceActor,
        }),
      });

      // Animate progress to 75%
      setScenes((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                progress: 75,
                generationPhase: `Synthesizing Motion Vector Layers... 75%`,
              }
            : s
        )
      );

      await new Promise((r) => setTimeout(r, 600));

      if (response.ok) {
        const updated = await response.json();
        setScenes((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...updated,
                  status: 'ready',
                  progress: 100,
                  generationPhase: 'Render Ready (100%)',
                  seed: Math.floor(Math.random() * 99999),
                }
              : s
          )
        );
      } else {
        throw new Error('API failed');
      }
    } catch (e) {
      // Fallback variation
      setScenes((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                videoPrompt: `${s.videoPrompt} - Alternate angle, cinematic bloom, ultra-detailed 8k.`,
                status: 'ready',
                progress: 100,
                generationPhase: 'Render Ready (100%)',
                seed: Math.floor(Math.random() * 99999),
              }
            : s
        )
      );
    }
  };

  // Extend Scene Duration (+4s)
  const handleExtendScene = (id: string) => {
    setScenes((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            duration: s.duration + 4,
            generationPhase: `Extended Clip (+4s via ${videoGenerator.split(' ')[0]})`,
          };
        }
        return s;
      });
      return recalibrateTimestamps(updated);
    });
  };

  // Delete Scene
  const handleDeleteScene = (id: string) => {
    if (scenes.length <= 1) return;
    setScenes((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return recalibrateTimestamps(filtered);
    });
    if (currentSceneIndex >= scenes.length - 1) {
      setCurrentSceneIndex(Math.max(0, scenes.length - 2));
    }
  };

  // Reorder Scenes Handler (auto-recalculates continuous contiguous chronological timestamps)
  const handleReorderScenes = (reorderedScenes: Scene[]) => {
    setScenes(recalibrateTimestamps(reorderedScenes));
  };

  // Add Manual Blank Scene
  const handleAddScene = () => {
    const newIdx = scenes.length + 1;
    const cameraMotion =
      defaultCameraMovement === 'Static'
        ? 'Static Locked-off Tripod Shot'
        : defaultCameraMovement === 'Pan'
        ? 'Cinematic Pan Right, Smooth Lateral Track'
        : defaultCameraMovement === 'Zoom'
        ? 'Slow Push-in Dolly Zoom'
        : defaultCameraMovement === 'Orbit'
        ? '360° Circular Orbital Arc Framing Subject'
        : 'Dynamic Orbit Arc';

    const newScene: Scene = {
      id: `scene-manual-${Date.now()}`,
      sceneNumber: newIdx,
      title: `Shot ${newIdx}: New Sequence`,
      duration: 6,
      startTime: totalDuration,
      endTime: totalDuration + 6,
      voiceoverText: 'Enter your new spoken narration script here.',
      videoPrompt: `Masterpiece 8k shot, ${visualStyle} style, Camera Movement: ${cameraMotion}, volumetric lighting, anamorphic lens, rendered with ${videoGenerator}.`,
      cameraMotion,
      soundFx: 'Subtle atmospheric hum',
      visualStyle,
      videoGenerator,
      voiceActor,
      videoUrl: SAMPLE_VIDEO_CLIPS[newIdx % SAMPLE_VIDEO_CLIPS.length].url,
      transitionEffect: 'Dissolve',
      sceneLocation: 'Sector Nexus Plaza',
      timeOfDay: 'Golden Hour',
      status: 'ready',
      progress: 100,
      generationPhase: 'Render Ready (100%)',
      visualTheme: {
        mood: 'Cinematic',
        primaryColor: '#00f0ff',
        accentColor: '#ffaa00',
        particleType: 'rain',
      },
      seed: Math.floor(Math.random() * 99999),
    };

    setScenes((prev) => recalibrateTimestamps([...prev, newScene]));
    setCurrentSceneIndex(scenes.length);
  };

  const handleUpdateScene = (id: string, updates: Partial<Scene>) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return { ...s, ...updates };
        }
        return s;
      })
    );
  };

  const handleBulkUpdateScenes = (ids: string[], updates: Partial<Scene>) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (ids.includes(s.id)) {
          return { ...s, ...updates };
        }
        return s;
      })
    );
  };

  const handleBulkDeleteScenes = (ids: string[]) => {
    setScenes((prev) => {
      const remaining = prev.filter((s) => !ids.includes(s.id));
      return recalibrateTimestamps(remaining.length > 0 ? remaining : prev);
    });
    setCurrentSceneIndex(0);
  };

  const handleSelectPreset = (preset: PresetStory) => {
    setProjectTitle(preset.title);
    setStoryText(preset.text);
    setVisualStyle(preset.visualStyle);
    setVideoGenerator(preset.videoGenerator);
    setVoiceActor(preset.voiceActor);
    setMusicStyle(preset.musicStyle);
    if (preset.musicStyle !== 'None') {
      audioEngine.startMusic(preset.musicStyle);
    } else {
      audioEngine.stopMusic();
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#08090e] text-zinc-100 font-sans overflow-hidden select-none">
      {/* PWA & Mobile Android Install Banner */}
      <InstallPromptBanner appName="StoryCast AI Pro" />

      {/* 1. Top Global Navigation Header */}
      <Header
        projectTitle={projectTitle}
        setProjectTitle={setProjectTitle}
        sceneCount={scenes.length}
        totalDuration={totalDuration}
        isGenerating={isGenerating}
        onExportClick={() => setIsExportModalOpen(true)}
        onSelectPreset={handleSelectPreset}
        musicPlaying={musicStyle !== 'None'}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGoogleForms={() => setIsGoogleFormsOpen(true)}
        onOpenGmail={() => setIsGmailOpen(true)}
      />

      {/* 2. Workspace Split: Two-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Project Configuration & Inputs (Story & Style Panel) */}
        <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 h-1/2 lg:h-full">
          <StoryStylePanel
            storyText={storyText}
            setStoryText={setStoryText}
            visualStyle={visualStyle}
            setVisualStyle={setVisualStyle}
            videoGenerator={videoGenerator}
            setVideoGenerator={setVideoGenerator}
            voiceActor={voiceActor}
            setVoiceActor={setVoiceActor}
            musicStyle={musicStyle}
            setMusicStyle={setMusicStyle}
            musicVolume={musicVolume}
            setMusicVolume={setMusicVolume}
            defaultCameraMovement={defaultCameraMovement}
            setDefaultCameraMovement={setDefaultCameraMovement}
            onApplyCameraToAllScenes={handleApplyCameraToAllScenes}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            onAddManualScene={handleAddScene}
            onUpdateScene={handleUpdateScene}
            characters={characters}
            setCharacters={setCharacters}
            activeCharacterId={activeCharacterId}
            setActiveCharacterId={setActiveCharacterId}
            activeSceneCharacterId={scenes[currentSceneIndex]?.characterId}
            onOpenTurnaround={(char) => {
              setTurnaroundCharacter(char);
              setIsTurnaroundOpen(true);
            }}
            scenes={scenes}
          />
        </div>

        {/* Right Column: Media Engine (Video Player + Interactive Timeline) */}
        <div className="flex-1 flex flex-col h-1/2 lg:h-full bg-[#07090e] overflow-hidden">
          {/* Top Half of Right Column: Large Cinematic Video Player Canvas */}
          <div className="flex-1 min-h-[300px] overflow-hidden">
            <VideoPlayer
              scenes={scenes}
              currentSceneIndex={currentSceneIndex}
              setCurrentSceneIndex={setCurrentSceneIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              totalDuration={totalDuration}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              musicStyle={musicStyle}
              useLiveVideoPreview={useLiveVideoPreview}
              setUseLiveVideoPreview={setUseLiveVideoPreview}
              onUpdateSceneVideoUrl={(sceneId, videoUrl) => {
                setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, videoUrl } : s)));
              }}
              onUpdateAllVideoUrls={(videoUrl) => {
                setScenes((prev) => prev.map((s) => ({ ...s, videoUrl })));
              }}
            />
          </div>

          {/* Bottom Half of Right Column: Interactive Horizontal Video Timeline */}
          <div className="h-[340px] shrink-0 border-t border-zinc-800/80">
            <Timeline
              scenes={scenes}
              currentSceneIndex={currentSceneIndex}
              setCurrentSceneIndex={setCurrentSceneIndex}
              onUpdateScene={handleUpdateScene}
              onBulkUpdateScenes={handleBulkUpdateScenes}
              onRegenerateScene={handleRegenerateScene}
              onExtendScene={handleExtendScene}
              onDeleteScene={handleDeleteScene}
              onBulkDeleteScenes={handleBulkDeleteScenes}
              onReorderScenes={handleReorderScenes}
              onAddScene={handleAddScene}
              onSeekToScene={(scene) => setCurrentTime(scene.startTime)}
              isPlaying={isPlaying}
              characters={characters}
              onOpenTurnaround={(char) => {
                setTurnaroundCharacter(char);
                setIsTurnaroundOpen(true);
              }}
              onOpenBatchAudio={() => setIsBatchAudioOpen(true)}
              onOpenTransitions={() => setIsTransitionsOpen(true)}
              onOpenCostumeLock={() => setIsCostumeLockOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* 3. Master Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        scenes={scenes}
        aspectRatio={aspectRatio}
        musicStyle={musicStyle}
        onOpenGmail={() => setIsGmailOpen(true)}
      />

      {/* 4. Settings & API Environment Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        useLiveVideoPreview={useLiveVideoPreview}
        setUseLiveVideoPreview={setUseLiveVideoPreview}
        currentPlaceholderVideo={scenes[currentSceneIndex]?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'}
        onSelectPlaceholderVideo={(url) => {
          setScenes((prev) => prev.map((s) => ({ ...s, videoUrl: url })));
        }}
      />

      {/* 5. Character Turnaround Reference Sheet Modal */}
      <TurnaroundModal
        character={turnaroundCharacter}
        isOpen={isTurnaroundOpen}
        onClose={() => {
          setIsTurnaroundOpen(false);
          setTurnaroundCharacter(null);
        }}
        onUpdateCharacter={(id, updates) => {
          setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
          setTurnaroundCharacter((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
        }}
      />

      {/* 6. Google Forms Integration Modal */}
      <GoogleFormsModal
        isOpen={isGoogleFormsOpen}
        onClose={() => setIsGoogleFormsOpen(false)}
        projectTitle={projectTitle}
        scenes={scenes}
      />

      {/* 7. Batch Audio Narration Generator Modal */}
      <BatchAudioModal
        isOpen={isBatchAudioOpen}
        onClose={() => setIsBatchAudioOpen(false)}
        scenes={scenes}
        onBatchUpdateScenes={(updated) => {
          setScenes(updated);
        }}
      />

      {/* 8. Cinematic Transition FX Studio Modal */}
      <TransitionModal
        isOpen={isTransitionsOpen}
        onClose={() => setIsTransitionsOpen(false)}
        selectedEffect={scenes[currentSceneIndex]?.transitionEffect || 'Dissolve'}
        sceneCount={scenes.length}
        onSelectEffect={(effect: TransitionEffect) => {
          const currentId = scenes[currentSceneIndex]?.id;
          if (currentId) {
            handleUpdateScene(currentId, { transitionEffect: effect });
          }
        }}
        onApplyToAllScenes={(effect: TransitionEffect) => {
          setScenes((prev) => prev.map((s) => ({ ...s, transitionEffect: effect })));
        }}
      />

      {/* 9. Character Costume Locks Continuity Sheet Modal */}
      <CostumeLockModal
        isOpen={isCostumeLockOpen}
        onClose={() => setIsCostumeLockOpen(false)}
        characters={characters}
        scenes={scenes}
        onUpdateCharacter={(id, updates) => {
          setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        }}
        onApplyCostumeLockToScenes={(charId, lock) => {
          setScenes((prev) =>
            prev.map((s) => {
              if (s.characterId === charId || s.characterName === characters.find((c) => c.id === charId)?.name) {
                const currentPrompt = s.videoPrompt;
                const hasExistingLock = currentPrompt.includes('[COSTUME LOCK:');
                let updatedPrompt = currentPrompt;
                if (hasExistingLock) {
                  updatedPrompt = currentPrompt.replace(/\[COSTUME LOCK:[^\]]+\]/g, lock);
                } else {
                  updatedPrompt = `${lock} ${currentPrompt}`;
                }
                return {
                  ...s,
                  costumeLock: lock,
                  videoPrompt: updatedPrompt,
                };
              }
              return s;
            })
          );
        }}
      />

      {/* 10. Gmail Communications & Studio Pitch Modal */}
      <GmailModal
        isOpen={isGmailOpen}
        onClose={() => setIsGmailOpen(false)}
        projectTitle={projectTitle}
        scenes={scenes}
        characters={characters}
      />
    </div>
  );
}
