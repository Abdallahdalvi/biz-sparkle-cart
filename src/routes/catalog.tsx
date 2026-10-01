import { createFileRoute, redirect } from "@tanstack/react-router";

// Preserve legacy links while keeping the shopper-facing listing at /products.
export const Route = createFileRoute("/catalog")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/products", search });
  },
});
