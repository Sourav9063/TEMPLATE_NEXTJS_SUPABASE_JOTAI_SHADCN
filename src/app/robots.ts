import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8080";
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
