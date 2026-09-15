import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const adminOrderActionSchema = z.object({
  token: z.string().min(1),
  orderId: z.string().uuid(),
  reason: z.string().trim().min(3).max(100),
});

const adminTokenSchema = z.object({ token: z.string().min(1) });

export const cancelAdminOrder = createServerFn({ method: "POST" })
  .validator((input) => adminOrderActionSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { cancelAdminOrderInternal } = await import("@/lib/order-admin.server");
    return cancelAdminOrderInternal(data.orderId, data.reason);
  });

export const refundAdminOrder = createServerFn({ method: "POST" })
  .validator((input) => adminOrderActionSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { refundAdminOrderInternal } = await import("@/lib/order-admin.server");
    return refundAdminOrderInternal(data.orderId, data.reason);
  });

export const updateAdminOrderStatus = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        token: z.string().min(1),
        orderId: z.string().uuid(),
        status: z.enum(["pending", "paid", "processing", "packed", "shipped", "delivered"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { updateAdminOrderStatusInternal } = await import("@/lib/order-admin.server");
    return updateAdminOrderStatusInternal(data.orderId, data.status);
  });

export const getArchivedAdminOrders = createServerFn({ method: "POST" })
  .validator((input) => adminTokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { getArchivedAdminOrderIdsInternal } = await import("@/lib/order-admin.server");
    return getArchivedAdminOrderIdsInternal();
  });

export const setAdminOrderArchived = createServerFn({ method: "POST" })
  .validator((input) =>
    adminTokenSchema.extend({ orderId: z.string().uuid(), archived: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { setAdminOrderArchivedInternal } = await import("@/lib/order-admin.server");
    return setAdminOrderArchivedInternal(data.orderId, data.archived);
  });

export const deleteAdminOrder = createServerFn({ method: "POST" })
  .validator((input) => adminTokenSchema.extend({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { deleteAdminOrderInternal } = await import("@/lib/order-admin.server");
    return deleteAdminOrderInternal(data.orderId);
  });
