"use client";

import { useState } from "react";
import { Clock, Languages, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LANGUAGES,
  READING_LEVELS,
  type ExplainableStep,
  type ExplainResponse,
  type LanguageValue,
  type ReadingLevelValue,
} from "@/lib/explain-options";
import { useRealtime } from "@/lib/use-realtime";

// Lets a parent re-read approved content at their reading level and in their language.
// AI versions are only shown after a clinician approves them.
export function Explainer(props: { step: ExplainableStep; defaultLevel: ReadingLevelValue }) {
  const [level, setLevel] = useState<ReadingLevelValue>(props.defaultLevel);
  const [language, setLanguage] = useState<LanguageValue>("en");
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [requested, setRequested] = useState<{ level: ReadingLevelValue; language: LanguageValue } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (choice: { level: ReadingLevelValue; language: LanguageValue }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: props.step,
          readingLevel: choice.level,
          language: choice.language,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong");
      setResult(body);
      setRequested(choice);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // When the care team approves the draft we're waiting on, show it without a reload.
  useRealtime(`explainer-${props.step}`, ["ai_rewrites"], () => {
    if (result?.status === "pending" && requested) request(requested);
  });

  const languageLabel = LANGUAGES.find((l) => l.value === requested?.language)?.label;

  return (
    <div className="rounded-2xl border border-dashed p-4">
      <p className="flex items-center gap-2 font-bold">
        <Sparkles className="size-4 text-primary" /> Explain it differently
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-muted-foreground">Reading level</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as ReadingLevelValue)}
            className="mt-1 h-11 rounded-lg border bg-card px-3 text-base"
          >
            {READING_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Languages className="size-3.5" /> Language
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageValue)}
            className="mt-1 h-11 rounded-lg border bg-card px-3 text-base"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <Button className="h-11 px-4 text-base" onClick={() => request({ level, language })} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} {loading ? "Checking…" : "Show me"}
        </Button>
      </div>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-attention-ink">{error}</p>}

        {result?.status === "approved" && (
          <div className="mt-4 space-y-3 rounded-xl bg-muted p-4" lang={requested?.language}>
            {result.paragraphs.map((p) => (
              <p key={p} className="leading-relaxed">
                {p}
              </p>
            ))}
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground" lang="en">
              <ShieldCheck className="mt-px size-3.5 shrink-0 text-ready-ink" />
              AI-rewritten from the approved text above ({result.source.label}) and reviewed by {result.reviewedBy} on{" "}
              {new Date(result.reviewedAt).toLocaleDateString()}. If anything differs, your care team&apos;s
              instructions are correct.
            </p>
          </div>
        )}

        {result?.status === "pending" && (
          <div className="mt-4 flex gap-3 rounded-xl bg-track-soft p-4 text-track-ink">
            <Clock className="mt-0.5 size-5 shrink-0" />
            <p>
              Your care team is checking the {languageLabel} version to make sure it&apos;s accurate. It will appear
              here as soon as they approve it. Until then, the information above is correct.
            </p>
          </div>
        )}

        {result?.status === "blocked" && (
          <p className="mt-4 rounded-xl bg-attention-soft p-4 text-attention-ink">
            We couldn&apos;t make a version we&apos;re confident is accurate. Please ask your care team. They can
            explain it in your language.
          </p>
        )}
      </div>
    </div>
  );
}
