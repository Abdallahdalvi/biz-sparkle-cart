import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function onlinePaymentsConfigured() {
  return Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}

export const getCheckoutCapabilities = createServerFn({ method: "GET" }).handler(async () => ({
  onlinePaymentsConfigured: onlinePaymentsConfigured(),
  onlinePaymentProvider: onlinePaymentsConfigured() ? "cashfree" : null,
  onlinePaymentEnvironment:
    (process.env.CASHFREE_ENVIRONMENT || "sandbox").toLowerCase() === "production"
      ? "production"
      : "sandbox",
  codAvailable: true,
}));

/**
 * Secure server function to create an order.
 * Completely eliminates client-side trust for pricing, discounts, and COD calculations.
 */
export const createSecureOrder = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        token: z.string().optional(),
        items: z
          .array(
            z.object({
              slug: z.string().trim().min(1).max(160),
              variantId: z.string().uuid().optional(),
              qty: z.number().int().min(1).max(10),
            }),
          )
          .min(1)
          .max(20),
        shippingAddress: z.object({
          first_name: z.string().trim().min(1).max(80),
          last_name: z.string().trim().min(1).max(80),
          line1: z.string().trim().min(5).max(240),
          line2: z.string().trim().max(240).optional(),
          city: z.string().trim().min(2).max(100),
          state: z.string().trim().min(2).max(100),
          pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
          country: z.literal("IN").default("IN"),
          gstin: z
            .string()
            .trim()
            .refine(
              (value) => !value || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value),
              "Enter a valid GSTIN",
            )
            .optional(),
        }),
        payMode: z.enum(["prepaid", "cod"]),
        email: z.string().trim().email().max(254),
        phone: z
          .string()
          .trim()
          .regex(/^[0-9+\-\s]{10,18}$/, "Enter a valid phone number")
          .refine((value) => {
            const digits = value.replace(/\D/g, "");
            return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
          }, "Enter a valid 10-digit Indian phone number"),
        returnOrigin: z.string().url().max(200).optional(),
        marketingConsent: z.boolean().optional().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId: string | null = null;
    if (data.token) {
      const { data: userData } = await supabaseAdmin.auth.getUser(data.token);
      if (userData?.user) {
        userId = userData.user.id;
      }
    }

    const normalizedItems = new Map<string, (typeof data.items)[number]>();
    for (const item of data.items) {
      const key = `${item.slug}:${item.variantId ?? ""}`;
      const existing = normalizedItems.get(key);
      const qty = (existing?.qty ?? 0) + item.qty;
      if (qty > 10) throw new Error("A maximum of 10 units of one item can be ordered at once.");
      normalizedItems.set(key, { ...item, qty });
    }

    // Securely fetch prices and details for each item
    let subtotalPaise = 0;
    let codAdvancePaise = 0;
    const orderItemsToInsert: Array<{
      name: string;
      variant_label: string | null;
      unit_price_paise: number;
      cod_advance_paise: number;
      qty: number;
      image_url: string;
      product_id: string;
      variant_id: string | null;
    }> = [];

    for (const item of normalizedItems.values()) {
      const { data: prod, error: prodErr } = await supabaseAdmin
        .from("products")
        .select("id, name, price_paise, cod_advance_paise, metadata, stock, is_active")
        .eq("slug", item.slug)
        .single();
      if (prodErr || !prod) throw new Error(`Product not found: ${item.slug}`);
      if (!prod.is_active) throw new Error(`${prod.name} is no longer available.`);
      if (Number(prod.stock) < item.qty)
        throw new Error(`Only ${prod.stock} unit(s) of ${prod.name} are available.`);

      let unitPricePaise = prod.price_paise;
      let variantLabel: string | null = null;
      let variantIdUuid: string | null = null;

      if (item.variantId) {
        const { data: vData, error: vErr } = await supabaseAdmin
          .from("product_variants")
          .select("id, product_id, label, price_delta_paise, stock")
          .eq("id", item.variantId)
          .single();
        if (vErr || !vData || vData.product_id !== prod.id)
          throw new Error(`Invalid variant for ${prod.name}.`);
        if (Number(vData.stock) < item.qty)
          throw new Error(
            `Only ${vData.stock} unit(s) of ${prod.name} (${vData.label}) are available.`,
          );
        unitPricePaise += vData.price_delta_paise;
        variantLabel = vData.label;
        variantIdUuid = vData.id;
      }

      subtotalPaise += unitPricePaise * item.qty;
      const unitCodAdvancePaise = Math.min(
        unitPricePaise,
        Math.max(0, Number(prod.cod_advance_paise) || 0),
      );
      codAdvancePaise += unitCodAdvancePaise * item.qty;

      // Determine image url
      let imageUrl = "";
      if (prod.metadata?.images?.length > 0) {
        imageUrl = prod.metadata.images[0];
      }

      orderItemsToInsert.push({
        name: prod.name,
        variant_label: variantLabel,
        unit_price_paise: unitPricePaise,
        cod_advance_paise: unitCodAdvancePaise,
        qty: item.qty,
        image_url: imageUrl,
        product_id: prod.id,
        variant_id: variantIdUuid,
      });
    }

    // Securely calculate the prepaid discount. COD advances are configured per product above.
    const { data: settings } = await supabaseAdmin
      .from("store_settings")
      .select("metadata")
      .eq("id", "hero_banners")
      .single();

    const cmsMeta = settings?.metadata || {};
    const prepaidDiscountType = cmsMeta.prepaid_discount_type || "none";
    const prepaidDiscountAmount = cmsMeta.prepaid_discount_amount || 0;

    let prepaidDiscountPaise = 0;
    if (prepaidDiscountType === "flat") {
      prepaidDiscountPaise = prepaidDiscountAmount * 100;
    } else if (prepaidDiscountType === "percent") {
      prepaidDiscountPaise = Math.round((subtotalPaise * prepaidDiscountAmount) / 100);
    }

    const paymentReady = onlinePaymentsConfigured();
    if (data.payMode === "prepaid" && !paymentReady) {
      throw new Error(
        "Online payments are temporarily unavailable. Please choose Cash on Delivery.",
      );
    }
    if (data.payMode === "cod" && codAdvancePaise > 0 && !paymentReady) {
      throw new Error(
        "The COD advance cannot be collected because online payments are unavailable",
      );
    }

    const effectiveTotal =
      data.payMode === "prepaid"
        ? Math.max(0, subtotalPaise - prepaidDiscountPaise)
        : subtotalPaise;

    const paymentAmountPaise = data.payMode === "cod" ? codAdvancePaise : effectiveTotal;

    // Insert order securely
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        email: data.email,
        phone: data.phone,
        shipping_address: data.shippingAddress,
        subtotal_paise: subtotalPaise,
        shipping_paise: 0,
        total_paise: effectiveTotal,
        cod_advance_paise: data.payMode === "cod" ? codAdvancePaise : 0,
        advance_paid_paise: 0,
        cod_collectable_paise:
          data.payMode === "cod" ? Math.max(0, effectiveTotal - codAdvancePaise) : 0,
        status: paymentAmountPaise === 0 ? "processing" : "pending",
        notes: data.payMode,
      })
      .select("id, order_number")
      .single();
    if (orderErr || !order) throw new Error(`Order creation failed: ${orderErr?.message}`);

    // Insert order items
    const itemsWithOrderId = orderItemsToInsert.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      variant_id: i.variant_id,
      name: i.name,
      variant_label: i.variant_label,
      unit_price_paise: i.unit_price_paise,
      cod_advance_paise: i.cod_advance_paise,
      qty: i.qty,
      image_url: i.image_url,
    }));
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(itemsWithOrderId);
    if (itemsErr) throw new Error(`Order items creation failed: ${itemsErr.message}`);

    if (paymentAmountPaise === 0) {
      // No online amount is due. Reserve stock now; Shiprocket creation waits for courier choice.
      for (const item of orderItemsToInsert) {
        const { error: stockError } = await supabaseAdmin.rpc("decrement_stock", {
          p_product_id: item.product_id,
          p_variant_id: item.variant_id,
          p_qty: item.qty,
        });
        if (stockError) throw new Error(`Stock update failed: ${stockError.message}`);
      }
      const { error: reservationError } = await supabaseAdmin
        .from("orders")
        .update({ stock_decremented_at: new Date().toISOString() })
        .eq("id", order.id);
      if (reservationError) {
        throw new Error(`Stock reservation audit failed: ${reservationError.message}`);
      }

      void import("@/lib/order-notifications.server").then(({ notifyAdminAboutActionableOrder }) =>
        notifyAdminAboutActionableOrder(order.id),
      );
      void import("@/lib/meta-conversions.server").then(({ sendMetaPurchaseEvent }) =>
        sendMetaPurchaseEvent(order.id, data.marketingConsent),
      );

      return {
        ok: true,
        orderId: order.id,
        orderNumber: order.order_number,
        cashfreeRequired: false,
      };
    }

    let cashfree;
    try {
      const { createCashfreeOrderInternal } = await import("@/lib/cashfree.server");
      cashfree = await createCashfreeOrderInternal({
        storeOrderId: order.id,
        storeOrderNumber: order.order_number,
        amountPaise: paymentAmountPaise,
        customerName: `${data.shippingAddress.first_name} ${data.shippingAddress.last_name}`.trim(),
        customerEmail: data.email,
        customerPhone: data.phone,
        returnOrigin: data.returnOrigin,
        note:
          data.payMode === "cod"
            ? `COD advance for ${order.order_number}`
            : `Online payment for ${order.order_number}`,
        marketingConsent: data.marketingConsent,
      });
      const { error: linkError } = await supabaseAdmin
        .from("orders")
        .update({ cashfree_order_id: cashfree.cashfreeOrderId })
        .eq("id", order.id);
      if (linkError) throw linkError;
    } catch (error) {
      await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      throw error;
    }

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
      cashfreeRequired: true,
      cashfreeOrderId: cashfree.cashfreeOrderId,
      paymentSessionId: cashfree.paymentSessionId,
      cashfreeMode: cashfree.environment,
      amountPaise: paymentAmountPaise,
      currency: "INR",
      email: data.email,
    };
  });
