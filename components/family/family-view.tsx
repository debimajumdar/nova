"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Check, ChevronDown, Clock, HandHeart } from "lucide-react";
import { A11yPanel } from "@/components/a11y-panel";
import { ReadinessRing } from "@/components/readiness";
import { Button } from "@/components/ui/button";
import { StepContent } from "@/components/family/step-content";
import { KidAdventure } from "@/components/child/kid-adventure";
import { BARRIER_LABELS, relativeVisit, visitDate } from "@/lib/format";
import { loadFamily, pctFromProgress, reportBarrier, setStepDone } from "@/lib/queries";
import type { BarrierKind, PathwayStep } from "@/lib/types";
import { useRealtime } from "@/lib/use-realtime";
import { cn } from "@/lib/utils";

type Family = NonNullable<Awaited<ReturnType<typeof loadFamily>>>;

const REPORTABLE: BarrierKind[] = ["interpreter", "transportation", "cost", "anxiety", "scheduling"];

export function FamilyView({ token }: { token: string }) {
  const [family, setFamily] = useState<Family | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setFamily(await loadFamily(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    refresh();
  }, [refresh]);

  // The care team assigning a plan, or resolving a barrier, shows up here without a reload.
  useRealtime(`family-${token}`, ["assignments", "step_progress", "barriers"], refresh);

  const done = useMemo(() => new Set(family?.progress.map((p) => p.step_key) ?? []), [family]);
  const pct = family ? pctFromProgress(family.steps, done) : 0;

  if (error) return <Shell><p role="alert">Couldn&apos;t load: {error}</p></Shell>;
  if (family === undefined) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  if (family === null) return <Shell><p>We couldn&apos;t find this link. Please check with your care team.</p></Shell>;

  const { patient, assignment } = family;
  const child = patient.display_name.split(" ")[0];

  if (!assignment) {
    return (
      <Shell>
        <div className="rounded-3xl border bg-card p-8 text-center">
          <Clock className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Hi {patient.guardian_name.split(" ")[0]}!</h1>
          <p className="mt-2 text-muted-foreground">
            {child}&apos;s care team hasn&apos;t shared a prep plan yet. This page will update by itself when they do.
          </p>
        </div>
      </Shell>
    );
  }

  const reportFromStep = async (kind: BarrierKind, note: string) => {
    await reportBarrier(patient.id, kind, note, "app");
    refresh();
  };

  const toggle = async (step: PathwayStep, value: boolean) => {
    await setStepDone(assignment.id, step.key, value);
    if (value) setOpen(null);
    refresh();
  };

  return (
    <Shell>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center sm:p-8"
      >
        <ReadinessRing pct={pct} />
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-primary">Getting ready</p>
          <h1 className="mt-1 text-3xl font-bold">
            {child}&apos;s {patient.procedure}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4" /> {visitDate(patient.scheduled_at)} · {relativeVisit(patient.scheduled_at)}
          </p>
        </div>
      </motion.section>

      <KidAdventure
        token={token}
        name={child}
        steps={family.steps.filter((s) => s.audience === "child")}
        done={done}
        openKey={family.steps.some((s) => s.key === open && s.audience === "child") ? open : null}
        onOpen={setOpen}
        onComplete={(step) => toggle(step, true)}
        renderActivity={(step, onComplete) => (
          <StepContent
            step={step}
            patient={patient}
            done={done.has(step.key)}
            onComplete={onComplete}
            onUndo={() => toggle(step, false)}
            onReportBarrier={reportFromStep}
          />
        )}
      />

      <section className="mt-10" aria-labelledby="parent-heading">
        <h2 id="parent-heading" className="text-xl font-bold">
          For you
        </h2>
        <p className="text-muted-foreground">A few things to do before the visit.</p>
        <ol className="mt-4 space-y-3">
          {family.steps
            .filter((s) => s.audience === "parent")
            .map((step) => (
              <StepCard
                key={step.key}
                step={step}
                done={done.has(step.key)}
                open={open === step.key}
                onOpen={() => setOpen((k) => (k === step.key ? null : step.key))}
              >
                <StepContent
                  step={step}
                  patient={patient}
                  done={done.has(step.key)}
                  onComplete={() => toggle(step, true)}
                  onUndo={() => toggle(step, false)}
                  onReportBarrier={reportFromStep}
                />
              </StepCard>
            ))}
        </ol>
      </section>

      <BarrierSection
        reported={new Set(family.barriers.map((b) => b.kind))}
        onReport={async (kind) => {
          await reportBarrier(patient.id, kind, null, "app");
          refresh();
        }}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          NOVA
        </Link>
        <A11yPanel />
      </header>
      {children}
      <p className="mt-12 text-sm text-muted-foreground">
        General information to help you prepare. Always follow your care team&apos;s instructions. Prototype with
        fictional patients.
      </p>
    </main>
  );
}

function StepCard(props: { step: PathwayStep; done: boolean; open: boolean; onOpen: () => void; children: React.ReactNode }) {
  const id = `step-${props.step.key}`;
  return (
    <li className={cn("rounded-2xl border bg-card transition-colors", props.open && "border-primary/40")}>
      <button
        onClick={props.onOpen}
        aria-expanded={props.open}
        aria-controls={id}
        className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-5 py-4 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
            props.done ? "border-transparent bg-ready-fill text-white" : "border-border",
          )}
        >
          {props.done && <Check className="size-4" />}
          <span className="sr-only">{props.done ? "Done" : "Not done yet"}</span>
        </span>
        <span className="flex-1 text-lg font-bold">{props.step.title}</span>
        <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", props.open && "rotate-180")} />
      </button>
      {props.open && (
        <div id={id} className="border-t px-5 py-5">
          {props.children}
        </div>
      )}
    </li>
  );
}

function BarrierSection({ reported, onReport }: { reported: Set<BarrierKind>; onReport: (k: BarrierKind) => void }) {
  return (
    <section className="mt-10 rounded-3xl bg-accent p-6" aria-labelledby="help-heading">
      <h2 id="help-heading" className="flex items-center gap-2 text-xl font-bold text-accent-foreground">
        <HandHeart className="size-5" /> Is anything making this harder?
      </h2>
      <p className="mt-1 text-accent-foreground/80">Tap anything that applies. Your care team will see it and reach out.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {REPORTABLE.map((kind) => {
          const sent = reported.has(kind);
          return (
            <Button
              key={kind}
              variant="outline"
              disabled={sent}
              aria-pressed={sent}
              onClick={() => onReport(kind)}
              className="h-11 bg-card px-4 text-base"
            >
              {sent && <Check />} {BARRIER_LABELS[kind]}
              {sent && <span className="sr-only">, sent to care team</span>}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
