import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getAllProducts, inferProductBrand, type Product } from "@/lib/products";
import { absoluteSiteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

function xml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function absoluteImageUrl(image: string | undefined) {
  const fallback = absoluteSiteUrl("/logo.png");
  const value = image?.trim();

  if (!value) return fallback;

  try {
    return new URL(value).toString();
  } catch {
    return absoluteSiteUrl(value.startsWith("/") ? value : `/${value}`);
  }
}

function googleProductCategory(product: Product) {
  // Google taxonomy ID 267: Electronics > Communications > Telephony > Mobile Phones.
  // Only declare a category we can accurately classify; other product types can be
  // classified from their title, description, and brand instead of receiving a guess.
  return product.category === "phones" ? "267" : undefined;
}

export const Route = createFileRoute("/meta-catalog.xml")({
  server: {
    handlers: {
      GET: async () => {
        const products = await getAllProducts();
        const items = products.map((product) => {
          const productCategory = googleProductCategory(product);
          const additionalImages = product.images
            .slice(1, 11)
            .filter((image) => image.trim())
            .map(
              (image) =>
                `      <g:additional_image_link>${xml(absoluteImageUrl(image))}</g:additional_image_link>`,
            );

          return [
            "    <item>",
            `      <g:id>${xml(product.slug)}</g:id>`,
            `      <g:title>${xml(product.name)}</g:title>`,
            `      <g:description>${xml(product.description || product.tagline)}</g:description>`,
            `      <g:availability>${product.stock > 0 ? "in stock" : "out of stock"}</g:availability>`,
            "      <g:condition>new</g:condition>",
            `      <g:price>${(product.pricePaise / 100).toFixed(2)} INR</g:price>`,
            `      <g:link>${xml(absoluteSiteUrl(`/product/${encodeURIComponent(product.slug)}`))}</g:link>`,
            `      <g:image_link>${xml(absoluteImageUrl(product.images[0]))}</g:image_link>`,
            ...additionalImages,
            `      <g:brand>${xml(product.brand || inferProductBrand(product.name))}</g:brand>`,
            productCategory
              ? `      <g:google_product_category>${productCategory}</g:google_product_category>`
              : "",
            // The store sells online and does not offer in-store pickup or local stock.
            // Keep Shopping and free online listings enabled while suppressing only
            // local-inventory programs that require a separate per-store feed.
            "      <g:excluded_destination>Local_inventory_ads</g:excluded_destination>",
            "      <g:excluded_destination>Free_local_listings</g:excluded_destination>",
            "      <g:shipping>",
            "        <g:country>IN</g:country>",
            "        <g:service>Standard</g:service>",
            "        <g:price>0.00 INR</g:price>",
            "      </g:shipping>",
            "    </item>",
          ]
            .filter(Boolean)
            .join("\n");
        });
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
