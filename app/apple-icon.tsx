import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f766e",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: "74%",
            height: "74%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7f9f8",
            borderRadius: 30,
            color: "#0f766e",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 116,
            fontWeight: 700,
          }}
        >
          A
        </div>
      </div>
    ),
    size,
  );
}
