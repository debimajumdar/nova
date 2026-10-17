import Link from "next/link";
import { ArrowRight, HeartPulse, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PrototypeBadge } from "@/components/readiness";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-8 sm:py-16">
      <header className="flex items-center justify-between gap-4">
        <span className="text-lg font-bold tracking-tight">NOVA</span>
        <PrototypeBadge />
      </header>

      <section className="mt-16 max-w-2xl sm:mt-24">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">Procedure readiness</p>
        <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
          Every child walks in ready.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          NOVA helps kids and families prepare for medical procedures, in their language and at their pace. PULSE
          shows the care team who is ready, who is stuck, and why, before the appointment, not after it fails.
        </p>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <EntryCard
          href="/family/maya-demo"
          icon={<Sparkles className="size-5" />}
          eyebrow="NOVA · for families"
          title="Maya's MRI prep"
          body="A 6-year-old and her parent get ready for a brain MRI."
        />
        <EntryCard
          href="/care"
          icon={<HeartPulse className="size-5" />}
          eyebrow="PULSE · for care teams"
          title="Readiness dashboard"
          body="See every upcoming scan, readiness, and barriers to resolve."
        />
      </section>

      <p className="mt-auto pt-16 text-sm text-muted-foreground">
        Educational prototype built at DubHacks 2026. Not medical advice. All patients shown are fictional.
      </p>
    </main>
  );
}

function EntryCard(props: { href: string; icon: React.ReactNode; eyebrow: string; title: string; body: string }) {
  return (
    <Link
      href={props.href}
      className="group rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex items-center gap-2 text-sm text-primary">
        {props.icon}
        <span className="font-bold">{props.eyebrow}</span>
      </div>
      <h2 className="mt-4 text-xl font-bold">{props.title}</h2>
      <p className="mt-1 text-muted-foreground">{props.body}</p>
      <span className={cn(buttonVariants({ variant: "ghost" }), "mt-4 -ml-2.5 text-primary")}>
        Open <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
