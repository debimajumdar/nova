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

**Human oversight:** AI drafts are never shown to families directly. Each new draft is stored as `pending` and appears in PULSE's **AI content review** queue next to the approved English source. Families see a version only after a clinician approves it, labeled with who approved it and when. Approvals are tied to a hash of the source text, so editing the source invalidates old approvals. For non-English drafts, reviewers can switch to a literal English back-translation to check the meaning against the source, even if they don't read the target language.

**Output guardrails** (`lib/guardrails.ts`): Gemini safety filters at `BLOCK_LOW_AND_ABOVE`, JSON schema validation, then deterministic, language-independent checks. A draft is blocked if it contains any number not in the source (catches fabricated doses or durations), links, emails, phone numbers, or markup, or is far longer than the source. Blocked drafts are logged and never shown.

**Traceability:** every generation is recorded in `ai_rewrites`: step, language, reading level, model, source hash, output, guardrail results, requester, reviewer, and timestamps. Browsers can read this table but not write to it. Inserts and approvals go through server routes that use the Supabase secret key.

**Out of scope:** the AI doesn't diagnose, triage, schedule, or decide readiness. There's no open-ended chat.

**Known gaps (prototype):**
- The reviewer is a fixed demo identity; production needs authenticated clinician accounts and role-based access.
- Guardrails check structure and facts like numbers, not full meaning; human review is the backstop.
- No automated evaluation suite in CI yet (planned: score rewrites against reference facts on every PR).

## Changes made because of the VEYZL audit

The VEYZL repository analysis (Healthcare profile, Generative task) flagged the controls below. Each one changed the build:

| VEYZL finding | What we changed |
|---|---|
| EU AI Act transparency & human oversight; deployment approval workflow recommended | AI drafts now require clinician approval in PULSE before any family sees them |
| EU AI Act Art. 15 (output guardrails, reduce fabrication); OECD robustness & safety | Gemini safety filters, plus deterministic checks that block invented numbers, links, and contact details |
| Google SAIF (isolate untrusted input, resist prompt injection) | Prompt input is limited to server-side approved text and enum choices; the system prompt treats source text as content, not instructions |
| Signed audit evidence / traceability | Every generation and review decision is logged in `ai_rewrites`; browsers can't write to it |
| HIPAA clinical safety (no definitive diagnosis or dosage; direct families to a clinician) | Every draft's English meaning (the draft itself, or a literal back-translation) is checked: mentions of diagnosis, doses, prescribing, stopping treatment, or safety guarantees are blocked, and so is any draft that drops the "follow your care team" instruction |
| GDPR Art. 5 data minimisation; HIPAA PHI in logs | AI requests no longer carry any patient identifier. Translations are shared content reviewed once, so the AI log doesn't record which family asked. No patient data is ever sent to the model |
| Google SAIF: block exfiltration of the system prompt | Any output that copies a 6-word run from the system instructions is blocked |
| GDPR Art. 5: output PII redaction | Emails, phone numbers, dates, and long ID numbers are masked in every audit-path output |
| VEYZL hosted audit needs a free-text route | Added `POST /api/audit`: free-text probes go through the exact same pipeline (prompt, filters, guardrails, clinical checks) plus PII redaction, with no database writes and a 2,000-character cap. Blocked probes get a safe refusal that points to the care team |
| Biometric consent (BIPA / EU AI Act) and COPPA (children's data) | The statue-game camera now requires a guardian consent step that explains it's motion-only: no face recognition, no recording, nothing leaves the device |

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

Add the server-only secret key (Supabase → Project Settings → API Keys → Secret key):

```
SUPABASE_SECRET_KEY=...
```

Run `supabase/schema.sql`, then `supabase/seed.sql`, then `supabase/002_ai_review.sql`, then `supabase/003_back_translation.sql`, in the Supabase SQL editor. Then:

```bash
npm run dev
```

- Family view: http://localhost:3000/family/maya-demo
- Care team: http://localhost:3000/care

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · Framer Motion · Supabase (Postgres + Realtime) · Google Gemini · Web Audio API · Web Speech API

## Content sources

General MRI information is adapted from [MedlinePlus: MRI](https://medlineplus.gov/ency/article/003335.htm). Each hospital's own instructions take priority.
