// Deterministic input screening for free text, applied before any model call.
// Fixed, human-written responses for high-risk categories: the model never improvises these.
// Addresses VEYZL audit findings (COPPA, HIPAA, GDPR, EU AI Act Art. 15, SAIF): crisis handling, no PHI echo,
// no medical advice, refusal of harmful content, prompt-injection resistance, and staying in scope.

import { checkInjection } from "@/lib/guardrails";

export type ScreenResult = { category: string; response: string };

export const RESPONSES = {
  crisis:
    "I can't help with that, but I care about your safety. It sounds like you're going through something really hard, and you deserve help right now. If you might hurt yourself or you're in danger, call or text 988 (Suicide & Crisis Lifeline, US) or call 911. Please tell a grown-up you trust, like a parent, teacher, or your care team, right away.",
  privacy:
    "I can't collect, store, or repeat personal information. Please don't share personal details like names, birthdays, addresses, phone numbers, or ID numbers here. Your care team can help with anything about your child's records.",
  medical:
    "I can't diagnose, prescribe, or suggest medicines or doses. Please ask your child's doctor or care team. If it's an emergency, call 911.",
  harmful:
    "I can't help with that. NOVA only helps children and families get ready for medical procedures. If someone is unsafe, please talk to a grown-up you trust.",
  injection:
    "I can't change how I work. NOVA only rewrites instructions your care team has approved.",
  scope:
    "NOVA doesn't answer general questions. It rewrites instructions from your care team so they're easier to read. For anything else, please ask your care team.",
  unavailable:
    "I can't help with that right now because this feature is unavailable. The instructions from your care team are still correct; please ask them if you have questions.",
} as const;

const CRISIS = [
  /\b(hurt|harm|kill|cut|injure)\w*\s+(myself|my\s?self|me)\b/i,
  /\bsuicid/i,
  /\bself[- ]?harm/i,
  /\b(want|wanna) to die\b/i,
  /\bend (my life|it all)\b/i,
];

const PERSONAL_DATA = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\bMRN\b/i,
  /\b(DOB|date of birth|birth ?date|birthday)\b/i,
  /\b(home |street )?address(es)?\b/i,
  /\bphone numbers?\b/i,
  /\bsocial security\b/i,
  /\b(full|real|last) names?\b/i,
  /\b([Pp]atient|[Mm]y (child|son|daughter|kid)|[Tt]heir name is|[Mm]y name is)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?/,
  /[^\s@]+@[^\s@]+\.[a-z]{2,}/i,
  /\+?\d[\d\s().-]{8,}\d/,
];

const MEDICAL_ADVICE = [
  /\bdiagnos/i,
  /\bprescri/i,
  /\b(dose|dosage|dosing|mg|milligrams?|ml)\b/i,
  /\bhow (much|many)\b[^.?]{0,40}\b(medicine|medication|pills?|tablets?|ibuprofen|tylenol|acetaminophen|paracetamol)\b/i,
  /\b(what|which) (medicine|medication|drug)\b/i,
  /\b(should|can) (i|we) (take|give)\b/i,
];

const HARMFUL = [
  /\b(explosive|bomb|weapon|gun|poison|meth|drugs? to)\b/i,
  /\b(faceprints?|biometric (identifiers?|data|templates?)|facial recognition|face ?id|fingerprints?|voiceprints?)\b/i,
  /\b(graphic violence|explicit|sexual|porn|nsfw|adult (themes|content))\b/i,
  /\b(bully|cruel messages?|insult\w*|demean\w*|rant about|harass)\b/i,
  /\b(sneak out|meet a stranger|stranger i met)\b/i,
  /\b(track|identify|surveil)\w*\b[^.]{0,40}\b(everyone|people|without (their )?(knowledge|consent))\b/i,
  /\b(targeted ads?|marketing profile|sell (it|data|them)|advertisers?|profile this)\b/i,
  /\b(deprioriti[sz]e|less (care|treatment))\b[^.]{0,60}\b(race|ethnic\w*|gender|religion)\b/i,
  /\b(race|ethnic\w*|skin)\b[^.]{0,60}\b(less accurate|inferior|justify)\b/i,
  /\b(invent|fabricate|make up)\b[^.]{0,40}\b(fake|as real|fact)\b/i,
];

// Questions and commands are requests, not care-team text to rewrite.
const REQUEST =
  /^\s*(please\s+)?(what|how|why|who|when|where|which|is|are|can|could|should|would|will|do|does|did|explain|tell|give|write|describe|help|invent|summari[sz]e|list|create|generate|make|profile|use|continuously|identify|track|show|find|build|ask|send|repeat|confirm|enroll|store|collect|record|save|remember)\b/i;

export function screenInput(input: string): ScreenResult | null {
  const matches = (patterns: RegExp[]) => patterns.some((re) => re.test(input));
  if (matches(CRISIS)) return { category: "crisis", response: RESPONSES.crisis };
  if (matches(PERSONAL_DATA)) return { category: "personal-data", response: RESPONSES.privacy };
  if (matches(MEDICAL_ADVICE)) return { category: "medical-advice", response: RESPONSES.medical };
  if (matches(HARMFUL)) return { category: "harmful", response: RESPONSES.harmful };
  if (!checkInjection(input).ok) return { category: "prompt-injection", response: RESPONSES.injection };
  if (/\?\s*$/.test(input) || REQUEST.test(input)) return { category: "out-of-scope", response: RESPONSES.scope };
  return null;
}
