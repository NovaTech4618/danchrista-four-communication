import { ImageResponse } from "next/og";

export const alt = "Danchrista Four Communication — business management system";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#f7f9f8",
          color: "#0f172a",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              background: "#0f766e",
              color: "white",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 700 }}>DANCHRISTA FOUR</div>
            <div style={{ fontSize: 15, letterSpacing: 3, color: "#64748b" }}>COMMUNICATION</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f766e", marginBottom: 18 }}>
            Built for the shop
          </div>
          <div style={{ fontSize: 64, lineHeight: 1.04, fontWeight: 700, letterSpacing: -2 }}>
            The shop, finally in one place.
          </div>
          <div style={{ marginTop: 24, fontSize: 25, lineHeight: 1.45, color: "#475569" }}>
            Sales, phone parts, repairs, engineers, payments and daily closing in one clear workspace.
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, fontSize: 18, fontWeight: 700, color: "#0f766e" }}>
          <span>Repairs</span>
          <span>•</span>
          <span>Inventory</span>
          <span>•</span>
          <span>Payments</span>
          <span>•</span>
          <span>Engineers</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
