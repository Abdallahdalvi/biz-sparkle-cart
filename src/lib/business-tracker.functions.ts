import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEFAULT_BUSINESS_TRACKER_STATE, type BusinessTrackerState } from "@/lib/business-tracker";

const TRACKER_ROW_ID = "business_operations_v1";

const taskSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(180),
  category: z.enum(["Formation", "MCA", "Income tax", "GST & TDS", "State & workforce", "Books"]),
  applicability: z.enum(["core", "conditional", "operational"]),
  cadence: z.string().max(240),
  dueDate: z.string().max(10),
  status: z.enum(["not_started", "in_progress", "ready_to_file", "filed", "not_applicable"]),
  details: z.string().max(800),
  notes: z.string().max(1000),
  sourceLabel: z.string().max(120),
  sourceUrl: z.string().max(500),
});

const moneySchema = z.number().finite().min(0).max(1_000_000_000);
const optionalMoneySchema = moneySchema.nullable();

const phoneSchema = z.object({
  id: z.string().min(1).max(100),
  sku: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(160),
  color: z.string().trim().max(80),
  grade: z.string().trim().max(80),
  supplier: z.string().trim().max(160),
  buyCost: moneySchema,
  buyCharges: moneySchema,
  customer: z.string().trim().max(160),
  sellPrice: optionalMoneySchema,
  sellCharges: optionalMoneySchema,
  status: z.enum(["In Stock", "Reserved", "Sold", "Returned", "Unassigned"]),
  marketplace: z.string().trim().max(120),
  paymentStatus: z.enum(["", "Pending", "Paid", "Refunded"]),
  purchaseDate: z.string().max(10),
  soldDate: z.string().max(10),
});

const expenseSchema = z.object({
  id: z.string().min(1).max(100),
  date: z.string().max(10),
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(240),
  amount: moneySchema,
});

const spendSchema = z.object({
  id: z.string().min(1).max(100),
  description: z.string().trim().min(1).max(240),
  amount: moneySchema,
});

const supplierSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(30),
  email: z.union([z.string().trim().email().max(200), z.literal("")]),
  address: z.string().trim().max(500),
  notes: z.string().trim().max(1000),
});

const customerSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(30),
  city: z.string().trim().max(120),
  pendingAmount: moneySchema,
  notes: z.string().trim().max(1000),
});

const booksSchema = z
  .object({
    sourceName: z.string().max(160),
    importedAt: z.string().max(10),
    phones: z.array(phoneSchema).max(1000),
    expenses: z.array(expenseSchema).max(2000),
    businessSpend: z.array(spendSchema).max(1000),
    suppliers: z.array(supplierSchema).max(1000),
    customers: z.array(customerSchema).max(2000),
  })
  .superRefine((books, context) => {
    const seen = new Set<string>();
    books.phones.forEach((phone, index) => {
      const sku = phone.sku.trim().toLowerCase();
      if (seen.has(sku)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate SKU: ${phone.sku}`,
          path: ["phones", index, "sku"],
        });
      }
      seen.add(sku);
    });
  });

const stateSchema = z.object({
  version: z.literal(1),
  profile: z.object({
    fiscalYear: z.string().min(4).max(12),
    llpIncorporated: z.boolean(),
    llpAgreementFiled: z.boolean(),
    panObtained: z.boolean(),
    tanObtained: z.boolean(),
    gstRegistered: z.boolean(),
    bankAccountOpened: z.boolean(),
    professionalTaxReviewed: z.boolean(),
    shopsActReviewed: z.boolean(),
  }),
  tasks: z.array(taskSchema).min(1).max(50),
  books: booksSchema,
  updatedAt: z.string().nullable(),
});

const storedStateSchema = stateSchema.extend({ books: booksSchema.optional() });

function cloneDefaults(): BusinessTrackerState {
  return JSON.parse(JSON.stringify(DEFAULT_BUSINESS_TRACKER_STATE)) as BusinessTrackerState;
}

export const getBusinessTracker = createServerFn({ method: "POST" })
  .validator((input) => z.object({ token: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<{ state: BusinessTrackerState }> => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createSeedBooks, decryptTrackerState, isEncryptedEnvelope } =
      await import("@/lib/business-tracker.server");
    const { data: row, error } = await supabaseAdmin
      .from("store_settings")
      .select("metadata")
      .eq("id", TRACKER_ROW_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);

    let state = { ...cloneDefaults(), books: createSeedBooks() };
    const envelope =
      row?.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>).encrypted_payload
        : null;
    if (isEncryptedEnvelope(envelope)) {
      try {
        const stored = storedStateSchema.parse(await decryptTrackerState(envelope));
        state = {
          ...stored,
          books: stored.books ?? createSeedBooks(),
        };
      } catch (error) {
        console.error("Unable to decrypt business tracker state", error);
        throw new Error(
          "The private compliance tracker could not be decrypted. Check BUSINESS_TRACKER_ENCRYPTION_KEY before saving new data.",
        );
      }
    }

    return { state };
  });

export const saveBusinessTracker = createServerFn({ method: "POST" })
  .validator((input) => z.object({ token: z.string().min(1), state: stateSchema }).parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { encryptTrackerState } = await import("@/lib/business-tracker.server");
    const state: BusinessTrackerState = {
      ...data.state,
      updatedAt: new Date().toISOString(),
    };
    const encryptedPayload = await encryptTrackerState(state);
    const { error } = await supabaseAdmin.from("store_settings").upsert({
      id: TRACKER_ROW_ID,
      hero_1_image: "",
      hero_1_link: "",
      hero_1_label: "",
      hero_2_image: "",
      hero_2_link: "",
      hero_2_label: "",
      metadata: { encrypted_payload: encryptedPayload },
      updated_at: state.updatedAt,
    });
    if (error) throw new Error(error.message);
    return { ok: true, updatedAt: state.updatedAt };
  });
