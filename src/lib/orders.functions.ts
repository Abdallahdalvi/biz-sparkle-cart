import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Secure server function to create an order.
 * Completely eliminates client-side trust for pricing, discounts, and COD calculations.
 */
export const createSecureOrder = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        token: z.string().optional(),
        items: z.array(
          z.object({
            slug: z.string(),
            variantId: z.string().optional(),
            qty: z.number().min(1),
          }),
        ),
        shippingAddress: z.object({
          first_name: z.string(),
          last_name: z.string(),
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          pincode: z.string(),
          country: z.string().default("IN"),
          gstin: z.string().optional(),
        }),
        payMode: z.enum(["prepaid", "cod"]),
        email: z.string().email(),
        phone: z.string(),
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

    // Securely fetch prices and details for each item
    let subtotalPaise = 0;
    const orderItemsToInsert: any[] = [];

    for (const item of data.items) {
      const { data: prod, error: prodErr } = await supabaseAdmin
        .from("products")
        .select("id, name, price_paise, metadata")
        .eq("slug", item.slug)
        .single();
      if (prodErr || !prod) throw new Error(`Product not found: ${item.slug}`);

      let unitPricePaise = prod.price_paise;
      let variantLabel: string | null = null;
      let variantIdUuid: string | null = null;

      if (item.variantId) {
        const { data: vData, error: vErr } = await supabaseAdmin
          .from("product_variants")
          .select("id, label, price_delta_paise")
          .eq("id", item.variantId)
          .single();
        if (!vErr && vData) {
          unitPricePaise += vData.price_delta_paise;
          variantLabel = vData.label;
          variantIdUuid = vData.id;
        }
      }

      subtotalPaise += unitPricePaise * item.qty;

      // Determine image url
      let imageUrl = "";
      if (prod.metadata?.images?.length > 0) {
        imageUrl = prod.metadata.images[0];
      }

      orderItemsToInsert.push({
        name: prod.name,
        variant_label: variantLabel,
        unit_price_paise: unitPricePaise,
        qty: item.qty,
        image_url: imageUrl,
        product_id: prod.id,
        variant_id: variantIdUuid,
      });
    }

    // Securely calculate discount / COD charges from store_settings
    const { data: settings } = await supabaseAdmin
      .from("store_settings")
      .select("metadata")
      .eq("id", "hero_banners")
      .single();

    const cmsMeta = settings?.metadata || {};
    const prepaidDiscountType = cmsMeta.prepaid_discount_type || "none";
    const prepaidDiscountAmount = cmsMeta.prepaid_discount_amount || 0;
    const codChargeType = cmsMeta.cod_charge_type || "none";
    const codChargeAmount = cmsMeta.cod_charge_amount || 0;

    let prepaidDiscountPaise = 0;
    if (prepaidDiscountType === "flat") {
      prepaidDiscountPaise = prepaidDiscountAmount * 100;
    } else if (prepaidDiscountType === "percent") {
      prepaidDiscountPaise = Math.round((subtotalPaise * prepaidDiscountAmount) / 100);
    }

    let codChargePaise = 0;
    if (codChargeType !== "none") {
      codChargePaise = codChargeAmount * 100;
    }

    const effectiveTotal =
      data.payMode === "prepaid"
        ? Math.max(0, subtotalPaise - prepaidDiscountPaise)
        : codChargeType === "additional"
          ? subtotalPaise + codChargePaise
          : subtotalPaise;

    const rzpAmountPaise = data.payMode === "cod" ? codChargePaise : effectiveTotal;

    // Insert order securely
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        email: data.email,
        phone: data.phone,
        shipping_address: data.shippingAddress,
        subtotal_paise: subtotalPaise,
        total_paise: rzpAmountPaise,
        status: rzpAmountPaise === 0 ? "processing" : "pending",
        notes: data.payMode,
      })
      .select("id, order_number")
      .single();
    if (orderErr || !order) throw new Error(`Order creation failed: ${orderErr?.message}`);

    // Insert order items
    const itemsWithOrderId = orderItemsToInsert.map((i) => ({
      order_id: order.id,
      name: i.name,
      variant_label: i.variant_label,
      unit_price_paise: i.unit_price_paise,
      qty: i.qty,
      image_url: i.image_url,
    }));
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(itemsWithOrderId);
    if (itemsErr) throw new Error(`Order items creation failed: ${itemsErr.message}`);

    if (rzpAmountPaise === 0) {
      // Free COD order -> invoke Shiprocket & decrement stock directly on server
      try {
        const { createShiprocketOrder } = await import("./shiprocket.functions");
        await createShiprocketOrder({ data: { orderId: order.id } });
      } catch (err) {
        console.error("[cod→shiprocket]", err);
      }

      // Decrement stock
      for (const item of orderItemsToInsert) {
        await supabaseAdmin.rpc("decrement_stock", {
          p_product_id: item.product_id,
          p_variant_id: item.variant_id,
          p_qty: item.qty,
        });
      }

      return {
        ok: true,
        orderId: order.id,
        orderNumber: order.order_number,
        rzpRequired: false,
      };
    }

    // Create Razorpay order
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.");
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: rzpAmountPaise,
        currency: "INR",
        receipt: order.order_number,
        notes: { internal_order_id: order.id },
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Razorpay order create failed: ${txt}`);
    }
    const rzp = (await res.json()) as { id: string };

    await supabaseAdmin.from("orders").update({ razorpay_order_id: rzp.id }).eq("id", order.id);

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
      rzpRequired: true,
      rzpOrderId: rzp.id,
      keyId,
      amountPaise: rzpAmountPaise,
      currency: "INR",
      email: data.email,
    };
  });
