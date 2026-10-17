import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { EXPLAINABLE_STEPS, LANGUAGES, READING_LEVELS } from "@/lib/explain-options";
import { PREP_INSTRUCTIONS, SOURCE, UNDERSTAND_MRI } from "@/lib/pathway-content";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

// The client only picks a step id; the approved text itself never comes from the browser.
const APPROVED_TEXT: Record<(typeof EXPLAINABLE_STEPS)[number], string[]> = {
  "understand-mri": UNDERSTAND_MRI,
  "prep-instructions": PREP_INSTRUCTIONS,
};

const RequestSchema = z.object({
  step: z.enum(EXPLAINABLE_STEPS),
  readingLevel: z.enum(READING_LEVELS.map((l) => l.value) as [string, ...string[]]),
  language: z.enum(LANGUAGES.map((l) => l.value) as [string, ...string[]]),
});

const ExplanationSchema = z.object({
  paragraphs: z.array(z.string()),
  omitted_or_uncertain: z
    .array(z.string())
    .describe("Anything from the source you could not express faithfully. Empty if nothing."),
});

const READING_LEVEL_GUIDE: Record<string, string> = {
  simple: "about a 4th-grade reading level: short sentences, everyday words, no jargon",
  standard: "about a 7th-grade reading level, briefly explaining any medical term you keep",
  detailed: "an adult reading level, keeping correct medical terms with short explanations",
};

const SYSTEM = `You rewrite approved patient-education text for families preparing for a child's medical procedure.

Rules:
- Use ONLY facts stated in the approved text. Do not add new medical facts, numbers, risks, or advice.
- Keep every safety instruction and every "follow your care team's instructions" statement.
- Do not diagnose, predict outcomes, or tell the family to change anything their care team said.
- Write in the requested language and reading level. Warm, calm, plain tone.
- If something cannot be expressed faithfully at that level or language, list it in omitted_or_uncertain.`;

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "AI is not configured (add GEMINI_API_KEY to .env.local)." }, { status: 500 });
  }

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { step, readingLevel, language } = parsed.data;
  const languageName = LANGUAGES.find((l) => l.value === language)!.label;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Approved text:\n<approved_text>\n${APPROVED_TEXT[step].join("\n\n")}\n</approved_text>\n\nRewrite it in ${languageName} at ${READING_LEVEL_GUIDE[readingLevel]}.`,
      config: {
        systemInstruction: SYSTEM,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(ExplanationSchema),
      },
    });

    const explanation = ExplanationSchema.safeParse(JSON.parse(response.text ?? "null"));
    if (!explanation.success) {
      return Response.json({ error: "Couldn't generate an explanation. The original text above is correct." }, { status: 502 });
    }

    return Response.json({ ...explanation.data, source: SOURCE, model: MODEL });
  } catch (error) {
    if (error instanceof ApiError) {
      const message =
        error.status === 429 ? "Too many requests. Try again in a moment." : `AI service error (${error.status}).`;
      return Response.json({ error: message }, { status: error.status === 429 ? 429 : 502 });
    }
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Couldn't generate an explanation. The original text above is correct." }, { status: 502 });
    }
    throw error;
  }
}
