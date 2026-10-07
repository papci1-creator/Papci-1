import React, { useState } from 'react';
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
} from 'lucide-react';
import { Scene, AspectRatio } from '../types';
import { exportMasterVideo, ExportProgress } from '../utils/exportMaster';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  aspectRatio: AspectRatio;
  musicStyle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  scenes,
  aspectRatio,
  musicStyle,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'python'>('video');
  const [isExporting, setIsExporting] = useState(false);
  const [progressInfo, setProgressInfo] = useState<ExportProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPython, setCopiedPython] = useState(false);

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

  const handleStartExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    setDownloadUrl(null);

    try {
      const url = await exportMasterVideo(scenes, aspectRatio, musicStyle, (info) => {
        setProgressInfo(info);
      });
      setDownloadUrl(url);
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMsg(err?.message || 'Failed to export master video.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0e121d] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-[#111726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Film className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Master Video Compiler
              </h3>
              <p className="text-[11px] text-zinc-400">
                Compile all scenes & audio into a seamless MP4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-zinc-500 hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-zinc-850 bg-[#0b0e17] text-xs">
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'video'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Browser Master Compiler</span>
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'python'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Python Pipeline (Veo + MoviePy)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'python' ? (
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
              <div className="grid grid-cols-3 gap-3 bg-[#090b12] p-3.5 rounded-xl border border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Scenes</span>
                  <span className="font-bold text-zinc-200">{scenes.length} Clips</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Runtime</span>
                  <span className="font-bold text-amber-400">{totalDuration} Seconds</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Aspect Ratio</span>
                  <span className="font-bold text-cyan-400">{aspectRatio}</span>
                </div>
              </div>

              {/* Exporting Progress View */}
              {isExporting && (
                <div className="space-y-3 bg-[#090b12] p-4 rounded-xl border border-cyan-500/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-300 flex items-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      {progressInfo?.phase || 'Initializing Media Engine...'}
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {progressInfo?.progress || 0}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progressInfo?.progress || 0}%` }}
                      className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-cyan-400 transition-all duration-200 shadow-[0_0_12px_#00f0ff]"
                    />
                  </div>

                  <p className="text-[11px] text-zinc-500 text-center font-mono">
                    Multiplexing canvas video frames, atmospheric particles, and audio layers...
                  </p>
                </div>
              )}

              {/* Success Download Ready */}
              {downloadUrl && !isExporting && (
                <div className="bg-emerald-950/20 border border-emerald-500/40 p-4 rounded-xl space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300">
                      Master Export Complete!
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Your synchronized cinematic video has been compiled and downloaded.
                    </p>
                  </div>

                  <a
                    href={downloadUrl}
                    download={`StoryCast_AI_Master_${Date.now()}.mp4`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Re-Download Video File</span>
                  </a>
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
        <div className="px-6 py-4 bg-[#111726] border-t border-zinc-850 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            {downloadUrl ? 'Done' : 'Cancel'}
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
        </div>
      </div>
    </div>
  );
};
