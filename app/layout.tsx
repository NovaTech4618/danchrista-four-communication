import type { Metadata, Viewport } from "next";
import { Sora, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { RoleRouteGuard } from "@/components/auth/RoleRouteGuard";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";

const sora = Sora({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const spaceMono = Space_Mono({ subsets: ["latin"], variable: "--font-data", weight: ["400", "700"] });

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrl = configuredSiteUrl || "https://danchrista-four-communication.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Amezing Limited", template: "%s · Amezing Limited" },
  description: "Amezing Limited in Central Market, Kubwa, Abuja offers phone repairs, phone parts, accessories and software services. Open daily from 9am to 10pm.",
  keywords: [
    "Amezing Limited",
    "Amezing Limited Kubwa",
    "phone repair Kubwa",
    "phone repair in Kubwa",
    "phone parts Kubwa",
    "phone accessories Kubwa",
    "phone repair Abuja",
    "phone parts Abuja",
    "mobile phone repair Abuja",
  ],
  applicationName: "Amezing Limited",
  category: "business",
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: "Amezing Limited",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  verification: {
    google: "USlgSboAgAcCA_YC5xI7KFZI6zcxRRU6IkurLz0GmcM",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={sora.variable + " " + manrope.variable + " " + spaceMono.variable}>
      <body className="min-w-0 overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only fixed left-3 top-3 z-[100] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[var(--amezing-primary)]"
        >
          Skip to main content
        </a>
        <ServiceWorkerRegistration />
        <TooltipProvider>
          <RoleRouteGuard>{children}</RoleRouteGuard>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
