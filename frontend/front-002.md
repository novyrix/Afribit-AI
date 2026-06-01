# Afribit SATS — UI Revision & Implementation Reference
**Version:** 2.0 · June 2026  
**Deployed app:** https://afribit-ai.vercel.app/  
**Purpose:** Comprehensive revision notes, implementation specs, and developer reference for every visual and technical issue identified in the current build.

---

## What We Are Looking At — Honest Assessment

Looking at the three screenshots:

**Launch screen:** The Bitcoin symbol and wordmark are correct in concept but the font is generic system sans — it reads as a default React app, not a product. The "Get started" button has no material depth — it is a flat rounded rectangle with no character. The large dead space above and below the content makes the screen feel unfinished rather than minimal.

**Dashboard:** The hamburger icon is cramped into a small square that looks like a debug button. "Afribit" as centred header text reads like a basic mobile app nav pattern from 2018. The balance card is functional but not impressive — the `0` balance in a large font looks accidentally oversized rather than intentionally dramatic. The In/Out sub-cards have no visual hierarchy. The AI message bubble in orange with black text has poor contrast. The bottom navigation row ("Settings · Account · Blink · Fedi") reads as a web page footer, not a refined navigation system. The mic button is a floating orange orb that appears unconnected to the input bar.

**Wallet selection:** The cards work structurally but feel like standard list items. The Blink and Fedi icons are generic placeholder shapes with no brand character. The layout has no energy — it is form over feeling. We need more.

All of this is fixable. Below is the complete specification for every revision.

---

## Part 1 — Typography System Overhaul

### The Problem
The current build uses generic system fonts. There is no typographic character, no tech identity. Numbers especially — the balance figures that are the most important data on screen — are rendered in a default font with no weight or visual authority.

### The Solution — A Three-Font System

#### Font 1: Outfit — Display & UI Text
- **Source:** Google Fonts — `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap`
- **License:** Open Font License (OFL) — free for commercial use
- **Why Outfit:** Outfit is a geometric sans-serif with a clean, modern, slightly tech-forward character. It has excellent legibility at small sizes, strong weight contrast between Regular and SemiBold, and reads as confidently designed rather than default. Used widely in fintech and crypto products launched 2023–2026. It avoids the overused Poppins/Inter look while remaining completely legible in Swahili.
- **Weights to import:** 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold)
- **Usage:** All UI labels, body text, navigation items, descriptors, button labels, headings

#### Font 2: Space Grotesk — Card Headings & Wallet Names
- **Source:** Google Fonts — `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&display=swap`
- **License:** Open Font License (OFL) — free for commercial use
- **Why Space Grotesk:** Space Grotesk has a distinctive technical personality with subtly quirky letterforms — it was designed for interfaces where you want to signal intelligence and precision. The `G`, `R`, and `a` have subtle design details that make wallet card names feel branded rather than typeset. Used by Vercel, Linear, and multiple crypto products.
- **Usage:** Wallet card names ("Blink", "Fedi"), section headings, sidebar app name "SATS"

#### Font 3: Space Mono — All Numbers & Financial Data
- **Source:** Google Fonts — `https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap`
- **License:** Open Font License (OFL) — free for commercial use
- **Why Space Mono:** Monospace fonts are the correct choice for financial data — digits align consistently, zero (`0`) is always distinguishable from `O`, and the uniform character width makes number changes feel precise rather than jumpy. Space Mono specifically has a retro-futuristic terminal character that reinforces the tech identity. Used by Stripe, GitHub, and many crypto dashboards.
- **Usage:** Balance figures (sats, KES), transaction amounts, API key input fields, timestamps, any numerical data

#### Google Fonts Import — Single Line
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Space+Grotesk:wght@500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

#### CSS Custom Property Definitions
```css
:root {
  --font-ui: 'Outfit', system-ui, sans-serif;
  --font-brand: 'Space Grotesk', 'Outfit', sans-serif;
  --font-numbers: 'Space Mono', 'Courier New', monospace;
}

/* Apply globally */
body { font-family: var(--font-ui); }

/* Balance and financial figures */
.balance-primary, .tx-amount, .stat-value {
  font-family: var(--font-numbers);
}

/* Wallet names, section headings */
.wallet-name, .sidebar-appname, .section-heading {
  font-family: var(--font-brand);
}
```

#### Typography Scale
| Element | Font | Size | Weight | Colour |
|---|---|---|---|---|
| Total balance (sats) | Space Mono | 38px | 700 | `#FFFFFF` |
| KES equivalent | Space Mono | 18px | 400 | `rgba(255,255,255,0.55)` |
| Transaction amounts | Space Mono | 15px | 400 | contextual |
| Wallet card name | Space Grotesk | 18px | 600 | `#FFFFFF` |
| Wallet descriptor | Outfit | 13px | 400 | `rgba(255,255,255,0.55)` |
| Screen heading | Space Grotesk | 26px | 600 | `#FFFFFF` |
| Sub-heading | Outfit | 15px | 500 | `rgba(255,255,255,0.70)` |
| Body / labels | Outfit | 14px | 400 | `rgba(255,255,255,0.65)` |
| Navigation items | Outfit | 13px | 500 | contextual |
| Button label | Outfit | 16px | 600 | contextual |
| API key / codes | Space Mono | 13px | 400 | `#F7931A` |
| Timestamps | Space Mono | 12px | 400 | `rgba(255,255,255,0.35)` |
| Overline / category | Outfit | 11px | 500 | `rgba(255,255,255,0.35)`, uppercase, 1px letter-spacing |

---

## Part 2 — Moving Gradient Background

### The Problem
The current background is flat black `#0B0B0F`. Correct colour, zero atmosphere.

### The Solution — Animated Radial Gradient Orbs

The background is alive. Two large radial gradient orbs drift slowly across the black canvas — one deep orange, one near-black amber. They never stop moving. The motion is so slow it reads as atmospheric breathing rather than animation. This is the technique used by Linear, Vercel, and Anthropic's own dark mode interfaces.

#### Implementation — Pure CSS (No JS, No Performance Cost)

```css
body {
  background-color: #0B0B0F;
  background-image: none;
  position: relative;
  overflow: hidden;
}

/* Two orbs positioned as pseudo-elements on a fixed wrapper */
.bg-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
}

/* Primary orange orb — top-right area */
.bg-orb-1 {
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, #F7931A 0%, #7A3A00 60%, transparent 100%);
  top: -120px;
  right: -160px;
  animation: drift-1 28s ease-in-out infinite alternate;
}

/* Secondary amber orb — bottom-left */
.bg-orb-2 {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, #C45C00 0%, #3A1A00 70%, transparent 100%);
  bottom: -80px;
  left: -120px;
  animation: drift-2 34s ease-in-out infinite alternate;
}

@keyframes drift-1 {
  0%   { transform: translate(0px, 0px) scale(1); }
  33%  { transform: translate(-40px, 30px) scale(1.05); }
  66%  { transform: translate(20px, -50px) scale(0.97); }
  100% { transform: translate(-60px, 20px) scale(1.08); }
}

@keyframes drift-2 {
  0%   { transform: translate(0px, 0px) scale(1); }
  33%  { transform: translate(50px, -30px) scale(0.95); }
  66%  { transform: translate(-20px, 40px) scale(1.06); }
  100% { transform: translate(40px, -50px) scale(0.98); }
}
```

#### HTML Structure
```html
<body>
  <!-- Background canvas — always rendered, always behind everything -->
  <div class="bg-canvas" aria-hidden="true">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
  </div>

  <!-- All app content goes here with position: relative; z-index: 1 -->
  <div id="app">...</div>
</body>
```

#### Key Specs
- Opacity `0.18` is the ceiling — any higher and text contrast degrades on mid-screen content
- `filter: blur(80px)` ensures the orbs are completely soft — no hard edges, no shapes, just atmosphere
- Animation duration 28–34 seconds — imperceptibly slow, never distracting
- `alternate` direction means the animation reverses seamlessly — no jump cut on loop
- Performance: CSS `transform` and `opacity` only — GPU-composited, zero layout reflow, works on low-end Android

#### GSAP Enhancement (Optional — Richer Motion)
If GSAP is already in the project, the orbs can be handed to GSAP for more organic movement using `gsap.to()` with `ease: "sine.inOut"` and random position targets. But the pure CSS version above is the correct default — it works without JavaScript and costs nothing.

---

## Part 3 — GSAP Motion System

### Why GSAP
GSAP became 100% free in April 2025, including all historically premium plugins: SplitText, MorphSVG, DrawSVG, ScrollTrigger, and ScrollSmoother. It is 20x faster than jQuery and 8x more performant than CSS animations on complex sequences. It is the industry standard — used by Apple, Google, and the majority of Awwwards-winning projects.

### Installation
```bash
npm install gsap
```
```javascript
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { DrawSVG } from 'gsap/DrawSVG';
gsap.registerPlugin(SplitText, DrawSVG);
```

### Where GSAP Is Used in Afribit SATS

#### 1. Launch Screen — Character-by-Character Text Reveal
SplitText splits the heading into individual characters. GSAP staggers their appearance with a spring ease, so "Afribit AI" feels written rather than popped in.
```javascript
const split = new SplitText('.launch-title', { type: 'chars' });
gsap.from(split.chars, {
  opacity: 0,
  y: 20,
  duration: 0.6,
  stagger: 0.04,
  ease: 'back.out(1.4)',
  delay: 1.2
});
```

#### 2. Balance Counter — Slot Machine Number Reveal
On first wallet connect, the balance counts up from zero using GSAP's `snap` property to keep it integer-only.
```javascript
gsap.to(balanceObj, {
  value: actualSatsBalance,
  duration: 1.4,
  ease: 'power2.out',
  snap: { value: 1 },
  onUpdate: () => {
    balanceEl.textContent = Math.round(balanceObj.value).toLocaleString();
  }
});
```

#### 3. Wallet Card Entry — Spring Slide-Up
On wallet selection screen entry, cards spring up from below with stagger.
```javascript
gsap.from('.wallet-card', {
  y: 60,
  opacity: 0,
  duration: 0.7,
  stagger: 0.12,
  ease: 'back.out(1.2)'
});
```

#### 4. Wallet Connection Success — Checkmark Draw
The success checkmark is an SVG path drawn using DrawSVG.
```javascript
gsap.from('.checkmark-path', {
  drawSVG: '0%',
  duration: 0.6,
  ease: 'power2.inOut'
});
```

#### 5. AI Response — Staggered Word Reveal
When the AI response text appears, each word fades in with stagger for a streaming-written effect.
```javascript
const words = new SplitText('.ai-response-text', { type: 'words' });
gsap.from(words.words, {
  opacity: 0,
  duration: 0.25,
  stagger: 0.03,
  ease: 'none'
});
```

#### 6. Screen Transitions — Shared GSAP Timeline
All screen transitions (launch → wallet select → main) are coordinated GSAP timelines so that exit and entry animations interlock without gaps or double-renders.
```javascript
const transition = gsap.timeline();
transition
  .to('.current-screen', { opacity: 0, y: -30, duration: 0.3, ease: 'power2.in' })
  .from('.next-screen', { opacity: 0, y: 40, duration: 0.4, ease: 'power2.out' }, '-=0.1');
```

#### 7. Orb Listening State — Waveform Bars
The five waveform bars animate continuously in listening state.
```javascript
document.querySelectorAll('.wave-bar').forEach((bar, i) => {
  gsap.to(bar, {
    scaleY: () => 0.3 + Math.random() * 0.7,
    duration: 0.3 + Math.random() * 0.3,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: i * 0.06
  });
});
```

---

## Part 4 — Header & Navigation Redesign

### The Problem
Current: a standard iOS-style navigation bar with hamburger icon left, "Afribit" centred. This looks like a React app boilerplate. The hamburger button feels isolated and small. The bottom nav row with text labels is overloaded.

### The Solution

#### Header
Remove the centred text title completely. The app does not need to announce its own name on every screen — the user knows where they are.

Replace with:
- **Left:** The menu icon — not a hamburger square, but a 36×36pt touch target with just the three-line icon at 20px, `rgba(255,255,255,0.6)`. No background box. The icon sits directly on the dark background. On tap, it transitions to an `×` with a GSAP rotation of 135° at 0.25s.
- **Centre:** Nothing. The balance data is the hero — it fills the screen.
- **Right:** A 32×32pt glass pill containing a notification bell icon (`rgba(255,255,255,0.5)`) if there are pending notifications, otherwise hidden. Do not show it when empty.

```css
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 0;
  position: relative;
  z-index: 10;
}

.menu-trigger {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.menu-trigger i {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.65);
  transition: color 0.2s ease;
}
```

#### Bottom Navigation — Removed
The text-label bottom navigation bar is removed entirely. It creates cognitive load (five small text labels competing for attention) and fragments the screen into sections. Replace with the sidebar-only navigation pattern described in the previous UI document. The sidebar is the single navigation surface.

The only persistent bottom element is the **orb input bar** — the one thing users need to access at all times.

---

## Part 5 — Dashboard Layout Revision

### Balance Card
The current card has `0 sats` in a large font that looks like a placeholder error state. Fix:

- The balance card gets a minimum visual height whether the balance is 0 or 1,000,000 — the layout never collapses
- When balance is zero, instead of showing a giant `0`, show the text in muted style with a helper message below: "No balance yet. Connect a wallet to get started." in Outfit Regular 13px at 40% white opacity
- When balance is non-zero, the number fills the space with authority — Space Mono 700 at 40px, left-aligned, with the sats unit on the same line in Outfit Regular 20px at 45% white opacity

### In/Out Sub-cards
Current: two small boxes with `0` in each, labelled "In · 30d" and "Out · 30d". Fix:

- Increase internal padding to 14px all sides
- The arrow icons (↙ for in, ↗ for out) should be tinted: `#00C896` for incoming, `#FF4D4D` for outgoing — currently both are orange, which removes the signal
- Label: Outfit Regular 11px, `rgba(255,255,255,0.45)`, uppercase, 0.5px letter-spacing
- Value: Space Mono 700 at 22px — the number is the content, give it authority

### "Awaiting activity" State
This placeholder text in the centre of the card is correct in concept — but it needs better treatment. Currently it floats disconnected. Fix: add a 28px tall icon above it (a subtle loading-dots SVG or a simple `···` in Space Mono) and wrap the text + icon in a centred flex column with 8px gap. Colour: `rgba(255,255,255,0.30)`.

---

## Part 6 — AI Message Bubbles — Readability Fix

### The Problem
The current AI response text is in a small bubble that clips long responses. User messages are orange-filled bubbles with black text — the orange `#F7931A` background with black text has poor contrast for extended reading (particularly in bright sunlight on an outdoor screen in Kibera).

### Fix — Message Design

#### User Messages
- **Background:** `rgba(247, 147, 26, 0.15)` — very light orange tint, not solid orange fill
- **Border:** `1px solid rgba(247, 147, 26, 0.35)`
- **Text:** `#FFFFFF` — pure white, not black
- **Font:** Outfit Regular 15px, line-height 1.6
- **Border radius:** 18px 18px 4px 18px (sharp bottom-right corner indicates direction)
- **Max width:** 82% of chat container width
- **Padding:** 12px 16px

#### AI Response Messages
- **Background:** `rgba(255, 255, 255, 0.06)` — near-invisible glass
- **Border:** `1px solid rgba(255, 255, 255, 0.12)`
- **Text:** `rgba(255, 255, 255, 0.90)` — slightly off-white for gentler reading
- **Font:** Outfit Regular 15px, line-height 1.75 — generous line-height is critical for Swahili which has many long words
- **Border radius:** 4px 18px 18px 18px (sharp top-left indicates it comes from the left)
- **Max width:** 92% of chat container — AI responses can be wider since they are the primary content
- **Padding:** 14px 18px
- **No avatar, no "SATS AI" label in the bubble** — the app already shows who is speaking by bubble direction

#### Message Container
The message area should not have a fixed height. It expands to contain its content. If the conversation grows, the display zone scrolls internally — a single overflow-y: scroll container that does not affect the orb bar or the tool strip position.

---

## Part 7 — Wallet Connection Cards — Full Redesign

### The Problem
Current wallet selection cards look like standard list items with a small icon square and text. They have no energy, no 3D quality, and no brand character.

### The Solution — Premium Horizontal Cards with Depth

Each wallet card is designed to feel like a physical object — a card you would find in a premium wallet app or a luxury fintech product.

#### Card Dimensions
- Width: 100% of screen minus 32px (16px each side)
- Height: 110px
- Border radius: 24px
- The two cards are vertically stacked with 14px gap between them

#### Card Material (Glass + Depth Layer)
```css
.wallet-card {
  position: relative;
  width: calc(100% - 32px);
  height: 110px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.18);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.2s ease;
}

/* Top-left glass highlight — the physical light source */
.wallet-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.45) 30%,
    rgba(255,255,255,0.20) 70%,
    transparent 100%
  );
}

/* Subtle inner glow on top-left — simulates 3D light catch */
.wallet-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 60%;
  height: 50%;
  background: radial-gradient(
    ellipse at top left,
    rgba(255,255,255,0.06) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.wallet-card:active {
  transform: scale(0.97);
  border-color: rgba(247, 147, 26, 0.4);
}
```

#### Inside the Card — Layout
```
[ 24px margin ][ 52px icon block ][ 16px gap ][ text block, flex-1 ][ chevron + 20px margin ]
```

**Icon Block (52×52px):**
- Border radius: 14px
- Background: `rgba(255,255,255,0.05)`
- Border: `1px solid rgba(255,255,255,0.12)`
- Contains the wallet logo SVG at 28px, white monochrome, centred
- A very subtle inner shadow at top-left: `box-shadow: inset 1px 1px 0px rgba(255,255,255,0.15)` — gives the icon block its own 3D lift

**Text Block:**
- Line 1 (wallet name): Space Grotesk SemiBold 19px, `#FFFFFF`
- Line 2 (descriptor): Outfit Regular 13px, `rgba(255,255,255,0.50)`
- Line 3 (optional — connection status on returning visits): Outfit Regular 12px, `#00C896` if connected

**Chevron:**
- Tabler icon `ti-chevron-right` at 18px, `rgba(255,255,255,0.30)`
- Animates to `rgba(255,255,255,0.70)` on card press

#### GSAP Entry Animation
```javascript
gsap.from('.wallet-card', {
  y: 50,
  opacity: 0,
  rotateX: 8,
  duration: 0.65,
  stagger: 0.14,
  ease: 'back.out(1.3)',
  transformOrigin: 'center bottom'
});
```
The slight `rotateX: 8` on entry gives each card a 3D tilt from below that snaps to flat — it reads as the card physically arriving.

---

## Part 8 — Tool Strip Redesign

### The Problem
The current looping strip is functional but too mechanical. The icons are uniform grey boxes. There is no sense that some are connected and active.

### The Solution

#### Connected vs Available States

**Connected tool:**
- Background: `rgba(247, 147, 26, 0.12)` — warm orange tint
- Border: `1px solid rgba(247, 147, 26, 0.30)`
- Icon: `rgba(247, 147, 26, 0.80)` — Bitcoin orange
- A 2px bottom border in `rgba(247, 147, 26, 0.50)` — a lit baseline

**Available (not connected) tool:**
- Background: `rgba(255,255,255,0.04)`
- Border: `1px solid rgba(255,255,255,0.08)`
- Icon: `rgba(255,255,255,0.20)` — very dim

#### Strip Layout
```css
.tool-strip {
  width: 100%;
  height: 38px;
  overflow: hidden;
  position: relative;
  border-top: 0.5px solid rgba(255,255,255,0.07);
  border-bottom: 0.5px solid rgba(255,255,255,0.07);
}

.strip-track {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 14px;
  height: 100%;
  width: max-content;
  animation: strip-scroll 22s linear infinite;
}

@keyframes strip-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* The track contains the icon list duplicated — so the loop is seamless */
```

#### Tooltip on Long Press
On long press (500ms), a small tooltip rises above the icon showing the tool name in Outfit Regular 12px on a glass pill background. Dismisses on release. Implemented with a `touchstart`/`touchend` handler and GSAP `from` animation (y: 6 → 0, opacity: 0 → 1, duration: 0.2).

---

## Part 9 — PWA Installation — Full Implementation

### How It Works Per Platform

#### Android Chrome — Automatic Prompt Available
Android Chrome fires the `beforeinstallprompt` event automatically when the PWA meets installation criteria. The criteria are:
1. Served over HTTPS ✓ (Vercel provides this)
2. Has a valid `manifest.json` with `name`, `short_name`, `start_url`, `icons`, `display: "standalone"` ✓
3. Has a registered service worker with a fetch handler ✓
4. User has interacted with the domain for at least 30 seconds

**Implementation — Custom Install Banner:**
```javascript
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Block the browser's default prompt
  deferredPrompt = e; // Save it for later
  showInstallBanner(); // Show your custom UI
});

function showInstallBanner() {
  // Show a glass pill banner at the top of the screen with:
  // "Install Afribit SATS as an app"  [Install] [×]
  // Animate it in with GSAP from y: -60 to y: 0
}

document.querySelector('.install-btn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); // Show the native Android install dialog
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    hideInstallBanner();
    trackInstall('android');
  }
  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
  hideInstallBanner();
});
```

**Best moment to show the banner:** After the user successfully connects their first wallet — at peak engagement. Not on first visit.

#### iOS Safari — Manual Process Only
Apple does not provide an automatic prompt or an equivalent to the `beforeinstallprompt` event. The process is fully manual: tap the Share icon in Safari's bottom toolbar, scroll to "Add to Home Screen", confirm the app name, tap Add.

Because these steps are not intuitive, the app must educate the user with custom UI.

**iOS Detection:**
```javascript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

if (isIOS && !isInStandaloneMode) {
  showIOSInstallGuide();
}
```

**iOS Install Guide UI — Bottom Sheet:**
A glass bottom sheet rises with:
- A hand-drawn style illustration of Safari's share icon (SVG, white, 24px)
- Step-by-step text: "1. Tap the share icon below  2. Scroll down and tap 'Add to Home Screen'  3. Tap Add"
- A "Remind me later" text link at the bottom
- The sheet appears once per session, maximum once per 3 days (tracked in localStorage)

**iOS Install Guide Copy (in Swahili for Kibera users):**
- "Sakinisha programu hii" (Install this app)
- "Bonyeza 'Share' halafu 'Add to Home Screen'"
- "Itakuwa rahisi zaidi kutumia"

#### manifest.json — Correct Configuration
```json
{
  "name": "Afribit SATS",
  "short_name": "SATS",
  "description": "AI-powered Bitcoin wallet assistant for Kibera",
  "start_url": "/?utm_source=pwa_install",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0B0B0F",
  "theme_color": "#0B0B0F",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "categories": ["finance", "utilities"]
}
```

**Icon requirement:** Both the 192px and 512px icons must use the `maskable` purpose and have 10% safe zone padding (the Bitcoin ₿ symbol on a `#0B0B0F` background, centred with 20px padding all sides). Use [maskable.app](https://maskable.app) to verify the icon before deploying.

#### Post-Install Experience
When a user opens the app from the home screen icon (standalone mode), detect it and show a one-time welcome moment:
```javascript
if (window.matchMedia('(display-mode: standalone)').matches) {
  if (!localStorage.getItem('pwa_welcomed')) {
    showWelcomeToast(); // "Welcome to SATS · You're running the installed app"
    localStorage.setItem('pwa_welcomed', '1');
  }
}
```

---

## Part 10 — External Wallet Connection via PWA

### How Blink Connection Works

Blink (Galoy) provides two connection methods. Both are documented and available now.

#### Method A — API Key (Current Implementation, Improvement Needed)
Users generate an API key at `dashboard.blink.sv`. The key is used in the `X-API-KEY` header for all GraphQL requests to `api.blink.sv/graphql`. For security, Blink strongly recommends never exposing API keys in client-side code where they can be extracted.

**Architecture fix for current build:**
The API key must NOT be sent from the frontend to the Afribit backend. Instead:
1. User enters their key in the browser
2. It is encrypted with AES-GCM (Web Crypto API) and stored in IndexedDB
3. All Blink GraphQL calls are made from the user's browser, not from the Afribit server
4. The server receives only derived, non-sensitive analytics data (totals, not raw keys)

#### Method B — OAuth2 (Preferred Path, Apply to Blink)
Blink supports OAuth2 via Ory Hydra. Third-party applications authenticate using the OAuth2 authorization code flow. To use OAuth2, the application must be registered and approved by the Blink development team. Contact them via their Mattermost server at `chat.blink.sv` to start the approval process — provide your application's purpose, required access scopes, and callback URL.

**OAuth2 Flow in a PWA:**
1. User taps "Connect with Blink" on the wallet selection screen
2. App opens `https://api.blink.sv/oauth/authorize?client_id=AFRIBIT_CLIENT_ID&response_type=code&scope=read&redirect_uri=https://afribit-ai.vercel.app/auth/blink/callback` — in a new tab (cannot open as popup in iOS Safari PWA mode)
3. User approves in Blink's authorization page
4. Blink redirects to the Afribit callback URL with an authorization code
5. Afribit backend exchanges the code for an access token (server-side — never exposes client secret)
6. Access token stored encrypted in the user's browser session

**To obtain OAuth2 access:**
1. Join Blink's Mattermost: `chat.blink.sv`
2. Post in the `#developers` channel with: app name, purpose (Bitcoin wallet aggregation for Kibera residents), required scopes (read-only: balance and transaction history), callback URL
3. Blink team will respond with `client_id` and `client_secret` for the OAuth2 integration
4. This is free to apply for — Blink actively supports developer integrations

#### Auto-Detect Logic (What the Current Build Attempts)
The current "auto-detect" on the wallet connection screen should work as follows:
1. Check `localStorage` and `IndexedDB` for a stored encrypted Blink key or valid OAuth token from a previous session
2. If found: attempt a test GraphQL query to `api.blink.sv` to verify the key is still valid
3. If the query returns a valid balance: connection confirmed, skip to success state
4. If nothing stored or query fails: show the manual connection form

```javascript
async function attemptBlinkAutoConnect() {
  const storedKey = await getDecryptedKey('blink');
  if (!storedKey) return false;

  try {
    const res = await fetch('https://api.blink.sv/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': storedKey
      },
      body: JSON.stringify({ query: 'query { me { defaultAccount { wallets { id walletCurrency } } } }' })
    });
    const data = await res.json();
    return !data.errors;
  } catch {
    return false;
  }
}
```

### How Fedi Connection Works

#### Method A — Federation Invite Code (Current, Correct)
The Fedimint SDK runs entirely in the browser via WebAssembly. The user pastes a federation invite code. This is the correct approach — no Afribit server is involved, Fedi data never leaves the user's browser.

**Key technical note for the developer:** The Fedimint WASM module is large (~1.5MB). It must be lazy-loaded — only initialise it when the user actively selects the Fedi card on the wallet selection screen. Do not bundle it with the main app chunk.

```javascript
// Lazy load only when Fedi card is tapped
document.querySelector('.wallet-card-fedi').addEventListener('click', async () => {
  const { FedimintWallet } = await import('@fedimint/core'); // Dynamic import
  initFediConnectionFlow(FedimintWallet);
});
```

#### Auto-Detect for Fedi
Fedi auto-detect checks IndexedDB for a stored federation invite code. If found, it re-initialises the Fedimint WASM client with that code and verifies the connection with a balance query. If the federation is offline or the invite code is expired, it falls through to the manual input.

### Wallet Selection — Revised Flow Diagram

```
User opens app (unauthenticated)
        ↓
    Launch screen
        ↓
 "Get started" tap
        ↓
  Wallet selection
        ↓
User taps Blink card
        ↓
[Auto-detect: check IndexedDB]──── Found + valid ────→ Skip to Success
        ↓ Not found                                            ↓
[OAuth2 flow] OR [Manual key input]              Dashboard loads
        ↓
    Key validated
        ↓
  Success animation
        ↓
  "Add Fedi?" prompt (optional, can skip)
        ↓
     Dashboard
```

---

## Part 11 — Logo & Brand Asset Sources

### Blink Logo
- **Source:** Blink's official brand assets at `https://blink.sv` and their GitHub repository `github.com/GaloyMoney/blinkbtc`
- **SVG extraction:** The Blink lightning bolt icon is visible in their app and web presence. For a monochrome version suitable for Afribit SATS, trace the lightning bolt SVG manually or use a tool like Figma's "Copy as SVG" from a screenshot of the icon
- **Alternative:** Use a generic lightning bolt SVG from Tabler Icons (`ti-bolt`) — this is acceptable for Phase 1 and requires no brand permission
- **Formal request:** Email `hello@blink.sv` explaining the Afribit integration and requesting permission to use the Blink wordmark/logo within the app. Given the Bitcoin financial inclusion context, approval is likely.

### Fedi Logo
- **Source:** Fedi's GitHub at `github.com/fedibtc` — the repository contains app assets including the logo SVG
- Fedi went fully open source under the AGPL license on January 3, 2026. The codebase including UI assets is now publicly available.
- **Direct path:** Clone `github.com/fedibtc/fedi` and extract the logo SVG from the `assets/` directory
- **For monochrome use:** Take the Fedi logo SVG and set all fill values to `#FFFFFF` — this produces the correct white monochrome version for use on the dark glass card background
- **Contact for formal permission:** `press@fedi.xyz` — explain the Afribit context, request permission to use the Fedi logo in the wallet connection card

### Bitcoin ₿ Symbol
- **Source:** The Bitcoin symbol is not trademarked. The `₿` Unicode character (U+20BF) renders in all modern browsers using the system font.
- **For icon use:** Bitcoin.org maintains official brand assets at `https://bitcoin.org/en/press` — the Bitcoin `₿` logo SVG is freely available for use in Bitcoin-related applications
- **Colour:** Always `#F7931A` — this is the official Bitcoin orange used across the ecosystem

### CoinGecko (Tool Strip Icon)
- **Source:** CoinGecko's brand kit at `https://www.coingecko.com/en/branding` — contains official logo files in SVG and PNG
- **Usage note:** CoinGecko permits use of their logo in third-party integrations that use their API. Attribution is requested where visible.

### General Brand Asset Sources for Future Integrations
- **Simple Icons:** `https://simpleicons.org` — SVG icons for over 3,000 brands, all open source. Includes Bitcoin, Lightning Network, and many crypto services. MIT-compatible usage.
- **Brandfetch API:** `https://brandfetch.com` — programmatic brand asset fetching. Free tier available. Useful for the tool strip when adding new integrations dynamically.

---

## Part 12 — Mic Button Fix

The current mic button is not triggering properly. The issue is likely one of three things:

**Problem 1 — `getUserMedia` requires HTTPS:** The Web Speech API and `getUserMedia()` require a secure context. Verify `window.isSecureContext === true` in the browser console on the deployed Vercel URL. It should be true. If not, check Vercel's HTTPS configuration.

**Problem 2 — Missing permission request UI:** iOS Safari requires a user gesture to request microphone permission. The tap on the orb must directly call `navigator.mediaDevices.getUserMedia({ audio: true })` in the event handler — not in a `setTimeout` or async chain that loses the gesture context.

**Problem 3 — Web Speech API availability:** Web Speech API (`window.SpeechRecognition || window.webkitSpeechRecognition`) is available in Chrome (Android) and Safari 14.1+ (iOS). Firefox does not support it. Detect availability and show a text-only fallback for unsupported browsers.

**Correct implementation:**
```javascript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

document.querySelector('.orb-btn').addEventListener('click', () => {
  if (!SpeechRecognition) {
    // Focus the text input instead
    document.querySelector('.orb-input').focus();
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = getUserLanguage(); // 'sw' for Swahili, 'en' for English
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => setOrbState('listening');
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    document.querySelector('.orb-input').value = transcript;
  };
  recognition.onend = () => {
    setOrbState('processing');
    submitToAI();
  };
  recognition.onerror = (e) => {
    setOrbState('resting');
    if (e.error === 'not-allowed') showMicPermissionError();
  };

  recognition.start();
});
```

**Swahili speech recognition note:** The Web Speech API uses Google's speech-to-text engine on Android Chrome. Swahili (`lang: 'sw'`) is supported — tested and confirmed to work for common Swahili phrases. Sheng is not a recognized `lang` code — use `sw-KE` (Swahili Kenya) for the best results.

---

## Part 13 — Wallet Selection Page — Alternative Approach

Instead of a list of cards, consider a **full-screen focus flow**:

On the "Connect a wallet" screen, only one wallet is in focus at a time. The screen opens showing Blink full-height with its connection UI. A small indicator at the bottom ("1 of 2") shows there is another wallet below. The user swipes up to see Fedi.

This approach:
- Removes the cognitive choice of "which one first" — Blink is always presented first (higher adoption globally)
- Gives each wallet its full moment — the card can be taller, richer, with a subtle brand colour tint in the background behind it
- Feels more like an onboarding journey than a selection menu

**Implementation:** A vertical snap scroll container with `scroll-snap-type: y mandatory` on the container and `scroll-snap-align: start` on each wallet panel.

```css
.wallet-selection-container {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
}

.wallet-panel {
  height: 100vh;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}
```

Each panel has a subtle full-bleed tinted background — Blink panel: very faint orange tint at 4% opacity. Fedi panel: very faint teal at 3% opacity. These tints distinguish the panels without breaking the black background language.

---

## Summary — Priority Order for Implementation

| Priority | Item | Complexity | Impact |
|---|---|---|---|
| P0 | Fix mic button (Web Speech API) | Low | Breaks core feature |
| P0 | Font system (Outfit + Space Grotesk + Space Mono) | Low | Transforms perceived quality |
| P0 | Moving gradient background (CSS only) | Low | Dramatically improves atmosphere |
| P1 | Header redesign (remove title, fix menu icon) | Low | Fixes most obvious legacy feel |
| P1 | Remove bottom nav, sidebar-only navigation | Medium | Simplifies information architecture |
| P1 | Message bubble readability fix | Low | Critical for usability |
| P1 | GSAP install + launch screen animation | Medium | Signature first impression |
| P2 | Wallet card premium redesign | Medium | Brand quality moment |
| P2 | PWA manifest + install banner (Android) | Low-Medium | Distribution |
| P2 | iOS install guide UI | Medium | Distribution (iOS users) |
| P2 | Tool strip connected/available states | Low | Ambient ecosystem communication |
| P3 | Blink OAuth2 application (contact Mattermost) | Admin | Better UX connection flow |
| P3 | GSAP balance counter animation | Low | Delight moment |
| P3 | Wallet selection snap-scroll redesign | Medium | Alternative to card list |

---

*Afribit Africa · afribit.africa · UI Revision Reference v2.0 · June 2026*