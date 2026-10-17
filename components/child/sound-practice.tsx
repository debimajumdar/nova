"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Hand, Lock, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScannerArt } from "@/components/child/scanner-art";
import { playMriSound, VOLUME_LEVELS, type MriSound, type SoundHandle } from "@/lib/mri-sounds";
import { cn } from "@/lib/utils";

const SOUNDS: { id: MriSound; label: string; hint: string }[] = [
  { id: "knock", label: "Knock knock", hint: "Like someone knocking on a door" },
  { id: "buzz", label: "Buzzzz", hint: "Like a big bumblebee" },
  { id: "beep", label: "Beep beep", hint: "Like a fast little alarm" },
];

// Graded exposure: each volume level unlocks after the child has listened to all three sounds at the level before.
export function SoundPractice({ done, onComplete }: { done: boolean; onComplete: () => void }) {
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState<MriSound | null>(null);
  const handle = useRef<SoundHandle | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    handle.current?.stop();
    handle.current = null;
    if (timer.current) clearTimeout(timer.current);
    setPlaying(null);
  };

  useEffect(() => stop, []);

  const play = (sound: MriSound) => {
    stop();
    handle.current = playMriSound(sound, VOLUME_LEVELS[level].gain, 4);
    setPlaying(sound);
    timer.current = setTimeout(() => {
      setPlaying(null);
      setHeard((h) => new Set(h).add(`${level}:${sound}`));
    }, 4000);
  };

  const levelComplete = (l: number) => SOUNDS.every((s) => heard.has(`${l}:${s.id}`));
  const unlocked = (l: number) => l === 0 || levelComplete(l - 1);
  const bravePoints = VOLUME_LEVELS.filter((_, l) => levelComplete(l)).length;
  const enough = bravePoints >= 2;

  return (
    <div className="space-y-5">
      <p className="text-2xl leading-snug">
        The MRI makes funny noises while it takes pictures. That&apos;s normal! Let&apos;s practice listening.
      </p>
      <p className="text-sm text-muted-foreground">Grown-ups: turn the device volume down a bit first. In the real scanner your child will wear ear protection.</p>

      <div className="flex justify-center rounded-2xl bg-muted/60 p-4">
        <ScannerArt bedIn active={playing !== null} />
      </div>

      <fieldset>
        <legend className="mb-2 font-bold">How loud?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {VOLUME_LEVELS.map((v, l) => (
            <button
              key={v.label}
              disabled={!unlocked(l)}
              aria-pressed={level === l}
              onClick={() => {
                stop();
                setLevel(l);
              }}
              className={cn(
                "flex h-12 items-center justify-center gap-1.5 rounded-xl border text-base font-bold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-40",
                level === l && "border-primary bg-accent text-accent-foreground",
              )}
            >
              {!unlocked(l) ? <Lock className="size-4" /> : levelComplete(l) ? <Star className="size-4 fill-current" /> : null}
              {v.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2 sm:grid-cols-3">
        {SOUNDS.map((s) => {
          const wasHeard = heard.has(`${level}:${s.id}`);
          return (
            <button
              key={s.id}
              onClick={() => play(s.id)}
              disabled={playing !== null}
              className={cn(
                "rounded-2xl border bg-card p-4 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60",
                playing === s.id && "border-primary",
              )}
            >
              <span className="flex items-center gap-2 text-lg font-bold">
                {wasHeard ? <Check className="size-5 text-ready-ink" /> : <Play className="size-5 text-primary" />}
                {s.label}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{s.hint}</span>
            </button>
          );
        })}
      </div>

      {playing && (
        <Button variant="destructive" className="h-14 w-full text-lg" onClick={stop}>
          <Hand /> Stop! (You can always stop)
        </Button>
      )}

      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        <span className="flex items-center gap-1 text-lg font-bold">
          {Array.from({ length: VOLUME_LEVELS.length }, (_, i) => (
            <Star key={i} className={cn("size-6", i < bravePoints ? "fill-attention-fill text-attention-fill" : "text-border")} />
          ))}
          <span className="sr-only">{bravePoints} brave stars</span>
        </span>
        {enough && !done && (
          <Button className="h-12 px-5 text-base" onClick={onComplete}>
            <Check /> I&apos;m a brave listener!
          </Button>
        )}
      </div>
    </div>
  );
}
