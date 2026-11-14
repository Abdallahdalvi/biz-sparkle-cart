import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getAllProducts } from "@/lib/products";
import { absoluteSiteUrl } from "@/lib/site";

export const Route = createFileRoute("/p/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const product = (await getAllProducts()).find((item) => item.id === params.id);
        if (!product) return new Response("Product not found", { status: 404 });
        return Response.redirect(absoluteSiteUrl(`/product/${encodeURIComponent(product.slug)}`), 302);
      },
    },
  },
});
