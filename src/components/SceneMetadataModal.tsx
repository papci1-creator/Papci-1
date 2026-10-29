import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Calendar,
  Aperture,
  Sliders,
  Film,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Info,
  Layers,
  ChevronRight,
  Clock,
  Compass,
  BookOpen,
  Sun,
  Crosshair,
  Bold,
  Italic,
  Underline,
  List,
  Plus,
  Trash2,
  Wand2,
  Volume2,
  Move,
} from 'lucide-react';
import {
  Scene,
  SceneMetadata,
  DirectorNotebookData,
  LightingReferenceItem,
  CameraFocusCue,
} from '../types';

interface SceneMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  scenes: Scene[];
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onBulkUpdateScenes?: (ids: string[], updates: Partial<Scene>) => void;
  onSelectScene?: (sceneId: string) => void;
}

const DEFAULT_DIRECTOR_NOTEBOOK: DirectorNotebookData = {
  richTextNotes:
    '<b>[BLOCKING]</b> Subject enters frame from lower-left catwalk shadow, pausing at the rain-slicked railing.<br/><b>[SUBTEXT]</b> Hesitation before activating the neural shard—eyes dart toward upper security gantry.<br/><b>[CAMERA MOTIVATION]</b> Slow push-in compresses background space as tension peaks.',
  blockingAndSubtext:
    'Hold eye-line 15° off-axis until the 3.2s mark, then turn directly toward key light.',
  audioFoleyCues:
    'Heavy rain hitting matte EVA visor, low 60Hz transformer hum, metallic boot step at 2.4s.',
  lightingNotes:
    '4:1 high-contrast cyan/magenta split lighting with wet asphalt specular bounce and volumetric steam.',
  lightingReferences: [
    {
      id: 'light-default-1',
      label: 'Overhead Cyan Neon Bank',
      setupType: 'Key Light',
      colorTemp: '6500K Cool',
      colorHex: '#00f0ff',
      ratioOrIntensity: '4:1 Key-to-Fill',
      referenceImageUrl:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      notes: 'Angled 45° camera-left through 1/2 grid diffusion cloth.',
    },
    {
      id: 'light-default-2',
      label: 'Magenta Hologram Edge Kicker',
      setupType: 'Rim / Back Light',
      colorTemp: '3200K Gel',
      colorHex: '#ff007f',
      ratioOrIntensity: '85% Specular Rim',
      referenceImageUrl:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      notes: 'Separates silhouette from wet dark megastructure background.',
    },
  ],
  cameraFocusCues: [
    {
      id: 'focus-default-1',
      timestampSec: 0.5,
      cueType: 'Shallow DOF Tracking',
      targetSubject: 'Raindrops on Foreground Rail',
      focalDistance: '0.65m',
      apertureMark: 'T1.5',
      notes: 'Background figure intentionally soft bokeh.',
    },
    {
      id: 'focus-default-2',
      timestampSec: 2.8,
      cueType: 'Rack Focus',
      targetSubject: 'Protagonist Eyes & Gold Visor',
      focalDistance: '1.85m',
      apertureMark: 'T1.5',
      notes: 'Snap focus pull on metallic footstep foley cue.',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

const LIGHTING_RIG_TEMPLATES: {
  name: string;
  lightingNotes: string;
  items: Omit<LightingReferenceItem, 'id'>[];
}[] = [
  {
    name: 'Cyberpunk Neon Rim & Key',
    lightingNotes: 'High-contrast 4:1 anamorphic neon key with wet specular floor reflections and magenta rim.',
    items: [
      {
        label: 'Cyan Neon Tube Array',
        setupType: 'Key Light',
        colorTemp: '6500K',
        colorHex: '#00f0ff',
        ratioOrIntensity: '4:1 Ratio (100%)',
        referenceImageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        notes: 'High side-key reflecting in visor and wet pavement.',
      },
      {
        label: 'Magenta Street Sign Kicker',
        setupType: 'Rim / Back Light',
        colorTemp: '3200K + Magenta',
        colorHex: '#ff007f',
        ratioOrIntensity: '80% Rim',
        referenceImageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
        notes: 'Back-right 135° angle cutting through rain mist.',
      },
    ],
  },
  {
    name: 'Rembrandt 8:1 Chiaroscuro',
    lightingNotes: 'Classic single-source tungsten key with heavy negative fill for dramatic facial shadow triangle.',
    items: [
      {
        label: 'Tungsten Fresnel Book-Light',
        setupType: 'Key Light',
        colorTemp: '3200K Tungsten',
        colorHex: '#f59e0b',
        ratioOrIntensity: '8:1 Dramatic Ratio',
        referenceImageUrl:
          'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80',
        notes: '45° elevation creating signature cheek light triangle.',
      },
      {
        label: '12x12 Floppy Negative Fill',
        setupType: 'Fill Light',
        colorTemp: 'N/A Absorb',
        colorHex: '#1e293b',
        ratioOrIntensity: '-3.0 Stops Shadow',
        notes: 'Placed close camera-right to crush ambient spill.',
      },
    ],
  },
  {
    name: 'Golden Hour Backlit Haze',
    lightingNotes: 'Warm low-angle directional sun backlight diffused through atmospheric haze.',
    items: [
      {
        label: '18K ARRIMAX Sun Backlight',
        setupType: 'Rim / Back Light',
        colorTemp: '2900K Warm Gold',
        colorHex: '#ffaa00',
        ratioOrIntensity: '100% Contre-Jour',
        referenceImageUrl:
          'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=600&q=80',
        notes: 'Direct lens flare streak across anamorphic front element.',
      },
      {
        label: 'Atmospheric DF-50 Haze',
        setupType: 'Volumetric / Haze',
        colorTemp: '4300K',
        colorHex: '#fcd34d',
        ratioOrIntensity: '35% Optical Density',
        notes: 'Catches god-rays and softens background contrast.',
      },
    ],
  },
];

const DEFAULT_METADATA: SceneMetadata = {
  shootingDate: new Date().toISOString().split('T')[0],
  lensFocalLength: '35mm Anamorphic',
  cameraAperture: 'T1.5',
  shutterSpeed: '1/48s (180°)',
  iso: 'ISO 800',
  cameraModel: 'ARRI Alexa 35',
  whiteBalance: '5600K',
  filter: 'ND 0.9 + 1/4 Black Pro-Mist',
  location: 'Stage B - Neo-Tokyo Catwalks',
  takeNumber: 1,
  rollNumber: 'A001',
  notes: 'Volumetric cyan/amber backlight, shallow depth of field',
  showOverlay: true,
  bloomIntensity: 35,
  filmGrain: 20,
  contrast: 105,
  saturation: 110,
  chromaticAberration: 15,
  vignetteIntensity: 45,
  directorNotebook: DEFAULT_DIRECTOR_NOTEBOOK,
};

const VFX_PRESETS = [
  {
    name: '35mm Kodak 5219',
    bloomIntensity: 30,
    filmGrain: 42,
    contrast: 112,
    saturation: 108,
    chromaticAberration: 10,
    vignetteIntensity: 48,
  },
  {
    name: 'Heavy Neon Halation',
    bloomIntensity: 82,
    filmGrain: 18,
    contrast: 118,
    saturation: 138,
    chromaticAberration: 38,
    vignetteIntensity: 55,
  },
  {
    name: 'Bleach Bypass Grit',
    bloomIntensity: 15,
    filmGrain: 68,
    contrast: 136,
    saturation: 45,
    chromaticAberration: 22,
    vignetteIntensity: 72,
  },
  {
    name: 'Clean IMAX Digital',
    bloomIntensity: 20,
    filmGrain: 4,
    contrast: 104,
    saturation: 105,
    chromaticAberration: 0,
    vignetteIntensity: 20,
  },
  {
    name: 'Cyber VHS Glitch',
    bloomIntensity: 64,
    filmGrain: 55,
    contrast: 122,
    saturation: 145,
    chromaticAberration: 85,
    vignetteIntensity: 60,
  },
];

const LENS_PRESETS = [
  '18mm Ultra-Wide',
  '24mm Wide Anamorphic',
  '35mm Anamorphic',
  '50mm High-Speed Prime',
  '85mm Portrait Prime',
  '105mm Macro Close-Up',
  '135mm Telephoto',
];

const APERTURE_PRESETS = [
  'T1.3',
  'T1.5',
  'T2.0',
  'f/1.8',
  'f/2.8',
  'f/4.0',
  'f/5.6',
  'f/8.0',
];

const CAMERA_PRESETS = [
  'ARRI Alexa 35',
  'ARRI Alexa Mini LF',
  'RED V-Raptor 8K',
  'Sony Venice 2',
  'Blackmagic URSA 12K',
  'IMAX 65mm Cine',
];

const ISO_PRESETS = ['ISO 200', 'ISO 400', 'ISO 800', 'ISO 1600', 'ISO 3200', 'ISO 6400'];

const SHUTTER_PRESETS = ['1/48s (180°)', '1/96s (90°)', '1/120s', '1/24s (360°)'];

const QUICK_LOOK_PACKS = [
  {
    name: 'Cyberpunk Neon Anamorphic',
    lens: '35mm Anamorphic',
    aperture: 'T1.5',
    iso: 'ISO 1600',
    camera: 'ARRI Alexa 35',
    shutter: '1/48s (180°)',
    filter: '1/4 Black Pro-Mist',
    wb: '5600K',
  },
  {
    name: 'Intimate Character Portrait',
    lens: '85mm Portrait Prime',
    aperture: 'T1.3',
    iso: 'ISO 800',
    camera: 'Sony Venice 2',
    shutter: '1/48s (180°)',
    filter: 'Warm Bronze 1/8',
    wb: '4300K',
  },
  {
    name: 'High-Speed Action Drone',
    lens: '18mm Ultra-Wide',
    aperture: 'f/2.8',
    iso: 'ISO 400',
    camera: 'RED V-Raptor 8K',
    shutter: '1/96s (90°)',
    filter: 'ND 1.2 Polarizer',
    wb: '5600K',
  },
  {
    name: 'Noir Low-Key Drama',
    lens: '50mm High-Speed Prime',
    aperture: 'T2.0',
    iso: 'ISO 800',
    camera: 'Blackmagic URSA 12K',
    shutter: '1/48s (180°)',
    filter: 'Circular Polarizer',
    wb: '3200K',
  },
];

export const SceneMetadataModal: React.FC<SceneMetadataModalProps> = ({
  isOpen,
  onClose,
  scene,
  scenes,
  onUpdateScene,
  onBulkUpdateScenes,
  onSelectScene,
}) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(scene?.id || scenes[0]?.id || '');
  const activeScene = scenes.find((s) => s.id === selectedSceneId) || scene || scenes[0];

  const [formData, setFormData] = useState<SceneMetadata>(() => {
    return activeScene?.metadata || {
      ...DEFAULT_METADATA,
      location: activeScene?.sceneLocation || DEFAULT_METADATA.location,
    };
  });

  const [notebookData, setNotebookData] = useState<DirectorNotebookData>(() => {
    return (
      activeScene?.directorNotebook ||
      activeScene?.metadata?.directorNotebook ||
      DEFAULT_DIRECTOR_NOTEBOOK
    );
  });

  const [activeNotebookTab, setActiveNotebookTab] = useState<'notes' | 'lighting' | 'focus'>('notes');
  const richEditorRef = useRef<HTMLDivElement>(null);

  // New Lighting Reference Form State
  const [newLightLabel, setNewLightLabel] = useState('45° Soft Key Light');
  const [newLightType, setNewLightType] = useState<LightingReferenceItem['setupType']>('Key Light');
  const [newLightTemp, setNewLightTemp] = useState('5600K');
  const [newLightHex, setNewLightHex] = useState('#00f0ff');
  const [newLightRatio, setNewLightRatio] = useState('4:1 Key-to-Fill');
  const [newLightUrl, setNewLightUrl] = useState('');
  const [newLightNotes, setNewLightNotes] = useState('Soft grid diffusion angled toward subject eye-line.');

  // New Camera Focus Cue Form State
  const [newCueTime, setNewCueTime] = useState<number>(1.5);
  const [newCueType, setNewCueType] = useState<CameraFocusCue['cueType']>('Rack Focus');
  const [newCueTarget, setNewCueTarget] = useState('Protagonist Eyes');
  const [newCueDistance, setNewCueDistance] = useState('1.4m');
  const [newCueAperture, setNewCueAperture] = useState('T1.5');
  const [newCueNotes, setNewCueNotes] = useState('Smooth 0.6s pull on dialogue beat.');

  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);
  const [liveSyncToPlayer, setLiveSyncToPlayer] = useState<boolean>(true);

  // Sync form and notebook when active scene changes
  useEffect(() => {
    if (activeScene) {
      const nextNotebook =
        activeScene.directorNotebook ||
        activeScene.metadata?.directorNotebook ||
        DEFAULT_DIRECTOR_NOTEBOOK;
      setFormData({
        ...DEFAULT_METADATA,
        location: activeScene.sceneLocation || DEFAULT_METADATA.location,
        ...(activeScene.metadata || {}),
        directorNotebook: nextNotebook,
      });
      setNotebookData(nextNotebook);
      if (richEditorRef.current) {
        richEditorRef.current.innerHTML = nextNotebook.richTextNotes || '';
      }
    }
  }, [activeScene?.id]);

  // Keep richEditorRef initialized when switching back to the 'notes' tab
  useEffect(() => {
    if (activeNotebookTab === 'notes' && richEditorRef.current) {
      if (richEditorRef.current.innerHTML !== (notebookData.richTextNotes || '')) {
        richEditorRef.current.innerHTML = notebookData.richTextNotes || '';
      }
    }
  }, [activeNotebookTab]);

  useEffect(() => {
    if (scene && scene.id !== selectedSceneId) {
      setSelectedSceneId(scene.id);
    }
  }, [scene?.id]);

  if (!isOpen || !activeScene) return null;

  const persistNotebookUpdate = (nextNotebook: DirectorNotebookData, notifyMsg?: string) => {
    const stamped: DirectorNotebookData = {
      ...nextNotebook,
      lastUpdated: new Date().toISOString(),
    };
    setNotebookData(stamped);
    const nextMeta: SceneMetadata = {
      ...formData,
      directorNotebook: stamped,
    };
    setFormData(nextMeta);
    onUpdateScene(activeScene.id, {
      directorNotebook: stamped,
      metadata: nextMeta,
    });
    if (notifyMsg) {
      setAppliedNotification(notifyMsg);
      setTimeout(() => setAppliedNotification(null), 2300);
    }
  };

  const handleExecFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (richEditorRef.current) {
      persistNotebookUpdate({
        ...notebookData,
        richTextNotes: richEditorRef.current.innerHTML,
      });
    }
  };

  const handleInsertDirectorStamp = (stampTag: string, defaultPrompt: string) => {
    const snippet = `<br/><b>[${stampTag}]</b> ${defaultPrompt}`;
    const updatedHtml = (notebookData.richTextNotes || '') + snippet;
    if (richEditorRef.current) {
      richEditorRef.current.innerHTML = updatedHtml;
    }
    persistNotebookUpdate(
      {
        ...notebookData,
        richTextNotes: updatedHtml,
      },
      `Inserted [${stampTag}] cue into Scene #${activeScene.sceneNumber} Notebook`
    );
  };

  const handleApplyLightingTemplate = (template: (typeof LIGHTING_RIG_TEMPLATES)[0]) => {
    const itemsWithIds: LightingReferenceItem[] = template.items.map((item, idx) => ({
      ...item,
      id: `light-${Date.now()}-${idx}`,
    }));
    persistNotebookUpdate(
      {
        ...notebookData,
        lightingNotes: template.lightingNotes,
        lightingReferences: itemsWithIds,
      },
      `Applied "${template.name}" lighting rig to Scene #${activeScene.sceneNumber}`
    );
  };

  const handleAddLightingReference = () => {
    if (!newLightLabel.trim()) return;
    const item: LightingReferenceItem = {
      id: `light-${Date.now()}`,
      label: newLightLabel.trim(),
      setupType: newLightType,
      colorTemp: newLightTemp.trim() || '5600K',
      colorHex: newLightHex || '#00f0ff',
      ratioOrIntensity: newLightRatio.trim() || '4:1 Ratio',
      referenceImageUrl: newLightUrl.trim() || undefined,
      notes: newLightNotes.trim(),
    };
    persistNotebookUpdate(
      {
        ...notebookData,
        lightingReferences: [...notebookData.lightingReferences, item],
      },
      `Added "${item.label}" (${item.setupType}) to Scene #${activeScene.sceneNumber}`
    );
    setNewLightLabel('');
    setNewLightUrl('');
  };

  const handleRemoveLightingReference = (id: string) => {
    persistNotebookUpdate(
      {
        ...notebookData,
        lightingReferences: notebookData.lightingReferences.filter((l) => l.id !== id),
      },
      `Removed lighting reference from Scene #${activeScene.sceneNumber}`
    );
  };

  const handleAddCameraFocusCue = () => {
    if (!newCueTarget.trim()) return;
    const clampedTime = Math.max(0, Math.min(activeScene.duration, Number(newCueTime) || 0));
    const newCue: CameraFocusCue = {
      id: `focus-${Date.now()}`,
      timestampSec: Number(clampedTime.toFixed(1)),
      cueType: newCueType,
      targetSubject: newCueTarget.trim(),
      focalDistance: newCueDistance.trim() || '1.5m',
      apertureMark: newCueAperture.trim() || formData.cameraAperture || 'T1.5',
      notes: newCueNotes.trim() || undefined,
    };
    const nextCues = [...notebookData.cameraFocusCues, newCue].sort(
      (a, b) => a.timestampSec - b.timestampSec
    );
    persistNotebookUpdate(
      {
        ...notebookData,
        cameraFocusCues: nextCues,
      },
      `Added ${newCue.cueType} @ ${newCue.timestampSec}s -> ${newCue.targetSubject}`
    );
    setNewCueTarget('');
  };

  const handleRemoveCameraFocusCue = (id: string) => {
    persistNotebookUpdate(
      {
        ...notebookData,
        cameraFocusCues: notebookData.cameraFocusCues.filter((c) => c.id !== id),
      },
      `Removed focus cue from Scene #${activeScene.sceneNumber}`
    );
  };

  const handleSyncNotebookToPrompt = () => {
    const lightSummary = notebookData.lightingReferences
      .map((l) => `${l.setupType}: ${l.label} (${l.colorTemp}, ${l.ratioOrIntensity})`)
      .join('; ');
    const focusSummary = notebookData.cameraFocusCues
      .map((c) => `${c.cueType} at ${c.timestampSec}s on ${c.targetSubject} (${c.focalDistance})`)
      .join('; ');
    const plainNotes = (notebookData.richTextNotes || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const directorBlock = `[DIRECTOR NOTEBOOK — LIGHTING: ${lightSummary || notebookData.lightingNotes || 'Anamorphic Contrast'} | FOCUS CUES: ${focusSummary || 'Locked Focus'} | BLOCKING: ${notebookData.blockingAndSubtext || plainNotes.slice(0, 120)}]`;
    const cleanExisting = activeScene.videoPrompt.replace(/\[DIRECTOR NOTEBOOK[^\]]*\]\s*/g, '');
    const updatedPrompt = `${cleanExisting} ${directorBlock}`.trim();

    onUpdateScene(activeScene.id, {
      videoPrompt: updatedPrompt,
      directorNotebook: notebookData,
      metadata: { ...formData, directorNotebook: notebookData },
    });
    setAppliedNotification(`Synced Director's Notebook lighting & focus cues into Scene #${activeScene.sceneNumber} AI Prompt`);
    setTimeout(() => setAppliedNotification(null), 2600);
  };

  const handleChange = (field: keyof SceneMetadata, value: any) => {
    const nextMeta = { ...formData, [field]: value, directorNotebook: notebookData };
    setFormData(nextMeta);
    if (liveSyncToPlayer) {
      onUpdateScene(activeScene.id, {
        directorNotebook: notebookData,
        metadata: nextMeta,
      });
    }
  };

  const handleApplyVfxPreset = (preset: (typeof VFX_PRESETS)[0]) => {
    const nextMeta: SceneMetadata = {
      ...formData,
      bloomIntensity: preset.bloomIntensity,
      filmGrain: preset.filmGrain,
      contrast: preset.contrast,
      saturation: preset.saturation,
      chromaticAberration: preset.chromaticAberration,
      vignetteIntensity: preset.vignetteIntensity,
      directorNotebook: notebookData,
    };
    setFormData(nextMeta);
    if (liveSyncToPlayer) {
      onUpdateScene(activeScene.id, { metadata: nextMeta, directorNotebook: notebookData });
    }
    setAppliedNotification(`Applied "${preset.name}" VFX profile to Scene #${activeScene.sceneNumber}`);
    setTimeout(() => setAppliedNotification(null), 2200);
  };

  const handleResetVfxSliders = () => {
    const nextMeta: SceneMetadata = {
      ...formData,
      bloomIntensity: 35,
      filmGrain: 20,
      contrast: 105,
      saturation: 110,
      chromaticAberration: 15,
      vignetteIntensity: 45,
      directorNotebook: notebookData,
    };
    setFormData(nextMeta);
    if (liveSyncToPlayer) {
      onUpdateScene(activeScene.id, { metadata: nextMeta, directorNotebook: notebookData });
    }
  };

  const handleSaveCurrent = () => {
    const syncedMeta: SceneMetadata = {
      ...formData,
      directorNotebook: notebookData,
    };
    onUpdateScene(activeScene.id, {
      directorNotebook: notebookData,
      metadata: syncedMeta,
    });
    setAppliedNotification(
      `Saved Metadata, VFX & Director's Notebook to Scene #${activeScene.sceneNumber}`
    );
    setTimeout(() => setAppliedNotification(null), 2500);
  };

  const handleApplyToAllScenes = () => {
    const syncedMeta: SceneMetadata = {
      ...formData,
      directorNotebook: notebookData,
    };
    if (onBulkUpdateScenes) {
      onBulkUpdateScenes(
        scenes.map((s) => s.id),
        { directorNotebook: { ...notebookData }, metadata: { ...syncedMeta } }
      );
    } else {
      scenes.forEach((s) => {
        onUpdateScene(s.id, {
          directorNotebook: { ...notebookData },
          metadata: { ...syncedMeta },
        });
      });
    }
    setAppliedNotification(
      `Applied Metadata, VFX & Director's Notebook across all ${scenes.length} scenes`
    );
    setTimeout(() => setAppliedNotification(null), 2500);
  };

  const handleApplyQuickPack = (pack: typeof QUICK_LOOK_PACKS[0]) => {
    const nextMeta: SceneMetadata = {
      ...formData,
      lensFocalLength: pack.lens,
      cameraAperture: pack.aperture,
      iso: pack.iso,
      cameraModel: pack.camera,
      shutterSpeed: pack.shutter,
      filter: pack.filter,
      whiteBalance: pack.wb,
      directorNotebook: notebookData,
    };
    setFormData(nextMeta);
    if (liveSyncToPlayer) {
      onUpdateScene(activeScene.id, { metadata: nextMeta, directorNotebook: notebookData });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#090b14] border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Top Header Bar */}
        <div className="px-5 py-4 border-b border-zinc-800/80 bg-[#0d101d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <span>Scene Production Metadata Slate</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                    Camera & Optical Rig
                  </span>
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Attach professional camera lens, focal length, aperture, and shooting date specs to display as a cinematic HUD overlay on the video player.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scene Switcher Selector Tabs */}
        <div className="px-5 py-2.5 bg-[#070910] border-b border-zinc-800/70 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Scene:</span>
          </span>
          {scenes.map((s, idx) => {
            const isSelected = s.id === activeScene.id;
            const hasMeta = !!s.metadata?.lensFocalLength;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSceneId(s.id);
                  if (onSelectScene) onSelectScene(s.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="font-bold">Scene #{idx + 1}</span>
                <span className="text-[10px] opacity-70 truncate max-w-[90px]">{s.title}</span>
                {hasMeta && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Has attached metadata" />}
              </button>
            );
          })}
        </div>

        {/* Quick Style / Rig Preset Profiles */}
        <div className="px-5 py-2 bg-[#0c0f1c] border-b border-zinc-800/60 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Optical Presets:</span>
          </span>
          {QUICK_LOOK_PACKS.map((pack) => (
            <button
              key={pack.name}
              onClick={() => handleApplyQuickPack(pack)}
              className="px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <span>{pack.name}</span>
              <span className="text-[10px] text-cyan-400/80 font-mono">({pack.lens} • {pack.aperture})</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">

          {/* Top Live Video HUD Slate Preview Box */}
          <div className="bg-[#06080e] rounded-xl border border-cyan-500/30 p-3.5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5 tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                <span>Live Slate Overlay Preview (As rendered on video)</span>
              </span>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showOverlay !== false}
                  onChange={(e) => handleChange('showOverlay', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-400 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px]">Show Overlay on Player</span>
              </label>
            </div>

            {/* Preview HUD Slate Card */}
            <div className="bg-[#0b0e18]/90 backdrop-blur-md rounded-lg p-3 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-inner">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>SLATE #{activeScene.sceneNumber}</span>
                </div>
                <span className="text-zinc-600">|</span>
                <div className="flex items-center gap-1 text-zinc-200">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-white">{formData.shootingDate || '2026-10-12'}</span>
                </div>
                <span className="text-zinc-600">|</span>
                <div className="flex items-center gap-1 text-cyan-300">
                  <Aperture className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-cyan-200">{formData.lensFocalLength || '35mm Anamorphic'}</span>
                  <span className="px-1.5 py-0.2 text-[10px] bg-cyan-950/80 border border-cyan-500/40 rounded text-cyan-300 font-bold">
                    {formData.cameraAperture || 'T1.5'}
                  </span>
                </div>
                {formData.iso && (
                  <>
                    <span className="text-zinc-600">|</span>
                    <span className="text-amber-300 text-[11px]">{formData.iso}</span>
                  </>
                )}
                {formData.shutterSpeed && (
                  <>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-300 text-[11px]">{formData.shutterSpeed}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  BLOOM {formData.bloomIntensity ?? 35}% • GRAIN {formData.filmGrain ?? 20}% • CONT {formData.contrast ?? 105}%
                </span>
                <span className="text-zinc-500 font-semibold">{formData.cameraModel || 'ARRI Alexa 35'}</span>
                {formData.rollNumber && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px]">
                    ROLL: {formData.rollNumber} • TK: {formData.takeNumber || 1}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visual Effect Intensity & Color Grading Rack (Per-Clip Fine-Tuning) */}
          <div className="bg-[#0b0e19] p-4 rounded-xl border border-amber-500/30 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <span>Visual Effect Intensity & Color Grading Rack</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Per-Clip Fine-Tuning
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Dial in optical bloom halation, 35mm film grain, tonal contrast, saturation, and lens chromatic aberration for Scene #{activeScene.sceneNumber}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium cursor-pointer bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <input
                    type="checkbox"
                    checked={liveSyncToPlayer}
                    onChange={(e) => setLiveSyncToPlayer(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-emerald-400 focus:ring-0 cursor-pointer"
                  />
                  <span>Live Sync to Canvas</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetVfxSliders}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Reset all visual effect sliders to default calibration"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset FX</span>
                </button>
              </div>
            </div>

            {/* Quick VFX Look Presets Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase text-zinc-400 mr-1">FX Grade Presets:</span>
              {VFX_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyVfxPreset(preset)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#121626] hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 transition-colors cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Interactive Live Optical Swatch + 6 Intensity Sliders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              {/* Left 1/3: Live Optical & VFX Frame Monitor Swatch */}
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-[#05070d] min-h-[175px] flex flex-col justify-between p-3 select-none">
                {/* Background image or procedural gradient with live CSS filter */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-75"
                  style={{
                    backgroundImage: activeScene.backgroundImage
                      ? `url(${activeScene.backgroundImage})`
                      : 'radial-gradient(circle at 35% 35%, rgba(0,240,255,0.45), rgba(15,12,36,0.95) 70%)',
                    filter: `contrast(${formData.contrast ?? 105}%) saturate(${formData.saturation ?? 110}%) brightness(${Math.round(
                      100 + ((formData.bloomIntensity ?? 35) - 35) * 0.2
                    )}%)`,
                  }}
                />
                {/* Optical Bloom Halation Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 42%, rgba(0, 240, 255, 0.55), rgba(255, 170, 0, 0.25) 45%, transparent 75%)',
                    mixBlendMode: 'screen',
                    opacity: ((formData.bloomIntensity ?? 35) / 100) * 0.85,
                  }}
                />
                {/* Chromatic Aberration Edge Fringing */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: `inset ${Math.round(((formData.chromaticAberration ?? 15) / 100) * 18)}px 0 ${Math.round(
                      ((formData.chromaticAberration ?? 15) / 100) * 24
                    )}px rgba(0, 240, 255, ${((formData.chromaticAberration ?? 15) / 100) * 0.55}), inset -${Math.round(
                      ((formData.chromaticAberration ?? 15) / 100) * 18
                    )}px 0 ${Math.round(((formData.chromaticAberration ?? 15) / 100) * 24)}px rgba(255, 0, 128, ${
                      ((formData.chromaticAberration ?? 15) / 100) * 0.55
                    })`,
                  }}
                />
                {/* Film Grain Noise Pattern Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-radial-gradient(circle at 17% 32%, rgba(255,255,255,0.22) 0, rgba(0,0,0,0.28) 1px, transparent 2px)',
                    opacity: ((formData.filmGrain ?? 20) / 100) * 0.75,
                  }}
                />
                {/* Vignette Falloff Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, transparent ${Math.max(
                      18,
                      58 - (formData.vignetteIntensity ?? 45) * 0.35
                    )}%, rgba(0,0,0,${Math.min(0.95, ((formData.vignetteIntensity ?? 45) / 100) * 1.15)}) 100%)`,
                  }}
                />

                {/* Top Swatch Badge */}
                <div className="relative z-10 flex items-center justify-between text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-black/75 text-cyan-300 border border-cyan-500/30 font-bold">
                    SCENE #{activeScene.sceneNumber} GRADE MONITOR
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/75 text-amber-300 border border-amber-500/30">
                    {formData.lensFocalLength || '35mm'}
                  </span>
                </div>

                {/* Bottom Swatch Telemetry */}
                <div className="relative z-10 bg-black/75 backdrop-blur-sm rounded-lg p-2 border border-zinc-800/90 text-[10px] font-mono text-zinc-300 flex items-center justify-between">
                  <span>BLOOM: {formData.bloomIntensity ?? 35}%</span>
                  <span>GRAIN: {formData.filmGrain ?? 20}%</span>
                  <span>CONT: {formData.contrast ?? 105}%</span>
                </div>
              </div>

              {/* Right 2/3: 6 Precision Sliders Grid */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#080a12] p-3.5 rounded-xl border border-zinc-800/80">
                {/* 1. Optical Bloom & Halation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Optical Bloom & Glow</span>
                    </span>
                    <span className="font-mono text-cyan-300 font-bold text-[11px]">
                      {formData.bloomIntensity ?? 35}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.bloomIntensity ?? 35}
                    onChange={(e) => handleChange('bloomIntensity', parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>0% Crisp</span>
                    <span>50% Pro-Mist</span>
                    <span>100% Dreamy Halation</span>
                  </div>
                </div>

                {/* 2. 35mm Film Grain */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>35mm Film Grain</span>
                    </span>
                    <span className="font-mono text-amber-300 font-bold text-[11px]">
                      {formData.filmGrain ?? 20}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.filmGrain ?? 20}
                    onChange={(e) => handleChange('filmGrain', parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>0% Clean Sensor</span>
                    <span>35% Kodak 5219</span>
                    <span>100% 16mm Grit</span>
                  </div>
                </div>

                {/* 3. Tonal Contrast */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Tonal Contrast</span>
                    </span>
                    <span className="font-mono text-emerald-300 font-bold text-[11px]">
                      {formData.contrast ?? 105}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={formData.contrast ?? 105}
                    onChange={(e) => handleChange('contrast', parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>50% Log Flat</span>
                    <span>100% Neutral</span>
                    <span>150% Crushed Noir</span>
                  </div>
                </div>

                {/* 4. Color Saturation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
                      <span>Chroma Saturation</span>
                    </span>
                    <span className="font-mono text-fuchsia-300 font-bold text-[11px]">
                      {formData.saturation ?? 110}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={formData.saturation ?? 110}
                    onChange={(e) => handleChange('saturation', parseInt(e.target.value, 10))}
                    className="w-full accent-fuchsia-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>0% Monochrome</span>
                    <span>100% Rec.709</span>
                    <span>200% Neon Vivid</span>
                  </div>
                </div>

                {/* 5. Chromatic Aberration */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>Chromatic Aberration</span>
                    </span>
                    <span className="font-mono text-rose-300 font-bold text-[11px]">
                      {formData.chromaticAberration ?? 15}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.chromaticAberration ?? 15}
                    onChange={(e) => handleChange('chromaticAberration', parseInt(e.target.value, 10))}
                    className="w-full accent-rose-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>0% Apochromatic</span>
                    <span>35% Vintage Anamorphic</span>
                    <span>100% RGB Split</span>
                  </div>
                </div>

                {/* 6. Anamorphic Vignette Falloff */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span>Optical Vignette</span>
                    </span>
                    <span className="font-mono text-indigo-300 font-bold text-[11px]">
                      {formData.vignetteIntensity ?? 45}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.vignetteIntensity ?? 45}
                    onChange={(e) => handleChange('vignetteIntensity', parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>0% Open Gate</span>
                    <span>45% Standard</span>
                    <span>100% Pinhole Barrel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Grid Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Column 1: Core Optical Specs (Focal Length, Aperture, Date) */}
            <div className="bg-[#0b0e19] p-4 rounded-xl border border-zinc-800/80 space-y-4">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Primary Optics & Shooting Date</span>
              </h4>

              {/* Shooting Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Shooting Date</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleChange('shootingDate', new Date().toISOString().split('T')[0])}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Set Today
                  </button>
                </div>
                <input
                  type="date"
                  value={formData.shootingDate}
                  onChange={(e) => handleChange('shootingDate', e.target.value)}
                  className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Lens Focal Length */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                  <Aperture className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Lens Focal Length</span>
                </label>
                <input
                  type="text"
                  value={formData.lensFocalLength}
                  onChange={(e) => handleChange('lensFocalLength', e.target.value)}
                  placeholder="e.g. 35mm Anamorphic, 50mm Prime, 85mm T1.3"
                  className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
                {/* Quick preset chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {LENS_PRESETS.map((lens) => (
                    <button
                      key={lens}
                      type="button"
                      onClick={() => handleChange('lensFocalLength', lens)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        formData.lensFocalLength === lens
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {lens}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Aperture */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Camera Aperture (f-stop / T-stop)</span>
                </label>
                <input
                  type="text"
                  value={formData.cameraAperture}
                  onChange={(e) => handleChange('cameraAperture', e.target.value)}
                  placeholder="e.g. T1.5, f/1.8, f/2.8"
                  className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
                {/* Quick aperture chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {APERTURE_PRESETS.map((ap) => (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => handleChange('cameraAperture', ap)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer font-mono ${
                        formData.cameraAperture === ap
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {ap}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Model */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Camera Body / Sensor</span>
                </label>
                <select
                  value={formData.cameraModel || CAMERA_PRESETS[0]}
                  onChange={(e) => handleChange('cameraModel', e.target.value)}
                  className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {CAMERA_PRESETS.map((cam) => (
                    <option key={cam} value={cam}>
                      {cam}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 2: Cinematography Exposure & Production Slate */}
            <div className="bg-[#0b0e19] p-4 rounded-xl border border-zinc-800/80 space-y-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Exposure, Slate & Production Environment</span>
              </h4>

              {/* Shutter Speed & ISO row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">Shutter Speed / Angle</label>
                  <select
                    value={formData.shutterSpeed || SHUTTER_PRESETS[0]}
                    onChange={(e) => handleChange('shutterSpeed', e.target.value)}
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
                  >
                    {SHUTTER_PRESETS.map((sh) => (
                      <option key={sh} value={sh}>
                        {sh}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">ISO Sensitivity</label>
                  <select
                    value={formData.iso || ISO_PRESETS[2]}
                    onChange={(e) => handleChange('iso', e.target.value)}
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
                  >
                    {ISO_PRESETS.map((iso) => (
                      <option key={iso} value={iso}>
                        {iso}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* White Balance & Filter */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">White Balance</label>
                  <input
                    type="text"
                    value={formData.whiteBalance || '5600K'}
                    onChange={(e) => handleChange('whiteBalance', e.target.value)}
                    placeholder="e.g. 5600K Daylight, 3200K Tungsten"
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">Matte Filter / Diffusion</label>
                  <input
                    type="text"
                    value={formData.filter || 'ND 0.9'}
                    onChange={(e) => handleChange('filter', e.target.value)}
                    placeholder="e.g. 1/4 Black Pro-Mist, ND 0.9"
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Location & Take Number */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">Stage / Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g. Stage B - Catwalks"
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium text-xs">Take #</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={formData.takeNumber || 1}
                    onChange={(e) => handleChange('takeNumber', parseInt(e.target.value) || 1)}
                    className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Director & Cinematographer Notes */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs">Director & DP Optical Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="e.g. Keep highlights rolling off smoothly into shadow, sharp focus on actor eyes..."
                  className="w-full bg-[#121626] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* PRODUCTION DIRECTOR'S NOTEBOOK (Rich-Text Notes, Lighting & Focus Cues) */}
          {/* ===================================================================== */}
          <div className="bg-gradient-to-br from-[#0b0f1d] via-[#090d18] to-[#0f1324] rounded-xl border border-emerald-500/35 p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Production Director&apos;s Notebook
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Scene #{activeScene.sceneNumber} Persistent Binder
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Attach rich-text blocking &amp; subtext notes, lighting rig diagrams, and timestamped camera focus pulls directly to this scene object.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncNotebookToPrompt}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Inject lighting setup, focus pulls, and blocking notes into this scene's AI Video Prompt"
              >
                <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sync Notebook to AI Video Prompt</span>
              </button>
            </div>

            {/* Sub-Navigation Tabs for Director's Notebook */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveNotebookTab('notes')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  activeNotebookTab === 'notes'
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-sm'
                    : 'bg-[#101424] text-zinc-400 hover:text-zinc-200 border-zinc-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Rich-Text Production Notes &amp; Blocking</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNotebookTab('lighting')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  activeNotebookTab === 'lighting'
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm'
                    : 'bg-[#101424] text-zinc-400 hover:text-zinc-200 border-zinc-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Lighting References &amp; Rig ({notebookData.lightingReferences.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNotebookTab('focus')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  activeNotebookTab === 'focus'
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-sm'
                    : 'bg-[#101424] text-zinc-400 hover:text-zinc-200 border-zinc-800'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Camera Focus Cues &amp; Pulls ({notebookData.cameraFocusCues.length})</span>
              </button>
            </div>

            {/* TAB 1: RICH-TEXT PRODUCTION NOTES & BLOCKING */}
            {activeNotebookTab === 'notes' && (
              <div className="space-y-3 bg-[#070a14] p-3.5 rounded-xl border border-zinc-800/90">
                {/* Rich-Text Formatting Toolbar + Quick Director Tag Stamps */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleExecFormat('bold')}
                      className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer"
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExecFormat('italic')}
                      className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExecFormat('underline')}
                      className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer"
                      title="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExecFormat('insertUnorderedList')}
                      className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer"
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Director Tag Stamps */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Insert Cue Stamp:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertDirectorStamp(
                          'BLOCKING',
                          'Actor crosses from shadow mark A to foreground key light on beat 2.'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer"
                    >
                      + [BLOCKING]
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertDirectorStamp(
                          'SUBTEXT',
                          'Micro-expression of guarded resolve before delivering spoken line.'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 cursor-pointer"
                    >
                      + [SUBTEXT]
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertDirectorStamp(
                          'CAMERA MOTIVATION',
                          'Push-in initiates strictly on subject head-turn to heighten urgency.'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer"
                    >
                      + [CAMERA MOTIVATION]
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertDirectorStamp(
                          'DIEGETIC FOLEY',
                          'Sharp metallic servo click + heavy rain splatter on anamorphic matte box.'
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 cursor-pointer"
                    >
                      + [DIEGETIC FOLEY]
                    </button>
                  </div>
                </div>

                {/* ContentEditable Rich-Text Canvas */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-emerald-300 flex items-center justify-between">
                    <span>Formatted Director&apos;s Script &amp; Shot Execution Notes (Rich-Text HTML)</span>
                    <span className="text-[10px] font-mono text-zinc-500">Auto-persisted to scene.directorNotebook</span>
                  </label>
                  <div
                    ref={richEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const html = (e.currentTarget as HTMLDivElement).innerHTML;
                      persistNotebookUpdate({
                        ...notebookData,
                        richTextNotes: html,
                      });
                    }}
                    className="min-h-[105px] max-h-[190px] overflow-y-auto w-full bg-[#101424] border border-zinc-800 focus:border-emerald-400 rounded-lg p-3 text-xs text-zinc-100 leading-relaxed focus:outline-none"
                  />
                </div>

                {/* Structured Blocking/Subtext & Diegetic Audio/Foley Cues */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-300 font-medium flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Actor Blocking &amp; Eye-Line Subtext</span>
                    </label>
                    <input
                      type="text"
                      value={notebookData.blockingAndSubtext}
                      onChange={(e) =>
                        persistNotebookUpdate({
                          ...notebookData,
                          blockingAndSubtext: e.target.value,
                        })
                      }
                      placeholder="e.g. Hold eye-line 15° off-axis until 3.2s mark..."
                      className="w-full bg-[#101424] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-300 font-medium flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Diegetic Foley &amp; Sound Design Cues</span>
                    </label>
                    <input
                      type="text"
                      value={notebookData.audioFoleyCues}
                      onChange={(e) =>
                        persistNotebookUpdate({
                          ...notebookData,
                          audioFoleyCues: e.target.value,
                        })
                      }
                      placeholder="e.g. Rain hitting visor, low 60Hz hum, boot step at 2.4s..."
                      className="w-full bg-[#101424] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIGHTING REFERENCES & RIG MANAGER */}
            {activeNotebookTab === 'lighting' && (
              <div className="space-y-3.5 bg-[#070a14] p-3.5 rounded-xl border border-zinc-800/90">
                {/* Quick Lighting Rig Templates */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-800/80">
                  <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gaffer Lighting Rig Templates:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {LIGHTING_RIG_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={() => handleApplyLightingTemplate(tpl)}
                        className="px-2.5 py-1 rounded-md text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/30 transition-colors cursor-pointer"
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overall Lighting Ratio & Atmosphere Summary */}
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-300 font-medium">
                    Master Lighting Ratio, LUT Motivation &amp; Atmosphere Notes
                  </label>
                  <input
                    type="text"
                    value={notebookData.lightingNotes}
                    onChange={(e) =>
                      persistNotebookUpdate({
                        ...notebookData,
                        lightingNotes: e.target.value,
                      })
                    }
                    placeholder="e.g. 4:1 high-contrast cyan/magenta split lighting with wet asphalt specular bounce..."
                    className="w-full bg-[#101424] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Active Lighting References Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {notebookData.lightingReferences.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#101424] border border-zinc-800 rounded-xl p-3 flex gap-3 items-start justify-between"
                    >
                      <div className="flex gap-3 items-start min-w-0">
                        {item.referenceImageUrl ? (
                          <img
                            src={item.referenceImageUrl}
                            alt={item.label}
                            className="w-14 h-14 rounded-lg object-cover border border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div
                            className="w-14 h-14 rounded-lg border border-zinc-700 shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: `${item.colorHex}22` }}
                          >
                            <Sun className="w-5 h-5" style={{ color: item.colorHex }} />
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/30"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <span className="text-xs font-bold text-white truncate">{item.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {item.setupType}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-cyan-300">
                            {item.colorTemp} • {item.ratioOrIntensity}
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2">{item.notes}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLightingReference(item.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                        title="Remove lighting reference"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Lighting Reference Builder */}
                <div className="bg-[#0c1020] border border-zinc-800/90 rounded-xl p-3 space-y-2.5">
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Lighting Reference Unit</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <input
                      type="text"
                      value={newLightLabel}
                      onChange={(e) => setNewLightLabel(e.target.value)}
                      placeholder="Fixture / Light Label"
                      className="col-span-2 bg-[#12172a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <select
                      value={newLightType}
                      onChange={(e) =>
                        setNewLightType(e.target.value as LightingReferenceItem['setupType'])
                      }
                      className="bg-[#12172a] border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Key Light">Key Light</option>
                      <option value="Fill Light">Fill Light</option>
                      <option value="Rim / Back Light">Rim / Back Light</option>
                      <option value="Practical">Practical</option>
                      <option value="Volumetric / Haze">Volumetric / Haze</option>
                    </select>
                    <input
                      type="text"
                      value={newLightTemp}
                      onChange={(e) => setNewLightTemp(e.target.value)}
                      placeholder="5600K"
                      className="bg-[#12172a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={newLightHex}
                        onChange={(e) => setNewLightHex(e.target.value)}
                        className="w-8 h-8 rounded bg-transparent border border-zinc-700 cursor-pointer shrink-0"
                        title="Gel / Light Color Swatch"
                      />
                      <input
                        type="text"
                        value={newLightRatio}
                        onChange={(e) => setNewLightRatio(e.target.value)}
                        placeholder="4:1 Ratio"
                        className="w-full bg-[#12172a] border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newLightUrl}
                      onChange={(e) => setNewLightUrl(e.target.value)}
                      placeholder="Reference image URL (optional diagram/swatch)"
                      className="bg-[#12172a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      value={newLightNotes}
                      onChange={(e) => setNewLightNotes(e.target.value)}
                      placeholder="Placement & diffusion notes (e.g. 45° camera-left through 1/2 grid)"
                      className="bg-[#12172a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddLightingReference}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach Lighting Unit</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CAMERA FOCUS CUES & PULL TIMELINE */}
            {activeNotebookTab === 'focus' && (
              <div className="space-y-3.5 bg-[#070a14] p-3.5 rounded-xl border border-zinc-800/90">
                {/* Visual Focus Pull Timeline Bar across Scene Duration */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                      <span>1st AC Focus Pull Timeline (0.0s — {activeScene.duration.toFixed(1)}s)</span>
                    </span>
                    <span>Click any marker or add a timestamped focus pull below</span>
                  </div>

                  <div className="relative h-10 bg-[#101424] rounded-lg border border-zinc-800 px-3 flex items-center">
                    <div className="w-full h-1 bg-zinc-800 rounded-full relative">
                      {notebookData.cameraFocusCues.map((cue) => {
                        const pct = Math.max(
                          2,
                          Math.min(98, (cue.timestampSec / Math.max(1, activeScene.duration)) * 100)
                        );
                        return (
                          <div
                            key={cue.id}
                            style={{ left: `${pct}%` }}
                            className="absolute -top-3 -translate-x-1/2 flex flex-col items-center group"
                            title={`${cue.timestampSec}s: ${cue.cueType} -> ${cue.targetSubject} (${cue.focalDistance})`}
                          >
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-black font-mono font-bold text-[9px] whitespace-nowrap shadow">
                              {cue.timestampSec}s • {cue.focalDistance}
                            </span>
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 border-2 border-black mt-0.5" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Focus Cue Cards List */}
                <div className="space-y-2">
                  {notebookData.cameraFocusCues.map((cue) => (
                    <div
                      key={cue.id}
                      className="bg-[#101424] border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs">
                          @{cue.timestampSec.toFixed(1)}s
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[11px] font-semibold">
                          {cue.cueType}
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          Target: {cue.targetSubject}
                        </span>
                        <span className="text-xs font-mono text-amber-300">
                          Dist: {cue.focalDistance} • {cue.apertureMark}
                        </span>
                        {cue.notes && (
                          <span className="text-[11px] text-zinc-400 truncate">— {cue.notes}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCameraFocusCue(cue.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                        title="Remove camera focus cue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Camera Focus Cue Form */}
                <div className="bg-[#0c1020] border border-zinc-800/90 rounded-xl p-3 space-y-2.5">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Timestamped Camera Focus Cue</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-0.5">Timestamp (s)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={activeScene.duration}
                        value={newCueTime}
                        onChange={(e) => setNewCueTime(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#12172a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-[10px] text-zinc-400 block mb-0.5">Focus Transition Type</label>
                      <select
                        value={newCueType}
                        onChange={(e) => setNewCueType(e.target.value as CameraFocusCue['cueType'])}
                        className="w-full bg-[#12172a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                      >
                        <option value="Rack Focus">Rack Focus</option>
                        <option value="Lock Focus">Lock Focus</option>
                        <option value="Shallow DOF Tracking">Shallow DOF Tracking</option>
                        <option value="Split Diopter">Split Diopter</option>
                        <option value="Deep Focus">Deep Focus</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-0.5">Focal Distance</label>
                      <input
                        type="text"
                        value={newCueDistance}
                        onChange={(e) => setNewCueDistance(e.target.value)}
                        placeholder="e.g. 1.4m"
                        className="w-full bg-[#12172a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-0.5">T-Stop / Aperture</label>
                      <input
                        type="text"
                        value={newCueAperture}
                        onChange={(e) => setNewCueAperture(e.target.value)}
                        placeholder="e.g. T1.5"
                        className="w-full bg-[#12172a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newCueTarget}
                      onChange={(e) => setNewCueTarget(e.target.value)}
                      placeholder="Target Subject (e.g. Protagonist Eyes, Hologram Shard)"
                      className="bg-[#12172a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      value={newCueNotes}
                      onChange={(e) => setNewCueNotes(e.target.value)}
                      placeholder="1st AC Pull Speed / Motivation Notes"
                      className="bg-[#12172a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddCameraFocusCue}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Focus Cue</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-[#0d101d] border-t border-zinc-800/80 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {appliedNotification && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                <span>{appliedNotification}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleApplyToAllScenes}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#14192b] hover:bg-[#1c233c] text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Batch copy this optical lens and shooting metadata to every scene in the timeline"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Apply to All {scenes.length} Scenes</span>
            </button>

            <button
              type="button"
              onClick={handleSaveCurrent}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Save Scene #{activeScene.sceneNumber}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
