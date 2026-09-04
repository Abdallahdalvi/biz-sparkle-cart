import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getAllProducts } from "@/lib/products";
import { absoluteSiteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

function xml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const Route = createFileRoute("/meta-catalog.xml")({
  server: {
    handlers: {
      GET: async () => {
        const products = await getAllProducts();
        const items = products.map((product) =>
          [
            "    <item>",
            `      <g:id>${xml(product.slug)}</g:id>`,
            `      <g:title>${xml(product.name)}</g:title>`,
            `      <g:description>${xml(product.description || product.tagline)}</g:description>`,
            `      <g:availability>${product.stock > 0 ? "in stock" : "out of stock"}</g:availability>`,
            "      <g:condition>new</g:condition>",
            `      <g:price>${(product.pricePaise / 100).toFixed(2)} INR</g:price>`,
            `      <g:link>${xml(absoluteSiteUrl(`/product/${encodeURIComponent(product.slug)}`))}</g:link>`,
            `      <g:image_link>${xml(product.images[0] || absoluteSiteUrl("/logo.png"))}</g:image_link>`,
            `      <g:brand>${xml(SITE_NAME)}</g:brand>`,
            "    </item>",
          ].join("\n"),
        );
        const body = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">',
          "  <channel>",
          `    <title>${xml(SITE_NAME)}</title>`,
          `    <link>${xml(SITE_URL)}</link>`,
          `    <description>${xml(SITE_DESCRIPTION)}</description>`,
          ...items,
          "  </channel>",
          "</rss>",
        ].join("\n");

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
          },
        });
      },
    },
  },
});
