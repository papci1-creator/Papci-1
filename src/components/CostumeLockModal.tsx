import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Sparkles,
  Shirt,
  User,
  Check,
  Copy,
  Layers,
  Palette,
  AlertCircle,
} from 'lucide-react';
import { CharacterProfile, Scene } from '../types';

interface CostumeLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterProfile[];
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  scenes: Scene[];
  onApplyCostumeLockToScenes: (characterId: string, costumeLock: string) => void;
}

export const CostumeLockModal: React.FC<CostumeLockModalProps> = ({
  isOpen,
  onClose,
  characters,
  onUpdateCharacter,
  scenes,
  onApplyCostumeLockToScenes,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(
    characters[0]?.id || ''
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeChar =
    characters.find((c) => c.id === selectedCharId) || characters[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateDenseLock = (char: CharacterProfile) => {
    const activeOutfit =
      char.outfits?.find((o) => o.id === char.activeOutfitId) ||
      char.outfits?.[0];

    const denseCostumeLock = `[COSTUME LOCK: ${char.name.toUpperCase()}] Garments: ${
      activeOutfit?.description || char.description
    } | Colors: ${char.colorAccent}, slate charcoal, matte finish | Accessories: Telemetry collar communicator, utility belt with diagnostic datapad | Continuity Rule: Strict visual preservation across all cuts.`;

    onUpdateCharacter(char.id, { costumeLock: denseCostumeLock });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-2xl w-full max-w-3xl shadow-[0_0_60px_rgba(0,240,255,0.18)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e1424]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Character Costume Locks & Continuity Sheet
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-semibold">
                  Visual Continuity Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Ensure character garments, colors, and textures strictly repeat across every scene prompt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto max-h-[65vh] custom-scrollbar">
          {/* Character Sidebar Selection */}
          <div className="space-y-2 border-r border-zinc-800/80 pr-3">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
              Select Character Cast:
            </div>
            {characters.map((char) => {
              const isSelected = char.id === activeChar?.id;
              const hasLock = Boolean(char.costumeLock);
              const sceneMatches = scenes.filter((s) => s.characterId === char.id || s.characterName === char.name).length;

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
                        className="w-8 h-8 rounded-lg object-cover border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ backgroundColor: `${char.colorAccent}25`, color: char.colorAccent }}
                      >
                        {char.name.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{char.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {sceneMatches} scenes
                      </div>
                    </div>
                  </div>

                  {hasLock ? (
                    <span className="p-1 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30" title="Costume locked">
                      <Lock className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="p-1 rounded bg-zinc-800 text-zinc-500" title="Unlocked">
                      <Unlock className="w-3 h-3" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Character Costume Lock Editor */}
          {activeChar && (
            <div className="md:col-span-2 space-y-4">
              <div className="bg-[#070a14] border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold font-mono text-white">
                      Locked Costume Sheet for {activeChar.name}
                    </span>
                  </div>

                  <button
                    onClick={() => handleGenerateDenseLock(activeChar)}
                    className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Auto-Synthesize Lock</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 block">
                    Dense Repeatable Costume Lock Description:
                  </label>
                  <textarea
                    rows={4}
                    value={activeChar.costumeLock || ''}
                    onChange={(e) =>
                      onUpdateCharacter(activeChar.id, { costumeLock: e.target.value })
                    }
                    placeholder="Dense, repeatable description of exact garments, colors, textures, and accessories (e.g. [COSTUME LOCK: ELENA] Wearing an olive-drab aviation flight jacket with faded orange collar patch, brass zippers, dark flight trousers...)"
                    className="w-full bg-[#04060c] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <Palette className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Color Lock:</span>
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
                      handleCopy(activeChar.costumeLock || '', activeChar.id)
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

              {/* Sync to Timeline Scenes Action */}
              <div className="bg-[#080d1a] border border-cyan-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Inject Costume Lock into Scenes</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Updates video generation prompts with strict character costume continuity
                  </p>
                </div>

                <button
                  onClick={() => {
                    const lock = activeChar.costumeLock || '';
                    if (!lock) {
                      handleGenerateDenseLock(activeChar);
                    }
                    onApplyCostumeLockToScenes(activeChar.id, activeChar.costumeLock || '');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all cursor-pointer shrink-0"
                >
                  Apply to Scenes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-[#070a14] flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-400">
            Compliant with Google Veo and Imagen 3 consistency protocols
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
