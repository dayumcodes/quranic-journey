import { ImageResponse } from "next/og";

export const runtime = "edge";

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
          background: "#F4EFE6",
          color: "#0D0F12",
          fontSize: 96,
          fontWeight: 700
        }}
      >
        Al-Rihla
      </div>
    ),
    { width: 512, height: 512 }
  );
}
