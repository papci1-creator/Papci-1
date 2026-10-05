import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  Shirt,
  Lock,
  Unlock,
  Check,
  Eye,
  Mic,
  Palette,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Edit3,
  X,
} from 'lucide-react';
import { CharacterProfile, CharacterRole, CharacterOutfit, Scene } from '../types';
import { VOICE_ACTORS } from '../data/presets';

interface CharacterManagerProps {
  characters: CharacterProfile[];
  setCharacters: React.Dispatch<React.SetStateAction<CharacterProfile[]>>;
  activeCharacterId: string | null;
  setActiveCharacterId: (id: string | null) => void;
  activeSceneCharacterId?: string;
  onOpenTurnaround: (character: CharacterProfile) => void;
  scenes: Scene[];
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({
  characters,
  setCharacters,
  activeCharacterId,
  setActiveCharacterId,
  activeSceneCharacterId,
  onOpenTurnaround,
  scenes,
}) => {
  const [dragOverCharId, setDragOverCharId] = useState<string | null>(null);
  const [expandedWardrobeIds, setExpandedWardrobeIds] = useState<string[]>([]);
  const [editingOutfitCharId, setEditingOutfitCharId] = useState<string | null>(null);
  const [newOutfitName, setNewOutfitName] = useState('');
  const [newOutfitDesc, setNewOutfitDesc] = useState('');
  const [newOutfitImg, setNewOutfitImg] = useState('');

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const outfitFileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleWardrobe = (charId: string) => {
    setExpandedWardrobeIds((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    );
  };

  const handleAddCharacter = () => {
    const count = characters.length + 1;
    const colors = ['#00f0ff', '#ff007f', '#ffaa00', '#00ff88', '#b026ff', '#38bdf8'];
    const assignedColor = colors[(count - 1) % colors.length];

    const defaultOutfit: CharacterOutfit = {
      id: `outfit-${Date.now()}-1`,
      name: `Outfit 1: Signature Hero Attire`,
      description: `Tactical lightweight jacket with ${assignedColor} glowing accents, combat pants, and telemetry belt.`,
      colorAccent: assignedColor,
      isDefault: true,
    };

    const newChar: CharacterProfile = {
      id: `char-${Date.now()}`,
      name: `Character ${count}`,
      tag: `@Char${count}`,
      role: count === 1 ? 'Protagonist' : count === 2 ? 'Antagonist' : 'Supporting',
      description: `Character ${count}, athletic build, sharp features with signature ${assignedColor} aesthetic.`,
      faceDescription: `Distinctive facial structure, sharp jawline, focused eyes, athletic build, clear complexion with subtle cyber-ports.`,
      assignedVoice: VOICE_ACTORS[(count - 1) % VOICE_ACTORS.length].category,
      colorAccent: assignedColor,
      activeOutfitId: defaultOutfit.id,
      outfits: [defaultOutfit],
      referenceSheet: {
        frontAngleDescription: `Frontal elevation of Character ${count} with athletic posture and locked facial geometry.`,
        sideProfileDescription: `90° profile silhouette detailing jawline contour and collar telemetry.`,
        actionAngleDescription: `Dynamic 3/4 heroic angle with cinematic key lighting.`,
        costumeColorPalette: [assignedColor, '#141d33', '#0a0d18', '#ffffff'],
        keyAnatomyFeatures: ['Locked facial landmarks', 'Consistent jawline', 'Signature wardrobe specs'],
        generatedAt: 'Master Character Reference Sheet v1.2',
      },
    };

    setCharacters((prev) => [...prev, newChar]);
    setActiveCharacterId(newChar.id);
    setExpandedWardrobeIds((prev) => [...prev, newChar.id]);
  };

  const handleUpdateCharacter = (id: string, updates: Partial<CharacterProfile>) => {
    setCharacters((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          if (updates.name) {
            updated.tag = `@${updates.name.replace(/\s+/g, '')}`;
          }
          return updated;
        }
        return c;
      })
    );
  };

  const handleDeleteCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (characters.length <= 1) return;
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    if (activeCharacterId === id) {
      setActiveCharacterId(characters[0]?.id || null);
    }
  };

  // Image upload for locking face
  const handleFileUpload = (id: string, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      handleUpdateCharacter(id, { imageUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (id: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCharId(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(id, e.dataTransfer.files[0]);
    }
  };

  // Outfit Management
  const handleAddOutfit = (charId: string) => {
    if (!newOutfitName.trim()) return;

    const char = characters.find((c) => c.id === charId);
    if (!char) return;

    const outfitNum = (char.outfits?.length || 0) + 1;
    const outfit: CharacterOutfit = {
      id: `outfit-${Date.now()}`,
      name: newOutfitName.trim(),
      description: newOutfitDesc.trim() || `Custom wardrobe configuration #${outfitNum} for ${char.name}.`,
      imageUrl: newOutfitImg || undefined,
      colorAccent: char.colorAccent,
      isDefault: false,
    };

    const updatedOutfits = [...(char.outfits || []), outfit];
    handleUpdateCharacter(charId, { outfits: updatedOutfits });

    setNewOutfitName('');
    setNewOutfitDesc('');
    setNewOutfitImg('');
    setEditingOutfitCharId(null);
  };

  const handleDeleteOutfit = (charId: string, outfitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const char = characters.find((c) => c.id === charId);
    if (!char || (char.outfits?.length || 0) <= 1) return;

    const filtered = char.outfits.filter((o) => o.id !== outfitId);
    const updates: Partial<CharacterProfile> = { outfits: filtered };

    if (char.activeOutfitId === outfitId) {
      updates.activeOutfitId = filtered[0]?.id;
    }

    handleUpdateCharacter(charId, updates);
  };

  const handleSetActiveOutfit = (charId: string, outfitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleUpdateCharacter(charId, { activeOutfitId: outfitId });
  };

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-zinc-100 select-none overflow-hidden">
      {/* Top Header & Actions */}
      <div className="p-3.5 border-b border-zinc-800/80 bg-[#0c101a] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
              Cast & Character Manager
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
              {characters.length} Active Cast
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Lock baseline facial features & customize dynamic wardrobe outfits
          </p>
        </div>

        <button
          onClick={handleAddCharacter}
          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Profile</span>
        </button>
      </div>

      {/* Grid of Character Profile Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {characters.map((char) => {
          const isSelected = activeCharacterId === char.id;
          const isUsedInActiveScene = activeSceneCharacterId === char.id;
          const isWardrobeExpanded = expandedWardrobeIds.includes(char.id);
          const outfitsCount = char.outfits?.length || 0;
          const activeOutfit = char.outfits?.find((o) => o.id === char.activeOutfitId) || char.outfits?.[0];

          return (
            <div
              key={char.id}
              onClick={() => setActiveCharacterId(char.id)}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden relative cursor-pointer ${
                isSelected
                  ? 'bg-[#0f1424] shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                  : 'bg-[#090c14] hover:bg-[#0c101c] border-zinc-800/90'
              }`}
              style={{
                borderColor: isSelected
                  ? char.colorAccent
                  : isUsedInActiveScene
                  ? `${char.colorAccent}90`
                  : undefined,
              }}
            >
              {/* Active Indicator Top Accent Bar */}
              {isSelected && (
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: char.colorAccent, boxShadow: `0 0 10px ${char.colorAccent}` }}
                />
              )}

              <div className="p-4 space-y-4">
                {/* 1. Header: Avatar/Face Lock Upload, Name, Role & Tag */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Image Reference Upload Box to Lock in Facial Features */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverCharId(char.id);
                      }}
                      onDragLeave={() => setDragOverCharId(null)}
                      onDrop={(e) => handleDrop(char.id, e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRefs.current[char.id]?.click();
                      }}
                      className={`w-20 h-20 rounded-xl border relative overflow-hidden group cursor-pointer shrink-0 transition-all ${
                        dragOverCharId === char.id
                          ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400'
                          : 'border-zinc-750 bg-[#05070d]'
                      }`}
                      style={{
                        borderColor: isSelected ? char.colorAccent : undefined,
                        boxShadow: isSelected ? `0 0 14px ${char.colorAccent}35` : undefined,
                      }}
                      title="Upload or drop face reference image to lock facial features"
                    >
                      {char.imageUrl ? (
                        <>
                          <img
                            src={char.imageUrl}
                            alt={char.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          {/* Face Locked Badge */}
                          <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-mono text-cyan-300 flex items-center gap-0.5 border border-cyan-500/40">
                            <Lock className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Locked</span>
                          </div>
                        </>
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center p-1 text-center"
                          style={{
                            background: `radial-gradient(circle, ${char.colorAccent}25 0%, #06080f 80%)`,
                          }}
                        >
                          <span
                            className="font-mono font-bold text-lg"
                            style={{ color: char.colorAccent }}
                          >
                            {char.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-[8px] text-zinc-400 font-mono flex items-center gap-0.5 mt-0.5">
                            <Upload className="w-2.5 h-2.5 text-cyan-400" />
                            Lock Face
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-cyan-300 font-mono">
                        <Upload className="w-4 h-4" />
                      </div>

                      <input
                        type="file"
                        ref={(el) => {
                          fileInputRefs.current[char.id] = el;
                        }}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(char.id, e.target.files[0]);
                          }
                        }}
                      />
                    </div>

                    {/* Name, Role & Tag */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={char.name}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateCharacter(char.id, { name: e.target.value })}
                          className="bg-transparent text-sm font-bold text-white focus:outline-none focus:text-cyan-300 font-sans border-b border-transparent focus:border-cyan-500/50 w-32"
                          placeholder="Character Name"
                        />
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700">
                          {char.tag}
                        </span>
                      </div>

                      {/* Role Selector & Color Dot */}
                      <div className="flex items-center gap-2">
                        <select
                          value={char.role}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleUpdateCharacter(char.id, { role: e.target.value as CharacterRole })
                          }
                          className="bg-[#070a14] border border-zinc-700 rounded px-2 py-0.5 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          <option value="Protagonist">Protagonist</option>
                          <option value="Antagonist">Antagonist</option>
                          <option value="Sidekick">Sidekick</option>
                          <option value="Mentor">Mentor</option>
                          <option value="Supporting">Supporting</option>
                        </select>

                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: char.colorAccent, boxShadow: `0 0 8px ${char.colorAccent}` }}
                          title={`Color Accent: ${char.colorAccent}`}
                        />
                      </div>

                      {/* Active Outfit Quick Tag */}
                      {activeOutfit && (
                        <div className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                          <Shirt className="w-3 h-3 text-cyan-400" />
                          <span className="truncate max-w-[150px]">{activeOutfit.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Turnaround & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTurnaround(char);
                      }}
                      title="View Multi-Angle Turnaround Reference Sheet"
                      className="px-2 py-1 rounded bg-[#10192e] hover:bg-[#16223d] text-cyan-300 border border-cyan-500/30 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span className="hidden sm:inline">Turnaround</span>
                    </button>

                    {characters.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteCharacter(char.id, e)}
                        title="Delete Profile"
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Baseline Face & Physical Features Description */}
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <label className="text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      Baseline Face & Physical Description:
                    </span>
                    <span className="text-zinc-500 font-mono text-[9px]">Locks facial features</span>
                  </label>
                  <textarea
                    rows={2}
                    value={char.faceDescription || char.description}
                    onChange={(e) =>
                      handleUpdateCharacter(char.id, {
                        faceDescription: e.target.value,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-[#05070e] border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60 resize-none font-sans"
                    placeholder="e.g. 25-year-old astronaut, short blonde hair, square jawline, piercing blue eyes..."
                  />
                </div>

                {/* 3. Dynamic Outfit Wardrobe Sub-list */}
                <div className="space-y-2 pt-2 border-t border-zinc-850" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleWardrobe(char.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Shirt className="w-3.5 h-3.5 text-amber-400" />
                      <span>Dynamic Outfit Wardrobe ({outfitsCount})</span>
                      {isWardrobeExpanded ? (
                        <ChevronUp className="w-3 h-3 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-zinc-400" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setEditingOutfitCharId(char.id);
                        setNewOutfitName(`Outfit ${outfitsCount + 1}: `);
                        setNewOutfitDesc('');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
                      <span>Add Outfit</span>
                    </button>
                  </div>

                  {/* Wardrobe Items Sub-list */}
                  {isWardrobeExpanded && (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                      {char.outfits?.map((outfit) => {
                        const isActive = (char.activeOutfitId || char.outfits[0]?.id) === outfit.id;

                        return (
                          <div
                            key={outfit.id}
                            className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                              isActive
                                ? 'bg-[#0d1424] border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                                : 'bg-[#060810] border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              {/* Outfit Thumbnail */}
                              {outfit.imageUrl ? (
                                <img
                                  src={outfit.imageUrl}
                                  alt={outfit.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-zinc-700 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-750 flex items-center justify-center shrink-0 text-cyan-400">
                                  <Shirt className="w-4 h-4" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white truncate font-sans">
                                    {outfit.name}
                                  </span>
                                  {isActive && (
                                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/40">
                                      Active Scene Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                                  {outfit.description}
                                </p>
                              </div>
                            </div>

                            {/* Outfit Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => handleSetActiveOutfit(char.id, outfit.id, e)}
                                title={isActive ? 'Active Outfit' : 'Set as Active Outfit'}
                                className={`px-2 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                                    : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border-zinc-700/60'
                                }`}
                              >
                                {isActive ? 'Selected' : 'Use'}
                              </button>

                              {char.outfits.length > 1 && (
                                <button
                                  onClick={(e) => handleDeleteOutfit(char.id, outfit.id, e)}
                                  title="Delete Outfit"
                                  className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Outfit Drawer Modal/Box */}
                      {editingOutfitCharId === char.id && (
                        <div className="p-3 bg-[#0a0f1d] border border-amber-500/30 rounded-xl space-y-2 mt-2 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                            <span className="flex items-center gap-1.5">
                              <Shirt className="w-3.5 h-3.5" />
                              Define New Outfit for {char.name}
                            </span>
                            <button
                              onClick={() => setEditingOutfitCharId(null)}
                              className="text-zinc-500 hover:text-zinc-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={newOutfitName}
                            onChange={(e) => setNewOutfitName(e.target.value)}
                            placeholder="e.g. Outfit 2: Cyberpunk Casual Hoodie"
                            className="w-full bg-[#060810] border border-zinc-750 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                          />

                          <textarea
                            rows={2}
                            value={newOutfitDesc}
                            onChange={(e) => setNewOutfitDesc(e.target.value)}
                            placeholder="Describe wardrobe fabrics, colors, equipment (e.g. Matte white pressurized EVA spacesuit with cyan conduits)..."
                            className="w-full bg-[#060810] border border-zinc-750 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                          />

                          <div className="flex items-center justify-between pt-1">
                            <input
                              type="text"
                              value={newOutfitImg}
                              onChange={(e) => setNewOutfitImg(e.target.value)}
                              placeholder="Optional image URL reference..."
                              className="bg-[#060810] border border-zinc-750 rounded px-2 py-1 text-[11px] text-zinc-300 w-48 truncate focus:outline-none focus:border-amber-400"
                            />

                            <button
                              onClick={() => handleAddOutfit(char.id)}
                              disabled={!newOutfitName.trim()}
                              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-[0_0_8px_rgba(255,170,0,0.3)] disabled:opacity-40 cursor-pointer"
                            >
                              Save Outfit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Assigned AI Voice Actor for Dialogue */}
                <div
                  className="flex items-center justify-between gap-2 text-[11px] pt-2 border-t border-zinc-850"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10px]">
                    <Mic className="w-3 h-3 text-cyan-400" />
                    <span>Dialogue Voice:</span>
                  </div>
                  <select
                    value={char.assignedVoice}
                    onChange={(e) => handleUpdateCharacter(char.id, { assignedVoice: e.target.value })}
                    className="bg-[#05070e] border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[170px] truncate"
                  >
                    {VOICE_ACTORS.map((va) => (
                      <option key={va.id} value={va.category}>
                        {va.name} ({va.category.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
