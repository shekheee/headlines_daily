import type { MetadataRoute } from "next";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/auth/"] },
    ],
    sitemap: appUrl ? [`${appUrl}/sitemap.xml`, `${appUrl}/news-sitemap.xml`] : undefined,
    host: appUrl || undefined,
  };
}
