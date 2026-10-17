# NOVA + PULSE

**Every child walks in ready.**

NOVA helps children and families prepare for medical procedures, in their language and at their pace. PULSE shows the care team who is ready, who is stuck, and why, before the appointment rather than after it fails.

The first pathway is **pediatric MRI**. Children who aren't prepared are more likely to move during the scan, need sedation, or have the scan stopped and rescheduled.

> Built at DubHacks 2026. Educational prototype. **All patients are fictional.** Not medical advice.

## How it works

| | NOVA (family) | PULSE (care team) |
|---|---|---|
| Who | Child + guardian, via a link | Care coordinators, child life, imaging staff |
| What | Interactive prep: meet the scanner, practice the sounds, a stay-still game, plain-language instructions, a metal safety checklist | Every upcoming scan with a readiness score, status, and barriers |
| Loop | Completing steps and reporting barriers ("needs interpreter", "transportation") updates PULSE live | Assigning a pathway or resolving a barrier updates NOVA live |

**Readiness is deterministic, not AI:** it's the weighted share of completed prep steps. A patient "needs attention" when they have an open barrier or a scan within 2 days with readiness under 70%.

## Accessibility

- Atkinson Hyperlegible font (designed by the Braille Institute for low-vision readers)
- Text size, high-contrast, and reduce-motion settings
- Read-aloud for child content; keyboard navigation and screen-reader labels throughout
- Sound practice uses graded exposure with an always-visible Stop button
- Optional on-device camera "wiggle meter"; video never leaves the browser

## AI system card

**Feature:** "Explain it differently" (`app/api/explain/route.ts`)

**What it does:** rewrites a short piece of approved patient-education text at a chosen reading level (simple / standard / detailed) and in one of five languages (English, Spanish, Chinese, Vietnamese, Somali).

**Model:** Google Gemini (`GEMINI_MODEL`, default `gemini-3.8-flash`), temperature 0.2, JSON output validated against a schema.

**Inputs:** only a step id, reading level, and language from the browser. The source text is looked up on the server from `lib/pathway-content.ts`; users cannot send free text to the model. No patient data is sent to the model.

**Guardrails in the prompt:** use only facts in the approved text; keep every safety instruction and every "follow your care team" statement; no diagnosis or outcome predictions; list anything that couldn't be expressed faithfully.

**Output handling:** responses that fail schema validation are dropped and the family is told the original text is correct. Every AI output is labeled as AI-rewritten with a link to the source.

**Out of scope:** the AI doesn't diagnose, triage, schedule, or decide readiness. There's no open-ended chat.

**Known gaps (prototype):**
- AI-rewritten text is shown to families without review by a clinician.
- No automated check that translations preserve meaning.
- No logging or audit trail of what was generated and shown.

## Data and security (prototype)

- Supabase Postgres with Realtime. Schema: `supabase/schema.sql`; synthetic seed: `supabase/seed.sql`.
- Demo access policy: the public anon key can read and write the synthetic tables. **This is not acceptable for real patient data.** Production would need authentication, per-role row-level security, HIPAA-compliant hosting, and BAAs with every vendor.
- Family links use an unguessable-looking token, not real authentication.

## Running locally

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash
```

Run `supabase/schema.sql`, then `supabase/seed.sql`, in the Supabase SQL editor. Then:

```bash
npm run dev
```

- Family view: http://localhost:3000/family/maya-demo
- Care team: http://localhost:3000/care

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · Framer Motion · Supabase (Postgres + Realtime) · Google Gemini · Web Audio API · Web Speech API

## Content sources

General MRI information is adapted from [MedlinePlus: MRI](https://medlineplus.gov/ency/article/003335.htm). Each hospital's own instructions take priority.
