import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const protectedRoutes = [
  "workspace",
  "dashboard",
  "activity",
  "alerts",
  "assistant",
  "audit",
  "customer-requests",
  "customers",
  "devices",
  "engineer-workflow",
  "engineers",
  "finance",
  "help",
  "inventory",
  "invoices",
  "outstanding",
  "parts-credit",
  "repairs",
  "reports",
  "sales",
  "search",
  "settings",
  "staff",
  "suppliers",
  "technical-services",
  "technician-ledger",
  "tickets",
  "whatsapp",
] as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      ...protectedRoutes.map((route) => ({
        source: `/${route}/:path*`,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      })),
    ];
  },
};

export default nextConfig;
