import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ClipboardList,
  Eye,
  Globe,
  HandHeart,
  HeartPulse,
  Languages,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ScannerArt } from "@/components/child/scanner-art";
import { HeroPreview } from "@/components/landing/hero-preview";
import { Reveal } from "@/components/landing/reveal";
import { PrototypeBadge } from "@/components/readiness";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div
      className="flex flex-1 flex-col"
      style={{
        // Soft teal wash behind the hero only.
        backgroundImage: "radial-gradient(ellipse 70% 100% at 75% 0%, oklch(0.9 0.05 195 / 0.6), transparent 70%)",
        backgroundSize: "100% 900px",
        backgroundRepeat: "no-repeat",
      }}
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span aria-hidden className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          NOVA
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm sm:gap-4">
          <a href="#how" className="hidden rounded px-2 py-1 text-muted-foreground hover:text-foreground sm:inline">
            How it works
          </a>
          <a href="#safety" className="hidden rounded px-2 py-1 text-muted-foreground hover:text-foreground sm:inline">
            Safety
          </a>
          <PrototypeBadge />
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pt-8 pb-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">Procedure readiness for kids</p>
            <h1 className="mt-4 text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
              Every child walks in&nbsp;ready.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              NOVA helps children and families prepare for medical procedures, in their language and at their pace.
              PULSE shows the care team who&apos;s ready, who&apos;s stuck, and why, before the appointment rather
              than after it fails.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/family/maya-demo" className={cn(buttonVariants(), "h-12 rounded-xl px-5 text-base")}>
                Try Maya&apos;s MRI prep <ArrowRight />
              </Link>
              <Link href="/care" className={cn(buttonVariants({ variant: "outline" }), "h-12 rounded-xl px-5 text-base")}>
                <HeartPulse /> Open the care dashboard
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              First pathway: pediatric MRI · 5 languages · built for accessibility from day one
            </p>
          </div>
          <Reveal delay={0.15}>
            <HeroPreview />
          </Reveal>
        </section>

        {/* Problem */}
        <section className="border-y bg-card">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-8 md:grid-cols-3">
            <Reveal>
              <Problem
                title="Kids get scared"
                body="An MRI is loud, enclosed, and asks a child to stay perfectly still. Without practice, many can't."
              />
            </Reveal>
            <Reveal delay={0.1}>
              <Problem
                title="Instructions get lost"
                body="Fasting rules, metal checks, and arrival times arrive as dense English paperwork, if they arrive at all."
              />
            </Reveal>
            <Reveal delay={0.2}>
              <Problem
                title="Care teams find out too late"
                body="An interpreter gap or a missing ride often surfaces on scan day, when the slot is already lost."
              />
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-20 sm:px-8">
          <Reveal>
            <SectionHeading eyebrow="How it works" title="One loop between the family and the care team" />
          </Reveal>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            <Step
              n={1}
              icon={<ClipboardList />}
              title="The care team assigns a prep plan"
              body="One click in PULSE sends the family a link to an MRI Ready pathway. No app download, no login."
            />
            <Step
              n={2}
              icon={<Sparkles />}
              title="Child and family get ready together"
              body="A friendly scanner tour, sound practice at volumes the child controls, a statue game, and plain-language instructions."
            />
            <Step
              n={3}
              icon={<HeartPulse />}
              title="Readiness updates live"
              body="Every completed step and every reported barrier shows up in PULSE instantly, so staff can step in early."
            />
          </ol>

          <Reveal>
            <div className="mt-14 grid items-center gap-10 rounded-3xl bg-accent/60 p-6 sm:p-10 lg:grid-cols-2">
              <div className="flex justify-center rounded-2xl bg-card p-6">
                <ScannerArt bedIn />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Built for a six-year-old</h3>
                <ul className="mt-5 space-y-4">
                  <Feature icon={<Volume2 />} title="Hear it before the day">
                    Knocks, buzzes, and beeps unlock from a whisper up to loud. A big Stop button is always there.
                  </Feature>
                  <Feature icon={<Camera />} title="Practice being a statue">
                    A 20-second stillness game with an optional wiggle meter that runs entirely on the device.
                  </Feature>
                  <Feature icon={<HandHeart />} title="Tell us what's hard">
                    One tap flags an interpreter need, transport, cost, or a worried child to the care team.
                  </Feature>
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Safety */}
        <section id="safety" className="border-t bg-card">
          <div className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-20 sm:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Safe by design"
                title="AI helps with language. People stay in charge."
                body="Families can read instructions in Spanish, Chinese, Vietnamese, or Somali at their reading level. Every AI version is checked by software and approved by a clinician before a family sees it."
              />
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Trust icon={<BadgeCheck />} title="Clinician approval">
                Drafts wait in PULSE next to the approved source, with an English back-translation for reviewers.
              </Trust>
              <Trust icon={<ShieldCheck />} title="Automatic guardrails">
                Drafts with invented numbers, doses, diagnoses, links, or a dropped &ldquo;ask your care team&rdquo;
                are blocked.
              </Trust>
              <Trust icon={<LockKeyhole />} title="No patient data to AI">
                The model only ever sees approved education text. Requests aren&apos;t linked to a patient.
              </Trust>
              <Trust icon={<Eye />} title="Accessible by default">
                High-legibility type, text sizing, high contrast, reduced motion, and read-aloud for pre-readers.
              </Trust>
            </div>
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Languages className="size-4" /> Readiness scores are simple arithmetic, never AI, so staff can see
              exactly why a family needs help.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold">See both sides of the loop</h2>
              <p className="mt-2 opacity-85">
                Open them side by side, assign Maya&apos;s plan, and watch readiness update live.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/family/maya-demo"
                className={cn(buttonVariants({ variant: "secondary" }), "h-12 rounded-xl px-5 text-base")}
              >
                Family view <ArrowRight />
              </Link>
              <Link
                href="/care"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-12 rounded-xl border-primary-foreground/40 bg-transparent px-5 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
                )}
              >
                Care dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Educational prototype built at DubHacks 2026. Not medical advice. All patients shown are fictional.</p>
          <a
            href="https://github.com/debimajumdar/nova"
            className="flex items-center gap-1.5 hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            <Globe className="size-4" /> Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{body}</p>}
    </div>
  );
}

function Problem({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Step(props: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground [&_svg]:size-5">
          {props.icon}
        </span>
        <span className="text-sm font-bold text-muted-foreground">Step {props.n}</span>
      </div>
      <h3 className="mt-5 text-lg font-bold">{props.title}</h3>
      <p className="mt-2 leading-relaxed text-muted-foreground">{props.body}</p>
    </li>
  );
}

function Feature(props: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary [&_svg]:size-5">
        {props.icon}
      </span>
      <div>
        <p className="font-bold">{props.title}</p>
        <p className="mt-1 leading-relaxed text-muted-foreground">{props.children}</p>
      </div>
    </li>
  );
}

function Trust(props: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-background p-6">
      <span className="text-primary [&_svg]:size-6">{props.icon}</span>
      <h3 className="mt-4 font-bold">{props.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{props.children}</p>
    </div>
  );
}
