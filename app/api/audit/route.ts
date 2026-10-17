import { ApiError } from "@google/genai";
import { checkInjection, redactPII } from "@/lib/guardrails";
import { MODEL, rewrite } from "@/lib/rewriter";

// Free-text entry point for automated safety audits (VEYZL).
//
// NOVA's product never accepts free text: families pick a step, reading level, and language, and the server
// supplies the approved text (/api/explain). Audit tools probe with free-text prompts, so this route treats any
// input as untrusted content and runs it through the exact same pipeline: system prompt, Gemini safety filters,
// schema validation, guardrails, instruction-leak check, clinical-safety check, plus PII redaction.
//
// It never writes to the database, never reaches families, and caps input size.

const MAX_INPUT_CHARS = 2000;
const REFUSAL =
  "I can't help with that here. NOVA only rewrites instructions your care team has approved. For questions about your child's care, please ask your care team.";

export async function GET() {
  return Response.json({
    endpoint: "/api/audit",
    method: "POST",
    accepts: 'JSON with "prompt", "input", "message", "query", "text", or OpenAI-style "messages"; or a plain-text body',
    returns: '{ "response": string, "blocked": boolean, "reasons": string[] }',
  });
}

export async function POST(req: Request) {
  const input = await readInput(req);
  if (!input) return Response.json({ error: "Send a prompt to audit." }, { status: 400 });
  if (input.length > MAX_INPUT_CHARS) {
    return Response.json({ error: `Input is limited to ${MAX_INPUT_CHARS} characters.` }, { status: 413 });
  }
  const injection = checkInjection(input);
  if (!injection.ok) return reply(REFUSAL, true, injection.failures);
  if (!process.env.GEMINI_API_KEY) return Response.json({ error: "AI is not configured." }, { status: 500 });

  const source = input.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  try {
    const result = await rewrite(source, "English", "simple");
    if (result.failures.length > 0) return reply(REFUSAL, true, result.failures);
    return reply(redactPII(result.paragraphs.join("\n\n")), false, []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`[audit] Gemini ${error.status} (model ${MODEL}):`, error.message);
      return Response.json({ error: `AI service error (${error.status}).` }, { status: error.status === 429 ? 429 : 502 });
    }
    throw error;
  }
}

function reply(text: string, blocked: boolean, reasons: string[]) {
  // Several common field names so generic audit harnesses can read the answer.
  return Response.json({ response: text, output: text, answer: text, blocked, reasons });
}

async function readInput(req: Request): Promise<string | null> {
  const raw = await req.text().catch(() => "");
  if (!raw.trim()) return null;
  try {
    const body = JSON.parse(raw);
    if (typeof body === "string") return body.trim();
    for (const key of ["prompt", "input", "message", "query", "text", "question", "content"]) {
      if (typeof body?.[key] === "string" && body[key].trim()) return body[key].trim();
    }
    if (Array.isArray(body?.messages)) {
      const lastUser = [...body.messages].reverse().find((m: { role?: string }) => m?.role === "user");
      const content = lastUser?.content;
      if (typeof content === "string") return content.trim();
      if (Array.isArray(content)) {
        return content
          .map((c: { text?: string }) => (typeof c?.text === "string" ? c.text : ""))
          .join("\n")
          .trim();
      }
    }
    return null;
  } catch {
    return raw.trim();
  }
}
