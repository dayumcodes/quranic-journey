# Pal sync — next steps

Cross-device Pal lists, shared chat, shared goals, and reading snapshots use your **Postgres** tables and first-party routes. Quran Foundation API approval is still required for **goals, streaks, activity, collections**, while the app database stores **who is linked to whom**, **shared messages**, **shared goals**, and **shared reading snapshots**.

## 1. Create a Postgres database

Use any host that works with Vercel serverless (connection string in env):

- [Neon](https://neon.tech), [Supabase](https://supabase.com), [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), etc.

Copy the **connection string** (often `postgres://` or `postgresql://`).

## 2. Set environment variables

**Vercel (Production + Preview as needed)**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string for pal links |
| `QF_CLIENT_ID` | Server QF client id (already used by proxy) |
| `QF_CLIENT_SECRET` | Server secret |
| `QF_ENV` | `prelive` or `production` (must match where users log in) |
| `QF_AUTH_BASE_URL` / `QF_API_BASE_URL` | Optional overrides if not using defaults for `QF_ENV` |

**Browser OAuth** (unchanged): `NEXT_PUBLIC_OAUTH_*`, `NEXT_PUBLIC_OAUTH_REDIRECT_URI` must match your QF app (e.g. `https://yourdomain.com/auth/callback`).

**Important:** Pal API auth resolves the user via QF **userinfo** using the bearer token. The `sub` from userinfo must match `user.id` stored in the app after login (same identifier you use in Pal).

## 3. Run the migration

From the repo root (`al-rihla/`), with `DATABASE_URL` set:

```bash
npm run db:migrate:pals
```

This applies every SQL file under [`db/migrations`](db/migrations), including the pal links, reading progress, and pal messages tables.

You can run this locally against your hosted DB, or from CI once per environment.

## 4. Deploy

Push to your branch and let Vercel deploy (or deploy manually). Ensure **`DATABASE_URL`** is set on the deployment that should use pal sync.

## 5. Smoke test

1. Log in as **User A** on device 1 → Pal → add **User B** (paste ID or invite flow).
2. Log in as **User A** on device 2 (same account) → open Pal → **B** should appear after load (server pull in [`app/pal/page.tsx`](app/pal/page.tsx)).
3. Remove a pal on one device; confirm list updates (and server row deleted).

If `GET /api/pals` returns **401**, check bearer token + `QF_*` secrets and QF auth base matching your login environment.

If `GET /api/pals` returns **500** with “Missing DATABASE_URL”, the env var is not set on that deployment.

## 6. Quran Foundation form (still separate)

After QF approves scopes for **Goals**, **Streaks**, **Users**, etc., align `NEXT_PUBLIC_OAUTH_SCOPE` (and OAuth app settings) so the token can call `/api/qf-user/...`. That does **not** replace Pal DB sync—it only fixes QF-backed data and profile APIs.
