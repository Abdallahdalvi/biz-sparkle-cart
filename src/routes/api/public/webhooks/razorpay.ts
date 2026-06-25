import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Razorpay webhook receiver. Configure in Razorpay dashboard →
 * Settings → Webhooks: POST to https://<your-domain>/api/public/webhooks/razorpay
 * with secret = RAZORPAY_WEBHOOK_SECRET. Events: payment.captured, payment.failed,
 * order.paid, refund.processed.
 */
export const Route = createFileRoute("/api/public/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Webhook secret not configured", { status: 503 });
        }
        const sig = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sigBuf = Buffer.from(sig);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(body) as {
          event: string;
          payload: {
            payment?: { entity: { order_id: string; id: string; status: string } };
            order?: { entity: { id: string; notes?: Record<string, string> } };
            refund?: { entity: { payment_id: string; status: string } };
          };
        };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          if (event.event === "payment.captured" || event.event === "order.paid") {
            const rzpOrderId =
              event.payload.payment?.entity.order_id ?? event.payload.order?.entity.id;
            const paymentId = event.payload.payment?.entity.id;
            if (rzpOrderId) {
              const { data: o } = await supabaseAdmin
                .from("orders")
                .update({ status: "paid", razorpay_payment_id: paymentId ?? null })
                .eq("razorpay_order_id", rzpOrderId)
                .select("id")
                .single();
              if (o?.id) {
                const { createShiprocketOrder } = await import("@/lib/shiprocket.functions");
                createShiprocketOrder({ data: { orderId: o.id } }).catch((e) =>
                  console.error("[webhook→shiprocket]", e),
                );
              }
            }
          } else if (event.event === "payment.failed") {
            const rzpOrderId = event.payload.payment?.entity.order_id;
            if (rzpOrderId) {
              await supabaseAdmin
                .from("orders")
                .update({ status: "cancelled" })
                .eq("razorpay_order_id", rzpOrderId);
            }
          } else if (event.event === "refund.processed") {
            const paymentId = event.payload.refund?.entity.payment_id;
            if (paymentId) {
              await supabaseAdmin
                .from("orders")
                .update({ status: "refunded" })
                .eq("razorpay_payment_id", paymentId);
            }
          }
        } catch (err) {
          console.error("[razorpay webhook]", err);
          return new Response("Processing error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
