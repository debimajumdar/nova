import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ReadinessStatus } from "@/lib/format";

const STATUS_STYLES: Record<ReadinessStatus, { pill: string; fill: string }> = {
  ready: { pill: "bg-ready-soft text-ready-ink", fill: "bg-ready-fill" },
  on_track: { pill: "bg-track-soft text-track-ink", fill: "bg-track-fill" },
  attention: { pill: "bg-attention-soft text-attention-ink", fill: "bg-attention-fill" },
  not_started: { pill: "bg-idle-soft text-idle-ink", fill: "bg-idle-ink" },
};

export function StatusPill({ status, className }: { status: ReadinessStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
        STATUS_STYLES[status].pill,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_STYLES[status].fill)} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ReadinessBar({ pct, status, label }: { pct: number; status: ReadinessStatus; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-28 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", STATUS_STYLES[status].fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-right text-sm tabular-nums">{pct}%</span>
    </div>
  );
}

export function ReadinessRing({ pct, size = 112 }: { pct: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label="Overall readiness"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{pct}%</span>
        <span className="text-xs text-muted-foreground">ready</span>
      </div>
    </div>
  );
}

export function PrototypeBadge() {
  return (
    <span className="rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground">
      Prototype · synthetic data only
    </span>
  );
}
