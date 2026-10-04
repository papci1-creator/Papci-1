import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  FileImage,
  Layers,
  Check,
  Eye,
  Mic,
  Palette,
  ExternalLink,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { CharacterProfile, CharacterRole, Scene } from '../types';
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
  const [generatingSheetId, setGeneratingSheetId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleAddCharacter = () => {
    const count = characters.length + 1;
    const colors = ['#00f0ff', '#ff007f', '#ffaa00', '#00ff88', '#b026ff'];
    const assignedColor = colors[(count - 1) % colors.length];

    const newChar: CharacterProfile = {
      id: `char-${Date.now()}`,
      name: `Hero ${count}`,
      tag: `@Hero${count}`,
      role: count === 1 ? 'Protagonist' : count === 2 ? 'Antagonist' : 'Supporting',
      description: `Hero ${count}, 26-year-old sci-fi protagonist, athletic build, distinctive tactical jacket with glowing ${assignedColor} accents, sharp determined eyes.`,
      assignedVoice: VOICE_ACTORS[(count - 1) % VOICE_ACTORS.length].category,
      colorAccent: assignedColor,
      referenceSheet: {
        frontAngleDescription: `Frontal view of Hero ${count} with athletic posture, sharp features and high-tech collar.`,
        sideProfileDescription: `90° profile silhouette detailing jawline, ear communicator and collar trim.`,
        actionAngleDescription: `Dynamic 3/4 hero action pose with cinematic lighting and cyan rim bleed.`,
        costumeColorPalette: [assignedColor, '#141d33', '#0a0d18', '#ffffff'],
        keyAnatomyFeatures: ['Sharp jawline', 'Tactical jacket', 'Telemetry collar'],
        generatedAt: 'Turnaround Model v1.0',
      },
    };

    setCharacters((prev) => [...prev, newChar]);
    setActiveCharacterId(newChar.id);
  };

  const handleUpdateCharacter = (id: string, updates: Partial<CharacterProfile>) => {
    setCharacters((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          // If name changes, sync tag
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

  // Image Upload handler (File input or Drag-and-drop)
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

  // Generate Reference Sheet with animated loading state
  const handleGenerateTurnaroundSheet = (char: CharacterProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingSheetId(char.id);

    setTimeout(() => {
      const updatedSheet = {
        frontAngleDescription: `Full frontal elevation of ${char.name}: ${char.description}`,
        sideProfileDescription: `90° profile silhouette detailing head curvature, shoulder breadth, and signature costume gear.`,
        actionAngleDescription: `3/4 cinematic turnaround angle: Ready stance with directional lighting highlights.`,
        costumeColorPalette: [char.colorAccent, '#121c2e', '#070a14', '#ffffff'],
        keyAnatomyFeatures: [
          'Facial structure locked from reference',
          'Exact clothing specs',
          'Directional lighting consistency',
        ],
        generatedAt: `Generated at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      };

      handleUpdateCharacter(char.id, { referenceSheet: updatedSheet });
      setGeneratingSheetId(null);
      onOpenTurnaround({ ...char, referenceSheet: updatedSheet });
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col bg-[#08090e] text-zinc-100 select-none overflow-hidden">
      {/* Top Header & Actions */}
      <div className="p-4 border-b border-zinc-800/80 bg-[#0c101a] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
              Cast & Character References
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
              {characters.length} Active
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Lock in facial features, wardrobe consistency & voice actor links
          </p>
        </div>

        <button
          onClick={handleAddCharacter}
          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Character</span>
        </button>
      </div>

      {/* Grid of Character Profile Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {characters.map((char) => {
          const isSelected = activeCharacterId === char.id;
          const isUsedInActiveScene = activeSceneCharacterId === char.id;
          const scenesUsingThisChar = scenes.filter(
            (s) => s.characterId === char.id || s.videoPrompt.toLowerCase().includes(char.name.toLowerCase())
          );

          return (
            <div
              key={char.id}
              onClick={() => setActiveCharacterId(char.id)}
              className={`rounded-xl border transition-all duration-200 overflow-hidden relative cursor-pointer ${
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
              {/* Active Indicator Band */}
              {isSelected && (
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: char.colorAccent, boxShadow: `0 0 10px ${char.colorAccent}` }}
                />
              )}

              <div className="p-4 space-y-3.5">
                {/* Card Header: Avatar Thumbnail, Name, Role & Delete */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Drag-and-drop Image Reference Box */}
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
                      className={`w-16 h-16 rounded-xl border relative overflow-hidden group cursor-pointer shrink-0 transition-all ${
                        dragOverCharId === char.id
                          ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400'
                          : 'border-zinc-750 bg-[#06080f]'
                      }`}
                      style={{
                        borderColor: isSelected ? char.colorAccent : undefined,
                        boxShadow: isSelected ? `0 0 12px ${char.colorAccent}40` : undefined,
                      }}
                      title="Click or drag-and-drop an image reference"
                    >
                      {char.imageUrl ? (
                        <img
                          src={char.imageUrl}
                          alt={char.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center p-1 text-center"
                          style={{
                            background: `radial-gradient(circle, ${char.colorAccent}25 0%, #06080f 80%)`,
                          }}
                        >
                          <span
                            className="font-mono font-bold text-base"
                            style={{ color: char.colorAccent }}
                          >
                            {char.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-0.5 mt-0.5">
                            <Upload className="w-2.5 h-2.5" />
                            Drop
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-cyan-300 font-mono">
                        <Upload className="w-3.5 h-3.5" />
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

                    {/* Name, Tag & Role Input */}
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

                      {/* Role Selector */}
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

                        {/* Accent Color Dot */}
                        <div
                          className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: char.colorAccent, boxShadow: `0 0 8px ${char.colorAccent}` }}
                          title={`Color Accent: ${char.colorAccent}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions & Delete Button */}
                  <div className="flex items-center gap-1.5">
                    {characters.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteCharacter(char.id, e)}
                        title="Delete Profile"
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Text-based Physical Description */}
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <label className="text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                    <span>Physical Description & Facial Features:</span>
                    <span className="text-zinc-500">{char.description.length} chars</span>
                  </label>
                  <textarea
                    rows={2}
                    value={char.description}
                    onChange={(e) => handleUpdateCharacter(char.id, { description: e.target.value })}
                    className="w-full bg-[#05070e] border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60 resize-none font-sans"
                    placeholder="e.g. Leo, 25-year-old astronaut, short blonde hair, blue spacesuit, athletic build, determined blue eyes..."
                  />
                </div>

                {/* Voiceover Actor Linked to Character */}
                <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-zinc-850" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10px]">
                    <Mic className="w-3 h-3 text-cyan-400" />
                    <span>Assigned Voice:</span>
                  </div>
                  <select
                    value={char.assignedVoice}
                    onChange={(e) => handleUpdateCharacter(char.id, { assignedVoice: e.target.value })}
                    className="bg-[#05070e] border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[170px] truncate"
                  >
                    {VOICE_ACTORS.map((va) => (
                      <option key={va.id} value={va.category}>
                        {va.name} ({va.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bottom Actions: Generate Reference Sheet & Scene Presence */}
                <div className="pt-2 flex items-center justify-between border-t border-zinc-850 gap-2">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: char.colorAccent }}
                    />
                    <span>
                      {scenesUsingThisChar.length} Scene
                      {scenesUsingThisChar.length === 1 ? '' : 's'} Linked
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTurnaround(char);
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-300 hover:text-white bg-[#141928] hover:bg-[#1a2238] border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-cyan-400" />
                      <span>View Sheet</span>
                    </button>

                    <button
                      onClick={(e) => handleGenerateTurnaroundSheet(char, e)}
                      disabled={generatingSheetId === char.id}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.15)] disabled:opacity-50"
                    >
                      <Sparkles
                        className={`w-3 h-3 text-cyan-400 ${
                          generatingSheetId === char.id ? 'animate-spin' : ''
                        }`}
                      />
                      <span>
                        {generatingSheetId === char.id ? 'Generating...' : 'Generate Reference Sheet'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Character Consistency Info Tip */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#070910] text-[10px] font-mono text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-cyan-400" />
          Tag characters in your script with <code className="text-cyan-300 font-bold">@Name</code>
        </span>
        <span className="text-zinc-500">Runway · Luma · Sora Multi-Model Sync</span>
      </div>
    </div>
  );
};
