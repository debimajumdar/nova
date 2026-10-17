"use client";

import { useState } from "react";
import { Languages, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LANGUAGES,
  READING_LEVELS,
  type ExplainableStep,
  type LanguageValue,
  type ReadingLevelValue,
} from "@/lib/explain-options";

type Explanation = {
  paragraphs: string[];
  omitted_or_uncertain: string[];
  source: { label: string; url: string };
};

// Lets a parent re-read approved content at their reading level and in their language.
export function Explainer({ step, defaultLevel }: { step: ExplainableStep; defaultLevel: ReadingLevelValue }) {
  const [level, setLevel] = useState<ReadingLevelValue>(defaultLevel);
  const [language, setLanguage] = useState<LanguageValue>("en");
  const [result, setResult] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, readingLevel: level, language }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong");
      setResult(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

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
        <Button className="h-11 px-4 text-base" onClick={run} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} {loading ? "Rewriting…" : "Rewrite"}
        </Button>
      </div>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-attention-ink">{error}</p>}
        {result && (
          <div className="mt-4 space-y-3 rounded-xl bg-muted p-4" lang={language}>
            {result.paragraphs.map((p) => (
              <p key={p} className="leading-relaxed">
                {p}
              </p>
            ))}
            <p className="text-xs text-muted-foreground" lang="en">
              AI-rewritten from the approved text above ({result.source.label}). If anything here differs, the
              original and your care team&apos;s instructions are correct.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
