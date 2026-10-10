/**
 * Cinematic custom background assets for scenes & procedural AI image generator.
 * Provides instant 16:9 matte paintings, architectural sets, and generative concept art.
 */

import { BackgroundAsset, TimeOfDay } from '../types';

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

// 1. Cyberpunk Neon District
export const BG_CYBERPUNK_METROPOLIS = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="cp-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#04030a"/>
      <stop offset="40%" stop-color="#0d0920"/>
      <stop offset="75%" stop-color="#240c38"/>
      <stop offset="100%" stop-color="#3b0f4a"/>
    </linearGradient>
    <linearGradient id="cp-ground" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0e0717"/>
      <stop offset="30%" stop-color="#190e29"/>
      <stop offset="100%" stop-color="#050208"/>
    </linearGradient>
    <radialGradient id="cp-neon-sun" cx="65%" cy="40%" r="45%">
      <stop offset="0%" stop-color="#ff007f" stop-opacity="0.85"/>
      <stop offset="40%" stop-color="#00f0ff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cp-beam" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#00f0ff" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#ff007f" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Sky -->
  <rect width="1280" height="720" fill="url(#cp-sky)"/>
  <circle cx="832" cy="288" r="320" fill="url(#cp-neon-sun)"/>

  <!-- Background Megastructure Layer 1 -->
  <path d="M 0 520 L 80 440 L 140 440 L 190 490 L 260 410 L 320 410 L 370 480 L 460 380 L 520 380 L 590 520 L 710 340 L 780 340 L 840 460 L 920 390 L 990 390 L 1060 480 L 1150 420 L 1280 470 L 1280 720 L 0 720 Z" fill="#080714"/>

  <!-- Midground Skyscrapers Layer 2 -->
  <path d="M -20 540 L 60 380 L 120 380 L 150 540 L 210 320 L 280 320 L 330 540 L 410 260 L 490 260 L 530 540 L 640 220 L 720 220 L 770 540 L 880 290 L 960 290 L 1020 540 L 1120 330 L 1200 330 L 1300 540 L 1300 720 L -20 720 Z" fill="#0f0c22"/>

  <!-- Neon Windows & Billboards -->
  <g fill="#00f0ff" opacity="0.85">
    <rect x="230" y="350" width="12" height="18"/>
    <rect x="250" y="350" width="12" height="18"/>
    <rect x="230" y="380" width="12" height="18"/>
    <rect x="250" y="380" width="12" height="18"/>
    <rect x="430" y="300" width="16" height="24"/>
    <rect x="455" y="300" width="16" height="24"/>
    <rect x="660" y="260" width="20" height="30"/>
    <rect x="690" y="260" width="20" height="30"/>
  </g>
  <g fill="#ffaa00" opacity="0.85">
    <rect x="230" y="410" width="12" height="18"/>
    <rect x="250" y="410" width="12" height="18"/>
    <rect x="900" y="330" width="16" height="22"/>
    <rect x="930" y="330" width="16" height="22"/>
    <rect x="1140" y="370" width="14" height="20"/>
  </g>
  <g fill="#ff007f" opacity="0.9">
    <rect x="430" y="340" width="45" height="14" rx="2"/>
    <rect x="660" y="310" width="55" height="18" rx="2"/>
    <rect x="900" y="370" width="48" height="16" rx="2"/>
  </g>

  <!-- Glowing Rooftop Spire Beams -->
  <line x1="450" y1="260" x2="450" y2="170" stroke="#00f0ff" stroke-width="2.5"/>
  <circle cx="450" cy="170" r="4" fill="#00f0ff"/>
  <line x1="680" y1="220" x2="680" y2="120" stroke="#ff007f" stroke-width="3"/>
  <circle cx="680" cy="120" r="5" fill="#ff007f"/>
  <line x1="920" y1="290" x2="920" y2="210" stroke="#ffaa00" stroke-width="2"/>
  <circle cx="920" cy="210" r="4" fill="#ffaa00"/>

  <!-- Foreground Wet Street / Reflections -->
  <path d="M 0 540 L 1280 540 L 1280 720 L 0 720 Z" fill="url(#cp-ground)"/>
  
  <!-- Wet Pavement Reflections -->
  <rect x="180" y="560" width="120" height="120" fill="url(#cp-beam)"/>
  <rect x="400" y="550" width="200" height="140" fill="url(#cp-beam)"/>
  <rect x="640" y="560" width="180" height="120" fill="url(#cp-beam)"/>
  <rect x="880" y="550" width="150" height="130" fill="url(#cp-beam)"/>

  <!-- Rain Streaks -->
  <g stroke="#00f0ff" stroke-opacity="0.3" stroke-width="1.2">
    <line x1="120" y1="80" x2="100" y2="240"/>
    <line x1="320" y1="40" x2="300" y2="210"/>
    <line x1="520" y1="120" x2="500" y2="300"/>
    <line x1="780" y1="60" x2="760" y2="260"/>
    <line x1="980" y1="100" x2="960" y2="320"/>
    <line x1="1180" y1="70" x2="1160" y2="280"/>
  </g>

  <!-- Volumetric Anamorphic Flare -->
  <rect x="0" y="280" width="1280" height="12" fill="url(#cp-beam)"/>

  <!-- HUD Director Details -->
  <text x="36" y="688" font-family="monospace" font-size="12" fill="#00f0ff" opacity="0.8">BACKGROUND ASSET // NEO-TOKYO CYBERPUNK METROPOLIS // 16:9 CINEMATIC</text>
</svg>
`);

// 2. Orbital Deep Space Observation Deck
export const BG_ORBITAL_SPACE_DECK = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="space-sky" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#010206"/>
      <stop offset="60%" stop-color="#040817"/>
      <stop offset="100%" stop-color="#081432"/>
    </linearGradient>
    <radialGradient id="earth-glow" cx="50%" cy="115%" r="75%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.9"/>
      <stop offset="35%" stop-color="#0284c7" stop-opacity="0.7"/>
      <stop offset="65%" stop-color="#1e3a8a" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="station-hull" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>

  <!-- Deep Cosmos -->
  <rect width="1280" height="720" fill="url(#space-sky)"/>

  <!-- Distant Stars & Cosmic Dust -->
  <g fill="#ffffff">
    <circle cx="80" cy="90" r="1.5" opacity="0.9"/>
    <circle cx="210" cy="140" r="1.2" opacity="0.7"/>
    <circle cx="340" cy="60" r="2" opacity="0.95"/>
    <circle cx="480" cy="180" r="1.5" opacity="0.6"/>
    <circle cx="650" cy="80" r="2.2" opacity="0.85"/>
    <circle cx="820" cy="130" r="1.4" opacity="0.75"/>
    <circle cx="950" cy="50" r="2" opacity="0.9"/>
    <circle cx="1120" cy="110" r="1.6" opacity="0.8"/>
    <circle cx="1200" cy="200" r="1.2" opacity="0.7"/>
  </g>

  <!-- Nebula Cloud -->
  <ellipse cx="900" cy="180" rx="280" ry="120" fill="#38bdf8" opacity="0.12"/>
  <ellipse cx="400" cy="120" rx="220" ry="90" fill="#818cf8" opacity="0.1"/>

  <!-- Earth Atmospheric Limb Horizon Curve -->
  <ellipse cx="640" cy="850" rx="900" ry="400" fill="url(#earth-glow)"/>
  <ellipse cx="640" cy="880" rx="900" ry="380" fill="#051535"/>

  <!-- Earth Cloud Swirls -->
  <path d="M 200 520 Q 400 480 600 510 Q 800 540 1000 500" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.25" fill="none"/>
  <path d="M 350 560 Q 550 520 750 550 Q 950 580 1150 540" stroke="#38bdf8" stroke-width="12" stroke-linecap="round" opacity="0.2" fill="none"/>

  <!-- Space Station Panoramic Viewport Architecture -->
  <!-- Top Roof Strut -->
  <polygon points="0,0 1280,0 1280,70 1000,110 280,110 0,70" fill="url(#station-hull)"/>
  <line x1="280" y1="110" x2="1000" y2="110" stroke="#00f0ff" stroke-width="2"/>

  <!-- Bottom Observation Floor Deck -->
  <polygon points="0,720 1280,720 1280,630 1020,590 260,590 0,630" fill="url(#station-hull)"/>
  <line x1="260" y1="590" x2="1020" y2="590" stroke="#00f0ff" stroke-width="2"/>

  <!-- Panoramic Viewport Vertical Pillars -->
  <polygon points="260,110 300,110 280,590 240,590" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
  <polygon points="620,110 660,110 660,590 620,590" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
  <polygon points="980,110 1020,110 1040,590 1000,590" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>

  <!-- Holographic Flight Console on Floor -->
  <rect x="480" y="610" width="320" height="75" rx="6" fill="#090d16" stroke="#00f0ff" stroke-width="1.8"/>
  <line x1="500" y1="635" x2="780" y2="635" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6,4"/>
  <circle cx="520" cy="655" r="5" fill="#22c55e"/>
  <circle cx="540" cy="655" r="5" fill="#00f0ff"/>
  <circle cx="560" cy="655" r="5" fill="#f59e0b"/>
  <rect x="620" y="650" width="140" height="15" rx="3" fill="#00f0ff" opacity="0.25"/>

  <!-- Director HUD Watermark -->
  <text x="36" y="688" font-family="monospace" font-size="12" fill="#00f0ff" opacity="0.8">BACKGROUND ASSET // ORBITAL STATION OBSERVATION DECK // 16:9 CINEMATIC</text>
</svg>
`);

// 3. Quantum Server Core Vault
export const BG_QUANTUM_VAULT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="qv-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020813"/>
      <stop offset="60%" stop-color="#061226"/>
      <stop offset="100%" stop-color="#01040a"/>
    </linearGradient>
    <radialGradient id="qv-core" cx="50%" cy="48%" r="40%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="#3b82f6" stop-opacity="0.6"/>
      <stop offset="80%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1280" height="720" fill="url(#qv-bg)"/>

  <!-- Perspective Floor Grid -->
  <g stroke="#00f0ff" stroke-opacity="0.22" stroke-width="1.5">
    <line x1="640" y1="360" x2="-200" y2="720"/>
    <line x1="640" y1="360" x2="80" y2="720"/>
    <line x1="640" y1="360" x2="360" y2="720"/>
    <line x1="640" y1="360" x2="640" y2="720"/>
    <line x1="640" y1="360" x2="920" y2="720"/>
    <line x1="640" y1="360" x2="1200" y2="720"/>
    <line x1="640" y1="360" x2="1480" y2="720"/>

    <line x1="160" y1="450" x2="1120" y2="450"/>
    <line x1="80" y1="520" x2="1200" y2="520"/>
    <line x1="0" y1="610" x2="1280" y2="610"/>
  </g>

  <!-- Left Server Tower Columns -->
  <polygon points="60,80 180,120 180,620 60,560" fill="#090d16" stroke="#00f0ff" stroke-width="2"/>
  <polygon points="180,120 280,160 280,580 180,620" fill="#05080f" stroke="#00f0ff" stroke-width="1.5"/>

  <!-- Right Server Tower Columns -->
  <polygon points="1220,80 1100,120 1100,620 1220,560" fill="#090d16" stroke="#00f0ff" stroke-width="2"/>
  <polygon points="1100,120 1000,160 1000,580 1100,620" fill="#05080f" stroke="#00f0ff" stroke-width="1.5"/>

  <!-- Server Activity Blinkers -->
  <g fill="#00f0ff" opacity="0.8">
    <circle cx="120" cy="200" r="3"/><circle cx="120" cy="220" r="3"/><circle cx="120" cy="240" r="3"/>
    <circle cx="140" cy="200" r="3"/><circle cx="140" cy="240" r="3"/>
    <circle cx="1160" cy="200" r="3"/><circle cx="1160" cy="220" r="3"/><circle cx="1160" cy="240" r="3"/>
  </g>

  <!-- Central Floating Quantum Singularity Core -->
  <circle cx="640" cy="350" r="140" fill="url(#qv-core)"/>
  <circle cx="640" cy="350" r="90" fill="#ffffff" opacity="0.75"/>
  <circle cx="640" cy="350" r="160" fill="none" stroke="#00f0ff" stroke-width="2" stroke-dasharray="12,8"/>
  <circle cx="640" cy="350" r="190" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6,6"/>

  <!-- Energy Conduits -->
  <line x1="640" y1="0" x2="640" y2="210" stroke="#00f0ff" stroke-width="4"/>
  <line x1="640" y1="490" x2="640" y2="720" stroke="#00f0ff" stroke-width="4"/>

  <text x="36" y="688" font-family="monospace" font-size="12" fill="#00f0ff" opacity="0.8">BACKGROUND ASSET // QUANTUM CORE DATA VAULT // 16:9 CINEMATIC</text>
</svg>
`);

// 4. Martian Red Colony
export const BG_MARS_COLONY = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="mars-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1f0907"/>
      <stop offset="50%" stop-color="#4a1811"/>
      <stop offset="100%" stop-color="#832f1a"/>
    </linearGradient>
    <linearGradient id="mars-soil" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#88311d"/>
      <stop offset="40%" stop-color="#5c1e11"/>
      <stop offset="100%" stop-color="#2a0d07"/>
    </linearGradient>
  </defs>

  <rect width="1280" height="720" fill="url(#mars-sky)"/>

  <!-- Twin Moons (Phobos & Deimos) -->
  <circle cx="880" cy="140" r="28" fill="#d6d3d1" opacity="0.85"/>
  <circle cx="1020" cy="220" r="14" fill="#a8a29e" opacity="0.75"/>

  <!-- Distant Martian Ridge Dunes -->
  <path d="M 0 460 Q 320 380 640 440 Q 960 360 1280 430 L 1280 720 L 0 720 Z" fill="#672415"/>
  <path d="M 0 510 Q 280 470 560 520 Q 840 460 1280 500 L 1280 720 L 0 720 Z" fill="url(#mars-soil)"/>

  <!-- Geodesic Biodome Habitat -->
  <ellipse cx="640" cy="480" rx="160" ry="90" fill="#0f172a" stroke="#f97316" stroke-width="3"/>
  <ellipse cx="640" cy="480" rx="140" ry="75" fill="none" stroke="#fed7aa" stroke-width="1.5" stroke-dasharray="10,6"/>
  <line x1="640" y1="390" x2="640" y2="480" stroke="#f97316" stroke-width="2"/>
  <line x1="530" y1="430" x2="750" y2="430" stroke="#f97316" stroke-width="2"/>

  <!-- Surface Dust Storm Fog -->
  <rect x="0" y="520" width="1280" height="60" fill="#ea580c" opacity="0.18"/>

  <!-- Rover Tire Tracks -->
  <path d="M 320 720 Q 480 620 600 520" stroke="#2a0d07" stroke-width="6" stroke-dasharray="8,6" fill="none"/>
  <path d="M 360 720 Q 520 620 640 520" stroke="#2a0d07" stroke-width="6" stroke-dasharray="8,6" fill="none"/>

  <text x="36" y="688" font-family="monospace" font-size="12" fill="#f97316" opacity="0.8">BACKGROUND ASSET // MARS OUTPOST HABITAT // 16:9 CINEMATIC</text>
</svg>
`);

// 5. Retro 80s Synthwave Gridway
export const BG_RETRO_SYNTHWAVE = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="sw-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a001a"/>
      <stop offset="50%" stop-color="#260042"/>
      <stop offset="100%" stop-color="#590059"/>
    </linearGradient>
    <linearGradient id="sw-sun" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffea00"/>
      <stop offset="50%" stop-color="#ff007f"/>
      <stop offset="100%" stop-color="#7900ff"/>
    </linearGradient>
  </defs>

  <rect width="1280" height="720" fill="url(#sw-sky)"/>

  <!-- Big Striped Retro Sun -->
  <circle cx="640" cy="380" r="160" fill="url(#sw-sun)"/>
  <!-- Sun Blinds -->
  <rect x="470" y="380" width="340" height="6" fill="#1b0033"/>
  <rect x="470" y="396" width="340" height="9" fill="#1b0033"/>
  <rect x="470" y="415" width="340" height="13" fill="#1b0033"/>
  <rect x="470" y="438" width="340" height="18" fill="#1b0033"/>
  <rect x="470" y="466" width="340" height="24" fill="#1b0033"/>

  <!-- Wireframe Mountains Horizon -->
  <polygon points="0,480 180,360 320,440 480,340 640,480" fill="#0d001f" stroke="#ff007f" stroke-width="2"/>
  <polygon points="640,480 800,340 960,430 1100,350 1280,480" fill="#0d001f" stroke="#00f0ff" stroke-width="2"/>

  <!-- Perspective Horizon Grid -->
  <rect x="0" y="480" width="1280" height="240" fill="#060010"/>
  <g stroke="#00f0ff" stroke-width="1.8">
    <line x1="640" y1="480" x2="-200" y2="720"/>
    <line x1="640" y1="480" x2="60" y2="720"/>
    <line x1="640" y1="480" x2="300" y2="720"/>
    <line x1="640" y1="480" x2="520" y2="720"/>
    <line x1="640" y1="480" x2="640" y2="720"/>
    <line x1="640" y1="480" x2="760" y2="720"/>
    <line x1="640" y1="480" x2="980" y2="720"/>
    <line x1="640" y1="480" x2="1220" y2="720"/>
    <line x1="640" y1="480" x2="1480" y2="720"/>

    <line x1="0" y1="510" x2="1280" y2="510"/>
    <line x1="0" y1="545" x2="1280" y2="545"/>
    <line x1="0" y1="590" x2="1280" y2="590"/>
    <line x1="0" y1="645" x2="1280" y2="645"/>
    <line x1="0" y1="710" x2="1280" y2="710"/>
  </g>

  <text x="36" y="688" font-family="monospace" font-size="12" fill="#ff007f" opacity="0.8">BACKGROUND ASSET // RETRO SYNTHWAVE HORIZON // 16:9 CINEMATIC</text>
</svg>
`);

// 6. Anime Twilight Skyline
export const BG_ANIME_TWILIGHT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="anime-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#142c4b"/>
      <stop offset="35%" stop-color="#2a527c"/>
      <stop offset="70%" stop-color="#c06c64"/>
      <stop offset="100%" stop-color="#f5a97f"/>
    </linearGradient>
  </defs>

  <rect width="1280" height="720" fill="url(#anime-sky)"/>

  <!-- Shinkai Stylized Cumulus Clouds -->
  <path d="M 120 400 C 140 320 220 280 290 310 C 340 260 440 270 480 340 C 530 310 610 330 630 390 L 120 400 Z" fill="#ffffff" opacity="0.85"/>
  <path d="M 680 430 C 720 340 820 310 900 350 C 960 290 1080 300 1120 380 C 1170 340 1250 360 1270 440 L 680 430 Z" fill="#fed7aa" opacity="0.85"/>

  <!-- Golden Hour Distant Skyline Silhouette -->
  <polygon points="0,520 80,470 140,470 180,510 240,440 300,440 360,520 540,460 620,460 700,520 880,480 940,480 1020,530 1140,470 1280,520 1280,720 0,720" fill="#1b1d28"/>

  <!-- Sparkling Evening Star -->
  <circle cx="280" cy="140" r="3.5" fill="#ffffff"/>
  <line x1="280" y1="120" x2="280" y2="160" stroke="#ffffff" stroke-width="1.5"/>
  <line x1="260" y1="140" x2="300" y2="140" stroke="#ffffff" stroke-width="1.5"/>

  <!-- Power Line Poles & Cables Silhouette -->
  <line x1="160" y1="440" x2="160" y2="580" stroke="#000000" stroke-width="4"/>
  <line x1="130" y1="460" x2="190" y2="460" stroke="#000000" stroke-width="3"/>
  <path d="M 0 470 Q 160 510 400 480" stroke="#000000" stroke-width="1.5" fill="none"/>

  <text x="36" y="688" font-family="monospace" font-size="12" fill="#fed7aa" opacity="0.8">BACKGROUND ASSET // ANIME SHINKAI TWILIGHT // 16:9 CINEMATIC</text>
</svg>
`);

// Preset Background Library catalog
export const PRESET_BACKGROUND_ASSETS: BackgroundAsset[] = [
  {
    id: 'bg-cyberpunk-metropolis',
    name: 'Neo-Tokyo Cyberpunk Metropolis',
    category: 'Cyberpunk',
    description: 'Towering holographic skyscrapers, rain streaks, wet reflective pavement, cyan and magenta lighting.',
    imageUrl: BG_CYBERPUNK_METROPOLIS,
    prompt: 'Cinematic wide shot of Neo-Tokyo futuristic cyberpunk metropolis at night, pouring rain on reflective streets, towering neon glass spires, flying drone headlights, volumetric cyan and magenta haze, photorealistic matte painting 8k',
    colorPalette: ['#00f0ff', '#ff007f', '#0f0c22', '#ffaa00'],
  },
  {
    id: 'bg-orbital-space-deck',
    name: 'Orbital Station Observation Deck',
    category: 'Sci-Fi',
    description: 'Curved panoramic space station viewport overlooking blue glowing Earth horizon and starry cosmic galaxy.',
    imageUrl: BG_ORBITAL_SPACE_DECK,
    prompt: 'Cinematic wide shot of an orbital space station interior panoramic observation deck overlooking planet Earth horizon and starry cosmic galaxy, glowing cyan control consoles, volumetric starlight, photorealistic sci-fi matte painting',
    colorPalette: ['#00f0ff', '#0284c7', '#081432', '#38bdf8'],
  },
  {
    id: 'bg-quantum-vault',
    name: 'Quantum Core Data Vault',
    category: 'Sci-Fi',
    description: 'Subterranean server racks, pulsing cyan neural pathways, laser grid floor, glowing holographic status core.',
    imageUrl: BG_QUANTUM_VAULT,
    prompt: 'Underground high-tech quantum computing data vault, floating glowing plasma singularity, infinite perspective floor grid, server stacks, cyan telemetry lighting',
    colorPalette: ['#00f0ff', '#3b82f6', '#061226', '#ffffff'],
  },
  {
    id: 'bg-mars-colony',
    name: 'Martian Colony Outpost',
    category: 'Sci-Fi',
    description: 'Crimson red dust landscape, geodesic biodome habitat, twin moons, rover tracks, atmospheric rust haze.',
    imageUrl: BG_MARS_COLONY,
    prompt: 'Martian surface red planet landscape, geodesic glass biodome colony, twin moons in dusty rust sky, rover wheel tracks, cinematic sci-fi concept art',
    colorPalette: ['#ea580c', '#832f1a', '#4a1811', '#fed7aa'],
  },
  {
    id: 'bg-retro-synthwave',
    name: 'Retro 80s Synthwave Gridway',
    category: 'Cinematic',
    description: 'Neon wireframe perspective highway, striped glowing magenta sun, purple mountain grid silhouette.',
    imageUrl: BG_RETRO_SYNTHWAVE,
    prompt: '80s retro synthwave horizon, glowing striped neon sun, wireframe grid mountains, neon magenta and cyan perspective highway, starry dusk',
    colorPalette: ['#ff007f', '#00f0ff', '#ffea00', '#260042'],
  },
  {
    id: 'bg-anime-twilight',
    name: 'Anime Twilight Shinkai Vista',
    category: 'Anime',
    description: 'Golden hour glowing cloud formations, distant city silhouettes, shimmering sunset horizon, power line poles.',
    imageUrl: BG_ANIME_TWILIGHT,
    prompt: 'Makoto Shinkai anime style twilight sky, luminous fluffy cumulus clouds, warm golden hour orange and violet gradient, distant city silhouettes and telegraph lines',
    colorPalette: ['#f5a97f', '#c06c64', '#2a527c', '#ffffff'],
  },
];

/**
 * Procedural background generator for ANY user prompt.
 * Synthesizes a high-fidelity SVG matte painting asset customized to style, location, time of day & seed.
 */
export function generateProceduralBackgroundSvg(params: {
  prompt: string;
  visualStyle?: string;
  location?: string;
  timeOfDay?: TimeOfDay | string;
  seed?: number;
}): { dataUrl: string; asset: BackgroundAsset } {
  const {
    prompt,
    visualStyle = 'Cinematic',
    location = 'Studio Environment',
    timeOfDay = 'Night',
    seed = Math.floor(Math.random() * 10000),
  } = params;

  const styleLower = visualStyle.toLowerCase();
  const isCyber = styleLower.includes('cyber') || prompt.toLowerCase().includes('neon');
  const isSciFi = styleLower.includes('sci-fi') || prompt.toLowerCase().includes('space') || prompt.toLowerCase().includes('orbit');
  const isAnime = styleLower.includes('anime');
  const isSynth = styleLower.includes('synth') || styleLower.includes('80s');

  const topColor = isCyber ? '#05030e' : isSciFi ? '#02050f' : isAnime ? '#172554' : isSynth ? '#140026' : '#04070d';
  const midColor = isCyber ? '#1b0933' : isSciFi ? '#0a1d37' : isAnime ? '#7c2d12' : isSynth ? '#580058' : '#0e1e2d';
  const accentColor = isCyber ? '#00f0ff' : isSciFi ? '#38bdf8' : isAnime ? '#f97316' : isSynth ? '#ff007f' : '#ffaa00';
  const secondaryAccent = isCyber ? '#ff007f' : isSciFi ? '#60a5fa' : isAnime ? '#fde047' : isSynth ? '#00f0ff' : '#38bdf8';

  const titleClean = location.replace(/[<>&"']/g, '').slice(0, 40);
  const promptClean = prompt.replace(/[<>&"']/g, '').slice(0, 65);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="dyn-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${topColor}"/>
      <stop offset="65%" stop-color="${midColor}"/>
      <stop offset="100%" stop-color="#020307"/>
    </linearGradient>
    <radialGradient id="dyn-sun" cx="68%" cy="38%" r="45%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.85"/>
      <stop offset="45%" stop-color="${secondaryAccent}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1280" height="720" fill="url(#dyn-sky)"/>
  <circle cx="870" cy="270" r="280" fill="url(#dyn-sun)"/>

  <!-- Celestial ring or horizon grid -->
  <circle cx="870" cy="270" r="190" fill="none" stroke="${accentColor}" stroke-opacity="0.25" stroke-dasharray="12,8"/>

  <!-- Distant Layer 1 -->
  <path d="M 0 540 L 140 460 L 220 460 L 320 520 L 480 430 L 600 430 L 720 530 L 890 410 L 1020 410 L 1140 500 L 1280 440 L 1280 720 L 0 720 Z" fill="#080c16" opacity="0.9"/>

  <!-- Midground Layer 2 with Architecture -->
  <path d="M -40 560 L 80 410 L 180 410 L 250 560 L 390 350 L 510 350 L 600 560 L 760 300 L 880 300 L 980 560 L 1120 380 L 1240 380 L 1320 560 L 1320 720 L -40 720 Z" fill="#0c111e"/>

  <!-- Accent Illumination / Beacons -->
  <line x1="450" y1="350" x2="450" y2="220" stroke="${accentColor}" stroke-width="2.5"/>
  <circle cx="450" cy="220" r="4.5" fill="${accentColor}"/>
  <line x1="820" y1="300" x2="820" y2="180" stroke="${secondaryAccent}" stroke-width="3"/>
  <circle cx="820" cy="180" r="5.5" fill="${secondaryAccent}"/>

  <!-- Windows & Data nodes -->
  <g fill="${accentColor}" opacity="0.75">
    <rect x="420" y="380" width="16" height="22"/>
    <rect x="445" y="380" width="16" height="22"/>
    <rect x="790" y="330" width="22" height="30"/>
    <rect x="825" y="330" width="22" height="30"/>
  </g>

  <!-- Foreground Floor / Street -->
  <rect x="0" y="550" width="1280" height="170" fill="#05070c"/>
  <line x1="0" y1="550" x2="1280" y2="550" stroke="${accentColor}" stroke-width="1.8" opacity="0.6"/>

  <!-- Light Sheen on Ground -->
  <ellipse cx="640" cy="620" rx="480" ry="40" fill="${accentColor}" opacity="0.12"/>

  <!-- HUD Director Overlay -->
  <rect x="24" y="650" width="480" height="42" rx="6" fill="#04060c" stroke="${accentColor}" stroke-opacity="0.35"/>
  <text x="38" y="668" font-family="monospace" font-size="11" fill="${accentColor}" font-weight="bold">AI GENERATED BACKGROUND // ${titleClean.toUpperCase()}</text>
  <text x="38" y="682" font-family="monospace" font-size="10" fill="#94a3b8">${promptClean} (${visualStyle} - ${timeOfDay})</text>
</svg>
  `.trim();

  const dataUrl = svgToDataUrl(svg);
  const asset: BackgroundAsset = {
    id: `bg-gen-${seed}`,
    name: location ? `${location} Backdrop` : `Custom ${visualStyle} Background`,
    category: (isCyber ? 'Cyberpunk' : isSciFi ? 'Sci-Fi' : isAnime ? 'Anime' : 'Cinematic') as any,
    description: prompt,
    imageUrl: dataUrl,
    prompt,
    colorPalette: [accentColor, secondaryAccent, topColor, midColor],
  };

  return { dataUrl, asset };
}
