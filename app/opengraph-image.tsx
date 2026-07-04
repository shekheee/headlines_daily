import { ImageResponse } from "next/og";

export const alt = "Lok Mandate — Independent India news";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const whorl = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 48 48' fill='none'><g stroke='#ffffff' stroke-width='2.7' stroke-linecap='round'><path d='M22.12 29.17 A5.5 5.5 0 1 1 25.88 29.17'/><path d='M20.58 33.40 A10 10 0 1 1 27.42 33.40'/><path d='M19.04 37.63 A14.5 14.5 0 1 1 28.96 37.63'/><path d='M17.50 41.86 A19 19 0 1 1 30.50 41.86'/><path d='M24 16.5 q4.6 2.2 2 7'/></g></svg>`;

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img width={96} height={96} src={`data:image/svg+xml,${encodeURIComponent(whorl)}`} alt="" />
          </div>
          <div style={{ display: "flex", fontSize: 108, fontWeight: 700, letterSpacing: -2 }}>
            Lok Mandate
          </div>
        </div>
        <div style={{ display: "flex", width: 120, height: 6, background: "#dc2626", marginTop: 44, marginBottom: 28 }} />
        <div style={{ display: "flex", fontSize: 34, color: "#c7c7cc", fontFamily: "Arial, sans-serif" }}>
          Independent India news
        </div>
      </div>
    ),
    { ...size }
  );
}
