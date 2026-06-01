# Afribit SATS — Frontend UI Description
**Deployed:** https://afribit-ai.vercel.app/  
**Document type:** UI/UX Frontend Specification (Designer & Developer Reference)  
**Version:** 1.0 · June 2026

---

## Design Language

### Apple-first, always

Every visual, interaction, and motion in Afribit SATS follows Apple's Human Interface Guidelines as the base design system. This is not about copying iOS — it is about borrowing the thing Apple has perfected: the feeling that the interface is not there. It gets out of the way. It trusts the user.

Specific Apple design qualities that apply everywhere in this app:

- **Typography:** SF Pro Display for large headings and balance numbers. SF Pro Text for body copy, labels, and secondary information. SF Pro Rounded for the orb label and any playful one-line moments. These are Apple's system fonts and are available natively on iOS Safari without any import. On Android and desktop, fall back to `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Never use a third-party font for core UI text.
- **Weight discipline:** Two weights only in UI text — Regular (400) for body and labels, Semibold (600) for numbers, headings, and primary actions. Never bold (700) in UI. Bold is for marketing, not product.
- **Sizing:** Follow Apple's dynamic type scale. Minimum tap target 44×44pt. No text below 13pt in any interactive or readable context.
- **Spacing:** 8pt grid throughout. Margins are multiples of 8. Internal card padding is 16pt or 20pt. Never odd numbers.
- **Motion:** Apple spring physics for all transitions — `spring(damping: 0.7, response: 0.4)`. No linear or ease-in-out animations anywhere in the product. Everything bounces slightly. Everything feels physical.
- **Colour restraint:** Maximum three colours visible at once on any screen. One background, one text, one accent. The accent is Bitcoin orange `#F7931A`. It earns its appearance — used only for the most important element on screen at any given moment.

---

## The Glass Material

The screenshot reference provided shows a collection of glass morphism frames — frosted, translucent panels with soft white highlight edges and a subtle inner glow. This is the material used for all cards, buttons, and interactive surfaces in Afribit SATS.

### How to describe it precisely

The glass effect is not a CSS `backdrop-filter: blur()` hack. It is a specific composition:

- **Base fill:** White at 8–12% opacity (`rgba(255, 255, 255, 0.10)`)
- **Border:** 1px solid white at 25% opacity (`rgba(255, 255, 255, 0.25)`) on all sides
- **Inner highlight:** A 1px top-left stroke at white 40% opacity — simulates the light catching the top edge of glass, like the top-left panels in the reference screenshot
- **Corner radius:** 20pt for wallet cards. 14pt for smaller panels. 100pt (pill) for buttons.
- **No drop shadow.** The glass lifts itself through light contrast, not shadow.
- **Background behind glass:** Deep near-black `#0B0B0F`. The glass only reads as glass because what's behind it is dark. The white border and highlight glow against dark — exactly as in the reference image where each frame reads clearly against the grey-blue background.

This material is used for:
- Wallet connection cards (Blink, Fedi)
- The main dashboard display panel
- The orb input bar
- All modal and form surfaces
- The sidebar drawer

---

## Screen 1 — Launch Screen

### Context

This screen appears when an unauthenticated user opens the app at `afribit-ai.vercel.app` for the first time, or when returning after being logged out. It is a full-screen animation sequence. No interaction is available until the sequence completes.

### Background

Full-screen solid `#0B0B0F`. No texture, no pattern, no gradient. Pure near-black. The darkness is intentional — it makes everything that appears on it feel luminous.

### Animation sequence (in order)

**Beat 1 — 0ms to 400ms**  
The screen is completely black. Nothing. A moment of darkness before the reveal. This pause creates anticipation. Do not skip it.

**Beat 2 — 400ms to 900ms**  
The Bitcoin symbol `₿` fades in at the centre of the screen. Size: 52pt. Colour: `#F7931A` (Bitcoin orange). Opacity animates from 0 to 1 with an Apple spring curve. It does not scale in — it simply appears, like a light being switched on.

**Beat 3 — 900ms to 1400ms**  
The symbol scales very subtly from 1.0 to 1.04 and back to 1.0 — a single gentle pulse. As if it is breathing. Duration 500ms. Spring physics.

**Beat 4 — 1400ms to 2100ms**  
The symbol slides upward 32pt from its centre position, making room for the text below. Simultaneously, the word "Welcome to" appears below it in SF Pro Display Regular, 17pt, white at 60% opacity. It fades in character by character from left to right, each character delayed by 30ms. The full phrase takes 420ms to complete.

**Beat 5 — 2100ms to 2800ms**  
"Afribit AI" appears on the next line. SF Pro Display Semibold, 34pt, pure white `#FFFFFF`. Same character-by-character fade, 40ms delay per character. This line commands more visual weight than the line above — it is the name. Users should feel it land.

**Beat 6 — 2800ms to 3500ms**  
A 700ms pause. The logo and name sit on screen in silence. This is intentional pacing — Apple's philosophy is that silence in animation communicates confidence. An animation that rushes feels cheap.

**Beat 7 — 3500ms to 4000ms**  
A single white horizontal rule, 40pt wide, 0.5pt tall, appears below the wordmark with a left-to-right draw animation. Colour: white at 30% opacity. This is the only decorative element on the launch screen.

**Beat 8 — 4000ms to 4600ms**  
The setup button fades and slides up from 24pt below its final position. It arrives at the centre-bottom third of the screen. Apple spring physics. The button is described in detail below.

**After the sequence**  
The entire launch screen fades out as a unit (not element by element) over 300ms when the user taps the setup button, transitioning to Screen 2.

### Setup button — material and spec

The button matches the glass material from the reference screenshot — specifically the wide rectangular glass pill shapes visible in the second row of the reference image.

- **Shape:** Pill — fully rounded ends. Height 52pt. Width fills screen minus 40pt horizontal margin (20pt each side). Maximum width 320pt on larger screens.
- **Fill:** White at 10% opacity — the glass base.
- **Border:** 1pt, white at 28% opacity, all sides.
- **Inner highlight:** 1px top edge at white 45% opacity — the light-catching top edge of the glass frame.
- **Label text:** "Get started" — SF Pro Display Semibold, 17pt, pure white `#FFFFFF`. Centred.
- **On press:** The button compresses to 96% scale with Apple spring damping. The border brightens to white at 45% opacity for the duration of the press. Releases back to resting state on lift.
- **No shadow.** No glow. The glass catches light from its own material.

---

## Screen 2 — Wallet Selection

### Context

This is the first setup screen. User has tapped "Get started" on the launch screen. The transition into this screen is a vertical slide-up of the entire new screen from the bottom edge, with the launch screen fading out behind it simultaneously.

### Layout

Full-screen. Background: `#0B0B0F`. No bottom navigation — this is setup, not the main app.

**Top section — heading block**  
Positioned at 20% from the top of the screen.

- Line 1: "Connect a wallet" — SF Pro Display Semibold, 28pt, white `#FFFFFF`
- Line 2: "Choose one to start. You can add more later." — SF Pro Text Regular, 15pt, white at 50% opacity
- Both lines left-aligned with 20pt left margin

**Middle section — wallet cards**  
Two cards arranged vertically, stacked with 14pt gap between them. Each card is horizontally centred. Width: screen width minus 32pt total (16pt each side). This is the main content of the screen.

Each card is described in detail below.

**Bottom section**  
A text link centred at the bottom: "I'll do this later" — SF Pro Text Regular, 15pt, white at 40% opacity. Tapping this takes the user to the main screen in a read-only state with no wallets connected.

---

## Wallet Cards — Design Specification

These are the most important designed objects in the onboarding flow. They must be exceptional. The reference screenshot shows glass frames with inner light reflections, rounded corners, and a translucent white surface against a grey-blue background. The Afribit wallet cards adapt this to a dark background context.

### Card structure — both cards follow this template

**Outer container**
- Width: 100% of screen minus 32pt
- Height: 96pt
- Border radius: 22pt (slightly more rounded than standard — feels substantial and premium)
- Fill: white at 9% opacity
- Border: 1pt all sides, white at 22% opacity
- Top-edge inner highlight: a 1pt line at the very top inner edge of the card at white 40% opacity — this is what makes the glass look like it catches light, exactly as seen in the reference screenshot
- No shadow

**Left region — brand mark**  
A 48×48pt rounded square (border radius 12pt) sits 20pt from the left edge, vertically centred in the card.  
Fill: white at 7% opacity  
Border: 1pt, white at 15% opacity  
Contains the wallet logo centred at 26pt. The logo must be white/monochrome — no colour logos on the glass surface.

**Right region — text**  
Begins 14pt right of the logo container.  
- Line 1: Wallet name — SF Pro Display Semibold, 18pt, white `#FFFFFF`
- Line 2: One-line descriptor — SF Pro Text Regular, 13pt, white at 55% opacity
- Line 3: Connection status (on returning visits only) — SF Pro Text Regular, 12pt, `#00C896` for connected, white at 30% for not connected

**Far right — chevron**  
An SF Symbol `chevron.right` or equivalent — 16pt, white at 30% opacity, right-aligned with 20pt margin. On hover/focus the chevron shifts to white at 60%.

**On press — card behaviour**  
The entire card compresses uniformly to 97% scale with Apple spring physics. The border brightens to white at 40% for the press duration. Releases on lift.

---

### Blink card

**Logo mark area:** The Blink lightning bolt icon, rendered as a clean white outline SVG, 26pt, centred in the 48pt container.

**Name:** "Blink"  
**Descriptor:** "Lightning wallet · Self-custodial"  

**On tap:** The card initiates the Blink connection attempt. Described in Screen 3a.

---

### Fedi card

**Logo mark area:** The Fedi logo mark — a simplified white outline SVG of the Fedi emblem, 26pt, centred.

**Name:** "Fedi"  
**Descriptor:** "Community ecash · Fedimint"

**On tap:** Initiates the Fedi connection attempt. Described in Screen 3b.

---

## Screen 3a — Blink Connection Flow

### State 1: Auto-detect attempt

Immediately on tapping the Blink card, before any loading indicator, the card expands in place — it scales from its resting size to fill approximately 60% of the screen height, centred vertically, with a spring animation. The other card slides down and off-screen simultaneously.

The expanded card now shows:
- Blink logo mark at top centre, 36pt
- "Connecting to Blink" below it — SF Pro Display Semibold, 20pt, white
- A subtle activity indicator below: three dots that pulse sequentially left to right. Each dot is 6pt wide, white at 50% opacity. The pulse is a scale animation (1.0 to 1.4 to 1.0) staggered 200ms between dots. This loops until the connection attempt resolves.
- Beneath the dots: "Looking for your Blink wallet…" — SF Pro Text Regular, 14pt, white at 40% opacity

This state lasts a maximum of 5 seconds. If auto-detect succeeds, go to State 3 (success). If it fails or times out, transition to State 2 (manual input).

**Auto-detect note for developers:** The app attempts to detect an existing Blink session or OAuth token stored in the browser. This is the auto-connect path — no key needed if the user is already authenticated with Blink in the same browser context.

---

### State 2: Manual API key input

Auto-detect has failed. The card transitions internally — the loading indicator fades out, and the manual input form fades in. No full-screen navigation change. The card is the entire experience.

**Inside the card (still the expanded glass panel):**

- "Enter your Blink API key" — SF Pro Display Semibold, 17pt, white
- 4pt spacing
- A single text input field:
  - Fill: white at 6% opacity
  - Border: 1pt, white at 18% opacity
  - Border radius: 12pt
  - Height: 48pt
  - Padding: 14pt horizontal
  - Placeholder text: "blink_..." — SF Pro Mono Regular, 14pt, white at 25% opacity
  - Input text: SF Pro Mono Regular, 14pt, white `#FFFFFF`
  - On focus: border brightens to white at 35%, a 1pt inner top highlight appears at white 30%
  - The keyboard type is `password` — the input is masked with dots by default, with a visibility toggle (eye icon) at the right side of the field at white 30% opacity

- Below the input field, 10pt spacing:  
  A text link: "How do I get a Blink API key?" — SF Pro Text Regular, 13pt, `#F7931A` (Bitcoin orange). This is the only orange element on the screen at this moment, so it catches the eye immediately. Tapping it opens a bottom sheet (see Screen 3c).

- Below the link, 20pt spacing:  
  A glass pill button: "Connect Blink" — full width of the card minus 16pt internal padding. Same glass material spec as the launch screen button. Label: SF Pro Display Semibold, 16pt, white. Disabled state if the input field is empty: button border at white 10%, label at white 25%.

- Below the connect button, 12pt spacing:  
  A subtle text link: "Go back" — SF Pro Text Regular, 14pt, white at 30% opacity. Tapping this collapses the card back to its resting size and restores both cards on screen.

---

### State 3: Connection success

The API key has been validated and the wallet has connected. The card plays a success animation:

1. The input form fades out (200ms)
2. A single large checkmark appears at card centre — not an icon, but drawn with a stroke animation: a thin 2pt white line draws itself from the bottom-left of the check to the top-right, then down. Duration 400ms. Spring easing.
3. "Blink connected" appears below the checkmark — SF Pro Display Semibold, 18pt, white
4. Below that: the live balance in sats — SF Pro Display Semibold, 24pt, `#F7931A`. This is the first time the user sees their real Bitcoin data. It should feel like a reveal.
5. 800ms pause
6. The card collapses and the screen transitions to the main interface with a vertical slide-up

---

### Screen 3b — Fedi Connection Flow

Follows the same structural pattern as Screen 3a with these differences:

**Auto-detect label:** "Looking for your Fedi federation…"

**Manual input label:** "Enter your federation invite code"

**Input placeholder:** `fed1...` — SF Pro Mono Regular

**Help link:** "What is a federation invite code?" — same orange link style

**Success state balance label:** Shows the Fedi ecash balance in sats beneath "Fedi connected"

---

### Screen 3c — Help Bottom Sheet

This appears when the user taps the orange "How do I get a Blink API key?" or "What is a federation invite code?" link.

**Container:** A glass panel that slides up from the bottom of the screen. It does not take the full screen — it occupies approximately 55% of screen height. Behind it, the card and background are visible but darkened to 60% opacity.

**Handle bar:** A 36×4pt pill shape at the top of the sheet, white at 25% opacity. The sheet is draggable — pulling it down dismisses it.

**Content — Blink key version:**

Title: "Getting your Blink read-only key" — SF Pro Display Semibold, 17pt, white  
Spacing: 16pt

Numbered steps in SF Pro Text Regular, 14pt, white at 70% opacity. Each step has a circular step number (18pt diameter, white at 8% fill, white at 20% border, white step number at 60% opacity, SF Pro Display Semibold 12pt):

1. Open your Blink app or go to dashboard.blink.sv
2. Tap Settings → API keys
3. Select "Read only" scope
4. Copy the key and paste it above

Below the steps, 20pt spacing:  
An orange text link: "Open Blink dashboard →" — SF Pro Text Semibold, 14pt, `#F7931A`. This opens the URL externally.

Below the external link, 16pt spacing:  
A glass pill button full-width: "Got it" — tapping this dismisses the sheet. SF Pro Display Semibold, 16pt, white.

---

## Screen 4 — Main Interface

### Context

The user has successfully connected at least one wallet. This is the primary screen of the application. It is the destination after onboarding and the screen they return to on every subsequent open.

The main interface is one screen. There are no tabs. There is no bottom navigation bar. There is no page to navigate to. Everything happens here. The AI surfaces what is needed in the display zone; the user speaks or types in the orb at the bottom.

---

### Sidebar — collapsible, slides from left edge

The sidebar is hidden by default. It is revealed by tapping the menu icon (top-left, 32×32pt glass pill) or by swiping right from the left edge of the screen.

**When closed:** The sidebar occupies zero visible width. The main interface fills the full screen. The menu icon is the only indicator that a sidebar exists.

**When open:** The sidebar slides in from the left, covering 76% of the screen width (approximately 280pt on a standard iPhone). Behind it, the main interface is visible but darkened and scaled very slightly (to 96%) — this is Apple's standard sidebar reveal effect, as seen in the Files app and Mail. Tapping the exposed right edge or swiping left closes it.

**Sidebar surface:** Full glass panel — white at 8% opacity, right-edge border at white 20% opacity, no left border (the screen edge is the border).

**Sidebar content, top to bottom:**

- **Top safe area spacer** — respects iPhone notch/Dynamic Island height
- **Logo lockup** — Bitcoin symbol ₿ at 22pt `#F7931A` followed by "SATS" in SF Pro Display Semibold 18pt white, side by side with 8pt gap. 20pt from top of content.
- **Connected wallets section** — label "Wallets" in SF Pro Text Regular 11pt white at 35% opacity, letter-spacing 0.8pt, uppercase. Below it, each connected wallet as a row: wallet icon (20pt) + wallet name (SF Pro Text Regular 14pt white) + live sats balance right-aligned (SF Pro Display Semibold 14pt white at 70%). A `#00C896` 6pt dot to the left of the icon indicates connected status.
- **A "+" add wallet row** — same height as wallet rows. Icon: a 20pt circle with a `+` inside, white at 25%. Label: "Add wallet" — SF Pro Text Regular 14pt white at 35%. Tapping this initiates the wallet connection flow (Screen 3a/3b) as a modal over the main interface, without navigating away.
- **Thin divider** — 0.5pt, white at 10%, full width
- **Navigation items** — each is a 44pt tall row with 20pt left padding. Icon at 20pt white at 45%, label at SF Pro Text Regular 15pt white at 70%. Active item has white at 90% label and a 3pt left-edge border at `#F7931A`. Items: Home, History, Analytics.
- **Spacer that fills remaining height**
- **Bottom section** — always pinned to the bottom above the safe area. Same row format: Account, Settings, Security.

---

### Display zone — upper two-thirds of the screen

The display zone is a full-bleed area from the top of the screen (below the status bar) to the top edge of the tool strip. It has no fixed card structure — the AI renders whatever is contextually appropriate into this space.

**Default state (no conversation, fresh open):**

A single glass card fills the display zone with comfortable padding. This is the portfolio summary card.

- **"Total balance" label** — SF Pro Text Regular 11pt, white at 35% opacity, letter-spacing 0.8pt, uppercase. Sits at top-left of the card with 20pt margin.
- **Primary balance figure** — the total sats across all connected wallets. SF Pro Display Semibold, 44pt, white `#FFFFFF`. Letter-spacing -1pt. The number counts up from zero when first loaded — each digit increments from 0 with a slot-machine style animation, settling on the real value. Duration 800ms, staggered from left digit to right.
- **KES equivalent** — SF Pro Text Regular 15pt, white at 50% opacity. Below the sats figure.
- **Change indicator** — an arrow icon (SF Symbol `arrow.up.right` or `arrow.down.left`) followed by the KES change amount and percentage. `#00C896` for positive, `#FF4D4D` for negative. SF Pro Text Semibold 13pt.
- **Sparkline** — a minimal 1pt-stroke line chart showing the 30-day balance trend. White at 25% opacity for the line. No axes, no labels, no grid. Just the shape of the movement.
- **Per-wallet mini chips** — below the sparkline, a horizontal row of small glass chips (one per connected wallet). Each chip: wallet name in SF Pro Text Regular 11pt white at 45%, sats balance in SF Pro Display Semibold 13pt white. Border radius 10pt, glass fill.

**When the AI responds:**

The portfolio card slides up and off the top of the display zone (spring animation). The AI's response renders in its place — as a glass card containing the answer. If the user asked about their balance, a balance-focused card appears. If they asked about inflation, an inflation comparison card appears. The display zone is a canvas, not a fixed layout.

**Conversation history:**

Above the AI's current response card, the user's most recent message appears as a smaller pill — SF Pro Text Regular 14pt, white at 70%, on a glass pill surface, right-aligned. This gives the feeling of a chat thread without the complexity of a full chat UI. Only the last user message and the current AI response are visible. Older history is accessible via History in the sidebar.

---

### Tool strip — between display zone and orb

A full-width horizontal strip, height 34pt. Background: `#0B0B0F` (same as page). Top and bottom borders: 0.5pt, white at 8% opacity.

This strip contains an endlessly looping horizontal scroll of connected tool icons. The scroll is automatic — no user interaction needed or expected. It is ambient information, not a navigation element.

Each tool icon is a 22×22pt rounded square (border radius 6pt):  
- **Connected tools:** Glass fill (white at 9%), border white at 22%, icon at white 70%. The connected state tools are visually distinct — they glow slightly warmer than the unavailable ones.
- **Available but unconnected tools:** Background `#141414`, border white at 8%, icon at white 20%.

The strip loops continuously. The animation speed is slow — approximately 40pt per second. Fast enough to read as motion, slow enough to never feel frantic.

The icons in the strip (in order, looping): Blink ⚡, Fedi 🤝, Bitika, Minmo, CoinGecko, Mempool.space, and any future integrated tools. Connected tools appear first in the sequence.

---

### Orb input zone — bottom of screen

The orb zone is pinned to the bottom of the screen, above the system home indicator. It never scrolls. It is always accessible.

**Hint chips row (above the bar):**

A horizontal row of three glass pill chips, non-scrollable. These are contextual suggestions that change based on time of day, wallet state, and conversation history. Each chip is:
- Glass pill: white at 7% fill, 1pt border white at 15%, border radius 100pt
- Label: SF Pro Text Regular 13pt, white at 60%
- On tap: the chip's text populates the input and the AI begins responding immediately — no need to tap send

Default chips (morning, no conversation): "How much do I have?" · "This week's income" · "Am I up this month?"

**The orb and input bar:**

A single glass pill bar spanning the full width of the screen minus 16pt horizontal margin. Height: 60pt. Border radius: 100pt (fully rounded — this is a pill shape, matching the button shapes in the reference screenshot). Fill: white at 8%, border: 1pt white at 20%, top-inner highlight: 1pt white at 35%.

Inside the bar, left to right:

1. **The orb** — a circular button, 44×44pt, 8pt from the left inner edge of the bar. Fill: `#F7931A`. Border radius: 50%. Icon: a microphone symbol in black, 20pt. This is the only element in the entire interface with a solid Bitcoin orange fill — it commands attention.

2. **Text input field** — fills the space between the orb and the send button. Transparent background (inherits the bar's glass). SF Pro Text Regular 15pt, white. Placeholder: "Ask SATS anything…" in white at 30% opacity. The cursor blinks in `#F7931A`.

3. **Send button** — a 32×32pt glass circle at the right inner edge. Icon: an upward-pointing arrow, white at 60%. On tap: the bar compresses slightly (spring), the input text clears, and the AI begins processing.

**Orb states:**

- **Resting:** Solid `#F7931A` fill, microphone icon in black.
- **Listening:** The orb transitions its fill to `#1A0D00` (very dark orange-black). The border becomes a 1.5pt `#F7931A` ring. Inside: the microphone is replaced by an audio waveform — five vertical bars of varying heights (6pt, 14pt, 10pt, 18pt, 8pt), each bar 2.5pt wide, `#F7931A`, border radius 2pt, animating height continuously to represent live audio input. This animation is driven by the actual microphone amplitude if available, or a randomised simulation if not.
- **Processing:** After the user stops speaking or taps send. The orb's border ring pulses — fading in and out at 1.2-second intervals. The waveform is replaced by a single centered `•` that pulses in sync with the ring.
- **Complete:** The orb snaps back to its resting orange state as the AI response appears in the display zone.

---

## Loading States

Loading in Afribit SATS is never a spinner. Apple does not use spinners in its most refined products — they use skeletons, shimmer, and progressive disclosure.

### Wallet data loading (on app open, returning user)

The display zone shows the portfolio card immediately — but with placeholder content. Each text value that is still loading shows as a glass pill of the appropriate width and height, with a shimmer animation passing left to right at 1.5-second intervals. The shimmer is white, moving from 0% to 100% opacity across the pill width. This tells the user: data is coming, here is where it will be.

As each wallet's data resolves, its specific values replace the placeholder pills with a fade-in. The counter animation (slot machine digits) plays at that moment. Wallets that resolve first appear first — there is no waiting for all data before showing any.

### AI response loading

While the AI is generating a response, the display zone shows a glass card with three lines of shimmer placeholder — suggesting a response is forming. When the actual text begins to stream in, it replaces the shimmer token by token, left to right. The text does not pop in — it flows in, like it is being written in real time.

### Wallet connection loading (onboarding)

The pulsing three-dot indicator inside the expanded wallet card, described in Screen 3a. Duration is capped at 5 seconds before falling through to the manual key input.

### First-time full load sequence

On the very first successful connection, after the success animation on the wallet card, the screen transitions to the main interface — but instead of loading incrementally, the full loading sequence plays:

The display zone shows the portfolio card shell. Text lines appear as shimmer placeholders. A single line of small text appears below the card: "Loading [N] transactions…" in SF Pro Text Regular 12pt, white at 30% opacity. The number increments in real time as transaction history loads. When the number stops changing and all data has resolved, the shimmer fades out, the real values count up, and the loading text fades away. Total experience: 2–4 seconds on a good connection.

---

## Adding a Wallet After Onboarding

On the main interface, the sidebar contains the connected wallet list and a "+" add wallet row. Tapping it:

1. The sidebar closes with its standard slide-left animation
2. A modal sheet rises from the bottom of the screen — glass surface, covering approximately 80% of screen height
3. Inside the sheet: the same two wallet cards (Blink, Fedi) from the onboarding flow, plus any additional integrations available in future phases
4. The connection flow (auto-detect → manual input → success) plays inside this sheet
5. On success, the sheet closes, the sidebar reopens momentarily to show the new wallet row highlighted in `#F7931A`, then closes again
6. The display zone updates — the portfolio card reflects the new total balance, with the newly added wallet's mini chip appearing in the chips row with a spring-in animation

The "+" icon used near the dashboard: a 32×32pt glass circle with a `+` symbol in white at 60% opacity. Positioned in the top-right corner of the display zone, 16pt from the top and right edges of the card. On tap: initiates the add wallet modal described above.

---

## Responsive Sizing

The design is mobile-first, targeting iOS Safari and Android Chrome at 390pt width (iPhone 14 Pro base). All measurements above are in points at 1× — they scale with the device.

On smaller screens (375pt and below — iPhone SE):
- The wallet card height reduces from 96pt to 84pt
- The orb diameter reduces from 44pt to 40pt
- The primary balance figure reduces from 44pt to 36pt SF Pro Display

On larger screens (430pt and above — iPhone 14 Pro Max, iPad mini):
- Content is horizontally centred with a maximum content width of 430pt
- Padding increases proportionally
- The display zone gains vertical height — the portfolio card expands to use it

The app does not have a tablet or desktop layout in Phase 1. It is a mobile PWA. On iPad or desktop, it centres at 390pt width on a dark background, maintaining the phone proportions.

---

## Colour Reference

| Token | Hex | Usage |
|---|---|---|
| Background | `#0B0B0F` | Full-screen backgrounds everywhere |
| Surface (dark) | `#141414` | Unconnected tool icons, secondary surfaces |
| Surface (glass fill) | `rgba(255,255,255,0.09)` | All glass cards, panels, bars |
| Glass border | `rgba(255,255,255,0.22)` | Borders on all glass elements |
| Glass highlight | `rgba(255,255,255,0.38)` | Top-edge inner highlight on glass |
| Bitcoin orange | `#F7931A` | Orb fill, active links, key accent moments |
| Orb dark state | `#1A0D00` | Orb fill while listening |
| Text primary | `#FFFFFF` | All primary labels and values |
| Text secondary | `rgba(255,255,255,0.55)` | Descriptors, subtitles |
| Text tertiary | `rgba(255,255,255,0.30)` | Placeholder text, disabled states |
| Positive | `#00C896` | Gains, connected status, success |
| Negative | `#FF4D4D` | Losses, errors |
| Orange border (listening) | `#F7931A` | Orb ring in listening state |

---

## Typography Reference

| Context | Font | Size | Weight | Colour |
|---|---|---|---|---|
| Balance primary | SF Pro Display | 44pt | Semibold | `#FFFFFF` |
| Screen heading | SF Pro Display | 28pt | Semibold | `#FFFFFF` |
| Wallet card name | SF Pro Display | 18pt | Semibold | `#FFFFFF` |
| AI response heading | SF Pro Display | 17pt | Semibold | `#FFFFFF` |
| Body / descriptors | SF Pro Text | 15pt | Regular | 55% white |
| Labels / chips | SF Pro Text | 13–14pt | Regular | 60–70% white |
| Overline / category | SF Pro Text | 11pt | Regular | 35% white, uppercase, 0.8pt tracking |
| API key input | SF Pro Mono | 14pt | Regular | `#FFFFFF` |
| Status / metadata | SF Pro Text | 12pt | Regular | 30% white |

---

*Afribit Africa · afribit.africa · UI Specification v1.0 · June 2026*