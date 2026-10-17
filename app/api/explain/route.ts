import { createHash } from "node:crypto";
import { ApiError } from "@google/genai";
import { z } from "zod";
import { EXPLAINABLE_STEPS, LANGUAGES, READING_LEVELS, type ExplainResponse } from "@/lib/explain-options";
import { APPROVED_TEXT, SOURCE } from "@/lib/pathway-content";
import { MODEL, rewrite, type RewriteResult } from "@/lib/rewriter";
import { serverSupabase } from "@/lib/supabase-server";

const RequestSchema = z.object({
  step: z.enum(EXPLAINABLE_STEPS),
  readingLevel: z.enum(READING_LEVELS.map((l) => l.value) as [string, ...string[]]),
  language: z.enum(LANGUAGES.map((l) => l.value) as [string, ...string[]]),
});

// Data minimisation (GDPR Art. 5 / HIPAA): no patient data goes to the model or into the AI log. Translations are
// shared content, reviewed once and reused by every family, so the log doesn't record who asked.
// The approved text is the only content; nothing from the browser reaches the prompt except enum choices.

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { step, readingLevel, language } = parsed.data;

  const source = APPROVED_TEXT[step];
  const sourceHash = createHash("sha256").update(source.join("\n")).digest("hex");
  const db = serverSupabase();

  // 1. Serve a clinician-approved version if one exists for this exact source text.
  const { data: existing, error: lookupError } = await db
    .from("ai_rewrites")
    .select("status, paragraphs, reviewed_by, reviewed_at")
    .eq("step_key", step)
    .eq("reading_level", readingLevel)
    .eq("language", language)
    .eq("source_hash", sourceHash)
    .in("status", ["approved", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lookupError) return Response.json({ error: "Couldn't check reviewed content." }, { status: 500 });

  if (existing?.status === "approved") {
    return Response.json({
      status: "approved",
      paragraphs: existing.paragraphs,
      reviewedBy: existing.reviewed_by,
      reviewedAt: existing.reviewed_at,
      source: SOURCE,
    } satisfies ExplainResponse);
  }
  // 2. A draft is already waiting for review; don't generate (or show) another.
  if (existing?.status === "pending") return Response.json({ status: "pending" } satisfies ExplainResponse);

  // 3. Generate a draft, check it, and queue it for clinician review. Families never see unreviewed text.
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "AI is not configured (add GEMINI_API_KEY to .env.local)." }, { status: 500 });
  }
  const languageName = LANGUAGES.find((l) => l.value === language)!.label;

  let result: RewriteResult;
  try {
    result = await rewrite(source, languageName, readingLevel);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`[explain] Gemini ${error.status} (model ${MODEL}):`, error.message);
      const message =
        error.status === 429
          ? "Too many requests. Try again in a moment."
          : error.status === 404
            ? `AI model "${MODEL}" isn't available for this key. Check GEMINI_MODEL in .env.local.`
            : `AI service error (${error.status}).`;
      return Response.json({ error: message }, { status: error.status === 429 ? 429 : 502 });
    }
    throw error;
  }
  const { paragraphs, omitted, backTranslation, failures } = result;

  const status = failures.length > 0 ? "blocked" : "pending";
  const { error: insertError } = await db.from("ai_rewrites").insert({
    step_key: step,
    reading_level: readingLevel,
    language,
    source_hash: sourceHash,
    model: result.model,
    paragraphs: paragraphs.length ? paragraphs : null,
    omitted_or_uncertain: omitted,
    back_translation: backTranslation,
    guardrail_failures: failures,
    status,
  });
  if (insertError) return Response.json({ error: "Couldn't save the draft for review." }, { status: 500 });

  return Response.json({ status } satisfies ExplainResponse);
}
