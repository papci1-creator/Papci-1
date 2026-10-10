# StoryCast AI Pro: Master Video Generation & Audio Multiplexing Pipeline

A comprehensive architectural and engineering plan to enhance StoryCast's video rendering pipeline and client-side audio multiplexing engine, enabling users to render high-definition scene sequences with synchronized microphone recordings, ambient audio ducking, and custom format presets.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices from Phase 1:**
> - **Primary Area**: Enhanced video rendering and audio multiplexing.
> - **Primary Priority**: Video generation and export pipeline.
>
> **Recommended Architectural Decisions for Review:**
> - **Client-Side Video Multiplexing**: Utilize HTML5 Canvas frame extraction combined with Web Audio API `MediaStreamDestination` and `MediaRecorder` for in-browser client-side MP4/WebM generation, with zero backend render queue delays.
> - **Multi-Layer Audio Mixing**: Multiplex user-recorded microphone voice tracks (`scene.audioUrl`), synthetic TTS dialogue, and synthesized ambient score into an integrated master stereo mix with dynamic volume envelopes.
> - **Resolution & Quality Presets**: Provide 1080p Full HD, 720p Social Web, and 4K Ultra-wide master presets with selectable frame rates (24fps Cinematic, 30fps Broadcast, 60fps Smooth).

---

### 1. Overview & Core Concept

- **What It Does**: Upgrades the Export Studio to compile every storyboard scene into a master video file with exact frame pacing, transition interpolation, and multi-track audio layers (microphone voice, synthetic speech, ambient score, and sound effects).
- **Target Audience / Persona**: Directors, content creators, storyboard artists, and animators creating pitch animatics, narrative reels, and production screening decks.
- **Key Value**: Delivers complete production-ready video files directly in the browser without requiring external video editing software (Premiere/After Effects) or costly cloud rendering farm delays.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Master Export Initiation**: The user clicks "Export Master Video" from the header or timeline, opening the Enhanced Export Studio modal.
2. **Preset & Quality Configuration**: The user selects their target profile:
   - *Format Presets*: 1080p Cinematic (16:9), Vertical Short/Reel (9:16), Classic Anamorphic (2.39:1).
   - *Audio Layer Matrix*: Toggle user mic recordings, ambient background score, and automated ducking attenuation.
   - *Watermarking & Timecode*: Optional burn-in timecode overlay (`00:01:24:12`) and scene number badges.
3. **Live Multiplex Rendering View**:
   - High-precision progress bar displaying current scene, rendered frame count, and estimated time remaining.
   - Real-time preview canvas showing the composite frame with particle effects and camera dolly motion during export.
4. **Instant Download & Direct Screening**:
   - One-click `.mp4` / `.webm` video download.
   - Integrated screening preview player with scrub controls.
   - Quick sharing shortcuts (direct email draft via Gmail integration).

#### Visual Identity & Theme
- **Theme**: Obsidian cinema workstation (`#080a11`, `#0c101a`) with electric cyan (`#00f0ff`) and warm amber (`#f59e0b`) accents.
- **Typography**: Clean display sans (`Plus Jakarta Sans`) paired with monospace tabular figures (`JetBrains Mono`, `tabular-nums`) for timestamps, frame rates, and render percentages.
- **Layout Rhythm**: Single-elevation modal architecture with distinct panel segments: Video Spec Configuration on the left, Real-Time Render Stage in the center, and Audio Mix Matrix on the right.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Browser-Based Canvas & Web Audio Stream vs. Server-Side FFmpeg Queue**
  - *Chosen Approach*: Real-time client-side rendering using off-screen HTML5 Canvas + Web Audio API MediaStream recording.
  - *Why*: Instant generation with no queue times, zero server infrastructure costs, and offline PWA operability.
  - *Alternatives Considered*: Cloud FFmpeg container service — passed over to maintain instant execution, avoid network upload bottlenecks for large audio assets, and preserve user privacy.

- **Decision 2: Multiplexed User Microphone Audio Priority**
  - *Chosen Approach*: When a scene contains a user microphone recording (`scene.audioUrl`), the multiplexer prioritizes the live recording over synthetic TTS, and auto-calculates video frame holding time to match the user's spoken duration.
  - *Why*: Ensures dialogue is never cut off and matches the creator's natural speech cadence.

- **Decision 3: Export Format Profiles (WebM + MP4 Fallback)**
  - *Chosen Approach*: Native high-bitrate WebM/H.264 recording via browser `MediaRecorder`, coupled with the existing Python MoviePy export script generator for uncompressed studio masters.
  - *Why*: Maximum browser compatibility across Chrome, Safari, Firefox, and Android.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           StoryCast Studio State                            │
│  scenes[] · characters[] · projectTitle · musicStyle · recordedAudios       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Enhanced Video Export Controller                        │
│                 (Resolution, FPS, Bitrate, Timecode Burn-in)                │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
                       ▼                               ▼
       ┌──────────────────────────────┐ ┌──────────────────────────────┐
       │   Canvas Frame Compositor    │ │    Web Audio Stereo Mixer    │
       │  • Background & Keyframes    │ │  • User Mic Voice Clips      │
       │  • Camera Motion Transforms  │ │  • Synthetic Narration       │
       │  • Dissolve/Wipe Transitions │ │  • Synthesized Ambient Music │
       │  • Subtitles & Timecode      │ │  • Automated Audio Ducking   │
       └──────────────┬───────────────┘ └──────────────┬───────────────┘
                      │                                │
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │    Combined MediaStream (A/V)  │
                      │       MediaRecorder Engine     │
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │    Master Video Blob / URL     │
                      │   (.webm / .mp4 Downloadable)  │
                      └────────────────────────────────┘
```

#### State & Pipeline Transitions
- **Pre-Render Pass**: Evaluates total sequence runtime, verifies all scene background assets and audio buffers, and calculates total frame count ($FPS \times Duration$).
- **Frame Composition Loop**: Advances through timeline at $\Delta t = 1 / FPS$, applying camera pan/zoom interpolation and inter-scene transitions.
- **Audio Synchronization**: Schedules user mic audio playback and synthesizes ambient soundtrack with audio ducking attenuation during dialogue windows.
- **Post-Render Finalization**: Closes the recording stream, calculates final file size, generates a video preview player, and triggers one-click client download.
