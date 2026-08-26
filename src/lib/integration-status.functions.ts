import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getIntegrationStatus = createServerFn({ method: "POST" })
  .validator((input) => z.object({ token: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    return {
      razorpay: {
        apiKeysConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        webhookSecretConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
      },
      shiprocket: {
        credentialsConfigured: Boolean(
          process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD,
        ),
        pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      },
    };
  });
