import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/account/orders")({
  component: () => (
    <div className="bg-white shopify-border p-12 text-center">
      <p className="text-on-surface-variant mb-2">Sign in to see your orders.</p>
      <Link to="/auth" className="text-primary underline text-sm">Sign In</Link>
      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-6">
        Connected to Lovable Cloud + Shiprocket tracking in Phase 2 & 5.
      </p>
    </div>
  ),
});