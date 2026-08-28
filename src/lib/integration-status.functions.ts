import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getIntegrationStatus = createServerFn({ method: "POST" })
  .validator((input) => z.object({ token: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    return {
      cashfree: {
        apiKeysConfigured: Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY),
        environment:
          (process.env.CASHFREE_ENVIRONMENT || "sandbox").toLowerCase() === "production"
            ? "production"
            : "sandbox",
      },
      shiprocket: {
        credentialsConfigured: Boolean(
          process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD,
        ),
        pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      },
    };
  });
