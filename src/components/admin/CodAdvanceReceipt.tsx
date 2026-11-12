import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { recordAdminCodAdvance } from "@/lib/order-admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { outstandingCodAdvance, isFollowUpCod } from "@/lib/cod-follow-up";
import { toast } from "sonner";

export function CodAdvanceReceipt({
  order,
  onSaved,
}: {
  order: {
    id: string;
    notes?: string | null;
    status: string;
    shipping_address?: Record<string, unknown> | null;
    cod_advance_paise: number;
    advance_paid_paise: number;
    cashfree_order_id?: string | null;
    shiprocket_shipment_id?: string | null;
  };
  onSaved: () => Promise<void>;
}) {
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const record = useServerFn(recordAdminCodAdvance);
  const remaining = outstandingCodAdvance(order);
  if (
    !remaining ||
    !isFollowUpCod(order.shipping_address) ||
    !["processing", "paid"].includes(order.status) ||
    order.shiprocket_shipment_id ||
    order.cashfree_order_id
  )
    return null;
  return (
    <section className="space-y-3 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <h3 className="font-bold">
        Contact customer within 1 hour · {formatINR(remaining)} advance due
      </h3>
      <p>
        After verifying the customer’s payment, record the reference below. This deducts the advance
        from the courier balance.
      </p>
      <label className="block text-xs font-bold">
        Payment reference
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          minLength={3}
          maxLength={100}
          placeholder="UPI / bank transaction reference"
          className="mt-1 w-full rounded border border-amber-300 bg-white px-3 py-2 font-normal"
        />
      </label>
      <button
        type="button"
        disabled={busy || reference.trim().length < 3}
        className="rounded bg-primary px-4 py-3 text-xs font-bold text-on-primary disabled:opacity-40"
        onClick={async () => {
          setBusy(true);
          try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            if (!token) throw new Error("Sign in as admin to record the advance.");
            await record({ data: { token, orderId: order.id, reference: reference.trim() } });
            toast.success("Advance recorded. Courier balance updated.");
            await onSaved();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not record advance");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saving…" : `Record ${formatINR(remaining)} received`}
      </button>
    </section>
  );
}
