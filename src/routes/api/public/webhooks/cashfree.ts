import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

type CashfreeWebhook = {
  type: string;
  data?: {
    order?: { order_id?: string };
    payment?: { cf_payment_id?: string | number; payment_status?: string };
    refund?: {
      cf_payment_id?: string | number;
      refund_status?: string;
      cf_refund_id?: string;
    };
  };
};

function validCashfreeSignature(rawBody: string, timestamp: string, signature: string) {
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  if (!secret || !timestamp || !signature) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() - timestampNumber) > 5 * 60_000) {
    return false;
  }
  const expected = createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

/** Configure in Cashfree Developers → Webhooks with payment and refund events. */
export const Route = createFileRoute("/api/public/webhooks/cashfree")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.CASHFREE_SECRET_KEY) {
          return new Response("Cashfree secret not configured", { status: 503 });
        }
        const rawBody = await request.text();
        const timestamp = request.headers.get("x-webhook-timestamp") || "";
        const signature = request.headers.get("x-webhook-signature") || "";
        if (!validCashfreeSignature(rawBody, timestamp, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: CashfreeWebhook;
        try {
          event = JSON.parse(rawBody) as CashfreeWebhook;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const paymentId = event.data?.payment?.cf_payment_id;
        const refundPaymentId = event.data?.refund?.cf_payment_id;
        const eventId =
          request.headers.get("x-idempotency-key") ||
          `cashfree_${event.type}_${paymentId ?? refundPaymentId ?? event.data?.refund?.cf_refund_id ?? timestamp}`;

        try {
          const { data: existingEvent } = await supabaseAdmin
            .from("webhook_events")
            .select("event_id")
            .eq("event_id", eventId)
            .maybeSingle();
          if (existingEvent) return new Response("ok");

          if (
            event.type === "PAYMENT_SUCCESS_WEBHOOK" &&
            event.data?.payment?.payment_status === "SUCCESS"
          ) {
            const cashfreeOrderId = event.data.order?.order_id;
            if (!cashfreeOrderId) throw new Error("Cashfree webhook is missing order_id");
            const { completeCashfreePaymentInternal } = await import("@/lib/cashfree.server");
            await completeCashfreePaymentInternal(
              cashfreeOrderId,
              paymentId === undefined ? undefined : String(paymentId),
            );
          } else if (
            event.type.includes("REFUND") &&
            event.data?.refund?.refund_status === "SUCCESS" &&
            refundPaymentId !== undefined
          ) {
            const { error } = await supabaseAdmin
              .from("orders")
              .update({ status: "refunded" })
              .eq("cashfree_payment_id", String(refundPaymentId));
            if (error) throw error;
          }

          const { error: idempotencyError } = await supabaseAdmin
            .from("webhook_events")
            .insert({ event_id: eventId });
          if (idempotencyError && idempotencyError.code !== "23505") {
            throw idempotencyError;
          }
        } catch (error) {
          console.error("[cashfree webhook]", error);
          return new Response("Processing error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
