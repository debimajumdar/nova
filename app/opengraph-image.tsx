import { ImageResponse } from "next/og";

export const alt = "NOVA: every child walks in ready";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Link preview shown when the site is shared (Devpost, Discord, Slack, iMessage).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #f2f8f8 0%, #d6efec 100%)",
          color: "#14232b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#0f6b68",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 40,
            }}
          >
            ✦
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>NOVA + PULSE</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>Every child walks in ready.</div>
          <div style={{ fontSize: 34, color: "#3d5560", maxWidth: 980 }}>
            Kid-friendly procedure prep for families, live readiness for care teams. AI translations reviewed by
            clinicians.
          </div>
        </div>
        <div style={{ fontSize: 26, color: "#0f6b68", fontWeight: 700 }}>Built at DubHacks 2026</div>
      </div>
    ),
    size,
  );
}
