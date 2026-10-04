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
  const [isExporting, setIsExporting] = useState(false);
  const [progressInfo, setProgressInfo] = useState<ExportProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

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

        {/* Content */}
        <div className="p-6 space-y-5">
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
