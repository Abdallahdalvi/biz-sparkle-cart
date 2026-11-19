import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getAllProducts } from "@/lib/products";
import { absoluteSiteUrl } from "@/lib/site";

const sitePages = [
  "/",
  "/products",
  "/sim-compatibility",
  "/legal/about",
  "/legal/contact",
  "/legal/terms",
  "/legal/privacy",
  "/legal/shipping",
  "/legal/returns",
  "/legal/cancellation",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const products = await getAllProducts();
        if (!products.length) {
          return new Response("Catalog temporarily unavailable", {
            status: 503,
            headers: { "Cache-Control": "no-store", "Retry-After": "300" },
          });
        }

        const pages = sitePages.map((path) => `<url><loc>${absoluteSiteUrl(path)}</loc></url>`);
        const productPages = products.map((product) => {
          const url = absoluteSiteUrl(`/product/${encodeURIComponent(product.slug)}`);
          const updated = product.updatedAt && new Date(product.updatedAt);
          const lastmod =
            updated && Number.isFinite(updated.valueOf())
              ? `<lastmod>${updated.toISOString()}</lastmod>`
              : "";
          return `<url><loc>${url}</loc>${lastmod}</url>`;
        });

        return new Response(
          [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...pages,
            ...productPages,
            "</urlset>",
          ].join("\n"),
          {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=900",
            },
          },
        );
      },
    },
  },
});
