import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = "SREnity — fragmented data to incident clarity. Coming soon.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0b2a38";
const TEAL = "#5eead4";
const MIST = "#edf0f2";
const SOFT = "#a9bcc6";

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
          padding: "72px 80px",
          background: NAVY,
          color: MIST,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 44, fontWeight: 700 }}>
          <span>SRE</span>
          <span style={{ color: TEAL, fontWeight: 500 }}>nity</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, lineHeight: 1.05, letterSpacing: -2 }}>Fragmented Data</div>
          <div style={{ fontSize: 72, lineHeight: 1.05, letterSpacing: -2, color: SOFT }}>
            to Incident Clarity
          </div>
          <div style={{ marginTop: 28, fontSize: 28, color: SOFT }}>
            {`${SITE.tagline} · every line linked to its source.`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "12px 24px",
            borderRadius: 999,
            border: `2px solid ${TEAL}`,
            color: TEAL,
            fontSize: 24,
            letterSpacing: 2,
          }}
        >
          COMING SOON · EARLY ACCESS OPEN
        </div>
      </div>
    ),
    size,
  );
}
