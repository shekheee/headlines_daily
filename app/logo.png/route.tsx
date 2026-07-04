import { ImageResponse } from "next/og";

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
          <svg width="60" height="60" viewBox="0 0 48 48">
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
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: "#111827", letterSpacing: -1 }}>
          Lok Mandate
        </div>
      </div>
    ),
    { width: 600, height: 160 }
  );
}
