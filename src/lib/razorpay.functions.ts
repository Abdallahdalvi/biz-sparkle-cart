import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Verify a Razorpay Checkout success signature and mark the order as paid.
 * Called from the client immediately after Razorpay's handler fires —
 * server-side HMAC verification is the source of truth.
 */
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        orderId: z.string().uuid(),
        razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
        razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
        razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyRazorpayCheckoutPaymentInternal } = await import("@/lib/razorpay.server");
    return verifyRazorpayCheckoutPaymentInternal({
      orderId: data.orderId,
      razorpayOrderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
      signature: data.razorpay_signature,
    });
  });
