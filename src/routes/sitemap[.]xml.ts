import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getAllProducts } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const products = await getAllProducts();
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/catalog", changefreq: "daily", priority: "0.9" },
          { path: "/legal/about", changefreq: "monthly", priority: "0.5" },
          { path: "/legal/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/legal/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/legal/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/legal/shipping", changefreq: "yearly", priority: "0.4" },
          { path: "/legal/returns", changefreq: "yearly", priority: "0.4" },
          { path: "/legal/cancellation", changefreq: "yearly", priority: "0.3" },
          ...products.map((p) => ({
            path: `/product/${p.slug}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          })),
        ];
        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${SITE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
