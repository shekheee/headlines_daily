import { ImageResponse } from "next/og";

const whorl = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 48 48' fill='none'><g stroke='#ffffff' stroke-width='2.7' stroke-linecap='round'><path d='M22.12 29.17 A5.5 5.5 0 1 1 25.88 29.17'/><path d='M20.58 33.40 A10 10 0 1 1 27.42 33.40'/><path d='M19.04 37.63 A14.5 14.5 0 1 1 28.96 37.63'/><path d='M17.50 41.86 A19 19 0 1 1 30.50 41.86'/><path d='M24 16.5 q4.6 2.2 2 7'/></g></svg>`;

// Raster publisher logo for Google News / schema.org ImageObject.
// Served at /logo.png. Point NEXT_PUBLIC_LOGO_URL at "/logo.png".
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          background: "#ffffff",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 92,
            height: 92,
            background: "#dc2626",
            borderRadius: 22,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width={68} height={68} src={`data:image/svg+xml,${encodeURIComponent(whorl)}`} alt="" />
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: "#111827", letterSpacing: -1 }}>
          Lok Mandate
        </div>
      </div>
    ),
    { width: 600, height: 160 }
  );
}
