import type { Metadata, Viewport } from "next";
import { Sora, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { RoleRouteGuard } from "@/components/auth/RoleRouteGuard";

const sora = Sora({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const spaceMono = Space_Mono({ subsets: ["latin"], variable: "--font-data", weight: ["400", "700"] });

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrl = configuredSiteUrl || "https://danchrista-four-communication.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Danchrista Four Communication", template: "%s · Danchrista Four Communication" },
  description: "Daily sales, inventory, repairs, debit, credit and money records for Danchrista Four Communication.",
  applicationName: "Danchrista Four Communication",
  category: "business",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#123b34",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable} ${spaceMono.variable}`}>
      <body className="min-w-0 overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only fixed left-3 top-3 z-[100] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[var(--danchrista-primary)]"
        >
          Skip to main content
        </a>
        <TooltipProvider>
          <RoleRouteGuard>{children}</RoleRouteGuard>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
