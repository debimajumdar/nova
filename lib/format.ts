import type { BarrierKind } from "./types";

export const BARRIER_LABELS: Record<BarrierKind, string> = {
  interpreter: "Needs interpreter",
  transportation: "Transportation",
  cost: "Cost concern",
  anxiety: "Child anxiety",
  scheduling: "Scheduling conflict",
  other: "Other",
};

export function daysUntil(iso: string, now = new Date()): number {
  const ms = new Date(iso).getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function relativeVisit(iso: string): string {
  const d = daysUntil(iso);
  if (d <= 0) return "Today";
  if (d === 1) return "Tomorrow";
  return `In ${d} days`;
}

export function visitDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export type ReadinessStatus = "not_started" | "ready" | "on_track" | "attention";

// Plain rules a clinician can audit: a scan within 48h below 70%, or any open barrier, needs attention.
export function readinessStatus(opts: {
  assigned: boolean;
  pct: number;
  openBarriers: number;
  scheduledAt: string;
}): ReadinessStatus {
  if (!opts.assigned) return "not_started";
  if (opts.openBarriers > 0) return "attention";
  if (daysUntil(opts.scheduledAt) <= 2 && opts.pct < 70) return "attention";
  if (opts.pct >= 85) return "ready";
  return "on_track";
}

export const STATUS_LABELS: Record<ReadinessStatus, string> = {
  not_started: "No plan yet",
  ready: "Ready",
  on_track: "On track",
  attention: "Needs attention",
};
