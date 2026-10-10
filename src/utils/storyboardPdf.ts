import { jsPDF } from 'jspdf';
import { Scene, AspectRatio } from '../types';
import { renderCinematicFrame } from './canvasRenderer';

export interface StoryboardPdfOptions {
  projectTitle: string;
  scenes: Scene[];
  aspectRatio: AspectRatio;
  musicStyle?: string;
  layout?: 'detailed' | 'compact'; // detailed = 1 scene/page, compact = 2 scenes/page
  orientation?: 'landscape' | 'portrait';
  includeKeyframes?: boolean;
  includePrompts?: boolean;
  authorName?: string;
  onProgress?: (progress: number, status: string) => void;
}

/**
 * Preloads an image URL into an HTMLImageElement and waits for it to be ready.
 */
function preloadImage(url: string, timeoutMs = 800): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(img.naturalWidth > 0 ? img : null);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(null);
      }
    };

    img.src = url;
    if (img.complete && img.naturalWidth > 0) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(img);
      }
    }
  });
}

/**
 * Renders a keyframe for a scene to a high-resolution data URL (JPEG).
 */
export async function captureSceneKeyframe(
  scene: Scene,
  aspectRatio: AspectRatio,
  width = 960,
  height = 540
): Promise<string> {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (scene.backgroundImage) {
    await preloadImage(scene.backgroundImage);
  }

  // Sample around 40% into scene duration for stable, representative keyframe
  const midTime = Math.max(0.5, (scene.duration || 6) * 0.4);

  try {
    renderCinematicFrame(ctx, width, height, {
      scene,
      timeInScene: midTime,
      aspectRatio,
      showSubtitles: false,
      isExporting: true,
    });
    return canvas.toDataURL('image/jpeg', 0.86);
  } catch (err) {
    console.warn('Keyframe snapshot warning for scene', scene.id, err);
    return '';
  }
}

/**
 * Generates and downloads a complete PDF Storyboard Document.
 */
export async function generateStoryboardPdf(options: StoryboardPdfOptions): Promise<Blob> {
  const {
    projectTitle = 'Untitled StoryCast Production',
    scenes,
    aspectRatio,
    musicStyle = 'Cinematic Sci-Fi',
    layout = 'detailed',
    orientation = 'landscape',
    includeKeyframes = true,
    includePrompts = true,
    authorName = 'StoryCast Production Studio',
    onProgress,
  } = options;

  onProgress?.(5, 'Initializing Storyboard Engine...');

  const isLandscape = orientation === 'landscape';
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 0), 0);

  // 1. Capture Keyframe Data URLs in parallel/sequence
  const keyframes: Record<string, string> = {};
  if (includeKeyframes && scenes.length > 0) {
    onProgress?.(15, `Snapshotting keyframes (0/${scenes.length})...`);
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      const percent = Math.round(15 + ((i + 1) / scenes.length) * 45);
      onProgress?.(percent, `Snapshotting Scene ${s.sceneNumber}: "${s.title}"...`);
      try {
        const kfUrl = await captureSceneKeyframe(s, aspectRatio, 960, 540);
        if (kfUrl) {
          keyframes[s.id] = kfUrl;
        }
      } catch {
        // continue gracefully
      }
    }
  }

  onProgress?.(65, 'Formatting PDF cover and layout pages...');

  // ============================================================================
  // COVER PAGE
  // ============================================================================
  // Deep studio background
  doc.setFillColor(13, 17, 28);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border lines
  doc.setDrawColor(0, 240, 255);
  doc.setLineWidth(0.6);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');

  doc.setDrawColor(255, 170, 0);
  doc.setLineWidth(0.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

  // Studio Badge Header
  doc.setTextColor(0, 240, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('STORYCAST AI CINEMATIC STUDIOS  //  PRODUCTION MASTER DECK', 16, 20);

  // Big Project Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  const titleLines = doc.splitTextToSize(projectTitle.toUpperCase(), pageWidth - 40);
  doc.text(titleLines, 16, 34);

  const titleBottomY = 34 + (titleLines.length - 1) * 10;

  // Deck Subtitle
  doc.setTextColor(255, 170, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DIRECTOR\'S SHOOTING STORYBOARD & SCREENPLAY SPECIFICATION', 16, titleBottomY + 8);

  // Metadata Grid Cards
  const metaBoxY = titleBottomY + 16;
  const colW = (pageWidth - 32) / 4;

  const metadataCards = [
    { label: 'TOTAL SCENES', val: `${scenes.length} Sequences` },
    { label: 'TOTAL RUNTIME', val: `${totalDuration.toFixed(1)} Seconds` },
    { label: 'FRAME RATIO', val: aspectRatio },
    { label: 'AUDIO SCORING', val: musicStyle },
  ];

  metadataCards.forEach((card, idx) => {
    const bx = 16 + idx * colW;
    doc.setFillColor(20, 26, 44);
    doc.roundedRect(bx, metaBoxY, colW - 4, 16, 2, 2, 'F');
    doc.setDrawColor(40, 52, 80);
    doc.setLineWidth(0.2);
    doc.roundedRect(bx, metaBoxY, colW - 4, 16, 2, 2, 'S');

    doc.setTextColor(140, 155, 180);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(card.label, bx + 3, metaBoxY + 5);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(card.val, bx + 3, metaBoxY + 12);
  });

  // Table of Scenes / Synopsis on Cover
  const tableTopY = metaBoxY + 24;
  doc.setTextColor(0, 240, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SCENE BREAKDOWN & SEQUENTIAL LOGLINE', 16, tableTopY);

  let curTableY = tableTopY + 5;
  const maxTableRows = isLandscape ? 6 : 8;
  const rowsToShow = scenes.slice(0, maxTableRows);

  // Header row
  doc.setFillColor(25, 34, 58);
  doc.rect(16, curTableY, pageWidth - 32, 6, 'F');
  doc.setTextColor(200, 220, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('#', 19, curTableY + 4.2);
  doc.text('SCENE TITLE', 27, curTableY + 4.2);
  doc.text('LOCATION / ENVIRONMENT', 95, curTableY + 4.2);
  doc.text('CAMERA MOTION', 170, curTableY + 4.2);
  doc.text('DUR', pageWidth - 26, curTableY + 4.2);

  curTableY += 7;

  rowsToShow.forEach((sc, i) => {
    doc.setFillColor(i % 2 === 0 ? 17 : 22, i % 2 === 0 ? 22 : 30, i % 2 === 0 ? 38 : 50);
    doc.rect(16, curTableY, pageWidth - 32, 6.5, 'F');

    doc.setTextColor(255, 170, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${sc.sceneNumber}`, 19, curTableY + 4.5);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    const safeTitle = sc.title.length > 36 ? sc.title.slice(0, 34) + '...' : sc.title;
    doc.text(safeTitle, 27, curTableY + 4.5);

    doc.setTextColor(170, 190, 215);
    doc.setFont('helvetica', 'normal');
    const safeLoc = (sc.sceneLocation || sc.visualStyle || 'Atmospheric Set').slice(0, 40);
    doc.text(safeLoc, 95, curTableY + 4.5);

    const safeCam = (sc.cameraMotion || 'Dynamic AI').slice(0, 24);
    doc.text(safeCam, 170, curTableY + 4.5);

    doc.setTextColor(0, 240, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(sc.duration || 6).toFixed(1)}s`, pageWidth - 26, curTableY + 4.5);

    curTableY += 7.5;
  });

  if (scenes.length > maxTableRows) {
    doc.setTextColor(140, 160, 190);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text(`+ ${scenes.length - maxTableRows} additional scenes detailed in storyboard pages below...`, 18, curTableY + 4);
  }

  // Cover Page Footer
  doc.setTextColor(110, 130, 160);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Production: ${authorName}  •  Document generated: ${new Date().toLocaleDateString()}  •  StoryCast Studio AI`,
    16,
    pageHeight - 12
  );

  // ============================================================================
  // STORYBOARD SCENE PAGES
  // ============================================================================
  onProgress?.(75, 'Assembling scene shot sheets and keyframe plates...');

  if (layout === 'detailed') {
    // 1 SCENE PER PAGE
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      doc.addPage();

      // Page background
      doc.setFillColor(11, 14, 23);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Outer bounding line
      doc.setDrawColor(30, 42, 65);
      doc.setLineWidth(0.3);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');

      // Top Scene Header Bar
      doc.setFillColor(18, 24, 40);
      doc.rect(8, 8, pageWidth - 16, 16, 'F');
      doc.setDrawColor(0, 240, 255);
      doc.setLineWidth(0.4);
      doc.line(8, 24, pageWidth - 8, 24);

      // Scene Badge
      doc.setFillColor(255, 170, 0);
      doc.roundedRect(12, 11, 24, 10, 1.5, 1.5, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`SCENE #${s.sceneNumber}`, 14, 17.5);

      // Scene Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      const sceneTitleClean = s.title.toUpperCase();
      doc.text(sceneTitleClean, 40, 17.5);

      // Pills on top right
      doc.setTextColor(0, 240, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(
        `TIME: ${(s.duration || 6).toFixed(1)}s  |  ${s.timeOfDay || 'Night'}  |  ${aspectRatio}`,
        pageWidth - 75,
        17.5
      );

      if (isLandscape) {
        // Landscape layout: Left side keyframe (large), right side script & director notes
        const kfX = 14;
        const kfY = 30;
        const kfW = 128;
        const kfH = 72; // exact 16:9 ratio

        // Keyframe border frame
        doc.setFillColor(5, 7, 12);
        doc.rect(kfX - 1, kfY - 1, kfW + 2, kfH + 2, 'F');
        doc.setDrawColor(0, 240, 255);
        doc.setLineWidth(0.3);
        doc.rect(kfX - 1, kfY - 1, kfW + 2, kfH + 2, 'S');

        const kfUrl = keyframes[s.id];
        if (kfUrl) {
          try {
            doc.addImage(kfUrl, 'JPEG', kfX, kfY, kfW, kfH);
          } catch {
            // fallback box if addImage fails
            doc.setFillColor(20, 25, 40);
            doc.rect(kfX, kfY, kfW, kfH, 'F');
            doc.setTextColor(100, 120, 150);
            doc.setFont('helvetica', 'italic');
            doc.text('Keyframe rendering unavailable', kfX + 35, kfY + 36);
          }
        } else {
          doc.setFillColor(18, 22, 35);
          doc.rect(kfX, kfY, kfW, kfH, 'F');
          doc.setTextColor(120, 140, 170);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(`[ KEYFRAME: ${s.visualStyle} ]`, kfX + 30, kfY + 36);
        }

        // Camera & Technical specs box below keyframe
        const techY = kfY + kfH + 5;
        const techH = pageHeight - techY - 18;
        doc.setFillColor(16, 21, 35);
        doc.roundedRect(kfX, techY, kfW, techH, 2, 2, 'F');
        doc.setDrawColor(35, 48, 75);
        doc.roundedRect(kfX, techY, kfW, techH, 2, 2, 'S');

        doc.setTextColor(0, 240, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('CINEMATOGRAPHIC SPECIFICATIONS', kfX + 4, techY + 6);

        const transitionName = s.transitionEffect ? `${s.transitionEffect} (0.5s)` : 'Cut (0.5s)';
        const techItems = [
          { label: 'Camera Motion:', val: `${s.cameraMotion || 'Dynamic AI'} (${s.cameraIntensity || 'Normal'})` },
          { label: 'Environment / Set:', val: s.sceneLocation || 'Atmospheric Stage' },
          { label: 'Visual Style Theme:', val: s.visualStyle || 'Cinematic' },
          { label: 'Transition Effect:', val: transitionName },
          { label: 'Cast Characters:', val: s.detectedCharacters?.join(', ') || 'Lead Performer' },
          { label: 'Audio / Sound FX:', val: s.soundFx || 'Ambient Cinematic Score' },
        ];

        let techCurY = techY + 12;
        techItems.forEach((item) => {
          doc.setTextColor(130, 150, 180);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.text(item.label, kfX + 4, techCurY);

          doc.setTextColor(240, 245, 255);
          doc.setFont('helvetica', 'normal');
          doc.text(item.val, kfX + 38, techCurY);
          techCurY += 6.5;
        });

        // Right side: Screenplay voiceover script & Video Prompt
        const rightX = kfX + kfW + 8;
        const rightW = pageWidth - rightX - 14;

        // 1. Screenplay Voiceover Box
        const scriptBoxY = 30;
        const scriptBoxH = 75;
        doc.setFillColor(16, 21, 35);
        doc.roundedRect(rightX, scriptBoxY, rightW, scriptBoxH, 2, 2, 'F');
        doc.setDrawColor(255, 170, 0);
        doc.setLineWidth(0.3);
        doc.roundedRect(rightX, scriptBoxY, rightW, scriptBoxH, 2, 2, 'S');

        // Header
        doc.setFillColor(255, 170, 0);
        doc.rect(rightX + 4, scriptBoxY + 3, 2, 6, 'F');
        doc.setTextColor(255, 170, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('SCREENPLAY SCRIPT & SPOKEN VOICEOVER', rightX + 8, scriptBoxY + 8);

        // Character Name slug
        doc.setTextColor(200, 220, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const speakerTag = s.detectedCharacters?.[0] ? s.detectedCharacters[0].toUpperCase() : 'NARRATOR / PROTAGONIST';
        doc.text(`[ ${speakerTag} (V.O.) ]`, rightX + 8, scriptBoxY + 16);

        // Voiceover Dialogue Text
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const scriptText = s.voiceoverText || s.title || '(No voiceover recorded for this shot)';
        const scriptLines = doc.splitTextToSize(`"${scriptText}"`, rightW - 16);
        doc.text(scriptLines, rightX + 8, scriptBoxY + 23);

        // 2. AI Video Generation Prompt Box
        if (includePrompts) {
          const promptBoxY = scriptBoxY + scriptBoxH + 5;
          const promptBoxH = pageHeight - promptBoxY - 18;
          doc.setFillColor(14, 18, 30);
          doc.roundedRect(rightX, promptBoxY, rightW, promptBoxH, 2, 2, 'F');
          doc.setDrawColor(0, 240, 255);
          doc.setLineWidth(0.3);
          doc.roundedRect(rightX, promptBoxY, rightW, promptBoxH, 2, 2, 'S');

          doc.setFillColor(0, 240, 255);
          doc.rect(rightX + 4, promptBoxY + 3, 2, 6, 'F');
          doc.setTextColor(0, 240, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.text('AI VIDEO GENERATION PROMPT (VEO / SORA / RUNWAY)', rightX + 8, promptBoxY + 8);

          doc.setTextColor(210, 230, 245);
          doc.setFont('courier', 'normal');
          doc.setFontSize(8);
          const promptText = s.videoPrompt || s.title;
          const promptLines = doc.splitTextToSize(promptText, rightW - 16);
          doc.text(promptLines, rightX + 8, promptBoxY + 16);
        }
      } else {
        // Portrait Layout for 1 scene
        const kfX = 14;
        const kfY = 30;
        const kfW = pageWidth - 28;
        const kfH = (kfW * 9) / 16;

        // Keyframe
        const kfUrl = keyframes[s.id];
        if (kfUrl) {
          try {
            doc.addImage(kfUrl, 'JPEG', kfX, kfY, kfW, kfH);
          } catch {
            doc.setFillColor(20, 25, 40);
            doc.rect(kfX, kfY, kfW, kfH, 'F');
          }
        }

        // Script Box
        const scriptY = kfY + kfH + 8;
        doc.setTextColor(255, 170, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('SCREENPLAY SCRIPT / VOICEOVER', kfX, scriptY);

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        const scriptLines = doc.splitTextToSize(`"${s.voiceoverText || s.title}"`, kfW);
        doc.text(scriptLines, kfX, scriptY + 7);

        // Prompt Box
        const promptY = scriptY + 32;
        doc.setTextColor(0, 240, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('AI GENERATION PROMPT', kfX, promptY);

        doc.setTextColor(200, 220, 240);
        doc.setFont('courier', 'normal');
        doc.setFontSize(8.5);
        const promptLines = doc.splitTextToSize(s.videoPrompt || s.title, kfW);
        doc.text(promptLines, kfX, promptY + 7);
      }

      // Page Footer
      doc.setTextColor(100, 120, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(
        `StoryCast Production  •  "${projectTitle}"  •  Scene ${s.sceneNumber} of ${scenes.length}`,
        14,
        pageHeight - 11
      );
      doc.text(`Page ${i + 2}`, pageWidth - 24, pageHeight - 11);
    }
  } else {
    // COMPACT DUAL-SCENE LAYOUT: 2 Scenes per page
    const scenesPerPage = 2;
    const pageCount = Math.ceil(scenes.length / scenesPerPage);

    for (let p = 0; p < pageCount; p++) {
      doc.addPage();

      doc.setFillColor(11, 14, 23);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setDrawColor(30, 42, 65);
      doc.setLineWidth(0.3);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');

      const pageScenes = scenes.slice(p * scenesPerPage, (p + 1) * scenesPerPage);

      pageScenes.forEach((s, slotIndex) => {
        const slotH = (pageHeight - 32) / 2;
        const slotY = 12 + slotIndex * slotH;

        // Header strip
        doc.setFillColor(18, 24, 40);
        doc.rect(10, slotY, pageWidth - 20, 9, 'F');
        doc.setTextColor(255, 170, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`SCENE #${s.sceneNumber}: ${s.title.toUpperCase()}`, 14, slotY + 6.2);

        doc.setTextColor(0, 240, 255);
        doc.setFontSize(7.5);
        doc.text(
          `${(s.duration || 6).toFixed(1)}s  |  ${s.sceneLocation || 'Stage'}  |  ${s.cameraMotion || 'Camera'}`,
          pageWidth - 75,
          slotY + 6.2
        );

        // Keyframe
        const kfX = 14;
        const kfY = slotY + 12;
        const kfW = 95;
        const kfH = (kfW * 9) / 16;

        const kfUrl = keyframes[s.id];
        if (kfUrl) {
          try {
            doc.addImage(kfUrl, 'JPEG', kfX, kfY, kfW, kfH);
          } catch {
            doc.setFillColor(20, 25, 40);
            doc.rect(kfX, kfY, kfW, kfH, 'F');
          }
        } else {
          doc.setFillColor(20, 25, 40);
          doc.rect(kfX, kfY, kfW, kfH, 'F');
        }

        // Script and Prompt on right
        const rightX = kfX + kfW + 6;
        const rightW = pageWidth - rightX - 14;

        doc.setTextColor(255, 170, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('VOICEOVER / SCRIPT:', rightX, kfY + 4);

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const scriptLines = doc.splitTextToSize(`"${s.voiceoverText || s.title}"`, rightW);
        doc.text(scriptLines.slice(0, 5), rightX, kfY + 9);

        doc.setTextColor(0, 240, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('ACTION PROMPT:', rightX, kfY + 28);

        doc.setTextColor(210, 230, 245);
        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        const promptLines = doc.splitTextToSize(s.videoPrompt || s.title, rightW);
        doc.text(promptLines.slice(0, 4), rightX, kfY + 33);
      });

      // Footer
      doc.setTextColor(100, 120, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`StoryCast Production  •  "${projectTitle}"  •  Page ${p + 2}`, 14, pageHeight - 11);
    }
  }

  onProgress?.(95, 'Finalizing PDF buffer...');
  const blob = doc.output('blob');
  onProgress?.(100, 'Complete!');
  return blob;
}

/**
 * Convenience helper to download the generated Storyboard PDF.
 */
export async function downloadStoryboardPdf(options: StoryboardPdfOptions): Promise<void> {
  const blob = await generateStoryboardPdf(options);
  const cleanTitle = (options.projectTitle || 'Storyboard')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const fileName = `StoryCast_Storyboard_${cleanTitle}_${Date.now()}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
