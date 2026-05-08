# Al-Rihla

Next.js 15 app for Quranic engagement: Journey, Reflect, and Pal experiences, with Quran Foundation content and user APIs plus OAuth2/OIDC (PKCE).

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v3, Framer Motion
- Zustand (auth state), Howler (audio), Phosphor icons

## Prerequisites

- Node 18+ (LTS recommended)
- npm

## Setup

```bash
cd al-rihla
npm install
```

Copy env example to `.env.local` (`cp .env.local.example .env.local` on macOS/Linux, or copy the file manually on Windows).

Edit `.env.local`:

- `NEXT_PUBLIC_OAUTH_CLIENT_ID` — from Quran Foundation after API/OAuth approval
- `NEXT_PUBLIC_OAUTH_REDIRECT_URI` — e.g. `http://localhost:3000/auth/callback` locally, or your production `/auth/callback`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the project in Vercel (root directory: `al-rihla` if the repo is the parent folder).
3. Set the same `NEXT_PUBLIC_*` variables in the Vercel project settings.
4. Use your production URLs in the Quran Foundation OAuth app (Client URL, Redirect URI, Post-logout URI) and in `.env` for production.

## API access

Request access and OAuth credentials via [Quran Foundation API docs](https://api-docs.quran.foundation/request-access/).

## License

Private / project-specific — adjust as needed.
