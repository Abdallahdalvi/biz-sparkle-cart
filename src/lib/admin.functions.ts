import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

type VariantInput = { label: string };

async function syncProductVariants(
  supabaseAdmin: SupabaseClient,
  productId: string,
  variants: VariantInput[] | undefined,
  stock: number,
) {
  const desired = (variants || []).filter((variant) => variant.label.trim());
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  if (existingError) throw new Error(`Could not load product variants: ${existingError.message}`);

  const sharedCount = Math.min(existing.length, desired.length);
  await Promise.all(
    desired
      .slice(0, sharedCount)
      .map((variant, index) =>
        supabaseAdmin
          .from("product_variants")
          .update({ label: variant.label.trim(), stock })
          .eq("id", existing[index].id),
      ),
  );

  const removedIds = existing.slice(sharedCount).map((variant) => variant.id);
  if (removedIds.length) {
    const { error } = await supabaseAdmin.from("product_variants").delete().in("id", removedIds);
    if (error) throw new Error(`Could not remove unused product variants: ${error.message}`);
  }

  const newVariants = desired.slice(sharedCount);
  if (newVariants.length) {
    const { error } = await supabaseAdmin.from("product_variants").insert(
      newVariants.map((variant) => ({
        product_id: productId,
        label: variant.label.trim(),
        price_delta_paise: 0,
        stock,
      })),
    );
    if (error) throw new Error(`Could not add product variants: ${error.message}`);
  }
}

export const createProduct = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        token: z.string(),
        slug: z.string(),
        name: z.string(),
        tagline: z.string().default(""),
        description: z.string().default(""),
        price_paise: z.number(),
        cod_advance_paise: z.number().int().min(0),
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
    if (data.cod_advance_paise > data.price_paise) {
      throw new Error("COD advance cannot exceed the product selling price");
    }
    if (data.cod_advance_paise > 0 && data.cod_advance_paise < 100) {
      throw new Error("COD advance must be at least ₹1 or exactly ₹0 for full COD");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prod, error } = await supabaseAdmin
      .from("products")
      .insert({
        slug: data.slug,
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        price_paise: data.price_paise,
        cod_advance_paise: data.cod_advance_paise,
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

    if (prod)
      await syncProductVariants(supabaseAdmin, prod.id, data.metadata?.variants, data.stock);

    return { ok: true, product: prod };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        token: z.string(),
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        tagline: z.string().default(""),
        description: z.string().default(""),
        price_paise: z.number(),
        cod_advance_paise: z.number().int().min(0),
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
    if (data.cod_advance_paise > data.price_paise) {
      throw new Error("COD advance cannot exceed the product selling price");
    }
    if (data.cod_advance_paise > 0 && data.cod_advance_paise < 100) {
      throw new Error("COD advance must be at least ₹1 or exactly ₹0 for full COD");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      slug: data.slug,
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      price_paise: data.price_paise,
      cod_advance_paise: data.cod_advance_paise,
      compare_at_paise: data.compare_at_paise,
      stock: data.stock,
      category_id: data.category_id,
      is_active: data.is_active,
      metadata: data.metadata,
    };

    let productId = data.id;
    if (data.id.startsWith("static-")) {
      const { data: insertedProduct, error } = await supabaseAdmin
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(`Database Error: ${error.message}`);
      productId = insertedProduct.id;
    } else {
      const { error } = await supabaseAdmin.from("products").update(payload).eq("id", data.id);
      if (error) throw new Error(`Database Error: ${error.message}`);
    }

    await syncProductVariants(supabaseAdmin, productId, data.metadata?.variants, data.stock);

    return { ok: true };
  });

export const updateProductStatus = createServerFn({ method: "POST" })
  .validator((input) =>
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
  .validator((input) =>
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
  .validator((input) =>
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

    const { error } = await supabaseAdmin.from("store_settings").upsert(payload);
    if (error) throw new Error(`Store settings update failed: ${error.message}`);

    return { ok: true };
  });

export const updateProductOrder = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        token: z.string(),
        slugs: z.array(z.string().min(1)).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: settings, error: readError } = await supabaseAdmin
      .from("store_settings")
      .select("metadata")
      .eq("id", "hero_banners")
      .single();

    if (readError || !settings) {
      throw new Error(`Could not load storefront settings: ${readError?.message || "not found"}`);
    }

    const metadata =
      settings.metadata && typeof settings.metadata === "object" ? settings.metadata : {};
    const { error } = await supabaseAdmin
      .from("store_settings")
      .update({
        metadata: { ...metadata, product_order: data.slugs },
        updated_at: new Date().toISOString(),
      })
      .eq("id", "hero_banners");

    if (error) throw new Error(`Product order update failed: ${error.message}`);
    return { ok: true };
  });
