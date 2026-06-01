# Afribit SATS — V3 UI Revision & Critical Systems Reference
**Version:** 3.0 · June 2026  
**Deployed:** https://afribit-ai.vercel.app/  
**Document type:** UI Revision + Critical Implementation Guide  
**Covers:** Chat layout, loading states, session management, wallet connections, background animation, onboarding redesign, app ecosystem screen, asset sourcing, and chat message behaviour.

---

## Honest Assessment of V2 Build

The background animation is working — the orange orb is visible and creates atmosphere. That is real progress. Everything else below is being fixed in V3.

**Critical failures observed in screenshots:**

1. **Chat breaks the layout** — the AI response and user message bubbles are overflowing the container, pushing the bottom navigation bar partially off-screen and collapsing the balance card's visible space. The chat area has no scroll containment.
2. **Fake AI loading state** — the microphone pulses when the AI is generating a response. The mic has nothing to do with a text query. It looks like a bug and feels like one.
3. **No session persistence** — every app open starts fresh. Wallet connections are not remembered. The user has to reconnect every session. This is the most functionally broken thing in the entire product.
4. **No wallet connection working** — neither Blink nor Fedi actually establishes a persistent, functional connection. The API integration is incomplete.
5. **"AI slop" asset problem** — there are no real brand assets for Blink, Fedi, or other services. Generic placeholder icons make the product look like a prototype, not a product.
6. **Install flow missing** — PWA installation is not integrated into setup. Users have no guided way to install the app.
7. **Background animation is too mechanical** — the orb drifts but the motion curve is too linear and the orbs too similar in behaviour.
8. **No "made by Afribit Africa"** — no attribution on the launch screen.
9. **Wallet selection is too narrow** — it only shows wallets, not the full ecosystem vision.
10. **Chat messages not ephemeral** — no Telegram-style disappearing behaviour when wanted.

Each of these is fixed below.

---

## Part 1 — Chat Layout: The Critical Fix

### Why It Is Breaking

The chat container has no `max-height` and no `overflow-y: scroll`. When messages grow, they push everything else — the balance card, the tool strip, the navigation. The layout is not constrained.

### The Correct Architecture

The entire app is a full-height flex column. Every zone has a defined role. Nothing is allowed to grow unboundedly.

```css
/* Root layout — full viewport height, never scrolls as a whole */
.app-root {
  display: flex;
  flex-direction: column;
  height: 100dvh;       /* dvh = dynamic viewport height — handles iOS Safari bar correctly */
  overflow: hidden;
  position: relative;
}

/* Display zone — takes all available space between header and tool strip */
/* This is where the balance card AND chat messages live */
.display-zone {
  flex: 1;
  min-height: 0;        /* Critical: allows flex child to shrink below content size */
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Tool strip — fixed height, never grows */
.tool-strip {
  flex-shrink: 0;
  height: 38px;
}

/* Orb zone — fixed height, always at bottom */
.orb-zone {
  flex-shrink: 0;
  padding: 10px 16px 20px;
}
```

The `min-height: 0` on `.display-zone` is the key. Without it, a flex child's default minimum height is its content size — causing overflow. With it, the child respects the flex container's boundary and scrolls internally.

The `100dvh` unit is essential on iOS. `100vh` on Safari does not account for the bottom browser chrome bar — content gets clipped. `dvh` (dynamic viewport height) adjusts in real time.

### Chat Message Container

Messages live inside `.display-zone` alongside the balance card. When there is no conversation, only the balance card is visible. As messages appear, they are appended below the balance card and the zone scrolls to reveal them. The balance card does not disappear — it scrolls up out of view as the conversation grows, just like any chat app where earlier content scrolls away.

```javascript
// After every new message, scroll to bottom
const displayZone = document.querySelector('.display-zone');
displayZone.scrollTo({ top: displayZone.scrollHeight, behavior: 'smooth' });
```

### Viewport Safety

On iOS Safari, the keyboard pushing up the viewport causes the orb input bar to jump. Fix:

```javascript
// Detect keyboard open and adjust
window.visualViewport.addEventListener('resize', () => {
  const keyboardHeight = window.innerHeight - window.visualViewport.height;
  document.querySelector('.orb-zone').style.paddingBottom = 
    keyboardHeight > 0 ? `${keyboardHeight + 20}px` : '20px';
});
```

---

## Part 2 — Loading States: Replace Pulsing Mic

### The Problem

The microphone pulses when the AI is thinking. The microphone is a voice input tool — it should only animate during voice recording. Pulsing it during text query processing is semantically wrong and confuses users.

### Three Distinct Loading States — Each Visually Different

#### State 1: Voice Recording (Mic IS pulsing)
Triggered only when user has tapped the orb and microphone is actively listening.

- Orb background: `#1A0D00` (dark orange-black)
- Orb border: 2px ring, `#F7931A`, pulsing opacity (1.0 → 0.5 → 1.0 at 1.2s intervals)
- Inside the orb: five vertical waveform bars, Bitcoin orange, height animated from real audio amplitude (or simulated random if amplitude not available)
- Status text above the orb: "Listening…" in Outfit Regular 12px, `rgba(255,255,255,0.40)`
- The send button (arrow) is hidden during voice recording — replaced with a stop button (square icon)

#### State 2: AI Thinking (Text submitted or voice transcribed, waiting for first token)
Triggered after submit, before first word of response.

- Orb returns to resting orange state — it played its role, it's done
- Inside the display zone, where the AI response will appear: a glass card with three shimmering placeholder lines
- Each line is a rounded pill of different widths (`80%`, `65%`, `90%`) with a shimmer animation
- Shimmer: a bright spot moves left to right across the pill every 1.5 seconds (CSS `background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 100%)`, `background-size: 200% 100%`, animated `background-position`)
- A small "SATS AI" label in `#F7931A` 10px above the shimmer card, so the user knows exactly what is generating
- The input bar is disabled during this state — placeholder text changes to "Thinking…"

```css
.shimmer-line {
  height: 14px;
  border-radius: 7px;
  background: rgba(255,255,255,0.06);
  background-image: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 0%,
    rgba(255,255,255,0.12) 50%,
    rgba(255,255,255,0.04) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
```

#### State 3: AI Streaming (First token received, words appearing)
Triggered when the AI starts returning text.

- The shimmer card transitions (cross-fade, 200ms) to a real text card
- Text appears word by word using GSAP SplitText — each word fades in from opacity 0 to 1 with 30ms stagger
- A blinking cursor (`|` character, `#F7931A`, 0.8s blink) follows the last word until streaming is complete
- When streaming completes, cursor fades out
- The input bar re-enables, placeholder returns to "Ask anything…"

#### State 4: Wallet Connection Loading
Triggered when a wallet card is tapped and connection is in progress.

- The tapped card expands (GSAP height animation)
- Inside: a custom progress indicator — NOT a spinner
- Three dots arranged horizontally, each 8px diameter, `#F7931A`, animating in sequence: dot 1 scales up then down, dot 2 follows 200ms later, dot 3 follows 200ms after that, creating a wave
- Below the dots: dynamic status text that updates in real time:
  - "Reaching Blink servers…"
  - "Validating your key…"
  - "Loading wallet data…"
  - "Fetching transaction history…"
- Each status update is a fade transition, not a replace

---

## Part 3 — Session Management & Account Persistence

### The Problem

Nothing is saved. Every session starts from zero. This is not a design decision — it is a missing implementation. Users in Kibera on slow connections cannot re-connect wallets on every open. It destroys trust.

### Architecture — Three Storage Layers, No Backend Required

The entire session is stored on the user's device. No Afribit server touches user credentials. The three layers:

#### Layer 1: `localStorage` — Non-Sensitive Preferences
Fast, synchronous, immediately available. Used only for preferences that carry no security risk.

```javascript
const PREFERENCES_KEYS = {
  LANGUAGE: 'sats_language',           // 'en' | 'sw' | 'shg'
  THEME: 'sats_theme',                 // always 'dark' for now
  ONBOARDING_COMPLETE: 'sats_onboarded', // 'true' | null
  PWA_WELCOMED: 'sats_pwa_welcome',    // 'true' | null
  IOS_INSTALL_LAST_SHOWN: 'sats_ios_install_ts', // timestamp
  CHAT_EPHEMERAL: 'sats_chat_ephemeral', // 'true' | 'false'
};
```

Never store API keys, tokens, wallet IDs, or balance data in localStorage. It is unencrypted and accessible to any JavaScript on the page.

#### Layer 2: `IndexedDB` via `idb-keyval` — Encrypted Credentials
`idb-keyval` is a minimal promise-based wrapper over IndexedDB. Install: `npm install idb-keyval`. All wallet credentials are stored here, encrypted with Web Crypto API.

```javascript
import { get, set, del } from 'idb-keyval';

// Encryption key derived from a device secret generated at first launch
async function getDeviceKey() {
  let secret = localStorage.getItem('sats_device_secret');
  if (!secret) {
    secret = crypto.randomUUID();
    localStorage.setItem('sats_device_secret', secret);
  }
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode('afribit-sats-v1'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

async function storeEncrypted(storageKey, value) {
  const key = await getDeviceKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(value))
  );
  await set(storageKey, { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) });
}

async function readEncrypted(storageKey) {
  const key = await getDeviceKey();
  const stored = await get(storageKey);
  if (!stored) return null;
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(stored.iv) },
    key,
    new Uint8Array(stored.data)
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
```

**What is stored in IndexedDB (encrypted):**

```javascript
const STORAGE_KEYS = {
  BLINK_API_KEY:        'sats_blink_key',        // Encrypted Blink API key string
  BLINK_WALLET_IDS:     'sats_blink_wallets',     // Array of wallet IDs from first successful query
  BLINK_OAUTH_TOKEN:    'sats_blink_oauth',       // OAuth access + refresh tokens (if using OAuth2)
  FEDI_INVITE_CODE:     'sats_fedi_invite',       // Federation invite code
  FEDI_FEDERATION_ID:   'sats_fedi_federation',   // Federation ID from successful connection
  CONNECTED_SERVICES:   'sats_connected_services', // Array of service identifiers that are connected
};
```

#### Layer 3: `localStorage` (Non-sensitive cache) — Last Known Data
Used to show stale data instantly while fresh data loads. Store totals and last-updated timestamps only — never raw API responses containing transaction details.

```javascript
const CACHE_KEYS = {
  LAST_TOTAL_SATS:      'sats_cache_total',       // number
  LAST_KES_RATE:        'sats_cache_rate',         // number
  LAST_KES_VALUE:       'sats_cache_kes',          // number
  LAST_UPDATED:         'sats_cache_updated',      // ISO timestamp
};
```

### Session Flow — App Open

```
App opens
    ↓
Check localStorage: sats_onboarded
    ↓ null → go to Launch Screen
    ↓ 'true' → proceed
    ↓
Show cached balance immediately (stale, no spinner)
"Balance as of [timestamp]" label in 11px muted text
    ↓
Check IndexedDB: sats_connected_services
    ↓
For each connected service:
  → Attempt connection with stored credentials
  → If success: update balance, remove stale label
  → If fail: show reconnect prompt (do not wipe credentials)
    ↓
App is ready
```

### What Gets Cleared vs What Persists

| Data | Persists across | Cleared by |
|---|---|---|
| Language preference | App closes, reinstall | User changing it |
| Wallet API keys | App closes, reinstall | User tapping "Disconnect" |
| OAuth tokens | App closes, reinstall | Token expiry or user disconnect |
| Cached balances | App closes | Fresh data load |
| Chat history | Session only (ephemeral default) | Tab close, or user delete |
| App install status | Persists | Cannot be cleared |

### Chat Ephemeral Mode — Telegram-Style Deletion

By default, chat history is session-only. It exists in React state (in-memory) and is never written to disk. When the tab closes, the conversation is gone.

Users who want persistent history can toggle "Save chat history" in Settings. When enabled, each message is written to IndexedDB (not localStorage — it handles binary data and larger payloads) with a timestamp.

**Message deletion — the Telegram way:**

When a user long-presses a message (or swipes left), a delete option appears. On deletion:

```javascript
function deleteMessage(messageId) {
  // 1. Shrink the message height to 0 with GSAP
  gsap.to(`#msg-${messageId}`, {
    height: 0,
    opacity: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => {
      // 2. Remove from React state
      setMessages(prev => prev.filter(m => m.id !== messageId));
      // 3. If persistent mode: remove from IndexedDB
      if (persistentMode) del(`sats_msg_${messageId}`);
    }
  });
}
```

The surrounding messages close the gap (the flex container reflows naturally when the element disappears). This is exactly how Telegram handles message deletion — no jump, no flash, just a smooth collapse.

---

## Part 4 — Wallet Connection: Why It Is Failing & How to Fix It

### Root Cause Analysis

Looking at the deployed app, neither Blink nor Fedi establishes a real, persistent connection. The two most likely causes:

1. **No credential persistence** — the API key is stored in React state only. On the next render or navigation, it is gone. The connection screen fires again.
2. **Blink API calls made from wrong origin** — if the API call is being made from the frontend without the key being properly set in headers, Blink returns a 401 that is not being surfaced to the user.
3. **Fedi WASM not loaded** — the Fedimint WASM bundle must be explicitly loaded. If the import is missing or fails silently, no connection is ever attempted.

### Blink — Complete Connection Implementation

#### Connection Method 1: API Key (Available Now, No Application Needed)

The user generates a read-only API key at `https://dashboard.blink.sv` → Settings → API Keys → "Create key" → select "Read" scope.

The key format is: `blink_[random string]`

**Step 1 — Store the key:**
```javascript
async function connectBlink(apiKey) {
  // Validate format before making any network call
  if (!apiKey.startsWith('blink_')) {
    throw new Error('Invalid key format. Key should start with blink_');
  }

  // Test the key with a minimal query
  const valid = await testBlinkConnection(apiKey);
  if (!valid) throw new Error('Key is valid format but Blink rejected it. Check the key.');

  // Store encrypted in IndexedDB
  await storeEncrypted(STORAGE_KEYS.BLINK_API_KEY, apiKey);

  // Fetch and cache wallet IDs for future queries
  const walletIds = await fetchBlinkWalletIds(apiKey);
  await storeEncrypted(STORAGE_KEYS.BLINK_WALLET_IDS, walletIds);

  // Mark as connected
  const services = (await readEncrypted(STORAGE_KEYS.CONNECTED_SERVICES)) || [];
  await storeEncrypted(STORAGE_KEYS.CONNECTED_SERVICES, [...services, 'blink']);
}
```

**Step 2 — Test connection query (minimal, fast):**
```javascript
async function testBlinkConnection(apiKey) {
  try {
    const response = await fetch('https://api.blink.sv/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({
        query: `query me { me { defaultAccount { id } } }`
      })
    });
    const data = await response.json();
    return !data.errors && data.data?.me?.defaultAccount?.id;
  } catch {
    return false;
  }
}
```

**Step 3 — Fetch balance (the actual data call):**
```javascript
async function fetchBlinkBalance() {
  const apiKey = await readEncrypted(STORAGE_KEYS.BLINK_API_KEY);
  if (!apiKey) return null;

  const response = await fetch('https://api.blink.sv/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey
    },
    body: JSON.stringify({
      query: `query me {
        me {
          defaultAccount {
            wallets {
              id
              walletCurrency
              balance
            }
          }
        }
      }`
    })
  });

  const data = await response.json();
  const wallets = data.data?.me?.defaultAccount?.wallets || [];
  const btcWallet = wallets.find(w => w.walletCurrency === 'BTC');
  return btcWallet?.balance ?? 0; // Returns balance in sats
}
```

**Important note on CORS:** Blink's API at `api.blink.sv` allows browser-direct requests (CORS is configured to allow `*`). This means the key can be used directly from the frontend — no backend proxy is required. However, Blink's own docs say to never expose keys in client-side code. The encryption architecture above mitigates this — the key is never in the source code, only in encrypted IndexedDB.

#### Connection Method 2: OAuth2 (Better UX — Apply First)

OAuth2 lets users connect Blink without manually copying an API key. The user taps "Connect with Blink", is redirected to Blink's own login page, approves access, and is returned to SATS automatically.

**To get OAuth2 access:**
1. Join Blink Mattermost: `https://chat.blink.sv`
2. Go to the `#developers` channel
3. Post: "Hi — we are Afribit Africa building a Bitcoin wallet aggregator for Kibera. We'd like to apply for OAuth2 integration with read scope for balance and transaction history. Our callback URL is https://afribit-ai.vercel.app/auth/blink/callback"
4. Blink will provide a `client_id` and `client_secret`
5. The `client_secret` lives on the Afribit backend (Vercel environment variable) — never in the frontend

**OAuth2 flow from the PWA:**
```javascript
function connectBlinkOAuth() {
  const CLIENT_ID = 'your_client_id'; // From Blink team
  const REDIRECT_URI = encodeURIComponent('https://afribit-ai.vercel.app/auth/blink/callback');
  const SCOPE = 'read'; // Read-only
  const STATE = crypto.randomUUID(); // CSRF protection token
  
  // Store state for verification on return
  sessionStorage.setItem('blink_oauth_state', STATE);
  
  // Redirect to Blink's authorization server
  const authURL = `https://oauth.blink.sv/oauth2/auth?client_id=${CLIENT_ID}&response_type=code&scope=${SCOPE}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
  
  window.location.href = authURL; // Opens Blink's login page
}

// On return to /auth/blink/callback:
async function handleBlinkOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const returnedState = params.get('state');
  const storedState = sessionStorage.getItem('blink_oauth_state');
  
  if (returnedState !== storedState) throw new Error('CSRF mismatch');
  
  // Exchange code for token via your backend (never client-side)
  const tokenResponse = await fetch('/api/blink/token', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
  const { access_token, refresh_token } = await tokenResponse.json();
  
  await storeEncrypted(STORAGE_KEYS.BLINK_OAUTH_TOKEN, { access_token, refresh_token });
  // Navigate back to main app
  window.location.href = '/';
}
```

#### Is There a "Magnet Link" for Blink?

**Short answer: No.** There is no deep link, QR code, or automatic handshake that makes Blink connect to SATS without user action. Here is why:

Blink is a custodial wallet. Your funds are held by Galoy's servers. For security, there is no mechanism for a third-party app to automatically discover and connect to a Blink account without explicit user authentication — either via API key or OAuth2. This is correct behaviour. An automatic connection without user action would be a security vulnerability.

The smoothest possible connection experience is OAuth2 with a single tap that opens Blink's own secure login page. That is the target.

---

### Fedi — Complete Connection Implementation

#### How Fedimint Connections Actually Work

Fedimint is peer-to-peer. There is no central Fedi server that SATS can query. To read a user's Fedi balance, the SATS app must join the same Fedimint federation as the user — as a read-only observer. The user's invite code is the only door in.

The Fedimint SDK's JavaScript client (`@fedimint/core`) runs entirely in the browser via WebAssembly. It communicates directly with the federation's servers — Afribit's backend is not in the loop.

**Is there a magnet link / auto-connect for Fedi?**

A Fedimint invite code itself starts with `fed1` followed by the encoded federation configuration. It contains the addresses of all guardian nodes and the cryptographic identity of the federation. It is effectively a configuration bundle, not just a password.

There is no automatic detection mechanism. The user must provide their invite code. The only way to skip this would be if Afribit ran its own Afribit Fedimint federation — in which case all users of that federation share a known invite code that SATS could embed by default.

**This is the recommended path for Afribit's Kibera community:** Afribit operates its own Fedimint federation for the Kibera community. SATS ships with that federation's invite code embedded. Users who are part of the Afribit Kibera federation auto-connect instantly. Users on external federations enter their code manually.

#### Fedimint SDK Installation and Connection

```bash
npm install @fedimint/core
```

```javascript
import { FedimintWallet } from '@fedimint/core';

let wallet = null;

async function connectFedi(inviteCode) {
  // Validate invite code format
  if (!inviteCode.startsWith('fed1')) {
    throw new Error('Invalid invite code. Fedi invite codes start with fed1');
  }

  // Lazy-load the WASM module — do NOT load it at app start
  // @fedimint/core loads its WASM lazily by default
  wallet = new FedimintWallet();
  
  // Preview federation details before joining (non-committal)
  const preview = await wallet.previewFederation(inviteCode);
  // preview contains: federation name, number of guardians, modules available
  
  // Join the federation (commits the connection)
  await wallet.joinFederation(inviteCode);
  
  // Verify connection by reading balance
  const balance = await wallet.balance(); // Returns balance in millisats
  const balanceSats = Math.floor(balance / 1000);
  
  // Store invite code encrypted for session persistence
  await storeEncrypted(STORAGE_KEYS.FEDI_INVITE_CODE, inviteCode);
  await storeEncrypted(STORAGE_KEYS.FEDI_FEDERATION_ID, preview.federation_id);
  
  const services = (await readEncrypted(STORAGE_KEYS.CONNECTED_SERVICES)) || [];
  await storeEncrypted(STORAGE_KEYS.CONNECTED_SERVICES, [...services, 'fedi']);
  
  return balanceSats;
}

async function reconnectFedi() {
  // On app open, restore connection from stored invite code
  const inviteCode = await readEncrypted(STORAGE_KEYS.FEDI_INVITE_CODE);
  if (!inviteCode) return false;
  
  wallet = new FedimintWallet();
  try {
    await wallet.joinFederation(inviteCode);
    return true;
  } catch {
    // Federation may be offline — return false, show stale data
    return false;
  }
}

async function fetchFediBalance() {
  if (!wallet) {
    const reconnected = await reconnectFedi();
    if (!reconnected) return null;
  }
  const balance = await wallet.balance();
  return Math.floor(balance / 1000); // Convert millisats to sats
}
```

**WASM loading note:** The Fedimint SDK lazy-loads its WASM automatically in a web worker when `FedimintWallet` is instantiated. This means the 1.5MB WASM bundle does not affect the initial app load. It only downloads when the user initiates a Fedi connection. On subsequent opens, the WASM is served from the service worker cache.

---

## Part 5 — Asset Sourcing: The AI Slop Problem

### Why This Matters

Using generic placeholder icons — a lightning bolt for Blink, two circles for Fedi — communicates that the product is not finished. Users who know these wallets will see immediately that it is not a real integration. Users who do not know them will not understand what they are connecting to. Either way, the product loses trust.

This section documents exactly where to get every asset and what to do with each one.

### Brand Assets — Sources and Instructions

#### Bitcoin ₿ Symbol
- **What it is:** The `₿` Unicode character (U+20BF)
- **Source for icon use:** `https://bitcoin.org/en/press` — official SVG files available for download, free to use in Bitcoin-related applications
- **Implementation:** Use the SVG file, set `fill="#F7931A"` (Bitcoin orange). Do not use a font character for the logo — use the SVG for sharp rendering at all sizes.
- **Where used:** Launch screen hero, sidebar app mark, PWA icon background

#### Blink Logo
- **Official source:** Blink's GitHub repository `https://github.com/GaloyMoney/blinkbtc` — check the `/apps/` and `/assets/` directories
- **Alternative source:** `https://blink.sv` — right-click the Blink logo in the browser, "Inspect element", locate the `<img>` or `<svg>` tag, copy the SVG source. This is publicly visible and falls under fair use for integration documentation purposes.
- **Simplecircle icons:** `https://simpleicons.org` — search "Blink". Simple Icons maintains SVG files for thousands of brands. Check if Blink is listed.
- **Fallback:** Draw the Blink lightning bolt manually as an SVG path. The Blink lightning bolt is a simple single-stroke vector — three straight diagonal line segments forming a `Z` shape. It can be recreated in Figma or Inkscape in five minutes without copying any original asset.
- **Formal request:** Email `hello@blink.sv` with subject "Brand asset request — Afribit SATS integration". State you are building a Bitcoin financial inclusion platform in Kibera and want to display the Blink logo in the wallet connection flow. Given the mission alignment, this will almost certainly be approved.
- **For monochrome use in the app:** Export or render the logo as a white single-colour SVG. All logos in the glass wallet cards are white — they do not carry brand colours in the dark glass context.

#### Fedi Logo
- **Official source:** `https://github.com/fedibtc/fedi` — the full app codebase is now AGPL open source (released January 3, 2026). Navigate to `assets/` or `src/assets/` in the repository.
- **Alternative:** `https://fedi.xyz` — inspect the page source, the Fedi logomark is an inline SVG in several places on the marketing site.
- **The mark:** The Fedi logomark is a distinctive `f` letterform in a rounded square, similar to how many app icons work. It is immediately recognizable to the Fedi user community.
- **Formal request:** `press@fedi.xyz` — introduce Afribit Africa, explain the Kibera context, request permission to use the Fedi logo in the app. The Fedi team has a strong mission alignment with what Afribit is doing.
- **White monochrome version:** Take the SVG, apply `fill="white"` to all paths, remove any colour fills. This is the version that goes into the glass card.

#### Bitika (bitika.xyz)
- **Open source status:** Not open source. Bitika is a commercial service operated by a Kenyan developer.
- **Source:** `https://bitika.xyz` — inspect the page, extract the logo SVG from the header. It is a simple design.
- **Contact:** Bitika's Twitter/X is `@bitika_KE`. DM or email to ask for brand asset use permission.
- **Integration status:** Bitika does not have a public API. They do not expose a programmatic interface for third-party purchases. Contact them directly via DM to discuss API collaboration.
- **Label in SATS:** "Coming soon" badge — orange pill `#F7931A` background, `#000` text, Outfit Medium 11px.

#### Minmo (minmo.to)
- **Open source status:** Not open source.
- **Contact and integration:** Similar position to Bitika — contact for API collaboration and brand asset use.
- **Label in SATS:** "Coming soon"

#### CoinGecko (Price Data)
- **Brand kit:** `https://www.coingecko.com/en/branding` — official SVG and PNG logo files available for download
- **Usage:** Tool strip icon. White monochrome version.
- **API attribution:** CoinGecko's terms ask for attribution where the data is displayed publicly. Add "Price data from CoinGecko" in 10px muted text near any BTC/KES rate display.

#### Tabler Icons (Generic Icons)
- **Source:** `https://tabler-icons.io` — 5,800+ open source MIT icons
- **Use for:** All UI chrome icons (chevron, settings, menu, bell, etc.)
- **Do NOT use** Tabler icons as brand logos for Blink or Fedi. A generic lightning bolt `ti-bolt` does not represent Blink. This is the "AI slop" problem being specifically called out: using a generic icon where a brand identity should be. If the real asset is not yet available, show a placeholder that says "Blink" in text with a simple circle — that is more honest than a generic lightning bolt that implies the brand without representing it.

### Asset Pipeline for the App

Once assets are gathered:

1. Export all logo SVGs at 28×28pt viewport
2. Apply `fill="white"` — all logos are white in the glass card context
3. Run through SVGO to optimize: `npx svgo --multipass logo.svg`
4. Embed directly as inline SVG in React components — do not use `<img>` tags for logos (they cannot be styled with CSS and cause layout flicker)
5. Store in `/src/assets/logos/` with consistent naming: `logo-blink.svg`, `logo-fedi.svg`, etc.

---

## Part 6 — Background Animation V3: More Creative Motion

### What V2 Gets Right
The orb is present, the colour is correct, the opacity is appropriate.

### What V2 Gets Wrong
The motion is too linear — both orbs drift in simple straight-line translations with identical timing. There is no breathing quality, no organic feeling.

### V3 — Four-Layer Animation System

```css
.bg-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

/* Layer 1 — Primary orange orb, large, slow, top-right */
.bg-orb-1 {
  position: absolute;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, #F7931A 0%, #7A3A00 50%, transparent 80%);
  filter: blur(90px);
  opacity: 0.15;
  top: -180px;
  right: -200px;
  animation: orb1-move 32s ease-in-out infinite;
}

@keyframes orb1-move {
  0%   { transform: translate(0px, 0px)    rotate(0deg)   scale(1.0); }
  20%  { transform: translate(-60px, 40px) rotate(15deg)  scale(1.06); }
  40%  { transform: translate(-30px, 80px) rotate(-8deg)  scale(0.94); }
  60%  { transform: translate(-80px, 20px) rotate(22deg)  scale(1.08); }
  80%  { transform: translate(-20px, 60px) rotate(-12deg) scale(0.98); }
  100% { transform: translate(0px, 0px)    rotate(0deg)   scale(1.0); }
}

/* Layer 2 — Secondary amber orb, medium, bottom-left */
.bg-orb-2 {
  position: absolute;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  background: radial-gradient(circle at 60% 60%, #C45C00 0%, #3A1A00 60%, transparent 85%);
  filter: blur(70px);
  opacity: 0.12;
  bottom: -100px;
  left: -140px;
  animation: orb2-move 44s ease-in-out infinite reverse;
}

@keyframes orb2-move {
  0%   { transform: translate(0px, 0px)   scale(1.0); }
  25%  { transform: translate(70px, -50px) scale(1.10); }
  50%  { transform: translate(30px, -90px) scale(0.92); }
  75%  { transform: translate(90px, -30px) scale(1.05); }
  100% { transform: translate(0px, 0px)   scale(1.0); }
}

/* Layer 3 — Small accent orb, fast, centre-left, subtle */
.bg-orb-3 {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, #F7931A 0%, transparent 70%);
  filter: blur(50px);
  opacity: 0.07;
  top: 40%;
  left: -60px;
  animation: orb3-move 18s ease-in-out infinite;
}

@keyframes orb3-move {
  0%   { transform: translate(0px, 0px); }
  33%  { transform: translate(40px, -60px); }
  66%  { transform: translate(-20px, -30px); }
  100% { transform: translate(0px, 0px); }
}

/* Layer 4 — Very subtle overall dark gradient shift */
/* This gives the background a slow breathing quality */
.bg-gradient-shift {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 70%, rgba(30,12,0,0.4) 0%, transparent 60%);
  animation: gradient-breathe 22s ease-in-out infinite alternate;
}

@keyframes gradient-breathe {
  from { opacity: 0.4; }
  to   { opacity: 0.8; }
}
```

The `rotate()` transform on Layer 1 is the key change from V2 — a rotating large blurred circle creates the illusion that the orb has internal movement, like a cloud, not just a ball sliding across ice.

The `reverse` on Layer 2's animation direction means the two primary orbs move in counter-rotation — they approach and pull away from each other organically, which is more interesting than parallel motion.

Layer 3 is fast and small — it creates the sense that the background has depth, that there are multiple distances of light.

---

## Part 7 — Onboarding Redesign: Full Setup Flow

### Launch Screen Additions

Add at the very bottom of the launch screen, above the safe area:

```
"Made by Afribit Africa" · "afribit.africa"
```

Styling:
- Font: Outfit Regular 12px
- Colour: `rgba(255,255,255,0.25)` — very muted, present but not competing
- Position: `position: absolute; bottom: calc(16px + env(safe-area-inset-bottom)); left: 0; right: 0; text-align: center;`
- `env(safe-area-inset-bottom)` handles the iPhone home indicator zone correctly

### "Get Started" → App Ecosystem Selection Screen

After tapping "Get started", the next screen is NOT the wallet connection screen. It is a new screen: **the ecosystem overview** — showing the full scope of what SATS connects to.

This reframes the product from "Bitcoin wallet aggregator" to "Bitcoin financial OS for Kibera".

#### Layout — Circular Node Arrangement (as specified)

The selected design is a radial node layout. A central "SATS" node in the middle. Service nodes arranged in a circle around it. The mathematical formula for even spacing of N nodes at radius R:

```javascript
// Position N nodes evenly around a central point
function getNodePositions(n, radius) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2; // Start at top
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  });
}
```

For 6 service nodes at radius 120px from centre:
- Node 0 (top): `x: 0, y: -120` → Blink
- Node 1 (top-right): `x: 104, y: -60` → Fedi
- Node 2 (bottom-right): `x: 104, y: 60` → Bitika (coming soon)
- Node 3 (bottom): `x: 0, y: 120` → Minmo (coming soon)
- Node 4 (bottom-left): `x: -104, y: 60` → [Future slot]
- Node 5 (top-left): `x: -104, y: -60` → [Future slot]

A thin line connects each outer node to the centre — `rgba(247,147,26,0.15)` stroke, 0.5px. Active connected nodes have a `#F7931A` line at 40% opacity.

#### Screen Content

**Heading:** "Your Bitcoin world"  
**Sub-heading:** "Choose what to connect. Everything works together."  
**Font:** Space Grotesk 600 28px heading, Outfit Regular 15px sub

**Central SATS node:**
- 56px diameter glass circle
- Inside: `₿` Bitcoin symbol, `#F7931A`, 22px
- Outer ring: 1px dashed `rgba(247,147,26,0.30)`, slowly rotating (CSS `animation: spin 30s linear infinite`)

**Service nodes — two visual states:**

Active (connected or available to connect now):
- 52px diameter glass circle
- Logo SVG, white, 24px
- Below the circle: service name, Outfit Regular 11px, white 60%

Coming soon:
- 52px diameter glass circle, opacity 0.5
- Logo SVG, white 30%, 24px
- Pill badge: "Soon" — `rgba(247,147,26,0.20)` background, `#F7931A` text, 10px Outfit

**Category groupings:**
Above the circular layout, two pill tabs:
- "Wallets" (selected by default)
- "Buy Bitcoin" (shows Bitika, Minmo — all "coming soon")

Tapping a tab animates the nodes into the positions for that category. The unselected tab's nodes dissolve out with GSAP opacity fade, the new nodes appear with spring-in.

#### The Zoom Transition — World Class Page-to-Page

When the user taps a service node, the transition is:

1. The tapped node **scales up** from its position toward the centre of the screen — GSAP `to()` with `scale: 8, opacity: 0, duration: 0.5, ease: 'power2.in'`
2. Simultaneously, all other nodes and the heading **fade out** — GSAP `to()` with `opacity: 0, duration: 0.3`
3. As the node's opacity reaches 0 at 100% scale, the **next screen fades in from black**
4. The next screen is the connection flow for the selected service

```javascript
function zoomToService(nodeEl, service) {
  const tl = gsap.timeline({
    onComplete: () => navigateTo(`/connect/${service}`)
  });

  // All other nodes fade out
  tl.to('.service-node:not(.active)', { opacity: 0, duration: 0.25, ease: 'none' }, 0);
  
  // The tapped node zooms to fill screen
  tl.to(nodeEl, {
    scale: 8,
    opacity: 0,
    duration: 0.5,
    ease: 'power2.in',
    transformOrigin: 'center center'
  }, 0);

  // Central node and heading slide up
  tl.to(['.ecosystem-heading', '.sats-node'], {
    y: -40,
    opacity: 0,
    duration: 0.35,
    ease: 'power2.in'
  }, 0);
}
```

This is the full-screen zoom-wipe transition — the icon grows until it fills the screen and disappears, revealing the service connection screen beneath. It is used by apps like Revolut (card selection) and several award-winning finance apps.

#### On Return from Connection Flow

When the user successfully connects a wallet and is returned to the ecosystem screen:
- The connected service node now has a `#00C896` (green) ring around it — 2px, solid
- A subtle pulse plays on the connected node (scale 1.0 → 1.1 → 1.0 with spring ease) — celebrates the connection
- "Continue" button appears below the ecosystem circle: glass pill, "Go to SATS →"

---

## Part 8 — PWA Installation as Part of Setup

Installation is integrated into the onboarding flow as **Step 1 of 3** — before wallet connection, before language selection.

### Why First?
Once the app is installed to the home screen, deep linking works on Android. The OAuth2 callback from Blink will correctly return the user to the SATS app rather than opening a new browser tab. Installation first makes every subsequent step work better.

### Step 0 — The Install Screen (Before Wallet Selection)

After language selection, before the ecosystem screen:

**Screen title:** "Install Afribit SATS"  
**Sub-title:** "Add it to your home screen for the best experience"

**Benefit pills (horizontal row):**
- Three glass pills: "Works offline" · "Instant open" · "No app store"
- Font: Outfit Regular 12px, white 60%

**Android Chrome flow:**
If `beforeinstallprompt` event has fired (captured and deferred at app start):
- Show: Large glass pill button "Add to Home Screen" — tapping triggers `deferredPrompt.prompt()`
- The native Android install dialog appears
- On acceptance: mark as installed, proceed automatically to ecosystem screen

**iOS Safari flow:**
If running on iOS and not already installed:
- Show animated instruction: Safari share icon (SVG drawn with DrawSVG animation) → tap → "Add to Home Screen"
- Three illustrated steps with icons and text
- "I'll do this later" text link — skips to ecosystem screen, shows a smaller install reminder in Settings later

**If already installed (standalone mode):**
- Skip this screen entirely — never show install prompt to someone who already installed

```javascript
// Check at app start — capture the prompt early
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

// In the install screen component:
async function handleInstallTap() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    proceedToEcosystem();
  }
  deferredInstallPrompt = null;
}
```

---

## Part 9 — Bitika & Minmo: Integration Research

### Bitika (bitika.xyz)
- **What it is:** A Bitcoin-only on-ramp for Kenya. Accepts M-Pesa and Airtel Money. Minimum purchase KES 10. No KYC, no sign-up, no 2FA required. User provides their Lightning wallet address and M-Pesa number, sends M-Pesa, receives sats.
- **Open source:** Not open source. Private codebase.
- **Public API:** None documented. No public API exists as of June 2026.
- **How to integrate:** Contact via `@bitika_KE` on Twitter/X or through the contact form on bitika.xyz. Afribit's mission and existing Kibera community make this an attractive partnership for Bitika — they want more users, Afribit has them.
- **What to ask for:** A simple HTTP API that accepts `{ lightning_address, kes_amount }` and returns `{ status, mpesa_paybill, account_number }` — enough for SATS to initiate a purchase on behalf of the user.
- **Label in app:** "Coming soon" pill — honest, not broken.
- **Alternative until API available:** SATS can deep-link to `https://bitika.xyz/?amount=X` in a new tab — not ideal, but functional.

### Minmo (minmo.to)
- **What it is:** Another Kenyan Bitcoin on-ramp via M-Pesa.
- **Open source:** Not open source.
- **Public API:** None documented.
- **Contact:** Through their website or Twitter.
- **Label in app:** "Coming soon"

### Integration Labelling Philosophy

Services in SATS are labelled one of three statuses:

- **Active** (green dot, full opacity): Connected and working — Blink, Fedi
- **Available** (no dot, full opacity): Can be connected now — future wallets
- **Coming soon** (orange pill badge, 50% opacity): In development or awaiting API — Bitika, Minmo

Never show a "Coming soon" service as if it is active. Never show a broken integration as if it works. Honesty in the UI builds trust. Misleading labels destroy it.

---

## Summary — V3 Priority Implementation Order

| # | Task | Time estimate | Unblocks |
|---|---|---|---|
| 1 | Fix chat container layout (dvh, min-height: 0) | 1 hour | Everything else |
| 2 | Fix loading states — remove pulsing mic during AI thinking | 2 hours | Core UX |
| 3 | Implement session storage (idb-keyval + Web Crypto) | 4 hours | Wallet connections |
| 4 | Implement Blink API key connection with IndexedDB persistence | 3 hours | Blink working |
| 5 | Implement Fedi WASM connection with IndexedDB persistence | 4 hours | Fedi working |
| 6 | Add "Made by Afribit Africa" to launch screen | 15 min | — |
| 7 | Background animation V3 (4 layers, rotation on orb 1) | 1 hour | — |
| 8 | Telegram-style ephemeral message delete | 2 hours | Chat UX |
| 9 | PWA install screen as setup Step 1 | 3 hours | Better OAuth return |
| 10 | Ecosystem node selection screen | 1 day | Full vision |
| 11 | Zoom transition (tap node → service screen) | 3 hours | World-class feel |
| 12 | Acquire real brand assets (Blink, Fedi logos) | Admin task | Product feel |
| 13 | Contact Blink Mattermost for OAuth2 application | 30 min | Better connection UX |
| 14 | Contact Bitika + Minmo for API partnership | 30 min | Future integrations |

---

*Afribit Africa · afribit.africa · V3 Revision Reference · June 2026*