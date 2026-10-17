"use client";

import { useEffect, useRef, useState } from "react";

// On-device motion detection: compares tiny downscaled webcam frames. No video leaves the browser.
const W = 32;
const H = 24;
const THRESHOLD = 18; // mean per-pixel brightness change that counts as a wiggle

export function useMotionDetector(enabled: boolean, onMotion: () => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<"off" | "starting" | "on" | "denied">("off");
  const [level, setLevel] = useState(0);
  const onMotionRef = useRef(onMotion);

  useEffect(() => {
    onMotionRef.current = onMotion;
  }, [onMotion]);

  useEffect(() => {
    if (!enabled) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let prev: Uint8ClampedArray | null = null;
    let lastCheck = 0;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const video = videoRef.current;
      if (!video || !ctx || video.readyState < 2 || t - lastCheck < 150) return;
      lastCheck = t;
      ctx.drawImage(video, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, W, H).data;
      if (prev) {
        let diff = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const b = (prev[i] + prev[i + 1] + prev[i + 2]) / 3;
          diff += Math.abs(a - b);
        }
        const mean = diff / (W * H);
        setLevel(Math.min(1, mean / (THRESHOLD * 2)));
        if (mean > THRESHOLD) onMotionRef.current();
      }
      prev = new Uint8ClampedArray(data);
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects the async camera request
    setStatus("starting");
    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240, facingMode: "user" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
        setStatus("on");
        raf = requestAnimationFrame(tick);
      })
      .catch(() => setStatus("denied"));

    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      setStatus("off");
      setLevel(0);
    };
  }, [enabled]);

  return { videoRef, status, level };
}
