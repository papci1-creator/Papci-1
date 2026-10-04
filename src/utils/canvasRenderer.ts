import { Scene, AspectRatio } from '../types';

export interface RenderOptions {
  scene: Scene;
  nextScene?: Scene;
  timeInScene: number; // seconds
  transitionProgress?: number; // 0 to 1 during transition
  showSubtitles?: boolean;
  aspectRatio: AspectRatio;
  isExporting?: boolean;
  videoElement?: HTMLVideoElement | null;
  useLiveVideo?: boolean;
}

// Particle state container for smooth visual dynamics
interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
  color: string;
}

const particlePool: Map<string, Particle[]> = new Map();

function getSceneParticles(sceneId: string, type: string, width: number, height: number): Particle[] {
  if (particlePool.has(sceneId)) {
    return particlePool.get(sceneId)!;
  }
  const count = type === 'rain' ? 120 : type === 'embers' ? 60 : 70;
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: type === 'embers' ? Math.random() * 3 + 1.5 : Math.random() * 2 + 1,
      speedX: type === 'rain' ? -1 - Math.random() * 2 : (Math.random() - 0.5) * 1.5,
      speedY: type === 'rain' ? 8 + Math.random() * 10 : type === 'embers' ? -1.5 - Math.random() * 2 : (Math.random() - 0.5) * 0.8,
      alpha: Math.random() * 0.7 + 0.3,
      color: type === 'embers' ? '#ffaa00' : type === 'rain' ? '#00f0ff' : '#ffffff',
    });
  }
  particlePool.set(sceneId, particles);
  return particles;
}

export function renderCinematicFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: RenderOptions
) {
  const { scene, timeInScene, transitionProgress = 0, showSubtitles = true, isExporting = false } = options;
  const progress = Math.min(1, Math.max(0, timeInScene / (scene.duration || 6)));

  // Dynamic Camera Matrix calculated based on scene.cameraMotion
  const motion = (scene.cameraMotion || '').toLowerCase();
  const isEven = scene.sceneNumber % 2 === 0;

  let zoom = 1.0;
  let panX = 0;
  let panY = 0;
  let rotation = 0;

  if (motion.includes('static')) {
    // Locked-off tripod shot
    zoom = 1.0;
    panX = 0;
    panY = 0;
  } else if (motion.includes('pan')) {
    // Smooth lateral pan sweep
    zoom = 1.02;
    panX = isEven ? (progress - 0.5) * 80 : (0.5 - progress) * 80;
    panY = 0;
  } else if (motion.includes('zoom')) {
    // Distinct push-in dolly zoom
    zoom = 1.0 + progress * 0.22;
    panX = 0;
    panY = (progress - 0.5) * 10;
  } else if (motion.includes('orbit')) {
    // Elliptical orbital arc around subject
    zoom = 1.06 + Math.sin(progress * Math.PI) * 0.08;
    panX = Math.cos(progress * Math.PI) * 45;
    panY = Math.sin(progress * Math.PI) * 20;
    rotation = (progress - 0.5) * 0.015; // subtle tilt roll
  } else {
    // Dynamic AI default: gentle cinematic push-in and dolly
    zoom = 1.0 + progress * 0.12;
    panX = isEven ? (progress - 0.5) * 40 : (0.5 - progress) * 40;
    panY = (progress - 0.5) * 15;
  }

  // Scale camera transform by user-tuned motion intensity (e.g., 0.5x Slow to 2.0x Fast)
  const intensity = typeof scene.cameraSpeed === 'number'
    ? scene.cameraSpeed
    : scene.cameraIntensity === 'Slow'
    ? 0.55
    : scene.cameraIntensity === 'Fast'
    ? 1.85
    : scene.cameraIntensity === 'Dynamic'
    ? 1.4
    : 1.0;

  panX *= intensity;
  panY *= intensity;
  rotation *= intensity;
  zoom = 1.0 + (zoom - 1.0) * intensity;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Apply camera transform around center
  ctx.translate(width / 2 + panX, height / 2 + panY);
  ctx.scale(zoom, zoom);
  if (rotation !== 0) {
    ctx.rotate(rotation);
  }
  ctx.translate(-width / 2, -height / 2);

  const style = scene.visualStyle.toLowerCase();
  const theme = scene.visualTheme || {
    primaryColor: '#00f0ff',
    accentColor: '#ffaa00',
    particleType: 'rain',
  };

  let hasDrawnLiveVideo = false;
  if (options.useLiveVideo && options.videoElement && options.videoElement.readyState >= 2) {
    try {
      ctx.drawImage(options.videoElement, 0, 0, width, height);

      // Subtle atmospheric tint matching scene theme
      ctx.fillStyle = 'rgba(5, 7, 15, 0.12)';
      ctx.fillRect(0, 0, width, height);
      hasDrawnLiveVideo = true;
    } catch {
      hasDrawnLiveVideo = false;
    }
  }

  // 1. SKY & BACKGROUND ATMOSPHERE (if not rendering live video stream)
  if (!hasDrawnLiveVideo) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (style.includes('cyberpunk')) {
      bgGrad.addColorStop(0, '#050510');
      bgGrad.addColorStop(0.5, '#0e0b24');
      bgGrad.addColorStop(1, '#1b0d2d');
    } else if (style.includes('anime')) {
      bgGrad.addColorStop(0, '#102a45');
      bgGrad.addColorStop(0.4, '#1b4b72');
      bgGrad.addColorStop(0.7, '#6b5478');
      bgGrad.addColorStop(1, '#b56c66');
    } else if (style.includes('retro') || style.includes('synthwave')) {
      bgGrad.addColorStop(0, '#0a001a');
      bgGrad.addColorStop(0.5, '#220038');
      bgGrad.addColorStop(0.8, '#590059');
      bgGrad.addColorStop(1, '#ff3366');
    } else if (style.includes('fantasy')) {
      bgGrad.addColorStop(0, '#060a0f');
      bgGrad.addColorStop(0.5, '#0b1622');
      bgGrad.addColorStop(1, '#1a221b');
    } else {
      // Cinematic Hollywood
      bgGrad.addColorStop(0, '#04070c');
      bgGrad.addColorStop(0.5, '#091522');
      bgGrad.addColorStop(1, '#122533');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-60, -60, width + 120, height + 120);
  }

  // 2. CELESTIAL OR NEON GLOW (Sun, Moon, or Cyber Neon Sun)
  const sunX = isEven ? width * 0.75 : width * 0.25;
  const sunY = height * 0.38;
  const sunRad = width * 0.18;

  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRad);
  if (style.includes('cyberpunk') || style.includes('synthwave')) {
    sunGlow.addColorStop(0, 'rgba(255, 0, 128, 0.85)');
    sunGlow.addColorStop(0.5, 'rgba(0, 240, 255, 0.4)');
    sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
  } else if (style.includes('anime')) {
    sunGlow.addColorStop(0, 'rgba(255, 235, 170, 0.9)');
    sunGlow.addColorStop(0.4, 'rgba(255, 140, 80, 0.5)');
    sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    sunGlow.addColorStop(0, 'rgba(255, 200, 100, 0.7)');
    sunGlow.addColorStop(0.4, 'rgba(0, 200, 255, 0.25)');
    sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
  }
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRad, 0, Math.PI * 2);
  ctx.fill();

  // Synthwave horizontal sun blinds if applicable
  if (style.includes('synthwave')) {
    ctx.fillStyle = '#0a001a';
    for (let b = 0; b < 6; b++) {
      const by = sunY + b * 12 + 6;
      ctx.fillRect(sunX - sunRad, by, sunRad * 2, 4 + b * 1.5);
    }
  }

  // 3. DISTANT SILHOUETTES / SKYLINE (Layer 1 Parallax)
  const p1Offset = panX * 0.3;
  ctx.fillStyle = style.includes('cyberpunk') ? '#080816' : '#050a12';
  ctx.beginPath();
  ctx.moveTo(-100, height);
  const step = width / 12;
  for (let i = 0; i <= 14; i++) {
    const sx = (i - 1) * step + p1Offset;
    // Pseudorandom procedural silhouette heights based on scene seed
    const pseudoH = Math.sin(i * 1.7 + (scene.sceneNumber * 3)) * 0.5 + 0.5;
    const sy = height * 0.48 + (1 - pseudoH) * (height * 0.2);
    ctx.lineTo(sx, sy);
    ctx.lineTo(sx + step * 0.85, sy);
  }
  ctx.lineTo(width + 100, height);
  ctx.closePath();
  ctx.fill();

  // Neon Windows / Cyber Spires in distant layer
  if (style.includes('cyberpunk') || style.includes('synthwave')) {
    ctx.fillStyle = theme.accentColor || '#ffaa00';
    for (let i = 1; i < 12; i += 2) {
      const bx = i * step + p1Offset + 10;
      const by = height * 0.55;
      for (let r = 0; r < 4; r++) {
        if ((i + r) % 2 === 0) {
          ctx.fillRect(bx, by + r * 14, 5, 7);
        }
      }
    }
  }

  // 4. MIDGROUND FOCUS STRUCTURE & ENVIRONMENT (Layer 2 Parallax)
  const p2Offset = panX * 0.6;
  ctx.fillStyle = style.includes('cyberpunk') ? '#0c0e1a' : '#0a1017';
  ctx.beginPath();
  ctx.moveTo(-80, height);
  for (let j = 0; j <= 8; j++) {
    const mx = (j - 0.5) * (width / 6) + p2Offset;
    const mHeight = (Math.cos(j * 2.3 + scene.sceneNumber) * 0.5 + 0.5) * (height * 0.35);
    const my = height * 0.62 - mHeight;
    ctx.lineTo(mx, my);
    ctx.lineTo(mx + 70, my);
  }
  ctx.lineTo(width + 80, height);
  ctx.closePath();
  ctx.fill();

  // Cyan Neon Outlines & Highlights on Midground Buildings
  ctx.strokeStyle = theme.primaryColor || '#00f0ff';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = theme.primaryColor || '#00f0ff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let j = 1; j <= 5; j += 2) {
    const mx = j * (width / 5) + p2Offset;
    ctx.moveTo(mx, height * 0.65);
    ctx.lineTo(mx + 60, height * 0.65);
    ctx.lineTo(mx + 60, height * 0.85);
  }
  ctx.stroke();
  ctx.shadowBlur = 0; // reset shadow

  // 5. FOREGROUND GROUND / REFLECTIVE ROAD / SHADOWS
  const groundGrad = ctx.createLinearGradient(0, height * 0.68, 0, height);
  if (style.includes('cyberpunk')) {
    groundGrad.addColorStop(0, '#0c071a');
    groundGrad.addColorStop(0.4, '#130c24');
    groundGrad.addColorStop(1, '#05020a');
  } else {
    groundGrad.addColorStop(0, '#070b10');
    groundGrad.addColorStop(1, '#020406');
  }
  ctx.fillStyle = groundGrad;
  ctx.fillRect(-100, height * 0.72, width + 200, height * 0.35);

  // Reflective wet pavement streaks
  ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
  for (let s = 0; s < 5; s++) {
    const rx = width * 0.15 + s * (width * 0.18) + (progress * 15);
    ctx.fillRect(rx, height * 0.78, 40, height * 0.22);
  }

  // 6. ATMOSPHERIC PARTICLES (Rain, Embers, Cosmic Dust)
  const particles = getSceneParticles(scene.id, theme.particleType || 'rain', width, height);
  ctx.lineWidth = 1.5;
  particles.forEach((p) => {
    p.x += p.speedX;
    p.y += p.speedY;

    if (p.y > height) {
      p.y = -10;
      p.x = Math.random() * width;
    }
    if (p.x < -20) p.x = width + 10;
    if (p.x > width + 20) p.x = -10;

    if (theme.particleType === 'rain') {
      ctx.strokeStyle = `rgba(0, 240, 255, ${p.alpha * 0.65})`;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.speedX * 1.5, p.y + p.speedY * 1.5);
      ctx.stroke();
    } else if (theme.particleType === 'embers') {
      ctx.fillStyle = `rgba(255, 170, 0, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 7. CINEMATIC ANAMORPHIC FLARE
  const flareX = sunX + (progress - 0.5) * 80;
  const flareGrad = ctx.createLinearGradient(flareX - width * 0.4, sunY, flareX + width * 0.4, sunY);
  flareGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
  flareGrad.addColorStop(0.45, 'rgba(0, 240, 255, 0.15)');
  flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
  flareGrad.addColorStop(0.55, 'rgba(255, 170, 0, 0.15)');
  flareGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

  ctx.fillStyle = flareGrad;
  ctx.fillRect(0, sunY - 4, width, 8);

  ctx.restore(); // Restore camera matrix

  // 8. VIGNETTE & LETTERBOX
  const vigGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.75);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(0.7, 'rgba(0,0,0,0.3)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, width, height);

  // 9. CINEMATIC OVERLAYS & HUD (Director Watermark / Timestamp)
  ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillText(
    `[REC] ${scene.videoGenerator.toUpperCase()} // SCENE ${scene.sceneNumber.toString().padStart(2, '0')} // ${scene.cameraMotion.toUpperCase()}`,
    24,
    32
  );

  // 10. SUBTITLES & LOWER-THIRD CAPTIONS
  if (showSubtitles && scene.voiceoverText) {
    const text = scene.voiceoverText;
    const boxW = Math.min(width * 0.85, 800);
    const boxX = (width - boxW) / 2;
    const boxY = height - 90;

    // Subtle dark translucent backdrop
    ctx.fillStyle = 'rgba(5, 7, 12, 0.75)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, 58, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Voice narration text
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Truncate or fit narration text cleanly
    let displayText = text;
    if (displayText.length > 95) {
      displayText = displayText.slice(0, 92) + '...';
    }
    ctx.fillText(displayText, width / 2, boxY + 29);

    // Accent line under caption
    ctx.fillStyle = theme.accentColor || '#ffaa00';
    ctx.fillRect(width / 2 - 30, boxY + 54, 60, 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // 11. SCENE TRANSITION EFFECTS
  const effect = scene.transitionEffect || 'Dissolve';
  if (transitionProgress > 0 && effect !== 'None') {
    const t = Math.max(0, Math.min(1, transitionProgress));
    const bell = Math.sin(t * Math.PI); // 0 -> 1 -> 0

    if (effect === 'Fade') {
      // Classic Cinematic Blackout Dip
      ctx.fillStyle = `rgba(4, 5, 8, ${bell * 0.98})`;
      ctx.fillRect(0, 0, width, height);
    } else if (effect === 'Glitch') {
      // Cyberpunk Chromatic RGB Split & Sliced Scanlines
      const sliceCount = 8;
      ctx.save();
      for (let i = 0; i < sliceCount; i++) {
        const sliceY = (height / sliceCount) * i;
        const sliceH = height / sliceCount;
        const offset = ((i % 2 === 0 ? 1 : -1) * bell * 50) * Math.sin(i * 3.7 + t * 20);

        // Cyan slice
        ctx.fillStyle = `rgba(0, 240, 255, ${bell * 0.35})`;
        ctx.fillRect(offset, sliceY, width, sliceH);

        // Magenta slice
        ctx.fillStyle = `rgba(255, 0, 128, ${bell * 0.35})`;
        ctx.fillRect(-offset, sliceY + 2, width, sliceH - 4);
      }

      // Digital horizontal static stripes
      ctx.fillStyle = `rgba(255, 255, 255, ${bell * 0.25})`;
      for (let s = 0; s < 5; s++) {
        const sy = ((s * 73 + t * 400) % height);
        ctx.fillRect(0, sy, width, 2 + bell * 4);
      }
      ctx.restore();
    } else if (effect === 'Cinematic Wipe') {
      // Anamorphic Light Bar Sweep
      const beamX = t * (width + 300) - 150;
      const wipeGrad = ctx.createLinearGradient(beamX - 100, 0, beamX + 100, 0);
      wipeGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      wipeGrad.addColorStop(0.35, 'rgba(0, 240, 255, 0.4)');
      wipeGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
      wipeGrad.addColorStop(0.65, 'rgba(255, 170, 0, 0.4)');
      wipeGrad.addColorStop(1, 'rgba(255, 170, 0, 0)');

      // Trailing wipe cover
      ctx.fillStyle = `rgba(6, 8, 14, ${t < 0.5 ? t * 1.5 : (1 - t) * 1.5})`;
      ctx.fillRect(0, 0, beamX, height);

      ctx.fillStyle = wipeGrad;
      ctx.fillRect(beamX - 100, 0, 200, height);
    } else {
      // 'Dissolve' - Smooth Cross Dissolve with soft atmospheric bloom
      ctx.fillStyle = `rgba(8, 12, 22, ${bell * 0.75})`;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.6);
      glow.addColorStop(0, `rgba(0, 240, 255, ${bell * 0.25})`);
      glow.addColorStop(0.6, `rgba(255, 170, 0, ${bell * 0.15})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }
  }
}
