# 🧠 3D DSA Home Page

An immersive, scroll-driven interactive website that visualizes fundamental **Data Structures & Algorithms** in real-time 3D, built with **Angular 17** and **Three.js**.

> Live demo: [https://github.com/jainil224/3D-Dsa-Home-Page](https://github.com/jainil224/3D-Dsa-Home-Page)

---

## 📸 Preview

| Landing Page | 3D Array | 3D Binary Tree |
|---|---|---|
| Minimalist dark hero with animated scroll indicator | Cyan wireframe blocks with yellow value labels | Sphere-node wireframe with edge connections |

---

## ✨ Features

### 🎬 Scroll-Driven 3D Animations
- A **GSAP ScrollTrigger** engine maps vertical scroll position to a 3D morphological state machine
- Each data structure smoothly **morphs** into the next as you scroll — no page transitions, no fades
- The 3D scene stays pinned in the left half of the viewport while content cards scroll horizontally on the right

### 🔷 5 Interactive 3D Data Structures

| # | Structure | Shape | Highlight |
|---|---|---|---|
| 01 | **Array** | Cyan wireframe boxes | Yellow numeric value labels, index-based layout |
| 02 | **Stack** | Vertical cyan wireframe boxes | LIFO ordering, animated push/pop |
| 03 | **Binary Tree** | Large wireframe spheres | Edge connections, hierarchical layout |
| 04 | **Linked List** | Rounded cubic nodes | HEAD label, arrow connectors between nodes |
| 05 | **Queue** | Icosahedral wireframe nodes | FRONT & REAR pointer labels, FIFO layout |

### 🌊 Smooth Morphological Transitions
- **Array → Stack**: Blocks collapse vertically
- **Stack → Tree**: Nodes fan out into a hierarchical formation
- **Tree → Linked List**: Nodes linearize and reshape from spheres to cubes
- **Linked List → Queue**: Nodes shift to icosahedra with pointer labels appearing

### 🎨 Premium UI Design (Wizuality)
- Minimalist **black background** with white, bold, centered typography
- **Glassmorphic navbar** with a neon cyan glow "Enter platform →" CTA button
- Animated **"Scroll to Explore"** mouse indicator with a looping scroll wheel
- Horizontal service card track with an **active card highlight** effect
- Dynamic **particle sphere** on the hero section that pulses and rotates

### ⚡ Live Code Simulation Panel
- Right-side panel shows **syntax-highlighted Python code** for each operation
- Code lines **highlight in sync** with the scroll state (e.g., Array Search, Stack Push, etc.)
- Time Complexity, Space Complexity, and operation Status are shown in real-time **glass stat boxes**

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **Angular 17** | Component-based SPA framework |
| **Three.js** | WebGL-based 3D scene rendering |
| **GSAP + ScrollTrigger** | Scroll-driven animation engine |
| **TypeScript** | Type-safe development |
| **SCSS** | Modular, nested component styling |
| **Google Fonts (Outfit)** | Premium typography |

---

## 📁 Project Structure

```
src/app/
├── three-scene/          # 🧠 Core 3D engine (Three.js scene, morphing, animations)
│   └── three-scene.component.ts
├── hero-section/         # 🌟 Landing page section (title, scroll indicator)
│   ├── hero-section.component.html
│   └── hero-section.component.scss
├── navbar/               # 🔗 Glassmorphic navigation bar
│   ├── navbar.component.html
│   └── navbar.component.scss
├── services-section/     # 📦 Data structure cards data source
│   └── services-section.component.ts
├── service-card/         # 🃏 Individual horizontal scroll card
├── home-page/            # 🏠 Root page — orchestrates GSAP scroll triggers
│   ├── home-page.component.ts
│   ├── home-page.component.html
│   └── home-page.component.scss
├── interactive-section/  # 💻 Code simulation + stat panel
├── background-canvas/    # 🌌 Background ambient particle canvas
└── custom-cursor/        # 🖱️ Custom cursor effect
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- **Angular CLI** v17+

```bash
npm install -g @angular/cli
```

### Installation

```bash
# Clone the repository
git clone https://github.com/jainil224/3D-Dsa-Home-Page.git
cd 3D-Dsa-Home-Page

# Install dependencies
npm install
```

### Run Locally

```bash
npm start
# or
ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

### Build for Production

```bash
ng build --configuration production
```

Output will be in the `dist/` folder.

---

## 🎮 How It Works

### Scroll → 3D State Machine

The core engine uses a single floating-point value `morphSmooth` to control the entire 3D scene:

```
morphSmooth value:
 0.0  → Hero section (floating particle sphere)
 1.0  → Array (wireframe boxes, fully visible)
 1.2–1.8 → Array morphing into Stack
 2.0  → Stack (fully visible)
 2.2–2.8 → Stack morphing into Tree
 3.0  → Binary Tree (fully visible)
 3.2–3.8 → Tree morphing into Linked List
 4.0  → Linked List (fully visible)
 4.2–4.8 → Linked List morphing into Queue
 5.0  → Queue (fully visible)
```

This value is driven by GSAP ScrollTrigger's `scrub` property, creating a perfectly smooth, physics-based transition.

### 3D Architecture

```
Three.js Scene
├── pts (PointCloud)         → Background particle system
├── arrayGroup (Group)       → 7 box wireframes + value sprites
├── stackGroup (Group)       → 7 vertical box wireframes
├── treeGroup (Group)        → 7 sphere wireframes + edge lines
├── linkedListGroup (Group)  → 5 rounded cube wireframes + arrows
└── queueGroup (Group)       → 5 icosahedron wireframes + FRONT/REAR labels
```

Each group applies a **premium tilt** (`rotation.x = 0.15`, `rotation.y = 0.2`) for a convincing 3D perspective.

---

## 🧩 Data Structures Explained

### 01 — Array
A linear, contiguous block of memory. Each cell displays its value (yellow). Supports constant-time O(1) access by index.

### 02 — Stack (LIFO)
A vertical stack of memory blocks. Elements are added and removed from the **TOP**. Demonstrated operations: Push, Pop, Peek, Search.

### 03 — Binary Tree
A hierarchical structure with a root node, two children per node (level 1), and four leaf nodes (level 2). Connected with visible edge lines.

### 04 — Linked List
A sequence of nodes connected by pointers. Each node contains a value and an arrow pointing to the next node. The HEAD pointer marks the start.

### 05 — Queue (FIFO)
A linear structure where elements are added at the **REAR** and removed from the **FRONT**. Uses icosahedral nodes for a distinct visual identity.

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| Background | `#000000` | Full black base |
| Primary text | `#FFFFFF` | Headings |
| Muted text | `rgba(255,255,255,0.7)` | Subheadings, descriptions |
| Accent (Cyan) | `#22D3EE` | Wireframes, CTA borders, glow |
| Value labels | `#FACC15` | Array/Stack node values |
| Node labels (Tree) | `#FFFFFF` | Tree/Queue values |
| Border | `rgba(255,255,255,0.08)` | Card borders |

---

## 🔧 Configuration

### Modifying Data Values

In `three-scene.component.ts`, update the `values` array in each structure:

```typescript
// Array values (line ~185)
const values = [10, 25, 40, 5, 8, 99, 12];

// Tree values (line ~250)
const values = [12, 9, 40, 5, 10, 25, 99];
```

### Adding a New Service Card

In `services-section.component.ts`, add an entry to the `services` array:

```typescript
{
  num: '06',
  title: 'Your Structure',
  desc: 'Description here...',
  services: ['Feature 1', 'Feature 2'],
  tools: ['Tool A', 'Tool B'],
  shape: 6,
  shadowInset: 'inset 0 -140px 140px -70px rgba(100, 200, 100, 0.2)',
  shadowOuter: '0 0 40px rgba(100, 200, 100, 0.15)'
}
```

---

## 📜 License

This project is open-source under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Jainil** — [@jainil224](https://github.com/jainil224)

> Built with ❤️ using Angular + Three.js for educational purposes.
