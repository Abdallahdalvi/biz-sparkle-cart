import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Confirm Cashfree payment status from Cashfree's server before fulfilment. */
export const verifyCashfreePayment = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        orderId: z.string().uuid(),
        cashfreeOrderId: z.string().regex(/^agh_[a-f0-9]{32}$/i),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyCashfreeCheckoutPaymentInternal } = await import("@/lib/cashfree.server");
    return verifyCashfreeCheckoutPaymentInternal(data);
  });
