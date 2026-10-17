"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Link2, Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrototypeBadge, ReadinessBar, StatusPill } from "@/components/readiness";
import { ReviewQueue } from "@/components/care/review-queue";
import { BARRIER_LABELS, daysUntil, readinessStatus, relativeVisit, visitDate, type ReadinessStatus } from "@/lib/format";
import { assignPathway, loadCareBoard, resolveBarrier } from "@/lib/queries";
import type { Barrier, PathwayStep, Patient } from "@/lib/types";
import { useRealtime } from "@/lib/use-realtime";
import { cn } from "@/lib/utils";

type Board = Awaited<ReturnType<typeof loadCareBoard>>;

type Row = {
  patient: Patient;
  assignmentId: string | null;
  pct: number;
  status: ReadinessStatus;
  barriers: Barrier[];
  done: Set<string>;
};

const STATUS_ORDER: Record<ReadinessStatus, number> = { attention: 0, not_started: 1, on_track: 2, ready: 3 };

export function CareBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setBoard(await loadCareBoard());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    refresh();
  }, [refresh]);

  useRealtime("care-board", ["assignments", "step_progress", "barriers"], () => {
    refresh();
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  });

  const rows = useMemo<Row[]>(() => {
    if (!board) return [];
    return board.patients
      .map((patient) => {
        const assignment = board.assignments.find((a) => a.patient_id === patient.id);
        const readiness = board.readiness.find((r) => r.patient_id === patient.id);
        const barriers = board.barriers.filter((b) => b.patient_id === patient.id);
        const done = new Set(board.progress.filter((p) => p.assignment_id === assignment?.id).map((p) => p.step_key));
        const pct = readiness?.readiness_pct ?? 0;
        const status = readinessStatus({
          assigned: !!assignment,
          pct,
          openBarriers: barriers.length,
          scheduledAt: patient.scheduled_at,
        });
        return { patient, assignmentId: assignment?.id ?? null, pct, status, barriers, done };
      })
      .sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          a.patient.scheduled_at.localeCompare(b.patient.scheduled_at),
      );
  }, [board]);

  const stats = useMemo(
    () => ({
      next72h: rows.filter((r) => daysUntil(r.patient.scheduled_at) <= 3).length,
      attention: rows.filter((r) => r.status === "attention").length,
      openBarriers: rows.reduce((n, r) => n + r.barriers.length, 0),
      noPlan: rows.filter((r) => r.status === "not_started").length,
    }),
    [rows],
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            PULSE
          </Link>
          <span className="text-muted-foreground">Pediatric Imaging · Readiness</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors",
              flash && "text-primary",
            )}
            aria-live="polite"
          >
            <Radio className="size-3.5" /> {flash ? "Updated just now" : "Live"}
          </span>
          <PrototypeBadge />
        </div>
      </header>

      <section aria-label="Summary" className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Scans in next 3 days" value={stats.next72h} />
        <Stat label="Need attention" value={stats.attention} tone="attention" />
        <Stat label="Open barriers" value={stats.openBarriers} tone="attention" />
        <Stat label="No prep plan yet" value={stats.noPlan} />
      </section>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-attention-soft p-4 text-sm text-attention-ink">
          {error}{" "}
          <button className="underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      )}

      <section aria-label="Patients" className="mt-8 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-normal">Patient</th>
              <th className="px-4 py-3 font-normal">Scan</th>
              <th className="px-4 py-3 font-normal">Readiness</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Barriers</th>
              <th className="px-4 py-3 font-normal">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!board && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <Fragment key={row.patient.id}>
                <PatientRow
                  row={row}
                  expanded={expanded === row.patient.id}
                  onToggle={() => setExpanded((id) => (id === row.patient.id ? null : row.patient.id))}
                  onAssign={async () => {
                    try {
                      await assignPathway(row.patient.id);
                    } catch (e) {
                      setError(`Couldn't assign: ${e instanceof Error ? e.message : String(e)}`);
                    }
                    refresh();
                  }}
                />
                {expanded === row.patient.id && board && (
                  <tr className="border-b bg-muted/40">
                    <td colSpan={6} className="px-4 py-5">
                      <PatientDetail
                        row={row}
                        steps={board.steps}
                        onResolve={async (id) => {
                          try {
                            await resolveBarrier(id);
                          } catch (e) {
                            setError(`Couldn't resolve: ${e instanceof Error ? e.message : String(e)}`);
                          }
                          refresh();
                        }}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </section>

      <p className="mt-4 text-xs text-muted-foreground">
        Readiness = weighted share of completed prep steps. &ldquo;Needs attention&rdquo; = any open barrier, or a scan
        within 2 days under 70% ready.
      </p>

      <ReviewQueue patients={board?.patients ?? []} />
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "attention" }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className={cn("text-3xl font-bold tabular-nums", tone === "attention" && value > 0 && "text-attention-ink")}>
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function PatientRow(props: { row: Row; expanded: boolean; onToggle: () => void; onAssign: () => void }) {
  const { row } = props;
  const [copied, setCopied] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const p = row.patient;

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <button
          onClick={props.onToggle}
          aria-expanded={props.expanded}
          className="flex items-center gap-2 rounded text-left font-bold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", props.expanded && "rotate-180")} />
          <span>
            {p.display_name}
            <span className="block text-xs font-normal text-muted-foreground">
              Age {p.age} · Guardian {p.guardian_name}
              {p.preferred_language !== "en" && ` · ${p.preferred_language.toUpperCase()}`}
            </span>
          </span>
        </button>
      </td>
      <td className="px-4 py-3">
        {p.procedure}
        <span className="block text-xs text-muted-foreground" title={visitDate(p.scheduled_at)}>
          {relativeVisit(p.scheduled_at)}
        </span>
      </td>
      <td className="px-4 py-3">
        {row.assignmentId ? (
          <ReadinessBar pct={row.pct} status={row.status} label={`${p.display_name} readiness`} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusPill status={row.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {row.barriers.length === 0 && <span className="text-muted-foreground">None</span>}
          {row.barriers.map((b) => (
            <span key={b.id} className="rounded-md bg-attention-soft px-2 py-0.5 text-xs text-attention-ink">
              {BARRIER_LABELS[b.kind]}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        {row.assignmentId ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(`${location.origin}/family/${p.family_token}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check /> : <Link2 />} {copied ? "Copied" : "Family link"}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={assigning}
            onClick={async () => {
              setAssigning(true);
              await props.onAssign();
              setAssigning(false);
            }}
          >
            <Plus /> Assign MRI Ready
          </Button>
        )}
      </td>
    </tr>
  );
}

function PatientDetail(props: { row: Row; steps: PathwayStep[]; onResolve: (id: string) => void }) {
  const { row, steps } = props;
  if (!row.assignmentId) {
    return <p className="text-muted-foreground">No prep plan assigned yet.</p>;
  }
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {(["child", "parent"] as const).map((audience) => (
        <div key={audience}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {audience === "child" ? `For ${row.patient.display_name.split(" ")[0]}` : "For guardian"}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {steps
              .filter((s) => s.audience === audience)
              .map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border",
                      row.done.has(s.key) && "border-transparent bg-ready-fill text-white",
                    )}
                  >
                    {row.done.has(s.key) && <Check className="size-3.5" />}
                  </span>
                  <span className={cn(!row.done.has(s.key) && "text-muted-foreground")}>{s.title}</span>
                </li>
              ))}
          </ul>
        </div>
      ))}
      {row.barriers.length > 0 && (
        <div className="md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Open barriers</h3>
          <ul className="mt-2 space-y-2">
            {row.barriers.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
                <span>
                  <span className="font-bold">{BARRIER_LABELS[b.kind]}</span>
                  {b.note && <span className="text-muted-foreground"> — {b.note}</span>}
                  <span className="ml-2 text-xs text-muted-foreground">via {b.reported_via.replace("_", " ")}</span>
                </span>
                <Button variant="outline" size="sm" onClick={() => props.onResolve(b.id)}>
                  <Check /> Mark resolved
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
