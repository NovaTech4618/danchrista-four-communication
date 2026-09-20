import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://amezing-limited.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/phone-repairs", "/phone-parts", "/accessories", "/services", "/about", "/contact"];
  return routes.map((path) => ({
    url: siteUrl + path,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
