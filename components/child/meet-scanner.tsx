"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReadAloud } from "@/components/child/read-aloud";
import { ScannerArt } from "@/components/child/scanner-art";

const CARDS = [
  { text: "This is an MRI. It's a special camera that takes pictures of the inside of your body.", bedIn: false },
  { text: "It looks like a big donut. You lie down on a comfy bed with a pillow.", bedIn: false },
  { text: "The bed slides slowly into the tunnel. The tunnel is open at both ends.", bedIn: true },
  { text: "It doesn't hurt at all! You can't feel the pictures being taken.", bedIn: true },
  { text: "A grown-up can talk to you through a speaker the whole time.", bedIn: true },
];

export function MeetScanner({ name, done, onComplete }: { name: string; done: boolean; onComplete: () => void }) {
  const [i, setI] = useState(0);
  // Tapping the picture slides the bed in or out; moving to another card resets it.
  const [bedOverride, setBedOverride] = useState<boolean | null>(null);
  const card = CARDS[i];
  const bedIn = bedOverride ?? card.bedIn;
  const go = (next: number) => {
    setI(next);
    setBedOverride(null);
  };
  const last = i === CARDS.length - 1;

  return (
    <div className="space-y-5">
      <button
        onClick={() => setBedOverride(!bedIn)}
        className="group flex w-full flex-col items-center rounded-2xl bg-muted/60 p-4 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label={bedIn ? "Slide the bed out of the scanner" : "Slide the bed into the scanner"}
      >
        <ScannerArt bedIn={bedIn} />
        <span className="mt-1 rounded-full bg-card px-3 py-1 text-sm font-bold text-primary transition-transform group-hover:scale-105">
          👆 Tap to slide the bed {bedIn ? "out" : "in"}
        </span>
      </button>

      <div className="min-h-24" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-2xl leading-snug"
          >
            {card.text}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-12 px-4 text-base" disabled={i === 0} onClick={() => go(i - 1)}>
          <ArrowLeft /> Back
        </Button>
        {!last && (
          <Button className="h-12 px-5 text-base" onClick={() => go(i + 1)}>
            Next <ArrowRight />
          </Button>
        )}
        {last && !done && (
          <Button className="h-12 px-5 text-base" onClick={onComplete}>
            <Check /> I met the MRI, {name}!
          </Button>
        )}
        <ReadAloud text={card.text} />
        <span className="ml-auto text-sm text-muted-foreground" aria-label={`Card ${i + 1} of ${CARDS.length}`}>
          {i + 1} / {CARDS.length}
        </span>
      </div>
    </div>
  );
}
