# Detailed Explanation of the Idea

## Problem

Many people reconnect with the Quran during Ramadan, but struggle to **sustain** that connection afterward. Common gaps include:

- Reading without structure or feedback
- Difficulty finding verses that match their **current life context** (stress, grief, gratitude, travel)
- No lightweight **accountability** with someone they trust
- Tools that feel transactional rather than spiritual

## Solution: Al-Rihla

Al-Rihla treats Quranic engagement as a **journey with companionship**, not a checklist. The product has three pillars that work alone or together:

### 1. Journey — Learn with structure

- Interactive map of all 114 surahs powered by live chapter metadata from Quran Foundation
- Selecting a surah loads the opening verse with **Uthmani script**, **English translation**, and **recitation audio**
- Word-by-word data supports future depth; quizzes and badge moments reward consistency
- Reading sessions can be saved to **collections** and logged as **activity** on the user’s Quran Foundation profile

**Why it matters:** Lowers the barrier to “where do I start?” while keeping content authoritative.

### 2. Reflect — Connect scripture to life

- Optional location detection classifies context (e.g. healing, worship, journey, knowledge)
- **Quran MCP semantic search** returns verses that match the user’s situation in natural language—not only keyword lookup
- Each result expands with full verse text, translation, **tafsir**, and audio from Content APIs
- Users can **bookmark** verses into collections and share reflections externally

**Why it matters:** Makes the Quran feel personally relevant in the moment, not only during scheduled reading.

### 3. Pal — Grow with someone beside you

- Users link a “pal” and see side-by-side presence, reading focus, and momentum
- **Shared reading goals** (surah, pace, target date) with progress tracked in-app and via Quran Foundation **goals** and **activity** where scopes allow
- **Streak** and weekly verse stats encourage gentle competition, not guilt
- A shared reflection feed lets both partners post encouragement and thoughts (stored in the app’s database for reliable real-time chat; personal QF data still syncs through User APIs)

**Why it matters:** Habit formation research shows social accountability increases follow-through; Pal makes that sacred and simple.

## Who it is for

- Muslims who want to **keep going** after Ramadan
- Pairs: friends, siblings, spouses, study partners

## Technical approach (summary)

- **Next.js 15** (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion
- **OAuth 2.0 + PKCE** against Quran Foundation for secure sign-in
- Server-side proxies for Content and User APIs (tokens never expose client secrets)
- **Postgres** (e.g. Supabase) for pal links, messages, shared goals, and reading snapshots—features that need low-latency partner sync beyond public post feeds
- Deployed on **Vercel** for a live demo URL:https://quranicjourney.vercel.app/

## Impact on Quran engagement (judging alignment)

| Criterion | How Al-Rihla addresses it |
|-----------|---------------------------|
| **Lasting habit** | Journey structure + Pal accountability |
| **Deeper understanding** | Tafsir, translations, MCP semantic discovery |
| **Accessibility** | Audio recitation, readable typography, dark mode |
| **Community** | Pal reflections and shared goals |
| **Innovation** | Location → theme → MCP verse pipeline; map-based journey UX |


## Vision

Al-Rihla’s name reflects the product goal: every user is on a **rihla**—a journey—with Allah’s book. The app’s job is to make that path visible, shared, and sustainable long after Ramadan ends.
