/**
 * High-fidelity, self-contained SVG portrait assets for Master Characters.
 * Replaces unverified external placeholder URLs with rich, stylized vector portraits.
 */

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

// 1. ELENA - 30yo Pilot with dark auburn hair in low bun, flight jacket with faded orange patch
export const ELENA_PORTRAIT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="elena-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141a29"/>
      <stop offset="60%" stop-color="#0c101d"/>
      <stop offset="100%" stop-color="#060810"/>
    </linearGradient>
    <radialGradient id="elena-glow" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="#f97316" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="elena-jacket" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4a5335"/>
      <stop offset="60%" stop-color="#373d27"/>
      <stop offset="100%" stop-color="#232719"/>
    </linearGradient>
    <linearGradient id="elena-skin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5cbb1"/>
      <stop offset="70%" stop-color="#e2ab8e"/>
      <stop offset="100%" stop-color="#c98a6b"/>
    </linearGradient>
    <linearGradient id="elena-hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6e2618"/>
      <stop offset="50%" stop-color="#4a150c"/>
      <stop offset="100%" stop-color="#2c0c07"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="400" height="400" fill="url(#elena-bg)"/>
  <circle cx="200" cy="160" r="150" fill="url(#elena-glow)"/>

  <!-- Cockpit Grid HUD Rings -->
  <circle cx="200" cy="160" r="130" fill="none" stroke="#f97316" stroke-opacity="0.15" stroke-dasharray="6,6"/>
  <circle cx="200" cy="160" r="90" fill="none" stroke="#f97316" stroke-opacity="0.1"/>

  <!-- Hair - Back Bun -->
  <ellipse cx="200" cy="130" rx="68" ry="74" fill="url(#elena-hair)"/>
  <ellipse cx="200" cy="95" rx="36" ry="32" fill="#3c1009"/>

  <!-- Shoulders & Flight Jacket -->
  <path d="M 80 400 L 110 300 L 155 260 L 245 260 L 290 300 L 320 400 Z" fill="url(#elena-jacket)"/>
  
  <!-- Jacket Collar -->
  <path d="M 140 260 L 175 330 L 200 320 L 225 330 L 260 260 L 210 270 L 190 270 Z" fill="#2d331e" stroke="#1d2213" stroke-width="2"/>
  
  <!-- Faded Orange Collar Squadron Patch -->
  <rect x="235" y="300" width="38" height="24" rx="4" fill="#ea580c" stroke="#fed7aa" stroke-width="1.5"/>
  <path d="M 242 312 L 254 304 L 266 312 L 254 320 Z" fill="#ffedd5"/>
  <circle cx="254" cy="312" r="3" fill="#ea580c"/>

  <!-- Zipper & Flight Seams -->
  <line x1="200" y1="320" x2="200" y2="400" stroke="#9ca3af" stroke-width="3" stroke-dasharray="4,2"/>
  <line x1="150" y1="285" x2="110" y2="400" stroke="#282d1c" stroke-width="2"/>
  <line x1="250" y1="285" x2="290" y2="400" stroke="#282d1c" stroke-width="2"/>

  <!-- Neck -->
  <path d="M 180 220 L 180 275 L 220 275 L 220 220 Z" fill="url(#elena-skin)"/>
  <path d="M 180 250 Q 200 270 220 250 L 220 275 L 180 275 Z" fill="#b87a5a" opacity="0.4"/>

  <!-- Head & Face Base -->
  <path d="M 142 165 C 140 220 165 245 200 246 C 235 245 260 220 258 165 C 256 120 236 100 200 100 C 164 100 144 120 142 165 Z" fill="url(#elena-skin)"/>
  
  <!-- Jawline Shadow -->
  <path d="M 152 200 Q 200 250 248 200 Q 200 242 152 200 Z" fill="#a4684a" opacity="0.45"/>

  <!-- Hair - Front Strands & Low Bun Parting -->
  <path d="M 140 150 C 145 110 170 95 200 95 C 230 95 255 110 260 150 C 248 120 225 110 200 116 C 170 122 150 135 140 150 Z" fill="url(#elena-hair)"/>
  <path d="M 142 150 C 144 175 152 195 155 200 C 151 180 148 160 142 150 Z" fill="#3c1009"/>
  <path d="M 258 150 C 256 175 248 195 245 200 C 249 180 252 160 258 150 Z" fill="#3c1009"/>

  <!-- Eyebrows -->
  <path d="M 160 155 Q 175 150 188 154" fill="none" stroke="#3b130a" stroke-width="3" stroke-linecap="round"/>
  <path d="M 212 154 Q 225 150 240 155" fill="none" stroke="#3b130a" stroke-width="3" stroke-linecap="round"/>

  <!-- Eyes - Aviator Keen Gaze -->
  <ellipse cx="174" cy="168" rx="10" ry="6" fill="#ffffff"/>
  <circle cx="175" cy="168" r="4.5" fill="#3e2723"/>
  <circle cx="176" cy="166.5" r="1.5" fill="#ffffff"/>

  <ellipse cx="226" cy="168" rx="10" ry="6" fill="#ffffff"/>
  <circle cx="225" cy="168" r="4.5" fill="#3e2723"/>
  <circle cx="224" cy="166.5" r="1.5" fill="#ffffff"/>

  <!-- Eyelashes / Eye Contours -->
  <path d="M 164 167 Q 174 162 184 167" fill="none" stroke="#220b06" stroke-width="2" stroke-linecap="round"/>
  <path d="M 216 167 Q 226 162 236 167" fill="none" stroke="#220b06" stroke-width="2" stroke-linecap="round"/>

  <!-- Nose -->
  <path d="M 200 165 L 197 192 L 204 193" fill="none" stroke="#aa6849" stroke-width="2.2" stroke-linecap="round"/>

  <!-- Lips -->
  <path d="M 186 215 Q 200 220 214 215" fill="none" stroke="#b95346" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 189 215 Q 200 211 211 215" fill="none" stroke="#8c2f25" stroke-width="1.5"/>

  <!-- Pilot Earring / Aviator Comms Pin -->
  <circle cx="140" cy="188" r="3" fill="#f97316" stroke="#fbbf24" stroke-width="1"/>
  <circle cx="260" cy="188" r="3" fill="#f97316" stroke="#fbbf24" stroke-width="1"/>

  <!-- HUD Reticle Details -->
  <text x="24" y="380" font-family="monospace" font-size="10" fill="#f97316" opacity="0.8">ELENA // FLIGHT PILOT // MASTER 8K</text>
  <rect x="20" y="20" width="360" height="360" fill="none" stroke="#f97316" stroke-opacity="0.2" rx="12"/>
</svg>
`);

// 2. LEO - 25yo Astronaut with short blonde hair, blue spacesuit with cyan telemetry collar
export const LEO_PORTRAIT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="leo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1526"/>
      <stop offset="60%" stop-color="#060c18"/>
      <stop offset="100%" stop-color="#02050a"/>
    </linearGradient>
    <radialGradient id="leo-glow" cx="50%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.32"/>
      <stop offset="70%" stop-color="#0077ff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="leo-spacesuit" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="45%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="leo-skin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fae0cf"/>
      <stop offset="70%" stop-color="#eec2a4"/>
      <stop offset="100%" stop-color="#d49c7a"/>
    </linearGradient>
    <linearGradient id="leo-hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#a16207"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="400" height="400" fill="url(#leo-bg)"/>
  <circle cx="200" cy="150" r="150" fill="url(#leo-glow)"/>

  <!-- Star Points in space backdrop -->
  <circle cx="60" cy="80" r="1.5" fill="#ffffff" opacity="0.8"/>
  <circle cx="340" cy="90" r="1.5" fill="#ffffff" opacity="0.7"/>
  <circle cx="310" cy="40" r="2" fill="#00f0ff" opacity="0.9"/>
  <circle cx="80" cy="220" r="1.2" fill="#ffffff" opacity="0.6"/>
  <circle cx="320" cy="240" r="1.5" fill="#38bdf8" opacity="0.7"/>

  <!-- Telemetry Orbital Rings -->
  <circle cx="200" cy="160" r="140" fill="none" stroke="#00f0ff" stroke-opacity="0.15" stroke-dasharray="8,8"/>

  <!-- Astronaut EVA Suit Shoulders -->
  <path d="M 60 400 L 95 290 L 145 255 L 255 255 L 305 290 L 340 400 Z" fill="url(#leo-spacesuit)"/>
  
  <!-- Cobalt Blue Shoulder Armor Pads -->
  <path d="M 90 295 L 140 265 L 145 340 L 80 370 Z" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5"/>
  <path d="M 310 295 L 260 265 L 255 340 L 320 370 Z" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5"/>

  <!-- Pressurized Cyan Telemetry Collar Ring -->
  <ellipse cx="200" cy="265" rx="65" ry="24" fill="#0f172a" stroke="#00f0ff" stroke-width="3"/>
  <ellipse cx="200" cy="265" rx="55" ry="18" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Glowing Telemetry Nodes on Suit Collar -->
  <circle cx="160" cy="266" r="3.5" fill="#00f0ff"/>
  <circle cx="200" cy="275" r="4" fill="#00f0ff"/>
  <circle cx="240" cy="266" r="3.5" fill="#00f0ff"/>

  <!-- Center Chest Seal / Status Light -->
  <rect x="186" y="315" width="28" height="45" rx="4" fill="#0f172a" stroke="#00f0ff" stroke-width="1.5"/>
  <circle cx="200" cy="330" r="4" fill="#22c55e"/>
  <rect x="192" y="342" width="16" height="3" fill="#38bdf8"/>
  <rect x="192" y="348" width="12" height="3" fill="#38bdf8"/>

  <!-- Neck -->
  <path d="M 178 210 L 178 260 L 222 260 L 222 210 Z" fill="url(#leo-skin)"/>
  <path d="M 178 240 Q 200 255 222 240 L 222 260 L 178 260 Z" fill="#b47854" opacity="0.4"/>

  <!-- Cybernetic telemetry neckline connector -->
  <path d="M 186 240 L 186 255" stroke="#00f0ff" stroke-width="2"/>
  <circle cx="186" cy="240" r="2" fill="#00f0ff"/>

  <!-- Head Base - Square Jawline -->
  <path d="M 138 155 C 136 215 160 238 200 238 C 240 238 264 215 262 155 C 260 115 238 95 200 95 C 162 95 140 115 138 155 Z" fill="url(#leo-skin)"/>
  <path d="M 148 190 Q 200 242 252 190 Q 200 234 148 190 Z" fill="#9e613f" opacity="0.4"/>

  <!-- Short Cropped Blonde Hair -->
  <path d="M 136 140 C 138 90 168 76 200 76 C 232 76 262 90 264 140 C 255 110 230 96 200 96 C 170 96 145 110 136 140 Z" fill="url(#leo-hair)"/>
  <path d="M 148 105 L 158 88 L 172 100 L 188 84 L 204 98 L 220 86 L 236 99 L 250 88" stroke="#ca8a04" stroke-width="2.5" fill="none"/>

  <!-- Eyebrows -->
  <path d="M 158 145 L 186 142" stroke="#a16207" stroke-width="3" stroke-linecap="round"/>
  <path d="M 214 142 L 242 145" stroke="#a16207" stroke-width="3" stroke-linecap="round"/>

  <!-- Eyes - Striking Cyan-Blue -->
  <ellipse cx="172" cy="158" rx="10" ry="6" fill="#ffffff"/>
  <circle cx="173" cy="158" r="5" fill="#0284c7"/>
  <circle cx="173" cy="158" r="3" fill="#00f0ff"/>
  <circle cx="174" cy="156.5" r="1.5" fill="#ffffff"/>

  <ellipse cx="228" cy="158" rx="10" ry="6" fill="#ffffff"/>
  <circle cx="227" cy="158" r="5" fill="#0284c7"/>
  <circle cx="227" cy="158" r="3" fill="#00f0ff"/>
  <circle cx="226" cy="156.5" r="1.5" fill="#ffffff"/>

  <!-- Eyelashes -->
  <path d="M 162 157 Q 172 153 182 157" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
  <path d="M 218 157 Q 228 153 238 157" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>

  <!-- Nose -->
  <path d="M 200 155 L 198 184 L 205 185" fill="none" stroke="#9e613f" stroke-width="2.2" stroke-linecap="round"/>

  <!-- Lips -->
  <path d="M 188 206 Q 200 210 212 206" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>

  <!-- Left Ear Comms Antenna Clip -->
  <rect x="130" y="160" width="8" height="24" rx="2" fill="#0f172a" stroke="#00f0ff" stroke-width="1.5"/>
  <circle cx="134" cy="154" r="2.5" fill="#00f0ff"/>

  <!-- HUD Text -->
  <text x="24" y="380" font-family="monospace" font-size="10" fill="#00f0ff" opacity="0.8">LEO // ASTRONAUT // MASTER 8K</text>
  <rect x="20" y="20" width="360" height="360" fill="none" stroke="#00f0ff" stroke-opacity="0.2" rx="12"/>
</svg>
`);

// 3. ARIA - 28yo Cyber-Infiltrator with asymmetrical purple hair, glowing neural eye implant
export const ARIA_PORTRAIT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="aria-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f0728"/>
      <stop offset="60%" stop-color="#110419"/>
      <stop offset="100%" stop-color="#07020a"/>
    </linearGradient>
    <radialGradient id="aria-glow" cx="50%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#ff007f" stop-opacity="0.4"/>
      <stop offset="70%" stop-color="#a855f7" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="aria-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="60%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#030303"/>
    </linearGradient>
    <linearGradient id="aria-skin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="70%" stop-color="#fbcfe8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <linearGradient id="aria-hair-streak" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="50%" stop-color="#d946ef"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="400" height="400" fill="url(#aria-bg)"/>
  <circle cx="200" cy="150" r="150" fill="url(#aria-glow)"/>

  <!-- Cyberpunk Digital Hex Grid Pattern -->
  <polygon points="120,40 140,50 140,70 120,80 100,70 100,50" fill="none" stroke="#ff007f" stroke-opacity="0.15"/>
  <polygon points="300,70 320,80 320,100 300,110 280,100 280,80" fill="none" stroke="#ff007f" stroke-opacity="0.15"/>
  <polygon points="320,130 340,140 340,160 320,170 300,160 300,140" fill="none" stroke="#00f0ff" stroke-opacity="0.12"/>

  <!-- Hair Base (Dark Raven Silhouette) -->
  <ellipse cx="200" cy="140" rx="74" ry="85" fill="#0f0714"/>

  <!-- Stealth Tactical Jacket Shoulders -->
  <path d="M 70 400 L 105 295 L 155 260 L 245 260 L 295 295 L 330 400 Z" fill="url(#aria-jacket)"/>
  
  <!-- Neon Magenta Piping & High Mandarin Collar -->
  <path d="M 150 260 L 175 320 L 200 310 L 225 320 L 250 260 Z" fill="#18181b" stroke="#ff007f" stroke-width="2"/>
  
  <line x1="105" y1="295" x2="175" y2="400" stroke="#ff007f" stroke-width="1.8" stroke-dasharray="6,4"/>
  <line x1="295" y1="295" x2="225" y2="400" stroke="#ff007f" stroke-width="1.8" stroke-dasharray="6,4"/>
  <circle cx="175" cy="320" r="3" fill="#00f0ff"/>
  <circle cx="225" cy="320" r="3" fill="#00f0ff"/>

  <!-- Neck -->
  <path d="M 180 210 L 180 265 L 220 265 L 220 210 Z" fill="url(#aria-skin)"/>
  <path d="M 180 240 Q 200 260 220 240 L 220 265 L 180 265 Z" fill="#86198f" opacity="0.45"/>

  <!-- Face Base - High Cheekbones -->
  <path d="M 140 160 C 138 215 165 240 200 240 C 235 240 262 215 260 160 C 258 120 236 100 200 100 C 164 100 142 120 140 160 Z" fill="url(#aria-skin)"/>
  <path d="M 148 190 Q 200 244 252 190 Q 200 235 148 190 Z" fill="#701a75" opacity="0.35"/>

  <!-- Asymmetrical Raven Hair with Purple Streak -->
  <path d="M 132 145 C 134 95 165 80 200 80 C 238 80 268 98 268 150 C 255 125 235 105 200 110 C 160 115 140 130 132 145 Z" fill="#09030c"/>
  
  <!-- Sleek Asymmetrical Bangs covering right ear, long bob on left -->
  <path d="M 132 145 C 130 185 140 230 152 245 C 145 210 142 175 140 150 Z" fill="url(#aria-hair-streak)"/>
  <path d="M 142 120 C 165 140 185 160 190 180 C 182 155 165 135 145 125 Z" fill="url(#aria-hair-streak)"/>

  <!-- Eyebrows -->
  <path d="M 158 148 Q 174 142 186 146" stroke="#4a044e" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M 214 146 Q 226 142 242 148" stroke="#4a044e" stroke-width="2.8" fill="none" stroke-linecap="round"/>

  <!-- Normal Right Eye -->
  <ellipse cx="228" cy="160" rx="9" ry="5.5" fill="#ffffff"/>
  <circle cx="227" cy="160" r="4.5" fill="#3b0764"/>
  <circle cx="227" cy="160" r="2" fill="#c084fc"/>
  <circle cx="226" cy="158.5" r="1.5" fill="#ffffff"/>

  <!-- LEFT EYE: GLOWING NEURAL EYE IMPLANT (CYBER-OPTIC) -->
  <ellipse cx="172" cy="160" rx="10" ry="6.5" fill="#050510" stroke="#00f0ff" stroke-width="2"/>
  <circle cx="172" cy="160" r="5.5" fill="#00f0ff"/>
  <circle cx="172" cy="160" r="2.5" fill="#ffffff"/>
  
  <!-- Neural Implant Reticle & Targeting Rings -->
  <circle cx="172" cy="160" r="8" fill="none" stroke="#00f0ff" stroke-width="1" stroke-dasharray="2,2"/>
  <line x1="160" y1="160" x2="184" y2="160" stroke="#00f0ff" stroke-width="1"/>
  <line x1="172" y1="148" x2="172" y2="172" stroke="#00f0ff" stroke-width="1"/>

  <!-- Subtle Micro-Circuit Trace onto cheek -->
  <path d="M 166 168 L 160 180 L 163 192 L 155 200" fill="none" stroke="#00f0ff" stroke-width="1.2"/>
  <circle cx="155" cy="200" r="1.5" fill="#00f0ff"/>

  <!-- Nose -->
  <path d="M 200 156 L 198 183 L 204 184" fill="none" stroke="#86198f" stroke-width="2" stroke-linecap="round"/>

  <!-- Lips -->
  <path d="M 188 208 Q 200 213 212 208" fill="none" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round"/>

  <!-- HUD Text -->
  <text x="24" y="380" font-family="monospace" font-size="10" fill="#ff007f" opacity="0.8">ARIA // NEURAL INFILTRATOR // MASTER 8K</text>
  <rect x="20" y="20" width="360" height="360" fill="none" stroke="#ff007f" stroke-opacity="0.2" rx="12"/>
</svg>
`);

// 4. MALAKOR - 45yo Syndicate Boss with slicked silver hair, titanium jaw plate, obsidian trench
export const MALAKOR_PORTRAIT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="malakor-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f1406"/>
      <stop offset="60%" stop-color="#120c04"/>
      <stop offset="100%" stop-color="#050301"/>
    </linearGradient>
    <radialGradient id="malakor-glow" cx="50%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#ffaa00" stop-opacity="0.32"/>
      <stop offset="70%" stop-color="#f59e0b" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="malakor-trench" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="50%" stop-color="#0c0a09"/>
      <stop offset="100%" stop-color="#020202"/>
    </linearGradient>
    <linearGradient id="malakor-skin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e7e5e4"/>
      <stop offset="60%" stop-color="#d6d3d1"/>
      <stop offset="100%" stop-color="#a8a29e"/>
    </linearGradient>
    <linearGradient id="malakor-silver-hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
    <linearGradient id="titanium-jaw" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="40%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="400" height="400" fill="url(#malakor-bg)"/>
  <circle cx="200" cy="150" r="150" fill="url(#malakor-glow)"/>

  <!-- Syndicate Crest Target Grid -->
  <circle cx="200" cy="160" r="130" fill="none" stroke="#ffaa00" stroke-opacity="0.15" stroke-dasharray="10,6"/>
  <line x1="200" y1="20" x2="200" y2="380" stroke="#ffaa00" stroke-opacity="0.1"/>
  <line x1="20" y1="160" x2="380" y2="160" stroke="#ffaa00" stroke-opacity="0.1"/>

  <!-- Heavy High-Collar Obsidian Trench Coat -->
  <path d="M 60 400 L 90 290 L 140 240 L 260 240 L 310 290 L 340 400 Z" fill="url(#malakor-trench)"/>

  <!-- Amber Illuminated Silk Lining & Heavy Epaulets -->
  <path d="M 130 240 L 160 330 L 200 340 L 240 330 L 270 240 L 250 250 L 150 250 Z" fill="#292524" stroke="#ffaa00" stroke-width="2.5"/>
  <rect x="90" y="285" width="45" height="18" rx="3" fill="#ffaa00" opacity="0.85"/>
  <rect x="265" y="285" width="45" height="18" rx="3" fill="#ffaa00" opacity="0.85"/>

  <!-- Double-breasted Titanium Clasps -->
  <circle cx="170" cy="355" r="4.5" fill="#cbd5e1" stroke="#f59e0b" stroke-width="1.5"/>
  <circle cx="230" cy="355" r="4.5" fill="#cbd5e1" stroke="#f59e0b" stroke-width="1.5"/>
  <circle cx="170" cy="385" r="4.5" fill="#cbd5e1" stroke="#f59e0b" stroke-width="1.5"/>
  <circle cx="230" cy="385" r="4.5" fill="#cbd5e1" stroke="#f59e0b" stroke-width="1.5"/>

  <!-- Neck -->
  <path d="M 175 200 L 175 255 L 225 255 L 225 200 Z" fill="url(#malakor-skin)"/>
  
  <!-- Head Base -->
  <path d="M 140 150 C 138 210 160 235 200 235 C 240 235 262 210 260 150 C 258 110 236 90 200 90 C 164 90 142 110 140 150 Z" fill="url(#malakor-skin)"/>

  <!-- TITANIUM JAW PLATE & CYBERNETIC GRAFT (Left side of jaw) -->
  <path d="M 195 210 L 248 190 L 258 165 L 245 228 L 200 236 Z" fill="url(#titanium-jaw)" stroke="#f59e0b" stroke-width="1.5"/>
  <!-- Hydraulic rivets on titanium jaw -->
  <circle cx="238" cy="195" r="2" fill="#000000"/>
  <circle cx="244" cy="208" r="2" fill="#000000"/>
  <circle cx="232" cy="220" r="2" fill="#000000"/>
  <circle cx="215" cy="228" r="2" fill="#000000"/>
  
  <!-- Cybernetic Facial Scar Graft -->
  <path d="M 235 135 L 245 160 L 240 185" stroke="#ef4444" stroke-width="2" stroke-linecap="round" fill="none"/>

  <!-- Slicked-Back Silver Platinum Hair -->
  <path d="M 136 130 C 138 80 166 65 200 65 C 234 65 264 80 266 130 C 255 100 230 85 200 85 C 170 85 145 100 136 130 Z" fill="url(#malakor-silver-hair)"/>
  <path d="M 155 85 Q 200 70 245 85" stroke="#64748b" stroke-width="2" fill="none"/>
  <path d="M 165 95 Q 200 82 235 95" stroke="#64748b" stroke-width="2" fill="none"/>

  <!-- Severe Eyebrows -->
  <path d="M 158 138 L 186 135" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M 214 135 L 242 138" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>

  <!-- Cold Calculating Eyes -->
  <ellipse cx="172" cy="150" rx="9" ry="5" fill="#ffffff"/>
  <circle cx="173" cy="150" r="4" fill="#334155"/>
  <circle cx="173" cy="150" r="1.5" fill="#f8fafc"/>

  <ellipse cx="228" cy="150" rx="9" ry="5" fill="#ffffff"/>
  <circle cx="227" cy="150" r="4" fill="#334155"/>
  <circle cx="227" cy="150" r="1.5" fill="#f8fafc"/>

  <!-- Nose -->
  <path d="M 200 148 L 197 178 L 204 180" fill="none" stroke="#78716c" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Thin Stern Lips -->
  <path d="M 188 200 L 212 200" stroke="#44403c" stroke-width="2.2" stroke-linecap="round"/>

  <!-- Syndicate Boss Lapel Pin -->
  <polygon points="152,320 160,312 168,320 160,328" fill="#f59e0b"/>

  <!-- HUD Text -->
  <text x="24" y="380" font-family="monospace" font-size="10" fill="#ffaa00" opacity="0.8">MALAKOR // SYNDICATE BOSS // MASTER 8K</text>
  <rect x="20" y="20" width="360" height="360" fill="none" stroke="#ffaa00" stroke-opacity="0.2" rx="12"/>
</svg>
`);

// Outfit SVG Thumbnails
export const OUTFIT_ELENA_FLIGHT_JACKET = ELENA_PORTRAIT;
export const OUTFIT_ELENA_PRESSURE_SUIT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#0b1324"/>
  <circle cx="150" cy="150" r="100" fill="#1e293b" stroke="#f97316" stroke-width="3"/>
  <ellipse cx="150" cy="140" rx="60" ry="45" fill="#000000" stroke="#fbbf24" stroke-width="4"/>
  <path d="M 110 140 Q 150 115 190 140" stroke="#fbbf24" stroke-width="3" fill="none"/>
  <text x="25" y="270" font-family="monospace" font-size="11" fill="#f97316">ELENA // STRATOSPHERIC SUIT</text>
</svg>
`);

export const OUTFIT_LEO_SPACESUIT = LEO_PORTRAIT;
export const OUTFIT_LEO_STREETWEAR = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#0a0e1a"/>
  <path d="M 60 280 L 100 180 L 150 150 L 200 180 L 240 280 Z" fill="#27272a" stroke="#00f0ff" stroke-width="2"/>
  <circle cx="150" cy="120" r="45" fill="#18181b" stroke="#38bdf8" stroke-width="2"/>
  <path d="M 120 180 L 180 180" stroke="#00f0ff" stroke-width="3"/>
  <text x="25" y="270" font-family="monospace" font-size="11" fill="#00f0ff">LEO // STREETWEAR HOODIE</text>
</svg>
`);

export const OUTFIT_LEO_TACTICAL_ARMOR = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#050a14"/>
  <polygon points="150,60 220,110 220,200 150,250 80,200 80,110" fill="#1e293b" stroke="#818cf8" stroke-width="3"/>
  <polygon points="150,90 195,125 195,185 150,220 105,185 105,125" fill="#0f172a" stroke="#00f0ff" stroke-width="2"/>
  <text x="25" y="270" font-family="monospace" font-size="11" fill="#818cf8">LEO // RECON BALLISTIC ARMOR</text>
</svg>
`);

export const OUTFIT_ARIA_INFILTRATOR = ARIA_PORTRAIT;
export const OUTFIT_ARIA_FLIGHT_JUMPSUIT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#12051c"/>
  <path d="M 70 280 L 110 170 L 150 140 L 190 170 L 230 280 Z" fill="#3b0764" stroke="#ff007f" stroke-width="2"/>
  <line x1="150" y1="140" x2="150" y2="280" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="25" y="270" font-family="monospace" font-size="11" fill="#ff007f">ARIA // FLIGHT JUMPSUIT</text>
</svg>
`);

export const OUTFIT_ARIA_SILK_DISGUISE = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#090210"/>
  <path d="M 100 280 L 130 180 L 150 150 L 170 180 L 200 280 Z" fill="#1e1b4b" stroke="#c084fc" stroke-width="2"/>
  <polygon points="150,110 165,130 150,150 135,130" fill="#e879f9"/>
  <text x="25" y="270" font-family="monospace" font-size="11" fill="#c084fc">ARIA // SILK DISGUISE</text>
</svg>
`);

export const OUTFIT_MALAKOR_TRENCH = MALAKOR_PORTRAIT;
export const OUTFIT_MALAKOR_EXOSKELETON = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#140a02"/>
  <path d="M 60 280 L 100 170 L 150 130 L 200 170 L 240 280 Z" fill="#1c1917" stroke="#f59e0b" stroke-width="3"/>
  <line x1="90" y1="210" x2="210" y2="210" stroke="#ffaa00" stroke-width="4"/>
  <line x1="110" y1="250" x2="190" y2="250" stroke="#ffaa00" stroke-width="4"/>
  <text x="25" y="270" font-family="monospace" font-size="11" fill="#ffaa00">MALAKOR // BATTLE EXOSKELETON</text>
</svg>
`);

export const OUTFIT_MALAKOR_SUIT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#0c0a09"/>
  <path d="M 70 280 L 110 190 L 150 160 L 190 190 L 230 280 Z" fill="#292524" stroke="#fbbf24" stroke-width="2"/>
  <polygon points="150,160 165,220 150,260 135,220" fill="#1c1917" stroke="#d97706" stroke-width="1.5"/>
  <text x="25" y="270" font-family="monospace" font-size="11" fill="#fbbf24">MALAKOR // EXECUTIVE SUIT</text>
</svg>
`);
