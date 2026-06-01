# Afribit AI — SATS

AI-native Bitcoin wallet aggregator and financial assistant for Kibera and beyond.
Conversational interface in **Swahili**, **English**, and **Sheng**. Multi-wallet support
(Blink, Fedi, BYOK), real-time BTC/KES rates, transaction analytics, and inflation insights.

## Repo Layout

| Path | Purpose |
|---|---|
| `backend/`     | Node.js + Express + PostgreSQL API (port 3002) |
| `frontend/`    | Vite + React (TBD) — to be deployed on Vercel |
| `wireframe.html` | Static design wireframe |
| `Overview.md`  | Product vision and target user |
| `Tech.md`      | Architecture decisions |

## Backend Quick Start

```bash
cd backend
cp .env.example .env       # then fill in real values
npm install
npm run db:migrate
npm run dev                # http://localhost:3002
```

See `backend/README.md` for details.

## Live Backend

A live instance runs on the development server at port **3002**.
Frontend (Vercel) should point to that public URL via `VITE_API_URL`.

## License

MIT
