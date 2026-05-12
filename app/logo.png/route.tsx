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
          background: "transparent"
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="512" height="512" fill="none">
          <rect width="32" height="32" rx="8" fill="#0D0F12" />
          <path
            d="M22.5 9.2a8.5 8.5 0 1 0 0 13.6 6.5 6.5 0 1 1 0-13.6Z"
            fill="#B8943F"
            stroke="#B8943F"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
