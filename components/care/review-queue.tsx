"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGES, READING_LEVELS } from "@/lib/explain-options";
import { APPROVED_TEXT } from "@/lib/pathway-content";
import { supabase } from "@/lib/supabase";
import type { AiRewrite, Patient } from "@/lib/types";
import { useRealtime } from "@/lib/use-realtime";

const STEP_TITLES: Record<string, string> = {
  "understand-mri": "Understand the MRI",
  "prep-instructions": "Food and arrival instructions",
};

// Human oversight for AI content: nothing the model writes reaches a family until someone here approves it.
export function ReviewQueue({ patients }: { patients: Patient[] }) {
  const [items, setItems] = useState<AiRewrite[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("ai_rewrites")
      .select("*")
      .in("status", ["pending", "blocked"])
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) setError(error.message);
    else setItems(data as AiRewrite[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    load();
  }, [load]);
  useRealtime("review-queue", ["ai_rewrites"], load);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    if (!res.ok) setError((await res.json()).error ?? "Couldn't save the review");
    load();
  };

  const pending = items.filter((i) => i.status === "pending");
  const blocked = items.filter((i) => i.status === "blocked");

  return (
    <section aria-labelledby="review-heading" className="mt-10">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <h2 id="review-heading" className="text-lg font-bold">
          AI content review
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">{pending.length}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Families only see AI-rewritten instructions after they&apos;re approved here. Drafts that fail automatic
        safety checks are blocked and never shown.
      </p>

      {error && <p className="mt-3 text-sm text-attention-ink">{error}</p>}
      {pending.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed p-6 text-center text-muted-foreground">
          Nothing waiting for review.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {pending.map((item) => (
          <ReviewCard key={item.id} item={item} patients={patients} onDecide={decide} />
        ))}
      </div>

      {blocked.length > 0 && (
        <details className="mt-6 rounded-2xl border bg-card p-4">
          <summary className="cursor-pointer font-bold">
            Blocked by safety checks ({blocked.length})
          </summary>
          <ul className="mt-3 space-y-2 text-sm">
            {blocked.map((b) => (
              <li key={b.id} className="rounded-lg bg-attention-soft px-3 py-2 text-attention-ink">
                {STEP_TITLES[b.step_key]} · {label(LANGUAGES, b.language)}: {b.guardrail_failures.join("; ")}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function ReviewCard(props: {
  item: AiRewrite;
  patients: Patient[];
  onDecide: (id: string, decision: "approved" | "rejected") => Promise<void>;
}) {
  const { item } = props;
  const [busy, setBusy] = useState(false);
  const requester = props.patients.find((p) => p.id === item.requested_by_patient);
  const source = APPROVED_TEXT[item.step_key as keyof typeof APPROVED_TEXT] ?? [];

  const decide = async (d: "approved" | "rejected") => {
    setBusy(true);
    await props.onDecide(item.id, d);
    setBusy(false);
  };

  return (
    <article className="rounded-2xl border bg-card p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-bold">
          {STEP_TITLES[item.step_key]} · {label(LANGUAGES, item.language)} · {label(READING_LEVELS, item.reading_level)}
        </h3>
        <span className="text-xs text-muted-foreground">
          {requester ? `Requested by ${requester.guardian_name} (${requester.display_name})` : "Requested"} ·{" "}
          {new Date(item.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {item.model}
        </span>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Approved source (English)</h4>
          <div className="mt-2 space-y-2 text-sm leading-relaxed">
            {source.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI draft</h4>
          <div className="mt-2 space-y-2 rounded-lg bg-muted p-3 text-sm leading-relaxed" lang={item.language}>
            {(item.paragraphs ?? []).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      {item.omitted_or_uncertain.length > 0 && (
        <div className="mt-4 flex gap-2 rounded-lg bg-attention-soft p-3 text-sm text-attention-ink">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-bold">The model flagged these as hard to express faithfully:</p>
            <ul className="mt-1 list-disc pl-5">
              {item.omitted_or_uncertain.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-ready-ink">
        <Check className="size-3.5" /> Passed automatic checks: no invented numbers, links, or contact details.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => decide("approved")}>
          <Check /> Approve for families
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => decide("rejected")}>
          <X /> Reject
        </Button>
      </div>
    </article>
  );
}

function label(options: readonly { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}
