import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/profile/settings",
          "/template/new",
          "/template/*/edit",
          "/favourites",
          "/collections",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
