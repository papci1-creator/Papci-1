import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Sparkles,
  Shirt,
  Check,
  Copy,
  Layers,
  Palette,
  ShieldCheck,
  Eye,
  Film,
  CheckCircle2,
} from 'lucide-react';
import { CharacterProfile, Scene, CharacterOutfit } from '../types';

interface CostumeLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterProfile[];
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  scenes: Scene[];
  onApplyCostumeLockToScenes: (characterId: string, costumeLock: string, outfit?: CharacterOutfit) => void;
  onLockAllScenesContinuity?: () => void;
}

export const CostumeLockModal: React.FC<CostumeLockModalProps> = ({
  isOpen,
  onClose,
  characters,
  onUpdateCharacter,
  scenes,
  onApplyCostumeLockToScenes,
  onLockAllScenesContinuity,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(
    characters[0]?.id || ''
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeChar =
    characters.find((c) => c.id === selectedCharId) || characters[0];

  const activeOutfit =
    activeChar?.outfits?.find((o) => o.id === activeChar.activeOutfitId) ||
    activeChar?.outfits?.[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const buildDenseLockString = (char: CharacterProfile, outfit?: CharacterOutfit) => {
    const targetOutfit =
      outfit ||
      char.outfits?.find((o) => o.id === char.activeOutfitId) ||
      char.outfits?.[0];

    return `[COSTUME LOCK: ${char.name.toUpperCase()} // OUTFIT: ${
      targetOutfit?.name || 'Primary'
    }] Garments: ${
      targetOutfit?.description || char.description
    } | Anatomy & Face Keyframe: ${
      char.faceDescription || char.description
    } | Palette Lock: ${
      targetOutfit?.colorAccent || char.colorAccent
    }, matte studio finish | Continuity Protocol: 100% keyframe & wardrobe preservation across all cuts.`;
  };

  const handleGenerateDenseLock = (char: CharacterProfile, outfit?: CharacterOutfit) => {
    const denseCostumeLock = buildDenseLockString(char, outfit);
    onUpdateCharacter(char.id, {
      costumeLock: denseCostumeLock,
      ...(outfit ? { activeOutfitId: outfit.id } : {}),
    });
    return denseCostumeLock;
  };

  const handleSelectOutfit = (char: CharacterProfile, outfit: CharacterOutfit) => {
    const lock = buildDenseLockString(char, outfit);
    onUpdateCharacter(char.id, {
      activeOutfitId: outfit.id,
      costumeLock: lock,
    });
  };

  const handleSyncCharToScenes = (char: CharacterProfile) => {
    const outfit =
      char.outfits?.find((o) => o.id === char.activeOutfitId) ||
      char.outfits?.[0];
    const lock = char.costumeLock || handleGenerateDenseLock(char, outfit);
    onApplyCostumeLockToScenes(char.id, lock, outfit);
    setAppliedBanner(`Synced ${char.name}'s outfit & visual keyframe across matching scenes!`);
    setTimeout(() => setAppliedBanner(null), 3000);
  };

  const handleLockAll = () => {
    characters.forEach((char) => {
      const outfit =
        char.outfits?.find((o) => o.id === char.activeOutfitId) ||
        char.outfits?.[0];
      const lock = char.costumeLock || buildDenseLockString(char, outfit);
      onUpdateCharacter(char.id, { costumeLock: lock });
      onApplyCostumeLockToScenes(char.id, lock, outfit);
    });
    if (onLockAllScenesContinuity) {
      onLockAllScenesContinuity();
    }
    setAppliedBanner('All scenes locked with consistent character outfits & visual keyframes!');
    setTimeout(() => setAppliedBanner(null), 3500);
  };

  const lockedScenesCount = scenes.filter((s) => Boolean(s.costumeLock || s.visualKeyframeLocked)).length;
  const continuityPercent = scenes.length > 0 ? Math.round((lockedScenesCount / scenes.length) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-2xl w-full max-w-4xl shadow-[0_0_60px_rgba(0,240,255,0.18)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e1424] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Storyboard Continuity & Costume Lock Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-semibold">
                  {continuityPercent}% Scene Continuity
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Keep character outfits, facial reference sheets, and visual keyframes strictly consistent across every scene
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLockAll}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Lock All Scenes & Keyframes</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {appliedBanner && (
          <div className="px-4 py-2 bg-emerald-950/50 border-b border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedBanner}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Left Column: Character Cast Selection (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5 border-b lg:border-b-0 lg:border-r border-zinc-800/80 pb-3 lg:pb-0 lg:pr-3">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
              1. Select Character Cast ({characters.length}):
            </div>
            {characters.map((char) => {
              const isSelected = char.id === activeChar?.id;
              const hasLock = Boolean(char.costumeLock);
              const charOutfit =
                char.outfits?.find((o) => o.id === char.activeOutfitId) ||
                char.outfits?.[0];
              const sceneMatches = scenes.filter(
                (s) => s.characterId === char.id || s.characterName === char.name
              ).length;

              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharId(char.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#10182c] border-cyan-400/80 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'bg-[#060810] hover:bg-[#0b101e] border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {char.imageUrl ? (
                      <img
                        src={char.imageUrl}
                        alt={char.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ backgroundColor: `${char.colorAccent}25`, color: char.colorAccent }}
                      >
                        {char.name.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{char.name}</span>
                        <span className="text-[9px] font-mono text-zinc-400">{char.tag}</span>
                      </div>
                      <div className="text-[10px] text-cyan-300/90 truncate font-mono">
                        {charOutfit?.name || 'Default Wardrobe'}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {sceneMatches} scenes in timeline
                      </div>
                    </div>
                  </div>

                  {hasLock ? (
                    <span className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/30" title="Costume & Keyframe Locked">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1.5 rounded-lg bg-zinc-800 text-zinc-500" title="Unlocked">
                      <Unlock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Wardrobe Selector, Costume Lock & Scene Continuity Matrix (8 cols) */}
          {activeChar && (
            <div className="lg:col-span-8 space-y-4">
              {/* Wardrobe Keyframe Selector */}
              {activeChar.outfits && activeChar.outfits.length > 0 && (
                <div className="bg-[#070a14] border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Shirt className="w-3.5 h-3.5 text-amber-400" />
                      <span>2. Select Locked Wardrobe & Keyframe Plate for {activeChar.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-300">
                      {activeChar.outfits.length} Outfit Presets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {activeChar.outfits.map((outfit) => {
                      const isActive = outfit.id === (activeOutfit?.id || '');
                      return (
                        <button
                          key={outfit.id}
                          onClick={() => handleSelectOutfit(activeChar, outfit)}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            isActive
                              ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                              : 'bg-[#04060c] border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {outfit.imageUrl && (
                              <img
                                src={outfit.imageUrl}
                                alt={outfit.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-lg object-cover border border-zinc-700 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-white truncate">
                                {outfit.name}
                              </div>
                              <div className="text-[9px] font-mono text-cyan-400">
                                {isActive ? '● ACTIVE LOCK' : 'Click to Lock'}
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-snug">
                            {outfit.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dense Costume Lock Editor */}
              <div className="bg-[#070a14] border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold font-mono text-white">
                      3. Locked Costume & Keyframe Continuity Token
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateDenseLock(activeChar, activeOutfit)}
                      className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Synthesize Keyframe Lock</span>
                    </button>

                    <button
                      onClick={() => handleSyncCharToScenes(activeChar)}
                      className="px-3 py-1 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] font-mono shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
                    >
                      Sync to {activeChar.name}'s Scenes
                    </button>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={activeChar.costumeLock || buildDenseLockString(activeChar, activeOutfit)}
                  onChange={(e) =>
                    onUpdateCharacter(activeChar.id, { costumeLock: e.target.value })
                  }
                  className="w-full bg-[#04060c] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <Palette className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Color Continuity Swatch:</span>
                    <span
                      className="px-2 py-0.5 rounded font-mono text-[10px] font-bold"
                      style={{
                        backgroundColor: `${activeChar.colorAccent}25`,
                        color: activeChar.colorAccent,
                      }}
                    >
                      {activeChar.colorAccent}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      handleCopy(
                        activeChar.costumeLock || buildDenseLockString(activeChar, activeOutfit),
                        activeChar.id
                      )
                    }
                    className="px-2.5 py-1 rounded text-[11px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedId === activeChar.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Lock Token</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Scene-by-Scene Storyboard Continuity Verification Matrix */}
              <div className="bg-[#070a14] border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-emerald-400" />
                    <span>4. Scene-by-Scene Keyframe & Wardrobe Continuity Matrix ({scenes.length} Scenes)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {lockedScenesCount}/{scenes.length} Locked
                  </span>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                  {scenes.map((scene) => {
                    const matchedChar =
                      characters.find((c) => c.id === scene.characterId || c.name === scene.characterName) ||
                      activeChar;
                    const isLocked = Boolean(scene.costumeLock || scene.visualKeyframeLocked);

                    return (
                      <div
                        key={scene.id}
                        className="p-2 rounded-lg bg-[#04060c] border border-zinc-800/90 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-mono text-[10px] font-bold shrink-0">
                            S{scene.sceneNumber}
                          </span>
                          {(scene.outfitImage || scene.characterAvatar || matchedChar?.imageUrl) && (
                            <img
                              src={scene.outfitImage || scene.characterAvatar || matchedChar?.imageUrl}
                              alt={scene.title}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded object-cover border border-cyan-500/40 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {scene.title}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono truncate">
                              Cast: {scene.characterName || matchedChar?.name} • Wardrobe: {scene.outfitName || activeOutfit?.name || 'Default'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isLocked ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>KEYFRAME LOCKED</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                if (matchedChar) handleSyncCharToScenes(matchedChar);
                              }}
                              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-[10px] cursor-pointer"
                            >
                              Lock Scene
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-[#070a14] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-zinc-400">
            Compliant with Google Veo & Imagen 3 character keyframe consistency protocols
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
