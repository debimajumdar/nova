"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, Check, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playMriSound, VOLUME_LEVELS, type SoundHandle } from "@/lib/mri-sounds";
import { useMotionDetector } from "@/lib/use-motion-detector";
import { cn } from "@/lib/utils";

const GOAL = 20;

type Phase = "ready" | "running" | "wiggled" | "won";

export function StillnessGame({ done, onComplete }: { done: boolean; onComplete: () => void }) {
  const [rawPhase, setPhase] = useState<Phase>("ready");
  const [seconds, setSeconds] = useState(0);
  const [withSounds, setWithSounds] = useState(true);
  const [useCamera, setUseCamera] = useState(false);
  const sound = useRef<SoundHandle | null>(null);
  const soundLoop = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSounds = useCallback(() => {
    sound.current?.stop();
    sound.current = null;
    if (soundLoop.current) clearInterval(soundLoop.current);
    soundLoop.current = null;
  }, []);

  const wiggle = useCallback(() => {
    setPhase((p) => (p === "running" ? "wiggled" : p));
  }, []);

  const { videoRef, status, level } = useMotionDetector(useCamera, wiggle);

  // Reaching the goal while running is a win; derived rather than stored to avoid an extra render.
  const phase: Phase = rawPhase === "running" && seconds >= GOAL ? "won" : rawPhase;

  // Count up once per second while running.
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") stopSounds();
  }, [phase, stopSounds]);

  useEffect(() => stopSounds, [stopSounds]);

  const start = () => {
    setSeconds(0);
    setPhase("running");
    if (withSounds) {
      const playOnce = () => {
        sound.current?.stop();
        sound.current = playMriSound("knock", VOLUME_LEVELS[1].gain, 4);
      };
      playOnce();
      soundLoop.current = setInterval(playOnce, 4000);
    }
  };

  const pct = Math.min(100, (seconds / GOAL) * 100);

  return (
    <div className="space-y-5">
      <p className="text-2xl leading-snug">
        To take clear pictures, you need to be as still as a statue. Can you stay still for {GOAL} seconds?
      </p>

      <div className="relative flex flex-col items-center gap-4 rounded-2xl bg-muted/60 p-6">
        <motion.div
          className={cn(
            "flex size-40 flex-col items-center justify-center rounded-full border-8 bg-card",
            phase === "won" ? "border-ready-fill" : phase === "wiggled" ? "border-attention-fill" : "border-track-fill",
          )}
          animate={phase === "wiggled" ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          role="timer"
          aria-live="polite"
          aria-label={`${seconds} of ${GOAL} seconds`}
        >
          <span className="text-5xl font-bold tabular-nums">{phase === "won" ? GOAL : seconds}</span>
          <span className="text-sm text-muted-foreground">of {GOAL} seconds</span>
        </motion.div>
        <div className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-card">
          <div className="h-full rounded-full bg-primary transition-[width] duration-1000" style={{ width: `${pct}%` }} />
        </div>

        <p className="min-h-8 text-center text-xl font-bold" aria-live="assertive">
          {phase === "ready" && "Get comfy, then press Start."}
          {phase === "running" && "Statue mode… you're doing great!"}
          {phase === "wiggled" && "Oops, a wiggle! That's okay, let's try again."}
          {phase === "won" && "You did it! Super still statue! ⭐"}
        </p>

        {useCamera && (
          <div className="flex items-center gap-3">
            <video ref={videoRef} muted playsInline className="h-20 w-28 -scale-x-100 rounded-lg bg-foreground/10 object-cover" />
            <div className="w-32">
              <span className="text-xs text-muted-foreground">
                {status === "denied" ? "Camera not allowed" : status === "on" ? "Wiggle meter" : "Starting camera…"}
              </span>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-card">
                <div
                  className={cn("h-full rounded-full", level > 0.5 ? "bg-attention-fill" : "bg-ready-fill")}
                  style={{ width: `${Math.round(level * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {phase !== "running" && phase !== "won" && (
          <Button className="h-12 px-5 text-base" onClick={start}>
            {phase === "wiggled" ? <RotateCcw /> : <Play />} {phase === "wiggled" ? "Try again" : "Start"}
          </Button>
        )}
        {phase === "running" && (
          <Button variant="outline" className="h-12 px-5 text-base" onClick={wiggle}>
            I wiggled
          </Button>
        )}
        {phase === "won" && !done && (
          <Button className="h-12 px-5 text-base" onClick={onComplete}>
            <Check /> I can be a statue!
          </Button>
        )}
        {phase === "won" && (
          <Button variant="outline" className="h-12 px-5 text-base" onClick={() => setPhase("ready")}>
            <RotateCcw /> Play again
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="size-5 accent-[var(--primary)]"
            checked={withSounds}
            disabled={phase === "running"}
            onChange={(e) => setWithSounds(e.target.checked)}
          />
          Play quiet MRI sounds while practicing
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="size-5 accent-[var(--primary)]"
            checked={useCamera}
            onChange={(e) => setUseCamera(e.target.checked)}
          />
          {useCamera ? <Camera className="size-4" /> : <CameraOff className="size-4" />}
          Use the camera to spot wiggles (stays on this device)
        </label>
      </div>
    </div>
  );
}
