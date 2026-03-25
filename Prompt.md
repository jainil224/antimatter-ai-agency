Build a pixel-perfect clone of the "Antimatter AI Agency" website using React (with Vite), Three.js (via npm), and GSAP + ScrollTrigger. Every detail below must be reproduced exactly. Do not simplify or omit anything.

━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━
- React 18 + Vite
- Three.js (npm: three)
- GSAP 3.12 + ScrollTrigger plugin (npm: gsap)
- Google Fonts: Inter (weights 300, 400, 500, 600, 700, italic 700)
- No CSS framework — use plain CSS with CSS variables
- Single-page app, no routing
- Use Angular 17+ (standalone components, no NgModules). Replace all React-specific patterns:
- useEffect → ngOnInit / ngAfterViewInit
- useRef → @ViewChild with ElementRef
- useState → component properties
- JSX → Angular templates (.html files)
- ThreeScene as a standalone component with ngAfterViewInit for Three.js initialization
- ServicesSection communicates card hover to ThreeScene via an @Injectable ThreeService (singleton) holding the morphTarget state
- GSAP ScrollTrigger initialized in AppComponent ngAfterViewInit
- All CSS in component .scss files with ViewEncapsulation.None for global styles
- No React, no JSX — pure Angular syntax throughout
━━━━━━━━━━━━━━━━━━━━━━━━
CSS VARIABLES (global :root)
━━━━━━━━━━━━━━━━━━━━━━━━
--bg: #000000
--accent: #4B5EFC
--accent2: #7B5EFB
--white: #FFFFFF
--muted: rgba(255,255,255,0.5)
--card-bg: #0D0D12
--border: rgba(255,255,255,0.08)

Body: background var(--bg), color var(--white), font Inter, overflow-x hidden, -webkit-font-smoothing antialiased.
All elements: cursor: none (custom cursor replaces it).

━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOM CURSOR
━━━━━━━━━━━━━━━━━━━━━━━━
Two fixed divs: .cursor (20×20px circle, border 1.5px solid rgba(255,255,255,0.6), mix-blend-mode: difference, z-index 9999, transitions width/height/background 0.15s) and .cursor-dot (5×5px filled white circle, z-index 10000). Both follow mouse via JS transform translate. On hover over <a>, .service-card, .case-item: grow cursor to 38×38px.

━━━━━━━━━━━━━━━━━━━━━━━━
THREE.JS PARTICLE SYSTEM (full-screen fixed canvas, z-index 0, pointer-events none)
━━━━━━━━━━━━━━━━━━━━━━━━
- N = 6000 particles
- PerspectiveCamera FOV 55, starts at position (3, 0, 9)
- WebGLRenderer alpha:true, antialias:true, pixelRatio min(devicePixelRatio, 2)
- 7 SHAPE generators (each returns Float32Array of N*3 positions):
  1. sphere(N) — radius 2.2, 15% inner scatter
  2. cube(N) — face-surface distribution, ±0.18 jitter, size 4
  3. codeText(N) — renders "</>" in bold 200px Courier New on 400×400 canvas, samples lit pixels at scale 0.015
  4. dna(N) — double helix, radius 1.15, height span ±3.75, with cross-link particles
  5. sparkle(N) — 3 astroid clusters (main + two offset satellites), astroid formula pow(cos,3)/pow(sin,3)
  6. blob(N) — sphere + sin(u*4)*0.45 + cos(v*3)*0.45 radial noise
  7. sphere(N) again (for seamless loop)
  SHAPES array = [sphere, cube, codeText, dna, sparkle, blob, sphere]

- blastDir: N*3 Float32Array — each particle gets a random spherical position r = 8 + random*16

- BufferGeometry with attributes: position (3), size (1, random 0.5–2.5), aRnd (1, random 0–1)

- ShaderMaterial (transparent, depthWrite:false, AdditiveBlending):
  uniforms: uTime (float), uColor (vec3, white #ffffff), uGlow (vec3, purple #7B5EFB), uBlast (float 0→1)
  vertexShader:
    vOp = 0.45 + 0.55 * sin(uTime*1.8 + aRnd*9.0)
    gl_PointSize = size * (32.0 / -mv.z)
  fragmentShader:
    discard if length(pointCoord - 0.5) > 0.5
    core = exp(-d*7.0), glow = exp(-d*3.0)*0.5
    col = mix(uGlow, uColor, core)
    blastFade = mix(1.0, 0.35, uBlast)
    gl_FragColor = vec4(col, (core+glow) * vOp * blastFade)

- Points mesh scaled to (0.78, 0.78, 0.78)

- STATE:
  morphTarget=0, morphSmooth=0
  ptsPosTarget=2.8, ptsPosSmooth=2.8 (mesh X position — slides left/right on screen)
  blastProgress=0, blastSmooth=0
  mouse THREE.Vector2(-10,-10)

- ANIMATION LOOP:
  mat.uniforms.uTime.value = elapsed
  blastSmooth = lerp(blastSmooth, blastProgress, 0.06)
  ptsPosSmooth = lerp(ptsPosSmooth, ptsPosTarget, 0.05); pts.position.x = ptsPosSmooth
  camera.position.x = mouse.x * 0.3; camera.position.y = -mouse.y * 0.3; camera.lookAt(0,0,0)
  activeTarget = (cardHovered !== -1) ? cardHovered : scrollShapeTarget
  morphTarget = lerp(morphTarget, activeTarget, 0.08)
  morphSmooth = lerp(morphSmooth, morphTarget, 0.07)
  bi = floor(morphSmooth) clamped to SHAPES.length-2, ni = bi+1, lam = ease3(morphSmooth - bi)
  Mouse vortex repulsion (swirl): if bl < 0.2, within radius sqrt(2.5), apply force dx+dy*1.5 / dy-dx*1.5
  blast lerp: smBl = bl²*(3-2*bl); tx = lerp(shapePos, blastDir, smBl)
  Each particle: pos[i] = lerp(pos[i], tx, 0.1); geo.attributes.position.needsUpdate = true

- SCROLL TRIGGERS (GSAP ScrollTrigger):
  1. Hero → Services approach (trigger .services-section top bottom→top top):
     ptsPosTarget = 3.2 - progress*7.7
     scrollShapeTarget = progress
  2. Services horizontal scroll pin (trigger .services-section top top, scrub 1.2, pin:true):
     gsap.to(#services-track, x: -(track.scrollWidth - servicesRight.offsetWidth + 32))
     onUpdate: ptsPosTarget = -4.5
  3. Services entrance — header: fromTo opacity 0→1, x "-40vw"→0, y "30vh"→0, scale 1.4→1, power3.out, duration 1.4, trigger top 75%
  4. Services entrance — cards: stagger 0.12, opacity 0→1, y 60→0, scale 0.94→1, power3.out, trigger top 65%
  5. Case studies blast (trigger .case-studies top 65%, scrub 1.2):
     blastProgress = progress
     ptsPosTarget = lerp(-4.5, 0.0, progress)

━━━━━━━━━━━━━━━━━━━━━━━━
NAVBAR (fixed, top 0, full width, z-index 50)
━━━━━━━━━━━━━━━━━━━━━━━━
- background rgba(0,0,0,0.55), backdrop-filter blur(14px), border-bottom 1px var(--border)
- padding 22px 5%, flex, space-between, align-items center
- Left: .logo "ANTIMATTER AI" — font-weight 700, font-size 1.1rem, letter-spacing 2px
- Center: .nav-links (gap 28px) — links: Work | Company | Services | Atom AI | Contact
  color var(--muted), font-size 0.88rem, hover → color white
- Right: .btn-pill "Start Your Project →"
  background rgba(75,94,252,0.12), border 1px solid var(--accent), padding 10px 22px, border-radius 50px,
  box-shadow 0 0 18px rgba(75,94,252,0.35), hover: bg var(--accent), shadow 0 0 28px rgba(75,94,252,0.7)

━━━━━━━━━━━━━━━━━━━━━━━━
HERO SECTION (100vh, flex column, justify-content center, padding 0 5%, z-index 10)
━━━━━━━━━━━━━━━━━━━━━━━━
- .ghost text "ANTIMATTER" — absolute centered, font-size clamp(6rem,14vw,18rem), font-weight 800,
  color rgba(255,255,255,0.025), z-index -1, pointer-events none, user-select none
- .hero-content (max-width 580px):
  h1: font-size clamp(2.8rem,5vw,5rem), line-height 1.1, font-weight 400
    Text: "Building " + <br> + <span class="italic-bold">Digital Solutions</span> + <br> + "That Matter"
    .italic-bold: font-weight 700, font-style italic
  p: "We construct state-of-the-art AI applications, immersive web platforms,<br>and intelligent systems to propel your business forward."
    color var(--muted), font-size 1.05rem, line-height 1.65, margin-bottom 36px
  .btn-pill "Start Your Project →" (same as nav)
- .stats-bar (absolute, bottom 38px, left 5%, flex, font-size 0.78rem, uppercase, letter-spacing 1.2px, color var(--muted)):
  3 spans separated by right-border 1px rgba(255,255,255,0.15), padding-right/margin-right 28px:
  "50+ Projects Delivered" | "100% Client Satisfaction" | "24/7 Support Available"

━━━━━━━━━━━━━━━━━━━━━━━━
SERVICES SECTION (.services-section, z-index 10, position relative)
━━━━━━━━━━━━━━━━━━━━━━━━
Layout: .services-pin (100vh, flex, align-items center, overflow hidden)
  Left: .services-left (width 45vw, height 100%, flex-shrink 0) — empty, for Three.js particles
  Right: .services-right (width 55vw, flex column, justify-content center, height 100%, padding-right 5%)
    mask-image: linear-gradient(to right, transparent 0%, black 6%, black 100%)

.services-header (flex, space-between, align-items flex-end, margin-bottom 40px, padding 0 32px):
  h2 "Our Services" — font-size clamp(2rem,3.5vw,3rem)
  p "We offer comprehensive digital solutions..." — color var(--muted), max-width 320px, text-align right, font-size 0.9rem
  Initial state: opacity 0, transform translateY(20px) — animated in by GSAP

.services-track (flex, gap 20px, padding 0 32px, will-change transform) — 6 cards

SERVICE CARDS (6 total, flex-shrink 0, width 300px, min-height 400px):
  background-color var(--card-bg) + dot grid: radial-gradient(rgba(255,255,255,0.04) 1.5px, transparent 1.5px) 24px 24px
  border 1px solid var(--border), border-radius 18px, padding 28px, flex column, justify-content space-between
  position relative, overflow hidden
  Initial state: opacity 0, transform translateY(60px) scale(0.94)

  ::before — large watermark number from data-num attr: font-size 14rem, font-weight 800, color transparent,
    -webkit-text-stroke 1px rgba(255,255,255,0.035), top -20px, right -10px
  ::after — bottom gradient glow: height 60%, linear-gradient(180deg, transparent, rgba(255,255,255,0.02))

  Hover/active:
    border-color rgba(255,255,255,0.22), transform translateY(-8px), width 340px
    ::before text-stroke brightens to rgba(255,255,255,0.08), scale(1.05) translate(-5px,10px)

  Per-card hover colors (inset box-shadow + border-color):
    1: #7B5EFB (purple), 2: #4B5EFC (blue), 3: rgba(22,200,160) (teal), 4: rgba(250,100,80) (red), 5: rgba(255,180,0) (gold), 6: rgba(0,210,255) (cyan)
    inset shadow: inset 0 -140px 140px -70px rgba(color, 0.2), outer: 0 0 40px rgba(color, 0.15)

  Card interior layout:
    Top div: .card-num ("01") + .card-arrow "↗" (absolute top-right 28px, transitions on hover to white + translate(4,-4))
    Bottom div: .card-title + .card-body (max-height 0 → 400px, opacity 0 → 1 on hover, transition 0.45s)
      .card-body contains: .card-desc (0.83rem, muted, line-height 1.6) + .card-services-label "SERVICES" label
      + <ul class="card-services"> (each <li> has ::before content "—") + .card-tools (tool badges)

  6 cards data:
  01 Product Design — UI/UX Design, Wireframing & Prototyping, Brand Identity & Design Systems, User Research & Testing — Figma, Framer, Maze, Notion
  02 Development — Frontend (React/Next.js), Backend & API Engineering, Cloud Infrastructure & DevOps, Mobile Apps (iOS/Android) — React, Node, AWS, Docker, Vercel
  03 GTM Strategy — ICP & Segmentation, Positioning Narrative & Messaging, Pricing & Packaging, Demand Gen & Content Engine — HubSpot, Apollo, GA4, Mixpanel
  04 Healthcare Apps — Patient Portal & Telehealth, EHR/HL7/FHIR Integration, HIPAA Compliance Engineering, Clinical Workflow Automation — Epic, HL7 FHIR, AWS HIPAA, Twilio
  05 AI Development — LLM Fine-tuning & Agents, RAG & Knowledge Bases, Computer Vision & NLP, AI-powered Automation — OpenAI, LangChain, Pinecone, PyTorch
  06 IoT Development — Embedded Firmware & Hardware, Real-time Data Streaming, Edge Computing & MQTT, IoT Security & OTA Updates — Arduino, MQTT, AWS IoT, Raspberry Pi

  data-shape values: 0,1,2,3,4,5
  Card hover → Three.js targetCardShape = index+1; leave → targetCardShape = -1

━━━━━━━━━━━━━━━━━━━━━━━━
CASE STUDIES SECTION (.case-studies)
━━━━━━━━━━━━━━━━━━━━━━━━
Two-column grid (.cases-grid): left = cases list, right = device mockup

Left (.cases-list):
  h2 "Case Studies"
  5 .case-item rows (hover: show full border, slight translateY(-2px)):
    each has .case-header (space-between, bold project name + ↗ arrow in muted color)
    + .case-tags (flex, gap 8px, flex-wrap): pill tags (.tag: border 1px rgba(255,255,255,0.12), padding 4px 12px, border-radius 50px, font-size 0.72rem, color muted)
  Cases:
    01 Clinix AI — Web Design, App Design, AI Development, GTM
    02 Synergies4 — App Design, AI Development
    03 Curshire — Web Design, Development
    04 OWASP Foundation — Web Design, Development
    05 Feature — App Design, GTM

Right (.mockup-wrap): phone device mockup (.plane-device) with screen (.plane-screen):
  Camera notch (.plane-cam, 10×10px pill, top 12px, centered)
  Inside .p-ui (dark dashboard UI):
    Header: "CLINIX AI" logo + "● Live" green badge
    Chart area: SVG-like line chart with fill gradient + stat overlay "$2.4M" / "↑ 18.4% this month"
    2-col grid of .p-card mini stat cards
    .p-prog progress bar row: label + gradient bar (72% fill, #4B5EFC→#7B5EFB) + value "72%"

━━━━━━━━━━━━━━━━━━━━━━━━
TOOL BADGES (.tool-badge)
━━━━━━━━━━━━━━━━━━━━━━━━
background rgba(255,255,255,0.06), border 1px solid rgba(255,255,255,0.1),
border-radius 6px, padding 3px 9px, font-size 0.72rem, color rgba(255,255,255,0.65)
Wrap in .card-tools (flex, flex-wrap, gap 6px)

━━━━━━━━━━━━━━━━━━━━━━━━
BACKGROUND CANVAS (#bg-canvas)
━━━━━━━━━━━━━━━━━━━━━━━━
Separate fixed canvas (z-index -1, pointer-events none) drawing a subtle animated grid:
50px grid lines in rgba(255,255,255,0.015), redraw every frame with opacity cycling on a slow sine.

━━━━━━━━━━━━━━━━━━━━━━━━
SCROLL BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━
html scroll-behavior: auto (not smooth — GSAP controls everything).

━━━━━━━━━━━━━━━━━━━━━━━━
RESIZE HANDLER
━━━━━━━━━━━━━━━━━━━━━━━━
On window resize: update camera.aspect, camera.updateProjectionMatrix(), renderer.setSize(). ScrollTrigger.refresh().

━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT STRUCTURE (React)
━━━━━━━━━━━━━━━━━━━━━━━━
App.jsx
├── CustomCursor.jsx (cursor + cursor-dot, JS mouse tracking)
├── BackgroundCanvas.jsx (grid canvas useEffect)
├── ThreeScene.jsx (Three.js setup, all shapes, animation loop, exposes ref to particles)
├── Navbar.jsx
├── HeroSection.jsx
├── ServicesSection.jsx
│   └── ServiceCard.jsx (×6)
└── CaseStudiesSection.jsx

Initialize GSAP ScrollTrigger in a single useEffect inside App.jsx after all refs are assigned.
Pass card hover callbacks from ServicesSection to ThreeScene via a shared ref or context.

━━━━━━━━━━━━━━━━━━━━━━━━
MATH HELPERS
━━━━━━━━━━━━━━━━━━━━━━━━
lerp(a,b,t) = a + (b-a)*t
ease3(t) = t<0.5 ? 4t³ : 1-(-2t+2)³/2
easeOut(t) = 1-(1-t)³

Reproduce every pixel. Do not simplify, do not add anything new, do not use Tailwind or any component library.