import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Danchrista Four Communication",
    short_name: "Danchrista",
    description: "Business management for customers, repairs, inventory, sales and finances.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f9f8",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}