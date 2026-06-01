
₿
AFRIBIT SATS
Your Bitcoin World. One Conversation.

PRODUCT VISION, MVP SPECIFICATION & FULL ROADMAP

Afribit Africa
Kibera, Nairobi, Kenya
afribit.africa
Version 1.0  |  June 2026  |  Confidential
 
1. Executive Summary
Afribit Africa has spent four years proving that Bitcoin works as a real financial tool for unbanked communities in Kibera, Nairobi. Over 200 residents now use Bitcoin daily, 40+ merchants accept it, and the Taka Sats, Boda-Boda, and Women's Upcycling programs have demonstrated that Bitcoin can create genuine economic value at the grassroots level.

The problem we are now solving is the next frontier: fragmentation. A Kibera merchant today might use Fedi for community savings, Blink for Lightning payments, visit three websites to check Bitcoin prices in KES, and have no single view of their financial picture. Every tool has its own UI, its own terminology, its own changelog that confuses users after every update. Nobody has prioritized their experience as a whole.

Afribit SATS is the answer: a single AI-powered Progressive Web App that connects every Bitcoin tool a Kibera resident uses, understands their financial life across all of them, and talks to them about it in Swahili or Sheng — doing things on their behalf, not just showing information.

The product launches in three phases:

•	Phase 1 (MVP): Read-only wallet aggregation — connect Blink and Fedi, load all historical data, and deliver AI-powered financial summaries. No purchases, no sends. Pure intelligence.
•	Phase 2: Action layer — send, receive, and manage funds across wallets through the AI with explicit user authorization.
•	Phase 3: Open ecosystem — buying Bitcoin, developer integrations, chama management, and expansion across Africa.

Built entirely on open-source tools. Designed for 3G networks, low-end Android devices, and Swahili speakers. Afribit SATS is not competing with Fedi or Blink — it is the layer that makes all of them useful together.
 
2. The Problem
2.1 The Fragmented Bitcoin Experience
The Bitcoin ecosystem has produced extraordinary tools. Fedi brings community-federated custody. Blink delivers seamless Lightning payments. Bitika and Minmo allow KES-to-BTC conversion. Bolt Cards enable tap-to-pay. But every one of these tools exists as its own island — its own app, its own account, its own language, its own update cycle.

For a developer or Bitcoin enthusiast, navigating this is manageable. For a vegetable seller in Kibera earning KES 800 a day, it is an overwhelming barrier.

2.2 What a Kibera Merchant Faces Today
Consider a typical merchant in Soweto West who has adopted Bitcoin through the Afribit programs. On any given day they might need to:

•	Check their Fedi wallet balance for community savings
•	Check their Blink wallet for Lightning payment receipts
•	Look up the current BTC/KES rate on a separate website
•	Figure out if they are up or down compared to last month
•	Understand whether their chama contribution went through
•	Find somewhere to buy more Bitcoin using M-Pesa
•	Learn something new about how Lightning works

Each of these tasks requires a different app, a different login, a different UI. When any of these apps updates — and they update frequently — the merchant is lost again. Nobody has mapped this entire journey and asked: what is the simplest possible way for one person to get all of this done?

The tools are excellent. The experience is broken. Afribit SATS fixes the experience.

2.3 Why AI Changes Everything
The breakthrough insight is that an AI agent does not present information through a UI — it understands intent and acts on it. Instead of a merchant learning seven different UIs, they have one conversation partner who knows all seven systems and handles them transparently.

The merchant does not need to know what an API key is. They do not need to understand Lightning channels or ecash notes. They say what they want in plain Swahili, and it happens. This is not a chatbot layered on top of apps — it is a genuinely new way to interact with financial infrastructure.
 
3. Product Vision
3.1 The One-Line Vision
"Your Bitcoin world. Every wallet. One conversation."
3.2 Core Principles
•	Open source only — every integration must be with open-source projects or via collaboration agreements with developers
•	Privacy-first — user keys never leave the user's device; read-only access is default; all actions require explicit confirmation
•	Africa-native — designed for 3G networks, low-end Android devices, Swahili and Sheng as primary languages
•	AI does things — the AI is an agent, not a chatbot; it executes on behalf of users, not just talks
•	One experience, many tools — each integrated service keeps its identity; SATS is the layer that connects them
•	Community-rooted — features are built from real Kibera use cases, not assumed from Western fintech playbooks

3.3 Who It Serves

User	Their Bitcoin life today	What SATS gives them
Micro-merchant	Blink for sales, Fedi for savings, confused by two apps	One AI that shows unified balance, income trends, and answers questions in Sheng
Boda-boda rider	Microloan received in sats, unsure how much he has or owes	Clear balance overview, repayment tracking, progress toward ownership
Chama member	Community savings in Fedi, no dashboard for group finances	Group balance, individual contributions, meeting summaries in Swahili
Waste collector	Receives sats for Taka Sats program, no history of earnings	Full earnings history, inflation comparison showing sats value over time
Bitcoin learner	Wants to understand Bitcoin but overwhelmed by jargon online	AI explains concepts in Sheng using their own transaction data as examples
 
4. Full Feature Set — All Phases
This section documents every planned feature across all phases. Phase 1 (MVP) features are marked and represent the initial build. All other features are roadmap items to be built as the user base and developer ecosystem grows.

4.1 Phase 1 — Wallet Aggregation & AI Intelligence (MVP)
4.1.1 Cinematic Onboarding
•	Full-screen animated welcome sequence — large typography, Bitcoin orange on dark background, word-by-word reveal animation inspired by Gemini's launch experience
•	Progressive setup wizard: connects wallets one at a time with celebration feedback after each connection
•	Two connection modes per wallet: (a) BYOK — user pastes their read-only API key, (b) Auto-connect — guided OAuth-style flow for users who find key generation difficult
•	Inline micro-guides: "How to get your Blink read-only key" in 3 illustrated steps, accessible without leaving the setup flow
•	Language selection at first launch: English, Swahili, Sheng — persists across all sessions
•	Offline-capable: onboarding completes and is cached; app works without internet after initial setup

4.1.2 Wallet Connections — Phase 1
•	Blink wallet integration via read-only API key (dashboard.blink.sv key generation)
•	Fedi / Fedimint integration via SDK — connect to any Fedimint federation with read-only observer access
•	BYOK (Bring Your Own Key) — generic input for any Lightning wallet that exposes a read API; user provides endpoint and key
•	Read-only guarantee: SATS Phase 1 cannot move funds under any circumstances; enforced at architecture level
•	Multi-wallet support: user can connect as many wallets as they have
•	Wallet nicknames: user can name each wallet ("My Fedi Chama", "Blink Business")

4.1.3 Unified Balance Dashboard
•	Total portfolio view: all sats across all wallets summed into one number
•	KES equivalent shown in real-time using live BTC/KES rate
•	Per-wallet breakdown with individual balances
•	Balance history chart — 7-day, 30-day, 90-day, all-time views
•	Inflation comparison: "If this were in M-Pesa/KES savings, it would be worth X less today"
•	Daily change indicator: up/down from yesterday with percentage

4.1.4 Transaction Intelligence
•	Unified transaction feed across all connected wallets in chronological order
•	Historical data import: on first connection, all historical transactions are loaded from Blink API and Fedimint SDK
•	Transaction categorization by AI: income, payment, savings, chama contribution, program reward (Taka Sats, Boda-Boda)
•	Search and filter: by wallet, date range, amount, category, or keyword
•	Export: transaction history as CSV for record-keeping

4.1.5 AI Financial Assistant — Phase 1
•	Conversational interface in Swahili, Sheng, or English — user selects at any time
•	Natural language balance queries: "Nina ngapi leo?" (How much do I have today?)
•	Spending summaries: "This week you received 45,000 sats from 12 sales"
•	Inflation insights: "Your Blink wallet sats bought 8% more last month — here's why"
•	Transaction explanations: tap any transaction, AI explains what happened in plain language
•	Financial health questions: "Am I better off than last month?" — AI compares periods and gives honest answer
•	Bitcoin education on demand: user asks any Bitcoin question, AI answers using their own data as examples
•	AI uses Claude Haiku for simple queries (fast, cheap) and Sonnet for complex analytics (accurate)

4.1.6 PWA & Offline Architecture
•	Progressive Web App — installable from browser on Android and iOS without app store
•	Works on 3G networks: app shell loads in under 3 seconds on 3G
•	Offline mode: last-known balances and transactions available without internet
•	Background sync: app refreshes wallet data when connection is available
•	No push notification dependency: works entirely on user-initiated refresh
•	Responsive design: optimized for low-end Android phones (360px wide screens)

4.2 Phase 2 — Action Layer (Send, Receive, Manage)
4.2.1 AI-Executed Transactions
•	Send Bitcoin: user says "Send 5,000 sats to Kamau" — AI identifies wallet, confirms recipient, shows KES equivalent, awaits explicit approval before executing
•	Receive Bitcoin: AI generates appropriate invoice from any connected wallet and explains how to share it
•	Cross-wallet transfers: "Move 20,000 sats from Blink to Fedi" — AI handles the route
•	Mandatory confirmation screen for every action: amount, destination, KES value, fee estimate — user must actively confirm
•	Action authorization model: users grant send permission per-wallet explicitly in settings; read-only remains default

4.2.2 Chama Management (Fedi-native)
•	View all chama (group savings) contributions and withdrawals
•	Group balance with per-member breakdown
•	Meeting schedule and contribution reminders
•	AI-generated chama financial reports in Swahili for group sharing
•	Contribution tracking: "Your next chama payment is 10,000 sats due in 3 days"

4.2.3 Recurring Actions
•	Scheduled savings: "Save 5,000 sats every Friday from my Blink to Fedi"
•	Program tracking: automatic logging of Taka Sats earnings, Boda-Boda loan payments
•	Alerts: low balance warning, large incoming payment notification

4.3 Phase 3 — Open Ecosystem
4.3.1 Bitcoin Purchase (On-Ramp)
•	Integrate Bitika.xyz and Minmo APIs for KES-to-BTC via M-Pesa
•	AI checks live rates across all integrated on-ramps and recommends best rate
•	Full purchase flow: AI confirms amount, rate, destination wallet, M-Pesa number, awaits approval
•	Purchase history and cost-basis tracking for all buys
•	Rate alerts: "Tell me when I can buy Bitcoin at KES X per sat"

4.3.2 Developer Ecosystem & SDK
•	Public API: third-party tools can request integration into Afribit SATS
•	Connector SDK: standardized interface for any Bitcoin/Lightning tool to become a SATS connector
•	Mini app framework: developers can build focused tools that run inside SATS (similar to Fedi Mini Apps)
•	Open-source integration bounties: Afribit funds development of high-priority connectors
•	Developer directory: discoverable list of all integrated tools with their capabilities

4.3.3 Nostr & Social Layer
•	Nostr identity integration: users can link a Nostr key for decentralized identity
•	Community feed: Bitcoin news and Afribit updates in Swahili curated by AI
•	Peer recommendations: "3 merchants near you also use Fedi" — social proof for adoption
•	Zaps: send small amounts to community members via Nostr/Lightning zaps

4.3.4 Geographic Expansion
•	Multi-district support: Mathare, Mukuru, Kawangware onboarding using same platform
•	Community federation setup wizard: new communities can configure their own Fedimint through SATS
•	Localization: extend beyond Swahili/Sheng to other Kenyan languages, then pan-African
•	White-label mode: other Bitcoin circular economy projects can deploy SATS under their own brand
 
5. Architecture Overview
5.1 Three-Layer Architecture
Afribit SATS is built in three clean layers. Each layer has a single responsibility and communicates with the others through defined interfaces.

Layer	Name	Responsibility
Layer 1	Connector Layer	Wallet APIs, SDK integrations, data normalization. Fetches raw data from Blink, Fedi, and future tools.
Layer 2	Intelligence Layer	AI agent (Claude API). Understands user intent, queries connectors, composes responses, executes actions with authorization.
Layer 3	Experience Layer	React PWA frontend. Chat UI, dashboard, analytics views, onboarding flow. The only thing users ever touch.

5.2 Wallet Integrations — Phase 1
Blink (Galoy)
•	Integration: GraphQL API at api.blink.sv — fully open source (github.com/GaloyMoney/blinkbtc)
•	Authentication: read-only API key generated by user at dashboard.blink.sv — user pastes key into SATS
•	Capabilities in Phase 1: balance query, full transaction history, real-time incoming payment notifications via webhook
•	Key security: key is stored encrypted in the browser's IndexedDB; never transmitted to Afribit servers

Fedi / Fedimint
•	Integration: Fedimint Rust SDK (fedimint.org) — fully open source, production-ready
•	Authentication: user provides their federation invite code; SATS connects as a read-only observer
•	Capabilities in Phase 1: balance query, ecash transaction history, federation metadata
•	Note: Fedi went fully open source January 3, 2026 — all SDK components are now MIT licensed

5.3 AI Agent Architecture
•	Model routing: Claude Haiku 4.5 for simple intent detection and balance lookups (~$1/M tokens); Claude Sonnet 4.6 for complex financial analysis (~$3/M tokens input)
•	Prompt caching: system prompt (same for all users) is cached, reducing cost by up to 90% on repeated calls
•	Context window: each conversation carries the user's wallet summary (balances, recent transactions) so the AI always has current context
•	Tool use: AI is given a defined set of tools — get_balance, get_transactions, get_rate, summarize_period — it calls these to answer questions
•	Safety layer: a pre-execution check validates every AI-proposed action against a rule set before presenting to user for confirmation

5.4 Technology Stack
Component	Technology	Rationale
Frontend	React + Vite + Tailwind CSS	Fast PWA builds, large open-source community, Tailwind enables rapid dark-mode UI
PWA Layer	Workbox (service workers)	Offline-first caching, background sync, installable from browser
Backend / Agent	Node.js + Express	Lightweight, fast, large ecosystem, easy Anthropic SDK integration
AI	Claude API (Anthropic)	Best-in-class instruction following, Swahili capability, tool-use support
Database	SQLite (local) / PostgreSQL (server)	Transaction history cached locally for offline; PostgreSQL for server-side analytics
Deployment	Railway or Render	Low-cost, auto-scaling, easy CI/CD, free tier available for MVP
BTC/KES Rate	CoinGecko API (free tier)	Open, no authentication required, reliable for price data
 
6. AI Cost Model
6.1 How Pricing Works
Claude API is billed per million tokens. A token is roughly 4 characters of text. Every AI interaction — the system prompt, user message, wallet data context, and AI response — consumes tokens. We control cost by routing simple queries to the cheaper Haiku model and only using Sonnet for complex analysis.

Model	Input (per 1M tokens)	Output (per 1M tokens)	Best used for
Claude Haiku 4.5	$1.00	$5.00	Balance queries, intent detection, simple summaries
Claude Sonnet 4.6	$3.00	$15.00	Multi-wallet analytics, inflation calculations, financial health reports

6.2 Real-World Cost Projection
A typical SATS user session: user asks 3-5 questions about their balances and spending. Each turn uses ~2,000 tokens input (system prompt + context + user message) and ~500 tokens output.

Scenario	Model	Cost/session	100 users/day	1,000 users/day
Simple balance check	Haiku	$0.004	$0.40/day	$4/day ($120/mo)
Full analytics summary	Sonnet	$0.013	$1.30/day	$13/day ($390/mo)
Mixed (realistic)	Haiku+Sonnet	$0.006	$0.60/day	$6/day (~$180/mo)

6.3 Cost Optimization Techniques
•	Prompt caching: the system prompt is identical for all users and all sessions. With caching enabled, cached input tokens cost up to 90% less — this alone cuts AI costs by 40-60% in production.
•	Model routing: a lightweight classifier (Haiku) reads every user message first and decides whether to use Haiku (simple) or Sonnet (complex). Only ~20% of queries need Sonnet.
•	Context compression: wallet transaction history is summarized before being sent to the AI, rather than sending raw data. This reduces input token count significantly.
•	Realistic Phase 1 target: under $150/month for 1,000 daily active users with full optimization. Well within grant budget.
 
7. MVP Specification — Phase 1
Phase 1 is the only thing being built right now. Everything else in this document is future roadmap. Focus is everything.

7.1 MVP Scope — What Is In
•	Cinematic onboarding with wallet connection (Blink + Fedi via API key / OAuth)
•	BYOK input for additional Lightning wallet APIs
•	Read-only balance dashboard — unified view across all wallets
•	Historical transaction import and unified transaction feed
•	AI financial assistant — natural language queries in Swahili/Sheng/English
•	Inflation comparison — sats vs KES savings value over time
•	Installable PWA — works on Android Chrome, iOS Safari
•	Offline mode — cached data accessible without internet

7.2 MVP Scope — What Is Out
•	Sending or receiving Bitcoin (Phase 2)
•	Buying Bitcoin — no on-ramp in Phase 1 (Phase 3)
•	Chama management features (Phase 2)
•	Nostr or social features (Phase 3)
•	Developer SDK or third-party integrations beyond Blink and Fedi
•	Native mobile app (Android/iOS) — PWA first, native later if warranted

7.3 User Flow — First Launch
1.	User visits afribit.africa/sats on mobile browser
2.	Full-screen cinematic welcome: "Your Bitcoin world. One conversation." — text animates in word by word
3.	Language selection appears: English | Kiswahili | Sheng
4.	Setup screen: "Let's connect your wallets" — cards for Blink and Fedi appear
5.	User taps Blink card: inline guide shows how to generate read-only API key in 3 steps
6.	User pastes key — connection validates instantly, celebration animation plays
7.	User taps Fedi card: guided federation connect flow
8.	Setup complete: "Fetching your Bitcoin world..." — animated loading
9.	Dashboard appears with unified balance, AI generates first financial summary automatically

7.4 AI Conversation Examples — Phase 1
The following illustrate what the AI can do with read-only wallet data:

User: "Nimeokoa kiasi gani mwezi huu?" (How much have I saved this month?) AI: "Umehifadhi sats 45,200 mwezi huu kupitia Fedi — sawa na KES 2,410 leo. Mwezi uliopita ulikuwa KES 2,180 kwa kiasi kile kile cha sats — umeongeza thamani kwa 10% kwa sababu ya mabadiliko ya Bitcoin."

User: "Am I up or down this month overall?" AI: "You're up. Your total holdings across Blink and Fedi are worth KES 8,240 today. At the start of June they were worth KES 7,100 — a 16% increase. Most of that is Bitcoin price movement, not new income. Your incoming payments this month were 23,000 sats."

User: "What was my biggest payment this week?" AI: "Your largest incoming payment this week was 8,500 sats on Wednesday at 2:14 PM — it landed in your Blink wallet. At today's rate that's KES 453. No label on it. Do you want to add a note for this one?"

7.5 MVP Build Milestones
Week	Deliverable	Status	Owner
1-2	Project setup: React PWA scaffold, Tailwind, service worker, offline shell	Planned	Engineering
3-4	Blink API connector — auth, balance, transaction history fetch	Planned	Engineering
5-6	Fedi SDK connector — federation connect, balance, ecash history	Planned	Engineering
7-8	Onboarding flow — cinematic animation, wallet setup, BYOK input	Planned	Engineering + Design
9-10	Dashboard — unified balance, per-wallet breakdown, charts	Planned	Engineering + Design
11-12	AI assistant integration — Claude API, tool definitions, Swahili/Sheng	Planned	Engineering
13-14	Inflation analytics, transaction categories, historical charts	Planned	Engineering
15-16	Beta with 20 Kibera merchants — bug fix, feedback, Swahili tuning	Planned	Full team
17-18	Public launch — PWA live, press, onboarding 100+ users	Planned	Full team
 
8. Design Direction
8.1 Brand Principles
•	Dark-first: deep dark backgrounds (#0D0D0D, #1A1A1A) as the primary environment — reflects the aesthetic of serious financial tools and Bitcoin culture
•	Bitcoin orange (#F7931A) as the primary accent — used for key numbers, CTAs, section headers, and celebration moments
•	Typography-forward: large, confident numbers for balances; clean sans-serif (Inter or DM Sans) throughout
•	Minimal UI chrome: no unnecessary borders, gradients, or decoration — the data is the design
•	Swahili-native spacing: Swahili words are often longer than English equivalents; UI must be designed with Swahili text from the start, not retrofitted

8.2 Color Palette
Name	Hex	Usage
Bitcoin Orange	#F7931A	Primary CTA, key numbers, section highlights, logo
Deep Black	#0D0D0D	App background, full-screen panels
Charcoal	#1A1A1A	Card backgrounds, wallet panels
Warm Amber	#FFB547	Secondary accent, warnings, pending states
Teal Green	#00C896	Positive values, gains, successful connections
Signal Red	#FF4D4D	Losses, errors, warnings
Muted Grey	#AAAAAA	Secondary text, labels, timestamps
Pure White	#FFFFFF	Primary text on dark backgrounds

8.3 Onboarding Animation Specification
The first experience of SATS must feel like entering something significant. Reference: Gemini's startup animation and Linear's onboarding — cinematic, dark, typographic, no cartoon illustrations.

•	Screen 1: Pure black. Bitcoin symbol (₿) fades in, pulses once. Tagline appears word by word in white: "Your Bitcoin world." pause "Every wallet." pause "One conversation."
•	Screen 2: Language selection fades in — three options, minimal, center-aligned. Tap registers immediately.
•	Screen 3: "Let's connect your world" — wallet cards slide up from bottom. Blink card, Fedi card, BYOK card.
•	Screen 4 (per wallet): Full focus on single wallet. Dark card expands. Step-by-step key generation guide inline. Input field with monospace font for the key. Validation pulse on success.
•	Screen 5: "Fetching your Bitcoin world..." — animated progress with real labels: "Connecting Blink...", "Loading transactions...", "Building your picture..."
•	Screen 6: Dashboard reveals from black with balance number counting up to actual value.
 
9. Open Source & Developer Ecosystem
9.1 The Open Source Commitment
Afribit SATS is built exclusively on open-source foundations and will itself be fully open source from day one. Every integration partner must be an open-source project or must agree to open an integration-specific API under a permissive license. This is non-negotiable — it ensures that the community of Bitcoin developers globally can contribute to, verify, and build upon what we create.

•	SATS core codebase: MIT License, public on GitHub from first commit
•	Connector SDK (Phase 3): Apache 2.0, allowing commercial use with attribution
•	All integrated tools in Phase 1 (Blink, Fedimint): confirmed open source
•	Non-open tools: approached via collaboration email for API access and eventual open licensing

9.2 Why Developers Will Want to Integrate
The Bitcoin developer community is motivated by mission, distribution, and feedback — not vendor lock-in. Afribit SATS offers all three in a way no other platform targeting Africa does.

•	Mission alignment: being "used in Kibera" is a powerful story for any Bitcoin project — it represents real-world validation that no testnet can provide
•	Distribution: when SATS reaches 10,000 active users across Nairobi, integration means instant access to Africa's most engaged Bitcoin community
•	Feedback loops: Kibera merchants are the most demanding real-world test users — developers get ground-truth data on how their tools perform under real constraints (3G networks, small screens, Swahili UX)
•	Recognition: integrated tools are featured in the SATS connector directory with full attribution, press mentions, and community acknowledgment

9.3 Integration Outreach Strategy
For tools that are not yet open source but would benefit the Kibera community, Afribit will send formal collaboration proposals including:

•	Clear description of the integration use case and the community it serves
•	Request for read-only API access under a defined SLA
•	Proposal for co-authoring a blog post or case study on real-world Bitcoin adoption
•	Path to open sourcing the integration layer if not the full tool
 
10. Regulatory Considerations
Note: This section provides a planning framework. Afribit should consult qualified Kenyan legal counsel before handling any transaction execution features.

10.1 Phase 1 Regulatory Position
In Phase 1, SATS is a read-only wallet aggregation and analytics tool. It does not hold funds, execute transactions, or facilitate transfers. It reads data from existing wallets that the user already owns and presents it through an AI interface. This positions Phase 1 as a financial information service rather than a Virtual Asset Service Provider (VASP).

Under the Kenya Virtual Asset Service Providers Act 2025 (Act No. 20/2025), the regulatory trigger for VASP registration is the facilitation of virtual asset transactions. A read-only aggregation product is unlikely to require registration, but this should be confirmed with legal counsel before public launch.

10.2 Phase 2 Regulatory Considerations
When Phase 2 introduces transaction execution (sending Bitcoin on behalf of users), SATS may require registration with the Central Bank of Kenya (CBK) as a payment service provider or wallet operator under the VASP Act. Key compliance areas to prepare for:

•	KYC/AML: Know Your Customer and Anti-Money Laundering requirements — user identity verification
•	Travel Rule: transaction metadata sharing between VASPs for transactions above threshold
•	KRA reporting: tax reporting obligations under Finance Act 2025 (10% excise duty on virtual asset transaction fees)
•	Data residency: user financial data storage and handling requirements

Afribit's existing community trust and established relationships in Kibera are significant assets for regulatory engagement. The VASP Act was designed in part to enable legitimate operations like Afribit's — proactive engagement with CBK is recommended.
 
11. Roadmap Summary
Phase	Timeline	Key Deliverables	Success Metric
Phase 1 (MVP)	Months 1-5	PWA, Blink + Fedi read-only, AI assistant, Swahili/Sheng, analytics	100 active users, 90% positive feedback from Kibera beta
Phase 2	Months 6-10	Send/receive via AI, chama management, recurring savings, alerts	500 users, 1,000 AI-executed transactions
Phase 3	Months 11-18	Bitcoin on-ramp (Bitika, Minmo), developer SDK, Nostr, multi-district	2,000 users, 5+ tool integrations, 3 districts
Phase 4	Month 18+	White-label for other African Bitcoin communities, pan-African expansion	10,000+ users across 3+ countries
 
12. Why This Matters
Every tool in the Bitcoin ecosystem was built by someone who cared deeply about financial freedom. Fedi was built to protect communities. Blink was built to make Lightning simple. Fedimint was built to make custody trustworthy. These are extraordinary achievements.

But the Kibera merchant who uses all three of them has never been the center of the story. They are an afterthought in changelogs, a data point in impact reports, and a problem to be solved with more features in more apps.

Afribit SATS puts them at the center. It asks: what does it look and feel like when every Bitcoin tool in existence serves one person — a vegetable seller in Soweto West — as if it were all built specifically for them?

The answer is this product. And the answer starts with Phase 1: just knowing. Just understanding, for the first time, what your entire Bitcoin financial picture actually looks like — in your language, on your phone, explained by an AI that treats you like the sophisticated financial actor you already are.

₿ Build in the open. Build for Kibera. Build for Africa.

Afribit Africa  |  afribit.africa  |  Kibera, Nairobi, Kenya  |  Version 1.0  |  June 2026
