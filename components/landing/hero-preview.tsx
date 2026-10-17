import { Check, Radio } from "lucide-react";
import { ReadinessBar, ReadinessRing, StatusPill } from "@/components/readiness";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Meet the MRI scanner", done: true },
  { title: "Practice the MRI sounds", done: true },
  { title: "Practice staying still", done: false },
  { title: "Complete the metal safety check", done: true },
];

// Static preview of both sides of the product, built from the real UI pieces. Decorative.
export function HeroPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md select-none lg:mx-0">
      <div className="rounded-3xl border bg-card p-5 pb-16 shadow-[0_24px_60px_-30px_oklch(0.3_0.05_200/0.35)]">
        <div className="flex items-center gap-4">
          <ReadinessRing pct={70} size={84} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Getting ready</p>
            <p className="text-lg font-bold">Maya&apos;s Brain MRI</p>
            <p className="text-sm text-muted-foreground">Tuesday · In 3 days</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2">
          {STEPS.map((s) => (
            <li key={s.title} className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border-2",
                  s.done ? "border-transparent bg-ready-fill text-white" : "border-border",
                )}
              >
                {s.done && <Check className="size-3" />}
              </span>
              <span className={cn("font-bold", !s.done && "text-muted-foreground")}>{s.title}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative -mt-10 ml-6 rounded-2xl border bg-card p-4 shadow-[0_20px_50px_-28px_oklch(0.3_0.05_200/0.45)] sm:ml-16">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-bold text-foreground">PULSE · Pediatric Imaging</span>
          <span className="flex items-center gap-1 text-primary">
            <Radio className="size-3" /> Live
          </span>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          <Row name="Maya R." scan="Brain MRI · In 3 days">
            <ReadinessBar pct={70} status="on_track" label="" />
          </Row>
          <Row name="Leo M." scan="Spine MRI · In 2 days">
            <StatusPill status="attention" />
          </Row>
        </div>
        <p className="mt-3 rounded-lg bg-attention-soft px-2.5 py-1.5 text-xs text-attention-ink">
          Leo&apos;s family reported: needs a Spanish interpreter
        </p>
      </div>
    </div>
  );
}

function Row({ name, scan, children }: { name: string; scan: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-bold">{name}</p>
        <p className="text-xs text-muted-foreground">{scan}</p>
      </div>
      {children}
    </div>
  );
}
