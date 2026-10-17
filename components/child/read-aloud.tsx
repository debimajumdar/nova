"use client";

import { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Reads text aloud with the browser's built-in voice, for pre-readers and low-vision users.
export function ReadAloud({ text, lang = "en-US" }: { text: string; lang?: string }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (typeof window !== "undefined" && !("speechSynthesis" in window)) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  };

  return (
    <Button variant="outline" className="h-11 px-4 text-base" onClick={toggle} aria-pressed={speaking}>
      {speaking ? <Square /> : <Volume2 />} {speaking ? "Stop reading" : "Read to me"}
    </Button>
  );
}
