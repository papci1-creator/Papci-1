import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  Film,
  Sparkles,
  Sliders,
  RotateCcw,
  Check,
  Video,
  Volume2,
  FileCode,
  Copy,
  Mail,
  FileText,
  Layers,
  BookOpen,
  Image as ImageIcon,
  Music,
  Monitor,
  Play,
  ShieldCheck,
  Gauge,
  Clock,
  Mic,
} from 'lucide-react';
import { Scene, AspectRatio, SoundtrackMixConfig } from '../types';
import { exportMasterVideo, ExportProgress, ExportResult } from '../utils/exportMaster';
import { downloadStoryboardPdf } from '../utils/storyboardPdf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  aspectRatio: AspectRatio;
  musicStyle: string;
  projectTitle?: string;
  soundtrackMix?: SoundtrackMixConfig;
  onOpenSoundtrackStudio?: () => void;
  onOpenGmail?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  scenes,
  aspectRatio,
  musicStyle,
  projectTitle = 'StoryCast Production',
  soundtrackMix,
  onOpenSoundtrackStudio,
  onOpenGmail,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'pdf' | 'python'>('video');
  const [isExporting, setIsExporting] = useState(false);
  const [progressInfo, setProgressInfo] = useState<ExportProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPython, setCopiedPython] = useState(false);

  // Master Video Export Configuration State
  const [resolutionPreset, setResolutionPreset] = useState<'1080p' | '720p' | '4k' | 'vertical'>('1080p');
  const [containerFormat, setContainerFormat] = useState<'mp4' | 'webm'>('mp4');
  const [frameRate, setFrameRate] = useState<number>(24);
  const [bitrateMbps, setBitrateMbps] = useState<number>(8);
  const [includeSpeech, setIncludeSpeech] = useState(true);
  const [includeMusic, setIncludeMusic] = useState(true);
  const [includeAmbientSfx, setIncludeAmbientSfx] = useState(true);
  const [enableAudioDucking, setEnableAudioDucking] = useState(true);
  const [burnInTimecode, setBurnInTimecode] = useState(true);
  const [burnInSubtitles, setBurnInSubtitles] = useState(true);
  const [burnInSceneTitle, setBurnInSceneTitle] = useState(false);

  // Live Canvas Preview during export
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (previewCanvasRef.current && progressInfo?.previewCanvas) {
      const targetCtx = previewCanvasRef.current.getContext('2d');
      if (targetCtx) {
        targetCtx.drawImage(
          progressInfo.previewCanvas,
          0,
          0,
          previewCanvasRef.current.width,
          previewCanvasRef.current.height
        );
      }
    }
  }, [progressInfo]);

  // PDF Storyboard Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ percent: number; status: string } | null>(null);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [pdfLayout, setPdfLayout] = useState<'detailed' | 'compact'>('detailed');
  const [pdfOrientation, setPdfOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [includeKeyframes, setIncludeKeyframes] = useState(true);
  const [includePrompts, setIncludePrompts] = useState(true);

  if (!isOpen) return null;

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  const pythonScript = `import json
import os
import time
from google import genai
from google.genai import types

# MoviePy imports (supporting both v1.x 'moviepy.editor' and v2.x 'moviepy')
try:
    from moviepy.editor import AudioFileClip, VideoFileClip, concatenate_videoclips
except ImportError:
    from moviepy import AudioFileClip, VideoFileClip, concatenate_videoclips

client = genai.Client()

# ==============================================================================
# STEP 1: Generate Master Reference Portrait via Google Imagen 3
# ==============================================================================
master_char_prompt = """
Studio character portrait of Elena, a 30-year-old pilot. 
Wearing an olive-drab flight jacket with a faded orange collar patch, 
dark auburn hair tied back in a low bun, sharp jawline, cinematic studio lighting, 
photorealistic, 8k resolution.
"""

print("1. Generating Master Reference Portrait via Imagen 3...")
if not os.path.exists("master_character.png"):
    result = client.models.generate_images(
        model="imagen-3.0-generate-002",
        prompt=master_char_prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="16:9",
            person_generation="ALLOW_ADULT",
        ),
    )
    master_image = result.generated_images[0].image
    master_image.save("master_character.png")
    print("Saved Master Character Reference Portrait: master_character.png")
else:
    print("Found existing Master Character Portrait: master_character.png")

# Load reference image bytes for character identity consistency in Veo
with open("master_character.png", "rb") as f:
    input_image_bytes = f.read()

def generate_tts(text: str, output_path: str):
    """
    Generate Voiceover TTS audio file for the scene narration.
    Uses gTTS (Google Text-to-Speech) or pyttsx3 offline engine, with wave fallback.
    """
    print(f"Synthesizing voiceover: '{text[:50]}...' -> {output_path}")
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang="en", slow=False)
        tts.save(output_path)
        return
    except ImportError:
        pass
    except Exception as e:
        print(f"gTTS error: {e}")

    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.save_to_file(text, output_path)
        engine.runAndWait()
        return
    except ImportError:
        pass
    except Exception as e:
        print(f"pyttsx3 error: {e}")

    # Fallback synthesizer to ensure standalone execution without extra packages
    import wave, math, struct
    sample_rate = 44100
    duration = max(2.5, len(text.split()) * 0.45)
    wav_path = output_path if output_path.endswith('.wav') else output_path.replace('.mp3', '.wav')
    with wave.open(wav_path, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for i in range(int(sample_rate * duration)):
            sample = int(16000 * 0.25 * math.sin(2 * math.pi * 240 * (i / sample_rate)))
            wav_file.writeframes(struct.pack('<h', sample))
    if output_path.endswith('.mp3'):
        import shutil
        shutil.copy(wav_path, output_path)

# Current StoryCast Storyboard Sequences
story_text = """
${scenes.map((s) => s.voiceoverText || s.title).join('\n\n')}
"""

# Default scenes from StoryCast workspace (can run directly without extra API calls)
WORKSPACE_SCENES = ${JSON.stringify(
  scenes.map((s) => ({
    scene_number: s.sceneNumber,
    video_prompt: s.videoPrompt,
    narration: s.voiceoverText || s.title,
    scene_location: s.sceneLocation || 'Atmospheric Set',
    time_of_day: s.timeOfDay || 'Night',
  })),
  null,
  2
)}

print("\n2. Generating locked Costume Sheet & continuity scene prompts via Gemini...")
system_prompt = """
You are an art director for a film studio.
When given a story, first create a precise, locked 'Costume Sheet' for the main characters.
Then, generate video prompts for each scene that strictly repeat the character's costume details 
to ensure visual continuity across shots.
"""

try:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"Story:\n{story_text}\n\nConvert this story into a sequence of ${scenes.length} cinematic video generation prompts with spoken narration lines.",
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema={
                "type": "object",
                "properties": {
                    "character_name": {"type": "string"},
                    "costume_lock": {
                        "type": "string",
                        "description": "Dense, repeatable description of exact garments, colors, textures, and accessories.",
                    },
                    "scenes": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "scene_number": {"type": "integer"},
                                "narration": {"type": "string"},
                                "video_prompt": {
                                    "type": "string",
                                    "description": "Scene action + camera motion, strictly integrating the costume_lock.",
                                },
                            },
                            "required": ["scene_number", "video_prompt", "narration"],
                        },
                    },
                },
                "required": ["character_name", "costume_lock", "scenes"],
            },
        ),
    )
    data = json.loads(response.text)
    print("Locked Costume:", data["costume_lock"])
    scenes = data["scenes"]
    print("Generated Continuous Scene Prompts & Narrations:", json.dumps(scenes, indent=2))
except Exception as e:
    print(f"Using workspace scenes from StoryCast project ({e})")
    scenes = WORKSPACE_SCENES

# ==============================================================================
# STEP 2: Generate Consistent Video Clips via Google Veo (Image-to-Video)
# ==============================================================================
print("\n3. Generating Consistent Character Video Clips via Google Veo...")
for scene in scenes:
    idx = scene["scene_number"]
    prompt = scene["video_prompt"]
    video_path = f"scene_{idx}.mp4"

    if not os.path.exists(video_path):
        print(f"\nSubmitting Scene {idx} with reference portrait lock: {prompt}...")
        # Call Veo with both the reference image and motion prompt for character consistency
        operation = client.models.generate_videos(
            model="veo-3.1-generate-preview",
            prompt=prompt,
            image=types.Image(image_bytes=input_image_bytes),
            config=types.GenerateVideosConfig(
                aspect_ratio="${aspectRatio === '9:16' ? '9:16' : '16:9'}",
                resolution="720p",
            ),
        )
        while not operation.done:
            print("Animating reference frame...")
            time.sleep(10)
            operation = client.operations.get(operation)

        operation.result.generated_videos[0].video.save(video_path)
        print(f"Saved: {video_path}")
    else:
        print(f"Using existing video clip: {video_path}")

# ==============================================================================
# STEP 3: Synchronize Voiceovers and Concatenate Movie with MoviePy
# ==============================================================================
print("\n4. Synchronizing voiceovers and concatenating movie with MoviePy...")
final_scene_clips = []

for scene in scenes:
    idx = scene["scene_number"]
    video_path = f"scene_{idx}.mp4"
    audio_path = f"narration_{idx}.mp3"

    # 1. Generate Voiceover
    generate_tts(scene["narration"], audio_path)

    # 2. Load Video and Audio
    video_clip = VideoFileClip(video_path)
    audio_clip = AudioFileClip(audio_path)

    # 3. Synchronize Lengths
    audio_duration = audio_clip.duration
    video_duration = video_clip.duration

    if audio_duration > video_duration:
        # Extend the video by holding the last frame
        freeze_duration = audio_duration - video_duration + 0.5  # +0.5s breathing room
        try:
            last_frame = video_clip.to_ImageClip(t=video_duration - 0.05).set_duration(
                freeze_duration
            )
        except (AttributeError, TypeError):
            # Compatibility with MoviePy v2.x
            last_frame = video_clip.image_clip(video_duration - 0.05).with_duration(freeze_duration)
        synced_video = concatenate_videoclips([video_clip, last_frame])
    else:
        # Video is longer: trim video to audio duration + 0.5s padding
        try:
            synced_video = video_clip.subclip(0, min(audio_duration + 0.5, video_duration))
        except (AttributeError, TypeError):
            # Compatibility with MoviePy v2.x
            synced_video = video_clip.subclipped(0, min(audio_duration + 0.5, video_duration))

    # 4. Attach Audio
    try:
        synced_scene = synced_video.set_audio(audio_clip)
    except AttributeError:
        synced_scene = synced_video.with_audio(audio_clip)
    final_scene_clips.append(synced_scene)

# 5. Concatenate all scenes into the complete movie
full_movie = concatenate_videoclips(final_scene_clips, method="compose")
full_movie.write_videofile(
    "story_with_narration.mp4",
    codec="libx264",
    audio_codec="aac",
    fps=24,
)

# Proper resource cleanup
for clip in final_scene_clips:
    clip.close()
full_movie.close()
print("\nFinal story video with synchronized voiceover generated: story_with_narration.mp4")
`;

  const handleCopyPython = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopiedPython(true);
    setTimeout(() => setCopiedPython(false), 2000);
  };

  const handleDownloadPythonScript = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storycast_pipeline_${Date.now()}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    setErrorMsg(null);
    setPdfDownloaded(false);
    setPdfProgress({ percent: 5, status: 'Initializing Storyboard Engine...' });

    try {
      await downloadStoryboardPdf({
        projectTitle,
        scenes,
        aspectRatio,
        musicStyle,
        layout: pdfLayout,
        orientation: pdfOrientation,
        includeKeyframes,
        includePrompts,
        onProgress: (percent, status) => {
          setPdfProgress({ percent, status });
        },
      });
      setPdfDownloaded(true);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setErrorMsg(err?.message || 'Failed to generate PDF storyboard document.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleStartExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    setDownloadUrl(null);
    setExportResult(null);

    try {
      const result = await exportMasterVideo(
        scenes,
        {
          resolutionPreset,
          containerFormat,
          aspectRatio,
          frameRate,
          bitrateMbps,
          musicStyle: soundtrackMix?.musicStyle || musicStyle,
          musicVolume: soundtrackMix?.musicVolume ?? 0.35,
          voiceoverVolume: soundtrackMix?.voiceoverVolume ?? 1.0,
          ambientSfxStyle: soundtrackMix?.ambientSfxStyle ?? 'Neon Rain & Thunder',
          ambientSfxVolume: soundtrackMix?.ambientSfxVolume ?? 0.28,
          includeAmbientSfx,
          afrobeatBpm: soundtrackMix?.afrobeatBpm ?? 108,
          percussionIntensity: soundtrackMix?.percussionIntensity ?? 0.85,
          logDrumBassBoost: soundtrackMix?.logDrumBassBoost ?? 0.80,
          customAudioUrl: soundtrackMix?.customAudioUrl ?? null,
          includeSpeech,
          includeMusic,
          enableAudioDucking,
          burnInTimecode,
          burnInSubtitles,
          burnInSceneTitle,
        },
        (info: ExportProgress) => {
          setProgressInfo(info);
        }
      );
      setExportResult(result);
      setDownloadUrl(result.videoUrl);
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMsg(err?.message || 'Failed to export master video.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0e121d] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-[#111726] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Film className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <span>Production Master Exporter</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono">
                  v2.0
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Compile Video MP4, Download PDF Storyboard & Scripts, or Python Pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting || isGeneratingPdf}
            className="text-zinc-500 hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-zinc-850 bg-[#0b0e17] text-xs shrink-0">
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'video'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Master Video (.mp4)</span>
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'pdf'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>PDF Storyboard Deck</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono ml-0.5">
              NEW
            </span>
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'python'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Python Pipeline</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'pdf' ? (
            <div className="space-y-4">
              {/* Document Overview Header */}
              <div className="bg-[#090b14] border border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">
                      {projectTitle}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Studio-grade printable PDF document with visual keyframes, scene headings & teleplay scripts.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {scenes.length} Scenes
                  </span>
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                    {totalDuration.toFixed(1)}s Runtime
                  </span>
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                    Est. {pdfLayout === 'detailed' ? scenes.length + 1 : Math.ceil(scenes.length / 2) + 1} Pages
                  </span>
                </div>
              </div>

              {/* Storyboard PDF Settings */}
              <div className="bg-[#090b14] border border-zinc-800 rounded-xl p-4 space-y-3.5">
                <h5 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Document Layout & Content Options</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Layout Mode */}
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                      Storyboard Layout Style
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#05070c] rounded-lg border border-zinc-800">
                      <button
                        onClick={() => setPdfLayout('detailed')}
                        className={`px-2.5 py-1.5 rounded-md font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                          pdfLayout === 'detailed'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        1 Scene / Page
                      </button>
                      <button
                        onClick={() => setPdfLayout('compact')}
                        className={`px-2.5 py-1.5 rounded-md font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                          pdfLayout === 'compact'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        2 Scenes / Page
                      </button>
                    </div>
                  </div>

                  {/* Orientation */}
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                      Page Orientation
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#05070c] rounded-lg border border-zinc-800">
                      <button
                        onClick={() => setPdfOrientation('landscape')}
                        className={`px-2.5 py-1.5 rounded-md font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                          pdfOrientation === 'landscape'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Landscape (16:9)
                      </button>
                      <button
                        onClick={() => setPdfOrientation('portrait')}
                        className={`px-2.5 py-1.5 rounded-md font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                          pdfOrientation === 'portrait'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Portrait (Binder)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-zinc-850/60 text-xs text-zinc-300">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeKeyframes}
                      onChange={(e) => setIncludeKeyframes(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                    />
                    <span>Capture & Embed Visual Keyframe Plates</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includePrompts}
                      onChange={(e) => setIncludePrompts(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                    />
                    <span>Include AI Video Generation Prompts</span>
                  </label>
                </div>
              </div>

              {/* Progress Box */}
              {isGeneratingPdf && (
                <div className="space-y-3 bg-[#090b14] p-4 rounded-xl border border-cyan-500/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-300 flex items-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      {pdfProgress?.status || 'Snapshotting keyframes and assembling PDF...'}
                    </span>
                    <span className="font-mono font-bold text-cyan-400">
                      {pdfProgress?.percent || 0}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pdfProgress?.percent || 0}%` }}
                      className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-400 transition-all duration-200 shadow-[0_0_12px_#00f0ff]"
                    />
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {pdfDownloaded && !isGeneratingPdf && (
                <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-emerald-300 font-mono">
                        Storyboard PDF Document Generated!
                      </h5>
                      <p className="text-[11px] text-zinc-400">
                        Downloaded to your device with keyframes, scene titles, and screenplay scripts.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleGeneratePdf}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Again</span>
                  </button>
                </div>
              )}

              {/* Scene Sequence Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Scenes & Screenplay Sequence ({scenes.length}):</span>
                  <span className="text-[11px] text-zinc-500">Includes titles, scripts, and technical shot tags</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {scenes.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-3 rounded-xl bg-[#090b14] border border-zinc-800 hover:border-zinc-700 transition-colors flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                        #{s.sceneNumber}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h6 className="text-xs font-bold text-white truncate">
                            {s.title}
                          </h6>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 shrink-0">
                            <span className="text-amber-400 font-semibold">{(s.duration || 6).toFixed(1)}s</span>
                            <span>•</span>
                            <span className="text-cyan-400">{s.cameraMotion || 'Camera'}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-300 italic line-clamp-2 leading-relaxed bg-[#05070c] p-2 rounded border border-zinc-850">
                          "{s.voiceoverText || s.title}"
                        </p>

                        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-zinc-500 font-mono flex-wrap">
                          {s.metadata?.lensFocalLength && (
                            <span className="text-amber-300 font-semibold">
                              🔭 {s.metadata.lensFocalLength} ({s.metadata.cameraAperture || 'T1.5'})
                            </span>
                          )}
                          {s.metadata?.shootingDate && (
                            <span className="text-cyan-400">📅 {s.metadata.shootingDate}</span>
                          )}
                          {s.sceneLocation && (
                            <span className="text-zinc-400">Set: {s.sceneLocation}</span>
                          )}
                          {s.timeOfDay && (
                            <span>• {s.timeOfDay}</span>
                          )}
                          {s.backgroundImage && (
                            <span className="text-cyan-400 font-semibold">• Custom BG Asset</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'python' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="text-zinc-400 font-mono truncate">
                  Veo Video + MoviePy Audio Sync Pipeline:
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleDownloadPythonScript}
                    className="px-2.5 py-1.5 rounded-lg bg-[#141d33] hover:bg-[#1e2c4d] border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download runnable Python script (.py)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .py</span>
                  </button>
                  <button
                    onClick={handleCopyPython}
                    className="px-2.5 py-1.5 rounded-lg bg-[#141d33] hover:bg-[#1e2c4d] border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedPython ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-[#060810]">
                <pre className="p-4 text-[11px] font-mono text-cyan-200 overflow-x-auto leading-relaxed max-h-[340px]">
                  {pythonScript}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0d18] border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-300">Run locally with dependencies:</p>
                <code className="text-amber-300 font-mono block bg-black/40 p-1.5 rounded">
                  pip install google-genai moviepy gTTS
                </code>
              </div>
            </div>
          ) : (
            <>
              {/* Metadata Overview */}
              <div className="grid grid-cols-4 gap-2.5 bg-[#090b12] p-3 rounded-xl border border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Scenes</span>
                  <span className="font-bold text-zinc-200">{scenes.length} Clips</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Est. Runtime</span>
                  <span className="font-bold text-amber-400">{totalDuration.toFixed(1)}s</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Aspect Ratio</span>
                  <span className="font-bold text-cyan-400">{aspectRatio}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Music Theme</span>
                  <span className="font-bold text-purple-400 truncate block">{musicStyle}</span>
                </div>
              </div>

              {/* VIDEO CONFIGURATION STAGE (When not currently exporting and no completed download) */}
              {!isExporting && !downloadUrl && (
                <div className="space-y-3.5">
                  {/* Resolution & Format Presets */}
                  <div className="bg-[#090b14] border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Resolution, Container & Frame Rate</span>
                      </h5>
                      <div className="flex items-center gap-1 bg-[#05070c] p-0.5 rounded-lg border border-zinc-800">
                        {(['mp4', 'webm'] as const).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setContainerFormat(fmt)}
                            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                              containerFormat === fmt
                                ? 'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            .{fmt} Master
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: '1080p', label: '1080p Full HD', spec: '1920x1080 · Cinema' },
                        { id: '720p', label: '720p Web / Social', spec: '1280x720 · Fast Encode' },
                        { id: '4k', label: '4K Ultra Master', spec: '3840x2160 · Studio Grade' },
                        { id: 'vertical', label: '9:16 Vertical Reel', spec: '1080x1920 · TikTok/Shorts' },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setResolutionPreset(preset.id as any)}
                          className={`p-2 rounded-lg text-left transition-all border cursor-pointer ${
                            resolutionPreset === preset.id
                              ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                              : 'bg-[#060810] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <div className="text-xs font-bold font-mono text-cyan-300">{preset.label}</div>
                          <div className="text-[10px] text-zinc-500">{preset.spec}</div>
                        </button>
                      ))}
                    </div>

                    {/* Frame Rate & Bitrate Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-850/80 text-xs">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1 font-medium flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-amber-400" />
                          <span>Frame Rate (24fps Cinema / 60fps Smooth)</span>
                        </label>
                        <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#05070c] rounded-lg border border-zinc-800">
                          {[
                            { fps: 24, label: '24 fps · Film' },
                            { fps: 30, label: '30 fps · Std' },
                            { fps: 60, label: '60 fps · Smooth' },
                          ].map((item) => (
                            <button
                              key={item.fps}
                              onClick={() => setFrameRate(item.fps)}
                              className={`py-1 rounded font-mono text-[10px] font-semibold transition-all cursor-pointer ${
                                frameRate === item.fps
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1 font-medium flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-cyan-400" />
                          <span>Target Video Bitrate</span>
                        </label>
                        <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#05070c] rounded-lg border border-zinc-800">
                          {[
                            { mbps: 4, label: '4 Mbps' },
                            { mbps: 8, label: '8 Mbps' },
                            { mbps: 16, label: '16 Mbps' },
                          ].map((b) => (
                            <button
                              key={b.mbps}
                              onClick={() => setBitrateMbps(b.mbps)}
                              className={`py-1 rounded font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                                bitrateMbps === b.mbps
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3-Track Audio Multiplex Matrix */}
                  <div className="bg-[#090b14] border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>3-Stem Multi-Track Audio Mixing & Ducking</span>
                      </h5>
                      {onOpenSoundtrackStudio && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenSoundtrackStudio();
                          }}
                          className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Music className="w-3 h-3 text-amber-400" />
                          <span>Open Afrobeat & Soundtrack Mixer</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#060810] border border-zinc-850 cursor-pointer hover:border-zinc-750 transition-colors">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-zinc-200">
                              Stem 1 · Voiceover & Dialogue ({Math.round((soundtrackMix?.voiceoverVolume ?? 1) * 100)}%)
                            </span>
                            <p className="text-[10px] text-zinc-400">
                              Stitches recorded microphone takes or synthesized character TTS across every scene.
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={includeSpeech}
                          onChange={(e) => setIncludeSpeech(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 cursor-pointer accent-cyan-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#060810] border border-zinc-850 cursor-pointer hover:border-zinc-750 transition-colors">
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-zinc-200">
                              Stem 2 · Rhythmic Score ({soundtrackMix?.musicStyle || musicStyle} · {Math.round((soundtrackMix?.musicVolume ?? 0.35) * 100)}%)
                            </span>
                            <p className="text-[10px] text-zinc-400">
                              Synthesizes poly-rhythmic Afrobeat log-drum/clave groove or custom score into master bus.
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={includeMusic}
                          onChange={(e) => setIncludeMusic(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 cursor-pointer accent-amber-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#060810] border border-zinc-850 cursor-pointer hover:border-zinc-750 transition-colors">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-zinc-200">
                              Stem 3 · Ambient Foley SFX ({soundtrackMix?.ambientSfxStyle || 'Neon Rain & Thunder'} · {Math.round((soundtrackMix?.ambientSfxVolume ?? 0.28) * 100)}%)
                            </span>
                            <p className="text-[10px] text-zinc-400">
                              Mixes continuous environmental atmosphere and diegetic sound design under the cut.
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={includeAmbientSfx}
                          onChange={(e) => setIncludeAmbientSfx(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-purple-500 cursor-pointer accent-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#060810] border border-zinc-850 cursor-pointer hover:border-zinc-750 transition-colors">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-zinc-200">Intelligent Auto-Ducking</span>
                            <p className="text-[10px] text-zinc-400">
                              Smoothly attenuates music during spoken dialogue lines and recovers on scene pauses.
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableAudioDucking}
                          disabled={!includeMusic || !includeSpeech}
                          onChange={(e) => setEnableAudioDucking(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 cursor-pointer accent-emerald-500 disabled:opacity-40"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Burn-In Overlays */}
                  <div className="bg-[#090b14] border border-zinc-800 rounded-xl p-3.5 space-y-2">
                    <h5 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Production Burn-In Overlays</span>
                    </h5>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={burnInTimecode}
                          onChange={(e) => setBurnInTimecode(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 cursor-pointer accent-cyan-500"
                        />
                        <span>SMPTE Timecode (TC 00:00:00:00)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={burnInSubtitles}
                          onChange={(e) => setBurnInSubtitles(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 cursor-pointer accent-cyan-500"
                        />
                        <span>Subtitles & Narration</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={burnInSceneTitle}
                          onChange={(e) => setBurnInSceneTitle(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 cursor-pointer accent-cyan-500"
                        />
                        <span>Scene Heading Watermark</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* REAL-TIME RENDERING STAGE */}
              {isExporting && (
                <div className="space-y-3.5 bg-[#090b14] p-4 rounded-xl border border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.12)]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-300 flex items-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span className="font-semibold">{progressInfo?.phase || 'Multiplexing Video & Audio Streams...'}</span>
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {progressInfo?.progress || 0}%
                    </span>
                  </div>

                  {/* Real-time Render Canvas Monitor */}
                  <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-black aspect-video max-h-52 flex items-center justify-center">
                    <canvas
                      ref={previewCanvasRef}
                      width={480}
                      height={270}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>REC LIVE STAGE</span>
                    </div>
                    {progressInfo?.fps && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 border border-zinc-700 text-[10px] font-mono text-amber-300 backdrop-blur-sm">
                        {progressInfo.fps} FPS · {resolutionPreset.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      style={{ width: `${progressInfo?.progress || 0}%` }}
                      className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-cyan-400 transition-all duration-200 shadow-[0_0_12px_#00f0ff]"
                    />
                  </div>

                  {/* Telemetry Grid */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] font-mono text-zinc-400 text-center">
                    <div className="p-1.5 rounded bg-[#060810] border border-zinc-850">
                      <span className="text-[9px] text-zinc-500 uppercase block">Scene</span>
                      <span className="text-white font-bold">
                        {progressInfo?.currentScene || 1}/{progressInfo?.totalScenes || scenes.length}
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-[#060810] border border-zinc-850">
                      <span className="text-[9px] text-zinc-500 uppercase block">Frames</span>
                      <span className="text-cyan-300 font-bold">
                        {progressInfo?.currentFrame || 0}/{progressInfo?.totalFrames || '...'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-[#060810] border border-zinc-850">
                      <span className="text-[9px] text-zinc-500 uppercase block">Elapsed</span>
                      <span className="text-zinc-200 font-bold">{progressInfo?.elapsedSecs || 0}s</span>
                    </div>
                    <div className="p-1.5 rounded bg-[#060810] border border-zinc-850">
                      <span className="text-[9px] text-zinc-500 uppercase block">Est. Left</span>
                      <span className="text-amber-300 font-bold">{progressInfo?.estimatedRemainingSecs || 0}s</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREENING PLAYER & DOWNLOAD READY */}
              {downloadUrl && !isExporting && (
                <div className="bg-emerald-950/20 border border-emerald-500/40 p-4 rounded-xl space-y-3.5 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-300">Master Video Ready</h4>
                        <p className="text-[11px] text-zinc-400">
                          Compiled with synchronized audio tracks & burn-in overlays.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDownloadUrl(null);
                        setExportResult(null);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 transition-colors cursor-pointer"
                    >
                      Export Different Preset
                    </button>
                  </div>

                  {/* In-Modal Video Screening Player */}
                  <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video max-h-60 flex items-center justify-center">
                    <video
                      src={downloadUrl}
                      controls
                      playsInline
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* File Metadata Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#060810] border border-zinc-800 text-xs font-mono">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="text-emerald-400 font-bold">{resolutionPreset.toUpperCase()}</span>
                      <span>•</span>
                      <span>{frameRate} FPS</span>
                      <span>•</span>
                      <span>{exportResult ? (exportResult.sizeBytes / (1024 * 1024)).toFixed(2) + ' MB' : 'Compiled'}</span>
                      <span>•</span>
                      <span>{exportResult ? exportResult.durationSecs.toFixed(1) + 's' : totalDuration.toFixed(1) + 's'}</span>
                    </div>

                    <a
                      href={downloadUrl}
                      download={exportResult?.fileName || `StoryCast_AI_Master_${Date.now()}.mp4`}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video File</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-rose-950/20 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-300 font-mono">
                  Error: {errorMsg}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#111726] border-t border-zinc-850 flex items-center justify-between gap-3 shrink-0">
          {onOpenGmail ? (
            <button
              onClick={() => {
                onClose();
                onOpenGmail();
              }}
              title="Compose pitch with scene breakdown and email via Gmail"
              className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-800/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-red-400" />
              <span>Pitch via Gmail</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isExporting || isGeneratingPdf}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {downloadUrl || pdfDownloaded ? 'Done' : 'Cancel'}
            </button>

            {activeTab === 'pdf' ? (
              <button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf || scenes.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all cursor-pointer disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPdf ? 'Generating PDF Storyboard...' : 'Download Storyboard PDF'}</span>
              </button>
            ) : activeTab === 'video' ? (
              <>
                <button
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf || scenes.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-[#141d33] hover:bg-[#1e2c4d] border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                  title="Download PDF Storyboard with keyframes and scripts"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isGeneratingPdf ? 'Building PDF...' : 'Download PDF Storyboard'}</span>
                </button>

                {!downloadUrl && (
                  <button
                    onClick={handleStartExport}
                    disabled={isExporting || scenes.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,170,0,0.35)] transition-all cursor-pointer disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'Encoding Master...' : 'Start Master Export'}</span>
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
