"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useA11y, type A11ySettings } from "@/components/a11y-provider";
import { cn } from "@/lib/utils";

const SIZES: { value: A11ySettings["textSize"]; label: string }[] = [
  { value: "md", label: "A" },
  { value: "lg", label: "A+" },
  { value: "xl", label: "A++" },
];

export function A11yPanel() {
  const { settings, update } = useA11y();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="outline" className="h-10 px-3" aria-expanded={open} aria-controls="a11y-panel" onClick={() => setOpen((o) => !o)}>
        <Eye /> Display
      </Button>
      {open && (
        <div
          id="a11y-panel"
          role="group"
          aria-label="Display settings"
          className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border bg-card p-4 shadow-lg"
        >
          <fieldset>
            <legend className="text-sm font-bold">Text size</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  aria-pressed={settings.textSize === s.value}
                  onClick={() => update({ textSize: s.value })}
                  className={cn(
                    "h-10 rounded-lg border font-bold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    settings.textSize === s.value && "border-primary bg-accent text-accent-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>
          <Toggle label="High contrast" checked={settings.highContrast} onChange={(v) => update({ highContrast: v })} />
          <Toggle label="Reduce motion" checked={settings.reduceMotion} onChange={(v) => update({ reduceMotion: v })} />
        </div>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 text-sm font-bold">
      {label}
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 accent-[var(--primary)]"
      />
    </label>
  );
}
