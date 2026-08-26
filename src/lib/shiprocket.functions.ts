import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PublicTrackingResult, ShiprocketCourierQuotes } from "@/lib/shiprocket.server";

interface ServiceabilityResult {
  status?: number;
  data?: {
    available_courier_companies?: Array<{
      courier_company_id?: number;
      courier_name?: string;
      rate?: number;
      etd?: string;
    }>;
  };
}

const packageSchema = z.object({
  weightKg: z.number().positive().max(50),
  lengthCm: z.number().positive().max(200),
  breadthCm: z.number().positive().max(200),
  heightCm: z.number().positive().max(200),
  pickupLocation: z.string().min(1).max(100).optional(),
  courierId: z.number().int().positive().optional(),
});

export const generateShiprocketAwb = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        token: z.string().min(1),
        orderId: z.string().uuid(),
        package: packageSchema.extend({ courierId: z.number().int().positive() }),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { generateShiprocketAwbInternal } = await import("@/lib/shiprocket.server");
    return generateShiprocketAwbInternal(data.orderId, data.package);
  });

export const getShiprocketPickupLocations = createServerFn({ method: "POST" })
  .validator((input) => z.object({ token: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { getShiprocketPickupLocationsInternal } = await import("@/lib/shiprocket.server");
    return getShiprocketPickupLocationsInternal();
  });

export const getShiprocketCourierOptions = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        token: z.string().min(1),
        orderId: z.string().uuid(),
        package: packageSchema.omit({ courierId: true }),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ShiprocketCourierQuotes> => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { getShiprocketCourierOptionsInternal } = await import("@/lib/shiprocket.server");
    return getShiprocketCourierOptionsInternal(data.orderId, data.package);
  });

const adminOrderActionSchema = z.object({
  token: z.string().min(1),
  orderId: z.string().uuid(),
});

export const generateShiprocketDocument = createServerFn({ method: "POST" })
  .validator((input) =>
    adminOrderActionSchema
      .extend({ type: z.enum(["label", "invoice", "manifest", "label-invoice"]) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { generateShiprocketDocumentInternal } = await import("@/lib/shiprocket.server");
    return generateShiprocketDocumentInternal(data.orderId, data.type);
  });

export const requestShiprocketPickup = createServerFn({ method: "POST" })
  .validator((input) => adminOrderActionSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { requestShiprocketPickupInternal } = await import("@/lib/shiprocket.server");
    return requestShiprocketPickupInternal(data.orderId);
  });

export const cancelShiprocketShipment = createServerFn({ method: "POST" })
  .validator((input) => adminOrderActionSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { cancelShiprocketShipmentInternal } = await import("@/lib/shiprocket.server");
    return cancelShiprocketShipmentInternal(data.orderId);
  });

export const trackPublicShipment = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        identifier: z
          .string()
          .trim()
          .min(4)
          .max(80)
          .regex(/^[A-Za-z0-9-]+$/, "Use a valid order number or AWB"),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<PublicTrackingResult> => {
    const { getPublicTrackingInternal } = await import("@/lib/shiprocket.server");
    return getPublicTrackingInternal(data.identifier);
  });

export const checkServiceability = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        pickupPincode: z.string().length(6),
        deliveryPincode: z.string().length(6),
        weightKg: z.number().positive().default(0.5),
        cod: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { checkShiprocketServiceabilityInternal } = await import("@/lib/shiprocket.server");
    const response = await checkShiprocketServiceabilityInternal(data);
    return JSON.parse(JSON.stringify(response)) as ServiceabilityResult;
  });

export type {
  PublicTrackingResult,
  PublicTrackingMilestone,
  ShiprocketCourierOption,
  ShiprocketCourierQuotes,
} from "@/lib/shiprocket.server";
