import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeCouponCode, validateCoupon } from "@/lib/coupons";

const codeSchema = z
  .string()
  .trim()
  .min(4)
  .max(40)
  .regex(/^[a-zA-Z0-9-]+$/, "Use letters, numbers and hyphens only.")
  .transform(normalizeCouponCode);
export const previewCoupon = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        code: codeSchema,
        email: z.string().trim().email(),
        payMode: z.enum(["prepaid", "cod"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { readCoupon } = await import("@/lib/coupons.server");
    const { coupon } = await readCoupon(data.code);
    validateCoupon(coupon, data.email, data.payMode);
    if (coupon.orderId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .select("status,email")
        .eq("id", coupon.orderId)
        .single();
      if (
        error ||
        order.status !== "pending" ||
        order.email.toLowerCase() !== data.email.toLowerCase()
      )
        throw new Error("This single-use coupon has already been used.");
    }
    return { code: coupon.code, amountPaise: coupon.amountPaise };
  });

export const getAdminCoupons = createServerFn({ method: "POST" })
  .validator((input) => z.object({ token: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { listCoupons } = await import("@/lib/coupons.server");
    return listCoupons();
  });

export const createAdminCoupon = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        token: z.string().min(1),
        code: codeSchema,
        amountPaise: z.number().int().min(100).max(100_000_00),
        email: z
          .union([z.string().trim().email(), z.literal("")])
          .transform((value) => value.toLowerCase()),
        reason: z.string().trim().max(500),
        expiresAt: z.string().datetime().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    if (data.expiresAt && Date.parse(data.expiresAt) <= Date.now())
      throw new Error("Expiry must be in the future.");
    const { saveNewCoupon } = await import("@/lib/coupons.server");
    await saveNewCoupon({
      code: data.code,
      amountPaise: data.amountPaise,
      email: data.email,
      reason: data.reason,
      expiresAt: data.expiresAt,
      createdAt: new Date().toISOString(),
      disabled: false,
      orderId: null,
      checkoutSignature: null,
      checkoutReady: false,
    });
    return { ok: true };
  });

export const disableAdminCoupon = createServerFn({ method: "POST" })
  .validator((input) => z.object({ token: z.string().min(1), code: codeSchema }).parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { readCoupon, changeCoupon } = await import("@/lib/coupons.server");
    const record = await readCoupon(data.code);
    if (record.coupon.orderId)
      throw new Error("A claimed coupon cannot be changed or reused. Issue a new code if needed.");
    await changeCoupon(record, { ...record.coupon, disabled: true });
    return { ok: true };
  });
