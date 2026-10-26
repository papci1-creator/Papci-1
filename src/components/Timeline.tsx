import React, { useRef, useEffect, useState } from 'react';
import {
  Film,
  Sparkles,
  Plus,
  Play,
  RotateCcw,
  Clock,
  Mic,
  FileCode,
  Trash2,
  Copy,
  Check,
  Maximize,
  Volume2,
  Layers,
  ChevronRight,
  CheckSquare,
  Square,
  CheckCheck,
  X,
  SlidersHorizontal,
  User,
  Users,
  GripVertical,
  ChevronLeft,
  Camera,
  Shirt,
  Lock,
  Pencil,
  Edit3,
  MapPin,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  ChevronDown,
  Zap,
  EyeOff,
  MoveHorizontal,
  Image as ImageIcon,
  Aperture,
  Calendar,
  Palette,
} from 'lucide-react';
import { Scene, TransitionEffect, CharacterProfile, TimeOfDay } from '../types';
import { renderCinematicFrame } from '../utils/canvasRenderer';
import { audioEngine } from '../utils/audioEngine';
import { VOICE_ACTORS, TRANSITION_EFFECTS } from '../data/presets';
import { CameraMotionPanel } from './CameraMotionPanel';
import { compileUnifiedVideoPrompt } from '../utils/nlpParser';

interface TimelineProps {
  scenes: Scene[];
  currentSceneIndex: number;
  setCurrentSceneIndex: (idx: number) => void;
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onBulkUpdateScenes?: (ids: string[], updates: Partial<Scene>) => void;
  onRegenerateScene: (id: string) => void;
  onExtendScene: (id: string) => void;
  onDeleteScene: (id: string) => void;
  onBulkDeleteScenes?: (ids: string[]) => void;
  onReorderScenes?: (reorderedScenes: Scene[]) => void;
  onAddScene: () => void;
  onSeekToScene: (scene: Scene) => void;
  isPlaying: boolean;
  characters?: CharacterProfile[];
  onOpenTurnaround?: (char: CharacterProfile) => void;
  onOpenBatchAudio?: () => void;
  onOpenTransitions?: () => void;
  onOpenCostumeLock?: () => void;
  onOpenBackgroundGenerator?: (sceneId?: string) => void;
  onOpenVoiceRecorder?: (sceneId?: string) => void;
  onOpenSceneMetadata?: (sceneId?: string) => void;
  onOpenCinematicGallery?: (sceneId?: string) => void;
}

export const TIME_OF_DAY_OPTIONS: {
  id: TimeOfDay;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  { id: 'Dawn', label: 'Dawn', color: 'text-rose-300', bg: 'bg-rose-950/40', border: 'border-rose-500/30' },
  { id: 'Day', label: 'Day', color: 'text-sky-300', bg: 'bg-sky-950/40', border: 'border-sky-500/30' },
  { id: 'Golden Hour', label: 'Golden Hour', color: 'text-amber-300', bg: 'bg-amber-950/40', border: 'border-amber-500/30' },
  { id: 'Dusk', label: 'Dusk', color: 'text-orange-300', bg: 'bg-orange-950/40', border: 'border-orange-500/30' },
  { id: 'Night', label: 'Night', color: 'text-indigo-300', bg: 'bg-indigo-950/40', border: 'border-indigo-500/30' },
  { id: 'Midnight', label: 'Midnight', color: 'text-purple-300', bg: 'bg-purple-950/40', border: 'border-purple-500/30' },
];

export const renderTimeOfDayIcon = (time?: string) => {
  switch (time) {
    case 'Dawn':
      return <Sunrise className="w-2.5 h-2.5 text-rose-400 shrink-0" />;
    case 'Day':
      return <Sun className="w-2.5 h-2.5 text-sky-400 shrink-0" />;
    case 'Golden Hour':
      return <Sun className="w-2.5 h-2.5 text-amber-400 shrink-0" />;
    case 'Dusk':
      return <Sunset className="w-2.5 h-2.5 text-orange-400 shrink-0" />;
    case 'Night':
      return <Moon className="w-2.5 h-2.5 text-indigo-400 shrink-0" />;
    case 'Midnight':
      return <Moon className="w-2.5 h-2.5 text-purple-400 shrink-0" />;
    default:
      return <Clock className="w-2.5 h-2.5 text-cyan-400 shrink-0" />;
  }
};

export const getTimeOfDayBadgeStyle = (time?: string) => {
  switch (time) {
    case 'Dawn':
      return 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:border-rose-400';
    case 'Day':
      return 'bg-sky-950/40 text-sky-300 border-sky-500/30 hover:border-sky-400';
    case 'Golden Hour':
      return 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-400';
    case 'Dusk':
      return 'bg-orange-950/40 text-orange-300 border-orange-500/30 hover:border-orange-400';
    case 'Night':
      return 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30 hover:border-indigo-400';
    case 'Midnight':
      return 'bg-purple-950/40 text-purple-300 border-purple-500/30 hover:border-purple-400';
    default:
      return 'bg-zinc-900 text-zinc-300 border-zinc-700/60 hover:border-zinc-500';
  }
};

export const renderTransitionIcon = (effect?: TransitionEffect, className = 'w-3 h-3') => {
  switch (effect) {
    case 'Fade':
      return <EyeOff className={`${className} text-indigo-400 shrink-0`} />;
    case 'Glitch':
      return <Zap className={`${className} text-rose-400 shrink-0`} />;
    case 'Wipe':
    case 'Cinematic Wipe':
      return <MoveHorizontal className={`${className} text-amber-400 shrink-0`} />;
    case 'None':
      return <Square className={`${className} text-zinc-500 shrink-0`} />;
    case 'Dissolve':
    default:
      return <Sparkles className={`${className} text-cyan-400 shrink-0`} />;
  }
};

export const getTransitionVisualDetails = (effect?: TransitionEffect) => {
  switch (effect) {
    case 'Fade':
      return {
        label: 'Fade',
        subtitle: 'Blackout Dip',
        desc: 'Dramatic blackout dip transition between shots',
        border: 'border-indigo-500/40',
        badge: 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30 hover:border-indigo-400/60',
        activeRing: 'border-indigo-400/80 bg-indigo-950/60 text-indigo-200',
        previewGradient: 'from-zinc-900 via-indigo-950 to-black',
        accentColor: '#818cf8',
      };
    case 'Glitch':
      return {
        label: 'Glitch',
        subtitle: 'Cyber RGB Split',
        desc: 'Chromatic RGB split, scanlines & digital distortion',
        border: 'border-rose-500/40',
        badge: 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:border-rose-400/60',
        activeRing: 'border-rose-400/80 bg-rose-950/60 text-rose-200',
        previewGradient: 'from-cyan-400 via-rose-500 to-amber-400',
        accentColor: '#f43f5e',
      };
    case 'Wipe':
    case 'Cinematic Wipe':
      return {
        label: 'Wipe',
        subtitle: 'Light Beam Sweep',
        desc: 'Anamorphic light streak sweep across the frame',
        border: 'border-amber-500/40',
        badge: 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-400/60',
        activeRing: 'border-amber-400/80 bg-amber-950/60 text-amber-200',
        previewGradient: 'from-amber-500 via-yellow-300 to-cyan-400',
        accentColor: '#fbbf24',
      };
    case 'None':
      return {
        label: 'None',
        subtitle: 'Hard Cut',
        desc: 'Instant abrupt cut between frames with zero blend',
        border: 'border-zinc-700/40',
        badge: 'bg-zinc-900/60 text-zinc-400 border-zinc-700/30 hover:border-zinc-500/50',
        activeRing: 'border-zinc-500/80 bg-zinc-900/80 text-zinc-300',
        previewGradient: 'from-zinc-700 to-zinc-900',
        accentColor: '#94a3b8',
      };
    case 'Dissolve':
    default:
      return {
        label: 'Dissolve',
        subtitle: 'Cross Blend',
        desc: 'Smooth cinematic luminance blend with soft bloom',
        border: 'border-cyan-500/40',
        badge: 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30 hover:border-cyan-400/60',
        activeRing: 'border-cyan-400/80 bg-cyan-950/60 text-cyan-200',
        previewGradient: 'from-cyan-500 via-sky-400 to-blue-600',
        accentColor: '#00f0ff',
      };
  }
};

// Mini Animated Moving Thumbnail Component
const MovingSceneThumbnail: React.FC<{ scene: Scene; isSelected: boolean }> = ({ scene, isSelected }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    let localTime = 0;

    const loop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          localTime += 0.04;
          if (localTime > scene.duration) localTime = 0;

          renderCinematicFrame(ctx, canvas.width, canvas.height, {
            scene,
            timeInScene: localTime,
            aspectRatio: '16:9',
            showSubtitles: false,
          });
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [scene]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-800 group/thumb bg-black">
      <canvas ref={canvasRef} width={320} height={180} className="w-full h-full object-cover" />

      {/* Live Moving Badge */}
      <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-400 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        MOVING
      </div>

      {/* Active Color Grade LUT Badge */}
      {scene.colorGradePreset && scene.colorGradePreset !== 'None' && (
        <div className="absolute top-1.5 right-1.5 bg-fuchsia-950/85 border border-fuchsia-500/50 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-fuchsia-300 uppercase">
          LUT: {scene.colorGradePreset}
        </div>
      )}

      <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300">
        {scene.duration}s
      </div>
    </div>
  );
};

export const Timeline: React.FC<TimelineProps> = ({
  scenes,
  currentSceneIndex,
  setCurrentSceneIndex,
  onUpdateScene,
  onBulkUpdateScenes,
  onRegenerateScene,
  onExtendScene,
  onDeleteScene,
  onBulkDeleteScenes,
  onReorderScenes,
  onAddScene,
  onSeekToScene,
  isPlaying,
  characters = [],
  onOpenTurnaround,
  onOpenBatchAudio,
  onOpenTransitions,
  onOpenCostumeLock,
  onOpenBackgroundGenerator,
  onOpenVoiceRecorder,
  onOpenSceneMetadata,
  onOpenCinematicGallery,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  // Drag and drop reordering states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [targetDropSlot, setTargetDropSlot] = useState<number | null>(null);

  // Bulk Edit Mode States
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [bulkVoiceActor, setBulkVoiceActor] = useState(VOICE_ACTORS[0].category);
  const [bulkCharacterId, setBulkCharacterId] = useState<string>(characters[0]?.id || '');
  const [bulkVolume, setBulkVolume] = useState<number>(1.0);
  const [bulkPitch, setBulkPitch] = useState<number>(1.0);
  const [bulkRate, setBulkRate] = useState<number>(1.0);
  const [bulkTransition, setBulkTransition] = useState<TransitionEffect>('Dissolve');
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);
  const [openTuningIds, setOpenTuningIds] = useState<string[]>([]);
  const [openWardrobeSceneId, setOpenWardrobeSceneId] = useState<string | null>(null);

  // Inline Narration Text Editor State
  const [editingNarrationSceneId, setEditingNarrationSceneId] = useState<string | null>(null);
  const [inlineEditText, setInlineEditText] = useState<string>('');
  const [savedNarrationSceneId, setSavedNarrationSceneId] = useState<string | null>(null);

  // Scene Location & Time of Day Tag States
  const [editingLocationSceneId, setEditingLocationSceneId] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState<string>('');
  const [openTimePickerSceneId, setOpenTimePickerSceneId] = useState<string | null>(null);
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterTimeOfDay, setFilterTimeOfDay] = useState<string>('all');

  // Visual Transition Dropdown Selector State
  const [openTransitionDropdownSceneId, setOpenTransitionDropdownSceneId] = useState<string | null>(null);

  // Global listener to close popovers on click outside or Escape
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenTimePickerSceneId(null);
      setOpenTransitionDropdownSceneId(null);
    };
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenTimePickerSceneId(null);
        setOpenTransitionDropdownSceneId(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleStartInlineEdit = (scene: Scene) => {
    setEditingNarrationSceneId(scene.id);
    setInlineEditText(scene.voiceoverText || '');
  };

  const handleSaveInlineEdit = (sceneId: string) => {
    onUpdateScene(sceneId, { voiceoverText: inlineEditText.trim() });
    setEditingNarrationSceneId(null);
    setSavedNarrationSceneId(sceneId);
    setTimeout(() => {
      setSavedNarrationSceneId((prev) => (prev === sceneId ? null : prev));
    }, 2500);
  };

  const handleCancelInlineEdit = () => {
    setEditingNarrationSceneId(null);
    setInlineEditText('');
  };

  const handleInlineKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    sceneId: string
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveInlineEdit(sceneId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelInlineEdit();
    }
  };

  // Reorder scenes & auto-recalculate continuous chronological timestamps
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= scenes.length ||
      toIndex >= scenes.length
    ) {
      return;
    }

    const newScenes = [...scenes];
    const [moved] = newScenes.splice(fromIndex, 1);
    newScenes.splice(toIndex, 0, moved);

    // Auto-recalculate seamless continuous start/end timestamps and scene numbering
    let runningTime = 0;
    const recalculated = newScenes.map((s, idx) => {
      const duration = s.duration || 6;
      const startTime = runningTime;
      const endTime = runningTime + duration;
      runningTime = endTime;
      return {
        ...s,
        sceneNumber: idx + 1,
        startTime,
        endTime,
      };
    });

    if (onReorderScenes) {
      onReorderScenes(recalculated);
    }

    // Sync selected scene index and video scrubber
    setCurrentSceneIndex(toIndex);
    onSeekToScene(recalculated[toIndex]);

    triggerFeedback(`Moved Scene #${fromIndex + 1} to Position #${toIndex + 1} (Timestamps auto-calculated)`);
  };

  // Calculate destination index in final array for a given target slot
  const calculateDestinationIndex = (dragged: number, slot: number): number => {
    return slot > dragged ? slot - 1 : slot;
  };

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isBulkMode) {
      e.preventDefault();
      return;
    }
    const target = e.target as HTMLElement;
    // Don't initiate drag if clicking on interactive elements (inputs, textareas, sliders, buttons)
    if (target.closest('input, textarea, select, button, [role="slider"]')) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    setTargetDropSlot(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const isLeftHalf = e.clientX < midX;
    const slot = isLeftHalf ? index : index + 1;
    setTargetDropSlot(slot);
  };

  const handleSlotDragOver = (e: React.DragEvent, slot: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setTargetDropSlot(slot);
  };

  const handleDropAtSlot = (slot: number) => {
    if (draggedIndex === null) return;

    // Dropping in the slot before or after the item's current position doesn't move it
    if (slot === draggedIndex || slot === draggedIndex + 1) {
      setDraggedIndex(null);
      setTargetDropSlot(null);
      return;
    }

    const destinationIndex = calculateDestinationIndex(draggedIndex, slot);
    handleReorder(draggedIndex, destinationIndex);

    setDraggedIndex(null);
    setTargetDropSlot(null);
  };

  const handleCardDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const isLeftHalf = e.clientX < midX;
    const slot = isLeftHalf ? index : index + 1;

    handleDropAtSlot(slot);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setTargetDropSlot(null);
  };

  // Horizontal auto-scroll during drag
  const handleTimelineDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || !timelineScrollRef.current) return;

    const container = timelineScrollRef.current;
    const rect = container.getBoundingClientRect();
    const threshold = 120;
    const clientX = e.clientX;

    if (clientX < rect.left + threshold) {
      const factor = Math.max(0.2, (rect.left + threshold - clientX) / threshold);
      container.scrollLeft -= Math.round(18 * factor);
    } else if (clientX > rect.right - threshold) {
      const factor = Math.max(0.2, (clientX - (rect.right - threshold)) / threshold);
      container.scrollLeft += Math.round(18 * factor);
    }
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleTuning = (id: string) => {
    setOpenTuningIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePreviewVoice = (scene: Scene, customText?: string) => {
    if (previewingVoiceId === scene.id) {
      audioEngine.stopNarration();
      setPreviewingVoiceId(null);
      return;
    }

    // If scene has custom user recorded voice, play the recorded audio
    if (scene.audioUrl) {
      setPreviewingVoiceId(scene.id);
      audioEngine.playAudioClip(
        scene.audioUrl,
        scene.audioVolume ?? 1.0,
        () => setPreviewingVoiceId(scene.id),
        () => setPreviewingVoiceId(null)
      );
      return;
    }

    const textToSpeak = customText !== undefined ? customText : scene.voiceoverText;
    if (!textToSpeak.trim()) return;

    setPreviewingVoiceId(scene.id);
    audioEngine.speakNarration(
      textToSpeak,
      scene.voiceActor,
      () => setPreviewingVoiceId(scene.id),
      () => setPreviewingVoiceId(null),
      scene.audioVolume ?? 1.0,
      scene.voicePitch ?? 1.0,
      scene.voiceRate ?? 1.0
    );
  };

  // Bulk Selection Handlers
  const toggleSelectScene = (id: string) => {
    setSelectedSceneIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedSceneIds(scenes.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedSceneIds([]);
  };

  const triggerFeedback = (msg: string) => {
    setBulkFeedback(msg);
    setTimeout(() => setBulkFeedback(null), 2500);
  };

  // Apply Bulk Voice Actor
  const handleApplyBulkVoice = () => {
    if (selectedSceneIds.length === 0) return;
    if (onBulkUpdateScenes) {
      onBulkUpdateScenes(selectedSceneIds, { voiceActor: bulkVoiceActor });
    } else {
      selectedSceneIds.forEach((id) => onUpdateScene(id, { voiceActor: bulkVoiceActor }));
    }
    triggerFeedback(`Re-assigned ${selectedSceneIds.length} scene(s) to "${bulkVoiceActor}"`);
  };

  // Apply Bulk Audio Volume Level
  const handleApplyBulkVolume = () => {
    if (selectedSceneIds.length === 0) return;
    if (onBulkUpdateScenes) {
      onBulkUpdateScenes(selectedSceneIds, { audioVolume: bulkVolume });
    } else {
      selectedSceneIds.forEach((id) => onUpdateScene(id, { audioVolume: bulkVolume }));
    }
    triggerFeedback(`Set volume to ${Math.round(bulkVolume * 100)}% for ${selectedSceneIds.length} scene(s)`);
  };

  // Apply Bulk Pitch and Speed Delivery
  const handleApplyBulkDelivery = () => {
    if (selectedSceneIds.length === 0) return;
    if (onBulkUpdateScenes) {
      onBulkUpdateScenes(selectedSceneIds, { voicePitch: bulkPitch, voiceRate: bulkRate });
    } else {
      selectedSceneIds.forEach((id) => onUpdateScene(id, { voicePitch: bulkPitch, voiceRate: bulkRate }));
    }
    triggerFeedback(`Applied pitch ${bulkPitch.toFixed(2)}x & speed ${bulkRate.toFixed(2)}x to ${selectedSceneIds.length} scene(s)`);
  };

  // Apply Bulk Transition Effect
  const handleApplyBulkTransition = () => {
    if (selectedSceneIds.length === 0) return;
    if (onBulkUpdateScenes) {
      onBulkUpdateScenes(selectedSceneIds, { transitionEffect: bulkTransition });
    } else {
      selectedSceneIds.forEach((id) => onUpdateScene(id, { transitionEffect: bulkTransition }));
    }
    triggerFeedback(`Applied "${bulkTransition}" transition to ${selectedSceneIds.length} scene(s)`);
  };

  // Apply Bulk Character Reference
  const handleApplyBulkCharacter = () => {
    if (selectedSceneIds.length === 0) return;
    const targetChar = characters.find((c) => c.id === bulkCharacterId);
    if (!targetChar) return;
    const updates: Partial<Scene> = {
      characterId: targetChar.id,
      characterName: targetChar.name,
      characterRole: targetChar.role,
      characterDescription: targetChar.description,
      characterAvatar: targetChar.imageUrl,
      characterAccent: targetChar.colorAccent,
      voiceActor: targetChar.assignedVoice,
    };
    if (onBulkUpdateScenes) {
      onBulkUpdateScenes(selectedSceneIds, updates);
    } else {
      selectedSceneIds.forEach((id) => onUpdateScene(id, updates));
    }
    triggerFeedback(`Linked ${selectedSceneIds.length} scene(s) to ${targetChar.name}`);
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedSceneIds.length === 0) return;
    if (onBulkDeleteScenes) {
      onBulkDeleteScenes(selectedSceneIds);
    } else {
      selectedSceneIds.forEach((id) => onDeleteScene(id));
    }
    setSelectedSceneIds([]);
    triggerFeedback(`Deleted ${selectedSceneIds.length} scenes`);
  };

  // Render visual drop landing indicator for a given gap slot between scenes
  const renderDropIndicator = (slot: number) => {
    if (draggedIndex === null) return null;

    const isCurrentPosition = slot === draggedIndex || slot === draggedIndex + 1;
    const isTargetSlot = targetDropSlot === slot && !isCurrentPosition;
    const destIdx = calculateDestinationIndex(draggedIndex, slot);

    if (isTargetSlot) {
      return (
        <div
          key={`drop-indicator-active-${slot}`}
          onDragOver={(e) => handleSlotDragOver(e, slot)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDropAtSlot(slot);
          }}
          className="w-12 h-[370px] shrink-0 flex flex-col items-center justify-center relative z-40 transition-all duration-200 select-none animate-in fade-in zoom-in-95"
        >
          {/* Floating Landing Badge with Down Chevron */}
          <div className="absolute -top-3.5 z-50 flex flex-col items-center pointer-events-none animate-bounce">
            <div className="px-3 py-1 rounded-full bg-cyan-400 text-black text-[10px] font-mono font-black shadow-[0_0_20px_#00f0ff] flex items-center gap-1.5 whitespace-nowrap border border-white/60">
              <MoveHorizontal className="w-3.5 h-3.5 stroke-[3]" />
              <span>DROP HERE · POSITION #{destIdx + 1}</span>
            </div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-cyan-400" />
          </div>

          {/* Glowing Neon Insertion Line */}
          <div className="relative w-2.5 h-full flex flex-col items-center">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-cyan-400/40 rounded-full blur-[10px] animate-pulse" />
            {/* Core Solid Gradient Beam */}
            <div className="relative w-2 h-full rounded-full bg-gradient-to-b from-cyan-300 via-sky-400 to-cyan-500 shadow-[0_0_18px_#00f0ff]" />
            {/* Center Pulsing Radar Ring */}
            <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cyan-400/30 ring-4 ring-cyan-400/70 shadow-[0_0_20px_#00f0ff] animate-ping" />
            <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_#00f0ff]" />
          </div>

          {/* Bottom Landing Pin */}
          <div className="absolute -bottom-2.5 z-50 flex flex-col items-center pointer-events-none">
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-cyan-400" />
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#00f0ff]" />
          </div>
        </div>
      );
    }

    return (
      <div
        key={`drop-slot-${slot}`}
        onDragOver={(e) => handleSlotDragOver(e, slot)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDropAtSlot(slot);
        }}
        className="w-4 h-[370px] -mx-2 shrink-0 flex items-center justify-center cursor-pointer z-30 group/slot"
        title={!isCurrentPosition ? `Drop to place at position #${destIdx + 1}` : 'Current position'}
      >
        <div
          className={`w-0.5 rounded-full transition-all ${
            !isCurrentPosition
              ? 'h-1/3 bg-zinc-800/80 group-hover/slot:h-3/4 group-hover/slot:w-1.5 group-hover/slot:bg-cyan-400 group-hover/slot:shadow-[0_0_12px_#00f0ff]'
              : 'h-1/6 bg-zinc-900 opacity-20'
          }`}
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#080a11] text-zinc-200 select-none">
      {/* Timeline Header Track & Controls */}
      <div className="h-10 px-4 border-b border-zinc-800/80 bg-[#0c101a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
              Interactive Video Timeline
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            ({scenes.length} Scenes Sequenced)
          </span>

          {/* Active Drag Reorder Status Pill or Default Drag Hint */}
          {draggedIndex !== null ? (
            <div className="flex items-center gap-2 bg-cyan-950/85 border border-cyan-500/70 px-2.5 py-0.5 rounded-full text-[11px] font-mono shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-200 font-bold">
                Reordering Scene #{draggedIndex + 1}
              </span>
              <ChevronRight className="w-3 h-3 text-cyan-400" />
              {targetDropSlot !== null && targetDropSlot !== draggedIndex && targetDropSlot !== draggedIndex + 1 ? (
                <span className="text-emerald-300 font-bold">
                  Drop to place at Position #{calculateDestinationIndex(draggedIndex, targetDropSlot) + 1} of {scenes.length}
                </span>
              ) : (
                <span className="text-zinc-400">
                  Hover between scenes to drop
                </span>
              )}
              <button
                onClick={() => {
                  setDraggedIndex(null);
                  setTargetDropSlot(null);
                }}
                className="ml-1 text-[9px] px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer"
                title="Cancel reordering (Esc)"
              >
                Cancel (Esc)
              </button>
            </div>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400/90 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
              <GripVertical className="w-3 h-3 text-cyan-400" />
              <span>Drag cards to reorder</span>
            </span>
          )}

          {/* Production Locations & Time of Day Overview */}
          {(() => {
            const locCount = new Set(scenes.map((s) => s.sceneLocation).filter(Boolean)).size;
            const timeCount = new Set(scenes.map((s) => s.timeOfDay).filter(Boolean)).size;
            if (locCount === 0 && timeCount === 0) return null;
            return (
              <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono">
                {locCount > 0 && (
                  <span className="flex items-center gap-1 bg-[#090d18] border border-cyan-500/30 px-2 py-0.5 rounded text-cyan-300">
                    <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                    <span>{locCount} {locCount === 1 ? 'Location' : 'Locations'}</span>
                  </span>
                )}
                {timeCount > 0 && (
                  <span className="flex items-center gap-1 bg-[#090d18] border border-amber-500/30 px-2 py-0.5 rounded text-amber-300">
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    <span>{timeCount} Lighting Times</span>
                  </span>
                )}
              </div>
            );
          })()}

          {bulkFeedback && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
              ✓ {bulkFeedback}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Transition Effects Studio Modal Button */}
          {onOpenTransitions && (
            <button
              onClick={onOpenTransitions}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.15)]"
              title="Open Transition Effects Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Transitions</span>
            </button>
          )}

          {/* Character Costume Locks Modal Button */}
          {onOpenCostumeLock && (
            <button
              onClick={onOpenCostumeLock}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.15)]"
              title="Manage Character Costume Locks for visual continuity"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Costume Locks</span>
            </button>
          )}

          {/* Batch Audio Generator Button */}
          {onOpenBatchAudio && (
            <button
              onClick={onOpenBatchAudio}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/35 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.15)]"
              title="Batch generate and sync audio files for all scenes at once"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>Batch Audio</span>
            </button>
          )}

          {/* Voice Recorder Studio Button */}
          {onOpenVoiceRecorder && (
            <button
              onClick={() => onOpenVoiceRecorder()}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.15)]"
              title="Record your voice with microphone for any scene"
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span>Record Voice</span>
            </button>
          )}

          {/* AI Background Asset Studio Button */}
          {onOpenBackgroundGenerator && (
            <button
              onClick={() => onOpenBackgroundGenerator()}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/35 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.15)]"
              title="Open AI Background Studio to create custom environment assets"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>Backgrounds</span>
            </button>
          )}

          {/* Scene Metadata & Slate Rig Button */}
          {onOpenSceneMetadata && (
            <button
              onClick={() => onOpenSceneMetadata()}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              title="Attach and edit Scene Metadata (Shooting date, lens focal length, aperture)"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Scene Slate</span>
            </button>
          )}

          {/* Cinematic Preset Gallery - Color Grading Filters Button */}
          {onOpenCinematicGallery && (
            <button
              onClick={() => onOpenCinematicGallery()}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/35 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(217,70,239,0.18)]"
              title="Open Cinematic Preset Gallery to apply color grading filters (Noir, Technicolor, Retro, Desaturated)"
            >
              <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Color Presets</span>
            </button>
          )}

          {/* Bulk Edit Mode Toggle Button */}
          <button
            onClick={() => {
              const next = !isBulkMode;
              setIsBulkMode(next);
              if (!next) setSelectedSceneIds([]);
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isBulkMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(255,170,0,0.2)]'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>{isBulkMode ? 'Exit Bulk Mode' : 'Bulk Edit Mode'}</span>
            {selectedSceneIds.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center">
                {selectedSceneIds.length}
              </span>
            )}
          </button>

          <button
            onClick={onAddScene}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Scene</span>
          </button>
        </div>
      </div>

      {/* Bulk Editing Floating Action Dock */}
      {isBulkMode && (
        <div className="bg-[#101423] border-b border-cyan-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-20 shadow-lg animate-in fade-in duration-200">
          {/* Left Selection Controls */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[11px]">
              {selectedSceneIds.length} of {scenes.length} Selected
            </span>
            <button
              onClick={handleSelectAll}
              className="px-2 py-1 rounded bg-[#182035] hover:bg-[#202a45] text-zinc-300 hover:text-white border border-zinc-700 text-[11px] transition-colors cursor-pointer"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-2 py-1 rounded bg-[#182035] hover:bg-[#202a45] text-zinc-400 hover:text-white border border-zinc-700 text-[11px] transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Center Action: Re-assign Voice Actor */}
          <div className="flex items-center gap-2 bg-[#090c15] px-3 py-1.5 rounded-lg border border-zinc-800">
            <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-300">Voice:</span>
            <select
              value={bulkVoiceActor}
              onChange={(e) => setBulkVoiceActor(e.target.value)}
              className="bg-[#121626] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {VOICE_ACTORS.map((va) => (
                <option key={va.id} value={va.category}>
                  {va.name} ({va.category})
                </option>
              ))}
            </select>
            <button
              onClick={handleApplyBulkVoice}
              disabled={selectedSceneIds.length === 0}
              className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[11px] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.2)]"
            >
              Apply Voice
            </button>
          </div>

          {/* Center-Right Action: Pitch & Speed Delivery */}
          <div className="flex items-center gap-2 bg-[#090c15] px-3 py-1.5 rounded-lg border border-zinc-800">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-300">
              <span>Pitch:</span>
              <input
                type="range"
                min="0.6"
                max="1.4"
                step="0.05"
                value={bulkPitch}
                onChange={(e) => setBulkPitch(parseFloat(e.target.value))}
                className="w-12 h-1 bg-zinc-800 rounded accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-cyan-300 text-[10px] w-7">{bulkPitch.toFixed(2)}x</span>

              <span>Speed:</span>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={bulkRate}
                onChange={(e) => setBulkRate(parseFloat(e.target.value))}
                className="w-12 h-1 bg-zinc-800 rounded accent-amber-400 cursor-pointer"
              />
              <span className="font-mono text-amber-300 text-[10px] w-7">{bulkRate.toFixed(2)}x</span>
            </div>
            <button
              onClick={handleApplyBulkDelivery}
              disabled={selectedSceneIds.length === 0}
              className="px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[11px] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.2)]"
            >
              Apply Delivery
            </button>
          </div>

          {/* Right Action: Transitions */}
          <div className="flex items-center gap-2 bg-[#090c15] px-3 py-1.5 rounded-lg border border-zinc-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-300">Transition:</span>
            <select
              value={bulkTransition}
              onChange={(e) => setBulkTransition(e.target.value as TransitionEffect)}
              className="bg-[#121626] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {TRANSITION_EFFECTS.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleApplyBulkTransition}
              disabled={selectedSceneIds.length === 0}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-[0_0_8px_rgba(255,170,0,0.2)]"
            >
              Apply Transition
            </button>
          </div>

          {/* Right Action: Audio Volume Levels */}
          <div className="flex items-center gap-2 bg-[#090c15] px-3 py-1.5 rounded-lg border border-zinc-800">
            <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-300">Vol:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bulkVolume}
              onChange={(e) => setBulkVolume(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-zinc-800 rounded accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-amber-300 font-semibold w-8 text-right text-[11px]">
              {Math.round(bulkVolume * 100)}%
            </span>
            <button
              onClick={handleApplyBulkVolume}
              disabled={selectedSceneIds.length === 0}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-[0_0_8px_rgba(255,170,0,0.2)]"
            >
              Apply Vol
            </button>
          </div>

          {/* Batch Audio Generator in Bulk Mode */}
          {onOpenBatchAudio && (
            <button
              onClick={onOpenBatchAudio}
              className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold border border-purple-500/40 text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(168,85,247,0.2)]"
            >
              <Mic className="w-3 h-3 text-purple-400" />
              <span>Batch Audio ({selectedSceneIds.length > 0 ? selectedSceneIds.length : scenes.length})</span>
            </button>
          )}

          {/* Delete Action & Close */}
          <div className="flex items-center gap-2">
            {selectedSceneIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete ({selectedSceneIds.length})
              </button>
            )}
            <button
              onClick={() => {
                setIsBulkMode(false);
                setSelectedSceneIds([]);
              }}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Close Bulk Editing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Horizontal Scrollable Timeline Area */}
      <div
        ref={timelineScrollRef}
        onDragOver={handleTimelineDragOver}
        className="flex-1 overflow-x-auto p-4 custom-scrollbar flex items-start gap-3 min-h-[310px]"
      >
        {/* Drop target slot before Scene #1 (Slot 0) */}
        {renderDropIndicator(0)}

        {scenes.map((scene, index) => {
          const isSelected = currentSceneIndex === index;
          const isBulkSelected = selectedSceneIds.includes(scene.id);
          const isRendering = scene.status === 'rendering';
          const isDraggingThis = draggedIndex === index;

          const isLeftTargeted =
            targetDropSlot === index &&
            draggedIndex !== null &&
            draggedIndex !== index &&
            draggedIndex !== index - 1;
          const isRightTargeted =
            targetDropSlot === index + 1 &&
            draggedIndex !== null &&
            draggedIndex !== index &&
            draggedIndex !== index + 1;

          return (
            <React.Fragment key={scene.id}>
              <div
                draggable={!isBulkMode}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleCardDragOver(e, index)}
                onDrop={(e) => handleCardDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (isBulkMode) {
                    toggleSelectScene(scene.id);
                  } else {
                    setCurrentSceneIndex(index);
                    onSeekToScene(scene);
                  }
                }}
                className={`w-[330px] shrink-0 rounded-xl border transition-all duration-200 flex flex-col bg-[#0b0e18] shadow-lg relative cursor-pointer select-none ${
                  isDraggingThis
                    ? 'opacity-35 scale-[0.98] border-dashed border-2 border-cyan-400 ring-2 ring-cyan-500/30 bg-[#09101d]'
                    : isLeftTargeted
                    ? 'border-l-4 border-l-cyan-400 border-zinc-800 bg-[#0b0e18] shadow-[-10px_0_25px_rgba(0,240,255,0.25)]'
                    : isRightTargeted
                    ? 'border-r-4 border-r-cyan-400 border-zinc-800 bg-[#0b0e18] shadow-[10px_0_25px_rgba(0,240,255,0.25)]'
                    : isBulkSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_25px_rgba(255,170,0,0.25)] bg-[#12131d]'
                    : isSelected
                    ? 'border-cyan-500 ring-1 ring-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                    : 'border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                {/* Dragged Card Center Silhouette Overlay */}
                {isDraggingThis && (
                  <div className="absolute inset-0 bg-[#070b16]/85 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center gap-2 z-30 p-4 text-center pointer-events-none">
                    <GripVertical className="w-7 h-7 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      Moving Scene #{index + 1}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Release between scenes to place
                    </span>
                  </div>
                )}

              {/* Scene Card Header */}
              <div className="p-3 border-b border-zinc-850 flex items-center justify-between bg-[#0e1322]/80 rounded-t-xl gap-1">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {/* Drag Grip Handle */}
                  {!isBulkMode && (
                    <div
                      className="p-1 -ml-1 text-zinc-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing rounded hover:bg-zinc-800 transition-colors shrink-0"
                      title="Drag to reorder scene sequence"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Bulk Selection Checkbox */}
                  {isBulkMode ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectScene(scene.id);
                      }}
                      className="p-0.5 rounded text-amber-400 hover:text-amber-300 cursor-pointer shrink-0"
                    >
                      {isBulkSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-500" />
                      )}
                    </button>
                  ) : (
                    <span
                      className={`w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 text-black shadow-[0_0_8px_#00f0ff]'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      #{scene.sceneNumber}
                    </span>
                  )}

                  <input
                    type="text"
                    value={scene.title}
                    onChange={(e) => onUpdateScene(scene.id, { title: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-xs font-bold text-zinc-200 focus:outline-none focus:text-cyan-300 w-24 truncate font-sans"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Single-Click Shift Left/Right Arrows for Rapid Reordering */}
                  {!isBulkMode && (
                    <div
                      className="flex items-center gap-0.5 bg-[#080b12] p-0.5 rounded border border-zinc-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleReorder(index, index - 1)}
                        disabled={index === 0}
                        title="Move Scene Earlier (Shift Left)"
                        className="p-0.5 rounded text-zinc-400 hover:text-cyan-300 disabled:opacity-20 disabled:hover:text-zinc-600 hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleReorder(index, index + 1)}
                        disabled={index === scenes.length - 1}
                        title="Move Scene Later (Shift Right)"
                        className="p-0.5 rounded text-zinc-400 hover:text-cyan-300 disabled:opacity-20 disabled:hover:text-zinc-600 hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {formatSecs(scene.startTime)} - {formatSecs(scene.endTime)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScene(scene.id);
                    }}
                    title="Delete Scene"
                    className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Color-Coded Character & Dynamic Outfit Badges Bar */}
              {(() => {
                const linkedChar =
                  characters.find((c) => c.id === scene.characterId) ||
                  characters.find((c) => c.name.toLowerCase() === (scene.characterName || '').toLowerCase());
                const activeOutfit =
                  linkedChar?.outfits?.find((o) => o.id === scene.outfitId) ||
                  linkedChar?.outfits?.find((o) => o.name === scene.outfitName) ||
                  linkedChar?.outfits?.[0];

                return (
                  <div className="px-3 pt-2 flex items-center justify-between gap-1 text-[10px] font-mono relative">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {/* Character Pill */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenWardrobeSceneId(openWardrobeSceneId === scene.id ? null : scene.id);
                        }}
                        className="px-2 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer shrink-0"
                        style={{
                          borderColor: linkedChar ? `${linkedChar.colorAccent}80` : '#3f3f46',
                          backgroundColor: linkedChar ? `${linkedChar.colorAccent}15` : '#18181b',
                          color: linkedChar ? linkedChar.colorAccent : '#a1a1aa',
                        }}
                        title="Click to change character or wardrobe outfit"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: linkedChar?.colorAccent || '#71717a' }}
                        />
                        <span className="font-bold truncate max-w-[70px]">
                          {linkedChar?.name || scene.characterName || 'No Cast'}
                        </span>
                      </button>

                      {/* Matching Locked Outfit Badge */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenWardrobeSceneId(openWardrobeSceneId === scene.id ? null : scene.id);
                        }}
                        className="px-2 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer truncate flex-1 min-w-0"
                        style={{
                          borderColor: linkedChar ? `${linkedChar.colorAccent}50` : '#00f0ff40',
                          backgroundColor: linkedChar ? `${linkedChar.colorAccent}10` : '#00f0ff10',
                          color: linkedChar ? linkedChar.colorAccent : '#00f0ff',
                        }}
                        title="Click to select wardrobe outfit for this scene"
                      >
                        <Shirt className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{activeOutfit?.name || scene.outfitName || 'Signature Outfit'}</span>
                      </button>
                    </div>

                    {/* Face Lock Tag */}
                    {linkedChar && (
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 flex items-center gap-0.5 shrink-0"
                        title="Facial features reference lock active"
                      >
                        <Lock className="w-2.5 h-2.5 text-cyan-400" />
                        <span>Locked</span>
                      </span>
                    )}

                    {/* Wardrobe & Character Switcher Dropdown Popover */}
                    {openWardrobeSceneId === scene.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-3 right-3 top-full mt-1.5 bg-[#0a0f1d] border border-cyan-500/50 rounded-xl p-3 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.9)] space-y-2.5 animate-in fade-in duration-150 backdrop-blur-md"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-white border-b border-zinc-800 pb-1.5">
                          <span className="flex items-center gap-1.5 text-cyan-300">
                            <Shirt className="w-3.5 h-3.5 text-cyan-400" />
                            Scene #{scene.sceneNumber} Cast & Wardrobe
                          </span>
                          <button
                            onClick={() => setOpenWardrobeSceneId(null)}
                            className="text-zinc-400 hover:text-white cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Character Selector */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-400 block">Character:</label>
                          <select
                            value={linkedChar?.id || ''}
                            onChange={(e) => {
                              const newCharId = e.target.value;
                              const newChar = characters.find((c) => c.id === newCharId);
                              const newOutfit = newChar?.outfits?.[0];
                              const newPrompt = compileUnifiedVideoPrompt({
                                storySentence: scene.voiceoverText,
                                visualStyle: scene.visualStyle,
                                videoGenerator: scene.videoGenerator,
                                cameraMotion: scene.cameraMotion,
                                character: newChar,
                                outfit: newOutfit,
                              });
                              onUpdateScene(scene.id, {
                                characterId: newChar?.id,
                                characterName: newChar?.name,
                                characterRole: newChar?.role,
                                characterDescription: newChar?.description,
                                characterAvatar: newChar?.imageUrl,
                                characterAccent: newChar?.colorAccent,
                                outfitId: newOutfit?.id,
                                outfitName: newOutfit?.name,
                                outfitDescription: newOutfit?.description,
                                outfitImage: newOutfit?.imageUrl,
                                voiceActor: newChar?.assignedVoice || scene.voiceActor,
                                videoPrompt: newPrompt,
                              });
                            }}
                            className="w-full bg-[#05070e] border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            <option value="">-- No Character (Environmental Shot) --</option>
                            {characters.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Outfit Selector */}
                        {linkedChar && linkedChar.outfits && linkedChar.outfits.length > 0 && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-400 block">
                              Wardrobe Outfit for this Scene:
                            </label>
                            <select
                              value={activeOutfit?.id || linkedChar.outfits[0].id}
                              onChange={(e) => {
                                const newOutfitId = e.target.value;
                                const newOutfit = linkedChar.outfits.find((o) => o.id === newOutfitId);
                                const newPrompt = compileUnifiedVideoPrompt({
                                  storySentence: scene.voiceoverText,
                                  visualStyle: scene.visualStyle,
                                  videoGenerator: scene.videoGenerator,
                                  cameraMotion: scene.cameraMotion,
                                  character: linkedChar,
                                  outfit: newOutfit,
                                });
                                onUpdateScene(scene.id, {
                                  outfitId: newOutfit?.id,
                                  outfitName: newOutfit?.name,
                                  outfitDescription: newOutfit?.description,
                                  outfitImage: newOutfit?.imageUrl,
                                  videoPrompt: newPrompt,
                                });
                              }}
                              className="w-full bg-[#05070e] border border-zinc-700 rounded-lg px-2 py-1 text-xs text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer"
                            >
                              {linkedChar.outfits.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.name}
                                </option>
                              ))}
                            </select>
                            {activeOutfit && (
                              <p className="text-[10px] text-zinc-400 line-clamp-2 italic pt-0.5">
                                "{activeOutfit.description}"
                              </p>
                            )}
                          </div>
                        )}

                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => setOpenWardrobeSceneId(null)}
                            className="px-2.5 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] cursor-pointer"
                          >
                            Apply Wardrobe
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Scene Location & Time of Day Organization Tags */}
              <div className="px-3 pt-2 flex items-center justify-between gap-1.5 text-[10px] font-mono relative">
                {/* Location Tag */}
                <div className="flex-1 min-w-0">
                  {editingLocationSceneId === scene.id ? (
                    <div
                      className="flex items-center gap-1 bg-[#060812] border border-cyan-400 rounded px-1.5 py-0.5 shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                      <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onUpdateScene(scene.id, { sceneLocation: locationInput.trim() || 'Unassigned Set' });
                            setEditingLocationSceneId(null);
                          } else if (e.key === 'Escape') {
                            setEditingLocationSceneId(null);
                          }
                        }}
                        onBlur={() => {
                          onUpdateScene(scene.id, { sceneLocation: locationInput.trim() || 'Unassigned Set' });
                          setEditingLocationSceneId(null);
                        }}
                        autoFocus
                        placeholder="Enter location / set..."
                        className="bg-transparent text-cyan-200 text-[10px] focus:outline-none w-full font-mono placeholder:text-zinc-600"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLocationSceneId(scene.id);
                        setLocationInput(scene.sceneLocation || '');
                      }}
                      className="w-full flex items-center gap-1 px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-400/60 text-cyan-300 transition-all cursor-pointer text-left group/loc"
                      title="Click to edit scene location tag"
                    >
                      <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0 group-hover/loc:scale-110 transition-transform" />
                      <span className="truncate font-medium">{scene.sceneLocation || 'Set Location'}</span>
                    </button>
                  )}
                </div>

                {/* Time of Day Tag with Dropdown Selector */}
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenTimePickerSceneId(openTimePickerSceneId === scene.id ? null : scene.id)
                    }
                    className={`px-2 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer font-bold ${getTimeOfDayBadgeStyle(
                      scene.timeOfDay
                    )}`}
                    title="Click to change time of day lighting"
                  >
                    {renderTimeOfDayIcon(scene.timeOfDay)}
                    <span>{scene.timeOfDay || 'TimeOfDay'}</span>
                  </button>

                  {/* Quick Time of Day Dropdown Popover */}
                  {openTimePickerSceneId === scene.id && (
                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-[#0c101d] border border-zinc-700 rounded-xl p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.95)] z-50 space-y-1 backdrop-blur-md">
                      <div className="text-[9px] font-mono text-zinc-400 px-1 pb-1 border-b border-zinc-800">
                        Lighting / Time of Day:
                      </div>
                      {TIME_OF_DAY_OPTIONS.map((tod) => (
                        <button
                          key={tod.id}
                          onClick={() => {
                            onUpdateScene(scene.id, { timeOfDay: tod.id });
                            setOpenTimePickerSceneId(null);
                          }}
                          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-left transition-colors cursor-pointer ${
                            (scene.timeOfDay || 'Night') === tod.id
                              ? `${tod.bg} ${tod.color} font-bold border ${tod.border}`
                              : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                          }`}
                        >
                          {renderTimeOfDayIcon(tod.id)}
                          <span>{tod.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Background Asset Badge / Button */}
                {onOpenBackgroundGenerator && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenBackgroundGenerator(scene.id);
                    }}
                    className={`px-2 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer font-bold shrink-0 ${
                      scene.backgroundImage
                        ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-750 hover:border-cyan-500/40 hover:text-cyan-300'
                    }`}
                    title={scene.backgroundImage ? 'Custom Background Asset Active (Click to edit)' : 'Generate custom background for this scene'}
                  >
                    <ImageIcon className={`w-2.5 h-2.5 ${scene.backgroundImage ? 'text-cyan-400' : 'text-zinc-400'}`} />
                    <span>{scene.backgroundImage ? 'BG Set' : '+ BG'}</span>
                  </button>
                )}

                {/* Scene Slate & Metadata Lens Badge / Button */}
                {onOpenSceneMetadata && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSceneMetadata(scene.id);
                    }}
                    className={`px-2 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer font-bold shrink-0 ${
                      scene.metadata?.lensFocalLength
                        ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-750 hover:border-amber-500/40 hover:text-amber-300'
                    }`}
                    title={
                      scene.metadata?.lensFocalLength
                        ? `Slate: ${scene.metadata.lensFocalLength} • ${scene.metadata.cameraAperture || 'T1.5'} • ${scene.metadata.shootingDate} (Click to edit)`
                        : 'Attach camera lens, aperture & shooting date metadata'
                    }
                  >
                    <Camera className={`w-2.5 h-2.5 ${scene.metadata?.lensFocalLength ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span>
                      {scene.metadata?.lensFocalLength
                        ? `${scene.metadata.lensFocalLength.split(' ')[0]} ${scene.metadata.cameraAperture || ''}`
                        : '+ Slate'}
                    </span>
                  </button>
                )}
              </div>

              {/* Scene Audio, Voice Actor & Transition Badges */}
              <div className="px-3 pt-2 flex items-center justify-between text-[10px] font-mono">
                <span className="text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
                  <Mic className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[80px]">{scene.voiceActor.split(' ')[0]}</span>
                </span>
                {scene.audioUrl && (
                  <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 text-[9px] flex items-center gap-1 font-bold">
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{scene.audioDuration ? `${scene.audioDuration}s WAV` : 'WAV Sync'}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenTransitionDropdownSceneId(
                      openTransitionDropdownSceneId === scene.id ? null : scene.id
                    );
                  }}
                  className={`px-1.5 py-0.5 rounded border text-[9px] flex items-center gap-1 font-mono transition-all cursor-pointer ${
                    getTransitionVisualDetails(scene.transitionEffect).badge
                  }`}
                  title="Click to select visual transition effect"
                >
                  {renderTransitionIcon(scene.transitionEffect, 'w-2.5 h-2.5')}
                  <span>Tr: {scene.transitionEffect || 'Dissolve'}</span>
                  <ChevronDown
                    className={`w-2 h-2 opacity-60 transition-transform ${
                      openTransitionDropdownSceneId === scene.id ? 'rotate-180 text-amber-400' : ''
                    }`}
                  />
                </button>
                <span className="text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-[9px]">
                  Vol: {Math.round((scene.audioVolume ?? 1.0) * 100)}%
                </span>
              </div>

              {/* Card Body */}
              <div className="p-3 space-y-3 flex-1 flex flex-col">
                {/* 1. AI Video Generation Status & Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isRendering ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                        }`}
                      />
                      <span className="truncate max-w-[200px] text-zinc-300">
                        {scene.generationPhase || 'Rendering Ready'}
                      </span>
                    </span>
                    <span className="text-cyan-400 font-bold">{scene.progress}%</span>
                  </div>

                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${scene.progress}%` }}
                      className={`h-full transition-all duration-300 ${
                        isRendering
                          ? 'bg-gradient-to-r from-amber-500 to-cyan-400 animate-pulse'
                          : 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Thumbnail displaying the generated moving video clip */}
                <MovingSceneThumbnail scene={scene} isSelected={isSelected} />

                {/* Camera Motion Path Visualization & Intensity Tuning */}
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3 text-cyan-400" />
                      Camera Motion & Path
                    </span>
                    <span className="text-zinc-500 font-mono text-[9px]">Click to tune intensity</span>
                  </div>
                  <CameraMotionPanel
                    scene={scene}
                    onUpdateScene={onUpdateScene}
                    onApplyToAllScenes={(motion, speed, intensity) => {
                      scenes.forEach((s) => {
                        onUpdateScene(s.id, {
                          cameraMotion: motion,
                          cameraSpeed: speed,
                          cameraIntensity: intensity,
                        });
                      });
                      triggerFeedback(`Applied "${intensity}" ${motion.split(',')[0]} to all shots`);
                    }}
                  />
                </div>

                {/* Visual Transition Dropdown Selector */}
                <div className="space-y-1 relative" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Visual Transition to Next Scene</span>
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Shader Blend
                    </span>
                  </div>

                  {/* Dropdown Trigger Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenTransitionDropdownSceneId(
                        openTransitionDropdownSceneId === scene.id ? null : scene.id
                      )
                    }
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border bg-[#080c16] hover:bg-[#0c1122] transition-all cursor-pointer group text-left ${
                      openTransitionDropdownSceneId === scene.id
                        ? 'border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/30'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    title="Select video transition effect (Fade, Dissolve, Wipe, Glitch, etc.)"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="p-1 rounded bg-[#0f1424] border border-zinc-700/60 shrink-0">
                        {renderTransitionIcon(scene.transitionEffect, 'w-3.5 h-3.5')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-white font-mono">
                            {scene.transitionEffect || 'Dissolve'}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate">
                            · {getTransitionVisualDetails(scene.transitionEffect).subtitle}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-1">
                      {/* Mini Visual Gradient Preview Bar */}
                      <div
                        className={`w-9 h-2.5 rounded bg-gradient-to-r ${
                          getTransitionVisualDetails(scene.transitionEffect).previewGradient
                        } border border-white/10 shadow-inner`}
                        title="Transition effect preview"
                      />
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                          openTransitionDropdownSceneId === scene.id ? 'rotate-180 text-amber-400' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Visual Dropdown Popover Menu */}
                  {openTransitionDropdownSceneId === scene.id && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1.5 bg-[#090d1a] border border-zinc-700/90 rounded-xl p-2 shadow-[0_16px_40px_rgba(0,0,0,0.95)] z-50 space-y-1 backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1 pb-1.5 border-b border-zinc-800">
                        <span className="font-semibold text-zinc-300">Choose Transition Effect:</span>
                        <span className="text-[9px] text-zinc-500">Live Preview</span>
                      </div>

                      <div className="space-y-1 pt-1 max-h-56 overflow-y-auto custom-scrollbar">
                        {TRANSITION_EFFECTS.map((tr) => {
                          const currentEffect = scene.transitionEffect || 'Dissolve';
                          const isSelected =
                            currentEffect === tr.id ||
                            (currentEffect === 'Cinematic Wipe' && tr.id === 'Wipe');
                          const details = getTransitionVisualDetails(tr.id);

                          return (
                            <button
                              key={tr.id}
                              type="button"
                              onClick={() => {
                                onUpdateScene(scene.id, { transitionEffect: tr.id });
                                setOpenTransitionDropdownSceneId(null);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer group/opt border ${
                                isSelected
                                  ? 'bg-[#12182b] border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/20'
                                  : 'border-transparent hover:bg-[#0f1424] hover:border-zinc-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="p-1 rounded bg-[#0a0e1c] border border-zinc-700/60 shrink-0">
                                  {renderTransitionIcon(tr.id, 'w-3.5 h-3.5')}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-xs font-bold font-mono ${
                                        isSelected
                                          ? 'text-amber-300'
                                          : 'text-zinc-200 group-hover/opt:text-white'
                                      }`}
                                    >
                                      {tr.label}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                      ({tr.subtitle})
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                                    {tr.desc}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {/* Visual Preview Strip */}
                                <div
                                  className={`w-11 h-2.5 rounded bg-gradient-to-r ${details.previewGradient} border border-white/10 shadow-sm`}
                                />
                                {isSelected ? (
                                  <div className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0 opacity-40 group-hover/opt:opacity-80" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick Action: Apply to all scenes */}
                      <div className="pt-1.5 mt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500 font-mono text-[9px]">Apply to sequence:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const chosen = scene.transitionEffect || 'Dissolve';
                            scenes.forEach((s) => {
                              onUpdateScene(s.id, { transitionEffect: chosen });
                            });
                            triggerFeedback(`Applied "${chosen}" transition to all scenes`);
                            setOpenTransitionDropdownSceneId(null);
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono text-[9px] transition-colors cursor-pointer border border-zinc-700"
                        >
                          Apply "{scene.transitionEffect || 'Dissolve'}" to all shots
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Inline Editable Voiceover Script Box & Delivery Tuning */}
                <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Mic className="w-3 h-3 text-cyan-400" />
                      <span>Voiceover Narration</span>
                      {savedNarrationSceneId === scene.id && (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30 animate-pulse flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Saved
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleTuning(scene.id)}
                        className={`text-[9px] font-mono flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          openTuningIds.includes(scene.id)
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border-zinc-700/60'
                        }`}
                        title="Tune pitch and speed delivery"
                      >
                        <SlidersHorizontal className="w-2.5 h-2.5 text-cyan-400" />
                        <span>Tune Delivery</span>
                      </button>
                      <button
                        onClick={() =>
                          handlePreviewVoice(
                            scene,
                            editingNarrationSceneId === scene.id ? inlineEditText : undefined
                          )
                        }
                        className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          previewingVoiceId === scene.id
                            ? 'bg-rose-500/20 text-rose-300 font-bold'
                            : 'hover:text-cyan-300 text-zinc-400'
                        }`}
                        title={scene.audioUrl ? 'Play custom recorded voice' : 'Audition spoken narration with assigned voice'}
                      >
                        <Play className="w-2.5 h-2.5" />
                        {previewingVoiceId === scene.id ? 'Playing' : scene.audioUrl ? 'Play Mic' : 'Listen'}
                      </button>

                      {onOpenVoiceRecorder && (
                        <button
                          onClick={() => onOpenVoiceRecorder(scene.id)}
                          className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                            scene.audioUrl
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30 hover:border-rose-400'
                              : 'hover:text-rose-300 text-zinc-400 hover:bg-zinc-800'
                          }`}
                          title="Record your voice with microphone for this scene"
                        >
                          <Mic className="w-2.5 h-2.5 text-rose-400" />
                          <span>{scene.audioUrl ? 'Re-Record' : 'Record'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {editingNarrationSceneId === scene.id ? (
                    /* Active Inline Editor */
                    <div className="p-2 rounded-lg bg-[#050811] border border-cyan-500/70 ring-2 ring-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.12)] space-y-2 animate-in fade-in duration-150">
                      <textarea
                        value={inlineEditText}
                        onChange={(e) => setInlineEditText(e.target.value)}
                        onKeyDown={(e) => handleInlineKeyDown(e, scene.id)}
                        autoFocus
                        rows={3}
                        className="w-full bg-transparent border-0 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none font-sans leading-relaxed"
                        placeholder="Type spoken dialogue or voiceover narration..."
                      />

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px]">
                        {/* Word count & speech duration badge */}
                        <div className="flex items-center gap-1.5 text-zinc-400 font-mono">
                          {(() => {
                            const words = inlineEditText.trim()
                              ? inlineEditText.trim().split(/\s+/).length
                              : 0;
                            const estSecs =
                              words > 0
                                ? ((words / (135 * (scene.voiceRate || 1.0))) * 60).toFixed(1)
                                : '0';
                            return (
                              <>
                                <span className="text-cyan-300 font-semibold">{words} words</span>
                                <span>·</span>
                                <span className="text-zinc-300">~{estSecs}s</span>
                                <span className="text-[9px] text-amber-400/90 font-mono bg-amber-950/40 px-1 py-0.2 rounded border border-amber-500/20">
                                  Auto-Ducked
                                </span>
                              </>
                            );
                          })()}
                        </div>

                        {/* Editor Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handleCancelInlineEdit}
                            className="px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Cancel editing (Esc)"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveInlineEdit(scene.id)}
                            className="px-2.5 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
                            title="Save narration (Ctrl+Enter)"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode with Click-to-Edit Interaction */
                    <div
                      onClick={() => handleStartInlineEdit(scene)}
                      className="group/narration relative p-2.5 rounded-lg border border-zinc-800 bg-[#07090f] hover:border-cyan-500/50 hover:bg-[#0a0e1c] transition-all cursor-text min-h-[58px] flex flex-col justify-between"
                      title="Click text to edit voiceover inline"
                    >
                      {scene.voiceoverText?.trim() ? (
                        <p className="text-xs text-zinc-200 font-sans leading-relaxed line-clamp-3 select-none">
                          <span className="text-cyan-400/70 font-serif mr-1">“</span>
                          {scene.voiceoverText}
                          <span className="text-cyan-400/70 font-serif ml-1">”</span>
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500 italic select-none">
                          Click to enter spoken narration for Scene #{scene.sceneNumber}...
                        </p>
                      )}

                      {/* Bottom Footer Info & Hover Edit Indicator */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-850/60 text-[9px] font-mono text-zinc-500">
                        {(() => {
                          const words = scene.voiceoverText?.trim()
                            ? scene.voiceoverText.trim().split(/\s+/).length
                            : 0;
                          const estSecs =
                            words > 0
                              ? ((words / (135 * (scene.voiceRate || 1.0))) * 60).toFixed(1)
                              : '0';
                          return (
                            <span className="text-zinc-400">
                              {words > 0 ? `${words} words · ~${estSecs}s speech` : 'No audio'}
                            </span>
                          );
                        })()}

                        <span className="flex items-center gap-1 text-cyan-400 opacity-60 group-hover/narration:opacity-100 transition-opacity font-medium">
                          <Pencil className="w-2.5 h-2.5" />
                          <span>Click to edit</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Pitch & Speed Delivery Sliders Drawer */}
                  {openTuningIds.includes(scene.id) && (
                    <div className="bg-[#070a12] border border-zinc-800/90 rounded-lg p-2 space-y-2 animate-in fade-in duration-150">
                      {/* Pitch Slider */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <span>Pitch:</span>
                            <span className="text-zinc-500 text-[9px]">
                              {(scene.voicePitch ?? 1.0) < 0.95
                                ? '(Deeper)'
                                : (scene.voicePitch ?? 1.0) > 1.05
                                ? '(Higher)'
                                : '(Normal)'}
                            </span>
                          </span>
                          <span className="text-cyan-300 font-semibold">
                            {(scene.voicePitch ?? 1.0).toFixed(2)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="1.4"
                          step="0.05"
                          value={scene.voicePitch ?? 1.0}
                          onChange={(e) => onUpdateScene(scene.id, { voicePitch: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-zinc-800 rounded accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      {/* Speed Slider */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <span>Speed:</span>
                            <span className="text-zinc-500 text-[9px]">
                              {(scene.voiceRate ?? 1.0) < 0.95
                                ? '(Slower)'
                                : (scene.voiceRate ?? 1.0) > 1.05
                                ? '(Faster)'
                                : '(Normal)'}
                            </span>
                          </span>
                          <span className="text-amber-300 font-semibold">
                            {(scene.voiceRate ?? 1.0).toFixed(2)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.7"
                          max="1.4"
                          step="0.05"
                          value={scene.voiceRate ?? 1.0}
                          onChange={(e) => onUpdateScene(scene.id, { voiceRate: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-zinc-800 rounded accent-amber-400 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-0.5 text-[9px] font-mono text-zinc-500">
                        <span>Delivery tuned per scene</span>
                        <button
                          onClick={() => onUpdateScene(scene.id, { voicePitch: 1.0, voiceRate: 1.0 })}
                          className="text-zinc-400 hover:text-cyan-300 underline cursor-pointer"
                        >
                          Reset Defaults (1.0x)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Editable Video Generator API Prompt Box */}
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1">
                      <FileCode className="w-3 h-3 text-amber-400" />
                      Video API Prompt ({scene.videoGenerator.split(' ')[0]})
                    </span>
                    <button
                      onClick={() => handleCopyPrompt(scene.id, scene.videoPrompt)}
                      className="text-[10px] text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedId === scene.id ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={scene.videoPrompt}
                    onChange={(e) => onUpdateScene(scene.id, { videoPrompt: e.target.value })}
                    rows={2}
                    className="w-full bg-[#07090f] border border-zinc-800 rounded-lg p-2 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-amber-500/60 resize-none"
                    placeholder="Generative prompt with camera, lighting, textures..."
                  />
                </div>

                {/* 5. Controls: Re-generate Clip & Extend Scene (+4s) */}
                <div className="pt-2 border-t border-zinc-850 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onRegenerateScene(scene.id)}
                    disabled={isRendering}
                    className="py-1.5 px-2 rounded-lg bg-[#141926] hover:bg-cyan-950/40 text-cyan-300 hover:text-cyan-200 border border-zinc-800 hover:border-cyan-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <RotateCcw className={`w-3 h-3 ${isRendering ? 'animate-spin' : ''}`} />
                    <span>Re-generate</span>
                  </button>

                  <button
                    onClick={() => onExtendScene(scene.id)}
                    className="py-1.5 px-2 rounded-lg bg-[#141926] hover:bg-amber-950/40 text-amber-300 hover:text-amber-200 border border-zinc-800 hover:border-amber-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Extend (+4s)</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Visual drop landing indicator between this scene and the next */}
            {renderDropIndicator(index + 1)}
          </React.Fragment>
          );
        })}

        {/* Append Scene Card & End of Timeline Drop Zone */}
        <div
          onClick={onAddScene}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedIndex !== null) setTargetDropSlot(scenes.length);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedIndex !== null) handleDropAtSlot(scenes.length);
          }}
          className={`w-[200px] h-[350px] shrink-0 rounded-xl border border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group ${
            targetDropSlot === scenes.length && draggedIndex !== null && draggedIndex !== scenes.length - 1
              ? 'border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-400 text-cyan-300 shadow-[0_0_25px_rgba(0,240,255,0.3)]'
              : 'border-zinc-800 hover:border-cyan-500/60 bg-[#090c14]/50 hover:bg-cyan-950/10 text-zinc-500 hover:text-cyan-300'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-zinc-900 group-hover:bg-cyan-500/20 border border-zinc-800 group-hover:border-cyan-500/40 flex items-center justify-center mb-2 transition-all">
            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs font-bold font-mono uppercase tracking-wider">
            + Append Scene
          </span>
          <span className="text-[10px] text-zinc-600 mt-1">Insert next camera shot</span>
        </div>
      </div>
    </div>
  );
};
