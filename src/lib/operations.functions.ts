import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  status: "read" | "unread";
}

type SettingsMetadata = Record<string, unknown>;

async function readSettingsMetadata(id: string): Promise<SettingsMetadata> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .select("metadata")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.metadata && typeof data.metadata === "object"
    ? (data.metadata as SettingsMetadata)
    : {};
}

async function writeSettingsMetadata(id: string, metadata: SettingsMetadata) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("store_settings").upsert({
    id,
    hero_1_image: "",
    hero_1_link: "",
    hero_1_label: "",
    hero_2_image: "",
    hero_2_link: "",
    hero_2_label: "",
    metadata,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

function asMessages(metadata: SettingsMetadata): ContactMessage[] {
  return Array.isArray(metadata.messages)
    ? metadata.messages.filter((message): message is ContactMessage =>
        Boolean(message && typeof message === "object" && "id" in message),
      )
    : [];
}

export const submitContactMessage = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(200),
        phone: z.string().trim().max(30).default(""),
        subject: z.string().trim().max(160).default(""),
        message: z.string().trim().min(10).max(3000),
        website: z.string().max(0).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const metadata = await readSettingsMetadata("contact_messages");
    const messages = asMessages(metadata);
    const recentDuplicate = messages.some(
      (message) =>
        message.email.toLowerCase() === data.email.toLowerCase() &&
        Date.now() - new Date(message.date).getTime() < 30_000,
    );
    if (recentDuplicate) throw new Error("Please wait before sending another message");

    const { randomUUID } = await import("crypto");
    const newMessage: ContactMessage = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject || "Website enquiry",
      message: data.message,
      date: new Date().toISOString(),
      status: "unread",
    };
    await writeSettingsMetadata("contact_messages", {
      messages: [newMessage, ...messages].slice(0, 1000),
    });
    return { ok: true, id: newMessage.id };
  });

const adminTokenSchema = z.object({ token: z.string().min(1) });

export const getContactMessages = createServerFn({ method: "POST" })
  .validator((input) => adminTokenSchema.parse(input))
  .handler(async ({ data }): Promise<ContactMessage[]> => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    return asMessages(await readSettingsMetadata("contact_messages"));
  });

export const updateContactMessageStatus = createServerFn({ method: "POST" })
  .validator((input) =>
    adminTokenSchema
      .extend({ id: z.string().uuid(), status: z.enum(["read", "unread"]) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const metadata = await readSettingsMetadata("contact_messages");
    const messages = asMessages(metadata).map((message) =>
      message.id === data.id ? { ...message, status: data.status } : message,
    );
    await writeSettingsMetadata("contact_messages", { messages });
    return { ok: true };
  });

export const deleteContactMessage = createServerFn({ method: "POST" })
  .validator((input) => adminTokenSchema.extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const metadata = await readSettingsMetadata("contact_messages");
    await writeSettingsMetadata("contact_messages", {
      messages: asMessages(metadata).filter((message) => message.id !== data.id),
    });
    return { ok: true };
  });

function asSellerNotes(metadata: SettingsMetadata): Record<string, string> {
  if (!metadata.notes || typeof metadata.notes !== "object") return {};
  return Object.fromEntries(
    Object.entries(metadata.notes as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([id, note]) => [id, note]),
  );
}

export const getSellerNotes = createServerFn({ method: "POST" })
  .validator((input) => adminTokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    return asSellerNotes(await readSettingsMetadata("seller_order_notes"));
  });

export const saveSellerNote = createServerFn({ method: "POST" })
  .validator((input) =>
    adminTokenSchema
      .extend({ orderId: z.string().uuid(), note: z.string().trim().max(3000) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSupabaseAuth } = await import("@/lib/auth.server");
    await requireSupabaseAuth(data.token, "admin");
    const metadata = await readSettingsMetadata("seller_order_notes");
    const notes = asSellerNotes(metadata);
    if (data.note) notes[data.orderId] = data.note;
    else delete notes[data.orderId];
    await writeSettingsMetadata("seller_order_notes", { notes });
    return { ok: true };
  });
