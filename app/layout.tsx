import type { Metadata, Viewport } from "next";
import { Sora, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { RoleRouteGuard } from "@/components/auth/RoleRouteGuard";

// Danchrista Four Communication business system typography.
const sora = Sora({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const spaceMono = Space_Mono({ subsets: ["latin"], variable: "--font-data", weight: ["400", "700"] });

// Treat an empty/whitespace NEXT_PUBLIC_SITE_URL as missing so metadata generation
// cannot crash the production build with new URL("").
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrl = configuredSiteUrl || "https://danchrista-four-communication.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Danchrista Four Communication", template: "%s · Danchrista" },
  description:
    "Business management system for Danchrista Four Communication: sales, repairs, inventory, engineers, payments and daily business records.",
  applicationName: "Danchrista Four Communication",
  category: "business",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#12b76a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable} ${spaceMono.variable}`}>
      <body className="min-w-0 overflow-x-hidden">
        <TooltipProvider>
          <RoleRouteGuard>{children}</RoleRouteGuard>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
