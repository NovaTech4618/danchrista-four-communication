import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://danchrista-four-communication.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/customers/",
        "/devices/",
        "/repairs/",
        "/inventory/",
        "/engineers/",
        "/engineer-workflow/",
        "/sales/",
        "/suppliers/",
        "/invoices/",
        "/reports/",
        "/alerts/",
        "/assistant/",
        "/settings/",
        "/finance/",
        "/staff/",
        "/activity/",
        "/audit/",
        "/search/",
        "/tickets/",
        "/whatsapp/",
        "/help/",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
