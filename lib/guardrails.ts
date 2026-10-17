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
