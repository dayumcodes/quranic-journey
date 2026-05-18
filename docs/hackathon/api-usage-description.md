# API Usage Description

Al-Rihla integrates **Quran Foundation** APIs in both required hackathon categories: **Content API** (and **Quran MCP**) and **User API**. All integrations use approved OAuth credentials; Content and User calls are proxied through Next.js server routes so client secrets and access tokens are handled securely.

Official references:

- [Quran Foundation API documentation](https://api-docs.quran.foundation/)
- [Content APIs (v4)](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/content-apis/)
- [Quran MCP](https://mcp.quran.ai/)

---

## Authentication (prerequisite for User APIs)

| Item | Usage in Al-Rihla |
|------|-------------------|
| **OAuth 2.0 Authorization Code + PKCE** | Sign-in from the app; callback exchanges code for tokens |
| **Scopes** | `openid`, `profile`, `email`, and User API scopes: `read/write:collections`, `read/write:goals`, `read/write:activity`, `read/write:posts`, `read:streaks` |
| **Token storage** | Browser `sessionStorage` for access token; Bearer sent to `/api/qf-user/*` proxy |

Implementation: `lib/store/authStore.ts`, `app/auth/callback/page.tsx`, `app/api/auth/qf/exchange/route.ts`

---

## Category 1: Content API (and Quran MCP)

### Quran / chapter metadata

| API | Endpoint pattern (v4) | Where used |
|-----|------------------------|------------|
| **Chapters** | `GET /content/api/v4/chapters` | Journey map (`JannahMap`), Pal surah pickers, shared goal setup |
| **Verses by key** | `GET /content/api/v4/verses/by_key/{key}` | Journey player, Reflect cards (Arabic + translation + word data) |

Implementation: `lib/api/quran.ts` → server proxy `app/api/qf/[...path]/route.ts`

### Translations

| API | Usage |
|-----|--------|
| **Translations on verses** | Requested via `translations=131` (English) on `verses/by_key` |

Used on Journey and Reflect when displaying verse meaning.

### Tafsir

| API | Endpoint pattern | Where used |
|-----|------------------|------------|
| **Tafsir by ayah** | `GET /content/api/v4/tafsirs/{id}/by_ayah/{verseKey}` | Reflect — expandable tafsir on each verse card |

Implementation: `getTafsirByAyah` in `lib/api/quran.ts`, `components/reflect/VerseReflectionCard.tsx`

### Audio / recitations

| API | Endpoint pattern | Where used |
|-----|------------------|------------|
| **Recitation by ayah** | `GET /content/api/v4/recitations/{id}/by_ayah/{verseKey}` | Journey audio player, Reflect verse playback |

Audio URLs normalized for playback (`lib/utils/audioUrl.ts`, `lib/hooks/useVerseAudio.ts`).

### Quran MCP (Content alternative)

| Capability | Where used |
|------------|------------|
| **Semantic search** | Reflect — after location/theme detection, queries MCP with contextual keywords; results drive verse carousel |

Implementation: `lib/api/mcp.ts` → `app/api/mcp-search/route.ts` (server forwards to `mcp.quran.ai`)

---

## Category 2: User API

All User API traffic goes through the authenticated proxy: **`/api/qf-user/*`** → Quran Foundation `auth/v1/*` (and `quran-reflect/v1/*` for certain post routes).

Implementation: `lib/api/userApiBase.ts`, `app/api/qf-user/[...path]/route.ts`, `lib/api/user.ts`

### Collections (bookmarks)

| Operation | Usage |
|-----------|--------|
| **GET collections** | Reflect — “Saved” drawer; check if verse already bookmarked |
| **POST collection** | Journey — save verse to collection after reading; Reflect — save verse from card |

Files: `lib/api/user.ts`, `components/reflect/VerseReflectionCard.tsx`, `app/journey/page.tsx`

### Streak tracking

| Operation | Usage |
|-----------|--------|
| **GET streaks** | Pal page — “day streak” stat cards for the signed-in user |

`getStreaks()` with `type=QURAN`, `status=ACTIVE` in `lib/api/user.ts`

### Activity & goals

| Operation | Usage |
|-----------|--------|
| **GET goals / today’s plan** | Pal — personal reading focus and goal metadata |
| **POST goals** | Pal — create or update Quran range goals |
| **GET activity days** | Pal — weekly verses read (user’s own activity) |
| **POST activity days** | Journey and Pal — log reading sessions (`type=QURAN`, verse ranges, duration) |

Files: `lib/api/user.ts`, `app/journey/page.tsx`, `app/pal/page.tsx`

### Post APIs (reflections on Quran Foundation)

| Operation | Usage |
|-----------|--------|
| **POST posts** | Available via `lib/api/posts.ts` for publishing reflections to Quran Foundation’s post system (Quran Reflect gateway) |

Pal’s **partner chat feed** uses the app’s **Postgres** `pal_messages` table for fast, private messaging between linked pals; this is **supplementary** and does not replace User API usage—the Pal screen still calls **streaks**, **goals**, **activity**, and **collections** from Quran Foundation as listed above.

---

## Architecture diagram (text)

```
Browser (React)
    │
    ├─► /api/qf/*          ──► Content API v4 (client credentials + proxy)
    ├─► /api/qf-user/*     ──► User API auth/v1 (user Bearer token)
    ├─► /api/mcp-search    ──► Quran MCP
    └─► /api/pal-*         ──► App Postgres (pal links, messages, shared progress)
                              (not a hackathon substitute for User/Content APIs)
```

---

## Hackathon requirement checklist

| Requirement | Al-Rihla |
|-------------|----------|
| ≥ 1 **Content API** or **Quran MCP** |  Chapters, verses, translations, tafsir, recitation **+** MCP semantic search |
| ≥ 1 **User API** |  Collections, streaks, goals, activity sessions |
| Live demo | Deployed Next.js app on Vercel |https://quranicjourney.vercel.app/
| OAuth / approved access | Quran Foundation OAuth client configured |

---

## Environment variables (for reviewers)

Key public/server variables (see `.env.local.example`):

- `NEXT_PUBLIC_OAUTH_CLIENT_ID`, `NEXT_PUBLIC_OAUTH_REDIRECT_URI`
- `QF_CLIENT_ID`, `QF_CLIENT_SECRET`, `QF_API_BASE_URL`, `QF_AUTH_BASE_URL`
- `DATABASE_URL` (Pal messaging and shared progress)

