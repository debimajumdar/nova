// Synthesized approximations of MRI scanner sounds (no recordings, no licensing).
// Volumes are deliberately capped; "loud" here is still gentle through device speakers.

export type MriSound = "knock" | "buzz" | "beep";

export const VOLUME_LEVELS = [
  { label: "Whisper", gain: 0.03 },
  { label: "Quiet", gain: 0.07 },
  { label: "Medium", gain: 0.13 },
  { label: "Loud", gain: 0.22 },
] as const;

const PATTERNS: Record<MriSound, { wave: OscillatorType; freq: number; period: number; burst: number }> = {
  knock: { wave: "square", freq: 180, period: 0.28, burst: 0.07 },
  buzz: { wave: "sawtooth", freq: 110, period: 0.5, burst: 0.42 },
  beep: { wave: "sine", freq: 950, period: 0.13, burst: 0.06 },
};

export type SoundHandle = { stop: () => void };

export function playMriSound(sound: MriSound, gain: number, seconds = 4): SoundHandle {
  const ctx = new AudioContext();
  const { wave, freq, period, burst } = PATTERNS[sound];

  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.value = freq;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = sound === "beep" ? 3000 : 1200;

  const env = ctx.createGain();
  env.gain.value = 0;

  osc.connect(filter).connect(env).connect(ctx.destination);

  const start = ctx.currentTime + 0.05;
  for (let t = 0; t < seconds; t += period) {
    env.gain.setValueAtTime(gain, start + t);
    env.gain.setValueAtTime(0, start + t + burst);
  }
  osc.start(start);
  osc.stop(start + seconds);

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      osc.stop();
    } catch {}
    ctx.close();
  };
  osc.onended = stop;
  return { stop };
}
