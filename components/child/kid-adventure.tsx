"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Ear, PersonStanding, ScanLine, Star, Trophy, X } from "lucide-react";
import type { PathwayStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const BUDDIES = [
  { emoji: "🐻", name: "Bear" },
  { emoji: "🐰", name: "Bunny" },
  { emoji: "🦊", name: "Fox" },
  { emoji: "🐢", name: "Turtle" },
  { emoji: "🦄", name: "Unicorn" },
];

const TILE_STYLE: Record<string, { icon: React.ReactNode; tile: string; badge: string }> = {
  "meet-scanner": { icon: <ScanLine />, tile: "bg-track-soft", badge: "bg-track-fill" },
  "sound-practice": { icon: <Ear />, tile: "bg-attention-soft", badge: "bg-attention-fill" },
  "stillness-practice": { icon: <PersonStanding />, tile: "bg-ready-soft", badge: "bg-ready-fill" },
};

type Props = {
  token: string;
  name: string;
  steps: PathwayStep[];
  done: Set<string>;
  openKey: string | null;
  onOpen: (key: string | null) => void;
  renderActivity: (step: PathwayStep, onComplete: () => void) => React.ReactNode;
  onComplete: (step: PathwayStep) => Promise<void>;
};

// The child's side of the pathway as a short adventure: three activities, a star for each, and a buddy.
export function KidAdventure(props: Props) {
  const buddyKey = `nova.buddy.${props.token}`;
  const [buddy, setBuddy] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<string | null>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read saved buddy after mount
      setBuddy(localStorage.getItem(buddyKey));
    } catch {}
  }, [buddyKey]);
  // Hide the celebration after a moment.
  useEffect(() => {
    if (!celebrating) return;
    const id = setTimeout(() => setCelebrating(null), 2600);
    return () => clearTimeout(id);
  }, [celebrating]);

  const pickBuddy = (emoji: string) => {
    setBuddy(emoji);
    try {
      localStorage.setItem(buddyKey, emoji);
    } catch {}
  };

  const complete = async (step: PathwayStep) => {
    await props.onComplete(step);
    setCelebrating(step.title);
  };

  const stars = props.steps.filter((s) => props.done.has(s.key)).length;
  const allDone = stars === props.steps.length;
  const nextKey = props.steps.find((s) => !props.done.has(s.key))?.key;
  const openStep = props.steps.find((s) => s.key === props.openKey);

  return (
    <section aria-labelledby="kid-heading" className="relative mt-8 overflow-hidden rounded-3xl bg-accent/70 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="kid-heading" className="text-2xl font-bold text-accent-foreground">
            {props.name}&apos;s MRI adventure {buddy && <span aria-hidden>{buddy}</span>}
          </h2>
          <p className="mt-1 text-accent-foreground/80">Three short activities. Earn a star for each one!</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-card px-3 py-1.5" aria-label={`${stars} of ${props.steps.length} stars`}>
          {props.steps.map((s, i) => (
            <motion.span key={s.key} animate={i < stars ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.5 }}>
              <Star className={cn("size-6", i < stars ? "fill-attention-fill text-attention-fill" : "text-border")} />
            </motion.span>
          ))}
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-bold text-accent-foreground">
          {buddy ? "Your buddy is coming with you!" : "Pick a buddy to bring along"}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {BUDDIES.map((b) => (
            <motion.button
              key={b.emoji}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => pickBuddy(b.emoji)}
              aria-pressed={buddy === b.emoji}
              aria-label={b.name}
              className={cn(
                "flex size-12 items-center justify-center rounded-2xl border-2 bg-card text-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                buddy === b.emoji ? "border-primary" : "border-transparent",
              )}
            >
              <span aria-hidden>{b.emoji}</span>
            </motion.button>
          ))}
        </div>
      </fieldset>

      <ol className="relative mt-6 grid gap-3 sm:grid-cols-3">
        {/* path connecting the tiles */}
        <span aria-hidden className="absolute top-1/2 right-[16%] left-[16%] hidden border-t-4 border-dotted border-card sm:block" />
        {props.steps.map((step, i) => {
          const style = TILE_STYLE[step.key];
          const isDone = props.done.has(step.key);
          const isNext = step.key === nextKey;
          const isOpen = step.key === props.openKey;
          return (
            <li key={step.key} className="relative">
              <motion.button
                onClick={() => props.onOpen(isOpen ? null : step.key)}
                aria-expanded={isOpen}
                aria-controls="kid-activity"
                animate={isNext && !isOpen ? { y: [0, -6, 0] } : { y: 0 }}
                transition={isNext && !isOpen ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : {}}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "flex w-full flex-col items-center gap-3 rounded-3xl border-4 bg-card p-5 text-center focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isOpen ? "border-primary" : "border-transparent",
                )}
              >
                <span className={cn("relative flex size-20 items-center justify-center rounded-full [&_svg]:size-9", style.tile)}>
                  {style.icon}
                  {isDone && (
                    <span className={cn("absolute -top-1 -right-1 flex size-8 items-center justify-center rounded-full text-white", style.badge)}>
                      <Star className="size-4 fill-white" />
                    </span>
                  )}
                </span>
                <span className="text-xs font-bold text-muted-foreground">Activity {i + 1}</span>
                <span className="text-lg leading-tight font-bold">{step.title}</span>
                <span className="sr-only">{isDone ? "Done" : "Not done yet"}</span>
                {isDone && (
                  <span className="flex items-center gap-1 text-sm font-bold text-ready-ink">
                    <Check className="size-4" /> Done!
                  </span>
                )}
              </motion.button>
            </li>
          );
        })}
      </ol>

      <AnimatePresence>
        {allDone && !props.openKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-5 flex items-center gap-3 rounded-2xl bg-card p-4"
          >
            <Trophy className="size-8 text-attention-fill" />
            <p className="text-lg font-bold">
              All three stars! You&apos;re MRI ready{buddy ? `, and so is your buddy ${buddy}` : ""}!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {openStep && (
          <motion.div
            key={openStep.key}
            id="kid-activity"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="relative mt-5 rounded-3xl bg-card p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold">{openStep.title}</h3>
              <button
                onClick={() => props.onOpen(null)}
                aria-label="Close activity"
                className="flex size-10 items-center justify-center rounded-full hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <X className="size-5" />
              </button>
            </div>
            {props.renderActivity(openStep, () => complete(openStep))}
          </motion.div>
        )}
      </AnimatePresence>

      <Celebration title={celebrating} buddy={buddy} />
    </section>
  );
}

const BURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  return { x: Math.cos(angle) * 140, y: Math.sin(angle) * 110, delay: (i % 3) * 0.05 };
});

function Celebration({ title, buddy }: { title: string | null; buddy: string | null }) {
  return (
    <AnimatePresence>
      {title && (
        <motion.div
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          {BURST.map((p, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute"
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
              animate={{ x: p.x, y: p.y, scale: 1, opacity: 0 }}
              transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
            >
              <Star className="size-7 fill-attention-fill text-attention-fill" />
            </motion.span>
          ))}
          <motion.div
            initial={{ scale: 0.6, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="rounded-3xl bg-card px-6 py-4 text-center shadow-xl"
          >
            <p className="text-3xl" aria-hidden>
              {buddy ?? "⭐"}
            </p>
            <p className="mt-1 text-xl font-bold">You earned a star!</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
