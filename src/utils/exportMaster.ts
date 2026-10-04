import { Scene, AspectRatio } from '../types';
import { renderCinematicFrame } from './canvasRenderer';
import { audioEngine } from './audioEngine';

export interface ExportProgress {
  progress: number; // 0 to 100
  phase: string;
  currentScene: number;
  totalScenes: number;
}

export async function exportMasterVideo(
  scenes: Scene[],
  aspectRatio: AspectRatio,
  musicStyle: string,
  onProgress: (info: ExportProgress) => void
): Promise<string> {
  if (!scenes || scenes.length === 0) {
    throw new Error('No scenes available to export.');
  }

  // Calculate resolution
  let width = 1920;
  let height = 1080;
  if (aspectRatio === '9:16') {
    width = 1080;
    height = 1920;
  } else if (aspectRatio === '2.39:1') {
    width = 1920;
    height = 803;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create offscreen canvas context.');
  }

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const fps = 30;
  const totalFrames = Math.round(totalDuration * fps);

  // Capture canvas video stream
  const canvasStream = canvas.captureStream(fps);

  // Combine with Audio Destination if available
  const audioDest = audioEngine.getMediaStreamDestination();
  const combinedStream = new MediaStream();

  canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
  if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
    audioDest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
  }

  // Start background music during export capture
  audioEngine.startMusic(musicStyle);

  // Determine supported mime type
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
    mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
  } else if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    mimeType = 'video/webm;codecs=vp8,opus';
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 6000000, // 6 Mbps high quality
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start(100);

  // Sequentially render every frame
  let currentSceneIdx = 0;
  let timeInCurrentScene = 0;
  const frameDuration = 1 / fps;

  for (let frame = 0; frame < totalFrames; frame++) {
    const currentScene = scenes[currentSceneIdx];
    const transitionDuration = 0.75; // 750ms transition
    let transitionProgress = 0;
    const timeRemaining = currentScene.duration - timeInCurrentScene;

    // Calculate transition progress approaching clip boundary
    if (currentSceneIdx < scenes.length - 1 && timeRemaining <= transitionDuration) {
      transitionProgress = 1 - (timeRemaining / transitionDuration);
    } else if (timeInCurrentScene < 0.25 && currentSceneIdx > 0) {
      // Soft finish into next clip
      transitionProgress = 1 - (timeInCurrentScene / 0.25);
    }

    renderCinematicFrame(ctx, width, height, {
      scene: currentScene,
      nextScene: scenes[currentSceneIdx + 1],
      timeInScene: timeInCurrentScene,
      transitionProgress,
      aspectRatio,
      showSubtitles: true,
      isExporting: true,
    });

    timeInCurrentScene += frameDuration;
    if (timeInCurrentScene >= currentScene.duration && currentSceneIdx < scenes.length - 1) {
      currentSceneIdx++;
      timeInCurrentScene = 0;
    }

    const pct = Math.round(((frame + 1) / totalFrames) * 100);
    if (frame % 10 === 0 || frame === totalFrames - 1) {
      onProgress({
        progress: pct,
        phase: `Encoding Frame ${frame + 1}/${totalFrames} (Scene ${currentSceneIdx + 1})`,
        currentScene: currentSceneIdx + 1,
        totalScenes: scenes.length,
      });
      // Yield to event loop to allow recorder to process chunks and prevent UI lock
      await new Promise((r) => setTimeout(r, 4));
    }
  }

  // Stop music & recorder
  audioEngine.stopMusic();

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);

      // Trigger automatic file download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `StoryCast_AI_Master_${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      resolve(downloadUrl);
    };

    recorder.onerror = (err) => {
      reject(err);
    };

    setTimeout(() => {
      recorder.stop();
    }, 200);
  });
}
