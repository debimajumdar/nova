"use client";

import { MotionConfig } from "framer-motion";
import { createContext, useContext, useEffect, useState } from "react";

export type A11ySettings = {
  textSize: "md" | "lg" | "xl";
  highContrast: boolean;
  reduceMotion: boolean;
};

const DEFAULTS: A11ySettings = { textSize: "md", highContrast: false, reduceMotion: false };
const STORAGE_KEY = "nova.a11y";

const A11yContext = createContext<{
  settings: A11ySettings;
  update: (patch: Partial<A11ySettings>) => void;
}>({ settings: DEFAULTS, update: () => {} });

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(DEFAULTS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Read after mount so server and client render the same defaults first.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setSettings({ ...DEFAULTS, ...JSON.parse(saved) });
    } catch {
      // Storage can be unavailable (private mode); defaults are fine.
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.text = settings.textSize;
    html.dataset.contrast = settings.highContrast ? "high" : "normal";
    html.dataset.motion = settings.reduceMotion ? "reduce" : "normal";
  }, [settings]);

  const update = (patch: Partial<A11ySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <A11yContext.Provider value={{ settings, update }}>
      <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "user"}>{children}</MotionConfig>
    </A11yContext.Provider>
  );
}

export const useA11y = () => useContext(A11yContext);
