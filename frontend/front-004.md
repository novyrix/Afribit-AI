# Afribit SATS — V4 Revision: Critical Issues & Full Pages Specification
**Version:** 4.0 · June 2026  
**Deployed:** https://afribit-ai.vercel.app/  
**Covers:** Ecosystem screen fix, chat collapse/expand, PWA install detection bug, terms & privacy, AI preferences setup, NWC auto-connect research, all sidebar pages fully documented, settings page specification.

---

## What Was Inspected

Two screenshots show:
1. **Ecosystem screen:** The circular node layout is only showing one node (Blink) directly overlapping the central SATS node. All other nodes are missing or rendered at the same position. The "Soon" badge is misplaced. The radial layout math is broken.
2. **Sidebar:** Clean structure — Wallets, Home, History, Analytics, Account, Settings, Security. None of these pages exist. Tapping any item does nothing.

Critical issues also reported:
- Chat does not collapse the dashboard — squeezes instead
- Android PWA install wrongly shows iOS Safari instructions
- No terms of use or privacy policy in setup
- No AI preferences configuration in setup
- Wallet auto-connection fails — documented but not yet implemented
- Settings page does not exist
- No sidebar pages implemented at all

Every one of these is addressed below.

---

## Part 1 — Ecosystem Screen: The Node Layout is Broken

### What Is Wrong

Looking at the screenshot: the Blink node is sitting directly on top of the central SATS node. The other nodes are not visible — they are either rendered at `0,0` or not rendered at all. This is a math bug in the polar coordinate calculation.

### Root Cause

The most common cause of this is forgetting to convert degrees to radians, or using `Math.sin`/`Math.cos` on degree values directly (JavaScript trigonometry functions use radians, not degrees). Another common cause is the container not having `position: relative` so `position: absolute` children all stack at the same point.

### Complete Fixed Implementation

```javascript
// React component — EcosystemScreen.jsx

const SERVICES = [
  {
    id: 'blink',
    name: 'Blink',
    category: 'wallets',
    status: 'available',       // 'connected' | 'available' | 'soon'
    description: 'Lightning · Self-custodial',
    icon: 'logo-blink',
  },
  {
    id: 'fedi',
    name: 'Fedi',
    category: 'wallets',
    status: 'available',
    description: 'Community ecash · Fedimint',
    icon: 'logo-fedi',
  },
  {
    id: 'bitika',
    name: 'Bitika',
    category: 'buy',
    status: 'soon',
    description: 'Buy with M-Pesa',
    icon: 'logo-bitika',
  },
  {
    id: 'minmo',
    name: 'Minmo',
    category: 'buy',
    status: 'soon',
    description: 'Buy Bitcoin KES',
    icon: 'logo-minmo',
  },
];

function getNodePositions(count, radiusPx) {
  return Array.from({ length: count }, (_, i) => {
    // CRITICAL: subtract PI/2 to start at the top (12 o'clock position)
    // CRITICAL: multiply by Math.PI / 180 if working in degrees
    // We work directly in radians here:
    const angleRad = ((2 * Math.PI) / count) * i - Math.PI / 2;
    return {
      x: Math.round(Math.cos(angleRad) * radiusPx),
      y: Math.round(Math.sin(angleRad) * radiusPx),
    };
  });
}

export function EcosystemScreen() {
  const [category, setCategory] = useState('wallets');
  const filtered = SERVICES.filter(s => s.category === category);
  const positions = getNodePositions(filtered.length, 130); // 130px radius

  const CONTAINER_SIZE = 320; // px — the circular canvas
  const CENTER = CONTAINER_SIZE / 2;
  const NODE_SIZE = 56; // px diameter

  return (
    <div className="ecosystem-screen">
      {/* Category tabs */}
      <div className="category-tabs">
        <button
          className={category === 'wallets' ? 'tab active' : 'tab'}
          onClick={() => setCategory('wallets')}
        >
          Wallets
        </button>
        <button
          className={category === 'buy' ? 'tab active' : 'tab'}
          onClick={() => setCategory('buy')}
        >
          Buy Bitcoin
        </button>
      </div>

      {/* Radial canvas — MUST be position:relative with explicit width/height */}
      <div
        className="radial-canvas"
        style={{
          position: 'relative',
          width: `${CONTAINER_SIZE}px`,
          height: `${CONTAINER_SIZE}px`,
          margin: '0 auto',
        }}
      >
        {/* Connection lines — drawn as SVG behind nodes */}
        <svg
          width={CONTAINER_SIZE}
          height={CONTAINER_SIZE}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {positions.map((pos, i) => (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={CENTER + pos.x}
              y2={CENTER + pos.y}
              stroke={
                filtered[i].status === 'connected'
                  ? 'rgba(247,147,26,0.40)'
                  : 'rgba(247,147,26,0.12)'
              }
              strokeWidth="0.5"
              strokeDasharray={filtered[i].status === 'soon' ? '3 4' : 'none'}
            />
          ))}
        </svg>

        {/* Central SATS node */}
        <div
          className="central-node"
          style={{
            position: 'absolute',
            left: `${CENTER - NODE_SIZE / 2}px`,
            top: `${CENTER - NODE_SIZE / 2}px`,
            width: `${NODE_SIZE}px`,
            height: `${NODE_SIZE}px`,
          }}
        >
          <span className="btc-symbol">₿</span>
        </div>

        {/* Service nodes — each positioned using polar → cartesian */}
        {filtered.map((service, i) => {
          const pos = positions[i];
          return (
            <div
              key={service.id}
              className={`service-node ${service.status}`}
              style={{
                position: 'absolute',
                // Centre the node on its calculated point:
                left: `${CENTER + pos.x - NODE_SIZE / 2}px`,
                top: `${CENTER + pos.y - NODE_SIZE / 2}px`,
                width: `${NODE_SIZE}px`,
              }}
              onClick={() => service.status !== 'soon' && handleServiceTap(service)}
            >
              <div className="node-circle">
                <img
                  src={`/assets/logos/${service.icon}.svg`}
                  alt={service.name}
                  width="26"
                  height="26"
                />
                {service.status === 'soon' && (
                  <span className="soon-badge">Soon</span>
                )}
                {service.status === 'connected' && (
                  <span className="connected-dot" />
                )}
              </div>
              <span className="node-label">{service.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Key Fix: Why `CENTER + pos.x - NODE_SIZE / 2`

Each node's `left` and `top` must account for the node's own size — `NODE_SIZE / 2` on each axis. Without this subtraction, the node's top-left corner sits at the calculated position instead of the node's centre. This is the second most common bug causing all nodes to appear clustered near the centre.

### Visual States for Nodes

```css
.service-node .node-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.2s ease;
}

.service-node.connected .node-circle {
  border-color: rgba(0,200,150,0.50);
}

.service-node.soon .node-circle {
  opacity: 0.45;
  cursor: default;
}

.service-node .node-circle:active {
  transform: scale(0.93);
}

.node-label {
  display: block;
  text-align: center;
  font-size: 11px;
  color: rgba(255,255,255,0.55);
  margin-top: 6px;
  font-family: var(--font-ui);
}

.soon-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: rgba(247,147,26,0.20);
  color: #F7931A;
  font-size: 9px;
  font-family: var(--font-ui);
  padding: 2px 5px;
  border-radius: 4px;
  border: 0.5px solid rgba(247,147,26,0.30);
}

.connected-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00C896;
  border: 1.5px solid #0B0B0F;
}
```

---

## Part 2 — Chat Collapse/Expand: Full Screen Conversation Mode

### The Behaviour

When the user sends a message or taps the orb, the dashboard panel (balance card + wallet chips + sparkline) collapses upward and off screen. The full display zone becomes a conversation surface. After 9 seconds of no new message activity, the dashboard slides back down with a smooth spring animation.

This is not a navigation change — it is a layout state change. React state drives it, GSAP animates it.

### Implementation

```javascript
// State
const [chatMode, setChatMode] = useState(false); // false = dashboard visible
let inactivityTimer = null;

function enterChatMode() {
  if (chatMode) return;
  setChatMode(true);

  // Animate dashboard out
  gsap.to('.dashboard-panel', {
    y: -120,
    opacity: 0,
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => {
      document.querySelector('.dashboard-panel').style.display = 'none';
    }
  });

  // The dark overlay beneath the dashboard (already in DOM, opacity 0)
  // This hides the dashboard area so chat fills it
  gsap.to('.dashboard-overlay', {
    opacity: 1,
    duration: 0.3,
    ease: 'none'
  });

  scheduleInactivityReturn();
}

function exitChatMode() {
  if (!chatMode) return;
  clearTimeout(inactivityTimer);

  document.querySelector('.dashboard-panel').style.display = 'block';

  gsap.to('.dashboard-overlay', { opacity: 0, duration: 0.2 });

  gsap.from('.dashboard-panel', {
    y: -80,
    opacity: 0,
    duration: 0.55,
    ease: 'back.out(1.2)',
  });

  setChatMode(false);
}

function scheduleInactivityReturn() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    exitChatMode();
  }, 9000); // 9 seconds
}

// Reset the timer on every new message or user tap
function onUserActivity() {
  if (chatMode) scheduleInactivityReturn();
}
```

### The Dark Overlay

```html
<!-- In the layout, between dashboard-panel and chat messages -->
<div class="dashboard-overlay"></div>
```

```css
.dashboard-overlay {
  position: absolute;
  inset: 0;
  background: #0B0B0F;   /* Same as app background — completely hides what's behind */
  opacity: 0;
  pointer-events: none;
  z-index: 2;            /* Above dashboard, below chat messages */
}

.dashboard-panel {
  z-index: 1;
}

/* Chat messages always on top */
.chat-messages {
  position: relative;
  z-index: 3;
}
```

### What "9 Seconds of Inactivity" Means

The timer resets on:
- Every new AI response token arriving
- Every user tap anywhere in the display zone
- Every voice recognition result
- Every text character typed in the orb

The timer fires and collapses chat mode back to dashboard when:
- 9 seconds pass with none of the above events
- User taps the `×` button that appears in the top-right of the screen during chat mode
- User scrolls up to the balance card area (re-anchoring to dashboard)

---

## Part 3 — Android PWA Install: Fixing the iOS Detection Bug

### The Bug

The app is showing iOS Safari install instructions to Android users. This means the platform detection logic is either wrong or missing. The install logic is incorrectly defaulting to iOS instructions for all users.

### Correct Platform Detection

```javascript
// platform-detect.js — run this at app initialisation, before any install UI

export function getPlatform() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true; // iOS standalone check

  // Samsung Internet, Chrome, Edge — all fire beforeinstallprompt on Android
  const supportsBeforeInstallPrompt = 'onbeforeinstallprompt' in window ||
    typeof BeforeInstallPromptEvent !== 'undefined';

  return {
    isIOS,
    isAndroid,
    isStandalone, // Already installed as PWA
    supportsBeforeInstallPrompt,
    isChromiumAndroid: isAndroid && /Chrome/.test(ua),
    isSamsungInternet: /SamsungBrowser/.test(ua),
    isSafariIOS: isIOS && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua),
    isChromeIOS: isIOS && /CriOS/.test(ua), // Chrome on iOS — cannot install
  };
}
```

### Install Flow Router — Shows the Correct UI Per Platform

```javascript
import { getPlatform } from './platform-detect';

let deferredInstallPrompt = null;
const platform = getPlatform();

// Capture the beforeinstallprompt event as early as possible
// This fires ONLY on Android Chromium browsers — never on iOS
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;

  // If we're on the install setup screen, reveal the install button
  const installBtn = document.querySelector('.install-btn-android');
  if (installBtn) installBtn.removeAttribute('hidden');
});

function renderInstallScreen() {
  if (platform.isStandalone) {
    // Already installed — skip this screen entirely
    proceedToNextStep();
    return;
  }

  if (platform.isChromeIOS) {
    // Chrome on iOS cannot install PWAs — show message
    showChromeIOSNotice();
    return;
  }

  if (platform.isIOS && platform.isSafariIOS) {
    // iOS Safari — show manual step-by-step guide
    showIOSInstallGuide();
    return;
  }

  if (platform.isAndroid || platform.isChromiumAndroid || platform.isSamsungInternet) {
    // Android — show native prompt button (hidden until beforeinstallprompt fires)
    showAndroidInstallUI();
    return;
  }

  // Desktop or unknown — show generic instructions
  showGenericInstallGuide();
}
```

### Android Install UI

```jsx
function AndroidInstallUI({ onInstall, onSkip }) {
  const [promptReady, setPromptReady] = useState(false);

  useEffect(() => {
    if (deferredInstallPrompt) setPromptReady(true);

    const handler = () => setPromptReady(true);
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      onInstall(); // Proceed to next setup step
    }
    deferredInstallPrompt = null;
  }

  return (
    <div className="install-screen">
      <div className="install-icon">📲</div>
      <h2>Install Afribit SATS</h2>
      <p>Add to your home screen for instant access, offline support, and a full-screen experience.</p>

      <div className="benefit-pills">
        <span className="pill">Works offline</span>
        <span className="pill">No app store</span>
        <span className="pill">Instant open</span>
      </div>

      {promptReady ? (
        <button className="install-btn-primary" onClick={handleInstall}>
          Add to Home Screen
        </button>
      ) : (
        <div className="install-waiting">
          <p style={{color: 'rgba(255,255,255,0.40)', fontSize: '13px'}}>
            Open in Chrome on Android to install
          </p>
        </div>
      )}

      <button className="install-skip" onClick={onSkip}>
        I'll do this later
      </button>
    </div>
  );
}
```

### iOS Install UI (Only Shown to Safari iOS Users)

```jsx
function IOSInstallGuide({ onDismiss }) {
  return (
    <div className="ios-install-guide">
      <h2>Add to your home screen</h2>
      <p style={{color: 'rgba(255,255,255,0.55)', fontSize: '14px'}}>
        Follow these three steps in Safari:
      </p>

      <div className="ios-step">
        <div className="step-num">1</div>
        <div className="step-content">
          <div className="step-icon">
            {/* SVG of Safari share icon — draw it inline */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M8 4l4-4 4 4M12 0v14M4 12v8h16v-8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>Tap the <strong>Share</strong> button at the bottom of Safari</div>
        </div>
      </div>

      <div className="ios-step">
        <div className="step-num">2</div>
        <div>Scroll down and tap <strong>"Add to Home Screen"</strong></div>
      </div>

      <div className="ios-step">
        <div className="step-num">3</div>
        <div>Tap <strong>Add</strong> to confirm</div>
      </div>

      <button className="install-skip" onClick={onDismiss}>
        Continue without installing
      </button>
    </div>
  );
}
```

---

## Part 4 — Setup Flow: Terms, Privacy, and AI Preferences

### Revised Setup Step Sequence

```
Step 0: Launch screen animation
    ↓
Step 1: Language selection (English / Kiswahili / Sheng)
    ↓
Step 2: Install app (platform-aware — Android or iOS)
    ↓
Step 3: Terms of Use & Privacy Policy
    ↓
Step 4: AI Preferences
    ↓
Step 5: Ecosystem / Connect services
    ↓
Main app
```

### Step 3 — Terms of Use & Privacy Policy

This screen must exist before any wallet connection. Users are sharing financial data with the AI. They have a right to know how it is handled, and you have a legal obligation to tell them — especially under Kenya's Data Protection Act 2019.

#### Screen Design

Full-screen glass panel. Title: "Before we begin" — Space Grotesk 600 22px.

**Two-section accordion:**

Section 1: "Terms of Use" — tap to expand. Summary text below, with a "Read full terms →" link that opens a bottom sheet with the full text.

Section 2: "Privacy Policy" — tap to expand. Summary text with "Read full policy →" link.

**Summary text (inside accordion, always visible):**

*Terms of Use summary:*
> Afribit SATS is a read-only wallet aggregator. We do not hold, move, or have access to your Bitcoin. You are responsible for your own wallet credentials. This app is provided as-is by Afribit Africa.

*Privacy Policy summary:*
> Your wallet keys and connection credentials are stored encrypted on your device only. We never transmit your API keys to our servers. The AI processes your wallet data to generate responses — these queries are sent to Anthropic's Claude API and are not stored by Afribit. Anonymous usage analytics may be collected to improve the app.

**Data storage disclosure (required):**

```
What we store:          Where            How long
──────────────────────────────────────────────────
Your language choice    Your device      Until you change it
Your wallet keys        Your device      Until you disconnect
Your connected services Your device      Until you disconnect
Cached balances         Your device      Until fresh data loads
AI conversation         Your device only Session only (unless you enable history)
```

**Consent checkboxes (required before continuing):**

```
☐ I agree to the Terms of Use
☐ I agree to the Privacy Policy
☐ I understand my wallet keys are stored on my device, not Afribit's servers
```

All three must be checked. The "Continue" button is disabled (50% opacity) until all are checked.

**Legal Note for Afribit:**
Under the Kenya Data Protection Act 2019, Afribit must:
- Register as a data controller if processing personal data (financial summaries are personal data)
- Maintain a privacy policy that is accessible and plain-language
- Not use personal data for purposes not disclosed at collection
- Allow users to request deletion of their data

The "Delete my data" option must exist in Settings → Account → Delete account. This wipes all IndexedDB and localStorage entries for this user.

### Step 4 — AI Preferences Configuration

This screen runs after terms acceptance. It personalises the AI before the user interacts with it for the first time.

#### Screen Design

Title: "Configure your AI" — Space Grotesk 600 22px  
Subtitle: "Tailor SATS to how you think about money" — Outfit Regular 15px, muted

**Preference 1: Language for AI responses**

```
How should SATS talk to you?
○ English
○ Kiswahili  
○ Sheng (Nairobi)
○ Mix it up (responds in the language you ask in)
```
Default: whichever language was selected in Step 1.

**Preference 2: Financial personality**

```
What matters most to you?
○ Just the facts — give me numbers and summaries
○ Teach me — explain what my data means
○ Coach me — help me save more and spend better
○ All of the above
```
This preference is stored and included in the AI system prompt to guide response style.

**Preference 3: Privacy level for AI context**

```
What can SATS see?
○ Everything — full balance, all transactions, inflation analysis
○ Summaries only — totals and trends, no individual transactions
○ Ask me each time
```
This controls how much wallet data is included in each AI prompt. "Summaries only" is a meaningful privacy option for users who are cautious.

**Preference 4: Notification tone**

```
When should SATS message you?
○ Never — I'll ask when I want to know
○ Big moves — only if something unusual happens
○ Regular updates — weekly summary
```
Stored in preferences. Used to control PWA push notification frequency (when notification permission is granted later).

**Storage:**
```javascript
const AI_PREFS_KEY = 'sats_ai_preferences';
localStorage.setItem(AI_PREFS_KEY, JSON.stringify({
  responseLanguage: 'sw',        // 'en' | 'sw' | 'shg' | 'auto'
  financialPersonality: 'coach', // 'facts' | 'teach' | 'coach' | 'all'
  privacyLevel: 'full',          // 'full' | 'summaries' | 'ask'
  notificationTone: 'unusual',   // 'never' | 'unusual' | 'weekly'
}));
```

**These preferences are injected into the AI system prompt:**
```javascript
function buildSystemPrompt(prefs, walletData) {
  const languageInstruction = {
    'en':  'Always respond in English.',
    'sw':  'Jibu kwa Kiswahili kila wakati.',
    'shg': 'Respond in Nairobi Sheng always.',
    'auto': 'Detect the language of the user\'s message and respond in the same language.',
  }[prefs.responseLanguage];

  const personalityInstruction = {
    'facts': 'Be concise and direct. Give numbers and summaries. Avoid explanations unless asked.',
    'teach': 'Explain financial concepts clearly. Use the user\'s own transaction data as examples.',
    'coach': 'Give actionable advice. Point out patterns and suggest improvements. Be encouraging.',
    'all': 'Be informative, educational, and actionable. Blend facts with coaching.',
  }[prefs.financialPersonality];

  const contextData = prefs.privacyLevel === 'full'
    ? fullWalletContext(walletData)
    : summaryWalletContext(walletData);

  return `You are SATS, an AI financial assistant for Afribit — a Bitcoin financial inclusion platform serving Kibera, Nairobi. You help users understand their Bitcoin wallets. ${languageInstruction} ${personalityInstruction}

Current wallet data:
${contextData}

Today's date: ${new Date().toLocaleDateString('en-KE')}
BTC/KES rate: ${walletData.kesRate} per BTC

Always refer to amounts in both sats and KES. Never give financial advice. Only describe what the data shows.`;
}
```

---

## Part 5 — Auto-Connection Research: NWC is the Answer

### The Core Problem

Every connection method documented so far (Blink API key, Fedi invite code) requires the user to go find a credential, copy it, come back to SATS, and paste it. This is a significant barrier for Kibera users who may not be technically comfortable with the concept of "API keys".

The better path is **Nostr Wallet Connect (NWC)** — an open protocol that is specifically designed to solve this problem. NWC is to Lightning wallets what OAuth is to web services: a standardised, user-friendly authorisation flow that does not require credential copying.

### What NWC Is

NWC (Nostr Wallet Connect, also called NIP-47) is an open protocol for connecting Lightning wallets to apps. The connection works as follows:

1. The **wallet** (Blink, Fedi, or any NWC-compatible wallet) generates a special connection string called a **connection URI**. It looks like: `nostr+walletconnect://pubkey?relay=wss://relay.example.com&secret=...`
2. The wallet displays this as a QR code or a copyable string
3. The **app** (SATS) receives this URI — either by the user scanning the QR code or pasting the string
4. Using this URI, the app can query balance, transaction history, and (with permission) send payments — all via encrypted Nostr relay messages

**Critical capability:** NWC supports `get_balance` and `list_transactions` — exactly what SATS needs for Phase 1 read-only aggregation.

### Does Blink Support NWC?

Research confirms: Blink (Galoy) does not currently expose a native NWC connection string from its interface. However, **Alby** (the Lightning browser extension) can connect to a Blink account and then expose NWC to SATS. This is a viable bridge.

More importantly, Blink's own API key method is simpler for server-side use cases and remains the recommended direct path for SATS. NWC is the better long-term standard once more wallets support it natively.

### Does Fedi Support NWC?

The Fedimint SDK supports NWC as a module. Fedimint federations that have the NWC module enabled can generate connection URIs. However, this requires the federation operator to have enabled it — it is not guaranteed for all Fedi federations.

### NWC Implementation for SATS

```javascript
// Install: npm install @getalby/sdk
import { nwc } from '@getalby/sdk';

async function connectViaNWC(connectionURI) {
  // Validate URI format
  if (!connectionURI.startsWith('nostr+walletconnect://')) {
    throw new Error('Invalid NWC URI format');
  }

  // Parse URI to extract pubkey, relay, and secret
  const client = new nwc.NWCClient({ nostrWalletConnectUrl: connectionURI });

  // Test connection with a balance query
  try {
    const info = await client.getInfo();
    const balanceRes = await client.getBalance();
    const balance = Math.floor(balanceRes.balance / 1000); // Convert msats → sats

    // Store connection URI encrypted
    await storeEncrypted('sats_nwc_uri', connectionURI);
    await storeEncrypted('sats_nwc_info', info);

    return { success: true, balance, walletName: info.alias || 'Lightning Wallet' };
  } catch (err) {
    throw new Error(`NWC connection failed: ${err.message}`);
  }
}

async function fetchNWCBalance() {
  const uri = await readEncrypted('sats_nwc_uri');
  if (!uri) return null;

  const client = new nwc.NWCClient({ nostrWalletConnectUrl: uri });
  const res = await client.getBalance();
  return Math.floor(res.balance / 1000);
}

async function fetchNWCTransactions(limit = 50) {
  const uri = await readEncrypted('sats_nwc_uri');
  if (!uri) return [];

  const client = new nwc.NWCClient({ nostrWalletConnectUrl: uri });
  const res = await client.listTransactions({ limit });
  return res.transactions; // Array of payment objects
}
```

### NWC Connection UX in the App

When the user taps a service that supports NWC (any NWC-compatible wallet, not just Blink or Fedi):

**Option A — QR Scan:**
The app opens the camera. User opens their wallet, finds the NWC connection QR, and scans it. The app parses the `nostr+walletconnect://` URI from the QR data and initiates the connection. This is the smoothest UX — zero copying.

```javascript
// QR scanner using jsQR (MIT, npm install jsqr)
import jsQR from 'jsqr';

async function startQRScan() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  const video = document.querySelector('.qr-video');
  video.srcObject = stream;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  function scanFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data.startsWith('nostr+walletconnect://')) {
        stream.getTracks().forEach(t => t.stop()); // Stop camera
        connectViaNWC(code.data);
        return;
      }
    }
    requestAnimationFrame(scanFrame);
  }
  requestAnimationFrame(scanFrame);
}
```

**Option B — Paste URI:**
A text input field with monospace font, placeholder `nostr+walletconnect://...`. The user pastes the NWC URI from their wallet app.

**How users get the NWC URI from their wallet:**
- **Alby extension:** Settings → Connections → New Connection → "Nostr Wallet Connect" → shows QR + URI
- **Mutiny wallet:** Settings → Wallet Connect → Generate Connection
- **Blink (via Alby bridge):** Connect Blink to Alby first, then use Alby's NWC
- **Any NWC wallet:** Usually in Settings → Developer → NWC or App Connections

### The "Easiest" Connection Matrix — What Works for Kibera Users

| Wallet | Connection method | User steps | Technical complexity |
|---|---|---|---|
| Blink | API key | Go to dashboard.blink.sv → Settings → API Keys → Copy | 4 steps |
| Blink | OAuth2 (apply first) | Tap "Connect with Blink" → log in → approve | 3 steps |
| Blink via NWC bridge | Via Alby | Requires Alby setup first — too complex | 6+ steps |
| Fedi | Invite code | Open Fedi → Settings → Share invite code → Paste | 4 steps |
| Fedi | Afribit default federation | Auto — no steps if using Afribit federation | 0 steps |
| Any NWC wallet | NWC URI | Open wallet → NWC settings → Show QR → Scan | 3 steps (with QR) |

**Recommendation for Kibera:** The Afribit-operated Fedimint federation (zero steps) for Fedi, and Blink API key with a visual step guide for Blink. NWC as the generic connector for any future wallet.

---

## Part 6 — All Sidebar Pages: Full Specification

None of these pages currently exist. Every sidebar item leads nowhere. This section documents every page completely so the developer has everything needed to build them.

### 6.1 — Home

The sidebar "Home" item returns the user to the main dashboard view. It closes the sidebar and resets the display zone to the balance card. No separate page — this is a state reset.

```javascript
function navigateHome() {
  closeSidebar();
  exitChatMode();       // Expand dashboard if collapsed
  scrollDisplayToTop(); // Return to balance card
}
```

### 6.2 — History Page

**Purpose:** Full, scrollable transaction history across all connected wallets.

**Header:** "Transaction History" — Space Grotesk 600 22px. A filter button (top right) — Tabler icon `ti-adjustments-horizontal`, white 60%.

**Filter bar (appears when filter button tapped):**
```
[All wallets ▾]  [All types ▾]  [Last 30 days ▾]
```
Each filter is a glass pill dropdown. All = default.

**Grouped list — grouped by date:**
```
TODAY
────────────────────────────────
↓  +8,500 sats   Received · Blink        14:23 · KES 453
────────────────────────────────
YESTERDAY
────────────────────────────────
↓  +5,000 sats   Taka Sats reward · Fedi 11:05 · KES 266
↑  -2,200 sats   Mama Njeri Shop          09:30 · KES 117
```

Each row:
- Left: direction icon in coloured circle (green fill for in, red for out)
- Centre: label (auto-generated or user-added note), wallet source below
- Right: sats amount (green/red), KES equivalent below, time

On tap: row expands to show full transaction details — txid (truncated), fee, confirmation time, and an "Add note" field.

**AI Insight button** (sticky at bottom, above orb): "Ask SATS about this period →" — glass pill. Tapping enters chat mode with context: "Analyse my transactions for [selected period]."

**Empty state:**
```
[ti-history icon, 32px, muted]
No transactions yet
Connect a wallet to see your history
[Connect wallet button]
```

### 6.3 — Analytics Page

**Purpose:** Visual financial analysis across all connected wallets.

**Period tabs:** 7D · 30D · 90D · All time

**Section 1 — Balance over time:**
Line chart (Recharts `<LineChart>`). X-axis: dates. Y-axis: sats balance. Multiple lines if multiple wallets connected. Bitcoin orange line for total portfolio.

**Section 2 — Income vs Spending:**
Two-column stat cards:
```
Received this period    Sent this period
145,000 sats            28,400 sats
KES 7,714               KES 1,511
```

**Section 3 — Inflation comparison:**
Glass card with orange left border. Title: "Your sats vs KES savings". Body text generated by the analytics engine — how much the same sats were worth at the start of the period vs now. Difference shown in `#00C896` if positive, `#FF4D4D` if negative.

**Section 4 — Top sources (income):**
Donut chart showing income by source label (Taka Sats program, merchant payments, etc.). Labels auto-generated by AI categorisation.

**AI Ask bar** at the bottom (same as History page): "Ask SATS about your analytics →"

### 6.4 — Account Page

**Purpose:** User identity and preferences management.

**Section: Your identity**

SATS has no server-side user account — the "account" is defined entirely by the connected wallets. This section reflects that clearly.

```
Your SATS profile
────────────────────────────────
Display name        [Tap to set]
Language            Kiswahili ›
AI personality      Coach ›
Privacy level       Full access ›
```

Display name is stored in `localStorage`. It is used in the AI greeting ("Habari [name]!"). It is optional and purely local.

**Section: Connected services**

Shows each connected wallet with:
- Logo, name, and connection type (API key / NWC / Invite code)
- Live sats balance (refreshed when page opens)
- "Disconnect" — a danger button (red text, no fill). On tap: shows confirmation: "This will remove your [Wallet] connection. Your wallet itself is unaffected." Two buttons: "Remove connection" (red) and "Cancel" (muted).

**Section: Data**

```
Delete all local data    [red button]
Export chat history      [glass button]
```

"Delete all local data" wipes all IndexedDB and localStorage entries — effectively a factory reset. Confirmation required: type "DELETE" in a text field before the button activates.

### 6.5 — Settings Page

**Purpose:** All configurable app behaviour. This is the most important missing page.

**Settings sections:**

**Display & Language**
```
Language                  Kiswahili  ›
Number format             1,234,567  ›  (or 1.234.567 for European format)
Currency display          KES first  ›  (or Sats first)
Balance visibility        Shown      ›  (toggle: shows dots instead of numbers — privacy)
```

**AI Behaviour**
```
Response language         Auto-detect ›
Financial personality     Coach       ›
Privacy level             Full access ›
Include BTC price context On          [toggle]
Include inflation data    On          [toggle]
Max response length       Medium      ›  (Short/Medium/Long)
```

**Notifications**
```
Push notifications        Off         [toggle — triggers permission request on enable]
Notification tone         Big moves   ›
Low balance alerts        Off         [toggle]
Alert threshold           —           [shows when low balance alerts = On]
```

**Chat & History**
```
Save chat history         Off         [toggle]
Auto-clear chat on close  On          [toggle]
Chat history retention    Session     ›  (Session / 7 days / 30 days / Forever)
```

**Connection & Data**
```
Auto-refresh wallets      Every 5 min ›
Offline mode              On          [toggle]
Cache duration            2 hours     ›
Clear cached data                     [glass button]
```

**About**
```
Version                   1.0.0
Open source               github.com/afribit/sats ›
License                   MIT
```

Each settings row follows this pattern:
- Left: 32×32pt glass icon square with relevant Tabler icon
- Centre: label (Outfit 14px white) + optional sub-label (Outfit 12px muted)
- Right: current value (Outfit 13px muted) + chevron, OR toggle switch for boolean settings

**Settings row component:**
```jsx
function SettingsRow({ icon, iconColor, label, sublabel, value, type, onPress, onToggle }) {
  return (
    <div className="settings-row" onClick={type === 'nav' ? onPress : undefined}>
      <div className="settings-icon" style={{ background: iconColor }}>
        <i className={`ti ti-${icon}`} aria-hidden="true" />
      </div>
      <div className="settings-text">
        <span className="settings-label">{label}</span>
        {sublabel && <span className="settings-sublabel">{sublabel}</span>}
      </div>
      {type === 'nav' && (
        <div className="settings-right">
          <span className="settings-value">{value}</span>
          <i className="ti ti-chevron-right" style={{color: 'rgba(255,255,255,0.25)'}} />
        </div>
      )}
      {type === 'toggle' && (
        <Toggle value={value} onChange={onToggle} />
      )}
    </div>
  );
}
```

### 6.6 — Security Page

**Purpose:** User controls for key security and app protection.

**Section: Key storage**

```
Storage location      This device (IndexedDB, encrypted)
Encryption type       AES-GCM 256-bit
Keys sent to server?  Never
Last key audit        [timestamp]
```

**Section: App protection**

```
Require authentication    Off    [toggle]
Authentication type       Biometric / PIN / None  ›  (shows when above = On)
Auto-lock after           1 minute  ›
Hide balance on screenshot On     [toggle]
```

"Require authentication" — when enabled, opens a biometric prompt on every app open. Uses the Web Authentication API (`navigator.credentials.get({ publicKey: ... })`). Note: this is available on Android Chrome and iOS Safari 16.4+.

**Section: Security audit log**

A reverse-chronological log of security-relevant events:
```
Jun 1 2026, 14:23   Blink wallet connected
Jun 1 2026, 09:11   App opened
May 31 2026, 16:45  AI query: wallet balance
May 30 2026, 11:22  Fedi wallet connected
```

This log is read-only, stored in IndexedDB, and never sent to Afribit servers.

**Section: Danger zone**

```
Disconnect all wallets    [red button]
Delete all data           [red button]
```

Each triggers a full-screen confirmation modal with explicit description of what will be deleted.

---

## Part 7 — Sidebar Navigation: State Management

Currently none of the sidebar items navigate anywhere because there is no router or view state management. Fix:

```javascript
// Use a simple view state — no router library needed for this structure
const [currentView, setCurrentView] = useState('home');

function navigateTo(view) {
  closeSidebar();
  // Animate current view out
  gsap.to('.view-container', {
    opacity: 0,
    x: -20,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: () => {
      setCurrentView(view);
      // Animate new view in
      gsap.from('.view-container', {
        opacity: 0,
        x: 20,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  });
}

// Sidebar item onClick handlers
const sidebarItems = [
  { id: 'home',      label: 'Home',      icon: 'home',      onClick: () => navigateTo('home') },
  { id: 'history',   label: 'History',   icon: 'history',   onClick: () => navigateTo('history') },
  { id: 'analytics', label: 'Analytics', icon: 'chart-bar', onClick: () => navigateTo('analytics') },
  { id: 'account',   label: 'Account',   icon: 'user',      onClick: () => navigateTo('account') },
  { id: 'settings',  label: 'Settings',  icon: 'settings',  onClick: () => navigateTo('settings') },
  { id: 'security',  label: 'Security',  icon: 'shield',    onClick: () => navigateTo('security') },
];

// Active state visual
function SidebarItem({ id, label, icon, onClick }) {
  return (
    <div
      className={`sidebar-item ${currentView === id ? 'active' : ''}`}
      onClick={onClick}
    >
      <i className={`ti ti-${icon}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
```

The active item gets: `#F7931A` icon and label colour, a 3px left border in `#F7931A`, background `rgba(247,147,26,0.07)`.

---

## Part 8 — Priority Order for V4 Implementation

| Priority | Task | Complexity | Time |
|---|---|---|---|
| P0 | Fix ecosystem node radial layout math | Low | 1h |
| P0 | Fix Android vs iOS install detection | Low | 1h |
| P0 | Chat mode collapse/expand with 9s timer | Medium | 3h |
| P0 | Wire up sidebar navigation (view state) | Medium | 2h |
| P1 | Terms + privacy screen (Step 3) | Low | 2h |
| P1 | AI preferences screen (Step 4) | Low | 2h |
| P1 | History page | Medium | 4h |
| P1 | Settings page | Medium | 4h |
| P1 | Account page | Medium | 3h |
| P1 | Security page | Medium | 3h |
| P1 | Analytics page | High | 6h |
| P2 | NWC connector via @getalby/sdk | High | 6h |
| P2 | QR scanner for NWC URI | Medium | 3h |
| P3 | Biometric authentication (Security page) | High | 4h |
| P3 | AI system prompt injection from preferences | Low | 1h |

---

*Afribit Africa · afribit.africa · V4 Revision Reference · June 2026*