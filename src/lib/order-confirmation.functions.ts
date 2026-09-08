import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getOrderConfirmation = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        orderId: z.string().uuid(),
        authToken: z.string().optional(),
        receiptToken: z.string().min(20).max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { getOrderConfirmationInternal } = await import("@/lib/order-confirmation.server");
    return getOrderConfirmationInternal(data);
  });
