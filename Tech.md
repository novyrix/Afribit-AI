
₿
AFRIBIT SATS
Technical Reference Document

TECH STACK · PHASE STRATEGY · TESTING · SECURITY

Afribit Africa  |  afribit.africa
Kibera, Nairobi, Kenya
Version 1.0  |  June 2026  |  Internal Technical Reference
 
1. Document Purpose & Scope
This Technical Reference Document covers the complete engineering landscape for Afribit SATS — the AI-powered Bitcoin wallet aggregation platform built for Kibera merchants and residents. It does not contain code, schemas, or data models. It contains everything a developer, partner, or technical reviewer needs to understand how the system is designed, what tools it uses, how it will be built phase by phase, how it will be tested, and how it will be secured.

This document should be read alongside the Product Vision document. Together they form the complete specification for Version 1 of Afribit SATS.

1.1 What This Document Covers
•	Full technology stack — every tool, library, and service selected, with open-source status, license, documentation link, and selection rationale
•	Phase-by-phase build strategy — what gets built when, dependencies between phases, and expected outcomes
•	Testing plan — unit, integration, end-to-end, performance, and offline testing for everything we build
•	Security architecture — how user keys are protected, how the AI agent is constrained, how the app is hardened against attacks

1.2 Design Constraints That Shaped Every Decision
•	Open source only — every selected tool must be MIT, Apache 2.0, GPL, or equivalent; no proprietary lock-in
•	3G-first — the app must be fully usable on a 3G mobile connection as experienced in Kibera
•	Low-end Android devices — target device is a mid-2019 Android phone with 2GB RAM and a Cortex-A53 CPU
•	User key safety — under no circumstances does the platform ever hold, transmit, or log user API keys or credentials
•	Read-only Phase 1 — no transaction execution in Phase 1; the architecture enforces this at the service boundary level, not just the UI level
 
2. Technology Stack
Every tool listed below has been selected against four criteria: open-source availability, active maintenance (commit activity in the last 6 months as of June 2026), quality of documentation, and fit for low-resource mobile environments.

2.1 Frontend
React 19
•	Purpose: UI component framework for the entire PWA frontend
•	License: MIT
•	GitHub: github.com/facebook/react
•	Documentation: react.dev
•	Status: Actively maintained; React 19 stable as of December 2024. Server Components, improved Suspense, and concurrent rendering are production-ready.
•	Why chosen: Largest open-source UI ecosystem, excellent TypeScript support, the Fedimint SDK ships React hooks (@fedimint/react) that integrate directly, and the widest pool of open-source contributors for future community development on the SATS codebase.

Vite 6
•	Purpose: Build tool and development server
•	License: MIT
•	GitHub: github.com/vitejs/vite
•	Documentation: vitejs.dev
•	Status: Actively maintained; Vite 6 released November 2024. Industry standard for modern React applications.
•	Why chosen: Dramatically faster than webpack for development builds; native ESM; excellent PWA plugin ecosystem; used by Fedimint's own example apps.

Tailwind CSS 4
•	Purpose: Utility-first CSS framework
•	License: MIT
•	GitHub: github.com/tailwindlabs/tailwindcss
•	Documentation: tailwindcss.com
•	Status: Actively maintained; Tailwind v4 in stable release as of 2025.
•	Why chosen: Zero-runtime CSS, dark-mode utilities built-in, easily supports the Bitcoin orange on dark design system without custom CSS overhead; generates minimal CSS bundles which is critical for 3G load performance.

vite-plugin-pwa + Workbox
•	Purpose: Progressive Web App service worker, offline caching, installability
•	License: MIT (vite-plugin-pwa), Apache 2.0 (Workbox)
•	GitHub: github.com/vite-pwa/vite-plugin-pwa — Google/workbox
•	Documentation: vite-pwa-org.netlify.app — developers.google.com/web/tools/workbox
•	Status: Actively maintained; vite-plugin-pwa supports Vite 5 and 6. Workbox is the industry standard for service workers.
•	Why chosen: Zero-config PWA setup for Vite; stale-while-revalidate caching keeps the app fast on slow connections; background sync queues wallet refresh calls when offline; enables "Add to Home Screen" on Android Chrome and iOS Safari without an app store.

Recharts
•	Purpose: Balance history charts and analytics visualisations
•	License: MIT
•	GitHub: github.com/recharts/recharts
•	Documentation: recharts.org
•	Status: Actively maintained. Built on D3, React-native compatible.
•	Why chosen: Lightweight SVG-based charts that render well on low-end devices; no canvas dependency; integrates natively with React state.

2.2 Backend / Agent Layer
Node.js 22 LTS
•	Purpose: Runtime for the backend API server and AI agent orchestration
•	License: MIT
•	GitHub: github.com/nodejs/node
•	Documentation: nodejs.org/docs
•	Status: Node 22 is the current LTS release (October 2024). Long-term support until April 2027.
•	Why chosen: Native async/await for parallel wallet API calls; largest open-source npm ecosystem; Anthropic SDK for Claude is JavaScript-first; easy to onboard open-source contributors.

Express 5
•	Purpose: HTTP server framework for the backend API
•	License: MIT
•	GitHub: github.com/expressjs/express
•	Documentation: expressjs.com
•	Status: Express 5 stable as of 2024. Most widely used Node.js framework.
•	Why chosen: Minimal overhead, well-understood by the global open-source community, extensive middleware ecosystem for rate limiting, CORS, and request validation.

Anthropic SDK for Node.js
•	Purpose: Official client library for the Claude API (AI agent calls)
•	License: MIT
•	GitHub: github.com/anthropics/anthropic-sdk-typescript
•	Documentation: docs.anthropic.com
•	Status: Actively maintained by Anthropic. Full TypeScript support, streaming responses, tool-use (function calling) support.
•	Why chosen: Official SDK; handles retry logic, streaming, and tool-use protocol automatically; eliminates low-level HTTP management for AI calls.

PostgreSQL 17
•	Purpose: Server-side relational database for aggregated transaction history and analytics
•	License: PostgreSQL License (permissive open source)
•	GitHub: github.com/postgres/postgres
•	Documentation: postgresql.org/docs
•	Status: PostgreSQL 17 released September 2024. Most reliable open-source relational database.
•	Why chosen: Battle-tested, excellent JSON support for storing raw wallet API responses, full-text search for transaction queries, and available on every major cloud provider including Render free tier.

Render.com
•	Purpose: Cloud deployment platform for backend API and PostgreSQL database
•	License: Proprietary SaaS (infrastructure provider, not embedded in the codebase)
•	Documentation: render.com/docs
•	Status: Active. Free tier includes 750 hours of web service time and a managed PostgreSQL instance. As of 2026, Render has removed per-seat fees and offers predictable plan-based billing.
•	Why chosen over Railway: Render has better uptime reliability (Railway experienced repeated outages through 2025 including a December 2025 EU West incident), no peak-hour deployment restrictions on free tier, and more predictable pricing. Static site hosting on Render is free with 100GB bandwidth — appropriate for the PWA frontend.
•	Migration path: If Afribit outgrows Render or wants full self-hosting, both the Node.js API and PostgreSQL are standard; migration to a VPS (DigitalOcean, Hetzner) or self-hosted server in Nairobi is straightforward.

2.3 Wallet Integrations
Blink (Galoy) — GraphQL API
•	Purpose: Connect to users' Blink Lightning wallets for balance and transaction data
•	Open Source: Yes — github.com/GaloyMoney/blinkbtc (MIT License)
•	API endpoint: api.blink.sv/graphql (mainnet) — api.staging.blink.sv/graphql (staging/testing)
•	Authentication: X-API-KEY header with a key generated at dashboard.blink.sv. Keys are scoped — Read scope returns balances and history, Write scope allows transactions (Phase 2 only).
•	Developer documentation: dev.blink.sv
•	Key capabilities available now: wallet balance query, full transaction history, wallet ID lookup, BTC and Stablesats (USD-pegged) wallet support.
•	Integration status: Available, no approval required. Any developer can generate a key and start querying immediately. Playground available at api.blink.sv/graphql for testing queries before integration.
•	Rate limits: Not publicly documented; Blink recommends caching responses and avoiding polling intervals shorter than 30 seconds. SATS will cache all wallet data client-side and refresh on demand, not by polling.

Fedimint SDK — JavaScript / WebAssembly
•	Purpose: Connect to users' Fedi community wallets (Fedimint federations) for ecash balance and transaction data
•	Open Source: Yes — github.com/fedimint/fedimint-sdk (MIT License). In October 2025 the repository was renamed from "Fedimint Web SDK" to "Fedimint SDK" when React Native packages were added. Fedi (the app) went fully open source on January 3, 2026.
•	Packages: @fedimint/core (WASM client for browser/Node), @fedimint/react (React hooks), @fedimint/react-native (mobile), @fedimint/cli (scaffold tool)
•	Developer documentation: github.com/fedimint/fedimint-sdk — fedimint.org
•	Key capabilities available now: connect to any Fedimint federation via invite code, read ecash balance, read transaction history, generate receive notes (Phase 2).
•	Integration status: Available. The SDK runs in-browser via WebAssembly — no server-side Rust compilation required. This is ideal for a PWA where the Fedimint client runs entirely in the user's browser, meaning Afribit servers never touch federation data at all.
•	Important note: The Fedimint SDK uses WebAssembly. WASM bundles can be large (~1–2MB). SATS will implement lazy loading for the Fedimint module — it loads only when the user connects a Fedi wallet, not on initial app load. This keeps the 3G first-load fast.

2.4 Data & Pricing
CoinGecko API
•	Purpose: Live and historical BTC/KES exchange rates for balance display and inflation comparison
•	Open Source: API is proprietary, but extensively documented and free to use at production scale
•	Documentation: docs.coingecko.com
•	Free tier limits: The public (keyless) plan allows 5–15 calls per minute. The Demo plan (free registration) provides a stable 30 calls per minute and 10,000 monthly calls.
•	Data available: Real-time BTC price in KES, historical daily OHLC prices going back to Bitcoin genesis, market cap, volume. Historical data is what powers the inflation comparison feature.
•	Integration approach: SATS backend will cache the BTC/KES rate every 5 minutes and serve it to the frontend. This means 1 CoinGecko call per 5 minutes regardless of how many SATS users are active — well within free tier limits.
•	Fallback: If CoinGecko is unavailable, SATS will display the last cached rate with a timestamp so users know it may be stale. A secondary fallback to Mempool.space price API (also free) is planned.

2.5 Development & Collaboration Tools
GitHub
•	Purpose: Source code hosting, version control, issue tracking, pull request reviews
•	License: Platform is proprietary SaaS; all SATS code hosted there is MIT licensed
•	Repositories: github.com/afribit — all repositories will be public from the first commit
•	CI/CD: GitHub Actions (free for public repositories) for automated testing and deployment on every pull request

TypeScript 5
•	Purpose: Type safety across the entire codebase (frontend and backend)
•	License: Apache 2.0
•	GitHub: github.com/microsoft/TypeScript
•	Why chosen: Catches integration errors between wallet API responses and the AI layer at compile time, not in production; required by the Fedimint SDK; dramatically reduces bugs in async code

Vitest
•	Purpose: Unit and integration test runner (frontend and backend)
•	License: MIT
•	GitHub: github.com/vitest-dev/vitest
•	Why chosen: Native Vite integration, faster than Jest for Vite projects, identical API to Jest so easy for contributors familiar with Jest

Playwright
•	Purpose: End-to-end browser testing — simulates real users on mobile Chrome and Safari
•	License: Apache 2.0
•	GitHub: github.com/microsoft/playwright
•	Why chosen: Cross-browser support, mobile device emulation, network throttling (simulates 3G), offline mode simulation — all critical for Afribit's target environment

i18next
•	Purpose: Internationalisation framework for Swahili, Sheng, and English language support
•	License: MIT
•	GitHub: github.com/i18next/i18next
•	Why chosen: Industry standard, React integration via react-i18next, supports pluralisation rules, easy to add new languages (future: Kikuyu, Luo, French for expansion)

2.6 Stack Summary Table
Tool	Category	License	Docs / Repository
React 19	Frontend	MIT	react.dev
Vite 6	Build tool	MIT	vitejs.dev
Tailwind CSS 4	Styling	MIT	tailwindcss.com
vite-plugin-pwa	PWA / Offline	MIT	vite-pwa-org.netlify.app
Workbox	Service Worker	Apache 2.0	developers.google.com/web/tools/workbox
Recharts	Data viz	MIT	recharts.org
Node.js 22 LTS	Backend runtime	MIT	nodejs.org/docs
Express 5	API server	MIT	expressjs.com
Anthropic SDK (TS)	AI / Claude API	MIT	docs.anthropic.com
PostgreSQL 17	Database	PostgreSQL	postgresql.org/docs
Render.com	Deployment	SaaS	render.com/docs
Blink GraphQL API	Wallet connector	MIT	dev.blink.sv
Fedimint SDK (JS)	Wallet connector	MIT	github.com/fedimint/fedimint-sdk
CoinGecko API	Price data	Free / SaaS	docs.coingecko.com
TypeScript 5	Language	Apache 2.0	typescriptlang.org
Vitest	Unit testing	MIT	vitest.dev
Playwright	E2E testing	Apache 2.0	playwright.dev
i18next	Internationalisation	MIT	i18next.com
GitHub Actions	CI/CD	Free (public)	docs.github.com/actions
 
3. Phase-by-Phase Build Strategy
Each phase must be completed, tested, and stable before the next phase begins. No feature from Phase 2 is built while Phase 1 is in progress. Scope discipline is non-negotiable.

3.1 Phase 1 — Wallet Aggregation & AI Intelligence
Goal
Ship a working PWA that connects Blink and Fedi wallets in read-only mode, loads all historical transaction data, and gives users an AI financial assistant in Swahili, Sheng, and English. No money moves. No purchases. Pure intelligence.

Duration
18 weeks from kickoff to public launch. Includes a 2-week beta period with 20 Kibera merchants.

What Gets Built
•	PWA shell: React + Vite + Tailwind + vite-plugin-pwa configured for offline-first. App shell cached on first load. Target: under 3 seconds on 3G.
•	Cinematic onboarding flow: full-screen animated welcome, language selection, wallet connection wizard with BYOK input and auto-connect guide for Blink and Fedi.
•	Blink connector: GraphQL client calling api.blink.sv with user's read-only API key. Fetches balance, wallet ID, and full transaction history. Data cached in PostgreSQL and IndexedDB (browser).
•	Fedimint connector: @fedimint/core loaded via WebAssembly in the browser. Federation connect via invite code. Balance and ecash history retrieved client-side — Afribit servers receive no Fedi data.
•	Unified dashboard: total balance across all wallets in sats and KES, per-wallet breakdown, 30-day balance history chart via Recharts.
•	CoinGecko integration: backend fetches and caches BTC/KES rate every 5 minutes. Frontend uses this to display KES values and inflation comparison.
•	AI assistant: Claude API via Anthropic SDK. Haiku model for simple queries, Sonnet for analytics. System prompt includes wallet context (balances, recent transactions, KES rate). Full conversation history maintained per session.
•	Language support: i18next with EN, SW (Swahili), SHG (Sheng) translation files. Language persists in localStorage.
•	GitHub Actions CI: all tests run on every pull request. Deployment to Render on merge to main.

What Does NOT Get Built in Phase 1
•	No send, receive, or transaction execution of any kind
•	No Bitcoin purchase or on-ramp
•	No additional wallet connectors beyond Blink and Fedi
•	No user accounts or authentication system — wallet keys are the identity
•	No native mobile app

Phase 1 Exit Criteria
•	All Phase 1 tests passing (see Section 4)
•	App loads in under 3 seconds on a throttled 3G connection in Playwright
•	Blink and Fedi connectors return accurate data verified against the native apps
•	AI assistant answers balance queries correctly in all three languages
•	20 Kibera beta users complete onboarding without external help
•	Zero reported incidents of key exposure or data leakage in beta

3.2 Phase 2 — Action Layer
Goal
Allow users to send and receive Bitcoin through the AI assistant with explicit confirmation. Introduce chama management. No feature from Phase 2 starts until Phase 1 exit criteria are fully met.

Prerequisites
•	Phase 1 is stable in production with at least 100 active users
•	Legal review of Kenya VASP Act 2025 implications for transaction execution is complete
•	Security audit of the action authorization model is complete (see Section 5)

What Gets Built
•	Action authorization model: users explicitly grant send permission per wallet in Settings. This is a separate, deliberate flow — not part of onboarding. Read-only remains the default for all wallets.
•	AI send flow: user initiates send in natural language. AI identifies wallet, recipient, and amount. A mandatory confirmation screen (not an alert — a full dedicated screen) shows amount, destination, KES value, fee estimate. User confirms with tap. AI executes via Blink Write API or Fedimint payment module.
•	AI receive flow: user requests an invoice. AI generates a Lightning invoice from the appropriate wallet and displays QR code and copyable string.
•	Chama management: read Fedimint federation membership data, group balance, individual contribution history. AI generates weekly chama summaries in Swahili.
•	Recurring savings: user sets up automated sat transfers on a schedule (e.g. every Friday). Backend manages the schedule via a cron job on Render.
•	Alert system: balance threshold alerts, large incoming payment notifications via PWA push notifications.

Phase 2 Exit Criteria
•	All Phase 2 tests passing
•	Zero unauthorized transactions in 30-day production period
•	Confirmation screen tested with 20 users — all report understanding what the transaction will do before confirming
•	Chama summary feature reviewed by at least one active Kibera chama group

3.3 Phase 3 — Open Ecosystem
Goal
Introduce Bitcoin purchase via Kenyan on-ramps, open the developer connector SDK, and add Nostr identity. Begin geographic expansion beyond Kibera.

Prerequisites
•	Phase 2 stable in production with at least 500 active users
•	Collaboration agreements with Bitika and Minmo confirmed
•	Developer SDK designed, documented, and reviewed by at least 2 external developers

What Gets Built
•	Bitika connector: API integration for KES-to-BTC purchase via M-Pesa. AI presents best available rate, confirms M-Pesa number and destination wallet, user confirms, purchase executes.
•	Minmo connector: parallel on-ramp integration. AI compares live rates across both and recommends best option.
•	Rate alerts: user sets target BTC/KES rate. Backend polls price and sends push notification when threshold is crossed.
•	Developer connector SDK: standardised interface (TypeScript) that any Lightning/Bitcoin tool can implement to become a SATS connector. Published to npm under @afribit scope.
•	Nostr identity: user can link a Nostr keypair to their SATS profile for decentralised identity.
•	Multi-district onboarding: localised setup flows for Mathare, Mukuru, Kawangware.

3.4 Phase 4 — Scale
Goal
Make the platform available to other Bitcoin circular economy organizations across Africa. White-label deployment with custom branding and federation settings.

What Gets Built
•	White-label configuration: any organization can deploy SATS with their own branding, language files, and default wallet connectors without forking the codebase.
•	Multi-language expansion: Kikuyu, Luo, Somali, and French as first expansion languages.
•	Self-hosting documentation: full guide for deploying SATS on a VPS in any country without Render dependency.
•	Fedimint federation setup wizard: communities can configure a new Fedimint federation through the SATS interface.

3.5 Phase Timeline Overview
Phase	Timeline	Core deliverable	Gate condition to next phase	Risk if skipped
Phase 1	Weeks 1–18	Read-only aggregation + AI	100 active users, all tests pass	Foundation — cannot skip
Phase 2	Months 5–10	Send/receive + chama	Legal review done, security audit done	Trust destruction if users lose funds
Phase 3	Months 11–18	On-ramp + developer SDK	500 users, partner agreements	Ecosystem diluted without stable base
Phase 4	Month 18+	White-label + pan-Africa	2,000 users, 5+ integrations	Premature scaling burns resources
 
4. Testing Plan
Testing is not optional, and it is not done at the end. Every feature listed in the phase strategy has a corresponding test before it is merged. The rule is simple: untested code does not ship. This is especially important for a financial application used by people in Kibera — a bug that shows a wrong balance or incorrectly reports a transaction can directly harm someone's livelihood.

4.1 Testing Principles
•	Test-first for all connector logic: Blink and Fedimint connector code must have tests written before implementation begins
•	Mock wallets in CI: the CI pipeline never calls live Blink or Fedimint APIs. All external APIs are mocked in tests. Live API calls only happen in manual QA and staging.
•	Real devices for performance tests: 3G throttling and low-end device emulation in Playwright are mandatory for every release. Kibera's network is the target, not a developer's fibre connection.
•	Beta users as final gate: no phase exits without a structured beta period with real Kibera users and documented feedback.

4.2 Unit Tests — What Gets Tested at the Function Level
Blink Connector
•	parsBlinkBalance: given a raw GraphQL response, returns correct sats value
•	parseBlinkTransactions: maps GraphQL transaction list to SATS internal transaction format correctly for all transaction types (incoming Lightning, outgoing Lightning, onchain, intraledger)
•	handleBlinkError: returns user-friendly error messages for 401 (invalid key), 429 (rate limit), and 500 (server error) responses
•	validateApiKeyFormat: accepts keys starting with "blink_" and rejects all others before making any network call

Fedimint Connector
•	parseFedimintBalance: given a WASM client response, returns correct sats value
•	parseFedimintHistory: maps ecash transaction history to SATS internal format
•	handleFederationConnectionError: returns clear error if federation invite code is invalid or federation is offline
•	federationDataIsLocal: confirms that no Fedimint data ever reaches the SATS backend (all Fedi queries run in the browser; this test runs in a JSDOM environment and verifies no outbound HTTP calls are made to Afribit servers during Fedi operations)

Portfolio Calculator
•	sumWalletBalances: correctly sums sats across n wallets
•	convertSatsToke: converts sats to KES using a given rate, rounded correctly
•	calculateInflationDelta: given historical rates and a transaction history, returns correct value difference between then-KES and now-KES
•	calculatePeriodIncome: sums incoming transactions for a date range correctly
•	categorizeTransaction: correctly categorises a transaction as income, payment, savings, or program reward based on metadata

AI Agent Layer
•	intentClassifier: given a user message in English, Swahili, and Sheng, correctly identifies intent (balance query, transaction history, analytics, education, unknown)
•	contextBuilder: given wallet data, produces a system prompt context string within the configured token budget
•	toolRouter: given AI tool call output, correctly routes to the appropriate connector function
•	aiResponseValidator: rejects AI responses that attempt to call write tools when the user has not granted write permission (Phase 2 gate test)

Price & Rate Service
•	cachesBtcRate: after one CoinGecko call, subsequent calls within 5 minutes return cached value without hitting the API
•	fallsBackOnCoinGeckoFailure: on CoinGecko 5xx, returns last cached rate with staleness timestamp
•	historicalRateQuery: returns correct historical daily rate for a given date

4.3 Integration Tests — What Gets Tested Across Components
Onboarding Flow
•	connectBlinkWallet: user enters valid Blink API key → connector validates → balance fetched → cached in IndexedDB → dashboard shows correct balance
•	connectBlinkWalletInvalidKey: user enters invalid key → clear error shown → no data fetched → no crash
•	connectFediWallet: user enters valid federation invite code → Fedimint WASM initialises → balance read → cached → dashboard updated
•	connectMultipleWallets: connect Blink then Fedi → dashboard shows combined balance correctly
•	byokConnector: user enters custom endpoint and API key → connector attempts connection → handles success and error cases

Dashboard
•	dashboardLoadsOffline: with no internet, dashboard renders last-cached balance and transactions without error
•	dashboardRefreshesOnReconnect: when internet returns, dashboard fetches fresh data and updates without full page reload
•	balanceInKes: BTC/KES rate applied correctly; balance updates when cached rate refreshes
•	transactionFeedOrder: unified feed across Blink and Fedi is sorted by timestamp, newest first, no duplicates

AI Conversation
•	aiAnswersBalanceQuery: user asks "what is my balance" → AI receives correct wallet context → responds with accurate figures in KES and sats
•	aiAnswersInSwahili: system prompt language set to Swahili → AI responds entirely in Swahili
•	aiAnswersInSheng: language set to Sheng → AI responds in Sheng
•	aiDoesNotHallucinate: AI response for balance query is verified against actual connector data — any response that claims a balance differing by more than 1% from actual is flagged as a test failure
•	aiHandlesUnknownIntent: user says something unrelated to Bitcoin → AI responds gracefully without crashing

4.4 End-to-End Tests — Full User Journeys in a Real Browser
All E2E tests run in Playwright on a Chromium instance emulating a Samsung Galaxy A10 (360x800px, 2GB RAM). Network is throttled to 3G (750kbps down, 250kbps up, 100ms latency).

Journey 1: First-Time User Setup
1.	Open app on 3G — measure time to interactive (target: under 3 seconds)
2.	Language selection: select Swahili — verify all UI text switches
3.	Wallet setup: enter Blink API key (test key from staging environment)
4.	Wallet connects — celebrate animation plays
5.	Dashboard loads with correct staging balance
6.	User taps AI chat: types "Nina ngapi?" — AI responds with correct balance in Swahili
7.	User closes browser — reopens — verify offline mode shows cached data instantly

Journey 2: Returning User Analytics
8.	App opens from home screen icon (installed PWA)
9.	Dashboard shows cached balance immediately (no loading state)
10.	User taps "Last 30 days" — chart renders with correct data
11.	User asks AI: "Je, niliokoa kiasi gani mwezi huu?" (Did I save anything this month?)
12.	AI responds with correct savings summary including inflation comparison

Journey 3: Multi-Wallet User
13.	Blink and Fedi wallets both connected
14.	Dashboard shows combined balance correctly
15.	Transaction feed shows transactions from both wallets in chronological order
16.	User searches "last week" in transaction feed — only last-7-day transactions shown
17.	User taps one transaction — AI explains what it was in plain language

4.5 Performance Tests
•	First load on 3G: target under 3 seconds to interactive. Measured with Playwright network throttling. Tested on every release.
•	App shell cache hit: on second load (service worker active), target under 1 second. Cached HTML, JS, and CSS served from service worker.
•	Fedimint WASM lazy load: @fedimint/core WASM module does NOT load on first app open. It loads only when user initiates Fedi wallet connection. Verified with Playwright network request inspection.
•	AI response latency: from user submitting a message to AI response appearing, target under 4 seconds on a standard internet connection. Tested with response time assertions in integration tests.
•	Dashboard with 1,000 transactions: transaction feed renders without jank on a Galaxy A10 emulator. Tested using Playwright accessibility tree scan and frame rate measurement.

4.6 Offline Tests
•	Service worker caches app shell: verified that HTML, CSS, JS, and fonts load from cache when network is disabled
•	Cached balance displayed offline: last-known balance renders correctly when device is airplane mode
•	Transaction feed available offline: last-synced transactions display without network
•	AI assistant handles offline: when network is unavailable, AI shows a clear "I need internet to answer this" message — it does not attempt API calls that would fail
•	Background sync on reconnect: when network returns, wallet data automatically refreshes and dashboard updates without user action
•	Rate staleness indicator: when cached BTC/KES rate is older than 15 minutes, UI shows "Rate from [timestamp]" instead of implying it is live

4.7 Localisation Tests
•	All three languages render without overflow or truncation on a 360px wide screen. Swahili words are often 30–50% longer than English equivalents — every UI element is verified with Swahili text before English.
•	Date and number formatting: KES amounts display with correct formatting (e.g. KES 1,234.50 not KES 1234.5). Dates display in local format (DD/MM/YYYY not MM/DD/YYYY).
•	RTL test: not required in Phase 1, but internationalisation framework must not break if RTL language is added in future (Arabic for potential East African expansion).

4.8 Beta Testing Protocol
Beta Phase: Weeks 15–17 (Phase 1)
•	Participants: 20 Kibera merchants and residents, selected from existing Afribit program participants
•	Devices: participants use their own phones — no controlled devices provided. This is intentional.
•	Tasks given (no instructions beyond the task): "Connect your Blink wallet", "Find out how much you received last week", "Ask SATS a question about your savings"
•	Observers: Afribit field team observes each session and notes where users hesitate, get confused, or make errors. No prompting.
•	Exit criteria: 80% of participants complete all three tasks without observer help
•	Feedback collection: short voice-memo debrief in Swahili/Sheng after each session — transcribed and reviewed by product team
•	Bug threshold: any bug that causes a crash or incorrect balance display is P0 — beta does not proceed until it is fixed. UI confusion bugs are P1 — tracked and addressed before public launch.
 
5. Security Architecture
Security is not a feature. It is a constraint that shapes every architectural decision. For a platform handling Bitcoin wallets used by Kibera residents — people for whom every sat matters — a security failure is not a business problem. It is a harm to real people. This section is written accordingly.

5.1 Threat Model — What We Are Protecting Against
Before defining security controls, we must be clear about what we are defending:

Assets to Protect
•	User API keys (Blink read-only keys, Fedi federation credentials) — if stolen, attacker gains read access to wallet data; in Phase 2 write-scope keys mean fund access
•	User transaction history — private financial data that reveals income, spending habits, and financial state
•	User identity — phone number, name if collected, language preferences
•	AI conversation history — users may share sensitive financial concerns with the AI assistant

Threat Actors
•	Network attacker (man-in-the-middle): intercepts traffic between the PWA and Afribit servers
•	Malicious website (XSS): injected script attempts to read API keys from localStorage or IndexedDB
•	Phishing site: fake SATS UI tricks user into entering their wallet keys
•	Malicious AI prompt (prompt injection): user pastes content from an attacker that attempts to manipulate the AI agent
•	Server breach: attacker gains access to the Afribit backend database
•	Compromised dependency (supply chain): malicious code introduced via an npm package
•	Insider threat: a team member with server access exfiltrating user data

5.2 User Key Protection — The Highest Priority Control
The single most important security property of SATS Phase 1: Afribit servers NEVER receive, store, or log user API keys. This is not a policy — it is an architectural constraint.

Blink API Key Handling
•	The Blink read-only API key is entered by the user in the browser. It is encrypted using the browser's Web Crypto API (AES-GCM, 256-bit key) before being stored in IndexedDB.
•	The encryption key is derived from a device-local secret generated at first launch and stored in localStorage. This means the encrypted key in IndexedDB cannot be decrypted without the device-local secret — they are useless separately.
•	When the frontend calls the Afribit backend to fetch wallet data, it does NOT send the API key. Instead, it sends a session token. The backend does not have the key — it cannot call Blink on behalf of the user.
•	Architecture implication: all Blink API calls are made from the user's browser, not from the Afribit server. The backend aggregates and caches the response data, but never proxies the key.
•	Audit log: the key is NEVER written to any log file, error report, or analytics event. This is enforced by a linter rule that rejects any console.log or logger call that references the key variable.

Fedi / Fedimint Credential Handling
•	Fedi credentials (federation invite code) are processed entirely in the browser via the Fedimint WASM SDK. The Afribit backend receives no Fedi data at all — not the invite code, not the balance, not the transaction history.
•	All Fedimint queries run client-side. The WASM module communicates directly with the user's Fedimint federation servers. SATS is transparent in this data flow.
•	The invite code is stored encrypted in IndexedDB using the same AES-GCM mechanism as the Blink key.

5.3 Transport Security
•	HTTPS enforced everywhere: all SATS endpoints, the Blink API, CoinGecko API, and all Afribit services serve exclusively over HTTPS/TLS 1.3. HTTP is rejected.
•	HSTS (HTTP Strict Transport Security) header set on all Afribit domains with max-age of 1 year and includeSubDomains flag. This prevents downgrade attacks.
•	Content Security Policy (CSP): strict CSP headers prevent inline script execution and restrict which external domains the app can communicate with. Specifically: script-src restricts to self only; connect-src restricts to api.blink.sv, api.coingecko.com, the Afribit API domain, and the user's Fedimint federation domain.
•	Subresource Integrity (SRI): any third-party scripts loaded from CDN include integrity hashes. The browser will refuse to execute a script if its hash does not match — preventing CDN compromise attacks.

5.4 Browser Storage Security
•	No sensitive data in localStorage: localStorage is accessible by any JavaScript running on the page, making it vulnerable to XSS. Only non-sensitive preferences (language, theme) are stored in localStorage.
•	Encrypted IndexedDB for keys: API keys are stored in IndexedDB encrypted with AES-GCM. Even if an XSS attacker reads the IndexedDB entry, they get only ciphertext.
•	Session data in memory only: the decrypted API key lives in application memory (a React state variable or module-level variable) only for the duration of a single session. It is never written to disk in plaintext. Memory is cleared on tab close.
•	Clear on logout: the encrypted keys in IndexedDB and the device-local encryption secret in localStorage are both wiped on "Disconnect wallet" action. After this, recovery requires re-entering the API key.

5.5 AI Agent Security — Prompt Injection Defense
An AI agent that reads user-provided wallet data and executes actions is a target for prompt injection attacks. An attacker who can influence the content of a transaction memo or a wallet label could attempt to embed instructions that manipulate the AI's behavior.

Controls Against Prompt Injection
•	Input sanitization: all wallet data fetched from Blink and Fedi (transaction memos, labels, descriptions) is sanitized before being included in the AI system prompt. Any string that contains patterns resembling instructions ("ignore previous", "you are now", "system:", "act as") is flagged and included in the prompt as escaped plain text, never as a new instruction.
•	Role separation: the AI system prompt explicitly states that all content within the wallet data context block is untrusted user data, not instructions. The AI is instructed to treat it as data to analyse, not commands to follow.
•	Tool use restrictions Phase 1: the AI is given zero write-capable tools in Phase 1. The tool definitions passed to the API are read-only (get_balance, get_transactions, get_rate, summarize). There is no send_payment tool in Phase 1 — even if an injection succeeded, there is nothing dangerous to call.
•	Tool use restrictions Phase 2: when write tools are introduced, every tool call is validated by a server-side rule engine before execution. If the tool call parameters do not match the user's confirmed intent (as stored in the session), the call is rejected and the user is notified.
•	No system prompt in user messages: the user input field never accepts HTML, markdown with executable elements, or multiline pastes that could be mistaken for system instructions. Input is treated as plain text.

5.6 Phase 2 Transaction Security — Confirmation Architecture
Phase 2 only. Documented here because the security architecture for transactions must be designed in Phase 1, even if not built until Phase 2.

•	Explicit authorization scope: write-scope API keys are NEVER requested during onboarding. The user must navigate to Settings > Wallet > Advanced > Enable Send to grant write permission. This is a deliberate friction point.
•	Mandatory confirmation screen: every AI-initiated transaction surfaces a full-screen confirmation view — not a modal, not a toast — with: amount in sats, amount in KES at current rate, destination, wallet used, estimated fee, and a 3-second countdown before the confirm button activates (prevents accidental taps).
•	Transaction signing is local: for Blink Phase 2, the write API call is made from the browser using the user's write-scope key — not from the Afribit server. The server cannot initiate a transaction without the user's browser being involved.
•	Rate limiting: maximum 5 send attempts per hour per wallet, enforced server-side. Prevents a compromised session from draining a wallet quickly.
•	Anomaly detection: any transaction more than 10x the user's average transaction size triggers an additional confirmation step: "This is a larger payment than usual. Are you sure?"
•	Audit trail: every confirmed transaction is logged server-side with session ID, timestamp, amount, and destination. Keys are never in this log. This log is available to the user in Settings > Activity Log.

5.7 Server-Side Security
Authentication
•	SATS Phase 1 has no user accounts. Wallet API keys ARE the identity. There is no username/password to steal.
•	Session tokens: when the frontend connects a wallet, the backend issues a short-lived session token (JWT, 24-hour expiry) that identifies the session without containing the wallet key. All subsequent backend calls use this token.
•	Session token storage: stored in an httpOnly, Secure, SameSite=Strict cookie. Not accessible to JavaScript — eliminates XSS-based session theft.

Input Validation
•	All backend API inputs are validated against strict TypeScript types using Zod (open source, MIT). Inputs that do not match the expected shape are rejected with a 400 error — never passed to a database query or external API call.
•	API key format validation: any value submitted as a Blink API key is verified to match the "blink_" prefix format before any Blink API call is made. Malformed keys never reach the Blink servers.

Rate Limiting
•	Express rate limiter (express-rate-limit, MIT licensed) applies per-IP rate limits to all backend endpoints. Default: 100 requests per 15-minute window per IP.
•	AI endpoint rate limit: stricter limit of 20 AI requests per 5 minutes per session to prevent abuse of the Claude API and runaway costs.
•	CoinGecko rate protection: the backend acts as a cache proxy for price data. A maximum of one outbound CoinGecko call every 5 minutes regardless of how many frontend requests arrive.

Dependency Security
•	GitHub Dependabot enabled on all repositories. Dependabot scans for known CVEs in npm dependencies daily and opens automated pull requests for security patches.
•	npm audit runs in CI: if any high or critical severity vulnerability is present in the dependency tree, the CI pipeline fails and the PR cannot be merged.
•	Lock files committed: package-lock.json is committed to the repository and verified in CI. Dependencies cannot be silently updated between developer machines.
•	Minimal dependency policy: before adding any new npm package, a review is required covering: last publish date, number of maintainers, download count, and license. Packages with a single maintainer and under 10,000 weekly downloads require explicit team approval.

5.8 Operational Security
Environment Variables
•	The Claude API key, CoinGecko API key (if upgraded to paid), and database connection string are stored as Render environment variables — never in source code or committed to GitHub.
•	No secrets in git history: git-secrets is installed in all developer environments and runs as a pre-commit hook. Any commit containing strings matching secret patterns (API keys, connection strings) is rejected before it reaches GitHub.

Logging
•	All application logs omit user API keys, wallet IDs, and balance values. Log entries contain only: timestamp, endpoint, response status, session ID (opaque), and duration.
•	Error reporting: Sentry (open source self-hosted option available) captures crashes without including sensitive data. The Sentry configuration explicitly scrubs fields named "apiKey", "key", "token", "balance", and "sats" from all error payloads.

Access Control
•	The Render PostgreSQL database is not publicly accessible. It communicates only with the Render-hosted backend service via private network.
•	No developer has direct production database access during normal operations. Database queries for debugging require a documented access request and are logged.
•	GitHub repository branch protection: the main branch requires at least one review approval before merging. No direct pushes to main by any team member including founders.

5.9 Security Review Schedule
Activity	Frequency	Description
Dependency audit	Every CI run	npm audit with failure on high/critical CVE
Dependabot alerts	Daily (automated)	Automated PRs for security patches in npm dependencies
Secret scan	Every commit (pre-commit hook)	git-secrets rejects any commit containing API key patterns
CSP review	Each release	Verify Content Security Policy headers still match actual resource domains used
Pen test — read-only scope	Before Phase 1 public launch	External reviewer attempts to extract user API keys via XSS, network interception, and prompt injection
Pen test — transaction scope	Before Phase 2 launch	External reviewer attempts to initiate unauthorized transactions via UI manipulation, session replay, and AI prompt injection
Access log review	Monthly	Review production access logs for anomalous query patterns or unusual session activity
Incident response drill	Quarterly	Simulate a breach scenario: practice key rotation, user notification, and service isolation procedures

5.10 Incident Response
If a security incident is detected or reported, the following steps apply in order:

18.	Isolate: immediately disable the affected service or endpoint. Render allows instant service suspension without data loss.
19.	Assess: determine scope — which users are affected, what data may have been exposed, whether funds are at risk.
20.	Notify: within 24 hours of confirmed breach, send direct notification to all affected users via the PWA notification system and any contact information on file. Notification includes: what happened, what data was affected, what action users should take (e.g. regenerate their Blink API key).
21.	Remediate: fix the root cause with tests proving the fix. Do not reopen the service until the fix is deployed and tested.
22.	Post-mortem: within 7 days, publish a transparent post-mortem on the Afribit GitHub (public) describing what happened, why, how it was fixed, and what changes were made to prevent recurrence.

Security is a community effort. The SATS codebase is open source. Any developer who discovers a vulnerability is encouraged to report it via security@afribit.africa. Responsible disclosures will be acknowledged publicly and rewarded where possible.
 
6. Document Maintenance
This Technical Reference Document is a living document. It should be updated whenever:
•	A tool in the stack is upgraded to a major version
•	A new connector is added or removed from the integration plan
•	A phase timeline or exit criteria changes
•	A new test category is added
•	A security incident occurs and the security architecture is updated in response

Changes to this document are tracked in the git history of the SATS repository. The document lives at /docs/TECHNICAL.md in the codebase. The Word version is the authoritative human-readable form; the Markdown version in the repository is the developer-facing reference.

The next documents to be produced after this one are:
•	Wireframe specification: screen-by-screen UI design in Bitcoin orange on dark, with annotated interaction flows
•	Developer Connector Interface Specification: the standard API that third-party tools must implement to integrate with SATS (Phase 3)
•	Swahili & Sheng Copy Guide: all UI strings in all three languages, reviewed by native Sheng speakers from Kibera

Afribit Africa  |  afribit.africa  |  Technical Reference v1.0  |  June 2026
