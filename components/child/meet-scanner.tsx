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
  const card = CARDS[i];
  const last = i === CARDS.length - 1;

  return (
    <div className="space-y-5">
      <div className="flex justify-center rounded-2xl bg-muted/60 p-4">
        <ScannerArt bedIn={card.bedIn} />
      </div>

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
        <Button variant="outline" className="h-12 px-4 text-base" disabled={i === 0} onClick={() => setI(i - 1)}>
          <ArrowLeft /> Back
        </Button>
        {!last && (
          <Button className="h-12 px-5 text-base" onClick={() => setI(i + 1)}>
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
