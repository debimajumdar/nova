// Shared between the API route and the UI so both accept exactly the same options.

export const EXPLAINABLE_STEPS = ["understand-mri", "prep-instructions"] as const;
export type ExplainableStep = (typeof EXPLAINABLE_STEPS)[number];

export const READING_LEVELS = [
  { value: "simple", label: "Simple" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "zh", label: "中文" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "so", label: "Soomaali" },
] as const;

export type ReadingLevelValue = (typeof READING_LEVELS)[number]["value"];
export type LanguageValue = (typeof LANGUAGES)[number]["value"];

export type ExplainResponse =
  | {
      status: "approved";
      paragraphs: string[];
      reviewedBy: string;
      reviewedAt: string;
      source: { label: string; url: string };
    }
  | { status: "pending" }
  | { status: "blocked" };
