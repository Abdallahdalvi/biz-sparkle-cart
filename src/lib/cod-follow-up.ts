export function followUpAdvanceForPrice(pricePaise: number) {
  if (!Number.isSafeInteger(pricePaise) || pricePaise <= 0) return 0;
  return Math.min(
    pricePaise,
    pricePaise <= 600000
      ? 10000
      : pricePaise <= 1200000
        ? 20000
        : pricePaise <= 2500000
          ? 30000
          : 50000,
  );
}

export function isFollowUpCod(metadata: Record<string, unknown> | null | undefined) {
  return metadata?.cod_advance_collection === "after_confirmation";
}

export function outstandingCodAdvance(order: {
  notes?: string | null;
  cod_advance_paise: number;
  advance_paid_paise: number;
}) {
  return order.notes === "cod"
    ? Math.max(0, Number(order.cod_advance_paise) - Number(order.advance_paid_paise))
    : 0;
}

export function recordedFollowUpAdvance(
  order: {
    notes: string | null;
    status: string;
    shipping_address: Record<string, unknown> | null;
    cod_advance_paise: number;
    advance_paid_paise: number;
    total_paise: number;
    cashfree_order_id?: string | null;
    shiprocket_shipment_id?: string | null;
  },
  reference: string,
  adminId: string,
  recordedAt: string,
) {
  if (order.notes !== "cod" || !isFollowUpCod(order.shipping_address))
    throw new Error("This order does not use a follow-up COD advance.");
  if (
    !["processing", "paid"].includes(order.status) ||
    order.shiprocket_shipment_id ||
    order.cashfree_order_id
  )
    throw new Error("This order cannot accept a manual advance at this stage.");
  if (order.advance_paid_paise > 0)
    throw new Error("The advance has already been recorded. Refresh the order.");
  if (order.cod_advance_paise <= 0 || order.cod_advance_paise > order.total_paise)
    throw new Error("Invalid COD advance amount.");
  if (reference.trim().length < 3 || reference.trim().length > 100)
    throw new Error("Enter the payment reference (3–100 characters).");
  return {
    advance_paid_paise: order.cod_advance_paise,
    cod_collectable_paise: order.total_paise - order.cod_advance_paise,
    shipping_address: {
      ...order.shipping_address,
      cod_advance_receipt: {
        reference: reference.trim(),
        recorded_by: adminId,
        recorded_at: recordedAt,
        amount_paise: order.cod_advance_paise,
      },
    },
  };
}
