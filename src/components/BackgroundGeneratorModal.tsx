import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  Download,
  Check,
  RotateCcw,
  Layers,
  Palette,
  MapPin,
  Clock,
  Eye,
  Sliders,
  Upload,
  Film,
  Zap,
  ChevronRight,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { Scene, BackgroundAsset, TimeOfDay } from '../types';
import {
  PRESET_BACKGROUND_ASSETS,
  generateProceduralBackgroundSvg,
} from '../data/backgroundAssets';
import { VISUAL_STYLES } from '../data/presets';

interface BackgroundGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  currentSceneIndex: number;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onBulkUpdateScenes?: (sceneIds: string[], updates: Partial<Scene>) => void;
}

export const BackgroundGeneratorModal: React.FC<BackgroundGeneratorModalProps> = ({
  isOpen,
  onClose,
  scenes,
  currentSceneIndex,
  onUpdateScene,
  onBulkUpdateScenes,
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'catalog' | 'scenes'>('studio');
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    scenes[currentSceneIndex]?.id || scenes[0]?.id || ''
  );

  // Studio generator inputs
  const currentScene = scenes.find((s) => s.id === selectedSceneId) || scenes[0];
  const [prompt, setPrompt] = useState<string>(
    currentScene
      ? `Cinematic wide shot of ${currentScene.sceneLocation || 'Neo-Tokyo Sublevel'}, volumetric haze, ${currentScene.visualStyle} aesthetic, 8k concept art backdrop`
      : 'Cinematic wide shot of Neo-Tokyo futuristic cyberpunk city with glowing neon rain, 8k concept art'
  );
  const [visualStyle, setVisualStyle] = useState<string>(
    currentScene?.visualStyle || 'Cyberpunk'
  );
  const [sceneLocation, setSceneLocation] = useState<string>(
    currentScene?.sceneLocation || 'Neo-Tokyo Sublevel 4'
  );
  const [timeOfDay, setTimeOfDay] = useState<string>(
    (currentScene?.timeOfDay as string) || 'Night'
  );

  // Generator execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(
    currentScene?.backgroundImage || PRESET_BACKGROUND_ASSETS[0].imageUrl
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Parallax / Camera simulation in preview
  const [previewPan, setPreviewPan] = useState(0);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state whenever selectedSceneId changes
  useEffect(() => {
    const s = scenes.find((scene) => scene.id === selectedSceneId);
    if (s) {
      if (s.backgroundImage) {
        setGeneratedPreviewUrl(s.backgroundImage);
      }
      if (s.sceneLocation) {
        setSceneLocation(s.sceneLocation);
      }
      if (s.visualStyle) {
        setVisualStyle(s.visualStyle);
      }
      if (s.timeOfDay) {
        setTimeOfDay(s.timeOfDay as string);
      }
      setPrompt(
        s.backgroundPrompt ||
          `Cinematic wide shot of ${s.sceneLocation || 'futuristic cityscape'}, volumetric atmosphere, ${s.visualStyle} aesthetic, photorealistic matte painting 8k`
      );
    }
  }, [selectedSceneId, scenes]);

  // Parallax animation on canvas preview
  useEffect(() => {
    let frameId: number;
    let t = 0;
    const animate = () => {
      t += 0.015;
      setPreviewPan(Math.sin(t) * 18);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (!isOpen) return null;

  const handleGenerateBackground = async () => {
    setIsGenerating(true);
    setStatusMessage('Generating cinematic background asset...');

    try {
      // 1. Attempt API server proxy
      const res = await fetch('/api/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          visualStyle,
          location: sceneLocation,
          timeOfDay,
          seed: Date.now(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.dataUrl) {
          setGeneratedPreviewUrl(data.dataUrl);
          setStatusMessage('Background asset generated successfully!');
          setTimeout(() => setStatusMessage(null), 3000);
          setIsGenerating(false);
          return;
        }
      }
    } catch {
      // API call failed or in sandbox, use local procedural generator
    }

    // 2. Procedural high-fidelity generator fallback
    setTimeout(() => {
      const { dataUrl } = generateProceduralBackgroundSvg({
        prompt,
        visualStyle,
        location: sceneLocation,
        timeOfDay,
        seed: Date.now(),
      });
      setGeneratedPreviewUrl(dataUrl);
      setStatusMessage('Custom background synthesized & ready!');
      setTimeout(() => setStatusMessage(null), 3000);
      setIsGenerating(false);
    }, 450);
  };

  const handleApplyToScene = (targetSceneId: string, bgUrl: string) => {
    onUpdateScene(targetSceneId, {
      backgroundImage: bgUrl,
      backgroundPrompt: prompt,
      backgroundStyle: visualStyle,
      sceneLocation: sceneLocation,
    });
    setStatusMessage(`Assigned background to Scene ${scenes.find((s) => s.id === targetSceneId)?.sceneNumber || ''}!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleApplyToAllScenes = (bgUrl: string) => {
    if (onBulkUpdateScenes) {
      onBulkUpdateScenes(
        scenes.map((s) => s.id),
        {
          backgroundImage: bgUrl,
          backgroundPrompt: prompt,
          backgroundStyle: visualStyle,
        }
      );
    } else {
      scenes.forEach((s) => {
        onUpdateScene(s.id, {
          backgroundImage: bgUrl,
          backgroundPrompt: prompt,
          backgroundStyle: visualStyle,
        });
      });
    }
    setStatusMessage('Applied background asset across all scenes!');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleClearBackground = (targetSceneId: string) => {
    onUpdateScene(targetSceneId, {
      backgroundImage: undefined,
      backgroundPrompt: undefined,
    });
    setStatusMessage('Reverted scene to procedural background atmosphere.');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleDownloadAsset = () => {
    if (!generatedPreviewUrl) return;
    const a = document.createElement('a');
    a.href = generatedPreviewUrl;
    a.download = `storycast_background_${sceneLocation.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setGeneratedPreviewUrl(dataUrl);
      setStatusMessage('Custom image asset uploaded successfully!');
      setTimeout(() => setStatusMessage(null), 2500);
    };
    reader.readAsDataURL(file);
  };

  const quickPrompts = [
    { label: 'Neo-Tokyo Cyberpunk Rain', loc: 'Neo-Tokyo Neon Alley', style: 'Cyberpunk', time: 'Night', prompt: 'Pouring rain in Neo-Tokyo narrow neon alleyway, glowing holograms reflecting in puddles, steam vents, dark noir 35mm anamorphic' },
    { label: 'Orbital Panoramic Viewport', loc: 'Orbital Observation Deck', style: 'Cinematic', time: 'Midnight', prompt: 'Panoramic curved space station glass window overlooking Earth atmospheric blue glow, starlight, flight consoles' },
    { label: 'Quantum Server Core', loc: 'Quantum Data Vault', style: 'Cyberpunk', time: 'Night', prompt: 'Subterranean infinite server stacks, floating glowing cyan data core, laser grid floor, high-tech security' },
    { label: 'Martian Colony Habitat', loc: 'Martian Red Dunes', style: 'Dark Fantasy', time: 'Dusk', prompt: 'Rust red dunes of Mars, geodesic bio-dome colony, distant twin moons, atmospheric dust haze' },
    { label: 'Retro 80s Gridway', loc: 'Synthwave Highway', style: 'Retro 80s Sci-Fi', time: 'Midnight', prompt: '80s retro synthwave horizon, neon striped glowing sun, wireframe mountains, cyan grid road' },
    { label: 'Anime Sunset Twilight', loc: 'Shinkai Twilight Vista', style: 'Anime', time: 'Golden Hour', prompt: 'Makoto Shinkai luminous clouds at golden hour, shimmering twilight horizon, power lines, warm violet sky' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#090d16] border border-cyan-500/40 rounded-2xl w-full max-w-5xl shadow-[0_0_60px_rgba(0,240,255,0.2)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#0d1322] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  AI Scene Background Asset Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                  Image Generator v2.5
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Generate, customize and assign cinematic 16:9 background matte paintings and environment backdrops
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Navigation */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs font-mono">
              <button
                onClick={() => setActiveTab('studio')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeTab === 'studio'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Studio Prompt</span>
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeTab === 'catalog'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Asset Catalog</span>
              </button>
              <button
                onClick={() => setActiveTab('scenes')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeTab === 'scenes'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Timeline Scenes ({scenes.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast Alert */}
        {statusMessage && (
          <div className="bg-cyan-950/90 border-b border-cyan-500/50 px-6 py-2 flex items-center justify-between text-xs text-cyan-300 font-mono animate-in fade-in">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              {statusMessage}
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: STUDIO GENERATOR */}
          {activeTab === 'studio' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-7 space-y-4">
                {/* Target Scene Selector */}
                <div className="bg-[#0f1422] border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                    <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Target Scene:</span>
                    <select
                      value={selectedSceneId}
                      onChange={(e) => setSelectedSceneId(e.target.value)}
                      className="bg-black/60 border border-cyan-500/40 rounded px-2.5 py-1 text-white font-sans text-xs focus:outline-none focus:border-cyan-400"
                    >
                      {scenes.map((s) => (
                        <option key={s.id} value={s.id}>
                          Scene {s.sceneNumber}: {s.title.slice(0, 32)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400">
                    Active: {currentScene?.sceneLocation || 'Studio Set'} ({currentScene?.visualStyle})
                  </span>
                </div>

                {/* Prompt Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-white flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Background Image Generation Prompt</span>
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">16:9 Cinematic Aspect Ratio</span>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    placeholder="Describe the environment, architectural landmarks, lighting, atmospheric haze, and camera framing..."
                    className="w-full bg-[#0c101a] border border-zinc-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed transition-all shadow-inner font-sans"
                  />
                </div>

                {/* Quick Preset Prompts */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Directorial Concept Starters:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickPrompts.map((qp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPrompt(qp.prompt);
                          setSceneLocation(qp.loc);
                          setVisualStyle(qp.style);
                          setTimeOfDay(qp.time);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-900/90 hover:bg-cyan-950/60 border border-zinc-800 hover:border-cyan-500/50 text-zinc-300 hover:text-cyan-200 transition-all font-sans"
                      >
                        {qp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Setting Controls: Location, Visual Style, Time of Day */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      Location Name
                    </label>
                    <input
                      type="text"
                      value={sceneLocation}
                      onChange={(e) => setSceneLocation(e.target.value)}
                      placeholder="e.g. Orbital Deck"
                      className="w-full bg-black/50 border border-zinc-700/80 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1">
                      <Palette className="w-3 h-3 text-purple-400" />
                      Visual Style
                    </label>
                    <select
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-700/80 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-sans"
                    >
                      {VISUAL_STYLES.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Time of Day
                    </label>
                    <select
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-700/80 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-sans"
                    >
                      <option value="Night">Night</option>
                      <option value="Midnight">Midnight</option>
                      <option value="Golden Hour">Golden Hour</option>
                      <option value="Dusk">Dusk</option>
                      <option value="Dawn">Dawn</option>
                      <option value="Day">Day</option>
                    </select>
                  </div>
                </div>

                {/* Prompt Enhancer Modifiers */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono text-zinc-400">Atmospheric Enhancers:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '+ Volumetric Rain',
                      '+ Neon Reflection Streaks',
                      '+ Anamorphic Lens Flare',
                      '+ Cybernetic Spires',
                      '+ Cosmic Nebula Dust',
                      '+ Chiaroscuro Shadows',
                    ].map((mod, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPrompt((prev) => `${prev.trim()}, ${mod.replace('+', '').trim()}`)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 border border-zinc-800 hover:border-cyan-500/40 text-zinc-400 hover:text-cyan-300 transition-colors"
                      >
                        {mod}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button & Custom File Upload */}
                <div className="pt-3 flex items-center gap-3">
                  <button
                    onClick={handleGenerateBackground}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-mono tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                        <span>Rendering 16:9 Asset...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Generate Background Asset</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload custom image asset from device"
                    className="px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-cyan-500/50 text-zinc-300 hover:text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Upload</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCustomUpload}
                  />
                </div>
              </div>

              {/* Right Column: Live 16:9 Cinematic Preview Card */}
              <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5 text-white font-bold">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      Cinematic 16:9 Preview Frame
                    </span>
                    <span className="text-[10px] text-cyan-400">Camera Pan Sim: {previewPan.toFixed(1)}px</span>
                  </div>

                  {/* 16:9 Frame container */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-cyan-500/40 bg-black/90 shadow-[0_0_30px_rgba(0,240,255,0.15)] group">
                    {generatedPreviewUrl ? (
                      <div
                        className="w-full h-full relative overflow-hidden"
                        style={{
                          transform: `scale(1.05) translateX(${previewPan}px)`,
                          transition: 'transform 0.1s ease-out',
                        }}
                      >
                        <img
                          src={generatedPreviewUrl}
                          alt="Generated scene background"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                        <ImageIcon className="w-8 h-8 text-zinc-600 mb-2" />
                        <span className="text-xs font-mono">No background asset loaded</span>
                      </div>
                    )}

                    {/* Letterbox & HUD Watermark Overlay */}
                    <div className="absolute inset-0 pointer-events-none border border-cyan-500/30 rounded-xl" />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 font-bold flex items-center gap-1 backdrop-blur-xs">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                      <span>16:9 ASSET // {sceneLocation.toUpperCase()}</span>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 border border-zinc-700 text-[9px] font-mono text-zinc-400 backdrop-blur-xs">
                      {visualStyle} • {timeOfDay}
                    </div>
                  </div>
                </div>

                {/* Assign Actions */}
                <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                  <span className="text-[11px] font-mono text-zinc-300 font-bold block">
                    Assign Background Asset:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => generatedPreviewUrl && handleApplyToScene(selectedSceneId, generatedPreviewUrl)}
                      disabled={!generatedPreviewUrl}
                      className="py-2 px-3 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/60 text-cyan-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Apply to Scene {currentScene?.sceneNumber || 1}</span>
                    </button>

                    <button
                      onClick={() => generatedPreviewUrl && handleApplyToAllScenes(generatedPreviewUrl)}
                      disabled={!generatedPreviewUrl}
                      className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Apply to All Scenes</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-xs font-mono">
                    <button
                      onClick={handleDownloadAsset}
                      disabled={!generatedPreviewUrl}
                      className="text-zinc-400 hover:text-cyan-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .SVG Asset</span>
                    </button>

                    <button
                      onClick={() => handleClearBackground(selectedSceneId)}
                      className="text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Procedural</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSET CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Curated High-Fidelity Background Asset Catalog</span>
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Handcrafted 16:9 cinematic matte paintings ready for instant deployment into your story timeline
                  </p>
                </div>

                <div className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                  Target: Scene {currentScene?.sceneNumber} ({currentScene?.title.slice(0, 20)}...)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRESET_BACKGROUND_ASSETS.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-[#0b0f19] border border-zinc-800 hover:border-cyan-500/60 rounded-xl overflow-hidden shadow-lg transition-all flex flex-col group"
                  >
                    {/* Thumbnail 16:9 */}
                    <div className="relative aspect-video w-full bg-black/60 overflow-hidden">
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-zinc-700 text-[9px] font-mono text-cyan-300 font-bold backdrop-blur-xs">
                        {asset.category}
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h5 className="text-xs font-bold text-white tracking-wide">{asset.name}</h5>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {asset.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-850 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setGeneratedPreviewUrl(asset.imageUrl);
                            handleApplyToScene(selectedSceneId, asset.imageUrl);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-600/25 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-200 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Check className="w-3 h-3 text-cyan-400" />
                          <span>Assign to Scene {currentScene?.sceneNumber}</span>
                        </button>

                        <button
                          onClick={() => {
                            setGeneratedPreviewUrl(asset.imageUrl);
                            handleApplyToAllScenes(asset.imageUrl);
                          }}
                          title="Apply this background across all timeline scenes"
                          className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-mono transition-colors"
                        >
                          <span>All</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE SCENES BACKGROUND MANAGER */}
          {activeTab === 'scenes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Film className="w-4 h-4 text-cyan-400" />
                    <span>Timeline Scenes Background Overview</span>
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Review and customize environment background assets assigned to each scene in your storyboard
                  </p>
                </div>

                <button
                  onClick={() => generatedPreviewUrl && handleApplyToAllScenes(generatedPreviewUrl)}
                  className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/50 text-purple-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Sync Active BG to All Scenes</span>
                </button>
              </div>

              <div className="space-y-3">
                {scenes.map((s) => (
                  <div
                    key={s.id}
                    className={`bg-[#0b0e18] border rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                      s.id === selectedSceneId
                        ? 'border-cyan-500/60 shadow-[0_0_20px_rgba(0,240,255,0.12)]'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Scene Thumbnail / Current Background */}
                    <div className="flex items-center gap-3.5 w-full md:w-auto">
                      <div className="relative aspect-video w-32 md:w-40 rounded-lg overflow-hidden border border-zinc-700 bg-black/80 shrink-0">
                        {s.backgroundImage ? (
                          <img
                            src={s.backgroundImage}
                            alt={`Scene ${s.sceneNumber} background`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-zinc-900 to-black">
                            <Layers className="w-5 h-5 text-zinc-600 mb-1" />
                            <span className="text-[9px] font-mono text-zinc-400">Procedural ATM</span>
                          </div>
                        )}
                        <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/85 text-[8px] font-mono text-cyan-300 font-bold border border-cyan-500/40">
                          SCENE {s.sceneNumber}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white tracking-wide">{s.title}</h5>
                          {s.backgroundImage ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                              Custom Asset Loaded
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-750">
                              Procedural Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          Location: <span className="text-white">{s.sceneLocation || 'Studio Set'}</span> • Time: <span className="text-amber-400">{s.timeOfDay || 'Night'}</span>
                        </p>
                        <p className="text-[11px] text-zinc-500 line-clamp-1 italic font-sans max-w-md">
                          "{s.videoPrompt}"
                        </p>
                      </div>
                    </div>

                    {/* Actions for this scene */}
                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                      <button
                        onClick={() => {
                          setSelectedSceneId(s.id);
                          setActiveTab('studio');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-cyan-950/60 border border-zinc-850 hover:border-cyan-500/40 text-xs font-mono text-zinc-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Customize</span>
                      </button>

                      {generatedPreviewUrl && (
                        <button
                          onClick={() => handleApplyToScene(s.id, generatedPreviewUrl)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600/25 hover:bg-cyan-600/50 border border-cyan-500/50 text-xs font-mono font-bold text-cyan-200 transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Paste Active BG</span>
                        </button>
                      )}

                      {s.backgroundImage && (
                        <button
                          onClick={() => handleClearBackground(s.id)}
                          title="Revert scene to procedural default background"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0d121f] border-t border-zinc-800 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>StoryCast AI Cinematic Matte Painting Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)]"
            >
              Done & Return to Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
