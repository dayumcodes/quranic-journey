# Implementation checklist — Al‑Rihla

## Phase 1 (implemented now) — Public content + MCP (no OAuth required)

These work when the browser can reach public endpoints (`api.quran.foundation`, optional `mcp.quran.ai`, `nominatim.openstreetmap.org`) and DNS/network are not blocking them.

### Journey (`/journey`)

- Loads chapter list from **`GET https://api.quran.foundation/api/v4/chapters`** and maps SVG nodes (`chapterId` from API).
- Selecting a node loads **first verse of that surah** (`{chapterId}:1`) via **`GET /verses/by_key/...`** and audio via **`GET /recitations/{id}/by_ayah/...`** with URL normalization (`lib/utils/audioUrl.ts`).
- **Map retry** on chapters fetch failure (`JannahMap` error state + Retry).
- **Player retry** on verse/audio fetch failure (`JourneyPlayer` Retry).
- Quiz / badge UI remains prototype flow (quiz copy still fixed text — not MCP in Phase 1).

### Reflect (`/reflect`)

- After location **DETECTED**, runs MCP semantic search with **`classification.keywords`** (`semanticSearch` in `lib/api/mcp.ts`, defensive JSON shapes).
- Renders **`VerseReflectionCard`** per selected result; hydrates richer Arabic/translation/tafsir from content API where possible (`getVerseByKey`, `getTafsirByAyah`).
- **Verse navigation** arrows + dots wired to MCP result list (`VerseDots`); count reflects results length (max 5). If MCP fails/empty → **single fallback** verse `21:83`.
- MCP loading uses **`ReflectVerseSkeleton`** (“Enter context manually” line is still UI-only).

### Hooks / infra

- **`lib/api/mcp.ts`**: Parses multiple plausible response shapes (`results`, `data`, arrays).
- **`useVerseAudio`**: preload + noop error callbacks to avoid noisy autoplay stalls (browser may still block until user gesture).

---

## Phase 2 (needs OAuth **`NEXT_PUBLIC_OAUTH_CLIENT_ID`** + Bearer token flows)

Requires approved scopes and working token storage after `/auth/callback`.

### User-backed persistence

| Feature | Planned API |
| -------- | ----------- |
| Save reflection / bookmarks | **`POST /api/v1/collections`** (+ `GET` hydrate) |
| Journey badge unlocked → collection item | **`POST /collections`** with `badge_id` / `verse_key` |
| Streaks & weekly verse counts (`Pal`) | **`GET /streaks`**, **`GET /activity`** |
| Goals widget | **`GET/POST /goals`** |
| Shared feed fetch | **`GET /posts?user_ids=...`** |
| Post reflection / encouragement / nudge | **`POST /posts`** |
| Activity after listening/quiz | **`POST /activity/sessions`** |

### Auth UX

| Missing today | Needed |
| ------------- | ------ |
| Nav profile triggers login | Call `useAuthStore().login()` (PKCE URL already wired) |
| Token → user identity | **`userinfo`/profile** parsing in callback (currently placeholder user) |

---

## Phase 3 (polish once Phase 2 works)

### Reflect

- “Enter context manually →” modal/input → MCP query from free text → refresh verse carousel.
- Location **DENIED/ERROR**: manual context fallback + empty states vs skeleton.
- `SavedDrawer`: **`GET /collections`** + slide-over list; verse save calls real **`POST`**.
- Skip prev/next prefetch + stale cancel patterns if needed.

### Pal

| Today | Needed |
| ----- | ------ |
| ~~Hardcoded streaks/progress/posts~~ → **wired** (`/pal`) | ✅ Multi-pal **`PalChatSidebar`** + **`palThreadsStorage`**, sync from **`goal.partner_id`** and **`usePalInvitePrompt`** (`?partner=`). **`getPosts(user, partner)`** + **`recipient_id`**. **`usePalEncouragementToastStore`** + **`GlobalNav`** uses real sender name. Auth exchange merges **`sub`** from **id_token** / JWT. Partner weekly **`GET /activity`** + optional **`user_ids`**, else **`—`**. **`PalSharedGoalStarter`**, **`PartnerHeader`** remain prop-driven. |


### Journey

| Today | Needed |
| ----- | ------ |
| `JourneyQuiz` fixed question | MCP quiz generation + graded submit + `activity/sessions` |
| `BadgeStrip` static unlock count | **`GET /collections`** + earned badges |

### Security / resilience

| Item | Notes |
| ---- | ----- |
| CORS/audio hosts | Confirm content CDN allows browser playback |
| **`apiFetch` from server components** | `useAuthStore` is client-only; keep content fetches in client or refactor server fetch without Zustand import in shared module |

---

### Quick diagnose “still static?”

1. Confirm DevTools Network: **`api.quran.foundation` resolves** (not `ERR_NAME_NOT_RESOLVED`).
2. Confirm **`NEXT_PUBLIC_*` OAuth** filled when testing **writes** (`collections`, `posts`).
3. For Reflect: confirm **`POST https://mcp.quran.ai/`** succeeds (otherwise fallback verse only).
