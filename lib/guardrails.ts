// Deterministic checks on AI rewrites before they are stored for review.
// Language-independent on purpose: they work the same for Spanish, Somali, or Chinese output.
// Addresses VEYZL findings: EU AI Act Art. 15 (output guardrails, reduce fabrication), OECD robustness & safety.

export type GuardrailResult = { ok: boolean; failures: string[] };

const URL_RE = /(https?:\/\/|www\.)\S+/i;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;
const MARKUP_RE = /<\/?[a-z][^>]*>|```/i;
const NUMBER_RE = /\d+(?:[.,]\d+)?/g;

export function checkRewrite(source: string[], paragraphs: string[]): GuardrailResult {
  const failures: string[] = [];
  const sourceText = source.join("\n");
  const output = paragraphs.join("\n");

  if (paragraphs.length === 0 || output.trim().length === 0) failures.push("Empty output");
  if (paragraphs.length > source.length * 2) failures.push("Too many paragraphs compared to the source");
  if (output.length > sourceText.length * 3) failures.push("Output is much longer than the source (possible added content)");

  // The source has no links or contact details, so any in the output were invented.
  if (URL_RE.test(output)) failures.push("Contains a link not in the approved text");
  if (EMAIL_RE.test(output)) failures.push("Contains an email address not in the approved text");
  if (PHONE_RE.test(output)) failures.push("Contains a phone number not in the approved text");
  if (MARKUP_RE.test(output)) failures.push("Contains markup or code");

  // Any number (doses, durations, ages) must come from the approved text. Catches fabricated medical figures.
  const allowed = new Set(sourceText.match(NUMBER_RE) ?? []);
  const invented = [...new Set(output.match(NUMBER_RE) ?? [])].filter((n) => !allowed.has(n.replace(",", ".")));
  if (invented.length > 0) failures.push(`Contains numbers not in the approved text: ${invented.join(", ")}`);

  return { ok: failures.length === 0, failures };
}

// Clinical-safety checks on English text: the draft itself, or the literal back-translation of a non-English
// draft. This lets one set of English rules cover every language.
// Addresses VEYZL HIPAA / clinical-safety finding: no definitive diagnosis or dosage; always direct to a clinician.
const CLINICAL_RED_FLAGS: { re: RegExp; reason: string }[] = [
  { re: /\bdiagnos/i, reason: "Mentions a diagnosis" },
  { re: /\b(dose|dosage|mg|mcg|milligrams?|millilit(er|re)s?|ml)\b/i, reason: "Mentions a dose or dosage" },
  { re: /\bprescri/i, reason: "Mentions prescribing" },
  { re: /\b(stop|skip) (taking|giving)\b/i, reason: "Tells the family to stop or skip a treatment" },
  { re: /\b(guarantee|no risk|risk-free|completely safe|100% safe)\b/i, reason: "Makes a safety guarantee" },
];
const CLINICIAN_REFERENCE = /\b(care team|medical team|health ?care team|doctors?|nurses?|clinicians?|hospital staff)\b/i;

// Blocks output that repeats our instructions (prompt exfiltration). Any 6-word run copied from the system
// prompt counts. Addresses VEYZL SAIF finding: block exfiltration of the system prompt.
export function checkInstructionLeak(paragraphs: string[], systemPrompt: string): GuardrailResult {
  const words = (s: string) => s.toLowerCase().match(/[a-z']+/g) ?? [];
  const sys = words(systemPrompt);
  const shingles = new Set(sys.slice(0, -5).map((_, i) => sys.slice(i, i + 6).join(" ")));
  const out = words(paragraphs.join(" "));
  for (let i = 0; i + 6 <= out.length; i++) {
    if (shingles.has(out.slice(i, i + 6).join(" "))) {
      return { ok: false, failures: ["Repeats the system instructions"] };
    }
  }
  return { ok: true, failures: [] };
}

// Masks personal identifiers before any text leaves the server. In product use the approved text has none,
// so this is a backstop; it matters for free-text audit probes.
// Addresses VEYZL GDPR Art. 5 / HIPAA findings: output PII redaction (names aside, which need human review).
export function redactPII(text: string): string {
  return text
    .replace(/[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}/gi, "[email removed]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[number removed]")
    .replace(/\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, "[date removed]")
    .replace(/\b\d{6,}\b/g, "[number removed]");
}

export function checkClinicalSafety(source: string[], englishText: string[] | null): GuardrailResult {
  if (!englishText) {
    return { ok: false, failures: ["Couldn't verify the meaning (no English back-translation available)"] };
  }
  const text = englishText.join("\n");
  const failures = CLINICAL_RED_FLAGS.filter(({ re }) => re.test(text)).map(({ reason }) => reason);
  // If the approved text tells families to follow their care team, the rewrite must keep that.
  if (CLINICIAN_REFERENCE.test(source.join("\n")) && !CLINICIAN_REFERENCE.test(text)) {
    failures.push("Dropped the instruction to follow the care team");
  }
  return { ok: failures.length === 0, failures };
}
