import { ImageResponse } from "next/og";

export const alt = "Lok Mandate — Independent India news & elections";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default social share card (used when a page has no image of its own).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          color: "#fff",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 132,
              height: 132,
              background: "#dc2626",
              borderRadius: 30,
            }}
          >
            <svg width="86" height="86" viewBox="0 0 48 48">
              <path
                d="M13 25l7 7 15-16"
                fill="none"
                stroke="#fff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 108, fontWeight: 700, letterSpacing: -2 }}>
            Lok Mandate
          </div>
        </div>
        <div style={{ display: "flex", width: 120, height: 6, background: "#dc2626", marginTop: 44, marginBottom: 28 }} />
        <div style={{ display: "flex", fontSize: 34, color: "#c7c7cc", fontFamily: "Arial, sans-serif" }}>
          Independent India news &amp; elections
        </div>
      </div>
    ),
    { ...size }
  );
}
