# 🐦 Flappy Bird — Enhanced Edition

A fully-featured **Flappy Bird** clone built with **vanilla HTML5 Canvas, CSS, and JavaScript** — no frameworks, no build tools. This enhanced version goes far beyond the original with a portal/space world system, a shop with purchasable power-ups, enemy rockets, shields, and a full sound system.

> **Play it:** Open `index.html` in any modern browser.

---

## 📑 Table of Contents

- [Features Overview](#-features-overview)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Game Screens](#-game-screens)
- [Core Mechanics](#-core-mechanics)
- [Power-Up System](#-power-up-system)
- [Portal & Space World](#-portal--space-world)
- [Rocket & Gravity System](#-rocket--gravity-system)
- [Shop & Economy](#-shop--economy)
- [Sound System](#-sound-system)
- [Sprite Sheets & Assets](#-sprite-sheets--assets)
- [Responsive Design](#-responsive-design)
- [Controls](#-controls)
- [Technical Details](#-technical-details)
- [localStorage Keys](#-localstorage-keys)

---

## ✨ Features Overview

| Feature | Description |
|---|---|
| **Classic Flappy Gameplay** | Tap to flap, dodge pipes, beat your high score |
| **Portal System** | Dimensional portals transport you to a Space World |
| **Space World** | Zero-gravity coin collection mini-game with pattern-based coin spawns |
| **Shield Power** | Absorbs 3 pipe hits with color-coded health feedback |
| **Power Boost** | 5-second invincibility with speed boost and particle effects |
| **Anti-Rocket** | Gravity wave that pulls enemy rockets to the ground |
| **Rocket Waves** | Enemy rockets with formation-based spawning and warning indicators |
| **In-Game Shop** | Purchase power-up quantities with earned coins |
| **Coin Economy** | Earn coins from scoring and space world collection |
| **Medal System** | Bronze, Silver, and Gold medals based on score |
| **Full Sound System** | 6 SFX + looping background music |
| **Pixel-Perfect Rendering** | Sprite-based graphics with crisp retro aesthetics |
| **Responsive Design** | Plays on desktop, tablet, and mobile |
| **Death Animations** | Bounce-fall death, rocket blast explosions, screen shake |
| **Pause System** | Pause/resume with dark overlay |

---

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Edge, Safari)

### Running the Game
```bash
# Clone or download the repository
git clone <repo-url>
cd FLAPPY-BIRD

# Open in browser
# Simply open index.html — no server required
```

Or use a local server:
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

---

## 📁 Project Structure

```
FLAPPY-BIRD/
├── index.html              # Main game page
├── features.html           # Features showcase page
├── README.md               # This file
├── assets/
│   ├── images/
│   │   ├── flappybirdassets.png      # Primary sprite sheet
│   │   ├── flappybirdassets(1).png   # Secondary sprite sheet (shop/powers)
│   │   ├── rocket.png                # Rocket sprite
│   │   ├── blast.png                 # Explosion sprite (2 frames)
│   │   ├── portal.png                # Portal sprite
│   │   ├── space.jpg                 # Space world background
│   │   └── coin.png                  # Collectible coin sprite
│   └── sounds/
│       ├── flap.mp3                  # Wing flap
│       ├── point.mp3                 # Score point / coin collect
│       ├── flappy-bird-hit-sound.mp3 # Pipe collision
│       ├── die.mp3                   # Bird death
│       ├── swoosh.mp3                # Screen transitions
│       ├── blast.mp3                 # Rocket explosion / shield hit
│       └── MainTheme.mp3            # Background music (loops)
├── css/
│   ├── style.css           # All game styling (1300+ lines)
│   └── features.css        # Features page styling
└── js/
    ├── game.js             # Main Game class — loop, state, collisions, shop, coins, sounds
    ├── bird.js             # Bird physics, animation, death sequences
    ├── pipe.js             # Pipe spawning, movement, collision, destruction
    ├── coin.js             # Medal display system (Bronze/Silver/Gold)
    ├── powerup.js          # Power boost — invincibility + speed
    ├── shield.js           # Shield — 3-hit protection with visual states
    ├── rocket.js           # Rocket enemies — wave spawning + explosions
    ├── gravity.js          # Anti-rocket gravity power
    ├── portal.js           # Portal system — entry/exit, transitions, space world management
    ├── spaceWorld.js        # Space world — floating controls, coin patterns
    └── features.js         # Features page navigation
```

---

## 🖥️ Game Screens

### 1. Start Screen
- Game title sprite
- **Start** button — enters "Get Ready" screen
- **Shop** button — opens the in-game shop
- **Features** link — navigates to the features page
- Coin balance displayed in the top corner

### 2. Get Ready Screen
- "Get Ready" text sprite
- Tap guidance sprite showing how to play
- First tap begins gameplay

### 3. Playing (In-Game HUD)
- **Score** — sprite-based number display centered at the top (4× scale)
- **Coin balance** — top-left with coin icon
- **Pause button** — top-right
- **Power buttons** — left side with quantity badges (Power, Shield, Anti-Rocket)
- Shield health bar (when active)
- Portal timer bar (when portal is active)

### 4. Game Over Screen
- "Game Over" text sprite
- **Scoreboard** — final score, best score, medal (Bronze/Silver/Gold)
- **"NEW"** badge — appears on new high score
- **Restart** button — returns to start screen

### 5. Shop Screen
- Wood/parchment themed panel with gold borders
- Three purchasable items displayed as cards
- Coin balance in the header
- Close (X) sprite button
- Animated success/error purchase messages

---

## 🎮 Core Mechanics

### Bird Physics
- **Gravity**: `0.15` acceleration per frame
- **Jump Strength**: `-4.5` velocity on flap
- **Max Velocity**: `8` (terminal velocity cap)
- **Canvas Size**: 400 × 600 pixels
- **Bird Size**: 40 × 30 pixels

### Pipe System
- **Pipe Width**: 70px
- **Gap Size**: 160px
- **Pipe Speed**: 2px/frame (boosted to 5 during Power mode)
- **Spawn Interval**: Every 1800ms
- **Collision**: AABB-based detection
- Individual pipe halves (top/bottom) can be independently destroyed by shields

### Scoring
- **+1 point** per pipe passed
- **×2 multiplier** while in the portal's Space World
- Score displayed using sprite number images for pixel-perfect rendering

### Medals
| Medal | Score Range |
|---|---|
| 🥉 Bronze | 0 – 10 |
| 🥈 Silver | 11 – 20 |
| 🥇 Gold | 21+ |

### Death Animations
| Type | Trigger | Animation |
|---|---|---|
| **Normal Death** | Pipe or ground collision | Bounce up (velocity = -7) → pause → gravity fall off screen |
| **Rocket Blast** | Rocket collision | 500ms explosion sprite → then death fall |
| **Screen Shake** | Any death | 8px/300ms (pipe), 15px/400ms (rocket) |
| **Hit Flash** | Any death | White screen flash overlay |

---

## ⚡ Power-Up System

All powers are purchased from the Shop as consumable quantities. Using a power decrements your owned count by 1.

### Power Boost
- **Cost**: 15 coins (shop)
- **Duration**: 5 seconds
- **Effect**: Bird locks at current Y position, becomes invincible, pipe speed increases to 5
- **Visuals**: Gold/orange particle trail, radial glow, gradient timer bar at top

### Shield
- **Cost**: 20 coins (shop)
- **Duration**: Until 3 hits are absorbed
- **Effect**: Absorbs pipe collisions and destroys the colliding pipe half
- **Health States**:
  - 🔵 Blue — 3 hits remaining
  - 🟡 Yellow — 2 hits remaining
  - 🔴 Red — 1 hit remaining
- **Visuals**: Orbiting particles, pulsing bubble, rotating dashed ring, health bar, pipe break debris particles
- **Cooldown**: 2 seconds after breaking

### Anti-Rocket (Gravity)
- **Cost**: 10 coins (shop)
- **Activation**: Instant
- **Effect**: All active rockets receive downward gravity — they tumble and fall to the ground
- **Visuals**: 3 expanding purple/violet gravity wave rings, ground explosions with debris
- **Cooldown**: 10 seconds

---

## 🌀 Portal & Space World

### Portal Mechanics
- **First Trigger**: Score reaches 30
- **Subsequent Portals**: Every +30 points after returning (or +15 if previous portal was missed)
- **Pre-loading**: Portal is pre-loaded at game init for instant appearance — no spawn delay
- **Entry Timer**: 20-second window to fly into the portal

### Portal Transition Sequence
1. **Entry Portal Appears** — right side of screen with pulsing glow
2. **Suck-In Animation** (1.5s) — bird spirals toward portal center, shrinks, rotates, stretches (spaghettification effect), screen darkens, vortex particles
3. **World Transition** (1.2s) — circle-reveal wipe effect from portal center, white flash at midpoint, background cross-fade
4. **Space World** (20s) — zero-gravity coin collection mini-game
5. **Exit Portal** — appears after 20 seconds, same suck-in animation
6. **Return** — 3-second grace period (no pipes), 3-second invincibility (flashing), autopilot mode

### Space World Mini-Game
- **Controls**: Smooth floating movement (up/down), no flap-based gravity
- **Coin Patterns** (5 types):
  - `line` — horizontal row
  - `arc` — curved path
  - `zigzag` — zigzag formation
  - `diamond` — 8-coin diamond shape
  - `wave` — sine wave curve
- **Coin Speed**: 3px/frame, new pattern every 800ms
- **Score/Coins**: ×2 multiplier on all scoring; each collected coin adds to main balance
- **Background**: Scrolling `space.jpg` with parallax, alien ground with crystal formations

---

## 🚀 Rocket & Gravity System

### Rocket Waves
- **First Wave**: Score 10
- **Subsequent Waves**: Every +10 score points
- **Formation**: 3 rockets per formation, 3 formations per wave, staggered positions
- **Rocket Speed**: 1.5 – 2.5px/frame (random)
- **Warning**: 800ms flashing red triangle + "!" indicator before rocket enters screen
- **Gaps**: Upper/lower gap positions for the bird to dodge through
- **Explosion**: Shockwave ring + 20 fire particles + 6 smoke particles + screen flash

### Gravity Power (Anti-Rocket)
- Activated instantly — sends out purple gravity wave rings
- All rockets gain downward physics: initial upward bounce → gravity acceleration (0.6) → tumbling rotation → ground impact
- Ground explosions with blast sprite, debris, smoke, and shockwave

---

## 🛒 Shop & Economy

### Earning Coins
| Source | Amount |
|---|---|
| Scoring (per point) | 3 coins |
| Scoring in Space World | 6 coins (3 × 2 multiplier) |
| Space World coin collection | 1 coin each |

### Shop Items
| Item | Price | Effect |
|---|---|---|
| Shield | 20 coins | +1 shield charge (absorbs 3 pipe hits) |
| Power | 15 coins | +1 power boost charge (5s invincibility) |
| Anti-Bomb | 10 coins | +1 gravity charge (drops all rockets) |

- Items are **quantity-based** — buy multiple charges, use them as needed
- Quantities shown as red badges on shop cards and in-game power buttons
- If quantity is 0, the power won't activate

---

## 🔊 Sound System

| Sound | File | Trigger | Volume |
|---|---|---|---|
| Flap | `flap.mp3` | Bird flaps (tap/space) | 0.4 |
| Point | `point.mp3` | Score a point / collect space coin | 0.5 |
| Hit | `flappy-bird-hit-sound.mp3` | Pipe collision | 0.5 |
| Die | `die.mp3` | 300ms after hit | 0.5 |
| Swoosh | `swoosh.mp3` | Screen transition / shop purchase | 0.4 |
| Blast | `blast.mp3` | Rocket explosion / shield pipe break | 0.6 |
| Music | `MainTheme.mp3` | Loops during gameplay, stops on death | 0.3 |

---

## 🎨 Sprite Sheets & Assets

### Primary Sprite Sheet (`flappybirdassets.png`)
- Background, ground, bird (3 animation frames)
- Pipes (top/bottom with caps)
- UI buttons (Start, Restart, Pause, Play, Rate, Score, Shop)
- Scoreboard, number digits (0–9), medals (Bronze/Silver/Gold)
- "Get Ready" text, "Game Over" text, "NEW" badge, tap guidance

### Secondary Sprite Sheet (`flappybirdassets(1).png`)
- Shop item icons (Shield, Power, Anti-Bomb)
- Close (X) button, Gravity icon
- Shop button sprite

### Standalone Sprites
| Asset | Usage |
|---|---|
| `rocket.png` | Rocket enemy sprite |
| `blast.png` | Explosion frames (2-frame animation) |
| `portal.png` | Portal sprite (6400×6400, cropped region) |
| `space.jpg` | Space world scrolling background |
| `coin.png` | Collectible coin in space world |

---

## 📱 Responsive Design

| Breakpoint | Behavior |
|---|---|
| **Desktop** | 380×600px centered container, black background, pixelated rendering |
| **≤ 480px** | Full-screen fixed positioning, `100dvh`, scaled-down sprites, sky-colored background |
| **≤ 380px** | Further reduced sprite scales, compact scoreboard |
| **≤ 650px height + ≤ 480px width** | Compressed vertical spacing for short screens |

- **Dynamic Resize**: Canvas maintains 2:3 aspect ratio, recalculates on orientation change (100ms debounce)
- **Touch Support**: Full touch input for gameplay and UI
- **Mobile Meta Tags**: `viewport-fit=cover`, `user-scalable=no`, `apple-mobile-web-app-capable`

---

## 🎹 Controls

### Desktop
| Key | Action |
|---|---|
| `Space` | Flap / Start |
| `P` / `Escape` | Pause / Resume |
| `Q` | Activate Power boost |
| `E` | Activate Shield |
| `G` | Activate Gravity (Anti-Rocket) |
| `↑` / `W` | Move up (Space World) |
| `↓` / `S` | Move down (Space World) |

### Mobile / Touch
| Action | Input |
|---|---|
| Flap | Tap anywhere on canvas |
| Space World movement | Touch top-half (up) / bottom-half (down) |
| Power buttons | Tap the power icons on the left |
| Pause | Tap the pause button (top-right) |

---

## 🔧 Technical Details

- **Engine**: Vanilla HTML5 Canvas 2D — no libraries or frameworks
- **Canvas Resolution**: 400 × 600 pixels (internal), scaled to fit viewport
- **Rendering**: `requestAnimationFrame` game loop with delta-time
- **Pixel Art**: `imageSmoothingEnabled = false` + CSS `image-rendering: pixelated`
- **Fallback Rendering**: Every visual element has a procedural fallback if sprites fail to load
- **State Machine**: `start` → `ready` → `playing` → `dying`/`blasting` → `gameOver`
- **Performance**: Debounced localStorage writes, particle count limits, pre-loaded portal sprites

---

## 💾 localStorage Keys

| Key | Data | Description |
|---|---|---|
| `flappyBirdHighScore` | `number` | All-time high score |
| `flappybird_coins` | `number` | Player's coin balance |
| `flappybird_owned` | `JSON object` | Power-up quantities: `{shield: n, power: n, antibomb: n}` |

---

## 📄 License

This project is for educational and personal use.

---

*Built with ❤️ using vanilla HTML5, CSS, and JavaScript.* 