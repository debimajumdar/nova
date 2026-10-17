"use client";

import { motion } from "framer-motion";

// A friendly MRI scanner. The bed (with a small child on it) slides into the tunnel when bedIn is true.
export function ScannerArt({ bedIn, active = false }: { bedIn: boolean; active?: boolean }) {
  return (
    <svg viewBox="-40 0 340 190" role="img" aria-label="An MRI scanner shaped like a big donut, with a bed that slides into the tunnel" className="w-full max-w-md">
      {/* floor shadow */}
      <ellipse cx="140" cy="176" rx="150" ry="8" className="fill-muted" />

      {/* scanner body */}
      <rect x="100" y="20" width="140" height="150" rx="44" className="fill-card stroke-border" strokeWidth="3" />
      <rect x="112" y="32" width="116" height="126" rx="36" className="fill-accent" />

      {/* tunnel */}
      <circle cx="170" cy="95" r="40" className="fill-muted stroke-border" strokeWidth="3" />
      <motion.circle
        cx="170"
        cy="95"
        r="40"
        fill="none"
        strokeWidth="4"
        className="stroke-primary"
        animate={{ opacity: active ? [0.15, 0.7, 0.15] : 0 }}
        transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}
      />

      {/* friendly lights */}
      <circle cx="140" cy="44" r="4" className="fill-ready-fill" />
      <circle cx="154" cy="44" r="4" className="fill-track-fill" />

      {/* bed stand */}
      <rect x="20" y="128" width="90" height="38" rx="8" className="fill-card stroke-border" strokeWidth="3" />

      {/* bed + child, slides into the tunnel */}
      <motion.g animate={{ x: bedIn ? 34 : -56 }} transition={{ type: "spring", stiffness: 40, damping: 14 }}>
        <rect x="40" y="112" width="122" height="14" rx="7" className="fill-card stroke-border" strokeWidth="3" />
        {/* blanket */}
        <rect x="66" y="100" width="58" height="14" rx="7" className="fill-track-fill" />
        {/* head on pillow */}
        <rect x="124" y="104" width="30" height="10" rx="5" className="fill-muted" />
        <circle cx="136" cy="98" r="10" className="fill-attention-soft stroke-border" strokeWidth="2" />
        <circle cx="139" cy="96" r="1.5" className="fill-foreground" />
      </motion.g>
    </svg>
  );
}
