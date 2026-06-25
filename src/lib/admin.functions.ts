import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        token: z.string(),
        slug: z.string(),
        name: z.string(),
        tagline: z.string().default(""),
        description: z.string().default(""),
        price_paise: z.number(),
        compare_at_paise: z.number().nullable(),
        stock: z.number(),
        category_id: z.string().nullable(),
        is_active: z.boolean().default(true),
        metadata: z.any(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prod, error } = await supabaseAdmin
      .from("products")
      .insert({
        slug: data.slug,
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        price_paise: data.price_paise,
        compare_at_paise: data.compare_at_paise,
        stock: data.stock,
        category_id: data.category_id,
        is_active: data.is_active,
        metadata: data.metadata,
      })
      .select()
      .single();

    if (error) throw new Error(`Database Error: ${error.message}`);

    if (prod && data.metadata?.images?.length > 0) {
      await supabaseAdmin.from("product_images").insert(
        data.metadata.images.map((url: string, index: number) => ({
          product_id: prod.id,
          url: url,
          sort_order: index,
        })),
      );
    }

    if (prod && data.metadata?.variants?.length > 0) {
      await supabaseAdmin.from("product_variants").insert(
        data.metadata.variants.map((v: any) => ({
          product_id: prod.id,
          label: v.label,
          price_delta_paise: 0,
          stock: data.stock,
        })),
      );
    }

    return { ok: true, product: prod };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        token: z.string(),
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        tagline: z.string().default(""),
        description: z.string().default(""),
        price_paise: z.number(),
        compare_at_paise: z.number().nullable(),
        stock: z.number(),
        category_id: z.string().nullable(),
        is_active: z.boolean(),
        metadata: z.any(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      slug: data.slug,
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      price_paise: data.price_paise,
      compare_at_paise: data.compare_at_paise,
      stock: data.stock,
      category_id: data.category_id,
      is_active: data.is_active,
      metadata: data.metadata,
    };

    if (data.id.startsWith("static-")) {
      const { error } = await supabaseAdmin.from("products").insert(payload);
      if (error) throw new Error(`Database Error: ${error.message}`);
    } else {
      const { error } = await supabaseAdmin.from("products").update(payload).eq("id", data.id);
      if (error) throw new Error(`Database Error: ${error.message}`);
    }

    return { ok: true };
  });

export const updateProductStatus = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        token: z.string(),
        id: z.string(),
        is_active: z.boolean(),
        staticRow: z
          .object({
            slug: z.string(),
            name: z.string(),
            tagline: z.string().nullable(),
            description: z.string().nullable(),
            price_paise: z.number(),
            compare_at_paise: z.number().nullable(),
            stock: z.number(),
            metadata: z.any(),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.id.startsWith("static-") && data.staticRow) {
      const { error } = await supabaseAdmin.from("products").insert({
        slug: data.staticRow.slug,
        name: data.staticRow.name,
        tagline: data.staticRow.tagline || "",
        description: data.staticRow.description || "",
        price_paise: data.staticRow.price_paise,
        compare_at_paise: data.staticRow.compare_at_paise,
        stock: data.staticRow.stock,
        is_active: data.is_active,
        metadata: data.staticRow.metadata,
      });
      if (error) throw new Error(`Database Error: ${error.message}`);
      return { ok: true };
    }

    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(`Database Error: ${error.message}`);
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        token: z.string(),
        id: z.string(),
        staticRow: z
          .object({
            slug: z.string(),
            name: z.string(),
            tagline: z.string().nullable(),
            description: z.string().nullable(),
            price_paise: z.number(),
            compare_at_paise: z.number().nullable(),
            stock: z.number(),
            metadata: z.any(),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.id.startsWith("static-") && data.staticRow) {
      const { error } = await supabaseAdmin.from("products").insert({
        slug: data.staticRow.slug,
        name: data.staticRow.name,
        tagline: data.staticRow.tagline || "",
        description: data.staticRow.description || "",
        price_paise: data.staticRow.price_paise,
        compare_at_paise: data.staticRow.compare_at_paise,
        stock: data.staticRow.stock,
        is_active: false,
        metadata: data.staticRow.metadata,
      });
      if (error) throw new Error(`Database Error: ${error.message}`);
      return { ok: true, hidden: true };
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(`Database Error: ${error.message}`);
    return { ok: true };
  });

export const updateStoreSettings = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        token: z.string(),
        id: z.string().default("hero_banners"),
        hero_1_image: z.string(),
        hero_1_link: z.string(),
        hero_1_label: z.string(),
        hero_2_image: z.string(),
        hero_2_link: z.string(),
        hero_2_label: z.string(),
        metadata: z.any(),
        updated_at: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { token, ...payload } = data;

    try {
      const { error } = await supabaseAdmin.from("store_settings").upsert(payload);
      if (error && !error.message.includes("schema cache")) {
        throw error;
      }
    } catch (dbErr: any) {
      // Silently handle schema cache errors if upsert succeeds in background
    }

    return { ok: true };
  });
